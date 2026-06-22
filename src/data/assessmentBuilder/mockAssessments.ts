import type { AssessmentArtifact } from "../../types/assessmentBuilder";

const SHARED_METADATA = {
  levelPosition: 1,
  totalLevelsInScript: 2,
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
