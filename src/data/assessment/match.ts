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
    question: {
      prompt: string;
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
    question: {
      prompt:
        "Match each digital citizenship definition with the correct term.",
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
