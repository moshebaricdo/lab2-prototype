import type {
  AssessmentArtifact,
  AssessmentIntro,
  AssessmentMode,
  QuizPurpose,
} from "../../types/assessmentBuilder";

const NO_SHUFFLE = { shuffleQuestions: false, shuffleOptions: false } as const;

export const QUIZ_PURPOSE_CARDS: Array<{
  value: QuizPurpose;
  label: string;
  subtitle: string;
}> = [
  {
    value: "check_for_understanding",
    label: "Check for understanding",
    subtitle: "A quick signal check during a lesson.",
  },
  {
    value: "practice",
    label: "Practice",
    subtitle: "For building skill on the content.",
  },
  {
    value: "exam",
    label: "Exam",
    subtitle: "A formal assessment of learning.",
  },
  {
    value: "exam_simulation",
    label: "Exam simulation",
    subtitle: "Cert-style timed exam practice.",
  },
];

export const QUIZ_PURPOSE_DROPDOWN_OPTIONS = QUIZ_PURPOSE_CARDS.map((card) => ({
  value: card.value,
  label: card.label,
}));

export function quizPurposeLabel(purpose: QuizPurpose): string {
  return (
    QUIZ_PURPOSE_CARDS.find((card) => card.value === purpose)?.label ?? purpose
  );
}

export interface QuizPurposeSeed {
  showIntroScreen: boolean;
  timeLimitMinutes: number | undefined;
  allowMultipleAttempts: boolean;
  maxAttempts: number | undefined;
  /** Hidden when attempts are off. Independent of max attempts. */
  requireCorrectAnswerToContinue: boolean;
  showCorrectness: boolean;
  revealAnswerExplanation: boolean;
  tutorEnabled: boolean;
  layout: AssessmentArtifact["layout"];
}

export function purposeSeeds(purpose: QuizPurpose): QuizPurposeSeed {
  switch (purpose) {
    case "check_for_understanding":
      return {
        showIntroScreen: false,
        timeLimitMinutes: undefined,
        allowMultipleAttempts: true,
        maxAttempts: undefined,
        requireCorrectAnswerToContinue: true,
        showCorrectness: true,
        revealAnswerExplanation: false,
        tutorEnabled: false,
        layout: "stepped",
      };
    case "practice":
      return {
        showIntroScreen: false,
        timeLimitMinutes: undefined,
        allowMultipleAttempts: true,
        maxAttempts: undefined,
        requireCorrectAnswerToContinue: false,
        showCorrectness: true,
        revealAnswerExplanation: false,
        tutorEnabled: true,
        layout: "scroll",
      };
    case "exam":
      return {
        showIntroScreen: false,
        timeLimitMinutes: undefined,
        allowMultipleAttempts: false,
        maxAttempts: undefined,
        requireCorrectAnswerToContinue: false,
        showCorrectness: false,
        revealAnswerExplanation: false,
        tutorEnabled: false,
        layout: "stepped",
      };
    case "exam_simulation":
      return {
        showIntroScreen: true,
        timeLimitMinutes: undefined,
        allowMultipleAttempts: true,
        maxAttempts: undefined,
        requireCorrectAnswerToContinue: false,
        showCorrectness: false,
        revealAnswerExplanation: false,
        tutorEnabled: false,
        layout: "stepped",
      };
  }
}

export function purposeToLegacyMode(purpose: QuizPurpose): AssessmentMode {
  if (purpose === "check_for_understanding") return "checkpoint";
  if (purpose === "practice") return "quiz";
  return "exam";
}

const DEFAULT_INTRO: AssessmentIntro = {
  overviewContent: `This assessment covers the content in this lesson.

When you are ready, begin.`,
  timeMinutes: 45,
  attempts: 1,
};

export function createDefaultQuizIntro(
  artifact: AssessmentArtifact,
): AssessmentIntro {
  return {
    ...DEFAULT_INTRO,
    timeMinutes:
      artifact.timing?.timeLimitMinutes ?? DEFAULT_INTRO.timeMinutes,
    attempts: artifact.attempts?.maxAttempts ?? DEFAULT_INTRO.attempts,
  };
}

function applySeed(
  current: AssessmentArtifact,
  purpose: QuizPurpose,
): AssessmentArtifact {
  const seed = purposeSeeds(purpose);
  const intro = seed.showIntroScreen
    ? (current.intro ?? createDefaultQuizIntro(current))
    : current.intro;
  return {
    ...current,
    purpose,
    mode: purposeToLegacyMode(purpose),
    layout: seed.layout,
    shuffle: { ...NO_SHUFFLE },
    showIntroScreen: seed.showIntroScreen,
    intro: seed.showIntroScreen ? intro : intro,
    timing:
      seed.timeLimitMinutes != null
        ? { timeLimitMinutes: seed.timeLimitMinutes }
        : undefined,
    allowMultipleAttempts: seed.allowMultipleAttempts,
    attempts:
      seed.maxAttempts != null ? { maxAttempts: seed.maxAttempts } : undefined,
    requireCorrectAnswerToContinue: seed.requireCorrectAnswerToContinue,
    feedback: {
      showCorrectness: seed.showCorrectness,
      revealAnswerExplanation: seed.revealAnswerExplanation,
    },
    tutor: {
      enabled: seed.tutorEnabled,
      explainWrongAnswers: seed.showCorrectness,
    },
  };
}

/** Write purpose and typical student settings. */
export function applyQuizPurpose(
  current: AssessmentArtifact,
  purpose: QuizPurpose,
): AssessmentArtifact {
  return applySeed(current, purpose);
}

export function settingsDifferFromPurpose(
  artifact: AssessmentArtifact,
): boolean {
  if (!artifact.purpose) return false;
  const seed = purposeSeeds(artifact.purpose);
  const showIntro = artifact.showIntroScreen === true;
  const time = artifact.timing?.timeLimitMinutes;
  const retries = artifact.allowMultipleAttempts === true;
  const max = artifact.attempts?.maxAttempts;
  const requireCorrect = artifact.requireCorrectAnswerToContinue === true;
  const correctness = artifact.feedback?.showCorrectness === true;
  const reveal = artifact.feedback?.revealAnswerExplanation === true;
  const tutor = artifact.tutor.enabled;
  return (
    showIntro !== seed.showIntroScreen ||
    (time ?? undefined) !== seed.timeLimitMinutes ||
    retries !== seed.allowMultipleAttempts ||
    (retries ? (max ?? undefined) !== seed.maxAttempts : false) ||
    (retries
      ? requireCorrect !== seed.requireCorrectAnswerToContinue
      : false) ||
    correctness !== seed.showCorrectness ||
    reveal !== seed.revealAnswerExplanation ||
    tutor !== seed.tutorEnabled
  );
}

export function resolvedFeedback(artifact: AssessmentArtifact): {
  showCorrectness: boolean;
  revealAnswerExplanation: boolean;
} {
  if (artifact.feedback) return artifact.feedback;
  if (artifact.purpose) {
    const seed = purposeSeeds(artifact.purpose);
    return {
      showCorrectness: seed.showCorrectness,
      revealAnswerExplanation: seed.revealAnswerExplanation,
    };
  }
  return {
    showCorrectness: artifact.mode !== "exam",
    revealAnswerExplanation: false,
  };
}

export function resolvedAllowRetries(artifact: AssessmentArtifact): boolean {
  if (artifact.allowMultipleAttempts != null) {
    return artifact.allowMultipleAttempts;
  }
  if (artifact.purpose) return purposeSeeds(artifact.purpose).allowMultipleAttempts;
  return artifact.attempts == null || (artifact.attempts.maxAttempts ?? 1) > 1;
}

/** Gate is n/a when attempts are off. Last spent attempt still allows Next level. */
export function resolvedRequireCorrectToContinue(
  artifact: AssessmentArtifact,
): boolean {
  if (!resolvedAllowRetries(artifact)) return false;
  if (artifact.requireCorrectAnswerToContinue != null) {
    return artifact.requireCorrectAnswerToContinue;
  }
  if (artifact.purpose) {
    return purposeSeeds(artifact.purpose).requireCorrectAnswerToContinue;
  }
  return false;
}

export function resolvedShowIntro(artifact: AssessmentArtifact): boolean {
  if (artifact.showIntroScreen != null) return artifact.showIntroScreen;
  return Boolean(artifact.intro);
}
