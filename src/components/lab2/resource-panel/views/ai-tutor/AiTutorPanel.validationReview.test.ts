import { describe, expect, it } from "vitest";
import type { ValidationReviewCardData } from "../../../../../types/validationReview";
import {
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

    expect(message).toContain("made progress");
    expect(message).toContain("current project");
    expect(message).toContain("level's goals");
    expect(message).toContain("what to work on next");
    expect(message).not.toContain("Clicking Next");
    expect(message).not.toContain("#photo2");
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

    expect(message).toContain("Start with");
    expect(message).toContain("check again");
  });
});
