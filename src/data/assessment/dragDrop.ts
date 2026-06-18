import type { MultiChoiceAnswerContentBlock } from "./multi";
import type { CodePanelConfig } from "./codePanel";

export interface DragDropItem {
  id: string;
  text?: string;
  contentBlocks?: MultiChoiceAnswerContentBlock[];
}

export interface DragDropBucket {
  id: string;
  label: string;
  description?: string;
}

export interface ParsonsSolutionLine {
  blockId: string | null;
  depth: number;
}

export type ParsonsSolutionState = ParsonsSolutionLine[];

export interface DragDropParsonsQuestion {
  mode: "parsons";
  /** All draggable blocks, including optional distractors. */
  blocks: DragDropItem[];
  /** Correct top-to-bottom order (solution blocks only). */
  correctOrder: string[];
  /**
   * Indent depth per line in `correctOrder` (0 = top level).
   * When provided, the solution UI enables nested drop targets under each prior line.
   */
  correctIndents?: number[];
  /** Block IDs that are distractors and should not appear in the solution. */
  distractorIds?: string[];
  /** Label for the unused block bank. Defaults to "Unused blocks". */
  bankLabel?: string;
  /** Label for the solution area. Defaults to "Your solution". */
  solutionLabel?: string;
}

export function getParsonsCorrectIndents(
  question: DragDropParsonsQuestion,
): number[] {
  return question.correctIndents ?? question.correctOrder.map(() => 0);
}

export function parsonsNestingEnabled(question: DragDropParsonsQuestion): boolean {
  return question.correctIndents != null;
}

export function buildInitialParsonsSolution(
  question: DragDropParsonsQuestion,
): ParsonsSolutionState {
  return question.correctOrder.map(() => ({ blockId: null, depth: 0 }));
}

export function isParsonsSolutionComplete(
  solution: ParsonsSolutionState,
): boolean {
  return solution.every((line) => Boolean(line.blockId));
}

export function isParsonsSolutionCorrect(
  question: DragDropParsonsQuestion,
  solution: ParsonsSolutionState,
): boolean {
  const indents = getParsonsCorrectIndents(question);
  return question.correctOrder.every(
    (blockId, index) =>
      solution[index]?.blockId === blockId &&
      solution[index]?.depth === indents[index],
  );
}

export interface DragDropCategorizationItem extends DragDropItem {
  /** One or more bucket IDs that accept this item. */
  correctBucketIds: string[];
}

export interface DragDropCategorizationQuestion {
  mode: "categorization";
  buckets: DragDropBucket[];
  items: DragDropCategorizationItem[];
  /** Label for the source bank. Defaults to "Items". */
  bankLabel?: string;
}

export type DragDropQuestion =
  | DragDropParsonsQuestion
  | DragDropCategorizationQuestion;

export interface DragDropLevelPayload {
  level: {
    id: number;
    name: string;
    type: "DragDrop";
    stem: {
      question?: string;
      description?: string;
    };
    question: DragDropQuestion;
    metadata: {
      lessonName: string;
      levelPosition: number;
      totalLevelsInScript: number;
    };
  };
}

export type DragDropCodeRefPayload = DragDropLevelPayload & {
  codePanel: CodePanelConfig;
};

/** Accessible label for drag-drop cards. */
export function getDragDropItemLabel(item: DragDropItem): string {
  const plain = item.text?.trim();
  if (plain) return plain;
  const blocks = item.contentBlocks;
  if (blocks?.length) {
    const parts = blocks.map((block) => {
      if (block.type === "text") return block.text;
      if (block.type === "code") return block.code.slice(0, 80);
      if (block.type === "image") return block.alt || "Image";
      return "";
    });
    return parts.filter(Boolean).join(", ").slice(0, 240);
  }
  return "Block";
}

export const mockDragDropParsonsLevel: DragDropLevelPayload = {
  level: {
    id: 42101,
    name: "Order the loop body",
    type: "DragDrop",
    stem: {
      question: "Put these code lines in the correct order to print even numbers from 0 to 8.",
      description:
        "Drag blocks from the bank into the solution area. Indent the loop body under the `for` line. You do not need every block — leave distractors in the bank.",
    },
    question: {
      mode: "parsons",
      bankLabel: "Unused blocks",
      solutionLabel: "Your solution",
      blocks: [
        {
          id: "b1",
          contentBlocks: [
            { type: "code", code: "for (let i = 0; i <= 8; i += 2) {", language: "javascript" },
          ],
        },
        {
          id: "b2",
          contentBlocks: [
            { type: "code", code: "console.log(i);", language: "javascript" },
          ],
        },
        {
          id: "b3",
          contentBlocks: [{ type: "code", code: "}", language: "javascript" }],
        },
        {
          id: "b4",
          contentBlocks: [
            {
              type: "code",
              code: "for (let i = 1; i <= 8; i += 2) {",
              language: "javascript",
            },
          ],
        },
        {
          id: "b5",
          contentBlocks: [
            { type: "code", code: '  console.log(i + 1);', language: "javascript" },
          ],
        },
      ],
      correctOrder: ["b1", "b2", "b3"],
      correctIndents: [0, 1, 0],
      distractorIds: ["b4", "b5"],
    },
    metadata: {
      lessonName: "JavaScript Foundations",
      levelPosition: 3,
      totalLevelsInScript: 8,
    },
  },
};

export const mockDragDropCategorizationLevel: DragDropLevelPayload = {
  level: {
    id: 42102,
    name: "Sort HTTP methods",
    type: "DragDrop",
    stem: {
      question: "Drag each HTTP method into the bucket that best describes its typical use.",
      description:
        "Some methods could be debated in edge cases — match the **most common** classroom definition.",
    },
    question: {
      mode: "categorization",
      bankLabel: "HTTP methods",
      buckets: [
        {
          id: "read",
          label: "Read data",
          description: "Safe requests that retrieve information without changing server state.",
        },
        {
          id: "write",
          label: "Write or change data",
          description: "Requests that create, update, or remove resources.",
        },
      ],
      items: [
        { id: "i1", text: "GET", correctBucketIds: ["read"] },
        { id: "i2", text: "POST", correctBucketIds: ["write"] },
        { id: "i3", text: "PUT", correctBucketIds: ["write"] },
        { id: "i4", text: "DELETE", correctBucketIds: ["write"] },
        { id: "i5", text: "HEAD", correctBucketIds: ["read"] },
      ],
    },
    metadata: {
      lessonName: "Web APIs",
      levelPosition: 4,
      totalLevelsInScript: 8,
    },
  },
};

/** Temporary demo — long bank labels for categorization layout review. */
export const mockDragDropCategorizationLongTextLevel: DragDropLevelPayload = {
  level: {
    id: 42104,
    name: "Sort HTTP method descriptions",
    type: "DragDrop",
    stem: {
      question:
        "Drag each description into the bucket that best matches the HTTP method it describes.",
      description:
        "Labels are intentionally wordy to stress-test wrapping in the bank and buckets.",
    },
    question: {
      mode: "categorization",
      bankLabel: "Method descriptions",
      buckets: [
        {
          id: "read",
          label: "Read data",
          description: "Safe requests that retrieve information without changing server state.",
        },
        {
          id: "write",
          label: "Write or change data",
          description: "Requests that create, update, or remove resources.",
        },
      ],
      items: [
        {
          id: "lt1",
          text: "Retrieve an existing resource without modifying anything on the server",
          correctBucketIds: ["read"],
        },
        {
          id: "lt2",
          text: "Submit a new record and ask the server to store it in the database",
          correctBucketIds: ["write"],
        },
        {
          id: "lt3",
          text: "Replace an entire resource with a new representation you provide",
          correctBucketIds: ["write"],
        },
        {
          id: "lt4",
          text: "Permanently remove a resource so it is no longer available",
          correctBucketIds: ["write"],
        },
        {
          id: "lt5",
          text: "Fetch only the response headers without downloading the response body",
          correctBucketIds: ["read"],
        },
        {
          id: "lt6",
          text: "Apply a partial update to an existing resource using only the fields you send",
          correctBucketIds: ["write"],
        },
      ],
    },
    metadata: {
      lessonName: "Web APIs",
      levelPosition: 5,
      totalLevelsInScript: 8,
    },
  },
};

export const mockDragDropParsonsCodeRefLevel: DragDropCodeRefPayload = {
  codePanel: {
    files: [
      {
        name: "countEvens.js",
        language: "javascript",
        content: [
          "// Complete the function so it prints even numbers from 0 to 8.",
          "function countEvens() {",
          "  // your ordered blocks go here",
          "}",
          "",
          "countEvens();",
        ].join("\n"),
      },
    ],
    stemPosition: "inline",
    defaultWidthRatio: 0.5,
  },
  level: {
    id: 42103,
    name: "Parsons — with code reference",
    type: "DragDrop",
    stem: {
      question:
        "Using the starter file as context, order the blocks to complete `countEvens`.",
      description:
        "The reference panel shows where your solution will run. Only use the blocks needed for a correct loop.",
    },
    question: {
      mode: "parsons",
      blocks: [
        {
          id: "b1",
          contentBlocks: [
            { type: "code", code: "for (let i = 0; i <= 8; i += 2) {", language: "javascript" },
          ],
        },
        {
          id: "b2",
          contentBlocks: [
            { type: "code", code: "console.log(i);", language: "javascript" },
          ],
        },
        {
          id: "b3",
          contentBlocks: [{ type: "code", code: "}", language: "javascript" }],
        },
        {
          id: "b4",
          contentBlocks: [
            {
              type: "code",
              code: "for (let i = 1; i <= 8; i += 2) {",
              language: "javascript",
            },
          ],
        },
        {
          id: "b5",
          contentBlocks: [
            { type: "code", code: "console.log(i + 1);", language: "javascript" },
          ],
        },
      ],
      correctOrder: ["b1", "b2", "b3"],
      correctIndents: [0, 1, 0],
      distractorIds: ["b4", "b5"],
    },
    metadata: {
      lessonName: "JavaScript Foundations",
      levelPosition: 5,
      totalLevelsInScript: 8,
    },
  },
};
