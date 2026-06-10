import { afterEach, describe, expect, it, vi } from "vitest";

import type { TutorValidationReviewIntentProvider } from "../tutor/provider/openAiProvider";
import type { TutorValidationReviewIntentResponse } from "../tutor/types";
import { hasHardSkipValidationReviewIntent } from "./validationReviewIntent";
import {
  classifyValidationReviewIntentWithModel,
  failClosedValidationReviewIntent,
  isAffirmationAfterReviewOffer,
  resolveValidationReviewIntent,
} from "./validationReviewIntentClassifier";
import { VALIDATION_REVIEW_INTENT_FIXTURES } from "./validationReviewIntentFixtures";

vi.mock("../../hooks/useTutorApiSettings", () => ({
  getTutorApiKey: () => "",
  getTutorCodeModel: () => "gpt-4.1",
}));

function mockProvider(
  response: TutorValidationReviewIntentResponse | null,
): TutorValidationReviewIntentProvider {
  return {
    requestValidationReviewIntent: vi.fn(async () => response),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("hasHardSkipValidationReviewIntent", () => {
  it("blocks debugging and negated readiness without calling the model", () => {
    expect(hasHardSkipValidationReviewIntent("I need help debugging this button.")).toBe(true);
    expect(hasHardSkipValidationReviewIntent("I'm not ready to continue yet.")).toBe(true);
    expect(hasHardSkipValidationReviewIntent("How do I know when I'm actually done?")).toBe(true);
  });
});

describe("isAffirmationAfterReviewOffer", () => {
  it("accepts bare affirmations only when Tutor offered a review", () => {
    expect(isAffirmationAfterReviewOffer("yes", { lastAssistantOfferedReview: true })).toBe(true);
    expect(isAffirmationAfterReviewOffer("yes", { lastAssistantOfferedReview: false })).toBe(false);
  });
});

describe("classifyValidationReviewIntentWithModel", () => {
  it("fail-closed when no API key is present", async () => {
    const result = await classifyValidationReviewIntentWithModel({
      message: "Can you review my work?",
    });

    expect(result).toEqual(failClosedValidationReviewIntent());
  });

  it("uses the model verdict when shouldRunReview is high confidence", async () => {
    const provider = mockProvider({
      shouldRunReview: true,
      confidence: "high",
      reason: "explicit review request",
    });

    const result = await classifyValidationReviewIntentWithModel({
      message: "ready to request a review",
      provider,
    });

    expect(result.source).toBe("model");
    expect(result.shouldRunReview).toBe(true);
    expect(provider.requestValidationReviewIntent).toHaveBeenCalledOnce();
  });

  it("fail-closed when the model is low confidence", async () => {
    const provider = mockProvider({
      shouldRunReview: true,
      confidence: "low",
    });

    const result = await classifyValidationReviewIntentWithModel({
      message: "maybe check?",
      provider,
    });

    expect(result.shouldRunReview).toBe(false);
  });
});

describe("resolveValidationReviewIntent", () => {
  it("fail-closed without an API key even for obvious readiness phrases", async () => {
    const result = await resolveValidationReviewIntent({
      message: "Am I done?",
    });

    expect(result.shouldRunReview).toBe(false);
    expect(result).toEqual(failClosedValidationReviewIntent());
  });

  it("routes echo phrases through the model when a provider is injected", async () => {
    const provider = mockProvider({
      shouldRunReview: true,
      confidence: "high",
      reason: "accepted review invitation",
    });

    const result = await resolveValidationReviewIntent({
      message: "ready to request a review",
      workflow: { lastAssistantOfferedReview: true },
      provider,
    });

    expect(result.source).toBe("model");
    expect(result.shouldRunReview).toBe(true);
  });

  it("matches fixture expectations with a stub provider", async () => {
    for (const fixture of VALIDATION_REVIEW_INTENT_FIXTURES) {
      if (fixture.message === "yes" && fixture.lastAssistantOfferedReview) {
        const result = await resolveValidationReviewIntent({
          message: fixture.message,
          workflow: { lastAssistantOfferedReview: fixture.lastAssistantOfferedReview },
        });
        expect(result.shouldRunReview, fixture.note).toBe(fixture.expectedShouldRunReview);
        continue;
      }

      const provider = mockProvider({
        shouldRunReview: fixture.expectedShouldRunReview,
        confidence: "high",
      });

      const result = await resolveValidationReviewIntent({
        message: fixture.message,
        context: fixture.context,
        workflow: {
          lastAssistantOfferedReview: fixture.lastAssistantOfferedReview,
        },
        provider,
      });

      expect(result.shouldRunReview, fixture.note).toBe(fixture.expectedShouldRunReview);
    }
  });
});
