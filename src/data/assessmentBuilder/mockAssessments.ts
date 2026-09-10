import type { AssessmentArtifact } from "../../types/assessmentBuilder";

const SHARED_METADATA = {
  levelPosition: 1,
  totalLevelsInScript: 3,
};

export const mockBlankAssessment: AssessmentArtifact = {
  id: "draft-new",
  courseId: "aif-cert",
  title: "New assessment",
  lessonName: "AI Foundations",
  mode: "quiz",
  layout: "stepped",
  metadata: {
    ...SHARED_METADATA,
    assessmentName: "New assessment",
  },
  questionRefs: [],
  shuffle: { shuffleQuestions: false, shuffleOptions: false },
  tutor: { enabled: true, explainWrongAnswers: true },
  updatedAt: Date.now(),
};

export const mockSeededAssessment: AssessmentArtifact = {
  id: "draft-seeded",
  courseId: "aif-cert",
  title: "AI Foundations practice quiz",
  lessonName: "AI Foundations",
  mode: "quiz",
  layout: "stepped",
  metadata: {
    ...SHARED_METADATA,
    levelPosition: 2,
    assessmentName: "AI Foundations practice quiz",
  },
  questionRefs: [
    { type: "bank", bankId: "q-aif-multi-1" },
    { type: "bank", bankId: "q-aif-multi-2" },
    { type: "bank", bankId: "q-aif-code-1" },
    { type: "bank", bankId: "q-aif-fr-1" },
    { type: "bank", bankId: "q-aif-match-1" },
    { type: "bank", bankId: "q-aif-survey-1" },
  ],
  shuffle: { shuffleQuestions: true, shuffleOptions: true },
  tutor: { enabled: true, explainWrongAnswers: true },
  updatedAt: Date.now(),
};

/** Final quiz builder seed: 12 questions over 4 pages, attached and live. */
export const mockP0ExamAssessment: AssessmentArtifact = {
  id: "draft-p0",
  courseId: "aif-cert",
  title: "Unit 3 Assessment: AI in Society",
  lessonName: "Lesson 12",
  levelId: 48213,
  placement: {
    kind: "attached",
    courseId: "aif-cert",
    courseLabel: "AI Foundations",
    unitId: "aif-unit-models",
    unitLabel: "Unit 3",
  },
  purpose: "exam",
  mode: "exam",
  layout: "stepped",
  metadata: {
    ...SHARED_METADATA,
    levelPosition: 3,
    assessmentName: "Unit 3 Assessment: AI in Society",
  },
  questionRefs: [
    { type: "bank", bankId: "q-aif-multi-1" },
    { type: "bank", bankId: "q-aif-match-1" },
    { type: "bank", bankId: "q-aif-multi-features" },
    { type: "bank", bankId: "q-aif-multi-4" },
    { type: "bank", bankId: "q-aif-multi-2" },
    { type: "bank", bankId: "q-aif-fr-1" },
    { type: "bank", bankId: "q-aif-code-1" },
    { type: "bank", bankId: "q-aif-match-training" },
    { type: "bank", bankId: "q-aif-multi-3" },
    { type: "bank", bankId: "q-aif-multi-facial" },
    { type: "bank", bankId: "q-aif-multi-tradeoff" },
    { type: "bank", bankId: "q-aif-fr-human-loop" },
  ],
  sections: [
    {
      id: "sec-p0-supervised",
      questionRefs: [
        { type: "bank", bankId: "q-aif-multi-1" },
        { type: "bank", bankId: "q-aif-match-1" },
        { type: "bank", bankId: "q-aif-multi-features" },
      ],
    },
    {
      id: "sec-p0-responsible",
      questionRefs: [
        { type: "bank", bankId: "q-aif-multi-4" },
        { type: "bank", bankId: "q-aif-multi-2" },
        { type: "bank", bankId: "q-aif-fr-1" },
      ],
    },
    {
      id: "sec-p0-models",
      questionRefs: [
        { type: "bank", bankId: "q-aif-code-1" },
        { type: "bank", bankId: "q-aif-match-training" },
        { type: "bank", bankId: "q-aif-multi-3" },
      ],
    },
    {
      id: "sec-p0-applied",
      questionRefs: [
        { type: "bank", bankId: "q-aif-multi-facial" },
        { type: "bank", bankId: "q-aif-multi-tradeoff" },
        { type: "bank", bankId: "q-aif-fr-human-loop" },
      ],
    },
  ],
  shuffle: { shuffleQuestions: false, shuffleOptions: false },
  showIntroScreen: true,
  timing: { timeLimitMinutes: 45 },
  allowMultipleAttempts: false,
  attempts: { maxAttempts: 1 },
  feedback: {
    showCorrectness: false,
    revealAnswerExplanation: false,
  },
  tutor: { enabled: false },
  intro: {
    overviewContent: `This assessment covers bias, accountability, training data, and applied AI systems.

You have 45 minutes and one attempt. The AI Tutor is not available.

When you are ready, begin.`,
    timeMinutes: 45,
    attempts: 1,
  },
  unitPlacements: [
    {
      unitName: "Unit 3: AI in Society",
      courseName: "AI Foundations",
      lessonName: "12",
      publishedState: "stable",
    },
    {
      unitName: "Unit 3: AI in Society",
      courseName: "AI Foundations (Global)",
      lessonName: "12",
      publishedState: "stable",
    },
    {
      unitName: "Unit 3 Pilot",
      courseName: "AI Foundations",
      lessonName: "12",
      publishedState: "pilot",
    },
  ],
  updatedAt: new Date(2026, 8, 5).getTime(),
};

/** Exam row 2: same 12-question exam, three attempts, correctness on. */
export const mockQuizExamRetriesAssessment: AssessmentArtifact = {
  ...mockP0ExamAssessment,
  id: "quiz-exam-retries",
  allowMultipleAttempts: true,
  attempts: { maxAttempts: 3 },
  feedback: {
    showCorrectness: true,
    revealAnswerExplanation: false,
  },
  intro: {
    ...mockP0ExamAssessment.intro!,
    overviewContent: `This assessment covers bias, accountability, training data, and applied AI systems.

You have 45 minutes per attempt and up to three attempts. The AI Tutor is not available.

When you are ready, begin.`,
    attempts: 3,
  },
};

/** Exam row 3: one attempt, correctness on — the last-attempt confirms. */
export const mockQuizExamFinalAssessment: AssessmentArtifact = {
  ...mockP0ExamAssessment,
  id: "quiz-exam-final",
  allowMultipleAttempts: false,
  attempts: { maxAttempts: 1 },
  feedback: {
    showCorrectness: true,
    revealAnswerExplanation: false,
  },
};

/** Student row 6: timed exam with retries whose attempt persists for resume. */
export const mockQuizExamResumeAssessment: AssessmentArtifact = {
  ...mockP0ExamAssessment,
  id: "quiz-exam-resume",
  allowMultipleAttempts: true,
  attempts: { maxAttempts: 3 },
  feedback: {
    showCorrectness: true,
    revealAnswerExplanation: false,
  },
  intro: {
    ...mockP0ExamAssessment.intro!,
    overviewContent: `This assessment covers bias, accountability, training data, and applied AI systems.

You have 45 minutes per attempt and up to three attempts. The AI Tutor is not available.

When you are ready, begin.`,
    attempts: 3,
  },
};

/** Three-question practice quiz on one scrolling page. */
export const mockQuizPracticeAssessment: AssessmentArtifact = {
  id: "quiz-practice",
  courseId: "aif-cert",
  title: "Unit 3 practice",
  lessonName: "Lesson 12",
  placement: {
    kind: "attached",
    courseId: "aif-cert",
    courseLabel: "AI Foundations",
    unitId: "aif-unit-models",
    unitLabel: "Unit 3",
  },
  purpose: "practice",
  mode: "quiz",
  layout: "scroll",
  metadata: {
    ...SHARED_METADATA,
    levelPosition: 2,
    assessmentName: "Unit 3 practice",
  },
  questionRefs: [
    { type: "bank", bankId: "q-aif-multi-1" },
    { type: "bank", bankId: "q-aif-fr-1" },
    { type: "bank", bankId: "q-aif-match-1" },
  ],
  shuffle: { shuffleQuestions: false, shuffleOptions: false },
  showIntroScreen: true,
  allowMultipleAttempts: true,
  requireCorrectAnswerToContinue: false,
  intro: {
    overviewContent: `This practice covers bias, accountability, and matching key terms.

You can try as many times as you want. The AI Tutor is available.

When you are ready, begin.`,
    timeMinutes: 0,
  },
  feedback: {
    showCorrectness: true,
    revealAnswerExplanation: false,
  },
  tutor: { enabled: true, explainWrongAnswers: true },
  unitPlacements: [
    {
      unitName: "Unit 3 · 2025",
      courseName: "AI Foundations",
      lessonName: "Lesson 12",
      publishedState: "in_development",
    },
  ],
  updatedAt: Date.now(),
};

/**
 * Final quiz builder seed: one-question check for understanding.
 * Flat outline (no pages), attached to Unit 2, unpublished.
 */
export const mockP0CfuAssessment: AssessmentArtifact = {
  id: "draft-p0-cfu",
  courseId: "aif-cert",
  title: "Unit 2 CFU · Accountability",
  lessonName: "Lesson 8",
  levelId: 47620,
  placement: {
    kind: "attached",
    courseId: "aif-cert",
    courseLabel: "AI Foundations",
    unitId: "aif-unit-responsible",
    unitLabel: "Unit 2",
  },
  purpose: "check_for_understanding",
  mode: "checkpoint",
  layout: "stepped",
  metadata: {
    ...SHARED_METADATA,
    levelPosition: 2,
    assessmentName: "Unit 2 CFU · Accountability",
  },
  questionRefs: [{ type: "bank", bankId: "q-aif-multi-two" }],
  shuffle: { shuffleQuestions: false, shuffleOptions: false },
  showIntroScreen: false,
  allowMultipleAttempts: true,
  requireCorrectAnswerToContinue: true,
  feedback: {
    showCorrectness: true,
    revealAnswerExplanation: false,
  },
  tutor: { enabled: false },
  unitPlacements: [
    {
      unitName: "Unit 2: Responsible AI",
      courseName: "AI Foundations",
      lessonName: "8",
      publishedState: "in_development",
    },
  ],
  updatedAt: new Date(2026, 8, 6).getTime(),
};

/**
 * P0 floating quiz: not in a live unit, no purpose yet. Title and level id
 * are already set — Levelbuilder creates the Level before this screen.
 */
export const mockP0FloatingAssessment: AssessmentArtifact = {
  id: "draft-p0-floating",
  courseId: "aif-cert",
  title: "AI Foundations Certification Exam",
  lessonName: "Untitled",
  levelId: 50102,
  placement: { kind: "floating" },
  mode: "checkpoint",
  layout: "stepped",
  metadata: {
    ...SHARED_METADATA,
    levelPosition: 1,
    assessmentName: "AI Foundations Certification Exam",
  },
  questionRefs: [],
  shuffle: { shuffleQuestions: false, shuffleOptions: false },
  tutor: { enabled: false },
  updatedAt: Date.now(),
};
