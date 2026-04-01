export interface BubbleChoiceOption {
  id: string;
  title: string;
  description: string;
  levelPath: string;
  /** Optional preview image shown above the title. */
  image?: {
    src: string;
    alt: string;
  };
}

/** How each option card is labeled in the UI (by index). */
export type BubbleChoiceOptionLabelStyle = "number" | "letter";

export interface BubbleChoiceLevelPayload {
  level: {
    id: number;
    name: string;
    type: "BubbleChoice";
    prompt: string;
    /** Labels options as 1,2,3… or A,B,C… */
    optionLabelStyle?: BubbleChoiceOptionLabelStyle;
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
    optionLabelStyle: "letter",
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
      },
      {
        id: "path-free-response",
        title: "Reflective Response",
        description:
          "Explain your thinking in writing with a short free-response answer.",
        levelPath: "/levels/free-response",
      },
      {
        id: "path-match",
        title: "Vocabulary Match",
        description:
          "Match key terms to definitions to reinforce core vocabulary.",
        levelPath: "/levels/match-connector",
      },
      {
        id: "path-levelgroup",
        title: "Full Challenge Set",
        description:
          "Complete a mixed set with multiple interaction types in one page.",
        levelPath: "/levels/levelgroup-scroll",
      },
    ],
  },
};

/** Bubble choice with an image on every card (common “pick a path” pattern). */
export const mockBubbleChoiceLevelWithImages: BubbleChoiceLevelPayload = {
  level: {
    id: 42006,
    name: "Pick a starter activity",
    type: "BubbleChoice",
    prompt:
      "Each card shows a preview. Choose one path to continue—every option covers the same ideas with a different focus.",
    optionLabelStyle: "number",
    metadata: {
      lessonName: "Creative Coding Lab",
      levelPosition: 3,
      totalLevelsInScript: 10,
    },
    options: [
      {
        id: "img-animate",
        title: "Animation basics",
        description: "Move sprites and choreograph simple scenes.",
        levelPath: "/levels/multi",
        image: {
          src: "https://placehold.co/400x250/e8f5ff/1e3a8a?text=Animation",
          alt: "Placeholder thumbnail suggesting motion blocks and a stage preview",
        },
      },
      {
        id: "img-data",
        title: "Data & variables",
        description: "Store values and show them on screen as your program runs.",
        levelPath: "/levels/free-response",
        image: {
          src: "https://placehold.co/400x250/f0fdf4/166534?text=Data",
          alt: "Placeholder thumbnail suggesting variables and a simple counter display",
        },
      },
      {
        id: "img-events",
        title: "Events & input",
        description: "React to clicks and keys to control your project.",
        levelPath: "/levels/match-connector",
        image: {
          src: "https://placehold.co/400x250/fef3c7/92400e?text=Events",
          alt: "Placeholder thumbnail suggesting when-clicked blocks and keyboard input",
        },
      },
      {
        id: "img-mixed",
        title: "Mixed challenge",
        description: "A longer set that combines several skills in one flow.",
        levelPath: "/levels/levelgroup-scroll",
        image: {
          src: "https://placehold.co/400x250/fce7f3/9d174d?text=Challenge",
          alt: "Placeholder thumbnail suggesting multiple block types in one workspace",
        },
      },
    ],
  },
};
