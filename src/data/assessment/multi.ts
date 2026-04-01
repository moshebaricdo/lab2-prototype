export interface MultiChoiceAnswer {
  id: string;
  text?: string;
  contentBlocks?: MultiChoiceAnswerContentBlock[];
}

export type MultiChoiceAnswerContentBlock =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "code";
      code: string;
      language?: string;
    }
  | {
      type: "image";
      src: string;
      alt: string;
      caption?: string;
    };

export interface MultiChoiceLevelPayload {
  level: {
    id: number;
    name: string;
    type: "Multi";
    /**
     * stem.question: plain text, recommended for simple single-sentence questions.
     * stem.description: markdown, used when the question needs rich formatting, inline
     * code, images, or supplemental context. Can be used alone (question lives fully
     * inside the markdown) or alongside stem.question (renders as a supplemental block).
     */
    stem: {
      question?: string;
      description?: string;
    };
    answers: MultiChoiceAnswer[];
    /**
     * Single-select (default): set `correctAnswerId`.
     * Multi-select: set `selectionMode: "multiple"` and `correctAnswerIds`.
     */
    selectionMode?: "single" | "multiple";
    correctAnswerId?: string;
    correctAnswerIds?: string[];
    /** When set for multi-select, submit stays disabled until exactly this many are selected. */
    requiredSelectionCount?: number;
    /**
     * When set for multi-select, the user cannot select more than this many options at once.
     * Unchecked options become disabled until the user unchecks one. Omit for "select all that apply" (no cap).
     */
    maxSelectionCount?: number;
    /**
     * Controls how answer options are laid out.
     * "list" (default): stacked vertical list — best for longer text answers.
     * "grid": CSS grid — best for short text, code snippets, or image options.
     * columns defaults to 2 when not specified.
     */
    optionLayout?: {
      type: "list" | "grid";
      columns?: 2 | 3 | 4;
    };
    /**
     * Reflection / survey: no graded key. Hides Reveal answer; Submit always succeeds and
     * offers Continue (any selection, including none). Omit `correctAnswerId` / `correctAnswerIds`.
     */
    surveyMode?: boolean;
    metadata: {
      lessonName: string;
      levelPosition: number;
      totalLevelsInScript: number;
    };
  };
}

// Level 1: Simple text question — stem.question only
export const mockMultiChoiceLevel: MultiChoiceLevelPayload = {
  level: {
    id: 42001,
    name: "Internet Safety Checkpoint",
    type: "Multi",
    stem: {
      question:
        "A classmate sends you a link and asks for your school password to access a game reward. What should you do first?",
    },
    answers: [
      {
        id: "a",
        text: "Share the password quickly so they can claim the reward.",
      },
      {
        id: "b",
        text: "Ask a trusted adult or teacher before entering any password.",
      },
      {
        id: "c",
        text: "Open the link on a friend's account to test if it works.",
      },
      {
        id: "d",
        text: "Post the link to classmates so everyone can decide together.",
      },
    ],
    correctAnswerId: "b",
    metadata: {
      lessonName: "Digital Citizenship Foundations",
      levelPosition: 1,
      totalLevelsInScript: 6,
    },
  },
};

// Level 2: Question + boxed description (supplemental code context)
export const mockMultiChoiceAuthoringLevel: MultiChoiceLevelPayload = {
  level: {
    id: 42002,
    name: "Fish Movement Debugging",
    type: "Multi",
    stem: {
      question:
        "You need to update the code below to animate the fish to move from the right side of the screen to the left side of the screen. In the draw loop, what line of code do you need to add before `drawSprites()`?",
      description: [
        "Current program:",
        "",
        "```javascript",
        "var orangeFish = createSprite(400, 100);",
        'orangeFish.setAnimation("orange_fish");',
        "",
        "function draw() {",
        '  background("navy");',
        "  // Add your line here, before drawSprites()",
        "  drawSprites();",
        "}",
        "```",
      ].join("\n"),
    },
    answers: [
      {
        id: "a",
        contentBlocks: [
          {
            type: "code",
            language: "javascript",
            code: "orangeFish.moveLeft();",
          },
        ],
      },
      {
        id: "b",
        contentBlocks: [
          {
            type: "code",
            language: "javascript",
            code: 'orangeFish.move = "left";',
          },
        ],
      },
      {
        id: "c",
        contentBlocks: [
          {
            type: "code",
            language: "javascript",
            code: "orangeFish.x = orangeFish.x - 2;",
          },
        ],
      },
      {
        id: "d",
        contentBlocks: [
          {
            type: "code",
            language: "javascript",
            code: "orangeFish.x = orangeFish.x + 2;",
          },
        ],
      },
      {
        id: "e",
        text: "No change, the program already animates the fish to move left",
      },
    ],
    correctAnswerId: "c",
    metadata: {
      lessonName: "Game Lab Debugging Practice",
      levelPosition: 2,
      totalLevelsInScript: 6,
    },
  },
};

// Level 3: Simple question + image answer options (grid layout)
export const mockMultiChoiceCodeOptionsLevel: MultiChoiceLevelPayload = {
  level: {
    id: 42003,
    name: "Animation Prediction",
    type: "Multi",
    stem: {
      question:
        "Read this program and predict which of the following animations will be produced.",
    },
    optionLayout: { type: "grid", columns: 2 },
    answers: [
      {
        id: "a",
        contentBlocks: [
          {
            type: "image",
            src: "https://placehold.co/280x170/e8f5ff/1e3a8a?text=Option+A+Animation",
            alt: "Animation option A placeholder image",
          },
        ],
      },
      {
        id: "b",
        contentBlocks: [
          {
            type: "image",
            src: "https://placehold.co/280x170/e7fce9/166534?text=Option+B+Animation",
            alt: "Animation option B placeholder image",
          },
        ],
      },
      {
        id: "c",
        contentBlocks: [
          {
            type: "image",
            src: "https://placehold.co/280x170/fff4d6/92400e?text=Option+C+Animation",
            alt: "Animation option C placeholder image",
          },
        ],
      },
      {
        id: "d",
        contentBlocks: [
          {
            type: "image",
            src: "https://placehold.co/280x170/ffe8d6/9a3412?text=Option+D+Animation",
            alt: "Animation option D placeholder image",
          },
        ],
      },
    ],
    correctAnswerId: "b",
    metadata: {
      lessonName: "Animation Logic",
      levelPosition: 3,
      totalLevelsInScript: 6,
    },
  },
};

// Level 4: Multi-select (checkboxes) — description-only stem, select two correct answers
export const mockMultiChoiceMediaOptionsLevel: MultiChoiceLevelPayload = {
  level: {
    id: 42004,
    name: "Survey Data Cleanup",
    type: "Multi",
    stem: {
      description: [
        "You want to find out what your classmates are most excited about this year, so you create a survey. The options are:",
        "",
        "- Dances",
        "- Volleyball games",
        "- Basketball games",
        "- Band concerts",
        "- Orchestra concerts",
        "- The yearly drama play",
        "- Graduation.",
        "",
        "When you look at the survey results, you notice some responses don't fit the options. Which of the following responses should be *deleted* when cleaning the data? *(Select two)*",
        "",
        "*(Do not select responses that should be cleaned in order to fit into one of the categories)*",
      ].join("\n"),
    },
    selectionMode: "multiple",
    correctAnswerIds: ["b", "c"],
    requiredSelectionCount: 2,
    maxSelectionCount: 2,
    optionLayout: { type: "grid", columns: 2 },
    answers: [
      { id: "a", text: '"Any sports games"' },
      { id: "b", text: '"Thanks for asking!"' },
      { id: "c", text: '"Anything with my friends"' },
      { id: "d", text: '"I love listening to band"' },
      { id: "e", text: '"Can\'t wait for graduation!"' },
    ],
    metadata: {
      lessonName: "Data and Society",
      levelPosition: 4,
      totalLevelsInScript: 6,
    },
  },
};

// Level 5: Description-only stem — question + code block live in description markdown (grid layout)
export const mockMultiChoiceArrayListLevel: MultiChoiceLevelPayload = {
  level: {
    id: 42005,
    name: "ArrayList Code Segment",
    type: "Multi",
    stem: {
      description: [
        "Assume an `ArrayList` called `nums` has been initialized with the following `Integer` values: `[3, 6, 9, 1, 8, 5, 2]`. What will be the output of the following code segment?",
        "",
        "```java",
        "ArrayList<Integer> evenNums = new ArrayList<Integer>();",
        "for (int i = 0; i < nums.size(); i++) {",
        "  if (nums.get(i) % 2 == 0) {",
        "    evenNums.add(nums.get(i));",
        "  } else {",
        "    nums.remove(i);",
        "    i--;",
        "  }",
        "}",
        "System.out.println(evenNums);",
        "```",
      ].join("\n"),
    },
    optionLayout: { type: "grid", columns: 2 },
    answers: [
      {
        id: "a",
        contentBlocks: [{ type: "code", code: "[3, 9, 1, 5, 2]" }],
      },
      {
        id: "b",
        contentBlocks: [{ type: "code", code: "[6, 8]" }],
      },
      {
        id: "c",
        contentBlocks: [{ type: "code", code: "[6, 8, 2]" }],
      },
      {
        id: "d",
        contentBlocks: [{ type: "code", code: "[2, 6, 8]" }],
      },
      {
        id: "e",
        text: "An IndexOutOfBoundsException will occur.",
      },
    ],
    correctAnswerId: "c",
    metadata: {
      lessonName: "Java Collections",
      levelPosition: 5,
      totalLevelsInScript: 6,
    },
  },
};

// Level 6: Multi-select, no max — "select all that apply" reflection / survey style (no correct answers)
export const mockMultiChoiceAllThatApplyLevel: MultiChoiceLevelPayload = {
  level: {
    id: 42006,
    name: "Unit reflection survey",
    type: "Multi",
    stem: {
      question:
        "Which of the following did you learn something new about in this unit? (Select all that apply.)",
    },
    selectionMode: "multiple",
    surveyMode: true,
    answers: [
      {
        id: "a",
        text: "How variables store and update data",
      },
      {
        id: "b",
        text: "How to memorize syntax without practicing",
      },
      {
        id: "c",
        text: "How to trace a loop by hand",
      },
      {
        id: "d",
        text: "How to skip debugging when code “mostly works”",
      },
      {
        id: "e",
        text: "How to read error messages to find a bug",
      },
    ],
    metadata: {
      lessonName: "End-of-unit reflection",
      levelPosition: 6,
      totalLevelsInScript: 6,
    },
  },
};
