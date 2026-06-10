import {
  buildInstructionGuide,
  expectedMoveForIntent,
  getInstructionGuideSignature,
  normalizeOptionIntent,
  normalizeStepIntent,
  slugify,
  stableSignature,
  stripInstructionAuthoringMetadata,
} from "./instructionGuide";
import { buildProgrammaticInstructionOpening } from "./instructionOpeningRunner";
import { formatInstructionOpeningMessage } from "./tutorOpening";
import {
  openAiTutorProvider,
  type TutorInstructionAnalysisProvider,
} from "../provider/openAiProvider";
import { getTutorApiKey } from "../../../hooks/useTutorApiSettings";
import { instructionsMentionVersionHistory } from "../../validation/validationReviewProfile";
import type {
  InstructionGuide,
  InstructionOption,
  InstructionOpeningStepSummary,
  InstructionStep,
  TutorOpening,
} from "../../../types/tutor";
import type {
  TutorChatMessage,
  TutorInstructionAnalysisResponse,
  TutorInstructionAnalysisStepResponse,
} from "../types";

export interface InstructionAnalysisAssessment {
  goals: string[];
  goalLabels?: string[];
}

export interface InstructionAnalysisResult {
  guide: InstructionGuide;
  opening: TutorOpening;
  content: string;
  stepSummaries: InstructionOpeningStepSummary[];
}

export interface InstructionAnalysisOpeningCache {
  guideSignature: string;
  content: string;
  stepSummaries: InstructionOpeningStepSummary[];
}

const TUTOR_SCOPE_PROMPT = `Tutor scope (always apply):
- Tutor coaches code and project work in chat. Tutor cannot observe Version History panel usage, manual saves, or reverts during the session.
- When evaluateVersionHistoryAtReview is true in the payload, save/revert workflow in the instructions is evaluated later at Check My Work from snapshots — do NOT treat those steps as coaching checkpoints or as evidence the guide must be linear.
- Build the guide toward the assessment goals when they are provided: they define what success means and what Tutor should orient the student toward.
- Instruction steps that are classroom ritual, submit/save/revert workflow, or otherwise outside chat-coachable work should not define guide shape or become coaching steps unless the assessment goals require them.
- When assessment goals describe open creative, build, or polish work but instructions include a procedural tail, mode is usually "open-ended" and guide steps should reflect the assessable creative work.
- Assessment goals are the primary shape signal when present. The save/revert exception below applies only when goals describe open creative, build, polish, or exploration work — not when goals describe tracing, labeling, explaining, debugging, or completing a fixed procedure on specific artifacts (numbered comments, lines, bugs, or checkpoints).
- When evaluateVersionHistoryAtReview is true, trailing save/revert/submit/version-history steps must not flip mode to linear and must not become guide steps unless the assessment goals explicitly require that workflow. Omitting save/revert language from goals does NOT by itself mean open-ended when the assessable work is a prescribed trace, debug, or comprehension procedure.`;

export const INSTRUCTION_ANALYSIS_SYSTEM_PROMPT = `You are Web Lab Tutor. You read a coding-lab level's student instructions and optional assessment goals, then produce a structured coaching plan plus the warm first chat message a student sees when they open the level.

${TUTOR_SCOPE_PROMPT}

Your most important judgment is the level's SHAPE. Decide "mode":

"linear" — the instructions describe one prescribed path where order matters:
- Steps build on each other; skipping or reordering would not make sense.
- The approach and outcome are largely fixed by the instructions (not chosen by the student).
- Common patterns: debug/find/fix/verify, trace or analyze each item in a set order, follow a checklist to reach one expected result.

"open-ended" — the student drives the substantive work:
- They choose what to build, improve, explore, or experiment with; several valid directions exist.
- Listed items are focus areas, prompt ideas, or options — not a mandatory sequence.
- Creative or exploratory work where the order of attempts does not matter.
- Language of choice, picking, trying ideas, open assignment, or non-deterministic prompts (draw/select/choose a topic) signals open-ended even when formatting looks like a worksheet.

Shape rules (apply to all levels — infer from meaning, never from formatting alone):
- Numbered labels, bold step numbers, and bullet lists do NOT by themselves determine mode.
- Prefer "open-ended" when assessment goals or instructions invite choice, exploration, experimentation, or a menu of prompt ideas. Prefer "linear" when they define one correct sequence through the learning goal.
- When assessment goals are provided, they outweigh misleading worksheet formatting in the instructions.
- Cross-check assessment vs instructions: when evaluateVersionHistoryAtReview is true, shape the guide from assessable work and goals — not from save/revert/submit/version-history tails in the instructions.
- Prefer "linear" when goals or instructions require working through each numbered comment, item, or checkpoint in order, or when the learning task is trace → label → explain → fix → verify sequencing.
- Prefer "open-ended" when goals invite choosing what to build, improve, explore, or experiment with and several valid directions exist — including when creative/build step 1 is followed only by out-of-band workflow steps.
- Disambiguation: trace/label/explain/debug goals on specific artifacts (numbered comments, promise states, selectors, bugs) → linear even when instructions use a short numbered list. Create/build/explore/polish goals with optional save/revert tails → open-ended even when instructions end with procedural classroom steps.
- When inferShapeFromInstructionsOnly is true in the payload, assessment goals were not provided — infer mode from instructions alone. Numbered save/revert/version-history tails alone do not make a creative assignment linear.

Return JSON only with this shape:
{
  "mode": "linear|open-ended",
  "tone": "debug|concept|creative|procedure",
  "overview": "short phrase naming the whole task or, for open-ended, the shared goal",
  "goal": "paragraph 1 of the student opening — warm, succinct task framing aligned with the instructions",
  "success": "optional coach-only note on what done looks like; use \"\" — never shown in the student opening",
  "firstMove": "paragraph 2 — a helpful starting point; invite them to try the first step and share what they notice or want to focus on",
  "constraints": ["short rule the student must respect", "..."],
  "steps": [
    {
      "title": "3-7 word name for this step or focus area",
      "prompt": "optional one-line description of the work",
      "intent": "for linear use observe|inspect|explain|fix|verify|ask-for-help; for open-ended use style-polish|content-choice|debug-focus|concept-focus",
      "editOriented": true,
      "shortLabel": "3-6 word label for the drawer",
      "summary": "one plain student-facing sentence"
    }
  ]
}

Steps:
- For "linear", list the steps in order. For "open-ended", list the focus areas / prompt ideas the student may pick in any order (omit purely procedural tails like save/submit/revert unless they are the only content).
- "editOriented" is true when acting on the step means changing code (asking Tutor to make an edit), false for read/observe/reflect steps.
- Include only real steps from the instructions and assessment context. Never invent steps, files, or classroom materials. 1 to 6 steps.

Voice (this is the priority for goal, firstMove, and every summary):
- Friendly and guiding, never bossy. A warm lab partner inviting the student in, not an instructor issuing orders.
- goal and firstMove are the complete student opening, shown in order with a blank line between them. Write them as finished copy — the app does not add greetings, wrappers, or extra sentences.
- Be succinct and aligned with the level instructions. Frame what you'll work on in goal; give a concrete starting point in firstMove.
- Vary phrasing naturally across levels. Avoid a fixed opener formula (do not lean on the same greeting or "In this level" every time).
- Prefer collaborative framing ("Let's figure out…", "We'll…", "Take a look at…", "Try…") over commanding imperatives. Avoid "You will…", "You must…", and forceful words like "exactly" or "carefully".
- Do not add a separate success/outcome sentence to the opening — no "A strong result is…", "You'll know you're on track when…", or similar. The success field is coach-only and not shown to students.
- Each of goal and firstMove is exactly one complete sentence, roughly 8-22 words, with normal capitalization and a single ending mark. No run-ons, no semicolons, no fragments, no double punctuation.
- For "linear", firstMove points to the genuine first step and asks what they observe. For "open-ended", firstMove invites the student to pick a direction (you may name a couple of focus areas as examples) and asks what they want to try first.
- Never echo raw worksheet labels (numbered step titles, section headers like "Do This"), and never paste the instructions markdown.`;

export function buildInstructionAnalysisUserPayload({
  instructionsMarkdown,
  assessment,
}: {
  instructionsMarkdown: string;
  assessment?: InstructionAnalysisAssessment;
}) {
  const studentMarkdown = stripInstructionAuthoringMetadata(instructionsMarkdown);
  const goals = assessment?.goals.filter((goal) => goal.trim()) ?? [];

  if (goals.length === 0) {
    return JSON.stringify({
      instructionsMarkdown: studentMarkdown,
      assessment: null,
      inferShapeFromInstructionsOnly: true,
      evaluateVersionHistoryAtReview: instructionsMentionVersionHistory(studentMarkdown),
    });
  }

  return JSON.stringify({
    instructionsMarkdown: studentMarkdown,
    assessment: {
      goals,
      goalLabels: assessment?.goalLabels?.filter((label) => label.trim()),
      evaluateVersionHistoryAtReview: instructionsMentionVersionHistory(studentMarkdown),
    },
  });
}

export function buildInstructionAnalysisMessages({
  instructionsMarkdown,
  assessment,
}: {
  instructionsMarkdown: string;
  assessment?: InstructionAnalysisAssessment;
}): TutorChatMessage[] {
  return [
    { role: "system", content: INSTRUCTION_ANALYSIS_SYSTEM_PROMPT },
    {
      role: "user",
      content: buildInstructionAnalysisUserPayload({ instructionsMarkdown, assessment }),
    },
  ];
}

function normalizeSentence(value: string | undefined): string {
  if (!value) return "";
  const collapsed = value.replace(/\s+/g, " ").trim();
  if (!collapsed) return "";
  const deduped = collapsed
    .replace(/\.{2,}(?=\s|$)/g, ".")
    .replace(/\s+([.!?,;:])/g, "$1");
  return deduped.charAt(0).toUpperCase() + deduped.slice(1);
}

function normalizePhrase(value: string | undefined, fallback: string): string {
  const collapsed = (value ?? "").replace(/\s+/g, " ").trim();
  return collapsed || fallback;
}

function normalizeTone(value: unknown): TutorOpening["tone"] {
  if (value === "debug" || value === "concept" || value === "creative" || value === "procedure") {
    return value;
  }
  return "procedure";
}

function uniqueId(base: string, used: Set<string>) {
  let id = base;
  let suffix = 2;
  while (used.has(id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }
  used.add(id);
  return id;
}

function isOpenEnded(mode: TutorInstructionAnalysisResponse["mode"]) {
  return mode === "open-ended" || mode === "choice-based";
}

function usableSteps(
  response: TutorInstructionAnalysisResponse,
): TutorInstructionAnalysisStepResponse[] {
  return (response.steps ?? []).filter((step) => step?.title?.trim());
}

function isUsableAnalysis(response: TutorInstructionAnalysisResponse | null): response is TutorInstructionAnalysisResponse {
  if (!response) return false;
  if (response.mode !== "linear" && !isOpenEnded(response.mode)) return false;
  if (!response.goal?.trim() || !response.firstMove?.trim()) return false;
  return usableSteps(response).length > 0;
}

function buildLinearSteps(
  steps: TutorInstructionAnalysisStepResponse[],
): { steps: InstructionStep[]; summaries: InstructionOpeningStepSummary[] } {
  const used = new Set<string>();
  const built: InstructionStep[] = [];
  const summaries: InstructionOpeningStepSummary[] = [];

  steps.slice(0, 6).forEach((step, index) => {
    const title = normalizePhrase(step.title, `Step ${index + 1}`);
    const id = uniqueId(slugify(title, `step-${index + 1}`), used);
    const intent = normalizeStepIntent(step.intent);
    const prompt = normalizePhrase(step.prompt, "");
    built.push({
      id,
      title,
      intent,
      expectedStudentMove: expectedMoveForIntent(intent),
      ...(prompt && prompt !== title ? { prompt } : {}),
    });
    summaries.push({
      id,
      shortLabel: normalizePhrase(step.shortLabel, title),
      summary: normalizeSentence(step.summary) || prompt || title,
    });
  });

  return { steps: built, summaries };
}

function buildChoiceOptions(
  steps: TutorInstructionAnalysisStepResponse[],
): { options: InstructionOption[]; summaries: InstructionOpeningStepSummary[] } {
  const used = new Set<string>();
  const options: InstructionOption[] = [];
  const summaries: InstructionOpeningStepSummary[] = [];

  steps.slice(0, 6).forEach((step, index) => {
    const label = normalizePhrase(step.title, `Focus ${index + 1}`);
    const id = uniqueId(slugify(label, `option-${index + 1}`), used);
    const prompt = normalizePhrase(step.prompt, label);
    options.push({
      id,
      label,
      prompt,
      intent: normalizeOptionIntent(step.intent),
      ...(typeof step.editOriented === "boolean" ? { editOriented: step.editOriented } : {}),
    });
    summaries.push({
      id,
      shortLabel: normalizePhrase(step.shortLabel, label),
      summary: normalizeSentence(step.summary) || prompt,
    });
  });

  return { options, summaries };
}

function buildResultFromResponse(
  instructionsMarkdown: string,
  response: TutorInstructionAnalysisResponse,
): InstructionAnalysisResult {
  const studentMarkdown = stripInstructionAuthoringMetadata(instructionsMarkdown);
  const sourceSignature = stableSignature(studentMarkdown);
  const steps = usableSteps(response);
  const goal = normalizeSentence(response.goal);
  const success = normalizeSentence(response.success);
  const firstMove = normalizeSentence(response.firstMove);
  const overview = normalizePhrase(response.overview, goal || firstMove);
  const id = slugify(overview, `guide-${sourceSignature}`);

  let guide: InstructionGuide;
  let stepSummaries: InstructionOpeningStepSummary[];

  if (isOpenEnded(response.mode)) {
    const { options, summaries } = buildChoiceOptions(steps);
    guide = {
      type: "choice-based",
      id,
      sourceSignature,
      goal: overview,
      constraints: (response.constraints ?? [])
        .map((value) => normalizePhrase(value, ""))
        .filter(Boolean)
        .slice(0, 4),
      options,
      fallbackMarkdown: instructionsMarkdown.trim(),
    };
    stepSummaries = summaries;
  } else {
    const { steps: linearSteps, summaries } = buildLinearSteps(steps);
    guide = {
      type: "linear",
      id,
      sourceSignature,
      overview,
      firstMove: firstMove || overview,
      steps: linearSteps,
      fallbackMarkdown: instructionsMarkdown.trim(),
    };
    stepSummaries = summaries;
  }

  const opening: TutorOpening = {
    tone: normalizeTone(response.tone),
    goal,
    success,
    firstMove,
    sourceSignature: `${sourceSignature}:llm:${goal}:${success}:${firstMove}:${stepSummaries
      .map((step) => step.id)
      .join(",")}`,
  };

  const content = formatInstructionOpeningMessage(opening);

  return { guide, opening, content, stepSummaries };
}

/** Deterministic, no-network result: regex-derived guide + programmatic opening. */
export function buildProgrammaticInstructionAnalysis(
  instructionsMarkdown: string,
): InstructionAnalysisResult {
  const guide = buildInstructionGuide(instructionsMarkdown);
  const { opening, content, stepSummaries } = buildProgrammaticInstructionOpening(
    instructionsMarkdown,
    guide,
  );
  return { guide, opening, content, stepSummaries };
}

export function toInstructionAnalysisOpeningCache(
  result: InstructionAnalysisResult,
): InstructionAnalysisOpeningCache {
  return {
    guideSignature: getInstructionGuideSignature(result.guide),
    content: result.content,
    stepSummaries: result.stepSummaries,
  };
}

/**
 * Derives the instruction guide and opening in a single model call. When
 * assessment goals are provided, the model orients coaching toward what Check My
 * Work evaluates and applies tutor-scope rules for out-of-band workflow steps.
 * When assessment goals are absent, the model still infers shape from
 * instructions alone (weaker signal). Falls back to regex-derived guide +
 * programmatic opening on no key, error, or unusable output.
 */
export async function runInstructionAnalysis({
  instructionsMarkdown,
  assessment,
  provider = openAiTutorProvider,
}: {
  instructionsMarkdown: string;
  assessment?: InstructionAnalysisAssessment;
  provider?: TutorInstructionAnalysisProvider;
}): Promise<InstructionAnalysisResult> {
  if (provider === openAiTutorProvider && !getTutorApiKey().trim()) {
    return buildProgrammaticInstructionAnalysis(instructionsMarkdown);
  }

  let response: TutorInstructionAnalysisResponse | null = null;
  try {
    response = await provider.requestInstructionAnalysis(
      buildInstructionAnalysisMessages({ instructionsMarkdown, assessment }),
    );
  } catch {
    return buildProgrammaticInstructionAnalysis(instructionsMarkdown);
  }

  if (!isUsableAnalysis(response)) {
    return buildProgrammaticInstructionAnalysis(instructionsMarkdown);
  }

  return buildResultFromResponse(instructionsMarkdown, response);
}
