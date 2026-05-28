import type { TutorSupportContext } from "../../types/tutor";

const EDIT_VERB_PATTERN =
  "(add|adjust|build|change|create|delete|edit|fix|generate|implement|improve|insert|make|modify|move|polish|refine|remove|replace|resize|restyle|style|update|use|wire)";

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

export function classifyTutorRequestIntent(
  message: string,
  context: TutorRequestIntentContext = {},
): TutorRequestIntent {
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
    return "edit";
  }

  if (asksForGuidance) {
    return "guidance";
  }

  if (asksForPlanning && hasPlanningObject) {
    return isCurriculumLevel ? "guidance" : "planning";
  }

  if (isCodeTopic && isCurriculumLevel) {
    return "guidance";
  }

  return "guidance";
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

  if (
    supportContext === "standalone-project" &&
    context.hasActivePlan &&
    context.lastAssistantAskedPlanningQuestion &&
    !asksForExplicitGuidance(message) &&
    !BUILD_FROM_PLAN_PATTERN.test(message)
  ) {
    intent = "planning";
  }

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
