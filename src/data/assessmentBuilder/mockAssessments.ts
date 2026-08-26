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

/** P0-aligned cert exam: no survey, no shuffle, tagged by course / unit / concept. */
export const mockP0ExamAssessment: AssessmentArtifact = {
  id: "draft-p0",
  courseId: "aif-cert",
  title: "AI Foundations Certification Exam",
  lessonName: "AI Foundations",
  mode: "exam",
  layout: "stepped",
  metadata: {
    ...SHARED_METADATA,
    levelPosition: 3,
    assessmentName: "AI Foundations Certification Exam",
  },
  // Mirrors the flattened order of `sections` below (sectioned outlines keep
  // questionRefs in sync so adapters/preview stay section-agnostic).
  questionRefs: [
    { type: "bank", bankId: "q-aif-multi-1" },
    { type: "bank", bankId: "q-aif-match-1" },
    { type: "bank", bankId: "q-aif-fib-1" },
    { type: "bank", bankId: "q-aif-multi-4" },
    { type: "bank", bankId: "q-aif-multi-2" },
    { type: "bank", bankId: "q-aif-fr-1" },
    { type: "bank", bankId: "q-aif-code-1" },
    { type: "bank", bankId: "q-aif-parsons-1" },
  ],
  sections: [
    {
      id: "sec-p0-supervised",
      questionRefs: [
        { type: "bank", bankId: "q-aif-multi-1" },
        { type: "bank", bankId: "q-aif-match-1" },
        { type: "bank", bankId: "q-aif-fib-1" },
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
        { type: "bank", bankId: "q-aif-parsons-1" },
      ],
    },
  ],
  shuffle: { shuffleQuestions: false, shuffleOptions: false },
  timing: { timeLimitMinutes: 45 },
  attempts: { maxAttempts: 1 },
  tutor: { enabled: false },
  intro: {
    overviewContent: `This certification exam covers supervised learning, responsible AI, and applying models in practice.

You have 45 minutes and one attempt. The AI Tutor is not available during the exam.

When you are ready, begin the exam.`,
    timeMinutes: 45,
    attempts: 1,
  },
  updatedAt: Date.now(),
};
