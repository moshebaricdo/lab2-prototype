import type { FaIconName } from "../../../../icons/faProRegularCodepoints";
import type { BlankQuestionKind } from "../../../../lib/assessmentBuilder";
import type {
  QuestionItem,
  QuestionItemKind,
} from "../../../../types/assessmentBuilder";

/**
 * Single source of truth for question-type glyphs and labels. The outline
 * cards, bank rows, and add menus must stay in lockstep (locked builder UX:
 * collapsed rows show the same type icon as the bank).
 */
export interface QuestionKindMeta {
  label: string;
  iconName: FaIconName;
}

export const QUESTION_KIND_META: Record<QuestionItemKind, QuestionKindMeta> = {
  multi: { label: "Multiple choice", iconName: "list-check" },
  freeResponse: { label: "Free response", iconName: "pen-field" },
  match: { label: "Matching", iconName: "diagram-next" },
  dragDrop: { label: "Drag & drop", iconName: "layer-group" },
  fillInBlank: { label: "Fill in the blank", iconName: "i-cursor" },
};

export function questionKindMeta(question: QuestionItem): QuestionKindMeta {
  return QUESTION_KIND_META[question.item.kind];
}

/** One-off scaffolds offered by the add-question menu (five P0 entry points). */
export const CREATE_QUESTION_OPTIONS: Array<
  QuestionKindMeta & { kind: BlankQuestionKind }
> = [
  { kind: "multiSingle", ...QUESTION_KIND_META.multi },
  { kind: "freeResponse", ...QUESTION_KIND_META.freeResponse },
  { kind: "match", ...QUESTION_KIND_META.match },
  { kind: "dragDropParsons", ...QUESTION_KIND_META.dragDrop },
  { kind: "fillInBlank", ...QUESTION_KIND_META.fillInBlank },
];
