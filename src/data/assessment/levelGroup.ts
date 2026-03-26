export interface LevelGroupMultiQuestion {
  id: string;
  prompt: string;
  answers: Array<{ id: string; text: string }>;
  correctAnswerId: string;
}

export interface LevelGroupFreeResponseQuestion {
  id: string;
  prompt: string;
  placeholder: string;
  minCharacters: number;
}

export interface LevelGroupMatchQuestion {
  id: string;
  prompt: string;
  terms: Array<{ id: string; text: string }>;
  prompts: Array<{ id: string; text: string; correctTermId: string }>;
}

export interface LevelGroupPayload {
  level: {
    id: number;
    name: string;
    type: "LevelGroup";
    metadata: {
      lessonName: string;
      levelPosition: number;
      totalLevelsInScript: number;
    };
    questions: {
      multi: LevelGroupMultiQuestion;
      freeResponse: LevelGroupFreeResponseQuestion;
      match: LevelGroupMatchQuestion;
    };
  };
}

export const mockLevelGroup: LevelGroupPayload = {
  level: {
    id: 42004,
    name: "Assessment Checkpoint",
    type: "LevelGroup",
    metadata: {
      lessonName: "Digital Citizenship Foundations",
      levelPosition: 6,
      totalLevelsInScript: 8,
    },
    questions: {
      multi: {
        id: "multi-1",
        prompt: "Which action best protects your account from unauthorized access?",
        answers: [
          { id: "a", text: "Use the same password for every site." },
          { id: "b", text: "Enable two-factor authentication." },
          { id: "c", text: "Share your password with close friends." },
          { id: "d", text: "Save your password in public chat." },
        ],
        correctAnswerId: "b",
      },
      freeResponse: {
        id: "free-1",
        prompt:
          "Write one sentence you could post to give respectful, constructive feedback on a peer's project.",
        placeholder: "Type your feedback sentence...",
        minCharacters: 30,
      },
      match: {
        id: "match-1",
        prompt: "Match each term to its definition.",
        terms: [
          { id: "m1", text: "Privacy settings" },
          { id: "m2", text: "Citation" },
          { id: "m3", text: "Secure network" },
        ],
        prompts: [
          {
            id: "mp1",
            text: "Rules that control who can view or contact you online.",
            correctTermId: "m1",
          },
          {
            id: "mp2",
            text: "Giving credit to a source when using someone else's work.",
            correctTermId: "m2",
          },
          {
            id: "mp3",
            text: "An internet connection that protects data from interception.",
            correctTermId: "m3",
          },
        ],
      },
    },
  },
};
