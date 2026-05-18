import type { TutorEditResult } from "./types";
import type { TutorRequestIntent } from "./requestIntent";

const GENERIC_CLOSER_LINE_PATTERN =
  /^\s*(let me know|tell me|ask me|feel free|happy to help|i'?m here)\b.*$/i;
const GENERIC_NEXT_HELP_LINE_PATTERN =
  /^\s*(if you want|if you'?d like|if needed),?\s+(i|we)\s+can\b.*$/i;
const SENTENCE_SPLIT_PATTERN = /(?<=[.!?])\s+/;
const CODEGEN_MAX_MESSAGE_LENGTH = 520;
const GUIDANCE_MAX_MESSAGE_LENGTH = 1400;

interface FinalizeTutorResponseOptions {
  intent: TutorRequestIntent;
  requestMessage: string;
}

function normalizeMessage(message: string) {
  return message
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function removeGenericClosers(message: string) {
  return message
    .split("\n")
    .filter((line) =>
      !GENERIC_CLOSER_LINE_PATTERN.test(line) &&
      !GENERIC_NEXT_HELP_LINE_PATTERN.test(line)
    )
    .join("\n");
}

function truncateSentence(sentence: string, limit: number) {
  const trimmed = sentence.trim();
  return trimmed.length <= limit ? trimmed : `${trimmed.slice(0, limit - 3).trim()}...`;
}

function changedFileSummary(result: TutorEditResult) {
  const fileNames = [...new Set(result.changes.map((change) => change.fileName))];
  if (fileNames.length === 0) return "the project files";
  if (fileNames.length === 1) return `\`${fileNames[0]}\``;
  if (fileNames.length === 2) return `\`${fileNames[0]}\` and \`${fileNames[1]}\``;
  return `${fileNames.slice(0, 2).map((fileName) => `\`${fileName}\``).join(", ")}, and ${fileNames.length - 2} more files`;
}

function firstUsefulSentence(message: string) {
  const compact = message.replace(/\n+/g, " ");
  return compact.split(SENTENCE_SPLIT_PATTERN).find((sentence) =>
    sentence.trim() &&
    !/^(sure|great|absolutely|nice|okay|ok)[,!.\s]/i.test(sentence.trim())
  )?.trim();
}

function firstCheckSentence(message: string) {
  const compact = message.replace(/\n+/g, " ");
  return compact.split(SENTENCE_SPLIT_PATTERN).find((sentence) =>
    /\b(test|check|preview|review|diff|accept|keyboard|hover|focus)\b/i.test(sentence)
  )?.trim();
}

function condenseCodegenMessage(
  message: string,
  result: TutorEditResult,
  requestMessage: string,
) {
  if (message.length <= CODEGEN_MAX_MESSAGE_LENGTH || result.changes.length === 0) {
    return message;
  }

  const files = changedFileSummary(result);
  const intro = firstUsefulSentence(message) ??
    `I updated ${files} for your request: "${truncateSentence(requestMessage, 90)}".`;
  const check = firstCheckSentence(message);
  const review = `Review the diff for ${files}, then accept it if it looks right.`;

  return [
    truncateSentence(intro, 220),
    check && check !== intro ? truncateSentence(check, 180) : review,
  ].join("\n\n");
}

function condenseGuidanceMessage(message: string) {
  if (message.length <= GUIDANCE_MAX_MESSAGE_LENGTH || message.includes("```")) {
    return message;
  }

  const paragraphs = message.split(/\n{2,}/).filter((paragraph) => paragraph.trim());
  if (paragraphs.length <= 3) return message;
  return paragraphs.slice(0, 3).join("\n\n");
}

export function finalizeTutorResponse(
  result: TutorEditResult,
  options: FinalizeTutorResponseOptions,
): TutorEditResult {
  const cleanedMessage = normalizeMessage(removeGenericClosers(result.message));
  const message = options.intent === "guidance"
    ? condenseGuidanceMessage(cleanedMessage)
    : condenseCodegenMessage(cleanedMessage, result, options.requestMessage);

  return {
    ...result,
    message: normalizeMessage(message) || result.message,
  };
}
