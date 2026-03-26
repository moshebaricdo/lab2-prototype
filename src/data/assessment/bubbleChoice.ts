export interface BubbleChoiceOption {
  id: string;
  title: string;
  description: string;
  levelPath: string;
  estimatedMinutes: number;
}

export interface BubbleChoiceLevelPayload {
  level: {
    id: number;
    name: string;
    type: "BubbleChoice";
    prompt: string;
    metadata: {
      lessonName: string;
      levelPosition: number;
      totalLevelsInScript: number;
    };
    options: BubbleChoiceOption[];
  };
}

export const mockBubbleChoiceLevel: BubbleChoiceLevelPayload = {
  level: {
    id: 42005,
    name: "Choose Your Practice Path",
    type: "BubbleChoice",
    prompt:
      "Choose one version of this checkpoint to complete. Each option practices the same concept with a different interaction style.",
    metadata: {
      lessonName: "Digital Citizenship Foundations",
      levelPosition: 7,
      totalLevelsInScript: 8,
    },
    options: [
      {
        id: "path-multi",
        title: "Quick Check (Multiple Choice)",
        description: "Fast comprehension check with one focused question.",
        levelPath: "/levels/multi",
        estimatedMinutes: 3,
      },
      {
        id: "path-free-response",
        title: "Reflective Response",
        description:
          "Explain your thinking in writing with a short free-response answer.",
        levelPath: "/levels/free-response",
        estimatedMinutes: 5,
      },
      {
        id: "path-match",
        title: "Vocabulary Match",
        description:
          "Match key terms to definitions to reinforce core vocabulary.",
        levelPath: "/levels/match",
        estimatedMinutes: 4,
      },
      {
        id: "path-levelgroup",
        title: "Full Challenge Set",
        description:
          "Complete a mixed set with multiple interaction types in one page.",
        levelPath: "/levels/levelgroup",
        estimatedMinutes: 8,
      },
    ],
  },
};
