import type { ChatMessage } from "../../../types/chat";
import type { FileItem } from "../../../types/file";
import type { LevelProgressSnapshot } from "../../../types/validationReview";
import type {
  InstructionGuide,
  InstructionGuideState,
  TutorSupportContext,
} from "../../../types/tutor";
import { buildConversationContext } from "../context/contextBuilder";
import { packTutorContext } from "../context/contextPacker";
import { analyzeProject } from "../context/projectAnalyzer";
import { getTutorApiKey } from "../../../hooks/useTutorApiSettings";
import { logTutorEvent } from "../conversation/tutorDebugLogger";
import {
  openAiTutorProvider,
  type TutorEditClarificationNeedProvider,
} from "../provider/openAiProvider";
import type { TutorChatMessage } from "../types";

export interface EditClarificationClassifierContext {
  supportContext?: TutorSupportContext;
  conversation?: ChatMessage[];
  files?: FileItem[];
  levelInstructionsMarkdown?: string;
  levelProgress?: LevelProgressSnapshot;
  guide?: InstructionGuide;
  guideState?: InstructionGuideState;
}

export interface EditClarificationNeedResult {
  shouldClarify: boolean;
  source: "model" | "deterministic";
  reason?: string;
}

/** Teacher/system build instructions — not a student underspecification judgment. */
export const CONCRETE_BUILD_REQUEST_PATTERN =
  /\b(build the project described in|update the plan status|check off the completed items|ready to build the project from this plan)\b/i;

const CLASSIFIER_CONTEXT_BUDGET_CHARS = 6000;

const EDIT_CLARIFICATION_NEED_SYSTEM_PROMPT = `You decide whether Web Lab Tutor should pause before editing a student's HTML/CSS/JS project and show a direction picker (2–3 options) instead of generating code immediately.

Default to shouldClarify FALSE. Clarification is the exception — use it only when the student is starting a broad, greenfield feature and several genuinely different implementations would all be reasonable.

Judge underspecification in context — not keywords. Use conversation history and projectSummary to tell greenfield starts apart from incremental edits on work already in the project.

Prefer shouldClarify TRUE only when:
- The student is starting a new feature area with no established pattern in the project yet (e.g. first navbar, first card section, first footer) AND layout, structure, styling approach, content, or behavior are still wide open.
- The student asks for subjective polish without naming a concrete target or CSS/HTML property — e.g. "better", "more exciting", "refine the buttons", "less ugly", "make it pop", "make the cards better" when "better" could mean many unrelated changes.
- Recent conversation shows Tutor just added something and the student wants vague improvement, not a named structural or stylistic change.

Prefer shouldClarify FALSE when:
- The student is iterating on elements that already exist in the project: duplicating/extending them ("add 2 more cards", "another card like this"), changing their layout ("horizontal", "vertical", "in a row", "side by side", "stack them"), spacing, alignment, or count.
- The student named concrete properties: specific colors, counts with placement/content (e.g. "3 cards with images below the nav"), link labels, selectors, hover/focus behavior, file targets, or layout structure/direction.
- The message is a teacher/system build-from-plan instruction (build the project described in Plans/PROJECT_PLAN.md, update plan status, check off completed items).
- The level is linear / prescribed and a reasonable default implementation matches the step (e.g. "add a footer with my name" on a footer step).
- The student already chose a direction in this conversation and is giving the next incremental instruction.
- A direct edit with sensible defaults is clearly what the level expects — especially when projectSummary shows matching HTML/CSS already in place.

Examples (shouldClarify):
- TRUE: "I want to add a navbar", "make it less ugly", "add cards" (no cards in project yet), "make the cards better", "make all of the buttons more exciting", "Let's refine the buttons"
- FALSE: "make all buttons blue", "Improve the nav link hover styles", "add 3 cards with images below the nav", "add a footer with my name and the year", "let's add 2 more cards" (cards already exist), "Make the cards horizontal", "duplicate the existing card", "put them in a row"

Return JSON only:
{
  "shouldClarify": true|false,
  "confidence": "high|low",
  "reason": "short phrase"
}

Use confidence "high" when you are sure. When genuinely uncertain, set shouldClarify false with confidence "low" (fail-open to a direct edit).`;

function tutorApiKeyAvailable() {
  try {
    return Boolean(getTutorApiKey().trim());
  } catch {
    return false;
  }
}

function summarizeInstructionGuide(
  guide: InstructionGuide | undefined,
  guideState: InstructionGuideState | undefined,
) {
  if (!guide) return undefined;

  if (guide.type === "choice-based") {
    const activeOptionId = guideState?.activeOptionId ?? null;
    const activeOption = guide.options.find((option) => option.id === activeOptionId);
    return {
      type: guide.type,
      goal: guide.goal,
      activeFocus: activeOption
        ? { id: activeOption.id, label: activeOption.label, prompt: activeOption.prompt }
        : null,
      focusAreas: guide.options.map((option) => ({
        id: option.id,
        label: option.label,
        editOriented: option.editOriented ?? true,
      })),
    };
  }

  const currentStep = guideState?.activeStepId
    ? guide.steps.find((step) => step.id === guideState.activeStepId)
    : guide.steps[0];
  return {
    type: guide.type,
    overview: guide.overview,
    currentStep: currentStep
      ? { id: currentStep.id, title: currentStep.title, prompt: currentStep.prompt }
      : null,
  };
}

function buildProjectSummary(files: FileItem[] | undefined, message: string) {
  if (!files?.length) return undefined;
  const analysis = analyzeProject(files);
  const packed = packTutorContext(analysis, message, CLASSIFIER_CONTEXT_BUDGET_CHARS);
  return {
    manifest: packed.manifest,
    html: packed.projectMap.html,
    cssSelectors: packed.projectMap.css
      ?.flatMap((file) => file.selectors)
      .slice(0, 24),
  };
}

export function buildEditClarificationNeedMessages(
  message: string,
  context: EditClarificationClassifierContext = {},
): TutorChatMessage[] {
  const payload = {
    studentMessage: message.trim(),
    tutorSupportContext: context.supportContext ?? "standalone-project",
    levelInstructionsMarkdown: context.levelInstructionsMarkdown?.trim() || undefined,
    levelProgress: context.levelProgress,
    instructionGuide: summarizeInstructionGuide(context.guide, context.guideState),
    conversation: context.conversation?.length
      ? buildConversationContext(context.conversation)
      : undefined,
    projectSummary: buildProjectSummary(context.files, message),
  };

  return [
    { role: "system", content: EDIT_CLARIFICATION_NEED_SYSTEM_PROMPT },
    { role: "user", content: JSON.stringify(payload) },
  ];
}

/** Workflow/system guards that are not semantic underspecification judgments. */
export function hasHardSkipEditClarification(
  message: string,
  options: { skipEditClarification?: boolean } = {},
) {
  if (options.skipEditClarification) return true;
  if (CONCRETE_BUILD_REQUEST_PATTERN.test(message)) return true;
  return false;
}

/** Fail-open when clarification cannot run (no key, model error, bad output). */
export function failOpenEditClarificationNeed(): EditClarificationNeedResult {
  return { shouldClarify: false, source: "deterministic" };
}

export async function classifyEditClarificationNeedWithModel({
  message,
  context = {},
  provider = openAiTutorProvider,
}: {
  message: string;
  context?: EditClarificationClassifierContext;
  provider?: TutorEditClarificationNeedProvider;
}): Promise<EditClarificationNeedResult> {
  if (provider === openAiTutorProvider && !tutorApiKeyAvailable()) {
    return failOpenEditClarificationNeed();
  }

  let response;
  try {
    response = await provider.requestEditClarificationNeed(
      buildEditClarificationNeedMessages(message, context),
    );
  } catch (error) {
    logTutorEvent("edit clarification classifier failed, fail-open to direct edit", error, "warn");
    return failOpenEditClarificationNeed();
  }

  if (!response || typeof response.shouldClarify !== "boolean") {
    logTutorEvent("edit clarification classifier returned no usable verdict, fail-open to direct edit", {
      hasResponse: Boolean(response),
    }, "warn");
    return failOpenEditClarificationNeed();
  }

  const shouldClarify =
    response.shouldClarify === true && response.confidence !== "low";

  return {
    shouldClarify,
    source: "model",
    reason: typeof response.reason === "string" ? response.reason : undefined,
  };
}

/**
 * Resolves whether to show the edit-options card before code generation.
 * Workflow/system hard skips stay deterministic. When keyed, the model is the
 * sole semantic judge. No key or model failure fail-open to direct edit.
 */
export async function resolveEditClarificationNeed({
  message,
  context = {},
  workflow = {},
  provider = openAiTutorProvider,
}: {
  message: string;
  context?: EditClarificationClassifierContext;
  workflow?: { skipEditClarification?: boolean };
  provider?: TutorEditClarificationNeedProvider;
}): Promise<EditClarificationNeedResult> {
  if (hasHardSkipEditClarification(message, workflow)) {
    return { shouldClarify: false, source: "deterministic" };
  }

  if (provider === openAiTutorProvider && !tutorApiKeyAvailable()) {
    return failOpenEditClarificationNeed();
  }

  return classifyEditClarificationNeedWithModel({ message, context, provider });
}
