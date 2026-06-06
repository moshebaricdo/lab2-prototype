import type {
  ValidationEffortPolicy,
  ValidationReviewMode,
  WebLab2ValidationReviewConfig,
} from "../../types/validationReview";
import { assessmentNeedsVersionHistorySnapshots } from "./validationGoalEvaluators";

export interface ValidationReviewProfile {
  title: string;
  effortPolicy: ValidationEffortPolicy;
  evaluateVersionHistory: boolean;
  /** Display and follow-up chip hint — derived, not author-configured. */
  reviewMode: ValidationReviewMode;
}

const COMPREHENSION_GOAL_PATTERN =
  /\b(label|explain|identify|trace|describe|comprehension|comment line|promise state)\b/i;

const CREATIVE_EFFORT_GOAL_PATTERN =
  /\b(refinement|polish|style|experiment|intentional|creative|structural feature|build or refine|new feature)\b/i;

const DEBUG_GOAL_PATTERN =
  /\b(fix|bug|broken|error|selector|loop|button|working|not working)\b/i;

const VERSION_HISTORY_INSTRUCTIONS_PATTERN =
  /\bversion history\b|\bsave version\b|\brevert to\b/i;

/** First markdown H1 from instructions, when present. */
export function parseInstructionsTitle(instructionsMarkdown: string) {
  const match = instructionsMarkdown.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? "";
}

export function instructionsMentionVersionHistory(instructionsMarkdown: string) {
  return VERSION_HISTORY_INSTRUCTIONS_PATTERN.test(instructionsMarkdown);
}

/**
 * Whether the assessment goals expect iterative project work beyond a fixed
 * comprehension or single-fix task.
 */
export function deriveValidationEffortPolicy(goals: string[]): ValidationEffortPolicy {
  const text = goals.join("\n");
  if (COMPREHENSION_GOAL_PATTERN.test(text)) return "none";
  if (CREATIVE_EFFORT_GOAL_PATTERN.test(text)) return "required";
  return "none";
}

export function deriveValidationReviewMode(goals: string[]): ValidationReviewMode {
  const text = goals.join("\n");
  if (CREATIVE_EFFORT_GOAL_PATTERN.test(text)) return "open-ended";
  if (COMPREHENSION_GOAL_PATTERN.test(text)) return "hybrid";
  if (DEBUG_GOAL_PATTERN.test(text)) return "technical";
  return "technical";
}

export function deriveValidationReviewTitle(
  config: WebLab2ValidationReviewConfig,
  instructionsMarkdown?: string,
) {
  const fromInstructions = instructionsMarkdown
    ? parseInstructionsTitle(instructionsMarkdown)
    : "";
  if (fromInstructions) return `${fromInstructions} review`;

  const firstLabel = config.goalLabels?.[0]?.trim();
  if (firstLabel) return `${firstLabel} review`;

  return "Project review";
}

/** Runtime review behavior derived from assessment (+ optional instructions for title). */
export function resolveValidationReviewProfile(
  config: WebLab2ValidationReviewConfig,
  context: { instructionsMarkdown?: string } = {},
): ValidationReviewProfile {
  const instructionsMarkdown = context.instructionsMarkdown?.trim() ?? "";
  return {
    title: deriveValidationReviewTitle(config, instructionsMarkdown),
    effortPolicy: deriveValidationEffortPolicy(config.goals),
    evaluateVersionHistory: assessmentNeedsVersionHistorySnapshots(config),
    reviewMode: deriveValidationReviewMode(config.goals),
  };
}
