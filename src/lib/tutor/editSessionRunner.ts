import type { ChatMessage } from "../../types/chat";
import type { FileItem } from "../../types/file";
import { buildConversationContext, buildConversationImageInputs } from "./contextBuilder";
import { packTutorContext } from "./contextPacker";
import { analyzeProject } from "./projectAnalyzer";
import { openAiTutorProvider, type TutorStructuredEditProvider } from "./openAiProvider";
import { applyStructuredEditsAtomically } from "./atomicEditApplicator";
import { validateWebProjectChanges } from "./webProjectValidator";
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
- For layout/style changes, update CSS and HTML together when needed.
- For accessibility changes, add labels, focus, keyboard, or ARIA only when relevant.
- If the request asks to build from Plans/PROJECT_PLAN.md, treat that file as requirements context and include a targeted update to Plans/PROJECT_PLAN.md marking completed items and setting Status: Completed under the existing readable title when the build is represented in the proposed files.
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
}: {
  message: string;
  conversation: ChatMessage[];
  files: FileItem[];
  additionalSystemPrompt: string;
}): TutorChatMessage[] {
  const analysis = analyzeProject(files);
  const context = packTutorContext(analysis, message);
  const payload = {
    userMessage: message,
    projectContext: context,
    conversation: buildConversationContext(conversation),
  };
  const systemPrompt = additionalSystemPrompt.trim()
    ? `${EDIT_SESSION_SYSTEM_PROMPT}\n\nAdditional prototype instructions:\n${additionalSystemPrompt.trim()}`
    : EDIT_SESSION_SYSTEM_PROMPT;

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
  previousResponse,
  errors,
  repairAttempt,
}: {
  message: string;
  conversation: ChatMessage[];
  files: FileItem[];
  additionalSystemPrompt: string;
  previousResponse: TutorStructuredEditResponse;
  errors: string[];
  repairAttempt: number;
}): TutorChatMessage[] {
  const analysis = analyzeProject(files);
  const context = packTutorContext(analysis, message, repairAttempt > 1 ? 26000 : 18000);
  const payload = {
    userMessage: message,
    projectContext: context,
    previousResponse,
    errors,
    repairInstruction:
      "Return corrected JSON only. Fix the failed apply/validation issues with the smallest coherent multi-file edit set. Do not repeat edits that already failed unless corrected. Include every file needed for the edit to actually work in preview.",
    repairAttempt,
    conversation: buildConversationContext(conversation).slice(-4),
  };
  const systemPrompt = additionalSystemPrompt.trim()
    ? `${EDIT_SESSION_SYSTEM_PROMPT}\n\nAdditional prototype instructions:\n${additionalSystemPrompt.trim()}`
    : EDIT_SESSION_SYSTEM_PROMPT;

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

  const responseMessage = response.message?.trim() ||
    "I made a set of project edits for you to review.";
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
  provider = openAiTutorProvider,
}: {
  message: string;
  conversation: ChatMessage[];
  files: FileItem[];
  additionalSystemPrompt?: string;
  provider?: TutorStructuredEditProvider;
}): Promise<TutorEditSessionResult> {
  const firstResponse = await provider.requestStructuredEdit(buildEditMessages({
    message,
    conversation,
    files,
    additionalSystemPrompt,
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
