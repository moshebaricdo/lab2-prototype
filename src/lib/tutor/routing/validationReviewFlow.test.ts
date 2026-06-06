import { describe, expect, it } from "vitest";
import type { ValidationReviewCardData } from "../../../types/validationReview";
import {
  appendValidationReviewResultToConversation,
  buildValidationOfferMessage,
  buildValidationReviewOfferChatMessage,
  hideValidationReviewOfferActionsWithAlert,
} from "./validationReviewFlow";

const offer: ValidationReviewCardData = {
  kind: "offer",
  title: "Style polish review",
  mode: "open-ended",
  requirements: ["Improve nav links", "Improve buttons"],
};

describe("validationReviewFlow", () => {
  it("builds readiness-aware offer copy", () => {
    expect(buildValidationOfferMessage("I'm done!", offer)).toContain("check your work");
    expect(buildValidationOfferMessage("check my work", offer)).toContain("progress");
  });

  it("builds a chat offer message with the review card attached", () => {
    const message = buildValidationReviewOfferChatMessage("I'm done!", offer);
    expect(message.role).toBe("assistant");
    expect(message.validationReview).toBe(offer);
  });

  it("replaces pending offer cards with an alert before appending results", () => {
    const conversation = [
      { role: "user" as const, content: "I'm done!" },
      { role: "assistant" as const, content: "Ready?", validationReview: offer },
    ];

    const next = appendValidationReviewResultToConversation(
      conversation,
      { ...offer, kind: "summary", status: "in_progress" },
      "You're making progress.",
    );

    expect(next.some((message) => message.isAlert && message.alertVariant === "validation")).toBe(true);
    expect(next.at(-1)?.validationReview?.kind).toBe("summary");
  });

  it("clears offer actions without inserting duplicate alerts", () => {
    const conversation = [
      { role: "assistant" as const, content: "Ready?", validationReview: offer },
    ];

    const next = hideValidationReviewOfferActionsWithAlert(conversation);
    expect(next.filter((message) => message.isAlert)).toHaveLength(1);
    expect(next[0].validationReview).toBeUndefined();
  });
});
