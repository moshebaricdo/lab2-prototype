import type { QuestionItem } from "../../types/assessmentBuilder";

export interface AnswerNotesContent {
  explanation?: string;
  teacherNote?: string;
}

/**
 * P0 note cards follow the Question Types mocks:
 * - Free response shows the teacher exemplar only (no answer-explanation card).
 * - Matching (and multi) can show the explanation and the teacher-only note.
 */
export function answerNotesForQuestion(
  question: QuestionItem,
  options: {
    includeExplanation: boolean;
    includeTeacherNote: boolean;
  },
): AnswerNotesContent {
  if (question.item.kind === "freeResponse") {
    const exemplar =
      question.item.content.teacherAnswer?.exemplar?.trim() ||
      question.teacherNote?.trim();
    return {
      teacherNote: options.includeTeacherNote ? exemplar : undefined,
    };
  }

  return {
    explanation: options.includeExplanation
      ? question.reveal.explanation
      : undefined,
    teacherNote: options.includeTeacherNote ? question.teacherNote : undefined,
  };
}
