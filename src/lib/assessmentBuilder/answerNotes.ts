import type { QuestionItem } from "../../types/assessmentBuilder";

export interface AnswerNotesContent {
  explanation?: string;
}

/**
 * Per-question notes are the answer explanation card only. Teacher-only
 * guidance lives at the quiz level (levelbuilder's "For teachers only"
 * markdown, shown in the resource panel), not on each question.
 * - Free response: the exemplar fills the explanation card, teacher viewpoints only.
 * - Multi / matching: the explanation shows wherever the key is revealed.
 */
export function answerNotesForQuestion(
  question: QuestionItem,
  options: {
    includeExplanation: boolean;
    /** Teacher viewpoint or student-response review. Gates the FR exemplar. */
    isTeacherView: boolean;
  },
): AnswerNotesContent {
  if (question.item.kind === "freeResponse") {
    const exemplar = question.item.content.teacherAnswer?.exemplar?.trim();
    return {
      explanation: options.isTeacherView ? exemplar : undefined,
    };
  }

  return {
    explanation: options.includeExplanation
      ? question.reveal.explanation
      : undefined,
  };
}
