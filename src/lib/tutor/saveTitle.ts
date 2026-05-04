const MAX_SAVE_TITLE_LENGTH = 72;

export function normalizeTutorSaveTitle(value?: string) {
  const firstSentence = value?.match(/^[^.!?\n]+[.!?]?/)?.[0]?.trim();
  if (!firstSentence) return undefined;

  const normalized = firstSentence
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return undefined;

  if (normalized.length <= MAX_SAVE_TITLE_LENGTH) {
    return normalized.replace(/[.!?]$/, "");
  }

  return `${normalized.slice(0, MAX_SAVE_TITLE_LENGTH - 3).trimEnd()}...`;
}
