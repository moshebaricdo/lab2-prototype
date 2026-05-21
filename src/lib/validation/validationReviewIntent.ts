const NEGATED_READINESS_PATTERN =
  /\b(not|don't|do not|isn'?t|aren'?t|wasn'?t|haven'?t|hasn'?t)\b[^.?!]*(ready|done|finished|complete|completed|continue|move on)\b/i;

const TROUBLESHOOTING_PATTERN =
  /\b(stuck|debug|hint|help me|need help|having trouble|trouble|error|not working|didn'?t work|doesn'?t work|isn'?t working|still broken|still not|still doesn'?t|still isn'?t)\b/i;

const READINESS_HELP_PATTERN =
  /\b(how\s+(do|can|would|should)\s+(i|we)\s+know|what\s+(do|should)\s+(i|we)\s+(need|have)\s+to\s+do|what'?s\s+left|what\s+is\s+left)\b[^.?!]*(ready|done|finished|complete|completed|continue|move on)\b/i;

const READINESS_MODIFIER_PATTERN =
  "(actually\\s+|basically\\s+|finally\\s+|just\\s+|already\\s+|all\\s+|totally\\s+|really\\s+|definitely\\s+|completely\\s+|officially\\s+)?";

const REVIEW_READINESS_PATTERNS = [
  /^\s*(all\s+)?(done|finished|complete|completed|ready)\s*(now|please)?\s*[.!?]*\s*$/i,
  /\b(check|review|validate|grade)\s+(my|the|this|our)?\s*(work|project|page|level|answer|solution)\b/i,
  /\b(am i|are we|is this|does this|did i|did we)\s+(done|finished|complete|completed|ready|right|correct)\b/i,
  new RegExp(`\\b(i think|i feel like|pretty sure|i'?m pretty sure|i guess)\\s+(i|we)\\s+${READINESS_MODIFIER_PATTERN}(did it|finished|completed|am done|are done|got it)\\b`, "i"),
  new RegExp(`\\b(i|we)\\s+${READINESS_MODIFIER_PATTERN}(did it|finished|completed|am done|are done|got it)\\b`, "i"),
  new RegExp(`\\b(i'?m|i am|we'?re|we are)\\s+${READINESS_MODIFIER_PATTERN}(done|finished|complete|ready)\\b`, "i"),
  /\b(it|that|this)\s+(works|worked|is working|fixed it)\b/i,
  /\b(it|that|this)\s+(seems|looks|appears)\s+to\s+(work|be working)\b/i,
  /\b(i think|looks like|seems like)\s+(it|that|this)\s+(did it|fixed it|worked|works)\b/i,
  /\b(i|we)\s+(fixed|solved|updated)\s+(it|this|that)\b/i,
  /\b(i|we)\s+(fixed|solved|updated|finished|completed)\s+(the|my|our)\s+[^.?!]{1,80}\b/i,
  /\b(i|we)\s+(fixed|solved|updated)\s+.{1,100}?\b(can|could|please)?\s*(you\s+)?(check|review|validate)\b/i,
  /\b(i|we)\s+(got|have)\s+it\s+working\b/i,
  /\b(i|we)\s+(got|have)\s+(?!been\b)[^.?!]{1,80}?\s+working\b/i,
  /\b(the|my|our)\s+[^.?!]{1,80}?\s+(works|worked|is working|is fixed)\b/i,
  /\b(can|could|may|should)\s+i\s+(continue|move on|go to the next|go next)\b/i,
  /\bready\s+(for|to)\s+(a\s+)?(review|check|assessment|continue|move on)\b/i,
  /\b(check my work|check our work|am i good to continue|can i continue)\b/i,
];

export function isValidationReviewIntent(message: string) {
  const normalized = message.replace(/\s+/g, " ").trim();
  if (!normalized || NEGATED_READINESS_PATTERN.test(normalized)) return false;
  if (READINESS_HELP_PATTERN.test(normalized)) return false;
  if (TROUBLESHOOTING_PATTERN.test(normalized)) return false;
  return REVIEW_READINESS_PATTERNS.some((pattern) => pattern.test(normalized));
}
