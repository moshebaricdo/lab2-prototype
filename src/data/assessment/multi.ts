export interface MultiChoiceAnswer {
  id: string;
  text: string;
}

export interface MultiChoiceLevelPayload {
  level: {
    id: number;
    name: string;
    type: "Multi";
    question: {
      prompt: string;
      answers: MultiChoiceAnswer[];
      correctAnswerId: string;
    };
    metadata: {
      lessonName: string;
      levelPosition: number;
      totalLevelsInScript: number;
    };
  };
}

export const mockMultiChoiceLevel: MultiChoiceLevelPayload = {
  level: {
    id: 42001,
    name: "Internet Safety Checkpoint",
    type: "Multi",
    question: {
      prompt:
        "A classmate sends you a link and asks for your school password to access a game reward. What should you do first?",
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
    },
    metadata: {
      lessonName: "Digital Citizenship Foundations",
      levelPosition: 3,
      totalLevelsInScript: 8,
    },
  },
};
