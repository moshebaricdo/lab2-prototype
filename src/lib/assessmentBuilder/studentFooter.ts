import type {
  QuestionItem,
  QuestionResponse,
} from "../../types/assessmentBuilder";

export interface StudentIncorrectFooterLayout {
  showRetry: boolean;
  retryVariant: "primary" | "secondary";
  retryPlacement: "left" | "right";
  showNextLevel: boolean;
}

/**
 * Single-question sticky footer after an incorrect submit.
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
 * Next pages the quiz. Finish goes to the results screen while another
 * attempt is still possible. Submit is the last attempt.
 * Correctness off still has a results screen (answers, no score).
 */
export function primaryQuizPageLabel(input: {
  isLastPage: boolean;
  isResponseReview?: boolean;
  lastAttempt: boolean;
}): "Next" | "View results" | "Finish" | "Submit" {
  if (!input.isLastPage) return "Next";
  if (input.isResponseReview) return "View results";
  if (input.lastAttempt) return "Submit";
  return "Finish";
}

export type QuestionOutcomeTag = "skipped" | "incorrect" | "ungraded";

/**
 * Top-right card tag after submit or on results.
 * A blank graded answer is Skipped (it still counts as incorrect).
 * Any non-correct graded attempt is Incorrect, even when option marks are
 * visible, so a mix of right and wrong picks is not read as partial credit.
 * A fully correct answer has no tag.
 * Free response is not graded: it is Ungraded, whether or not it was answered.
 */
export function questionOutcomeTag(input: {
  visible: boolean;
  skipped: boolean;
  incorrect: boolean;
  freeResponse?: boolean;
}): QuestionOutcomeTag | null {
  if (!input.visible) return null;
  if (input.freeResponse) return "ungraded";
  if (input.skipped) return "skipped";
  if (input.incorrect) return "incorrect";
  return null;
}

/** No answer at all. A partial multi or match is an attempt, not a skip. */
export function responseWasSkipped(
  question: QuestionItem,
  response: QuestionResponse,
): boolean {
  if (question.item.kind === "multi") {
    return (response.multiSelectedIds ?? []).length === 0;
  }
  if (question.item.kind === "freeResponse") {
    return (response.freeText ?? "").trim().length === 0;
  }
  if (question.item.kind === "match") {
    const assignments = response.matchAssignments ?? {};
    return !Object.values(assignments).some((termId) => Boolean(termId));
  }
  return false;
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
