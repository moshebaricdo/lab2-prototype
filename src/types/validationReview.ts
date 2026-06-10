export type ValidationReviewMode = "technical" | "open-ended" | "hybrid";

export type ValidationReviewStatus =
  | "not_started"
  | "in_progress"
  | "needs_work"
  | "likely_complete";

export type ValidationReviewConfidence = "low" | "medium" | "high";

export type ValidationReviewItemStatus = "pass" | "warn" | "missing";

export type ValidationContinueMode = "standard" | "require-successful-review";

export type ValidationEffortPolicy = "none" | "advisory" | "required";
export type ValidationReviewFollowUpPreference = "auto" | "debug" | "suggestion";

export interface ValidationReviewItem {
  id: string;
  label: string;
  status: ValidationReviewItemStatus;
  detail: string;
}

export interface ValidationReviewCardData {
  kind: "offer" | "summary";
  title: string;
  mode: ValidationReviewMode;
  status?: ValidationReviewStatus;
  confidence?: ValidationReviewConfidence;
  items?: ValidationReviewItem[];
  evidence?: string[];
  requirements?: string[];
  requirementLabels?: string[];
  nextStep?: string;
  followUpPreference?: ValidationReviewFollowUpPreference;
  /** Optional LLM-authored chat text shown above the review card UI. */
  summaryMessage?: string;
}

export interface LevelProgressCriterion {
  id: string;
  label: string;
  status: ValidationReviewItemStatus;
  detail?: string;
}

export interface LevelProgressSnapshot {
  title: string;
  mode: ValidationReviewMode;
  status: ValidationReviewStatus;
  phase: "not_started" | "partially_complete" | "ready_to_continue";
  passedCriteria: LevelProgressCriterion[];
  incompleteCriteria: LevelProgressCriterion[];
  nextIncompleteCriterion?: LevelProgressCriterion;
  requirements?: string[];
  requirementLabels?: string[];
  nextStep?: string;
}

export interface WebLab2ValidationReviewConfig {
  goals: string[];
  goalLabels?: string[];
}
