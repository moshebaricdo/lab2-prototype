import type { FaIconName } from "../../../../icons/faProRegularCodepoints";
import type { BlankQuestionKind } from "../../../../lib/assessmentBuilder";
import type {
  QuestionItem,
  QuestionItemKind,
} from "../../../../types/assessmentBuilder";

/**
 * Single source of truth for question-type glyphs and labels. Outline
 * handles, bank type tags, and add menus must stay in lockstep.
 */
export interface QuestionKindMeta {
  label: string;
  iconName: FaIconName;
}

export const QUESTION_KIND_META: Record<QuestionItemKind, QuestionKindMeta> = {
  multi: { label: "Multiple Choice", iconName: "list-check" },
  freeResponse: { label: "Free Response", iconName: "pen-field" },
  match: { label: "Matching", iconName: "diagram-next" },
  dragDrop: { label: "Drag & Drop", iconName: "layer-group" },
  fillInBlank: { label: "Fill in the Blank", iconName: "i-cursor" },
};

export function questionKindMeta(question: QuestionItem): QuestionKindMeta {
  return QUESTION_KIND_META[question.item.kind];
}

/** Bank filter checklist — same labels/icons as result-row type Tags. */
export const BANK_KIND_FILTER_OPTIONS: Array<
  QuestionKindMeta & { kind: QuestionItemKind }
> = (
  Object.entries(QUESTION_KIND_META) as Array<
    [QuestionItemKind, QuestionKindMeta]
  >
).map(([kind, meta]) => ({ kind, ...meta }));

/** One-off scaffolds offered by the legacy add-question menu. */
export const CREATE_QUESTION_OPTIONS: Array<
  QuestionKindMeta & { kind: BlankQuestionKind }
> = [
  { kind: "multiSingle", ...QUESTION_KIND_META.multi },
  { kind: "freeResponse", ...QUESTION_KIND_META.freeResponse },
  { kind: "match", ...QUESTION_KIND_META.match },
  { kind: "dragDropParsons", ...QUESTION_KIND_META.dragDrop },
  { kind: "fillInBlank", ...QUESTION_KIND_META.fillInBlank },
];

/** Final builder add menu: multiple choice, free response, matching. */
export const FINAL_CREATE_QUESTION_OPTIONS: Array<
  QuestionKindMeta & { kind: BlankQuestionKind }
> = CREATE_QUESTION_OPTIONS.filter(
  (option) =>
    option.kind === "multiSingle" ||
    option.kind === "freeResponse" ||
    option.kind === "match",
);

/** Bank type filter — Figma Question Type Chip set (MC / FR / Matching). */
export const FINAL_BANK_KIND_FILTER_OPTIONS: Array<
  QuestionKindMeta & { kind: QuestionItemKind }
> = BANK_KIND_FILTER_OPTIONS.filter(
  (option) =>
    option.kind === "multi" ||
    option.kind === "freeResponse" ||
    option.kind === "match",
);
