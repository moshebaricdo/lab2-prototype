import { stripInstructionAuthoringMetadata } from "./instructionGuide";
import {
  openAiTutorProvider,
  type TutorInstructionOpeningProvider,
} from "./openAiProvider";
import {
  buildTutorOpening,
  formatTutorOpening,
} from "./tutorOpening";
import { getTutorApiKey } from "../../hooks/useTutorApiSettings";
import { MISSING_TUTOR_API_KEY_MESSAGE } from "./fallbackTutor";
import type {
  InstructionGuide,
  InstructionOpeningStepSummary,
  TutorOpening,
} from "../../types/tutor";
import type {
  TutorChatMessage,
  TutorInstructionOpeningResponse,
} from "./types";

const INSTRUCTION_OPENING_SYSTEM_PROMPT = `You are Web Lab Tutor writing the first chat message a student sees when they open a coding lab level. It is a warm, two-sentence-ish orientation, not a lecture.

The app shows "goal" and "success" together as the first paragraph and "firstMove" as the second paragraph, exactly as you write them. It uses your step summaries in a collapsed instructions drawer. Write every field as a finished, ready-to-display sentence.

Return JSON only with this shape:
{
  "tone": "debug|concept|creative|procedure",
  "goal": "one complete sentence naming what the student will do in this level",
  "success": "optional one complete sentence describing what 'done' or 'on track' looks like; use \"\" if the instructions do not make this clear",
  "firstMove": "one complete, inviting sentence telling the student the very first thing to try",
  "steps": [
    { "id": "exact-id-from-input", "shortLabel": "3-6 word label", "summary": "one plain sentence for the student" }
  ]
}

Voice and wording (this is the priority):
- Succinct: each sentence is one clear thought, roughly 8-20 words. No run-ons, no stacked clauses, no semicolons.
- Friendly and direct: speak to the student as "you" / "let's". Sound encouraging, never stiff or formal.
- Helpful: be concrete about this specific level instead of generic ("polish your nav links' hover states" beats "make things look nice").

Hard rules (avoid the common mistakes):
- Write standalone sentences. Do NOT start with filler scaffolding like "This level is about", "In this level", "Your goal is to", "Aim for a page where", or "You'll know you're on track when" — the app does not add any wrapper, so such phrases read awkwardly.
- Each field is exactly one sentence with normal capitalization and a single ending period (or "!" for firstMove). Never produce double punctuation like ".." and never capitalize a word mid-sentence.
- Faithfully summarize the supplied instructions; never invent steps, files, or classroom materials that are not in the text.
- Never echo raw worksheet labels like "1: Create a New Feature" or "Do This", and do not paste the instructions markdown.
- Include exactly one steps[] entry per supplied step/option id, in the same order, using the exact ids provided. For open-ended levels, steps may describe focus areas rather than a strict sequence.`;

function guideStepsPayload(guide: InstructionGuide) {
  if (guide.type === "linear") {
    return guide.steps.map((step) => ({
      id: step.id,
      title: step.title,
      prompt: step.prompt,
      intent: step.intent,
    }));
  }

  return guide.options.map((option) => ({
    id: option.id,
    label: option.label,
    prompt: option.prompt,
    intent: option.intent,
  }));
}

function buildInstructionOpeningMessages({
  instructionsMarkdown,
  guide,
}: {
  instructionsMarkdown: string;
  guide: InstructionGuide;
}): TutorChatMessage[] {
  const studentMarkdown = stripInstructionAuthoringMetadata(instructionsMarkdown);
  const payload = {
    guideType: guide.type,
    instructionsMarkdown: studentMarkdown,
    overview: guide.type === "linear" ? guide.overview : guide.goal,
    firstMoveHint: guide.type === "linear" ? guide.firstMove : undefined,
    constraints: guide.type === "choice-based" ? guide.constraints : undefined,
    steps: guideStepsPayload(guide),
  };

  return [
    { role: "system", content: INSTRUCTION_OPENING_SYSTEM_PROMPT },
    { role: "user", content: JSON.stringify(payload) },
  ];
}

function normalizeTone(value: unknown): TutorOpening["tone"] {
  if (value === "debug" || value === "concept" || value === "creative" || value === "procedure") {
    return value;
  }
  return "procedure";
}

function normalizeStepSummaries(
  guide: InstructionGuide,
  response: TutorInstructionOpeningResponse,
): InstructionOpeningStepSummary[] {
  const expected = guideStepsPayload(guide);
  const byId = new Map(
    (response.steps ?? [])
      .filter((step) => step.id?.trim())
      .map((step) => [step.id!.trim(), step]),
  );

  return expected.map((step, index) => {
    const matched = byId.get(step.id);
    const fallbackLabel =
      "label" in step && typeof step.label === "string"
        ? step.label
        : "title" in step && typeof step.title === "string"
          ? step.title
          : `Step ${index + 1}`;
    const fallbackSummary =
      "prompt" in step && typeof step.prompt === "string"
        ? step.prompt
        : fallbackLabel;

    return {
      id: step.id,
      shortLabel: matched?.shortLabel?.trim() || fallbackLabel.replace(/^\d+\s*:\s*/i, "").trim(),
      summary: matched?.summary?.trim() || fallbackSummary,
    };
  });
}

function normalizeOpeningSentence(value: string | undefined): string {
  if (!value) return "";
  const collapsed = value.replace(/\s+/g, " ").trim();
  if (!collapsed) return "";
  const deduped = collapsed
    .replace(/\.{2,}(?=\s|$)/g, ".")
    .replace(/\s+([.!?,;:])/g, "$1");
  return deduped.charAt(0).toUpperCase() + deduped.slice(1);
}

function buildOpeningFromResponse(
  guide: InstructionGuide,
  response: TutorInstructionOpeningResponse,
  stepSummaries: InstructionOpeningStepSummary[],
): TutorOpening {
  const goal = normalizeOpeningSentence(response.goal);
  const success = normalizeOpeningSentence(response.success);
  const firstMove = normalizeOpeningSentence(response.firstMove);

  return {
    tone: normalizeTone(response.tone),
    goal,
    success,
    firstMove,
    sourceSignature: `${guide.sourceSignature}:llm:${goal}:${success}:${firstMove}:${stepSummaries.map((step) => step.id).join(",")}`,
  };
}

/**
 * The LLM already returns finished, student-facing sentences, so the opening is
 * assembled by direct concatenation. Running it through the programmatic
 * tone templates would double-wrap it (e.g. "This level is about Polish ...").
 */
function formatLlmOpeningMessage(opening: TutorOpening): string {
  const firstParagraph = [opening.goal, opening.success]
    .filter(Boolean)
    .join(" ");
  return [firstParagraph, opening.firstMove].filter(Boolean).join("\n\n");
}

export function buildProgrammaticInstructionOpening(
  instructionsMarkdown: string,
  guide: InstructionGuide,
): {
  opening: TutorOpening;
  content: string;
  stepSummaries: InstructionOpeningStepSummary[];
} {
  const opening = buildTutorOpening(instructionsMarkdown, guide);
  const stepSummaries =
    guide.type === "linear"
      ? guide.steps.map((step) => ({
          id: step.id,
          shortLabel: step.title.replace(/^\d+\s*:\s*/i, "").trim(),
          summary: step.prompt && step.prompt !== step.title ? step.prompt : step.title,
        }))
      : guide.options.map((option) => ({
          id: option.id,
          shortLabel: option.label,
          summary: option.prompt,
        }));

  return {
    opening,
    content: formatTutorOpening(opening),
    stepSummaries,
  };
}

export async function runInstructionOpening({
  instructionsMarkdown,
  guide,
  provider = openAiTutorProvider,
}: {
  instructionsMarkdown: string;
  guide: InstructionGuide;
  provider?: TutorInstructionOpeningProvider;
}): Promise<{
  opening: TutorOpening;
  content: string;
  stepSummaries: InstructionOpeningStepSummary[];
}> {
  const apiKey = getTutorApiKey().trim();
  if (!apiKey) {
    throw new Error(MISSING_TUTOR_API_KEY_MESSAGE);
  }

  const response = await provider.requestInstructionOpening(
    buildInstructionOpeningMessages({ instructionsMarkdown, guide }),
  );

  if (!response?.goal?.trim() || !response.firstMove?.trim()) {
    return buildProgrammaticInstructionOpening(instructionsMarkdown, guide);
  }

  const stepSummaries = normalizeStepSummaries(guide, response);
  const opening = buildOpeningFromResponse(guide, response, stepSummaries);

  return {
    opening,
    content: formatLlmOpeningMessage(opening),
    stepSummaries,
  };
}
