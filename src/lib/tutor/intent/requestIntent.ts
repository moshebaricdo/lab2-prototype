import type { TutorSupportContext } from "../../../types/tutor";
import { EDIT_VERB_GROUP } from "./studentIntentSignals";

const EDIT_VERB_PATTERN = EDIT_VERB_GROUP;

export type TutorRequestIntent = "guidance" | "planning" | "edit";
export type TutorRequestIntentOverride = "auto" | "build" | "plan" | "help";

interface TutorRequestIntentContext {
  hasActivePlan?: boolean;
  lastAssistantAskedPlanningQuestion?: boolean;
  supportContext?: TutorSupportContext;
}

const DIRECT_EDIT_PATTERNS = [
  new RegExp(`^\\s*(please\\s+)?${EDIT_VERB_PATTERN}\\b`, "i"),
  new RegExp(`\\b(can you|could you|please|let's|lets)\\s+${EDIT_VERB_PATTERN}\\b`, "i"),
  new RegExp(`\\b(can you|could you|please)\\s+help\\s+(me|us)?\\s*(to\\s+)?${EDIT_VERB_PATTERN}\\b`, "i"),
  new RegExp(`\\bhelp\\s+(me|us)?\\s*(to\\s+)?${EDIT_VERB_PATTERN}\\b`, "i"),
  new RegExp(`\\b(i|we)\\s+(need|want|would like)\\s+(you|tutor)?\\s*(to\\s+)?${EDIT_VERB_PATTERN}\\b`, "i"),
  new RegExp(`\\binstruct\\s+tutor\\s+to\\s+${EDIT_VERB_PATTERN}\\b`, "i"),
  new RegExp(`\\b(instructions|directions|level)\\s+(say|says|ask|asks|tell|tells)\\s+.*\\b(tutor\\s+)?(to\\s+)?${EDIT_VERB_PATTERN}\\b`, "i"),
  new RegExp(`\\b${EDIT_VERB_PATTERN}\\s+(this|that|the|my|our)\\b`, "i"),
  /\bgive\s+(this|that|the|my|our)\s+[^.?!]{1,100}\b(a|an|some|more|less|new|another|better|stronger)\s+[^.?!]{0,80}\b(color|colour|background|font|spacing|padding|margin|border|radius|shadow|style|look|layout|label|text|copy|caption|hover|focus|animation|transition)\b/i,
  /\b(i'?m|i am|we'?re|we are)\s+ready\s+to\s+(build|create|generate|implement)\b/i,
  /\b(build|create|generate|implement)\s+(the\s+)?(starter|first files|project|app|site|plan)\b/i,
];

const GUIDANCE_PATTERN =
  /\b(explain|teach|learn|what is|what are|how does|how do|how would|how can|how should|why does|why is|can you explain|walk me through|help me understand|concept|definition|example of|examples of)\b/i;

const PROJECT_NAVIGATION_PATTERN =
  /\b(where|which file|what file|find|located|location|show me where|point me to|look for|tweak it myself)\b/i;

const CODE_TOPIC_PATTERN =
  /\b(html|css|javascript|\bjs\b|code|file|project|app|site|website|function|functions|variable|variables|array|arrays|object|objects|loop|loops|promise|promises|fetch|async|await|then|catch|pending|fulfilled|rejected|event|events|dom|selector|selectors|class|classes|id|ids|style|styles|layout|flex|grid|responsive|button|form|input|canvas|visualization|map|interactive|animation|animate)\b/i;

const PLANNING_PATTERN =
  /\b(plan|planning|brainstorm|idea|ideas|figure out|think through|before (we )?(build|code|create|make|generate)|ask me (a few )?(questions|guiding questions)|guide me through|project spec|spec|requirements|outline|what should i build|not sure what to build)\b/i;

const PLANNING_OBJECT_PATTERN =
  /\b(new|web|starter|simple)?\s*(project|app|site|website)\b/i;

const PLANNING_ARTIFACT_PATTERN =
  /\b(plan|planning|project spec|spec|requirements)\b|\b(project|app|site|website)\s+outline\b|\boutline\s+(for|of)\s+(the\s+)?(project|app|site|website)\b/i;

const BUILD_FROM_PLAN_PATTERN =
  /\b(ready\s+to\s+build|build\s+(the\s+)?project|build\s+(it|this)|create\s+(the\s+)?first files|generate\s+(the\s+)?starter|implement\s+(the\s+)?plan)\b/i;

const HOW_TO_PATTERN =
  /^\s*how\s+(would|can|should|do)\s+(i|we|you)\b/i;

const INSTRUCTION_HELP_PATTERN =
  /\b(instruction|instructions|directions|prompt|level|lesson|what (am i|are we) supposed to do|what (is|are) (this|these) asking|not sure what (the )?(instructions|directions|prompt) (are|is) asking)\b/i;

const DEBUG_HELP_PATTERN =
  /\b(debug|debugging|error|broken|not working|doesn'?t work|isn'?t working|why (is|does|did)|what went wrong|console)\b/i;

export function asksForDirectEdit(message: string) {
  return DIRECT_EDIT_PATTERNS.some((pattern) => pattern.test(message));
}

function asksForExplicitGuidance(message: string) {
  return GUIDANCE_PATTERN.test(message) ||
    PROJECT_NAVIGATION_PATTERN.test(message) ||
    INSTRUCTION_HELP_PATTERN.test(message) ||
    DEBUG_HELP_PATTERN.test(message);
}

/** A request worded as a question rather than a polite imperative ("can you ..."). */
const POLITE_REQUEST_PREFIX_PATTERN =
  /^\s*(please\s+|hey\s+|ok\s+|okay\s+|so\s+)?(can|could|would|will)\s+(you|tutor)\b/i;

function looksLikeQuestion(message: string) {
  return /\?\s*$/.test(message.trim()) && !POLITE_REQUEST_PREFIX_PATTERN.test(message);
}

export interface TutorRequestIntentVerdict {
  intent: TutorRequestIntent;
  /**
   * `true` only when a strong, unambiguous regex signal fired. When `false`, the
   * regex landed on a weak default (or a verb inside a question), which is the
   * signal the model-assisted classifier uses to decide whether it is worth a
   * round-trip. The deterministic verdict is always usable on its own.
   */
  confident: boolean;
}

/**
 * Deterministic intent verdict plus a confidence flag. `confident` is the
 * ambiguity gate for the model classifier: we only defer to the model when the
 * regex is NOT confident, so clear imperatives and explicit help questions stay
 * instant and free while ambiguous phrasings get the model's judgment.
 */
export function classifyTutorRequestIntentVerdict(
  message: string,
  context: TutorRequestIntentContext = {},
): TutorRequestIntentVerdict {
  const supportContext = context.supportContext ?? "standalone-project";
  const isCurriculumLevel = supportContext === "curriculum-level";
  const asksForGuidance = asksForExplicitGuidance(message);
  const isCodeTopic = CODE_TOPIC_PATTERN.test(message);
  const asksForPlanning = PLANNING_PATTERN.test(message);
  const hasPlanningObject = PLANNING_OBJECT_PATTERN.test(message) || isCodeTopic;
  const directEdit = asksForDirectEdit(message) && !HOW_TO_PATTERN.test(message);
  const directPlanningArtifact =
    directEdit &&
    asksForPlanning &&
    PLANNING_ARTIFACT_PATTERN.test(message) &&
    !BUILD_FROM_PLAN_PATTERN.test(message);

  if (directEdit && !directPlanningArtifact) {
    // A clear imperative ("add a footer") is confident; the same verb inside a
    // question ("should I fix the header?") is not — defer that to the model.
    return { intent: "edit", confident: !looksLikeQuestion(message) };
  }

  if (asksForGuidance) {
    return { intent: "guidance", confident: true };
  }

  if (asksForPlanning && hasPlanningObject) {
    return {
      intent: isCurriculumLevel ? "guidance" : "planning",
      confident: true,
    };
  }

  if (isCodeTopic && isCurriculumLevel) {
    return { intent: "guidance", confident: true };
  }

  // Weak default: indirect requests, unusual verbs, and brainstorm-without-an-
  // object all land here. These are exactly the phrasings the regex gets wrong,
  // so mark them ambiguous and let the model decide when a key is available.
  return { intent: "guidance", confident: false };
}

export function classifyTutorRequestIntent(
  message: string,
  context: TutorRequestIntentContext = {},
): TutorRequestIntent {
  return classifyTutorRequestIntentVerdict(message, context).intent;
}

/** Whether the deterministic verdict is weak enough to warrant a model call. */
export function isAmbiguousTutorRequestIntent(
  message: string,
  context: TutorRequestIntentContext = {},
): boolean {
  return !classifyTutorRequestIntentVerdict(message, context).confident;
}

/**
 * Plan-revision guard: in a standalone project with an active plan, a direct
 * answer to Tutor's planning questions is a plan revision, not a build request.
 * Applied after intent resolution on every path so the model and regex verdicts
 * share the same plan-revision semantics.
 */
export function applyPlanRevisionOverride(
  intent: TutorRequestIntent,
  message: string,
  context: TutorRequestIntentContext = {},
): TutorRequestIntent {
  const supportContext = context.supportContext ?? "standalone-project";
  if (
    supportContext === "standalone-project" &&
    context.hasActivePlan &&
    context.lastAssistantAskedPlanningQuestion &&
    !asksForExplicitGuidance(message) &&
    !BUILD_FROM_PLAN_PATTERN.test(message)
  ) {
    return "planning";
  }
  return intent;
}

export interface TutorRequestPolicy {
  intent: TutorRequestIntent;
  supportContext: TutorSupportContext;
  allowWorkspaceEdits: boolean;
  allowPlanEdits: boolean;
}

export function resolveTutorRequestPolicy(
  message: string,
  override: TutorRequestIntentOverride = "auto",
  context: TutorRequestIntentContext = {},
): TutorRequestPolicy {
  const supportContext = context.supportContext ?? "standalone-project";
  let intent: TutorRequestIntent;

  if (override === "build") {
    intent = "edit";
  } else if (override === "plan") {
    intent = "planning";
  } else if (override === "help") {
    intent = "guidance";
  } else {
    intent = classifyTutorRequestIntent(message, { ...context, supportContext });
  }

  intent = applyPlanRevisionOverride(intent, message, { ...context, supportContext });

  return {
    intent,
    supportContext,
    allowWorkspaceEdits: intent === "edit",
    allowPlanEdits: intent === "planning",
  };
}

export function resolveTutorRequestIntent(
  message: string,
  override: TutorRequestIntentOverride = "auto",
  context: TutorRequestIntentContext = {},
): TutorRequestIntent {
  return resolveTutorRequestPolicy(message, override, context).intent;
}

export function isGuidanceOnlyRequest(message: string) {
  return resolveTutorRequestIntent(message) === "guidance";
}
