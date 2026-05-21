import { describe, expect, it } from "vitest";
import type { ValidationReviewCardData } from "../../../../../types/validationReview";
import {
  hasLaterChatMessageForTest,
  hasInstructionGuideActionsForTest,
  validationReviewSuggestionActionsForTest,
} from "./AiTutorMessageList";

function review(overrides: Partial<ValidationReviewCardData>): ValidationReviewCardData {
  return {
    kind: "summary",
    title: "Review",
    mode: "technical",
    status: "needs_work",
    items: [
      {
        id: "item-1",
        label: "Fix the button selector",
        status: "missing",
        detail: "The click handler is still not finding the matching button.",
      },
    ],
    ...overrides,
  };
}

describe("validation review suggestion chips", () => {
  it("uses Debug as the second chip for debug-focused levels", () => {
    const actions = validationReviewSuggestionActionsForTest(
      review({ followUpPreference: "debug" }),
    );

    expect(actions.map((action) => action.action)).toEqual(["hint", "debug"]);
  });

  it("uses Suggestion as the second chip for creative or open-ended levels", () => {
    const actions = validationReviewSuggestionActionsForTest(
      review({
        mode: "open-ended",
        followUpPreference: "suggestion",
        title: "Loop style polish review",
      }),
    );

    expect(actions.map((action) => action.action)).toEqual(["hint", "suggestion"]);
  });

  it("falls back to text heuristics when no level preference is set", () => {
    const actions = validationReviewSuggestionActionsForTest(
      review({
        title: "Starship loader loop review",
        followUpPreference: "auto",
      }),
    );

    expect(actions.map((action) => action.action)).toEqual(["hint", "debug"]);
  });
});

describe("instruction guide actions", () => {
  it("does not expose guide chips because typed conversation drives instruction flow", () => {
    expect(hasInstructionGuideActionsForTest()).toBe(false);
  });
});

describe("action chip visibility", () => {
  it("treats any later chat message as consuming earlier action chips", () => {
    expect(hasLaterChatMessageForTest([
      {
        role: "assistant",
        content: "Start here.",
      },
      {
        role: "assistant",
        content: "I checked your work.",
      },
    ], 0)).toBe(true);
  });

  it("keeps chips available only on the latest chat message", () => {
    expect(hasLaterChatMessageForTest([
      {
        role: "assistant",
        content: "Start here.",
      },
    ], 0)).toBe(false);
  });
});
