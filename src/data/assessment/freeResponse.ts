export interface FreeResponseTeacherAnswer {
  /** Short exemplar or sample response for teachers. */
  exemplar: string;
  /** Optional rubric line items; shown when non-empty. */
  rubricCriteria?: string[];
  /** When `rubricCriteria` is absent or empty, show this checklist instead. */
  expectedElements?: string[];
}

export interface FreeResponseLevelPayload {
  level: {
    id: number;
    name: string;
    type: "FreeResponse";
    stem: {
      /** Plain-text heading for a single-sentence prompt. */
      question?: string;
      /** Markdown body — supplemental to `question`, or the full prompt when `question` is omitted. */
      description?: string;
    };
    question: {
      placeholder: string;
      minCharacters: number;
    };
    /**
     * When true, shows inline teacher exemplar/rubric toggled from the bottom row (multi-choice style).
     */
    revealAnswerEnabled?: boolean;
    /** Required when `revealAnswerEnabled` is true in authored content. */
    teacherAnswer?: FreeResponseTeacherAnswer;
    /**
     * When true, students may submit with an attached file even if the textarea is below the minimum
     * (text + file is also allowed).
     */
    allowFileUpload?: boolean;
    metadata: {
      lessonName: string;
      levelPosition: number;
      totalLevelsInScript: number;
    };
  };
}

/** 1 — Simple: plain question stem only, text gate, no reveal, no file upload. */
export const mockFreeResponseLevel: FreeResponseLevelPayload = {
  level: {
    id: 42001,
    name: "Quick check-in",
    type: "FreeResponse",
    stem: {
      question:
        "In one or two sentences, what is one thing you want to practice this week?",
    },
    question: {
      placeholder: "Share a short reflection.",
      minCharacters: 20,
    },
    metadata: {
      lessonName: "Digital Citizenship Foundations",
      levelPosition: 1,
      totalLevelsInScript: 8,
    },
  },
};

/** 2 — Teacher reveal answer (bottom row) + exemplar/rubric inline when shown. */
export const mockFreeResponseLevelReveal: FreeResponseLevelPayload = {
  level: {
    id: 42002,
    name: "Online communication reflection",
    type: "FreeResponse",
    revealAnswerEnabled: true,
    stem: {
      question:
        "Describe one way you can give constructive feedback to a classmate online while keeping the conversation respectful.",
    },
    question: {
      placeholder:
        "Type your response here. Include an example sentence you could use.",
      minCharacters: 40,
    },
    teacherAnswer: {
      exemplar:
        'You might open with appreciation, name the behavior, and offer a suggestion. For example: "Thanks for sharing your draft. I noticed the introduction jumps in quickly — could you add one sentence that previews your two main points?"',
      rubricCriteria: [
        "Names a respectful tone or approach (e.g., private message, positive framing).",
        "Includes at least one concrete example phrase or sentence a student could use.",
        "Keeps feedback focused on the work, not the person.",
      ],
    },
    metadata: {
      lessonName: "Digital Citizenship Foundations",
      levelPosition: 2,
      totalLevelsInScript: 8,
    },
  },
};

/** 3 — No `stem.question`; prompt lives entirely in markdown `description`. */
export const mockFreeResponseLevelMarkdownOnly: FreeResponseLevelPayload = {
  level: {
    id: 42003,
    name: "Scenario — open response",
    type: "FreeResponse",
    stem: {
      description: `### Scenario

You are reviewing a partner project in a shared document. Your classmate missed a citation on one paragraph.

**Write a short response** that explains why the citation matters and suggests one specific fix they can make. Use a respectful, collaborative tone.

You can use **bold** for emphasis or \`inline code\` if you quote a format (e.g. \`APA\`).`,
    },
    question: {
      placeholder: "Draft your message to your classmate here.",
      minCharacters: 80,
    },
    metadata: {
      lessonName: "Digital Citizenship Foundations",
      levelPosition: 3,
      totalLevelsInScript: 8,
    },
  },
};

/** 4 — File upload counts as a submission even when the textarea is empty (or use both). */
export const mockFreeResponseLevelFileUpload: FreeResponseLevelPayload = {
  level: {
    id: 42004,
    name: "Diagram or sketch",
    type: "FreeResponse",
    allowFileUpload: true,
    stem: {
      question:
        "Submit a sketch or exported image that shows how data moves from the user to the server in your project.",
    },
    question: {
      placeholder:
        "Optional: add a short caption or explanation (you can submit a file only with no text).",
      minCharacters: 30,
    },
    metadata: {
      lessonName: "Web Lab 2 — Prototype",
      levelPosition: 4,
      totalLevelsInScript: 8,
    },
  },
};
