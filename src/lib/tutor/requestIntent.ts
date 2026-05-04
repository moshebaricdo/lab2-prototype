const EDIT_VERB_PATTERN =
  "(add|adjust|build|change|create|delete|edit|fix|generate|implement|insert|make|modify|move|remove|replace|resize|restyle|style|update|wire)";

export type TutorRequestIntent = "guidance" | "planning" | "edit";
export type TutorRequestIntentOverride = "auto" | "build" | "plan" | "help";

interface TutorRequestIntentContext {
  hasActivePlan?: boolean;
  lastAssistantAskedPlanningQuestion?: boolean;
}

const DIRECT_EDIT_PATTERNS = [
  new RegExp(`^\\s*(please\\s+)?${EDIT_VERB_PATTERN}\\b`, "i"),
  new RegExp(`\\b(can you|could you|please|let's|lets)\\s+${EDIT_VERB_PATTERN}\\b`, "i"),
  new RegExp(`\\b${EDIT_VERB_PATTERN}\\s+(this|that|the|my|our)\\b`, "i"),
  /\b(i'?m|i am|we'?re|we are)\s+ready\s+to\s+(build|create|generate|implement)\b/i,
  /\b(build|create|generate|implement)\s+(the\s+)?(starter|first files|project|app|site|plan)\b/i,
];

const GUIDANCE_PATTERN =
  /\b(explain|teach|learn|what is|what are|how does|how do|how would|how can|how should|why does|why is|can you explain|walk me through|help me understand|concept|definition|example of|examples of)\b/i;

const PROJECT_NAVIGATION_PATTERN =
  /\b(where|which file|what file|find|located|location|show me where|point me to|look for|tweak it myself)\b/i;

const CODE_TOPIC_PATTERN =
  /\b(html|css|javascript|\bjs\b|code|file|project|app|site|website|function|functions|variable|variables|array|arrays|object|objects|loop|loops|event|events|dom|selector|selectors|class|classes|id|ids|style|styles|layout|flex|grid|responsive|button|form|input|canvas|visualization|map|interactive|animation|animate)\b/i;

const PLANNING_PATTERN =
  /\b(plan|planning|brainstorm|idea|ideas|figure out|think through|before (we )?(build|code|create|make|generate)|ask me (a few )?(questions|guiding questions)|guide me through|project spec|spec|requirements|outline|what should i build|not sure what to build)\b/i;

const PLANNING_OBJECT_PATTERN =
  /\b(new|web|starter|simple)?\s*(project|app|site|website)\b/i;

const PLANNING_ARTIFACT_PATTERN =
  /\b(plan|planning|project spec|spec|requirements|outline)\b/i;

const BUILD_FROM_PLAN_PATTERN =
  /\b(ready\s+to\s+build|build\s+(the\s+)?project|build\s+(it|this)|create\s+(the\s+)?first files|generate\s+(the\s+)?starter|implement\s+(the\s+)?plan)\b/i;

const HOW_TO_PATTERN =
  /^\s*how\s+(would|can|should|do)\s+(i|we|you)\b/i;

function asksForDirectEdit(message: string) {
  return DIRECT_EDIT_PATTERNS.some((pattern) => pattern.test(message));
}

export function classifyTutorRequestIntent(message: string): TutorRequestIntent {
  const asksForGuidance = GUIDANCE_PATTERN.test(message);
  const asksForProjectNavigation = PROJECT_NAVIGATION_PATTERN.test(message);
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

  if (asksForPlanning && hasPlanningObject) {
    return "planning";
  }

  if ((asksForGuidance || asksForProjectNavigation) && isCodeTopic) {
    return "guidance";
  }

  return "edit";
}

export function resolveTutorRequestIntent(
  message: string,
  override: TutorRequestIntentOverride = "auto",
  context: TutorRequestIntentContext = {},
): TutorRequestIntent {
  if (override === "build") return "edit";
  if (override === "plan") return "planning";
  if (override === "help") return "guidance";
  const inferredIntent = classifyTutorRequestIntent(message);
  if (inferredIntent === "guidance") return inferredIntent;
  if (
    context.hasActivePlan &&
    context.lastAssistantAskedPlanningQuestion &&
    !BUILD_FROM_PLAN_PATTERN.test(message)
  ) {
    return "planning";
  }
  return inferredIntent;
}

export function isGuidanceOnlyRequest(message: string) {
  return resolveTutorRequestIntent(message) === "guidance";
}
