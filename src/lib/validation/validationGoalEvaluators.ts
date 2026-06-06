import type { WebLab2ValidationReviewConfig } from "../../types/validationReview";

export type GoalEvaluatorKind = "ai" | "version-history-save" | "version-history-revert";

export interface GoalEvaluator {
  goalIndex: number;
  kind: GoalEvaluatorKind;
}

const VERSION_HISTORY_SAVE_GOAL_PATTERN =
  /\b(version history|manual version)\b.*\b(description|comment)\b|\bsaved?\b.*\b(manual )?version\b|\bsave\b.*\b(description|comment)\b/i;

const VERSION_HISTORY_REVERT_GOAL_PATTERN =
  /\b(revert|restore|restored)\b.*\b(version|saved)\b|\bversion they saved\b/i;

export function resolveGoalEvaluatorKind(goal: string): GoalEvaluatorKind {
  const trimmed = goal.trim();
  if (VERSION_HISTORY_REVERT_GOAL_PATTERN.test(trimmed)) {
    return "version-history-revert";
  }
  if (VERSION_HISTORY_SAVE_GOAL_PATTERN.test(trimmed)) {
    return "version-history-save";
  }
  return "ai";
}

export function resolveGoalEvaluators(config: WebLab2ValidationReviewConfig): GoalEvaluator[] {
  return config.goals
    .map((goal, goalIndex) => ({
      goalIndex,
      kind: resolveGoalEvaluatorKind(goal),
    }))
    .filter((entry) => config.goals[entry.goalIndex]?.trim());
}

export function getAiGoalIndices(config: WebLab2ValidationReviewConfig) {
  return resolveGoalEvaluators(config)
    .filter((entry) => entry.kind === "ai")
    .map((entry) => entry.goalIndex);
}

export function assessmentNeedsVersionHistorySnapshots(
  config: WebLab2ValidationReviewConfig,
) {
  return resolveGoalEvaluators(config).some((entry) => entry.kind !== "ai");
}
