import type { AssessmentArtifact } from "../../types/assessmentBuilder";

const SHARED_METADATA = {
  levelPosition: 1,
  totalLevelsInScript: 4,
};

export const mockSingleMultiAssessment: AssessmentArtifact = {
  id: "draft-single-multi",
  courseId: "aif-cert",
  title: "Single-select checkpoint",
  lessonName: "AI Foundations",
  mode: "checkpoint",
  layout: "scroll",
  metadata: SHARED_METADATA,
  questionRefs: [{ type: "bank", bankId: "q-aif-multi-1" }],
  shuffle: { shuffleQuestions: false, shuffleOptions: false },
  tutor: { enabled: true, explainWrongAnswers: true },
  updatedAt: Date.now(),
};

export const mockSurveyAssessment: AssessmentArtifact = {
  id: "draft-survey",
  courseId: "aif-cert",
  title: "End-of-unit reflection survey",
  lessonName: "AI Foundations",
  mode: "survey",
  layout: "scroll",
  metadata: {
    ...SHARED_METADATA,
    assessmentName: "Unit reflection survey",
  },
  surveyMode: true,
  questionRefs: [
    { type: "bank", bankId: "q-aif-survey-1" },
    { type: "bank", bankId: "q-aif-multi-2" },
  ],
  intro: {
    overviewContent:
      "Share how the unit landed for you. There are no right or wrong answers.",
    timeMinutes: 10,
  },
  shuffle: { shuffleQuestions: false, shuffleOptions: false },
  tutor: { enabled: false },
  updatedAt: Date.now(),
};

export const mockQuizAssessment: AssessmentArtifact = {
  id: "draft-quiz",
  courseId: "aif-cert",
  title: "Practice quiz",
  lessonName: "AI Foundations",
  mode: "quiz",
  layout: "stepped",
  metadata: {
    ...SHARED_METADATA,
    assessmentName: "ML fundamentals practice quiz",
  },
  questionRefs: [
    { type: "bank", bankId: "q-aif-multi-1" },
    { type: "bank", bankId: "q-aif-fr-1" },
    { type: "bank", bankId: "q-aif-match-1" },
  ],
  shuffle: { shuffleQuestions: true, shuffleOptions: true },
  tutor: { enabled: true, explainWrongAnswers: true },
  updatedAt: Date.now(),
};

export const mockExamAssessment: AssessmentArtifact = {
  id: "draft-exam",
  courseId: "aif-cert",
  title: "Practice exam",
  lessonName: "AI Foundations Certification",
  mode: "exam",
  layout: "stepped",
  metadata: {
    ...SHARED_METADATA,
    assessmentName: "AIF practice exam",
  },
  questionRefs: [
    { type: "bank", bankId: "q-aif-code-1" },
    { type: "bank", bankId: "q-aif-multi-2" },
    { type: "bank", bankId: "q-aif-match-1" },
    { type: "bank", bankId: "q-aif-fr-1" },
  ],
  poolDrawRules: [
    {
      id: "pool-ml",
      label: "Draw 2 from ML domain",
      count: 2,
      tagIds: ["domain-ml"],
    },
  ],
  intro: {
    overviewContent:
      "Timed practice exam. Answers do not reveal until you submit the full attempt.",
    timeMinutes: 45,
    attempts: 2,
  },
  timing: { timeLimitMinutes: 45 },
  attempts: { maxAttempts: 2 },
  shuffle: { shuffleQuestions: true, shuffleOptions: true },
  tutor: { enabled: false },
  updatedAt: Date.now(),
};
