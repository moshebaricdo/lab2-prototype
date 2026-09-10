export interface StudentIncorrectFooterLayout {
  showRetry: boolean;
  retryVariant: "primary" | "secondary";
  retryPlacement: "left" | "right";
  showNextLevel: boolean;
}

/**
 * Single-question card footer after an incorrect submit.
 * Primary always lives on the right. Last spent attempt shows Next level
 * even when require-correct is on so the learner is not trapped.
 */
export function studentIncorrectFooterLayout(input: {
  retriesAllowed: boolean;
  requireCorrect: boolean;
  lastAttemptSpent: boolean;
}): StudentIncorrectFooterLayout {
  const retriesLeft = input.retriesAllowed && !input.lastAttemptSpent;
  if (!retriesLeft) {
    return {
      showRetry: false,
      retryVariant: "primary",
      retryPlacement: "right",
      showNextLevel: true,
    };
  }
  if (input.requireCorrect) {
    return {
      showRetry: true,
      retryVariant: "primary",
      retryPlacement: "right",
      showNextLevel: false,
    };
  }
  return {
    showRetry: true,
    retryVariant: "secondary",
    retryPlacement: "left",
    showNextLevel: true,
  };
}

/**
 * Sitting-count chip (Figma `quizAttemptChip`).
 * Show only when max attempts is set and the last sitting is not spent.
 */
export function quizAttemptChipCopy(input: {
  maxAttempts?: number;
  attemptNumber: number;
  lastAttemptSpent?: boolean;
}): string | null {
  if (input.maxAttempts == null || input.lastAttemptSpent) return null;
  if (input.attemptNumber >= input.maxAttempts) return "Final attempt";
  return `Attempt ${input.attemptNumber} of ${input.maxAttempts}`;
}

/**
 * Multi-question sticky-footer primary label (Figma last-page annotations).
 * Next pages the quiz. Finish goes to a results screen while another
 * attempt is still possible. Submit is the terminal sitting: last attempt
 * or no results view (correctness off).
 */
export function primaryQuizPageLabel(input: {
  isLastPage: boolean;
  isResponseReview?: boolean;
  showCorrectness: boolean;
  lastAttempt: boolean;
}): "Next" | "View results" | "Finish" | "Submit" {
  if (!input.isLastPage) return "Next";
  if (input.isResponseReview) return "View results";
  if (input.lastAttempt || !input.showCorrectness) return "Submit";
  return "Finish";
}

/** Next / Finish / View results / Next level navigate. Submit does not. */
export function quizActionHasArrow(label: string): boolean {
  return (
    label === "Next" ||
    label === "Finish" ||
    label === "View results" ||
    label === "Next level"
  );
}
