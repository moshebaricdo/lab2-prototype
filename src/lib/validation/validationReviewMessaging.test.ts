import { afterEach, describe, expect, it, vi } from "vitest";
import type { ValidationReviewCardData } from "../../types/validationReview";
import {
  buildValidationReviewOfferMessage,
  buildValidationReviewResultMessage,
  generateValidationOfferMessage,
  resolveValidationResultMessage,
} from "./validationReviewMessaging";

vi.mock("../../hooks/useTutorApiSettings", () => ({
  getTutorApiKey: () => "test-key",
  getTutorCodeModel: () => "test-model",
}));

const partialReview: ValidationReviewCardData = {
  kind: "summary",
  title: "Promise trace review",
  mode: "technical",
  status: "in_progress",
  items: [
    {
      id: "labels",
      label: "Label and explain what each step is doing",
      status: "warn",
      detail: "Labels are present but explanations need more detail.",
    },
  ],
};

describe("validationReviewMessaging", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("prefers LLM-authored summaryMessage for review results", () => {
    const message = resolveValidationResultMessage({
      ...partialReview,
      summaryMessage: "Nice job labeling each Promise state — add a short explanation under each comment, then check again.",
    });

    expect(message).toContain("Nice job labeling");
    expect(message).not.toContain("You're making progress");
  });

  it("falls back to programmatic result copy when summaryMessage is absent", () => {
    const message = resolveValidationResultMessage(partialReview);
    expect(message).toContain("You're making progress");
  });

  it("builds readiness-aware offer fallback copy", () => {
    const offer: ValidationReviewCardData = {
      kind: "offer",
      title: "Promise trace review",
      mode: "technical",
      requirements: ["Label and explain what each step is doing"],
    };

    expect(buildValidationReviewOfferMessage("Ok I did it", offer)).toContain("check your work");
  });

  it("uses the LLM offer message when generation succeeds", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              message: "Sounds like you're ready — tap Check my work and I'll walk through the checklist with you.",
            }),
          },
        }],
      }),
    }));

    const message = await generateValidationOfferMessage({
      studentMessage: "Ok I did it",
      review: {
        kind: "offer",
        title: "Promise trace review",
        mode: "technical",
        requirements: ["Label and explain what each step is doing"],
      },
      chatMessages: [{ role: "user", content: "Ok I did it" }],
    });

    expect(message).toContain("Check my work");
    expect(message).not.toBe(buildValidationReviewOfferMessage("Ok I did it", {
      kind: "offer",
      title: "Promise trace review",
      mode: "technical",
    }));
  });

  it("falls back when offer generation fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

    const offer: ValidationReviewCardData = {
      kind: "offer",
      title: "Promise trace review",
      mode: "technical",
    };
    const message = await generateValidationOfferMessage({
      studentMessage: "check my work",
      review: offer,
      chatMessages: [],
    });

    expect(message).toBe(buildValidationReviewOfferMessage("check my work", offer));
  });

  it("describes complete reviews without repeating requirement wording", () => {
    const message = buildValidationReviewResultMessage({
      kind: "summary",
      title: "Style polish review",
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
  });
});
