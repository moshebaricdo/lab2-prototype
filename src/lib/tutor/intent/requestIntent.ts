import type { TutorSupportContext } from "../../../types/tutor";

export type TutorRequestIntent = "guidance" | "planning" | "edit";
export type TutorRequestIntentOverride = "auto" | "build" | "plan" | "help";

export interface TutorRequestIntentContext {
  hasActivePlan?: boolean;
  lastAssistantAskedPlanningQuestion?: boolean;
  supportContext?: TutorSupportContext;
}

const BUILD_FROM_PLAN_PATTERN =
  /\b(ready\s+to\s+build|build\s+(the\s+)?project|build\s+(it|this)|create\s+(the\s+)?first files|generate\s+(the\s+)?starter|implement\s+(the\s+)?plan)\b/i;

/**
 * Plan-revision guard: in a standalone project with an active plan, a direct
 * answer to Tutor's planning questions is a plan revision, not a build request.
 * Applied after the intent classifier on every path.
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
    intent === "edit" &&
    !BUILD_FROM_PLAN_PATTERN.test(message)
  ) {
    return "planning";
  }
  return intent;
}
