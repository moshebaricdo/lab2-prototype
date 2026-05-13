export type ValidationReviewMode = "technical" | "open-ended" | "hybrid";

export type ValidationReviewStatus =
  | "not_started"
  | "in_progress"
  | "needs_work"
  | "likely_complete";

export type ValidationReviewConfidence = "low" | "medium" | "high";

export type ValidationReviewItemStatus = "pass" | "warn" | "missing";

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
  nextStep?: string;
}

export interface ValidationReviewCheck {
  id: string;
  label: string;
  targetFile?: string;
  matcher:
    | {
        type: "includes";
        value: string;
      }
    | {
        type: "regex";
        value: string;
        flags?: string;
      };
  passDetail: string;
  failDetail: string;
}

export interface WebLab2ValidationReviewConfig {
  mode: ValidationReviewMode;
  title: string;
  goals: string[];
  checks?: ValidationReviewCheck[];
  minimumChangedFiles?: number;
}
