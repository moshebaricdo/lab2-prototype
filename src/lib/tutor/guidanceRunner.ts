import type { ChatMessage } from "../../types/chat";
import type { FileItem } from "../../types/file";
import type { LevelProgressSnapshot } from "../../types/validationReview";
import type { InstructionFocusContext, TutorSupportContext } from "../../types/tutor";
import { buildConversationContext, buildConversationImageInputs } from "./contextBuilder";
import { packTutorContext } from "./contextPacker";
import { analyzeProject } from "./projectAnalyzer";
import { openAiTutorProvider, type TutorGuidanceProvider } from "./openAiProvider";
import { getTutorApiKey } from "../../hooks/useTutorApiSettings";
import { MISSING_TUTOR_API_KEY_MESSAGE } from "./fallbackTutor";
import type { TutorChatMessage, TutorEditResult } from "./types";

export type TutorGuidanceProfile = "web" | "python";

const WEB_GUIDANCE_SYSTEM_PROMPT = `You are Web Lab Tutor, a supportive computer science tutor for students learning HTML, CSS, and JavaScript.

The student is asking a conceptual, how-to, project-navigation, or tutoring question, not asking you to edit their project or write a project spec.

Rules:
- Return JSON only with shape { "message": "..." }.
- Do not propose file changes.
- Do not create or mention a Plans/PROJECT_PLAN.md planning proposal.
- Do not include code fences unless a small example is helpful.
- Write like a helpful lab partner sitting beside the student: warm, direct, and brief.
- Default to 2-5 short sentences or 2-3 tight bullets. If the answer needs steps, give only the next few steps, not a full lesson.
- Skip recap, praise padding, generic closers, and "let me know" endings. End on the concrete next action or one focused question.
- Use lightweight Markdown for readability: short paragraphs, bullets or numbered lists for steps/questions, and inline code for file names/selectors.
- For "how would I..." or "how can I..." project questions, explain the approach the student could take and name likely files or concepts, but do not perform the edit.
- For "where is this code?" or "what should I tweak?" questions, point to likely files, selectors, functions, ids, or snippets from the project context instead of describing an edit plan.
- If useful, reference the student's current project context as an example, but make clear that no project files need to change.
- You receive the student's current project files in projectContext. Do not say you cannot see their files, labels, selectors, or code when that information is present in the supplied project context.
- If the student asks whether their work is correct, you may help reason from the current project files, but direct students to ask Tutor to check their work if they are ready to do so.
- If levelInstructionsMarkdown is provided, use it as the source of truth when the student asks what the instructions want, what the level goal is, or what they should do next.
- If levelProgress is provided, use its passed and incomplete criteria to understand what the student has already completed and what they should work on next.
- If instructionFocus is provided, treat it as the current intended instructional focus. Stay within that focus unless the student explicitly asks to change topics or asks for implementation.
- Stay within HTML, CSS, and JavaScript.`;

const CURRICULUM_WEB_GUIDANCE_PROMPT = `Curriculum-level Web Lab guidance:
- The student is working inside a guided level with instructions and specific learning goals.
- Scope help to the current project files, the level instructions, and the exact goal the student is trying to satisfy.
- For instruction-help questions, answer from the provided levelInstructionsMarkdown instead of giving generic advice about rereading directions.
- If the instructions ask the student to inspect, explain, or answer rather than change code, say that clearly and do not imply they need to edit files.
- For hint or debug requests, prioritize levelProgress.nextIncompleteCriterion and avoid re-teaching criteria already listed in levelProgress.passedCriteria unless the student specifically asks about them.
- If the student says they already completed a passed criterion, acknowledge that progress and redirect them to the next incomplete criterion.
- Be Socratic without creating an endless back-and-forth: give one small next check, ask at most one focused observation question, and only include a short checklist when it helps.
- Do not reveal the exact fix, exact replacement text, or project-only selector/id/value on the first help turn. Prefer conceptual references like "the selector for the photo you want to show" or "the id in your HTML" unless the exact value appears in the student's message, the level instructions, or levelProgress, or the student explicitly asks for the answer.
- If the student has already tried a hint, asks for a stronger hint, or shares a specific selector/error, you may become more direct while still avoiding full code unless asked.
- Do not suggest optional stretch features, extra enhancements, or "keep experimenting" next steps unless the level instructions ask for them.
- Do not tell students to save files, hard refresh, clear browser caches, open browser developer tools, press F12, or inspect the browser console. Files auto-save and the preview/debug UI is part of the lab.
- For debugging help, point to project code relationships such as selectors, ids, linked scripts, event listeners, and likely files.
- If the student reports that the fix works or that they are done, do not congratulate them and suggest more work. Tell them to request a review of their work if they are ready to do so.`;

const INSTRUCTION_FOCUS_GUIDANCE_PROMPT = `Instruction-coach context:
- The app owns guide state and has provided the current instructional focus in instructionFocus.
- Use instructionFocus.guidanceDirective as the highest-priority teaching move for this response.
- Keep the response conversational and short. Do not dump the full instructions.
- If instructionFocus.didAdvance or didSelectOption is true, briefly acknowledge the student's message and continue from the new focus.
- Do not mark validation criteria complete. Validation review/progress remains the source of completion truth.
- Do not make or propose file edits unless the student explicitly asked Tutor to change the project.`;

const PYTHON_GUIDANCE_SYSTEM_PROMPT = `You are Python Lab Tutor, a supportive computer science tutor for students learning Python.

The student is asking a conceptual, how-to, debugging, project-navigation, or tutoring question. You can read their current Python project files, but you must not edit, create, delete, or propose file changes.

Rules:
- Return JSON only with shape { "message": "..." }.
- Do not propose file changes.
- Do not create or mention a Plans/PROJECT_PLAN.md planning proposal.
- Do not include code fences unless a small Python example is helpful.
- Write like a helpful lab partner sitting beside the student: warm, direct, and brief.
- Default to 2-5 short sentences or 2-3 tight bullets. If the answer needs steps, give only the next few steps, not a full lesson.
- Skip recap, praise padding, generic closers, and "let me know" endings. End on the concrete next action or one focused question.
- Use lightweight Markdown for readability: short paragraphs, bullets or numbered lists for steps/questions, and inline code for file names, functions, variables, or errors.
- Help with Python concepts such as variables, conditionals, loops, lists, dictionaries, functions, imports, strings, \`input()\`, \`print()\`, stdout, and runtime errors.
- For debugging questions, explain the likely cause and point to relevant lines, variables, functions, or files from the provided project context when possible.
- For "where is this code?" or "what should I tweak?" questions, point to likely files, functions, variables, or snippets from the project context instead of describing an edit plan.
- If useful, reference the student's current project context as an example, but make clear that no project files need to change.
- Stay within Python and general programming concepts.`;

const GUIDANCE_SYSTEM_PROMPTS: Record<TutorGuidanceProfile, string> = {
  web: WEB_GUIDANCE_SYSTEM_PROMPT,
  python: PYTHON_GUIDANCE_SYSTEM_PROMPT,
};

const CURRICULUM_WEB_BROWSER_TROUBLESHOOTING_LINE_PATTERN =
  /\b(save(d|s)?|hard refresh|refreshing with|ctrl\s*\+\s*shift\s*\+\s*r|cache|caching|clear(ing)? cache|developer tools|devtools|\bF12\b|browser'?s? console|open (your )?browser)\b/i;
const CURRICULUM_WEB_STRETCH_LINE_PATTERN =
  /\b(new features?|extra features?|keep experimenting|if you want to keep learning|in the future|try adding)\b/i;
const GUIDANCE_HINT_REQUEST_PATTERN =
  /\b(hint|nudge|what should i check|what do i check|stuck|help|walk me through|what am i supposed to do|what should i do|why isn'?t|why is|debug)\b/i;
const EXPLICIT_ANSWER_REQUEST_PATTERN =
  /\b(tell me the exact|exact fix|give me the answer|show me the answer|just tell me|what should it be|what selector|which selector|what id|which id)\b/i;

function buildGuidanceSystemPrompt(
  guidanceProfile: TutorGuidanceProfile,
  supportContext: TutorSupportContext,
  additionalSystemPrompt?: string,
  instructionFocus?: InstructionFocusContext,
) {
  const basePrompt = GUIDANCE_SYSTEM_PROMPTS[guidanceProfile];
  const contextPrompt =
    guidanceProfile === "web" && supportContext === "curriculum-level"
      ? `\n\n${CURRICULUM_WEB_GUIDANCE_PROMPT}`
      : "";
  const prototypePrompt = additionalSystemPrompt?.trim()
    ? `\n\nAdditional prototype instructions:\n${additionalSystemPrompt.trim()}`
    : "";

  const instructionFocusPrompt = instructionFocus
    ? `\n\n${INSTRUCTION_FOCUS_GUIDANCE_PROMPT}`
    : "";

  return `${basePrompt}${contextPrompt}${instructionFocusPrompt}${prototypePrompt}`;
}

function buildGuidanceDisclosurePolicy(
  message: string,
  supportContext: TutorSupportContext,
  levelInstructionsMarkdown?: string,
  levelProgress?: LevelProgressSnapshot,
) {
  if (supportContext !== "curriculum-level") return undefined;

  const shouldNudge =
    Boolean(levelInstructionsMarkdown?.trim() || levelProgress) &&
    GUIDANCE_HINT_REQUEST_PATTERN.test(message) &&
    !EXPLICIT_ANSWER_REQUEST_PATTERN.test(message);

  if (!shouldNudge) return undefined;

  return {
    style: "socratic-nudge",
    maxObservationQuestions: 1,
    revealPolicy: [
      "Start with the level goal in student-friendly language.",
      "Give one small next check or at most a short checklist.",
      "Ask one focused observation question, not a chain of questions.",
      "Avoid naming exact project-only selectors, ids, values, or replacement text unless they appear in the student's message, level instructions, or levelProgress.",
      "Do not provide full code or the exact fix unless the student explicitly asks for the answer.",
    ],
  };
}

function normalizeContextText(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function levelProgressContextText(levelProgress?: LevelProgressSnapshot) {
  if (!levelProgress) return "";
  return [
    levelProgress.title,
    levelProgress.nextStep,
    ...(levelProgress.requirements ?? []),
    ...levelProgress.passedCriteria.map((item) => `${item.label} ${item.detail ?? ""}`),
    ...levelProgress.incompleteCriteria.map((item) => `${item.label} ${item.detail ?? ""}`),
  ].join(" ");
}

function lineIsGroundedInLevelContext(
  line: string,
  levelInstructionsMarkdown: string,
  levelProgress?: LevelProgressSnapshot,
) {
  const normalizedLine = normalizeContextText(line);
  const normalizedContext = normalizeContextText(
    `${levelInstructionsMarkdown} ${levelProgressContextText(levelProgress)}`,
  );
  if (!normalizedLine || !normalizedContext) return false;

  const lineWords = normalizedLine
    .split(" ")
    .filter((word) => word.length >= 4);

  return lineWords.some((word, index) => {
    if (!normalizedContext.includes(word)) return false;
    const nextWord = lineWords[index + 1];
    return !nextWord || normalizedContext.includes(`${word} ${nextWord}`);
  });
}

function sanitizeCurriculumWebGuidance(
  message: string,
  levelInstructionsMarkdown = "",
  levelProgress?: LevelProgressSnapshot,
) {
  const lines = message
    .split("\n")
    .filter((line) => {
      if (CURRICULUM_WEB_BROWSER_TROUBLESHOOTING_LINE_PATTERN.test(line)) {
        return false;
      }

      if (!CURRICULUM_WEB_STRETCH_LINE_PATTERN.test(line)) {
        return true;
      }

      return lineIsGroundedInLevelContext(line, levelInstructionsMarkdown, levelProgress);
    });
  const sanitized = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();

  return sanitized || "Focus on the level instructions and current project code. Check the relevant selector, id, or file, then use the level check when it works.";
}

function alignGuidanceWithProjectContext(
  message: string,
  hasProjectContext: boolean,
) {
  if (!hasProjectContext) return message;
  return message
    .replace(/\bI can'?t see your exact labels,?\s*but\s*/gi, "I can use your current project context to help check the labels. ")
    .replace(/\bI can'?t see your exact (code|file|files|project|selectors|labels)\b/gi, "I can use your current project context")
    .replace(/\bI don'?t have access to your (code|file|files|project|selectors|labels)\b/gi, "I can use your current project context");
}

function buildGuidanceMessages({
  message,
  conversation,
  files,
  additionalSystemPrompt,
  levelInstructionsMarkdown,
  levelProgress,
  instructionFocus,
  guidanceProfile,
  supportContext,
}: {
  message: string;
  conversation: ChatMessage[];
  files: FileItem[];
  additionalSystemPrompt?: string;
  levelInstructionsMarkdown?: string;
  levelProgress?: LevelProgressSnapshot;
  instructionFocus?: InstructionFocusContext;
  guidanceProfile: TutorGuidanceProfile;
  supportContext: TutorSupportContext;
}): TutorChatMessage[] {
  const analysis = analyzeProject(files);
  const context = packTutorContext(analysis, message, 12000);
  const imageInputs = buildConversationImageInputs(conversation);
  const payload = {
    userMessage: message,
    projectContext: context,
    levelInstructionsMarkdown: levelInstructionsMarkdown?.trim() || undefined,
    levelProgress,
    instructionFocus,
    guidanceDisclosurePolicy: buildGuidanceDisclosurePolicy(
      message,
      supportContext,
      levelInstructionsMarkdown,
      levelProgress,
    ),
    conversation: buildConversationContext(conversation).slice(-4),
    tutorSupportContext: supportContext,
  };
  const systemPrompt = buildGuidanceSystemPrompt(
    guidanceProfile,
    supportContext,
    additionalSystemPrompt,
    instructionFocus,
  );
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

export async function runTutorGuidance({
  message,
  conversation,
  files,
  additionalSystemPrompt = "",
  levelInstructionsMarkdown = "",
  levelProgress,
  instructionFocus,
  guidanceProfile = "web",
  supportContext = "standalone-project",
  provider = openAiTutorProvider,
}: {
  message: string;
  conversation: ChatMessage[];
  files: FileItem[];
  additionalSystemPrompt?: string;
  levelInstructionsMarkdown?: string;
  levelProgress?: LevelProgressSnapshot;
  instructionFocus?: InstructionFocusContext;
  guidanceProfile?: TutorGuidanceProfile;
  supportContext?: TutorSupportContext;
  provider?: TutorGuidanceProvider;
}): Promise<TutorEditResult> {
  const hasProjectContext = files.length > 0;
  if (provider === openAiTutorProvider && !getTutorApiKey().trim()) {
    return {
      message: MISSING_TUTOR_API_KEY_MESSAGE,
      changes: [],
    };
  }

  const response = await provider.requestGuidance(buildGuidanceMessages({
    message,
    conversation,
    files,
    additionalSystemPrompt,
    levelInstructionsMarkdown,
    levelProgress,
    instructionFocus,
    guidanceProfile,
    supportContext,
  }));

  if (!response?.message?.trim()) {
    return {
      message: MISSING_TUTOR_API_KEY_MESSAGE,
      changes: [],
    };
  }

  return {
    message: alignGuidanceWithProjectContext(
      guidanceProfile === "web" && supportContext === "curriculum-level"
        ? sanitizeCurriculumWebGuidance(
            response.message.trim(),
            levelInstructionsMarkdown,
            levelProgress,
          )
        : response.message.trim(),
      hasProjectContext,
    ),
    changes: [],
  };
}
