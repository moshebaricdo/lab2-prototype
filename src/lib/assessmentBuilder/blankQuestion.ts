import type {
  QuestionItem,
  QuestionItemContent,
  QuestionItemKind,
} from "../../types/assessmentBuilder";

/** Variants the builder can scaffold as one-off questions from the canvas. */
export type BlankQuestionKind =
  | "multiSingle"
  | "multiMultiple"
  | "freeResponse"
  | "fillInBlank"
  | "match"
  | "dragDropParsons"
  | "dragDropCategorization";

export const BLANK_QUESTION_LABELS: Record<BlankQuestionKind, string> = {
  multiSingle: "MC (Single)",
  multiMultiple: "MC (Multi)",
  freeResponse: "Free Response",
  fillInBlank: "Fill in Blank",
  match: "Matching",
  dragDropParsons: "Parsons",
  dragDropCategorization: "Categorize",
};

function blankContent(kind: BlankQuestionKind): QuestionItemContent {
  switch (kind) {
    case "multiSingle":
      return {
        kind: "multi",
        content: {
          prompt: "New multiple choice question",
          selectionMode: "single",
          correctAnswerId: "a",
          answers: [
            { id: "a", text: "Correct answer" },
            { id: "b", text: "Option B" },
            { id: "c", text: "Option C" },
            { id: "d", text: "Option D" },
          ],
        },
      };
    case "multiMultiple":
      return {
        kind: "multi",
        content: {
          prompt: "New select-all-that-apply question",
          selectionMode: "multiple",
          correctAnswerIds: ["a", "b"],
          answers: [
            { id: "a", text: "Correct answer 1" },
            { id: "b", text: "Correct answer 2" },
            { id: "c", text: "Option C" },
            { id: "d", text: "Option D" },
          ],
        },
      };
    case "freeResponse":
      return {
        kind: "freeResponse",
        content: {
          prompt: "New free response question",
          placeholder: "Type your response here…",
          minCharacters: 40,
        },
      };
    case "fillInBlank":
      return {
        kind: "fillInBlank",
        content: {
          prompt: "Complete the sentence.",
          segments: [
            { type: "text", text: "The capital of France is " },
            { type: "blank", blankId: "blank-1" },
            { type: "text", text: "." },
          ],
          blanks: [
            {
              id: "blank-1",
              placeholder: "answer",
              acceptedAnswers: ["Paris"],
            },
          ],
        },
      };
    case "match":
      return {
        kind: "match",
        content: {
          prompt: "Match each term to its definition.",
          terms: [
            { id: "t1", text: "Term A" },
            { id: "t2", text: "Term B" },
          ],
          prompts: [
            { id: "p1", text: "Definition of A", correctTermId: "t1" },
            { id: "p2", text: "Definition of B", correctTermId: "t2" },
          ],
        },
      };
    case "dragDropParsons":
      return {
        kind: "dragDrop",
        content: {
          prompt: "Arrange the lines into the correct order.",
          mode: "parsons",
          blocks: [
            { id: "b1", text: "First line" },
            { id: "b2", text: "Second line" },
            { id: "b3", text: "Third line" },
          ],
          correctOrder: ["b1", "b2", "b3"],
        },
      };
    case "dragDropCategorization":
      return {
        kind: "dragDrop",
        content: {
          prompt: "Sort each item into the correct category.",
          mode: "categorization",
          buckets: [
            { id: "bucket-1", label: "Category A" },
            { id: "bucket-2", label: "Category B" },
          ],
          items: [
            { id: "i1", text: "Item 1", correctBucketIds: ["bucket-1"] },
            { id: "i2", text: "Item 2", correctBucketIds: ["bucket-2"] },
          ],
        },
      };
  }
}

const DEFAULT_TITLES: Record<BlankQuestionKind, string> = {
  multiSingle: "Untitled multiple choice",
  multiMultiple: "Untitled select-all",
  freeResponse: "Untitled free response",
  fillInBlank: "Untitled fill in the blank",
  match: "Untitled matching",
  dragDropParsons: "Untitled Parsons",
  dragDropCategorization: "Untitled categorization",
};

/** Create a fresh, valid one-off question ready to drop into an assessment. */
export function createBlankQuestion(
  kind: BlankQuestionKind,
  courseId: string,
): QuestionItem {
  const now = Date.now();
  return {
    bankId: `q-oneoff-${now}-${Math.random().toString(36).slice(2, 7)}`,
    courseId,
    title: DEFAULT_TITLES[kind],
    tags: [],
    reveal: { enabled: false },
    points: 1,
    updatedAt: now,
    item: blankContent(kind),
  };
}

/** Short label for a question's underlying kind, used on canvas cards. */
export function questionKindLabel(item: QuestionItem): string {
  switch (item.item.kind) {
    case "multi":
      return item.item.content.selectionMode === "multiple"
        ? "MC · Multi"
        : "MC · Single";
    case "freeResponse":
      return "Free Response";
    case "fillInBlank":
      return "Fill in Blank";
    case "match":
      return "Matching";
    case "dragDrop":
      return item.item.content.mode === "categorization"
        ? "Categorize"
        : "Parsons";
  }
}

export function questionItemKind(item: QuestionItem): QuestionItemKind {
  return item.item.kind;
}
