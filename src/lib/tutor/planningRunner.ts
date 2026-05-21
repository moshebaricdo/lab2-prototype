import type { ChatMessage } from "../../types/chat";
import type { FileItem } from "../../types/file";
import type { LevelProgressSnapshot } from "../../types/validationReview";
import { applyStructuredEditsAtomically } from "./atomicEditApplicator";
import { buildConversationContext, buildConversationImageInputs } from "./contextBuilder";
import { packTutorContext } from "./contextPacker";
import { validateWebProjectChanges } from "./webProjectValidator";
import { analyzeProject } from "./projectAnalyzer";
import { openAiTutorProvider, type TutorStructuredEditProvider } from "./openAiProvider";
import type {
  TutorChatMessage,
  TutorEditResult,
  TutorStructuredEditResponse,
} from "./types";

export type TutorPlanningResult =
  | { kind: "ok"; result: TutorEditResult }
  | { kind: "no-key" }
  | { kind: "failed"; errors: string[] };

const PROJECT_PLAN_FILE = "Plans/PROJECT_PLAN.md";

const PLANNING_SYSTEM_PROMPT = `You are Web Lab Tutor's planning partner for students starting simple web projects.

The student is not asking you to generate runnable HTML, CSS, or JavaScript yet. Help them shape a project idea and maintain a Markdown project plan.

Rules:
- Return JSON only.
- Do not use markdown fences.
- Create or revise exactly one file: Plans/PROJECT_PLAN.md.
- Do not create or modify HTML, CSS, JavaScript, image, or data files.
- Keep the student-facing message short enough to read without scrolling: one sentence about what changed, then at most 2-3 numbered questions or next steps.
- Write like a creative project coach, not a project-management report. Be specific, upbeat, and economical.
- Skip recap, generic closers, and "let me know" endings. End on the exact choice or review action the student should take next.
- Format follow-up questions as Markdown with a short intro and a numbered list, one question per item. Use bullets or short headings only when they make the response easier to scan.
- In your student-facing message, refer to the plan naturally, like "please review the plan I created" or "I made edits to the plan." Do not mention the internal file path Plans/PROJECT_PLAN.md.
- Keep the plan practical for a beginner using plain HTML, CSS, and JavaScript.
- If the student has already made choices, incorporate them into the plan instead of asking the same question again.
- Generate a short saveTitle like a commit title: one sentence max, no markdown, no trailing period, under 72 characters.

Plans/PROJECT_PLAN.md should include concise sections such as:
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
      "path": "Plans/PROJECT_PLAN.md",
      "strategy": "replace",
      "content": "complete Markdown plan"
    }
  ]
}`;

function normalizePath(path: string) {
  return path.trim().replace(/\\/g, "/").replace(/^\/+/, "").replace(/^\.\//, "");
}

function isProjectPlanPath(path: string) {
  const normalized = normalizePath(path);
  const parts = normalized.split("/").filter(Boolean);
  return normalized === PROJECT_PLAN_FILE ||
    normalized === "PROJECT_PLAN.md" ||
    (
      parts.at(-2) === "Plans" &&
      parts.at(-1)?.toLowerCase() === "project_plan.md"
    );
}

function normalizePlanningResponse(response: TutorStructuredEditResponse | null) {
  if (!response?.edits || response.edits.length !== 1) {
    return response;
  }
  const [edit] = response.edits;
  if (!isProjectPlanPath(edit.path)) {
    return response;
  }
  return {
    ...response,
    edits: [{ ...edit, path: PROJECT_PLAN_FILE }],
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

function buildPlanningMessages({
  message,
  conversation,
  files,
  additionalSystemPrompt,
  levelInstructionsMarkdown,
  levelProgress,
}: {
  message: string;
  conversation: ChatMessage[];
  files: FileItem[];
  additionalSystemPrompt: string;
  levelInstructionsMarkdown: string;
  levelProgress?: LevelProgressSnapshot;
}): TutorChatMessage[] {
  const analysis = analyzeProject(files);
  const context = packTutorContext(analysis, message, 14000);
  const payload = {
    userMessage: message,
    projectContext: context,
    levelInstructionsMarkdown: levelInstructionsMarkdown.trim() || undefined,
    levelProgress,
    conversation: buildConversationContext(conversation).slice(-6),
    planningFileName: PROJECT_PLAN_FILE,
  };
  const systemPrompt = additionalSystemPrompt.trim()
    ? `${PLANNING_SYSTEM_PROMPT}\n\nAdditional prototype instructions:\n${additionalSystemPrompt.trim()}`
    : PLANNING_SYSTEM_PROMPT;

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: buildUserContent(payload, conversation) },
  ];
}

function validatePlanningResponse(response: TutorStructuredEditResponse | null) {
  if (!response) return ["No API key available for tutor planning."];
  if (!Array.isArray(response.edits)) {
    return ["Planning response must include an edits array."];
  }
  if (response.edits.length !== 1) {
    return ["Planning response must update exactly one Markdown plan file."];
  }

  const [edit] = response.edits;
  if (edit.path !== PROJECT_PLAN_FILE) {
    return [`Planning response must edit ${PROJECT_PLAN_FILE}, not ${edit.path}.`];
  }
  if (edit.strategy !== "replace") {
    return [`${PROJECT_PLAN_FILE}: planning edits must use a complete replace strategy.`];
  }
  if (typeof edit.content !== "string" || !edit.content.trim()) {
    return [`${PROJECT_PLAN_FILE}: planning content cannot be empty.`];
  }
  if (/^\s*#\s*Status:/im.test(edit.content)) {
    return [`${PROJECT_PLAN_FILE}: use a readable project title as the heading and put Status underneath.`];
  }
  if (/<\/?(html|head|body|main|section|script|style|div|button)\b/i.test(edit.content)) {
    return [`${PROJECT_PLAN_FILE}: planning content should be Markdown, not generated app code.`];
  }

  return [];
}

function hasActivePlan(files: FileItem[], parentPath = ""): boolean {
  return files.some((file) => {
    const path = parentPath ? `${parentPath}/${file.name}` : file.name;
    if (file.children) {
      return hasActivePlan(file.children, path);
    }
    if (!isProjectPlanPath(path)) {
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
  provider = openAiTutorProvider,
}: {
  message: string;
  conversation: ChatMessage[];
  files: FileItem[];
  additionalSystemPrompt?: string;
  levelInstructionsMarkdown?: string;
  levelProgress?: LevelProgressSnapshot;
  provider?: TutorStructuredEditProvider;
}): Promise<TutorPlanningResult> {
  const response = normalizePlanningResponse(await provider.requestStructuredEdit(buildPlanningMessages({
    message,
    conversation,
    files,
    additionalSystemPrompt,
    levelInstructionsMarkdown,
    levelProgress,
  })));

  if (!response) {
    return { kind: "no-key" };
  }

  const responseErrors = validatePlanningResponse(response);
  if (responseErrors.length > 0) {
    return { kind: "failed", errors: responseErrors };
  }

  const applyResult = applyStructuredEditsAtomically(files, response.edits ?? []);
  if (applyResult.ok === false) {
    return { kind: "failed", errors: applyResult.errors };
  }

  const rawResponseMessage = response.message?.trim();
  const normalizedResponseMessage = rawResponseMessage
    ?.replace(/\b(?:the\s+)?Plans\/PROJECT_PLAN\.md\b/gi, "the plan")
    .replace(/\bPROJECT_PLAN\.md\b/gi, "the plan")
    .replace(/\s+/g, " ")
    .trim();
  const responseMessage = normalizedResponseMessage
    ? /\b(review|look over|check|read)\b.+\bplan\b|\bplan\b.+\b(review|look over|check|read)\b/i.test(normalizedResponseMessage)
      ? normalizedResponseMessage
      : `${normalizedResponseMessage}\n\nPlease review the plan I created, then use Build plan when you are ready.`
    : "I drafted a project plan for us to review before building. Please review the plan I created, then use Build plan when you are ready.";
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

  const invalidChange = validation.changes.find((change) =>
    change.fileName !== PROJECT_PLAN_FILE ||
    change.status === "deleted" ||
    typeof change.content !== "string"
  );
  if (invalidChange) {
    return { kind: "failed", errors: [`Planning must only create or update ${PROJECT_PLAN_FILE}.`] };
  }

  return {
    kind: "ok",
    result: validation,
  };
}

export { fallbackPlanning, PROJECT_PLAN_FILE };
