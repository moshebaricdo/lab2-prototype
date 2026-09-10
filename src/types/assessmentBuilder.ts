import type { CodePanelConfig } from "../data/assessment/codePanel";
import type { MultiChoiceAnswerContentBlock } from "../data/assessment/multi";
import type { FreeResponseTeacherAnswer } from "../data/assessment/freeResponse";
import type { DragDropBucket, DragDropCategorizationItem, DragDropItem } from "../data/assessment/dragDrop";
import type { FillInBlankDefinition, FillInBlankSegment } from "../data/assessment/fillInBlank";

/** Concept, domain, or standard tag attached to a bank question. */
export interface DomainTag {
  id: string;
  label: string;
  /** Compact standard code shown on bank chips (e.g. `3B-AP-08`). */
  code?: string;
}

/**
 * Curriculum unit in a course family. Prototype bank filters use these as a
 * usage stand-in (questions “used in” this unit). Not an author-assigned tag.
 */
export interface CourseUnit {
  id: string;
  label: string;
  /** Standard ids from this course's catalog that belong to the unit. */
  conceptIds: string[];
}

/** @deprecated P0 dropped difficulty; kept so legacy builder drafts still typecheck. */
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

/**
 * Author-facing purpose of a quiz. Seeds student settings; snapshot /
 * reporting still follow purpose even if the author overrides those fields.
 */
export type QuizPurpose =
  | "check_for_understanding"
  | "practice"
  | "exam"
  | "exam_simulation";

export const QUIZ_PURPOSES = [
  "check_for_understanding",
  "practice",
  "exam",
  "exam_simulation",
] as const;

/** After-submit reveal. Explanation requires correctness. */
export interface QuizFeedbackConfig {
  showCorrectness: boolean;
  revealAnswerExplanation: boolean;
}

/** Published state of a unit this quiz is placed in. */
export type QuizUnitPublishedState =
  | "in_development"
  | "pilot"
  | "beta"
  | "preview"
  | "stable"
  | "sunsetting"
  | "deprecated";

export interface QuizUnitPlacement {
  unitName: string;
  courseName: string;
  lessonName?: string;
  publishedState: QuizUnitPublishedState;
}

export type QuizStatusKind =
  | "not_in_unit"
  | "unpublished"
  | "live"
  | "sunsetting"
  | "deprecated";

export interface QuestionUsageRow {
  quizTitle: string;
  courseUnit: string;
  status: QuizStatusKind;
  isCurrent?: boolean;
}

export interface QuestionVersionRow {
  label: string;
  id: number;
  usedIn: string;
  lastEdited: string;
  isCurrent?: boolean;
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
  description?: string;
  terms: Array<{ id: string; text: string }>;
  prompts: Array<{ id: string; text: string; correctTermId: string }>;
}

export interface DragDropQuestionContent {
  prompt: string;
  description?: string;
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
  description?: string;
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
  /**
   * Prototype stand-in for “used on a quiz in this course family.”
   * Not an author-assigned tag; P0 UI does not show or edit this.
   */
  courseId: string;
  title: string;
  /**
   * Prototype stand-in for “used on a quiz in this unit family.”
   * Not an author-assigned tag; P0 UI does not show or edit this.
   */
  unitId?: string;
  /** Standard tags — the only author-assigned catalog tags in P0. */
  tags: DomainTag[];
  /** @deprecated P0 dropped difficulty; ignored by the P0 builder. */
  difficulty?: QuestionDifficulty;
  reveal: RevealConfig;
  /** Teacher-only note shown on teacher viewpoints; students never see it. */
  teacherNote?: string;
  codePanel?: CodePanelConfig;
  /** Point value when scored in a graded assessment. Defaults to 1. */
  points?: number;
  updatedAt: number;
  item: QuestionItemContent;
  /**
   * Author-facing integer id for this wording (`quiz_questions.id`).
   * Always set on seeded bank rows; minted on first Save for new questions.
   */
  numericId?: number;
  /**
   * Lineage / family UUID (`quiz_questions.key`). Forks keep the parent key.
   * Always set on seeded bank rows; minted on first Save for new questions.
   */
  questionKey?: string;
  /** 1-based version index within the family. */
  versionIndex?: number;
  versionCount?: number;
  /** When false, omit from the in-quiz bank panel. Default true. */
  listedInBank?: boolean;
  /** True until the first Save of a question created in this quiz. */
  neverSaved?: boolean;
  attachedToOtherQuizzes?: boolean;
  usedInPublishedUnit?: boolean;
  lastEditedLabel?: string;
  usedInQuizzes?: QuestionUsageRow[];
  versions?: QuestionVersionRow[];
}

/** P0 authoring surfaces Checkpoint (CFU) and Exam only. `survey` / `quiz` remain for legacy drafts. */
export type AssessmentMode = "checkpoint" | "survey" | "quiz" | "exam";

export const P0_ASSESSMENT_MODES = ["checkpoint", "exam"] as const;
export type P0AssessmentMode = (typeof P0_ASSESSMENT_MODES)[number];

export type AssessmentLayout = "scroll" | "stepped";

export interface AssessmentIntro {
  /** Optional heading on the student intro. Unset → quiz level name. */
  title?: string;
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

/**
 * Authoring group of questions presented to learners as a single page.
 * Structural invariant: an assessment is either flat (no sections) or fully
 * sectioned (every question lives in a section) — never mixed.
 */
export interface AssessmentSection {
  id: string;
  /** Custom title shown next to the `Section N` overline. */
  title?: string;
  /** Learner-facing description (future). */
  description?: string;
  questionRefs: AssessmentQuestionRef[];
}

/**
 * Where this quiz sits in the curriculum. Levelbuilder-owned in prod
 * (`script_level`). Prototype-only so chrome and bank auto-scope can
 * simulate floating vs attached. Course/unit are not tags on questions.
 */
export type QuizPlacement =
  | { kind: "floating" }
  | {
      kind: "attached";
      /** Course-family key (offering), not a year-specific id. */
      courseId: string;
      courseLabel: string;
      /** Unit-family key; omit when the quiz sits at course grain. */
      unitId?: string;
      /** Writer-facing unit label, e.g. `Unit 3`. */
      unitLabel?: string;
    };

export interface AssessmentArtifact {
  id: string;
  courseId: string;
  /**
   * Level name. Always set on the in-lab builder — authors name the Level
   * in Levelbuilder before this screen. Not authored here.
   */
  title: string;
  lessonName: string;
  /**
   * Curriculum placement of this quiz. Missing is treated as floating.
   * Not authored in this builder — Levelbuilder sets it in prod.
   */
  placement?: QuizPlacement;
  mode: AssessmentMode;
  /**
   * Quiz purpose. Missing on a new quiz until the author picks one (chooser).
   * Legacy drafts omit this and keep using `mode` only.
   */
  purpose?: QuizPurpose;
  layout: AssessmentLayout;
  metadata: {
    levelPosition: number;
    totalLevelsInScript: number;
    assessmentName?: string;
  };
  questionRefs: AssessmentQuestionRef[];
  /**
   * Sectioned outline (P0 builder). When non-empty, sections are the
   * authoring source of truth and `questionRefs` mirrors their flattened
   * order so adapters, preview, and scoring stay section-agnostic.
   * `undefined` or `[]` means a flat outline.
   */
  sections?: AssessmentSection[];
  poolDrawRules?: PoolDrawRule[];
  shuffle: ShuffleConfig;
  timing?: TimingConfig;
  attempts?: AttemptConfig;
  /** Independent of `attempts.maxAttempts`. Blank max = unlimited when on. */
  allowMultipleAttempts?: boolean;
  /**
   * Gate: withhold Next level until the answer is correct.
   * Only applies when `allowMultipleAttempts` is on. Independent of max
   * attempts. Hidden when attempts are off. Last spent attempt still
   * shows Next level so the learner is not trapped.
   */
  requireCorrectAnswerToContinue?: boolean;
  tutor: TutorPolicy;
  intro?: AssessmentIntro;
  /** Config toggle. Intro copy still lives on `intro`. */
  showIntroScreen?: boolean;
  feedback?: QuizFeedbackConfig;
  /** Prototype stand-in for script_levels this quiz is placed in. */
  unitPlacements?: QuizUnitPlacement[];
  /**
   * Levelbuilder numeric level id. Always present on the in-lab builder:
   * authors open this screen after the Level row exists. Distinct from the
   * draft storage `id`. Optional only on pre-P0 / student-route mocks.
   */
  levelId?: number;
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
  /** Concept / domain / standard catalog for this course. */
  domains: DomainTag[];
  /** Curriculum units; omitted on legacy bank snapshots until hydrated. */
  units?: CourseUnit[];
  questions: QuestionItem[];
}
