import type { AssessmentArtifact } from "../../types/assessmentBuilder";
import { sectionDisplayTitle } from "./outline";

/** Why the header Save is off. `null` means Save is ready. */
export type QuizSaveBlocker =
  | "new-question"
  | "question-edits"
  | "empty-quiz"
  | "empty-page"
  | "no-changes";

export interface QuizSaveState {
  blocker: QuizSaveBlocker | null;
  /** Tooltip on the disabled button. Tells the author what to fix. */
  tooltip: string | null;
}

interface QuizSaveInput {
  artifact: AssessmentArtifact;
  /** The artifact differs from the last saved snapshot. */
  hasQuizChanges: boolean;
  /** Questions created in this quiz that were never saved. */
  newQuestionCount: number;
  /** Saved questions with open edits. */
  editedQuestionCount: number;
}

/**
 * Save in the header saves the whole quiz. It is off until there is
 * something to save, and off while anything in the outline is half-done.
 * Checks run in order so the tooltip names the first thing to fix.
 */
export function quizSaveState({
  artifact,
  hasQuizChanges,
  newQuestionCount,
  editedQuestionCount,
}: QuizSaveInput): QuizSaveState {
  if (newQuestionCount > 0) {
    return {
      blocker: "new-question",
      tooltip:
        newQuestionCount === 1
          ? "Save or discard your new question first"
          : `Save or discard your ${newQuestionCount} new questions first`,
    };
  }
  if (editedQuestionCount > 0) {
    return {
      blocker: "question-edits",
      tooltip:
        editedQuestionCount === 1
          ? "Save or discard changes to 1 question first"
          : `Save or discard changes to ${editedQuestionCount} questions first`,
    };
  }
  if (artifact.questionRefs.length === 0) {
    return { blocker: "empty-quiz", tooltip: "Add a question before saving" };
  }
  const sections = artifact.sections ?? [];
  const emptyIndex = sections.findIndex(
    (section) => section.questionRefs.length === 0,
  );
  if (emptyIndex >= 0) {
    const label = sectionDisplayTitle(sections[emptyIndex], emptyIndex);
    return {
      blocker: "empty-page",
      tooltip: `Add a question to ${label} or delete the page`,
    };
  }
  if (!hasQuizChanges) {
    return { blocker: "no-changes", tooltip: "No changes to save" };
  }
  return { blocker: null, tooltip: null };
}

/** Comparable form of the artifact. Ignores the edit timestamp. */
export function quizSaveSnapshot(artifact: AssessmentArtifact): string {
  return JSON.stringify({ ...artifact, updatedAt: 0 });
}
