import { describe, expect, it } from "vitest";
import type { ValidationReviewCardData } from "../../../../../types/validationReview";
import {
  buildInstructionGuideSeedMessage,
  buildValidationReviewActionPrompt,
  buildValidationReviewOfferMessage,
  buildValidationReviewResultMessage,
} from "./AiTutorPanel";

const partialReview: ValidationReviewCardData = {
  kind: "summary",
  title: "Photo carousel review",
  mode: "technical",
  status: "in_progress",
  items: [
    {
      id: "next-button",
      label: "Clicking Next hides the first photo and shows the existing '#photo2' image.",
      status: "pass",
      detail: "Next works.",
    },
    {
      id: "back-button",
      label: "The student adds a functional Back button to the carousel.",
      status: "missing",
      detail: "Back has not been added yet.",
    },
  ],
};

describe("validation review progress copy", () => {
  it("sets up checks with actionable review context", () => {
    const offer: ValidationReviewCardData = {
      kind: "offer",
      title: "Photo carousel review",
      mode: "technical",
      requirements: [
        "Clicking Next hides the first photo and shows the existing '#photo2' image.",
        "The student adds a functional Back button to the carousel.",
      ],
    };

    const message = buildValidationReviewOfferMessage("I fixed the Next button.", offer);

    expect(message).toContain("check your work");
    expect(message).toContain("ready to continue");
    expect(message).not.toContain("Clicking Next");
    expect(message).not.toContain("#photo2");
  });

  it("offers review immediately when a student says the fix works", () => {
    const offer: ValidationReviewCardData = {
      kind: "offer",
      title: "Photo carousel review",
      mode: "technical",
      requirements: [
        "Clicking Next hides the first photo and shows the existing '#photo2' image.",
      ],
    };

    const message = buildValidationReviewOfferMessage("I got the Next button working.", offer);

    expect(message).toBe("Great. I can check your work now and let you know whether you're ready to continue.");
  });

  it("describes partial progress without generic debug language", () => {
    const message = buildValidationReviewResultMessage(partialReview);

    expect(message).toContain("looks complete");
    expect(message).toContain("Back button");
    expect(message).not.toMatch(/\bDebug\b/i);
  });

  it("does not truncate long checklist labels into awkward fragments", () => {
    const message = buildValidationReviewResultMessage({
      ...partialReview,
      items: [
        {
          id: "caption",
          label: "The caption updates.",
          status: "pass",
          detail: "Caption updates.",
        },
        {
          id: "long-item",
          label: "Clicking Next hides the first photo and shows the existing '#photo2' image without relying on a missing selector.",
          status: "missing",
          detail: "Selector still needs work.",
        },
      ],
    });

    expect(message).toContain("remaining checklist item");
    expect(message).not.toContain("...");
    expect(message).not.toContain("without rely");
  });

  it("targets hint prompts to the next incomplete criterion", () => {
    expect(buildValidationReviewActionPrompt("hint", partialReview)).toContain("Back button");
    expect(buildValidationReviewActionPrompt("debug", partialReview)).toContain("Back button");
  });

  it("gives open-ended not-started reviews an encouraging next step", () => {
    const message = buildValidationReviewResultMessage({
      kind: "summary",
      title: "Loop style polish review",
      mode: "open-ended",
      status: "not_started",
      items: [
        {
          id: "style-polish",
          label: "The student makes at least one intentional refinement.",
          status: "missing",
          detail: "No project file changes detected yet.",
        },
      ],
      nextStep:
        "Start with one small style refinement. You can ask Tutor to make a hover, focus, spacing, or color update, then check again when you have a change to review.",
    });

    expect(message).toContain("focused update");
    expect(message).toContain("check again");
  });

  it("describes complete reviews without repeating the requirement wording", () => {
    const message = buildValidationReviewResultMessage({
      kind: "summary",
      title: "Loop style polish review",
      mode: "open-ended",
      status: "likely_complete",
      items: [
        {
          id: "style-polish",
          label: "Make one intentional style refinement",
          status: "pass",
          detail: "Evidence found.",
        },
      ],
    });

    expect(message).toBe("Nice work, this looks ready to continue.");
    expect(message).not.toContain("level goal");
    expect(message).not.toContain("Make one intentional");
  });
});

describe("instruction guide onboarding copy", () => {
  const guide = {
    type: "linear" as const,
    id: "debug-carousel",
    sourceSignature: "test-guide",
    overview: "You will debug a carousel button.",
    firstMove: "Run the project and click Next once.",
    steps: [
      {
        id: "test-it",
        title: "Test it",
        intent: "observe" as const,
        expectedStudentMove: "observation" as const,
        prompt: "Notice what changes and what stays the same.",
      },
    ],
    fallbackMarkdown: "# Do This\n\nTest the carousel.",
  };

  it("creates reproducible seed messages from the current guide", () => {
    const message = buildInstructionGuideSeedMessage(guide);

    expect(message.role).toBe("assistant");
    expect(message.content).toContain("Let's debug");
    expect(message.content).toContain("run the project and click Next once");
    expect(message.content).toContain("Tell me what you notice.");
    expect(message.content).not.toContain("**Start here**");
    expect(message.content).not.toContain("To get started");
    expect(message.instructionGuide).toBe(guide);
    expect(message.instructionGuideSignature).toContain("debug a carousel");
  });
});
