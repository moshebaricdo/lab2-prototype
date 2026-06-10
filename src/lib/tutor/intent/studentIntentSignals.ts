/**
 * Shared lexicon and predicates for reading student-message intent.
 *
 * Several runners independently re-detected the same intents (edit verbs,
 * concept questions, "I'm done / it works", "I'm stuck / why isn't this
 * working", vague edit goals) with divergent ad-hoc regexes. When a synonym was
 * added in one place it drifted out of sync with the others, which produced a
 * recurring class of phrasing bugs. This module is the single home for those
 * vocabularies so the next "add a synonym" fix lands once.
 *
 * Scope note: this is deliberately a deterministic vocabulary, not a classifier.
 * Semantic routing (Check My Work, guidance vs edit) lives in model classifiers.
 * Keep predicates here for coach/focus-pick helpers until those paths migrate too.
 */

/**
 * Canonical edit-action verbs. Exposed as both an array (for reuse/inspection)
 * and a regex alternation group string for callers that interpolate it into
 * larger sentence-frame patterns (e.g. `help me <verb>`, `<verb> the button`).
 */
export const EDIT_VERBS = [
  "add",
  "adjust",
  "build",
  "change",
  "create",
  "delete",
  "edit",
  "fix",
  "generate",
  "implement",
  "improve",
  "insert",
  "make",
  "modify",
  "move",
  "polish",
  "refine",
  "remove",
  "replace",
  "resize",
  "restyle",
  "style",
  "update",
  "use",
  "wire",
] as const;

/** Regex alternation group, including the surrounding parens, e.g. `(add|adjust|...)`. */
export const EDIT_VERB_GROUP = `(${EDIT_VERBS.join("|")})`;

/**
 * Subjective quality goals that warrant edit-options clarification when the
 * student asks for a direct edit without naming a concrete CSS/HTML change.
 */
export const VAGUE_EDIT_QUALITY_TERMS = [
  "better",
  "best",
  "exciting",
  "nicer",
  "nice",
  "cooler",
  "cool",
  "pop",
  "fun",
  "funner",
  "cleaner",
  "clean",
  "modern",
  "professional",
  "polished",
  "polish",
  "refine",
  "refining",
  "interesting",
  "prettier",
  "pretty",
  "awesome",
  "amazing",
  "great",
  "improve",
  "improve it",
  "improve this",
  "improve that",
  "make it look good",
  "look better",
  "stand out",
  "eye-catching",
  "eye catching",
  "engaging",
  "dynamic",
  "lively",
  "vibrant",
] as const;

const VAGUE_EDIT_QUALITY_PATTERN = new RegExp(
  `\\b(${VAGUE_EDIT_QUALITY_TERMS.map((term) =>
    term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+"),
  ).join("|")})\\b`,
  "i",
);

const CONCRETE_EDIT_DIRECTIVE_PATTERN =
  /\b(blue|red|green|yellow|orange|purple|pink|black|white|gray|grey|teal|navy|#[0-9a-f]{3,8}\b|rgb\(|hsl\(|color|colour|background|font|fontsize|font-size|spacing|padding|margin|border|radius|shadow|hover|focus|visited|underline|transition|animation|animate|column|columns|row|rows|grid|flex|width|height|px|rem|em|%|selector|\.[a-z][\w-]*|#[a-z][\w-]*|index\.html|style\.css|script\.js|javascript|\bjs\b|click|toggle|dropdown|modal|2\s*column|two\s*column|three\s*column|left|right|center|align|wrap|gap|padding-top|margin-top|outline|focus-visible|aria|label|caption|copy|text|images?|photo|upload|src=|below|above|under|beneath)\b/i;

/** Counts, placement, or content hints that make a feature-add specific enough to edit directly. */
const CONCRETE_FEATURE_SPEC_PATTERN =
  /\b(\d+\s+(card|cards|column|columns|link|links|item|items|row|rows|button|buttons|section|sections)|with\s+(images?|titles?|headings?|links?|icons?)|below\s+the|above\s+the|under\s+the)\b/i;

const COMPLETION_STATUS_IN_FOCUS_PATTERN =
  /\b(are|is|was|were)\s+(done|finished|complete|completed|ready)\b/i;

/** Bare "I'm done / finished / ready" — focus-pick guard only, not validation routing. */
const BARE_COMPLETION_PATTERN =
  /\b(i'?m|i am)\s+(done|finished|ready)\b|\b(i'?m|i am)\s+finished\s+with\b/i;

const CONCEPT_QUESTION_PATTERN =
  /\b(what is|what'?s|what are|define|meaning of|i don'?t understand|i don'?t know|can you explain)\b/i;

const EXPLICIT_ANSWER_REQUEST_PATTERN =
  /\b(tell me the exact|exact fix|give me the answer|show me the answer|just tell me|what should it be|what selector|which selector|what id|which id)\b/i;

const HELP_REQUEST_PATTERN =
  /\b(why|explain|debug|help|hint|stuck|what should|how do|how does|how can|how would|how should|walk me through)\b/i;

const SUCCESS_REPORT_PATTERN =
  /\b(worked|works now|it works|fixed it|that fixed|shows? now|appears? now|got it working)\b/i;

const CONTINUE_REQUEST_PATTERN =
  /\b(check my work|review my work|ready to continue|am i done|can i continue)\b/i;

const AFFIRMATION_PATTERN =
  /^\s*(yes|yeah|yep|yup|sure|ok|okay|k|sounds good|sounds great|please|absolutely|definitely|of course|let'?s do it|let'?s go|go for it|go ahead|do it|please do|i'?m ready|ready)\b[\s,.!]*(please|sure|do it|go ahead)?[\s,.!]*$/i;

/** The student is asking what a concept means ("what is a promise?", "define X"). */
export function mentionsConcept(message: string) {
  return CONCEPT_QUESTION_PATTERN.test(message);
}

/** The student explicitly wants the exact answer/fix ("just tell me", "what selector"). */
export function asksForExplicitAnswer(message: string) {
  return EXPLICIT_ANSWER_REQUEST_PATTERN.test(message);
}

/** The student is asking Tutor for help/debugging ("why isn't this working?", "I'm stuck"). */
export function mentionsHelpRequest(message: string) {
  return HELP_REQUEST_PATTERN.test(message);
}

/**
 * The student is directing a question at Tutor — a help/debug ask or a concept
 * question — rather than reporting progress.
 */
export function asksTutorAQuestion(message: string) {
  return mentionsHelpRequest(message) || mentionsConcept(message);
}

/** The student reports their change worked ("it works now", "fixed it"). */
export function reportsSuccess(message: string) {
  return SUCCESS_REPORT_PATTERN.test(message);
}

/** The student is asking to move on / be checked ("am I done?", "can I continue?"). */
export function asksToContinue(message: string) {
  return CONTINUE_REQUEST_PATTERN.test(message);
}

/**
 * The whole message is a bare affirmation ("yes", "sure", "ok", "go ahead").
 * Used to confirm something Tutor just offered (e.g. "yes" after "want me to
 * run a review?"). Anchored to the full message so "yes but why..." does not
 * count as a plain confirmation.
 */
export function isAffirmation(message: string) {
  return AFFIRMATION_PATTERN.test(message);
}

/** The student names a subjective quality goal without a concrete CSS/HTML directive. */
export function hasVagueEditQualityGoal(message: string) {
  return VAGUE_EDIT_QUALITY_PATTERN.test(message.trim());
}

/** The student names a concrete styling, layout, feature spec, or file/selector directive. */
export function hasConcreteEditDirective(message: string) {
  const trimmed = message.trim();
  return CONCRETE_EDIT_DIRECTIVE_PATTERN.test(trimmed) ||
    CONCRETE_FEATURE_SPEC_PATTERN.test(trimmed);
}

/**
 * Completion phrasing that should not be treated as an open-ended focus pick
 * ("I'm finished with the links" must not select the nav-links focus).
 */
export function mentionsCompletionStatus(message: string) {
  return COMPLETION_STATUS_IN_FOCUS_PATTERN.test(message.trim());
}

/** Whole-message completion phrasing ("I'm done", "I'm finished with the links"). */
export function mentionsBareCompletion(message: string) {
  return BARE_COMPLETION_PATTERN.test(message.trim());
}

/**
 * Shared readiness/completion guard for focus-pick routing and instruction coach.
 * Composes the conservative validation gate with lighter progress signals.
 */
export function messageIndicatesCompletionOrReadiness(message: string) {
  const trimmed = message.trim();
  if (!trimmed) return false;
  if (reportsSuccess(trimmed) || asksToContinue(trimmed)) return true;
  if (mentionsBareCompletion(trimmed)) return true;
  if (mentionsCompletionStatus(trimmed)) return true;
  return false;
}
