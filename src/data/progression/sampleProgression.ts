import type { FreeResponseLevelPayload } from "../assessment/freeResponse";
import type { BubbleChoiceLevelPayload } from "../assessment/bubbleChoice";
import type { LevelGroupFlowPayload, LevelGroupQuestionBlock } from "../assessment/levelGroup";
import colorAndTypePng from "../../assets/media/color-and-type.png";
import layoutFlexboxPng from "../../assets/media/layout-flexbox.png";
import accessibilityPng from "../../assets/media/accessibility.png";

const LESSON_NAME = "Intro to HTML & CSS";
const TOTAL_LEVELS = 5;

/**
 * Level 1 is a Web Lab workspace — no assessment payload needed,
 * the page component handles it directly.
 */

/** Level 2 — Standalone free response: reflect on a design decision. */
export const progressionFreeResponse: FreeResponseLevelPayload = {
  level: {
    id: 90001,
    name: "Design Reflection",
    type: "FreeResponse",
    stem: {
      question:
        "Think about the portfolio page you just built. Describe one design decision you made — a color, layout choice, or font — and explain why you chose it.",
      description:
        "Good designers can articulate *why* they made a choice, not just *what* they chose. Your answer should reference a specific element on your page and connect it to how it affects the viewer's experience.",
    },
    question: {
      placeholder:
        "I chose to use … because …",
      minCharacters: 40,
    },
    metadata: {
      lessonName: LESSON_NAME,
      levelPosition: 2,
      totalLevelsInScript: TOTAL_LEVELS,
    },
  },
};

/** Level 3 — Bubble choice: pick a specialization path (3 options). */
export const progressionBubbleChoice: BubbleChoiceLevelPayload = {
  level: {
    id: 90002,
    name: "Choose Your Next Challenge",
    type: "BubbleChoice",
    prompt:
      "Nice work on your portfolio! Now pick a direction to level up your page. Each path practices different CSS skills — choose the one that interests you most.",
    optionLabelStyle: "letter",
    metadata: {
      lessonName: LESSON_NAME,
      levelPosition: 3,
      totalLevelsInScript: TOTAL_LEVELS,
    },
    options: [
      {
        id: "path-color",
        title: "Color & Typography",
        description:
          "Explore CSS custom properties, Google Fonts, and color systems to give your portfolio a polished visual identity.",
        levelPath: "/levels/progression-branch-color",
        image: {
          src: colorAndTypePng,
          alt: "Cover graphic for the Color and Typography path",
        },
      },
      {
        id: "path-layout",
        title: "Layout & Flexbox",
        description:
          "Use Flexbox and CSS Grid to build a responsive project gallery that looks great on any screen size.",
        levelPath: "/levels/progression-branch-layout",
        image: {
          src: layoutFlexboxPng,
          alt: "Cover graphic for the Layout and Flexbox path",
        },
      },
      {
        id: "path-media",
        title: "Images & Accessibility",
        description:
          "Add hero images, optimize loading, and make sure your page works well with screen readers.",
        levelPath: "/levels/progression-branch-media",
        image: {
          src: accessibilityPng,
          alt: "Cover graphic for the Images and Accessibility path",
        },
      },
    ],
  },
};

/** Level 5 — Stepped level group: HTML & CSS checkpoint quiz. */
const checkpointSteps: LevelGroupQuestionBlock[] = [
  {
    kind: "multi",
    blockId: "prog-m1",
    question: {
      id: "prog-multi-1",
      prompt:
        "Which CSS property controls the space between an element's content and its border?",
      answers: [
        { id: "a", text: "margin" },
        { id: "b", text: "padding" },
        { id: "c", text: "border-spacing" },
        { id: "d", text: "gap" },
      ],
      correctAnswerId: "b",
    },
  },
  {
    kind: "multi",
    blockId: "prog-m2",
    question: {
      id: "prog-multi-2",
      prompt:
        "Which HTML element is the correct container for navigation links?",
      answers: [
        { id: "a", contentBlocks: [{ type: "code", code: '<div class="nav">' }] },
        { id: "b", contentBlocks: [{ type: "code", code: "<navigation>" }] },
        { id: "c", contentBlocks: [{ type: "code", code: "<nav>" }] },
        { id: "d", contentBlocks: [{ type: "code", code: "<header>" }] },
      ],
      correctAnswerId: "c",
    },
  },
  {
    kind: "freeResponse",
    blockId: "prog-fr1",
    question: {
      id: "prog-free-1",
      prompt:
        "Explain in your own words: what is the difference between an inline element and a block element in HTML? Give one example of each.",
      placeholder: "An inline element is … while a block element …",
      minCharacters: 50,
      revealAnswerEnabled: true,
      teacherAnswer: {
        exemplar:
          "A block element (like <div> or <p>) takes up the full width of its container and starts on a new line. An inline element (like <span> or <a>) only takes up as much width as its content and flows within the surrounding text.",
        rubricCriteria: [
          "Correctly distinguishes block vs. inline behavior.",
          "Provides at least one valid example of each.",
        ],
      },
    },
  },
  {
    kind: "match",
    blockId: "prog-match1",
    question: {
      id: "prog-match-1",
      prompt: "Match each CSS property to what it controls.",
      terms: [
        { id: "t1", text: "font-family" },
        { id: "t2", text: "display: flex" },
        { id: "t3", text: "background-color" },
        { id: "t4", text: "border-radius" },
      ],
      prompts: [
        {
          id: "p1",
          text: "Changes the typeface used for text content.",
          correctTermId: "t1",
        },
        {
          id: "p2",
          text: "Turns a container into a flexible layout context.",
          correctTermId: "t2",
        },
        {
          id: "p3",
          text: "Sets the fill color behind an element's content.",
          correctTermId: "t3",
        },
        {
          id: "p4",
          text: "Rounds the corners of an element's box.",
          correctTermId: "t4",
        },
      ],
    },
  },
  {
    kind: "multi",
    blockId: "prog-m3",
    question: {
      id: "prog-multi-3",
      prompt:
        'What does the CSS declaration `color: inherit;` do?',
      answers: [
        { id: "a", text: "Resets the color to the browser default (usually black)." },
        { id: "b", text: "Uses the same color value as the element's parent." },
        { id: "c", text: "Makes the text transparent." },
        { id: "d", text: "Applies the last color set anywhere on the page." },
      ],
      correctAnswerId: "b",
    },
  },
];

export const progressionLevelGroup: LevelGroupFlowPayload = {
  level: {
    id: 90003,
    name: "HTML & CSS Checkpoint",
    type: "LevelGroup",
    metadata: {
      lessonName: LESSON_NAME,
      assessmentName: "Intro to HTML & CSS — Unit Checkpoint",
      levelPosition: 5,
      totalLevelsInScript: TOTAL_LEVELS,
    },
    intro: {
      overviewContent: `This short checkpoint covers the core HTML and CSS concepts from the Intro to HTML & CSS unit: semantic elements, the box model, layout with Flexbox, and typography.

You'll see a mix of multiple-choice questions, a short written response, and a matching activity. Take your time — this is about understanding, not speed.

When you're ready, press **Begin assessment** to start.`,
      timeMinutes: 15,
      attempts: 2,
    },
    steps: checkpointSteps,
  },
};
