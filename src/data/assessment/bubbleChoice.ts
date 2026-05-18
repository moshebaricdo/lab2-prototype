import accessibilityPng from "../../assets/media/accessibility.png";
import colorAndTypePng from "../../assets/media/color-and-type.png";
import layoutFlexboxPng from "../../assets/media/layout-flexbox.png";

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
        id: "img-accessibility",
        title: "Accessibility",
        description: "Make pages easier to use with alt text and clear structure.",
        levelPath: "/levels/multi",
        image: {
          src: accessibilityPng,
          alt: "Preview graphic for an accessibility-focused website path",
        },
      },
      {
        id: "img-color-type",
        title: "Color & type",
        description: "Explore fonts, contrast, and color choices for stronger designs.",
        levelPath: "/levels/free-response",
        image: {
          src: colorAndTypePng,
          alt: "Preview graphic for a color and typography design path",
        },
      },
      {
        id: "img-layout-flexbox",
        title: "Layout & Flexbox",
        description: "Build responsive sections that adapt across screen sizes.",
        levelPath: "/levels/match-connector",
        image: {
          src: layoutFlexboxPng,
          alt: "Preview graphic for a layout and flexbox design path",
        },
      },
    ],
  },
};
