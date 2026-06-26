import type { QuestionItem } from "../../types/assessmentBuilder";

export function cloneQuestionItem(question: QuestionItem): QuestionItem {
  return structuredClone(question);
}

export function isQuestionDraftDirty(
  baseline: QuestionItem | null,
  draft: QuestionItem | null,
): boolean {
  if (!baseline || !draft) return false;
  return JSON.stringify(baseline) !== JSON.stringify(draft);
}
