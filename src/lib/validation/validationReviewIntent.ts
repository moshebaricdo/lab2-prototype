const NEGATED_READINESS_PATTERN =
  /\b(not|don't|do not|isn'?t|aren'?t|wasn'?t|haven'?t|hasn'?t)\b[^.?!]*(ready|done|finished|complete|completed|continue|move on)\b/i;

const TROUBLESHOOTING_PATTERN =
  /\b(stuck|debug|hint|help me|need help|having trouble|trouble|error|not working|didn'?t work|doesn'?t work|isn'?t working|still broken|still not|still doesn'?t|still isn'?t)\b/i;

const REVIEW_READINESS_PATTERNS = [
  /\b(check|review|validate|grade)\s+(my|the|this|our)?\s*(work|project|page|level|answer|solution)\b/i,
  /\b(am i|are we|is this|does this|did i|did we)\s+(done|finished|complete|completed|ready|right|correct)\b/i,
  /\b(i think|i feel like|pretty sure|i'?m pretty sure|i guess)\s+(i|we)\s+(did it|finished|completed|am done|are done|got it)\b/i,
  /\b(i|we)\s+(did it|finished|completed|am done|are done|got it)\b/i,
  /\b(i'?m|i am|we'?re|we are)\s+(done|finished|complete|ready)\b/i,
  /\b(it|that|this)\s+(works|worked|is working|fixed it)\b/i,
  /\b(i|we)\s+(fixed|solved|updated)\s+(it|this|that)\b/i,
  /\b(i|we)\s+(fixed|solved|updated|finished|completed)\s+(the|my|our)\s+[^.?!]{1,80}\b/i,
  /\b(i|we)\s+(fixed|solved|updated)\s+.{1,100}?\b(can|could|please)?\s*(you\s+)?(check|review|validate)\b/i,
  /\b(i|we)\s+(got|have)\s+it\s+working\b/i,
  /\b(can|could|may|should)\s+i\s+(continue|move on|go to the next|go next)\b/i,
  /\bready\s+(for|to)\s+(a\s+)?(review|check|assessment|continue|move on)\b/i,
  /\b(check my work|check our work|am i good to continue|can i continue)\b/i,
];

export function isValidationReviewIntent(message: string) {
  const normalized = message.replace(/\s+/g, " ").trim();
  if (!normalized || NEGATED_READINESS_PATTERN.test(normalized)) return false;
  if (TROUBLESHOOTING_PATTERN.test(normalized)) return false;
  return REVIEW_READINESS_PATTERNS.some((pattern) => pattern.test(normalized));
}
