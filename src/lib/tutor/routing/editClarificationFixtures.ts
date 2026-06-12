import type { ChatMessage } from "../../../types/chat";
import type { InstructionGuide, InstructionGuideState } from "../../../types/tutor";
import type { EditClarificationClassifierContext } from "./editClarificationClassifier";

/**
 * Labeled corpus for the model-assisted edit-clarification gate. Documents
 * phrasings where underspecification depends on level context and conversation
 * history, not keyword lists alone.
 */
export interface EditClarificationFixture {
  message: string;
  context: EditClarificationClassifierContext;
  expectedShouldClarify: boolean;
  note: string;
}

const curriculum: EditClarificationClassifierContext = {
  supportContext: "curriculum-level",
};

const openEndedFeatureInstructions = `
# Add a Feature
Use AI Tutor to add or improve a page feature such as a navigation bar, hero section, cards, or footer.
`.trim();

const openEndedGuide: InstructionGuide = {
  type: "choice-based",
  id: "add-a-feature",
  sourceSignature: "fixture-open-ended",
  goal: "Add or improve a page feature",
  constraints: [],
  options: [
    {
      id: "navigation-bar",
      label: "Navigation bar",
      prompt: "Add a top navigation bar with links",
      intent: "content-choice",
      editOriented: true,
    },
    {
      id: "content-cards",
      label: "Content cards",
      prompt: "Add a row of content cards to the main area",
      intent: "content-choice",
      editOriented: true,
    },
    {
      id: "hero-section",
      label: "Hero section",
      prompt: "Add a hero section with a headline and call to action",
      intent: "content-choice",
      editOriented: true,
    },
  ],
  fallbackMarkdown: openEndedFeatureInstructions,
};

const openEndedGuideState: InstructionGuideState = {
  guideSignature: "fixture-open-ended",
  completedStepIds: [],
};

function conversationAfterNavbar(accepted = true): ChatMessage[] {
  return [
    {
      role: "user",
      content: "I want to add a navbar",
    },
    {
      role: "assistant",
      content: "A basic navbar has been added to the top of your page.",
      ...(accepted ? { codeChangeStatus: "accepted" as const } : {}),
    },
  ];
}

function conversationAfterCards(): ChatMessage[] {
  return [
    ...conversationAfterNavbar(),
    {
      role: "user",
      content: "Next, let's add cards",
    },
    {
      role: "assistant",
      content: "Cards have been added to your main content area.",
      codeChangeStatus: "accepted",
    },
  ];
}

function conversationAfterSingleInfoCard(): ChatMessage[] {
  return [
    {
      role: "user",
      content: "add a card",
    },
    {
      role: "assistant",
      content:
        "Added a visually distinct info card to index.html using a div.card with a heading and paragraph.",
      codeChangeStatus: "accepted",
    },
    {
      role: "user",
      content: "Please add the import",
    },
    {
      role: "assistant",
      content: "Added a link to style.css in the head of index.html.",
      codeChangeStatus: "accepted",
    },
  ];
}

function conversationAfterThreeCards(): ChatMessage[] {
  return [
    ...conversationAfterSingleInfoCard(),
    {
      role: "user",
      content: "let's add 2 more cards",
    },
    {
      role: "assistant",
      content: "Duplicated the info card structure so there are now three cards.",
      codeChangeStatus: "accepted",
    },
  ];
}

export const EDIT_CLARIFICATION_FIXTURES: EditClarificationFixture[] = [
  // --- Chat log: open-ended feature level (model should clarify) ---
  {
    message: "I want to add a navbar",
    context: {
      ...curriculum,
      levelInstructionsMarkdown: openEndedFeatureInstructions,
      guide: openEndedGuide,
      guideState: openEndedGuideState,
    },
    expectedShouldClarify: true,
    note: "Greenfield feature add on an open-ended level; layout, links, and styling are still open.",
  },
  {
    message: "Can we make it less ugly?",
    context: {
      ...curriculum,
      levelInstructionsMarkdown: openEndedFeatureInstructions,
      conversation: conversationAfterNavbar(),
    },
    expectedShouldClarify: true,
    note: "Subjective polish after navbar was added.",
  },
  {
    message: "Next, let's add cards",
    context: {
      ...curriculum,
      levelInstructionsMarkdown: openEndedFeatureInstructions,
      conversation: conversationAfterNavbar(),
    },
    expectedShouldClarify: true,
    note: "Feature add without count, layout, or content specifics.",
  },
  {
    message: "Can you make the cards better",
    context: {
      ...curriculum,
      levelInstructionsMarkdown: openEndedFeatureInstructions,
      conversation: conversationAfterCards(),
    },
    expectedShouldClarify: true,
    note: "Refinement request after cards exist.",
  },
  {
    message: "I want to improve the nav links",
    context: {
      ...curriculum,
      levelInstructionsMarkdown: openEndedFeatureInstructions,
      guide: {
        ...openEndedGuide,
        id: "style-polish",
        goal: "Polish the page styling",
        options: [
          {
            id: "polish-nav-links",
            label: "Polish nav links",
            prompt: "Make the nav bar links feel interactive",
            intent: "style-polish",
            editOriented: true,
          },
          {
            id: "improve-buttons",
            label: "Improve buttons",
            prompt: "Make the buttons feel distinct and polished",
            intent: "style-polish",
            editOriented: true,
          },
        ],
      },
      guideState: openEndedGuideState,
    },
    expectedShouldClarify: true,
    note: "Chat-log phrasing from the loop polish level: broad focus selection, not a concrete treatment.",
  },

  // --- Should proceed without an options card ---
  {
    message: "Improve the nav link hover styles.",
    context: curriculum,
    expectedShouldClarify: false,
    note: "Names a concrete styling target (hover).",
  },
  {
    message: "make all buttons blue",
    context: curriculum,
    expectedShouldClarify: false,
    note: "Names a concrete color change.",
  },
  {
    message: "add 3 cards with images below the nav",
    context: {
      ...curriculum,
      levelInstructionsMarkdown: openEndedFeatureInstructions,
      conversation: conversationAfterNavbar(),
    },
    expectedShouldClarify: false,
    note: "Feature add with count, content, and placement specified.",
  },
  {
    message: "make all of the buttons more exciting",
    context: curriculum,
    expectedShouldClarify: true,
    note: "Vague quality goal without concrete CSS properties.",
  },
  {
    message: "Let's refine the buttons",
    context: curriculum,
    expectedShouldClarify: true,
    note: "Broad polish request without concrete CSS properties.",
  },
  {
    message: "Build the project described in Plans/PROJECT_PLAN.md. Update the plan status and check off the completed items as part of the proposal.",
    context: { ...curriculum, supportContext: "standalone-project" },
    expectedShouldClarify: false,
    note: "Teacher/system concrete build request hard-skips clarification.",
  },

  // --- Iteration on established project elements: proceed directly ---
  {
    message: "let's add 2 more cards",
    context: {
      ...curriculum,
      levelInstructionsMarkdown: openEndedFeatureInstructions,
      conversation: conversationAfterSingleInfoCard(),
    },
    expectedShouldClarify: false,
    note: "Extends an existing card pattern with an explicit count.",
  },
  {
    message: "Make the cards horizontal",
    context: {
      ...curriculum,
      levelInstructionsMarkdown: openEndedFeatureInstructions,
      conversation: conversationAfterThreeCards(),
    },
    expectedShouldClarify: false,
    note: "Names a clear layout direction for elements already in the project.",
  },

  // --- Linear / debug levels: prefer direct edit ---
  {
    message: "add a footer with my name and the year",
    context: {
      supportContext: "standalone-project",
      guide: {
        type: "linear",
        id: "starter-page",
        sourceSignature: "fixture-linear",
        overview: "Build a starter page",
        firstMove: "Add a footer",
        steps: [
          {
            id: "footer",
            title: "Add a footer",
            intent: "fix",
            expectedStudentMove: "code-change",
          },
        ],
        fallbackMarkdown: "Add a footer with your name and the year.",
      },
    },
    expectedShouldClarify: false,
    note: "Linear level with a prescribed step; a reasonable default edit is fine.",
  },
];
