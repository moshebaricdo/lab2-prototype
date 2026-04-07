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
      /** Label for the terms deck. Defaults to "Term". */
      termLabel?: string;
      /** Label for the prompts/definitions deck. Defaults to "Definition". */
      promptLabel?: string;
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

/** Swipe-card demo: code snippets ↔ console output. */
export const mockMatchSwipeCodeLevel: MatchLevelPayload = {
  level: {
    id: 42009,
    name: "Code ↔ output swipe deck",
    type: "Match",
    stem: {
      question:
        "Match each Python code snippet with the output it would print.",
      description:
        "Imagine running each snippet in a Python shell. Swipe through the **code** deck and the **output** deck, then tap **Match current pair** when you find a match.",
    },
    question: {
      termLabel: "Code snippet",
      promptLabel: "Output",
      terms: [
        {
          id: "sc-t1",
          contentBlocks: [
            {
              type: "code",
              language: "python",
              code: "def greet(names):\n    for name in names:\n        if len(name) > 4:\n            print(f'Hello, {name}!')\n        else:\n            print(f'Hi, {name}!')\n\ngreet(['Ada', 'Grace', 'Alan', 'Margaret'])",
            },
          ],
        },
        {
          id: "sc-t2",
          contentBlocks: [
            {
              type: "code",
              language: "python",
              code: "matrix = [[1, 2], [3, 4], [5, 6]]\nflat = []\nfor row in matrix:\n    for val in row:\n        if val % 2 == 0:\n            flat.append(val * 10)\nprint(flat)",
            },
          ],
        },
        {
          id: "sc-t3",
          contentBlocks: [
            {
              type: "code",
              language: "python",
              code: "counts = {}\nfor ch in 'banana':\n    counts[ch] = counts.get(ch, 0) + 1\nfor k, v in sorted(counts.items()):\n    print(f'{k}: {v}')",
            },
          ],
        },
        {
          id: "sc-t4",
          contentBlocks: [
            {
              type: "code",
              language: "python",
              code: "def fibonacci(n):\n    a, b = 0, 1\n    result = []\n    while a < n:\n        result.append(a)\n        a, b = b, a + b\n    return result\n\nprint(fibonacci(50))",
            },
          ],
        },
        {
          id: "sc-t5",
          contentBlocks: [
            {
              type: "code",
              language: "python",
              code: "words = ['apple', 'Banana', 'cherry', 'Date']\nsorted_words = sorted(words, key=lambda w: w.lower())\nfor i, word in enumerate(sorted_words, 1):\n    print(f'{i}. {word}')",
            },
          ],
        },
        {
          id: "sc-t6",
          contentBlocks: [
            {
              type: "code",
              language: "python",
              code: "class Counter:\n    def __init__(self):\n        self.value = 0\n    def increment(self, amount=1):\n        self.value += amount\n        return self.value\n\nc = Counter()\nprint(c.increment())\nprint(c.increment(5))\nprint(c.increment())",
            },
          ],
        },
        {
          id: "sc-t7",
          contentBlocks: [
            {
              type: "code",
              language: "python",
              code: "data = [3, 7, 2, 9, 4, 1, 8, 5]\nabove_avg = [\n    x for x in data\n    if x > sum(data) / len(data)\n]\nprint(f'avg={sum(data)/len(data):.1f}')\nprint(f'above: {above_avg}')",
            },
          ],
        },
        {
          id: "sc-t8",
          contentBlocks: [
            {
              type: "code",
              language: "python",
              code: "def parse_csv(text):\n    rows = text.strip().split('\\n')\n    header = rows[0].split(',')\n    records = []\n    for row in rows[1:]:\n        vals = row.split(',')\n        records.append(dict(zip(header, vals)))\n    return records\n\ncsv = 'name,age\\nAli,25\\nBea,30'\nfor r in parse_csv(csv):\n    print(r)",
            },
          ],
        },
        {
          id: "sc-t9",
          contentBlocks: [
            {
              type: "code",
              language: "python",
              code: "from functools import reduce\n\nnums = [1, 2, 3, 4, 5]\nsquared = list(map(lambda x: x**2, nums))\nevens = list(filter(lambda x: x % 2 == 0, squared))\ntotal = reduce(lambda a, b: a + b, evens)\nprint(f'squared: {squared}')\nprint(f'evens:   {evens}')\nprint(f'total:   {total}')",
            },
          ],
        },
        {
          id: "sc-t10",
          contentBlocks: [
            {
              type: "code",
              language: "python",
              code: "def deep_flatten(lst):\n    result = []\n    for item in lst:\n        if isinstance(item, list):\n            result.extend(deep_flatten(item))\n        else:\n            result.append(item)\n    return result\n\nnested = [1, [2, [3, 4]], [5, [6, [7]]]]\nprint(deep_flatten(nested))",
            },
          ],
        },
      ],
      prompts: [
        {
          id: "sc-p1",
          correctTermId: "sc-t1",
          contentBlocks: [
            {
              type: "code",
              language: "text",
              code: "Hi, Ada!\nHello, Grace!\nHi, Alan!\nHello, Margaret!",
            },
          ],
        },
        {
          id: "sc-p2",
          correctTermId: "sc-t2",
          contentBlocks: [
            { type: "code", language: "text", code: "[20, 40, 60]" },
          ],
        },
        {
          id: "sc-p3",
          correctTermId: "sc-t3",
          contentBlocks: [
            { type: "code", language: "text", code: "a: 3\nb: 1\nn: 2" },
          ],
        },
        {
          id: "sc-p4",
          correctTermId: "sc-t4",
          contentBlocks: [
            {
              type: "code",
              language: "text",
              code: "[0, 1, 1, 2, 3, 5, 8, 13, 21, 34]",
            },
          ],
        },
        {
          id: "sc-p5",
          correctTermId: "sc-t5",
          contentBlocks: [
            {
              type: "code",
              language: "text",
              code: "1. apple\n2. Banana\n3. cherry\n4. Date",
            },
          ],
        },
        {
          id: "sc-p6",
          correctTermId: "sc-t6",
          contentBlocks: [
            { type: "code", language: "text", code: "1\n6\n7" },
          ],
        },
        {
          id: "sc-p7",
          correctTermId: "sc-t7",
          contentBlocks: [
            {
              type: "code",
              language: "text",
              code: "avg=4.9\nabove: [7, 9, 8, 5]",
            },
          ],
        },
        {
          id: "sc-p8",
          correctTermId: "sc-t8",
          contentBlocks: [
            {
              type: "code",
              language: "text",
              code: "{'name': 'Ali', 'age': '25'}\n{'name': 'Bea', 'age': '30'}",
            },
          ],
        },
        {
          id: "sc-p9",
          correctTermId: "sc-t9",
          contentBlocks: [
            {
              type: "code",
              language: "text",
              code: "squared: [1, 4, 9, 16, 25]\nevens:   [4, 16]\ntotal:   20",
            },
          ],
        },
        {
          id: "sc-p10",
          correctTermId: "sc-t10",
          contentBlocks: [
            {
              type: "code",
              language: "text",
              code: "[1, 2, 3, 4, 5, 6, 7]",
            },
          ],
        },
      ],
    },
    metadata: {
      lessonName: "Python fundamentals",
      levelPosition: 5,
      totalLevelsInScript: 6,
    },
  },
};

/** Swipe-card demo: optimized for smaller screens with high item counts. */
export const mockMatchSwipeCardsLevel: MatchLevelPayload = {
  level: {
    id: 42008,
    name: "Swipe match deck",
    type: "Match",
    stem: {
      question:
        "Swipe through term and definition cards, then pair the two cards currently in view.",
      description:
        "This demo tests a **small-screen matching flow** with 10 pairs. Instead of showing every item at once, you rotate through a term deck and a definition deck, then tap **Match current pair** to lock in that pairing.",
    },
    question: {
      terms: [
        { id: "sw-t1", text: "Variable" },
        { id: "sw-t2", text: "Function" },
        { id: "sw-t3", text: "Loop" },
        { id: "sw-t4", text: "Conditional" },
        { id: "sw-t5", text: "Array" },
        { id: "sw-t6", text: "Object" },
        { id: "sw-t7", text: "Parameter" },
        { id: "sw-t8", text: "Argument" },
        { id: "sw-t9", text: "Return value" },
        { id: "sw-t10", text: "Boolean" },
      ],
      prompts: [
        {
          id: "sw-p1",
          text: "A named container that stores a value you can update or read later.",
          correctTermId: "sw-t1",
        },
        {
          id: "sw-p2",
          text: "Reusable code that performs a task when it is called.",
          correctTermId: "sw-t2",
        },
        {
          id: "sw-p3",
          text: "A structure that repeats a block of code until a condition is met.",
          correctTermId: "sw-t3",
        },
        {
          id: "sw-p4",
          text: "Logic that chooses between different paths based on true/false checks.",
          correctTermId: "sw-t4",
        },
        {
          id: "sw-p5",
          text: "An ordered list of values stored under one name.",
          correctTermId: "sw-t5",
        },
        {
          id: "sw-p6",
          text: "A grouped collection of key-value pairs that describes one entity.",
          correctTermId: "sw-t6",
        },
        {
          id: "sw-p7",
          text: "A named input listed in a function definition.",
          correctTermId: "sw-t7",
        },
        {
          id: "sw-p8",
          text: "The actual value passed into a function when it is called.",
          correctTermId: "sw-t8",
        },
        {
          id: "sw-p9",
          text: "The value a function sends back after it runs.",
          correctTermId: "sw-t9",
        },
        {
          id: "sw-p10",
          text: "A data type with only two possible values: true or false.",
          correctTermId: "sw-t10",
        },
      ],
    },
    metadata: {
      lessonName: "CS Fundamentals vocabulary",
      levelPosition: 4,
      totalLevelsInScript: 5,
    },
  },
};
