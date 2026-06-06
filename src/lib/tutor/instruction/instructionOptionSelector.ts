import {
  openAiTutorProvider,
  type TutorInstructionOptionSelectionProvider,
} from "../provider/openAiProvider";
import { getTutorApiKey } from "../../../hooks/useTutorApiSettings";
import type { InstructionOption } from "../../../types/tutor";
import type { TutorChatMessage } from "../types";

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Deterministic match for one focus option: label words all in the message,
 * message words all in label+prompt (short picks like "nav links"), or a
 * distinctive prompt word overlap.
 */
export function matchInstructionOptionMessage(
  message: string,
  option: InstructionOption,
): boolean {
  const normalizedMessage = normalizeText(message);
  const messageWords = normalizedMessage.split(" ").filter((word) => word.length > 2);
  const optionText = normalizeText(`${option.label} ${option.prompt}`);

  const labelWords = normalizeText(option.label)
    .split(" ")
    .filter((word) => word.length > 2);
  if (labelWords.length > 0 && labelWords.every((word) => normalizedMessage.includes(word))) {
    return true;
  }

  if (messageWords.length > 0 && messageWords.every((word) => optionText.includes(word))) {
    return true;
  }

  const promptWords = normalizeText(option.prompt)
    .split(" ")
    .filter((word) => word.length >= 5)
    .slice(0, 8);
  return promptWords.some((word) => normalizedMessage.includes(word));
}

/**
 * Deterministic word-overlap match: an option whose label words are all present,
 * whose label contains every word in a short student reply, or which shares a
 * distinctive prompt word. Returns null when nothing clearly matches (the
 * ambiguous case the model is meant to resolve).
 */
export function matchOptionByOverlap(
  message: string,
  options: InstructionOption[],
): InstructionOption | null {
  return options.find((option) => matchInstructionOptionMessage(message, option)) ?? null;
}

const OPTION_SELECTION_SYSTEM_PROMPT = `You help an open-ended coding lab understand which focus a student is choosing.

The student is working on a level with several focus areas they may pick in any order. Given the student's latest message and the list of focus areas, decide which one (if any) they are choosing to work on right now.

Judge by meaning, not by shared words. A student may describe a focus in their own words, name something concrete that belongs to one focus, or paraphrase it. If the message clearly points at one focus, return its id. If the message is a general question, a greeting, off-topic, or genuinely ambiguous between focuses, return "" (empty) — do not guess.

Return JSON only:
{
  "optionId": "exact id from the input, or \"\" if none clearly applies",
  "confidence": "high|low",
  "reason": "short phrase"
}`;

function buildOptionSelectionMessages(
  message: string,
  options: InstructionOption[],
): TutorChatMessage[] {
  const payload = {
    studentMessage: message,
    focusAreas: options.map((option) => ({
      id: option.id,
      label: option.label,
      prompt: option.prompt,
    })),
  };
  return [
    { role: "system", content: OPTION_SELECTION_SYSTEM_PROMPT },
    { role: "user", content: JSON.stringify(payload) },
  ];
}

/**
 * Resolves which open-ended focus a student message selects. Uses deterministic
 * word-overlap first (fast, and the no-key behavior); only when that is
 * ambiguous and a key is present does it ask the model to read intent. Falls
 * back to the overlap result (null) on any model error or invalid output.
 */
export async function selectInstructionOption({
  message,
  options,
  provider = openAiTutorProvider,
}: {
  message: string;
  options: InstructionOption[];
  provider?: TutorInstructionOptionSelectionProvider;
}): Promise<InstructionOption | null> {
  if (options.length === 0) return null;

  const overlapMatch = matchOptionByOverlap(message, options);
  if (overlapMatch) return overlapMatch;

  if (provider === openAiTutorProvider && !getTutorApiKey().trim()) return null;

  let response: Awaited<ReturnType<TutorInstructionOptionSelectionProvider["requestInstructionOptionSelection"]>> = null;
  try {
    response = await provider.requestInstructionOptionSelection(
      buildOptionSelectionMessages(message, options),
    );
  } catch {
    return null;
  }

  const optionId = response?.optionId?.trim();
  if (!optionId) return null;
  return options.find((option) => option.id === optionId) ?? null;
}
