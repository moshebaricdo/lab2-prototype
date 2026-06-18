import type { CodePanelConfig } from "../data/assessment/codePanel";
import type { MultiChoiceAnswerContentBlock } from "../data/assessment/multi";
import type { FreeResponseTeacherAnswer } from "../data/assessment/freeResponse";
import type { DragDropBucket, DragDropCategorizationItem, DragDropItem } from "../data/assessment/dragDrop";
import type { FillInBlankDefinition, FillInBlankSegment } from "../data/assessment/fillInBlank";

/** Domain or standard tag attached to a bank question or used in pool draw rules. */
export interface DomainTag {
  id: string;
  label: string;
}

export type QuestionDifficulty = "beginner" | "intermediate" | "advanced";

export type QuestionItemKind =
  | "multi"
  | "freeResponse"
  | "match"
  | "dragDrop"
  | "fillInBlank";

export interface RevealConfig {
  enabled: boolean;
  explanation?: string;
}

export interface MultiChoiceQuestionContent {
  prompt: string;
  description?: string;
  answers: Array<{
    id: string;
    text?: string;
    contentBlocks?: MultiChoiceAnswerContentBlock[];
  }>;
  selectionMode?: "single" | "multiple";
  correctAnswerId?: string;
  correctAnswerIds?: string[];
  requiredSelectionCount?: number;
  maxSelectionCount?: number;
  surveyMode?: boolean;
  optionLayout?: {
    type: "list" | "grid";
    columns?: 2 | 3 | 4;
  };
}

export interface FreeResponseQuestionContent {
  prompt: string;
  description?: string;
  placeholder: string;
  minCharacters: number;
  revealAnswerEnabled?: boolean;
  teacherAnswer?: FreeResponseTeacherAnswer;
  allowFileUpload?: boolean;
}

export interface MatchQuestionContent {
  prompt: string;
  terms: Array<{ id: string; text: string }>;
  prompts: Array<{ id: string; text: string; correctTermId: string }>;
}

export interface DragDropQuestionContent {
  prompt: string;
  mode: "parsons" | "categorization";
  blocks?: DragDropItem[];
  correctOrder?: string[];
  correctIndents?: number[];
  distractorIds?: string[];
  buckets?: DragDropBucket[];
  items?: DragDropCategorizationItem[];
}

export interface FillInBlankQuestionContent {
  prompt: string;
  segments: FillInBlankSegment[];
  blanks: FillInBlankDefinition[];
  revealAnswerEnabled?: boolean;
}

export type QuestionItemContent =
  | { kind: "multi"; content: MultiChoiceQuestionContent }
  | { kind: "freeResponse"; content: FreeResponseQuestionContent }
  | { kind: "match"; content: MatchQuestionContent }
  | { kind: "dragDrop"; content: DragDropQuestionContent }
  | { kind: "fillInBlank"; content: FillInBlankQuestionContent };

/** Canonical reusable question stored in the per-course bank. */
export interface QuestionItem {
  bankId: string;
  courseId: string;
  title: string;
  tags: DomainTag[];
  /** Optional difficulty band for bank filtering and authoring metadata. */
  difficulty?: QuestionDifficulty;
  reveal: RevealConfig;
  codePanel?: CodePanelConfig;
  /** Point value when scored in a graded assessment. Defaults to 1. */
  points?: number;
  updatedAt: number;
  item: QuestionItemContent;
}

export type AssessmentMode = "checkpoint" | "survey" | "quiz" | "exam";

export type AssessmentLayout = "scroll" | "stepped";

export interface AssessmentIntro {
  overviewContent: string;
  timeMinutes: number;
  attempts?: number;
}

export interface ShuffleConfig {
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
}

export interface TimingConfig {
  timeLimitMinutes: number;
}

export interface AttemptConfig {
  maxAttempts: number;
}

export interface TutorPolicy {
  enabled: boolean;
  explainWrongAnswers?: boolean;
}

export interface PoolDrawRule {
  id: string;
  label: string;
  count: number;
  tagIds: string[];
  kinds?: QuestionItemKind[];
}

/** Reference to a bank question (live) or inline snapshot. */
export type AssessmentQuestionRef =
  | { type: "bank"; bankId: string }
  | { type: "inline"; item: QuestionItem };

export interface AssessmentArtifact {
  id: string;
  courseId: string;
  title: string;
  lessonName: string;
  mode: AssessmentMode;
  layout: AssessmentLayout;
  metadata: {
    levelPosition: number;
    totalLevelsInScript: number;
    assessmentName?: string;
  };
  questionRefs: AssessmentQuestionRef[];
  poolDrawRules?: PoolDrawRule[];
  shuffle: ShuffleConfig;
  timing?: TimingConfig;
  attempts?: AttemptConfig;
  tutor: TutorPolicy;
  intro?: AssessmentIntro;
  surveyMode?: boolean;
  updatedAt: number;
}

/** Per-item learner response state (controlled workspace values). */
export interface QuestionResponse {
  bankId: string;
  multiSelectedIds?: string[];
  freeText?: string;
  matchAssignments?: Record<string, string | null>;
  dragDropParsons?: Array<{ blockId: string | null; depth: number }>;
  dragDropCategorization?: Record<string, string | null>;
  fillInBlank?: Record<string, string>;
}

export type ScoringOutcome = "correct" | "partial" | "incorrect" | "ungraded";

export interface ScoringResult {
  bankId: string;
  outcome: ScoringOutcome;
  pointsEarned: number;
  pointsPossible: number;
  domainTags: DomainTag[];
}

export interface DomainScoreSummary {
  domainId: string;
  domainLabel: string;
  earned: number;
  possible: number;
}

export interface AssessmentCourseBank {
  courseId: string;
  courseName: string;
  domains: DomainTag[];
  questions: QuestionItem[];
}
