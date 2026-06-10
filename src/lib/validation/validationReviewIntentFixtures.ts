import type { ChatMessage } from "../../types/chat";
import type { ValidationReviewIntentClassifierContext } from "./validationReviewIntentClassifier";

export interface ValidationReviewIntentFixture {
  message: string;
  context?: ValidationReviewIntentClassifierContext;
  lastAssistantOfferedReview?: boolean;
  expectedShouldRunReview: boolean;
  note: string;
}

const featureRouletteInstructions = `
# Feature Roulette
Create a new feature with AI Tutor, save with a comment, and revert as needed.
`.trim();

function conversationAfterRevert(): ChatMessage[] {
  return [
    {
      role: "user",
      content: "Ok, I did the last step and reverted!",
    },
    {
      role: "assistant",
      content:
        "Perfect, you've now completed all the steps. If everything looks as expected, you're ready to request a review or check your progress!",
    },
  ];
}

/**
 * Labeled corpus for the model-assisted validation-review intent gate.
 * Includes phrasings from live tutor chat logs where regex alone misfired.
 */
export const VALIDATION_REVIEW_INTENT_FIXTURES: ValidationReviewIntentFixture[] = [
  {
    message: "Am I done?",
    expectedShouldRunReview: true,
    note: "direct readiness question",
  },
  {
    message: "Can you review my work?",
    expectedShouldRunReview: true,
    note: "explicit review request",
  },
  {
    message: "ready to request a review",
    context: { conversation: conversationAfterRevert() },
    lastAssistantOfferedReview: true,
    expectedShouldRunReview: true,
    note: "chat log (22): echo after tutor invited review",
  },
  {
    message: "request a formal review",
    context: {
      conversation: conversationAfterRevert(),
      levelInstructionsMarkdown: featureRouletteInstructions,
    },
    expectedShouldRunReview: true,
    note: "tutor told student to request formal review",
  },
  {
    message: "check my progress",
    expectedShouldRunReview: true,
    note: "progress check phrasing",
  },
  {
    message: "I got the Next button working.",
    expectedShouldRunReview: true,
    note: "success report with implicit check intent",
  },
  {
    message: "Can you check why this button is broken?",
    expectedShouldRunReview: false,
    note: "debugging ask must stay in guidance",
  },
  {
    message: "I'm not ready to continue yet.",
    expectedShouldRunReview: false,
    note: "negated readiness",
  },
  {
    message: "How do I know when I'm actually done?",
    expectedShouldRunReview: false,
    note: "meta readiness question, not a check request",
  },
  {
    message: "Can you review this error with me?",
    expectedShouldRunReview: false,
    note: "co-debug, not checklist review",
  },
  {
    message: "make the cards look better",
    expectedShouldRunReview: false,
    note: "edit request",
  },
  {
    message: "yes",
    lastAssistantOfferedReview: true,
    expectedShouldRunReview: true,
    note: "bare affirmation after review offer — deterministic fast path",
  },
];
