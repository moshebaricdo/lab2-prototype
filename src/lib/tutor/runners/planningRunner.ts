import type { ChatMessage } from "../../../types/chat";
import type { FileItem } from "../../../types/file";
import type { LevelProgressSnapshot } from "../../../types/validationReview";
import { applyStructuredEditsAtomically } from "../edit/atomicEditApplicator";
import { buildConversationContext, buildConversationImageInputs } from "../context/contextBuilder";
import { packTutorContext } from "../context/contextPacker";
import { normalizeTutorSaveTitle } from "../edit/saveTitle";
import { analyzeProject } from "../context/projectAnalyzer";
import { openAiTutorProvider, type TutorStructuredEditProvider } from "../provider/openAiProvider";
import type {
  TutorChatMessage,
  TutorEditResult,
  TutorStructuredEditResponse,
} from "../types";

export type TutorPlanningResult =
  | { kind: "ok"; result: TutorEditResult }
  | { kind: "no-key" }
  | { kind: "failed"; errors: string[] };

const PROJECT_PLAN_FILE = "Plans/PROJECT_PLAN.md";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function planBasename(planFile: string) {
  return planFile.split("/").filter(Boolean).at(-1) ?? planFile;
}

function buildPlanningSystemPrompt(planFile: string) {
  return `You are Web Lab Tutor's planning partner for students starting simple web projects.

The student is not asking you to generate runnable HTML, CSS, or JavaScript yet. Help them shape a project idea and maintain a Markdown project plan.

Rules:
- Return JSON only.
- Do not use markdown fences.
- Create or revise exactly one file: ${planFile}. EVERY turn must include this edit — never reply with questions only.
- This is collaborative drafting: each turn produces or advances a working version of the plan. On the first turn, draft a complete first-pass plan (a v1) from the details you have; on later turns, revise that same plan to fold in the student's newest answers. Ask questions only after the plan reflects your best current draft.
- When details are thin, make reasonable beginner-friendly assumptions and still draft the full plan now. Capture genuine unknowns under Open Questions instead of withholding the plan.
- Do not create or modify HTML, CSS, JavaScript, image, or data files.
- Keep the student-facing message short enough to read without scrolling: one sentence about what changed in the plan, then at most 2-3 numbered questions or next steps.
- Write like a creative project coach, not a project-management report. Be specific, upbeat, and economical.
- Skip recap, generic closers, and "let me know" endings. End on the exact choice or review action the student should take next.
- Format follow-up questions as Markdown with a short intro and a numbered list, one question per item. Use bullets or short headings only when they make the response easier to scan.
- In your student-facing message, refer to the plan naturally, like "please review the plan I created" or "I made edits to the plan." Do not mention the internal file path ${planFile}.
- Keep the plan practical for a beginner using plain HTML, CSS, and JavaScript.
- If the student has already made choices, incorporate them into the plan instead of asking the same question again.
- Generate a short saveTitle like a commit title: one sentence max, no markdown, no trailing period, under 72 characters.

${planFile} should include concise sections such as:
- A top-level # heading with a readable project title based on the student's idea, not "Status".
- Status: Planned directly under the title.
- Project Goal
- Audience
- Core Features
- Page Structure
- Files To Build
- Interaction Ideas
- Open Questions
- Next Step

Response shape:
{
  "message": "student-facing planning response",
  "saveTitle": "Short commit-style summary",
  "edits": [
    {
      "path": "${planFile}",
      "strategy": "replace",
      "content": "complete Markdown plan"
    }
  ]
}`;
}

function normalizePath(path: string) {
  return path.trim().replace(/\\/g, "/").replace(/^\/+/, "").replace(/^\.\//, "");
}

/**
 * Whether a model-authored path targets the planning file. Accepts the exact
 * path, a bare basename, or the basename inside a `Plans/` folder so a model
 * that drops the folder prefix or root still maps onto the intended file.
 */
function isTargetPlanPath(path: string, planFile: string) {
  const normalized = normalizePath(path);
  const target = normalizePath(planFile);
  const baseName = planBasename(target).toLowerCase();
  const parts = normalized.split("/").filter(Boolean);
  return normalized === target ||
    normalized.toLowerCase() === baseName ||
    (parts.at(-2) === "Plans" && parts.at(-1)?.toLowerCase() === baseName);
}

function normalizePlanningResponse(
  response: TutorStructuredEditResponse | null,
  planFile: string,
) {
  if (!response?.edits || response.edits.length !== 1) {
    return response;
  }
  const [edit] = response.edits;
  if (!isTargetPlanPath(edit.path, planFile)) {
    return response;
  }
  return {
    ...response,
    edits: [{ ...edit, path: planFile }],
  };
}

/** Strip the literal plan path/basename from the student-facing message. */
function stripPlanPathFromMessage(message: string, planFile: string) {
  const fullPath = escapeRegExp(planFile);
  const baseName = escapeRegExp(planBasename(planFile));
  return message
    .replace(new RegExp(`\\b(?:the\\s+)?${fullPath}\\b`, "gi"), "the plan")
    .replace(new RegExp(`\\b${baseName}\\b`, "gi"), "the plan")
    .replace(/\s+/g, " ")
    .trim();
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

function buildPlanningMessages({
  message,
  conversation,
  files,
  additionalSystemPrompt,
  levelInstructionsMarkdown,
  levelProgress,
  planFile,
}: {
  message: string;
  conversation: ChatMessage[];
  files: FileItem[];
  additionalSystemPrompt: string;
  levelInstructionsMarkdown: string;
  levelProgress?: LevelProgressSnapshot;
  planFile: string;
}): TutorChatMessage[] {
  const analysis = analyzeProject(files);
  const context = packTutorContext(analysis, message, 14000);
  const payload = {
    userMessage: message,
    projectContext: context,
    levelInstructionsMarkdown: levelInstructionsMarkdown.trim() || undefined,
    levelProgress,
    conversation: buildConversationContext(conversation).slice(-6),
    planningFileName: planFile,
  };
  const basePrompt = buildPlanningSystemPrompt(planFile);
  const systemPrompt = additionalSystemPrompt.trim()
    ? `${basePrompt}\n\nAdditional prototype instructions:\n${additionalSystemPrompt.trim()}`
    : basePrompt;

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: buildUserContent(payload, conversation) },
  ];
}

/**
 * Corrective turn appended after a response that failed validation (most often
 * a questions-only reply with no plan edit). It echoes the model's prose back
 * and the concrete problems, then demands the required JSON shape — so the
 * student still gets a first-pass artifact instead of the generic fallback.
 */
function buildPlanningRepairMessages(
  baseMessages: TutorChatMessage[],
  response: TutorStructuredEditResponse,
  errors: string[],
  planFile: string,
): TutorChatMessage[] {
  return [
    ...baseMessages,
    {
      role: "user",
      content: [
        "Your previous reply was not usable as a plan update:",
        JSON.stringify(response),
        "",
        "Problems:",
        ...errors.map((error) => `- ${error}`),
        "",
        `Return JSON only, with exactly one edit to ${planFile} using strategy "replace" and complete Markdown content.`,
        "Draft or revise the full plan now from the details and your reasonable assumptions — do not reply with questions only. Keep any genuine unknowns under Open Questions, and you may keep your short student-facing message and follow-up questions in the message field.",
      ].join("\n"),
    },
  ];
}

function validatePlanningResponse(
  response: TutorStructuredEditResponse | null,
  planFile: string,
) {
  if (!response) return ["No API key available for tutor planning."];
  if (!Array.isArray(response.edits)) {
    return ["Planning response must include an edits array."];
  }
  if (response.edits.length !== 1) {
    return ["Planning response must update exactly one Markdown plan file."];
  }

  const [edit] = response.edits;
  if (edit.path !== planFile) {
    return [`Planning response must edit ${planFile}, not ${edit.path}.`];
  }
  if (edit.strategy !== "replace") {
    return [`${planFile}: planning edits must use a complete replace strategy.`];
  }
  if (typeof edit.content !== "string" || !edit.content.trim()) {
    return [`${planFile}: planning content cannot be empty.`];
  }
  if (/^\s*#\s*Status:/im.test(edit.content)) {
    return [`${planFile}: use a readable project title as the heading and put Status underneath.`];
  }
  if (/<\/?(html|head|body|main|section|script|style|div|button)\b/i.test(edit.content)) {
    return [`${planFile}: planning content should be Markdown, not generated app code.`];
  }

  return [];
}

/** Any active (non-Completed) Markdown plan under a `Plans/` folder. */
function isAnyPlanPath(path: string) {
  const parts = normalizePath(path).split("/").filter(Boolean);
  return parts.length >= 2 &&
    parts.at(-2) === "Plans" &&
    Boolean(parts.at(-1)?.toLowerCase().endsWith(".md"));
}

function hasActivePlan(files: FileItem[], parentPath = ""): boolean {
  return files.some((file) => {
    const path = parentPath ? `${parentPath}/${file.name}` : file.name;
    if (file.children) {
      return hasActivePlan(file.children, path);
    }
    if (!isAnyPlanPath(path)) {
      return false;
    }
    const content = file.proposedStatus && file.proposedStatus !== "deleted"
      ? file.proposedContent ?? ""
      : file.content ?? "";
    return !/\bStatus:\s*Completed\b/i.test(content);
  });
}

function fallbackPlanning(message: string, files: FileItem[] = []): TutorEditResult {
  if (hasActivePlan(files)) {
    return {
      message:
        "I'm still in planning mode, but I couldn't update the plan just now. Please try sending those details again in one sentence, and I'll revise the plan before we build.",
      changes: [],
    };
  }

  const topic = /map/i.test(message) ? "map project" : "web project";
  return {
    message:
      `I can help you plan a ${topic} before we build files. Try telling me the audience, the main thing someone should do on the page, and one interaction you want to include.`,
    changes: [],
  };
}

export async function runTutorPlanning({
  message,
  conversation,
  files,
  additionalSystemPrompt = "",
  levelInstructionsMarkdown = "",
  levelProgress,
  planningFileName = PROJECT_PLAN_FILE,
  provider = openAiTutorProvider,
}: {
  message: string;
  conversation: ChatMessage[];
  files: FileItem[];
  additionalSystemPrompt?: string;
  levelInstructionsMarkdown?: string;
  levelProgress?: LevelProgressSnapshot;
  /** Target plan file. Defaults to Plans/PROJECT_PLAN.md. */
  planningFileName?: string;
  provider?: TutorStructuredEditProvider;
}): Promise<TutorPlanningResult> {
  const planFile = normalizePath(planningFileName) || PROJECT_PLAN_FILE;
  const baseMessages = buildPlanningMessages({
    message,
    conversation,
    files,
    additionalSystemPrompt,
    levelInstructionsMarkdown,
    levelProgress,
    planFile,
  });
  let response = normalizePlanningResponse(
    await provider.requestStructuredEdit(baseMessages),
    planFile,
  );

  if (!response) {
    return { kind: "no-key" };
  }

  let responseErrors = validatePlanningResponse(response, planFile);
  // One corrective pass: a questions-only (or otherwise malformed) reply still
  // owes the student a first-pass plan, so re-prompt for the required edit
  // before giving up. Refusing again drops to the fallback.
  if (responseErrors.length > 0) {
    const repaired = normalizePlanningResponse(
      await provider.requestStructuredEdit(
        buildPlanningRepairMessages(baseMessages, response, responseErrors, planFile),
      ),
      planFile,
    );
    if (repaired) {
      const repairedErrors = validatePlanningResponse(repaired, planFile);
      if (repairedErrors.length === 0) {
        response = repaired;
        responseErrors = [];
      }
    }
  }

  if (responseErrors.length > 0) {
    return { kind: "failed", errors: responseErrors };
  }

  const applyResult = applyStructuredEditsAtomically(files, response.edits ?? []);
  if (applyResult.ok === false) {
    return { kind: "failed", errors: applyResult.errors };
  }

  const rawResponseMessage = response.message?.trim();
  const normalizedResponseMessage = rawResponseMessage
    ? stripPlanPathFromMessage(rawResponseMessage, planFile)
    : undefined;
  const responseMessage = normalizedResponseMessage
    ? /\b(review|look over|check|read)\b.+\bplan\b|\bplan\b.+\b(review|look over|check|read)\b/i.test(normalizedResponseMessage)
      ? normalizedResponseMessage
      : `${normalizedResponseMessage}\n\nPlease review the plan I created, then use Build plan when you are ready.`
    : "I drafted a project plan for us to review before building. Please review the plan I created, then use Build plan when you are ready.";

  // Planning intentionally skips the web-project edit validator (CSS/HTML/JS
  // structure and request-intent heuristics). Those rules are for runnable app
  // edits and wrongly reject Markdown plans — e.g. a "filtering" or "sorting"
  // app idea reads as a request for JS behavior the plan file can't satisfy.
  // The plan edit is already validated as a single Markdown replace above, and
  // the atomic applicator produced the changes, so we validate scope directly.
  const invalidChange = applyResult.changes.find((change) =>
    change.fileName !== planFile ||
    change.status === "deleted" ||
    typeof change.content !== "string"
  );
  if (invalidChange) {
    return { kind: "failed", errors: [`Planning must only create or update ${planFile}.`] };
  }

  return {
    kind: "ok",
    result: {
      message: responseMessage,
      saveTitle: normalizeTutorSaveTitle(response.saveTitle ?? response.message),
      changes: applyResult.changes,
    },
  };
}

export { fallbackPlanning, PROJECT_PLAN_FILE };
