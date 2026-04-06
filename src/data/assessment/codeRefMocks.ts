import type { MultiChoiceLevelPayload } from "./multi";
import type { FreeResponseLevelPayload } from "./freeResponse";
import type { LevelGroupFlowPayload } from "./levelGroup";
import {
  mockCodePanelMultiChoice,
  mockCodePanelFreeResponse,
  mockCodePanelLevelGroup,
  type CodePanelConfig,
} from "./codePanel";

// ---------------------------------------------------------------------------
// Extend payload types with optional codePanel
// ---------------------------------------------------------------------------

export type MultiChoiceCodeRefPayload = MultiChoiceLevelPayload & {
  codePanel: CodePanelConfig;
};

export type FreeResponseCodeRefPayload = FreeResponseLevelPayload & {
  codePanel: CodePanelConfig;
};

export type LevelGroupCodeRefPayload = LevelGroupFlowPayload & {
  codePanel: CodePanelConfig;
};

// ---------------------------------------------------------------------------
// Multi-choice: AP CS A — tracing a string method
// ---------------------------------------------------------------------------

export const mockCodeRefMultiChoice: MultiChoiceCodeRefPayload = {
  codePanel: mockCodePanelMultiChoice,
  level: {
    id: 49001,
    name: "String Scramble Trace",
    type: "Multi",
    stem: {
      question:
        'What is the output of the call scramble("compiler") as shown in the main method?',
      description:
        "Trace the `scramble` method step by step. Pay attention to how the loop index increments and which characters are selected.",
    },
    answers: [
      { id: "a", contentBlocks: [{ type: "code", code: '"cmie"' }] },
      { id: "b", contentBlocks: [{ type: "code", code: '"cmplr"' }] },
      { id: "c", contentBlocks: [{ type: "code", code: '"omlr"' }] },
      { id: "d", contentBlocks: [{ type: "code", code: '"cpie"' }] },
    ],
    correctAnswerId: "d",
    metadata: {
      lessonName: "AP CS A — Strings & Iteration",
      levelPosition: 3,
      totalLevelsInScript: 8,
    },
  },
};

// ---------------------------------------------------------------------------
// Free-response: AP CS A — explain code behavior
// ---------------------------------------------------------------------------

export const mockCodeRefFreeResponse: FreeResponseCodeRefPayload = {
  codePanel: mockCodePanelFreeResponse,
  level: {
    id: 49002,
    name: "Matrix Row Analysis",
    type: "FreeResponse",
    stem: {
      question:
        "Trace through the program and explain the output of the main method.",
      description:
        "In your response, show the value of `max` after each iteration of the loop in `largestRowTotal`. Then state the final printed value and explain why that row has the largest total.",
    },
    question: {
      placeholder:
        "Trace the values of max after each iteration and explain the final output…",
      minCharacters: 80,
    },
    revealAnswerEnabled: true,
    teacherAnswer: {
      exemplar:
        "After row 0: max = 5+1+3 = 9. After row 1: total = 9+0+2 = 11, which is > 9, so max = 11. After row 2: total = 4+7+6 = 17, which is > 11, so max = 17. The output is 17 because the third row {4, 7, 6} has the largest sum.",
      rubricCriteria: [
        "Correctly computes the row totals (9, 11, 17).",
        "Shows max updating when a larger total is found.",
        "States the final output is 17.",
        "Explains that the third row has the largest total.",
      ],
    },
    metadata: {
      lessonName: "AP CS A — 2D Arrays",
      levelPosition: 5,
      totalLevelsInScript: 8,
    },
  },
};

// ---------------------------------------------------------------------------
// Level-group: AP CS A — mini-quiz referencing the Inventory class
// ---------------------------------------------------------------------------

export const mockCodeRefLevelGroup: LevelGroupCodeRefPayload = {
  codePanel: mockCodePanelLevelGroup,
  level: {
    id: 49010,
    name: "Inventory Class Quiz",
    type: "LevelGroup",
    metadata: {
      lessonName: "AP CS A — ArrayList Methods",
      assessmentName: "Inventory Class Assessment",
      levelPosition: 4,
      totalLevelsInScript: 8,
    },
    steps: [
      {
        kind: "multi",
        blockId: "coderef-m1",
        question: {
          id: "cr-multi-1",
          prompt:
            'What does inv.contains("bread") return on line 43, before any items are removed?',
          answers: [
            { id: "a", text: "true" },
            { id: "b", text: "false" },
            { id: "c", text: "It throws a NullPointerException." },
            { id: "d", text: '"bread"' },
          ],
          correctAnswerId: "a",
        },
      },
      {
        kind: "multi",
        blockId: "coderef-m2",
        question: {
          id: "cr-multi-2",
          prompt:
            'What value does inv.countItem("apple") return on line 44?',
          answers: [
            { id: "a", text: "0" },
            { id: "b", text: "1" },
            { id: "c", text: "2" },
            { id: "d", text: "3" },
          ],
          correctAnswerId: "c",
        },
      },
      {
        kind: "freeResponse",
        blockId: "coderef-fr1",
        question: {
          id: "cr-free-1",
          prompt:
            'After inv.removeFirst() executes on line 45, what does the items ArrayList contain? Explain why inv.contains("apple") still returns true on line 46.',
          placeholder:
            "Describe the state of the ArrayList after removeFirst() and why the contains check still passes…",
          minCharacters: 60,
          revealAnswerEnabled: true,
          teacherAnswer: {
            exemplar:
              'removeFirst() removes the element at index 0, which is "apple". The list becomes ["bread", "apple", "milk"]. contains("apple") still returns true because a second "apple" remains at index 1.',
            expectedElements: [
              'Identifies that "apple" at index 0 is removed.',
              "Lists the remaining elements in order.",
              'Explains that a duplicate "apple" still exists.',
            ],
          },
        },
      },
      {
        kind: "multi",
        blockId: "coderef-m3",
        question: {
          id: "cr-multi-3",
          prompt:
            "If you called inv.removeFirst() a second time after line 45, which item would be removed?",
          answers: [
            { id: "a", text: '"apple"' },
            { id: "b", text: '"bread"' },
            { id: "c", text: '"milk"' },
            { id: "d", text: "No item — the list would be empty." },
          ],
          correctAnswerId: "b",
        },
      },
    ],
  },
};
