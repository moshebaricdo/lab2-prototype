import type {
  AssessmentArtifact,
  AssessmentIntro,
  P0AssessmentMode,
} from "../../types/assessmentBuilder";

const NO_SHUFFLE = { shuffleQuestions: false, shuffleOptions: false } as const;

const DEFAULT_EXAM_INTRO: AssessmentIntro = {
  overviewContent: `This exam measures what you have learned in this course.

You have one timed attempt. The AI Tutor is not available during the exam.

When you are ready, begin.`,
  timeMinutes: 45,
  attempts: 1,
};

/** Seed an intro screen from the artifact's current timing/attempts. */
export function createDefaultExamIntro(
  artifact: AssessmentArtifact,
): AssessmentIntro {
  return {
    ...DEFAULT_EXAM_INTRO,
    timeMinutes:
      artifact.timing?.timeLimitMinutes ?? DEFAULT_EXAM_INTRO.timeMinutes,
    attempts: artifact.attempts?.maxAttempts ?? DEFAULT_EXAM_INTRO.attempts,
  };
}

/** Apply P0 Checkpoint (CFU) vs Exam defaults. Shuffle stays off. */
export function applyP0ModePreset(
  current: AssessmentArtifact,
  mode: P0AssessmentMode,
): AssessmentArtifact {
  if (mode === "checkpoint") {
    return {
      ...current,
      mode: "checkpoint",
      layout: "stepped",
      shuffle: { ...NO_SHUFFLE },
      timing: undefined,
      attempts: undefined,
      intro: undefined,
      surveyMode: undefined,
      tutor: { enabled: true, explainWrongAnswers: true },
    };
  }

  return {
    ...current,
    mode: "exam",
    layout: "stepped",
    shuffle: { ...NO_SHUFFLE },
    timing: current.timing ?? { timeLimitMinutes: 45 },
    attempts: current.attempts ?? { maxAttempts: 1 },
    intro: current.intro ?? { ...DEFAULT_EXAM_INTRO },
    surveyMode: undefined,
    tutor: { enabled: false },
  };
}

export const P0_MODE_OPTIONS: Array<{ value: P0AssessmentMode; label: string }> =
  [
    { value: "checkpoint", label: "Checkpoint (CFU)" },
    { value: "exam", label: "Exam" },
  ];
