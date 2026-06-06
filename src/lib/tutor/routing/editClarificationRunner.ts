import type { ChatMessage } from "../../../types/chat";
import type { FileItem } from "../../../types/file";
import type { LevelProgressSnapshot } from "../../../types/validationReview";
import type { TutorSupportContext } from "../../../types/tutor";
import { buildConversationContext, buildConversationImageInputs } from "../context/contextBuilder";
import {
  buildEditOptionsCardFromClarification,
} from "./editClarification";
import { packTutorContext } from "../context/contextPacker";
import { analyzeProject } from "../context/projectAnalyzer";
import {
  openAiTutorProvider,
  type TutorEditClarificationProvider,
} from "../provider/openAiProvider";
import { getTutorApiKey } from "../../../hooks/useTutorApiSettings";
import { MISSING_TUTOR_API_KEY_MESSAGE } from "../provider/fallbackTutor";
import type {
  TutorChatMessage,
  TutorEditClarificationResult,
} from "../types";

const EDIT_CLARIFICATION_SYSTEM_PROMPT = `You are Web Lab Tutor helping a student choose a direction before you edit their HTML, CSS, and JavaScript project.

The student's request is broad or underspecified. Your job is to propose a few distinct implementation directions grounded in their actual project — not to edit files yet.

Return JSON only with this shape:
{
  "message": "short student-facing intro asking them to pick a direction",
  "options": [
    {
      "id": "kebab-case-id",
      "label": "Short label for the UI (about 3-6 words)",
      "enrichPrompt": "Complete implementation instruction for the build step if they pick this option"
    }
  ]
}

Rules:
- Provide exactly 3 options unless the project context clearly supports only 2 meaningful alternatives.
- Each option must be a genuinely different direction, not minor rephrasings.
- Ground options in projectContext: name likely files, selectors, button/link areas, or layout regions you can see.
- Each enrichPrompt must stand alone as a concrete build instruction the code generator can execute without asking follow-up questions.
- Reference the student's original request inside each enrichPrompt.
- Prefer CSS for visual polish (hover, focus, color, spacing, motion) unless the student clearly wants dynamic behavior.
- Keep message to 1-2 short sentences. Use lightweight Markdown if helpful.
- Do not include a free-text or "other" option; the UI provides that separately.
- Do not propose file edits in message; only return the JSON shape above.`;

const CURRICULUM_EDIT_CLARIFICATION_PROMPT = `Curriculum-level context:
- Use levelInstructionsMarkdown as scope for what the level is trying to teach.
- Keep options aligned with the level goal; do not suggest unrelated extension work.
- If levelProgress is provided, avoid options that redo already-passed criteria unless the student asked to revisit them.`;

function buildEditClarificationMessages({
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
  const imageInputs = buildConversationImageInputs(conversation);
  const payload = {
    userMessage: message,
    tutorSupportContext: supportContext,
    levelInstructionsMarkdown: levelInstructionsMarkdown.trim() || undefined,
    levelProgress,
    projectContext: context,
    conversation: buildConversationContext(conversation),
    clarificationInstruction:
      "The app classified this as an underspecified edit request. Suggest directions the student can choose before code generation runs.",
  };
  const systemPrompt = [
    EDIT_CLARIFICATION_SYSTEM_PROMPT,
    supportContext === "curriculum-level" ? CURRICULUM_EDIT_CLARIFICATION_PROMPT : "",
    additionalSystemPrompt.trim()
      ? `\n\nAdditional prototype instructions:\n${additionalSystemPrompt.trim()}`
      : "",
  ].filter(Boolean).join("\n\n");

  const userContent: TutorChatMessage["content"] = imageInputs.length > 0
    ? [
        { type: "text", text: JSON.stringify(payload) },
        ...imageInputs.map((image) => ({
          type: "image_url" as const,
          image_url: {
            url: image.imageDataUrl,
            detail: "auto" as const,
          },
        })),
      ]
    : JSON.stringify(payload);

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userContent },
  ];
}

export async function runEditClarification({
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
  provider?: TutorEditClarificationProvider;
}): Promise<TutorEditClarificationResult> {
  if (provider === openAiTutorProvider && !getTutorApiKey().trim()) {
    return {
      message: MISSING_TUTOR_API_KEY_MESSAGE,
    };
  }

  const response = await provider.requestEditClarification(
    buildEditClarificationMessages({
      message,
      conversation,
      files,
      additionalSystemPrompt,
      levelInstructionsMarkdown,
      levelProgress,
      supportContext,
    }),
  );

  if (!response) {
    return {
      message: MISSING_TUTOR_API_KEY_MESSAGE,
    };
  }

  const editOptions = buildEditOptionsCardFromClarification(message, response);
  const intro =
    typeof response.message === "string" ? response.message.trim() : "";

  if (!editOptions) {
    return {
      message: intro ||
        "I need a bit more direction before I edit your project. Try naming what you want changed, such as button hover styles, colors, or spacing.",
    };
  }

  return {
    message: intro || editOptions.intro || "Pick a direction and I'll apply it to your project:",
    editOptions,
  };
}
