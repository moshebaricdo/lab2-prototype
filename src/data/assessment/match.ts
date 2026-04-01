import type { MultiChoiceAnswerContentBlock } from "./multi";

export interface MatchTerm {
  id: string;
  /** Plain text label (default when not using contentBlocks). */
  text?: string;
  /** Rich card body — same block types as multi-choice answers (text, code, image). */
  contentBlocks?: MultiChoiceAnswerContentBlock[];
}

export interface MatchPrompt {
  id: string;
  text?: string;
  contentBlocks?: MultiChoiceAnswerContentBlock[];
  correctTermId: string;
}

/** Accessible name for match cards (screen readers, aria-label). */
export function getMatchCardAccessibilityLabel(
  item: Pick<MatchTerm, "text" | "contentBlocks">,
  prefix: "Term" | "Definition",
): string {
  const plain = item.text?.trim();
  if (plain) return `${prefix}: ${plain}`;
  const blocks = item.contentBlocks;
  if (blocks?.length) {
    const parts = blocks.map((block) => {
      if (block.type === "text") return block.text;
      if (block.type === "code") return block.code.slice(0, 80);
      if (block.type === "image") return block.alt || "Image";
      return "";
    });
    return `${prefix}: ${parts.filter(Boolean).join(", ")}`.slice(0, 240);
  }
  return prefix;
}

/**
 * Relative flex weights for the two columns (terms left, definitions right).
 * Widths follow `flex-grow` proportions, e.g. `{ terms: 1, prompts: 1 }` ≈ 50/50,
 * `{ terms: 4, prompts: 1 }` ≈ 80/20.
 */
export interface MatchColumnFlex {
  terms: number;
  prompts: number;
}

/** Horizontal alignment of content inside a column’s cards. */
export type MatchCardContentAlign = "start" | "center";

/**
 * Per-column content alignment. Defaults match the common text case: short terms
 * centered, longer definitions start-aligned for readability.
 */
export interface MatchCardAlignment {
  /** Left column (terms). Default `"center"`. */
  terms?: MatchCardContentAlign;
  /** Right column (definitions / prompts). Default `"start"`. */
  prompts?: MatchCardContentAlign;
}

export interface MatchLevelPayload {
  level: {
    id: number;
    name: string;
    type: "Match";
    /**
     * stem.question: plain text heading for simple prompts.
     * stem.description: markdown for rich context or description-only stems.
     */
    stem: {
      question?: string;
      description?: string;
    };
    question: {
      terms: MatchTerm[];
      prompts: MatchPrompt[];
      /** Optional column width ratio. Omit for default (slightly wider definitions). */
      columnFlex?: MatchColumnFlex;
      /**
       * How to align content inside cards (plain text and rich blocks).
       * Omit for defaults: terms centered, definitions start-aligned.
       */
      cardAlignment?: MatchCardAlignment;
    };
    metadata: {
      lessonName: string;
      levelPosition: number;
      totalLevelsInScript: number;
    };
  };
}

export const mockMatchLevel: MatchLevelPayload = {
  level: {
    id: 42003,
    name: "Vocabulary Match Challenge",
    type: "Match",
    stem: {
      question:
        "Match each digital citizenship definition with the correct term.",
      description:
        "You are reviewing a lesson on online safety and communication. Each definition describes one of the terms in the word bank—pair them up before you submit.",
    },
    question: {
      terms: [
        { id: "t1", text: "Phishing" },
        { id: "t2", text: "Digital footprint" },
        { id: "t3", text: "Constructive feedback" },
        { id: "t4", text: "Strong password" },
      ],
      prompts: [
        {
          id: "p1",
          text: "A scam message that tries to trick you into giving private information.",
          correctTermId: "t1",
        },
        {
          id: "p2",
          text: "The trail of information you leave behind when you post or interact online.",
          correctTermId: "t2",
        },
        {
          id: "p3",
          text: "Helpful comments that explain what works and suggest specific improvements.",
          correctTermId: "t3",
        },
        {
          id: "p4",
          text: "A secret code that is long, unique, and includes multiple character types.",
          correctTermId: "t4",
        },
      ],
    },
    metadata: {
      lessonName: "Digital Citizenship Foundations",
      levelPosition: 5,
      totalLevelsInScript: 8,
    },
  },
};

export const mockMatchDefinitionBankLevel: MatchLevelPayload = {
  level: {
    id: 42004,
    name: "Programming Vocabulary Match",
    type: "Match",
    stem: {
      question:
        "Match each definition to the programming term it describes.",
      description:
        "These definitions come from a first-week **CS Principles** warm-up on objects and algorithms. Drag a definition card from the bank into the slot next to the term it explains.",
    },
    question: {
      terms: [
        { id: "t1", text: "method" },
        { id: "t2", text: "class" },
        { id: "t3", text: "pseudocode" },
        { id: "t4", text: "object" },
      ],
      prompts: [
        {
          id: "p1",
          text: "a named set of instructions to perform a task.",
          correctTermId: "t1",
        },
        {
          id: "p2",
          text: "a blueprint or set of instructions for creating something that can do specific tasks",
          correctTermId: "t2",
        },
        {
          id: "p3",
          text: "a way to plan out your code using plain language",
          correctTermId: "t3",
        },
        {
          id: "p4",
          text: "something that has attributes (what it knows) and methods (what it can do).",
          correctTermId: "t4",
        },
      ],
    },
    metadata: {
      lessonName: "Computer Science Foundations",
      levelPosition: 6,
      totalLevelsInScript: 8,
    },
  },
};

/** Image ↔ image connector demo (rich cards; terms and prompts use contentBlocks only). */
export const mockMatchConnectorImageLevel: MatchLevelPayload = {
  level: {
    id: 42006,
    name: "Blocks and stage preview",
    type: "Match",
    stem: {
      question:
        "Match each Blockly-style block to the stage preview it would produce.",
      description:
        "The **left column** shows single program blocks—the kind of commands students snap together in Blockly, Scratch, or App Lab. The **right column** shows a **stage or preview** after that one block runs: where the character moves, what it says, or how the costume changes. Connect each block to the preview that matches what would happen when the program runs that command.",
    },
    question: {
      terms: [
        {
          id: "t1",
          contentBlocks: [
            {
              type: "image",
              src: "https://placehold.co/200x120/fef3c7/92400e?text=Move+forward",
              alt: "Blockly-style block labeled move forward 10 steps",
            },
          ],
        },
        {
          id: "t2",
          contentBlocks: [
            {
              type: "image",
              src: "https://placehold.co/200x120/dcfce7/166534?text=Turn+right+90°",
              alt: "Blockly-style block labeled turn right 90 degrees",
            },
          ],
        },
        {
          id: "t3",
          contentBlocks: [
            {
              type: "image",
              src: "https://placehold.co/200x120/e0e7ff/3730a3?text=Say+hello",
              alt: "Blockly-style block labeled say hello for 2 seconds",
            },
          ],
        },
        {
          id: "t4",
          contentBlocks: [
            {
              type: "image",
              src: "https://placehold.co/200x120/fce7f3/9d174d?text=Repeat+×2",
              alt: "Blockly-style repeat loop block set to two times",
            },
          ],
        },
      ],
      prompts: [
        {
          id: "p1",
          correctTermId: "t3",
          contentBlocks: [
            {
              type: "image",
              src: "https://placehold.co/200x120/e0e7ff/3730a3?text=Hello+bubble",
              alt: "Stage preview with a speech bubble saying hello above the sprite",
            },
          ],
        },
        {
          id: "p2",
          correctTermId: "t1",
          contentBlocks: [
            {
              type: "image",
              src: "https://placehold.co/200x120/fef3c7/92400e?text=Sprite+moved+up",
              alt: "Stage preview with the sprite shifted forward on the grid",
            },
          ],
        },
        {
          id: "p3",
          correctTermId: "t4",
          contentBlocks: [
            {
              type: "image",
              src: "https://placehold.co/200x120/fce7f3/9d174d?text=Two+steps",
              alt: "Stage preview showing the same action repeated twice in a row",
            },
          ],
        },
        {
          id: "p4",
          correctTermId: "t2",
          contentBlocks: [
            {
              type: "image",
              src: "https://placehold.co/200x120/dcfce7/166534?text=Sprite+rotated",
              alt: "Stage preview with the sprite costume rotated clockwise",
            },
          ],
        },
      ],
      columnFlex: { terms: 1, prompts: 1 },
      cardAlignment: { terms: "center", prompts: "center" },
    },
    metadata: {
      lessonName: "CS Discoveries — Blockly intro",
      levelPosition: 2,
      totalLevelsInScript: 4,
    },
  },
};

/**
 * Code snippets on both sides — same content-block model as multi-choice code options.
 * (Use as a second rich-content example or for authoring QA.)
 */
export const mockMatchConnectorCodeLevel: MatchLevelPayload = {
  level: {
    id: 42007,
    name: "Code pattern match",
    type: "Match",
    stem: {
      question: "Match each JavaScript expression with the value it evaluates to.",
      description:
        "Imagine you paste each expression into the browser **Console** or a quick **node** REPL and press Enter. The right column shows the **resulting value** (what JavaScript prints back). Pair each snippet with the output it would produce.",
    },
    question: {
      terms: [
        {
          id: "ct1",
          contentBlocks: [
            {
              type: "code",
              language: "javascript",
              code: "[1, 2, 3].map(n => n * 2)",
            },
          ],
        },
        {
          id: "ct2",
          contentBlocks: [
            {
              type: "code",
              language: "javascript",
              code: "[1, 2, 3].filter(n => n > 1)",
            },
          ],
        },
        {
          id: "ct3",
          contentBlocks: [
            {
              type: "code",
              language: "javascript",
              code: "'hello'.length",
            },
          ],
        },
      ],
      prompts: [
        {
          id: "cp1",
          correctTermId: "ct2",
          contentBlocks: [{ type: "text", text: "[2, 3]" }],
        },
        {
          id: "cp2",
          correctTermId: "ct3",
          contentBlocks: [{ type: "text", text: "5" }],
        },
        {
          id: "cp3",
          correctTermId: "ct1",
          contentBlocks: [{ type: "text", text: "[2, 4, 6]" }],
        },
      ],
      columnFlex: { terms: 4, prompts: 1 },
      cardAlignment: { terms: "start", prompts: "center" },
    },
    metadata: {
      lessonName: "JavaScript warm-up",
      levelPosition: 3,
      totalLevelsInScript: 4,
    },
  },
};
