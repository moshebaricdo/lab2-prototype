import type { TutorValidatedChange } from "../types";

const GENERIC_EDIT_MESSAGE_PATTERNS = [
  /^\s*(done|updated|fixed)\.?\s*$/i,
  /^\s*i (made|applied|finished) (the )?(requested )?(changes|edits|update|project edit)\.?\s*$/i,
  /^\s*i made (a set of )?project edits for you to review\.?\s*$/i,
  /^\s*i updated the project\.?\s*$/i,
  /^\s*updated the project\.?\s*$/i,
];

function isGenericEditMessage(message: string) {
  const normalized = message.replace(/\s+/g, " ").trim();
  return !normalized || GENERIC_EDIT_MESSAGE_PATTERNS.some((pattern) => pattern.test(normalized));
}

function changedFileSummary(changes: TutorValidatedChange[]) {
  const fileNames = [...new Set(changes.map((change) => change.fileName))];
  if (fileNames.length === 0) return "the project files";
  if (fileNames.length === 1) return `\`${fileNames[0]}\``;
  if (fileNames.length === 2) return `\`${fileNames[0]}\` and \`${fileNames[1]}\``;
  return `${fileNames.slice(0, 2).map((fileName) => `\`${fileName}\``).join(", ")}, and ${fileNames.length - 2} more files`;
}

function requestSummary(requestMessage: string) {
  const normalized = requestMessage.replace(/\s+/g, " ").trim();
  if (!normalized) return "your request";
  return normalized.length > 90 ? `${normalized.slice(0, 87)}...` : normalized;
}

export function summarizeTutorEditResponse({
  responseMessage,
  requestMessage,
  changes,
}: {
  responseMessage?: string;
  requestMessage: string;
  changes: TutorValidatedChange[];
}) {
  const trimmedMessage = responseMessage?.trim() ?? "";
  if (!isGenericEditMessage(trimmedMessage)) {
    return trimmedMessage;
  }

  const files = changedFileSummary(changes);
  return `I updated ${files} for your request: "${requestSummary(requestMessage)}". Review the diff to see the exact changes and decide whether to keep them.`;
}
