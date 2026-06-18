import type { CodePanelConfig } from "./codePanel";

export interface FillInBlankDefinition {
  id: string;
  placeholder?: string;
  acceptedAnswers: string[];
  caseSensitive?: boolean;
  /** Defaults to true when omitted. */
  trimWhitespace?: boolean;
}

export type FillInBlankSegment =
  | { type: "text"; text: string }
  | { type: "blank"; blankId: string };

export interface FillInBlankLevelPayload {
  level: {
    id: number;
    name: string;
    type: "FillInBlank";
    stem: {
      question?: string;
      description?: string;
    };
    question: {
      segments: FillInBlankSegment[];
      blanks: FillInBlankDefinition[];
      revealAnswerEnabled?: boolean;
    };
    metadata: {
      lessonName: string;
      levelPosition: number;
      totalLevelsInScript: number;
    };
  };
}

export type FillInBlankCodeRefPayload = FillInBlankLevelPayload & {
  codePanel: CodePanelConfig;
};

export function normalizeBlankAnswer(
  value: string,
  blank: Pick<FillInBlankDefinition, "caseSensitive" | "trimWhitespace">,
): string {
  const trimmed = blank.trimWhitespace !== false ? value.trim() : value;
  return blank.caseSensitive ? trimmed : trimmed.toLowerCase();
}

export function isBlankAnswerCorrect(
  value: string,
  blank: FillInBlankDefinition,
): boolean {
  const normalized = normalizeBlankAnswer(value, blank);
  return blank.acceptedAnswers.some(
    (answer) =>
      normalizeBlankAnswer(answer, blank) === normalized,
  );
}

export const mockFillInBlankLevel: FillInBlankLevelPayload = {
  level: {
    id: 42201,
    name: "HTML tag recall",
    type: "FillInBlank",
    stem: {
      question: "Complete the sentence with the correct HTML element name.",
    },
    question: {
      segments: [
        { type: "text", text: "The " },
        { type: "blank", blankId: "tag" },
        {
          type: "text",
          text: " element is used to define the largest heading on a page.",
        },
      ],
      blanks: [
        {
          id: "tag",
          placeholder: "tag name",
          acceptedAnswers: ["h1", "<h1>", "heading 1", "heading1"],
        },
      ],
      revealAnswerEnabled: true,
    },
    metadata: {
      lessonName: "Intro to HTML",
      levelPosition: 2,
      totalLevelsInScript: 8,
    },
  },
};

export const mockFillInBlankMultiLevel: FillInBlankLevelPayload = {
  level: {
    id: 42202,
    name: "CSS box model madlibs",
    type: "FillInBlank",
    stem: {
      question: "Fill in each blank to describe the CSS box model layers.",
      description:
        "Use the vocabulary from this unit: **content**, **padding**, **border**, and **margin**.",
    },
    question: {
      segments: [
        { type: "text", text: "The innermost layer is the " },
        { type: "blank", blankId: "content" },
        { type: "text", text: " area. Outside that, " },
        { type: "blank", blankId: "padding" },
        { type: "text", text: " adds space before the " },
        { type: "blank", blankId: "border" },
        { type: "text", text: ", and " },
        { type: "blank", blankId: "margin" },
        { type: "text", text: " separates the element from its neighbors." },
      ],
      blanks: [
        {
          id: "content",
          acceptedAnswers: ["content"],
        },
        {
          id: "padding",
          acceptedAnswers: ["padding"],
        },
        {
          id: "border",
          acceptedAnswers: ["border"],
        },
        {
          id: "margin",
          acceptedAnswers: ["margin"],
        },
      ],
      revealAnswerEnabled: true,
    },
    metadata: {
      lessonName: "Intro to CSS",
      levelPosition: 3,
      totalLevelsInScript: 8,
    },
  },
};

export const mockFillInBlankCodeRefLevel: FillInBlankCodeRefPayload = {
  codePanel: {
    files: [
      {
        name: "greet.py",
        language: "python",
        content: [
          "def greet(name):",
          '    return "Hello, " + name',
          "",
          'print(greet("Ada"))',
        ].join("\n"),
      },
    ],
    stemPosition: "inline",
    defaultWidthRatio: 0.48,
  },
  level: {
    id: 42203,
    name: "Predict the output",
    type: "FillInBlank",
    stem: {
      question: "What string does the program print?",
      description:
        "Read the `greet` function in the code panel, then type the exact output (including punctuation).",
    },
    question: {
      segments: [
        { type: "text", text: "The program prints " },
        { type: "blank", blankId: "output" },
        { type: "text", text: "." },
      ],
      blanks: [
        {
          id: "output",
          placeholder: "output",
          acceptedAnswers: ['Hello, Ada'],
        },
      ],
      revealAnswerEnabled: true,
    },
    metadata: {
      lessonName: "Python Lab — Functions",
      levelPosition: 4,
      totalLevelsInScript: 8,
    },
  },
};
