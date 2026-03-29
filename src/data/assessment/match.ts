export interface MatchTerm {
  id: string;
  text: string;
}

export interface MatchPrompt {
  id: string;
  text: string;
  correctTermId: string;
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
      question: "Match each digital citizenship definition with the correct term.",
      description: "Match each term with the correct definition.",
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
