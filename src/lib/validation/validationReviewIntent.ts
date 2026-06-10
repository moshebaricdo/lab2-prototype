const NEGATED_READINESS_PATTERN =
  /\b(not|don't|do not|isn'?t|aren'?t|wasn'?t|haven'?t|hasn'?t)\b[^.?!]*(ready|done|finished|complete|completed|continue|move on)\b/i;

const TROUBLESHOOTING_PATTERN =
  /\b(stuck|debug|hint|help me|need help|having trouble|trouble|error|broken|not working|didn'?t work|doesn'?t work|isn'?t working|still broken|still not|still doesn'?t|still isn'?t)\b/i;

const READINESS_HELP_PATTERN =
  /\b(how\s+(do|can|would|should)\s+(i|we)\s+know|what\s+(do|should)\s+(i|we)\s+(need|have)\s+to\s+do|what'?s\s+left|what\s+is\s+left)\b[^.?!]*(ready|done|finished|complete|completed|continue|move on)\b/i;

/** Safety guards — not semantic readiness detection. */
export function hasHardSkipValidationReviewIntent(message: string) {
  const normalized = message.replace(/\s+/g, " ").trim();
  if (!normalized) return true;
  if (NEGATED_READINESS_PATTERN.test(normalized)) return true;
  if (READINESS_HELP_PATTERN.test(normalized)) return true;
  if (TROUBLESHOOTING_PATTERN.test(normalized)) return true;
  return false;
}
