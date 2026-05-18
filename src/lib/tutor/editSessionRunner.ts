import type { ChatMessage } from "../../types/chat";
import type { FileItem } from "../../types/file";
import type { LevelProgressSnapshot } from "../../types/validationReview";
import type { TutorSupportContext } from "../../types/tutor";
import { buildConversationContext, buildConversationImageInputs } from "./contextBuilder";
import { packTutorContext } from "./contextPacker";
import { analyzeProject } from "./projectAnalyzer";
import { openAiTutorProvider, type TutorStructuredEditProvider } from "./openAiProvider";
import { applyStructuredEditsAtomically } from "./atomicEditApplicator";
import { validateWebProjectChanges } from "./webProjectValidator";
import { summarizeTutorEditResponse } from "./responseSummary";
import type {
  TutorChatMessage,
  TutorEditResult,
  TutorStructuredEditResponse,
} from "./types";

export type TutorEditSessionResult =
  | { kind: "ok"; result: TutorEditResult }
  | { kind: "no-key" }
  | { kind: "failed"; errors: string[] };

const MAX_STRUCTURED_REPAIR_ATTEMPTS = 2;
const STYLE_POLISH_PATTERN =
  /\b(css|stylesheet|style|styles|polish|visual|hover\w*|focus-visible|focus|visited|underline|transition|animate|animation|font|spacing|contrast)\b/i;
const EXPLICIT_BEHAVIOR_PATTERN =
  /\b(click|clickable|tap|select|selected|javascript|\bjs\b|event listener|dynamic|toggl\w*|open\w*|clos\w*|show\w*|hid\w*|dropdown|modal|submit|filter|sort)\b|\b(add|create|make|wire|implement)\b.{0,50}\b(open|close|show|hide|toggle|update)\b/i;

const EDIT_SESSION_SYSTEM_PROMPT = `You are Web Lab Tutor's staged code-generation engine for simple web apps.

You specialize only in plain HTML, CSS, and JavaScript projects. You receive a bounded project context, not an open filesystem. Generate one atomic multi-file edit proposal that the local harness can apply and validate.

Rules:
- Return JSON only.
- Do not use markdown fences.
- Do not invent external libraries, frameworks, or unavailable assets.
- Prefer searchReplace edits when only snippets/previews were provided for a file.
- Use replace only when you can provide the complete final contents of that file.
- Preserve unrelated code and project intent.
- For behavior changes, add real JavaScript event handling and ensure HTML references the JavaScript file.
- Hover, focus, visited, transition, and visual animation polish are CSS interaction states by default. Do not add JavaScript for them unless the student explicitly asks for click handlers, dynamic content, toggles, or other stateful behavior.
- For layout/style changes, update CSS and HTML together when needed.
- For accessibility changes, add labels, focus, keyboard, or ARIA only when relevant.
- If levelInstructionsMarkdown is provided, treat it as the curriculum task context and avoid edits outside that scope.
- If levelProgress is provided, preserve already-passed criteria and focus requested help on incomplete criteria unless the student explicitly asks to revisit completed work.
- If the request asks to build from Plans/PROJECT_PLAN.md, treat that file as requirements context and include a targeted update to Plans/PROJECT_PLAN.md marking completed items and setting Status: Completed under the existing readable title when the build is represented in the proposed files.
- The student-facing message must briefly name the main files or page areas changed and explain why the change helps. Do not use generic text like "I made the changes."
- Use lightweight Markdown in the student-facing message when helpful: short paragraphs, bullets or numbered lists for next steps/questions, and inline code for file names/selectors.
- Generate a short saveTitle like a commit title: one sentence max, no markdown, no trailing period, under 72 characters.

Response shape:
{
  "message": "student-facing explanation",
  "saveTitle": "Short commit-style summary",
  "edits": [
    {
      "path": "index.html",
      "strategy": "replace" | "searchReplace" | "delete",
      "content": "complete file content for replace",
      "replacements": [
        { "search": "exact text from provided context", "replace": "new text", "replaceAll": false }
      ]
    }
  ]
}`;

const CURRICULUM_EDIT_PROMPT = `Curriculum-level support:
- The student is working inside a guided level with instructions and learning goals.
- Only propose file edits because this request was classified as explicit implementation help.
- Use the provided levelInstructionsMarkdown as the source of truth for what the level is asking the student to do.
- Use levelProgress to avoid changing completed work unnecessarily and to target the next incomplete requirement.
- Keep the student-facing message clear about what you changed and why it helps with the level goal.
- Do not complete unrelated extension work or add explanatory lesson content to the project unless the student explicitly asked for that content in the project.`;

function buildContextPrompt(supportContext: TutorSupportContext) {
  return supportContext === "curriculum-level" ? `\n\n${CURRICULUM_EDIT_PROMPT}` : "";
}

function buildRequestStylePolicy(message: string) {
  if (!STYLE_POLISH_PATTERN.test(message) || EXPLICIT_BEHAVIOR_PATTERN.test(message)) {
    return undefined;
  }

  return {
    kind: "css-style-polish",
    guidance: [
      "Treat hover, focus, visited, transition, and visual animation as CSS work.",
      "Prefer editing the existing stylesheet.",
      "Do not create or modify JavaScript unless the student explicitly asks for click handlers, dynamic content, toggles, or other stateful behavior.",
    ],
  };
}

function buildUserContent(payload: Record<string, unknown>, conversation: ChatMessage[]) {
  const imageInputs = buildConversationImageInputs(conversation);
  const text = JSON.stringify(payload);
  if (imageInputs.length === 0) {
    return text;
  }
  return [
    { type: "text" as const, text },
    ...imageInputs.map((image) => ({
      type: "image_url" as const,
      image_url: {
        url: image.imageDataUrl,
        detail: "auto" as const,
      },
    })),
  ];
}

function buildEditMessages({
  message,
  conversation,
  files,
  additionalSystemPrompt,
  levelInstructionsMarkdown,
  levelProgress,
  supportContext,
}: {
  message: string;
  conversation: ChatMessage[];
  files: FileItem[];
  additionalSystemPrompt: string;
  levelInstructionsMarkdown: string;
  levelProgress?: LevelProgressSnapshot;
  supportContext: TutorSupportContext;
}): TutorChatMessage[] {
  const analysis = analyzeProject(files);
  const context = packTutorContext(analysis, message);
  const payload = {
    userMessage: message,
    tutorSupportContext: supportContext,
    levelInstructionsMarkdown: levelInstructionsMarkdown.trim() || undefined,
    levelProgress,
    projectContext: context,
    conversation: buildConversationContext(conversation),
    requestStylePolicy: buildRequestStylePolicy(message),
  };
  const systemPrompt = [
    EDIT_SESSION_SYSTEM_PROMPT,
    buildContextPrompt(supportContext),
    additionalSystemPrompt.trim()
      ? `\n\nAdditional prototype instructions:\n${additionalSystemPrompt.trim()}`
      : "",
  ].join("");

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: buildUserContent(payload, conversation) },
  ];
}

function buildRepairMessages({
  message,
  conversation,
  files,
  additionalSystemPrompt,
  levelInstructionsMarkdown,
  levelProgress,
  supportContext,
  previousResponse,
  errors,
  repairAttempt,
}: {
  message: string;
  conversation: ChatMessage[];
  files: FileItem[];
  additionalSystemPrompt: string;
  levelInstructionsMarkdown: string;
  levelProgress?: LevelProgressSnapshot;
  supportContext: TutorSupportContext;
  previousResponse: TutorStructuredEditResponse;
  errors: string[];
  repairAttempt: number;
}): TutorChatMessage[] {
  const analysis = analyzeProject(files);
  const context = packTutorContext(analysis, message, repairAttempt > 1 ? 26000 : 18000);
  const payload = {
    userMessage: message,
    tutorSupportContext: supportContext,
    levelInstructionsMarkdown: levelInstructionsMarkdown.trim() || undefined,
    levelProgress,
    projectContext: context,
    previousResponse,
    errors,
    requestStylePolicy: buildRequestStylePolicy(message),
    repairInstruction:
      "Return corrected JSON only. Fix the failed apply/validation issues with the smallest coherent multi-file edit set. Do not repeat edits that already failed unless corrected. Include every file needed for the edit to actually work in preview.",
    repairAttempt,
    conversation: buildConversationContext(conversation).slice(-4),
  };
  const systemPrompt = [
    EDIT_SESSION_SYSTEM_PROMPT,
    buildContextPrompt(supportContext),
    additionalSystemPrompt.trim()
      ? `\n\nAdditional prototype instructions:\n${additionalSystemPrompt.trim()}`
      : "",
  ].join("");

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: buildUserContent(payload, conversation) },
  ];
}

function responseErrors(response: TutorStructuredEditResponse | null) {
  if (!response) return ["No API key available for staged tutor edits."];
  if (!Array.isArray(response.edits)) {
    return ["Structured edit response must include an edits array."];
  }
  return [];
}

function tryApplyAndValidate({
  response,
  files,
  message,
}: {
  response: TutorStructuredEditResponse;
  files: FileItem[];
  message: string;
}): TutorEditSessionResult {
  const applyResult = applyStructuredEditsAtomically(files, response.edits ?? []);
  if (applyResult.ok === false) {
    return { kind: "failed", errors: applyResult.errors };
  }

  const responseMessage = summarizeTutorEditResponse({
    responseMessage: response.message,
    requestMessage: message,
    changes: applyResult.changes,
  });
  const validation = validateWebProjectChanges({
    files,
    changes: applyResult.changes,
    requestMessage: message,
    responseMessage,
    saveTitle: response.saveTitle,
  });

  if ("errors" in validation) {
    return { kind: "failed", errors: validation.errors };
  }

  return {
    kind: "ok",
    result: validation,
  };
}

export async function runTutorEditSession({
  message,
  conversation,
  files,
  additionalSystemPrompt = "",
  levelInstructionsMarkdown = "",
  levelProgress,
  supportContext = "standalone-project",
  provider = openAiTutorProvider,
}: {
  message: string;
  conversation: ChatMessage[];
  files: FileItem[];
  additionalSystemPrompt?: string;
  levelInstructionsMarkdown?: string;
  levelProgress?: LevelProgressSnapshot;
  supportContext?: TutorSupportContext;
  provider?: TutorStructuredEditProvider;
}): Promise<TutorEditSessionResult> {
  const firstResponse = await provider.requestStructuredEdit(buildEditMessages({
    message,
    conversation,
    files,
    additionalSystemPrompt,
    levelInstructionsMarkdown,
    levelProgress,
    supportContext,
  }));

  if (!firstResponse) {
    return { kind: "no-key" };
  }

  const firstResponseErrors = responseErrors(firstResponse);
  if (firstResponseErrors.length === 0) {
    const firstResult = tryApplyAndValidate({ response: firstResponse, files, message });
    if (firstResult.kind === "ok") {
      return firstResult;
    }
    if (firstResult.kind !== "failed") {
      return firstResult;
    }

    let previousResponse = firstResponse;
    let previousErrors = firstResult.errors;

    for (let repairAttempt = 1; repairAttempt <= MAX_STRUCTURED_REPAIR_ATTEMPTS; repairAttempt += 1) {
      console.warn("[TutorEditSession] Repairing structured edit", {
        repairAttempt,
        errors: previousErrors,
      });
      const repairResponse = await provider.requestStructuredEdit(buildRepairMessages({
        message,
        conversation,
        files,
        additionalSystemPrompt,
        levelInstructionsMarkdown,
        levelProgress,
        supportContext,
        previousResponse,
        errors: previousErrors,
        repairAttempt,
      }));

      if (!repairResponse) {
        return { kind: "no-key" };
      }

      const repairResponseErrors = responseErrors(repairResponse);
      if (repairResponseErrors.length > 0) {
        previousResponse = repairResponse;
        previousErrors = repairResponseErrors;
        continue;
      }

      const repairResult = tryApplyAndValidate({ response: repairResponse, files, message });
      if (repairResult.kind === "ok") {
        return repairResult;
      }
      if (repairResult.kind !== "failed") {
        return repairResult;
      }
      previousResponse = repairResponse;
      previousErrors = repairResult.errors;
    }

    return { kind: "failed", errors: previousErrors };
  }

  return { kind: "failed", errors: firstResponseErrors };
}
