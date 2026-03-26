export interface FreeResponseLevelPayload {
  level: {
    id: number;
    name: string;
    type: "FreeResponse";
    question: {
      prompt: string;
      placeholder: string;
      minCharacters: number;
    };
    metadata: {
      lessonName: string;
      levelPosition: number;
      totalLevelsInScript: number;
    };
  };
}

export const mockFreeResponseLevel: FreeResponseLevelPayload = {
  level: {
    id: 42002,
    name: "Online Communication Reflection",
    type: "FreeResponse",
    question: {
      prompt:
        "Describe one way you can give constructive feedback to a classmate online while keeping the conversation respectful.",
      placeholder:
        "Type your response here. Include an example sentence you could use.",
      minCharacters: 40,
    },
    metadata: {
      lessonName: "Digital Citizenship Foundations",
      levelPosition: 4,
      totalLevelsInScript: 8,
    },
  },
};
