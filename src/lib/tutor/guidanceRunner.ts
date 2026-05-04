import type { ChatMessage } from "../../types/chat";
import type { FileItem } from "../../types/file";
import { buildConversationContext, buildConversationImageInputs } from "./contextBuilder";
import { packTutorContext } from "./contextPacker";
import { analyzeProject } from "./projectAnalyzer";
import { openAiTutorProvider, type TutorGuidanceProvider } from "./openAiProvider";
import type { TutorChatMessage, TutorEditResult } from "./types";

const GUIDANCE_SYSTEM_PROMPT = `You are Web Lab Tutor, a supportive computer science tutor for students learning HTML, CSS, and JavaScript.

The student is asking a conceptual, how-to, project-navigation, or tutoring question, not asking you to edit their project or write a project spec.

Rules:
- Return JSON only with shape { "message": "..." }.
- Do not propose file changes.
- Do not create or mention a Plans/PROJECT_PLAN.md planning proposal.
- Do not include code fences unless a small example is helpful.
- Keep the answer student-friendly, concrete, and concise.
- For "how would I..." or "how can I..." project questions, explain the approach the student could take and name likely files or concepts, but do not perform the edit.
- For "where is this code?" or "what should I tweak?" questions, point to likely files, selectors, functions, ids, or snippets from the project context instead of describing an edit plan.
- If useful, reference the student's current project context as an example, but make clear that no project files need to change.
- Stay within HTML, CSS, and JavaScript.`;

function buildGuidanceMessages({
  message,
  conversation,
  files,
  additionalSystemPrompt,
}: {
  message: string;
  conversation: ChatMessage[];
  files: FileItem[];
  additionalSystemPrompt?: string;
}): TutorChatMessage[] {
  const analysis = analyzeProject(files);
  const context = packTutorContext(analysis, message, 12000);
  const imageInputs = buildConversationImageInputs(conversation);
  const payload = {
    userMessage: message,
    projectContext: context,
    conversation: buildConversationContext(conversation).slice(-4),
  };
  const systemPrompt = additionalSystemPrompt?.trim()
    ? `${GUIDANCE_SYSTEM_PROMPT}\n\nAdditional prototype instructions:\n${additionalSystemPrompt.trim()}`
    : GUIDANCE_SYSTEM_PROMPT;
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

function fallbackGuidance(message: string): TutorEditResult {
  if (/\bfunction|functions\b/i.test(message)) {
    return {
      message:
        "A function is a reusable block of JavaScript code. You give it a name, put steps inside it, and then call it when you want those steps to run. In a web project, a function might update text on the page, respond to a button click, or redraw a canvas. Your project files do not need to change for this explanation.",
      changes: [],
    };
  }

  return {
    message:
      "I can answer conceptual HTML, CSS, and JavaScript questions without changing your project. Ask me what you want to understand, and I can connect the idea back to your current files when it helps.",
    changes: [],
  };
}

export async function runTutorGuidance({
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
  provider?: TutorGuidanceProvider;
}): Promise<TutorEditResult> {
  const response = await provider.requestGuidance(buildGuidanceMessages({
    message,
    conversation,
    files,
    additionalSystemPrompt,
  }));

  if (!response?.message?.trim()) {
    return fallbackGuidance(message);
  }

  return {
    message: response.message.trim(),
    changes: [],
  };
}
