import { describe, expect, it } from "vitest";
import { hasHardSkipValidationReviewIntent } from "./validationReviewIntent";

describe("hasHardSkipValidationReviewIntent", () => {
  it("blocks debugging, negated readiness, and meta help questions", () => {
    expect(hasHardSkipValidationReviewIntent("I need help debugging this button.")).toBe(true);
    expect(hasHardSkipValidationReviewIntent("I'm not ready to continue yet.")).toBe(true);
    expect(hasHardSkipValidationReviewIntent("How do I know when I'm actually done?")).toBe(true);
    expect(hasHardSkipValidationReviewIntent("Can you check why this button is broken?")).toBe(true);
  });

  it("does not block clear readiness requests", () => {
    expect(hasHardSkipValidationReviewIntent("Am I done?")).toBe(false);
    expect(hasHardSkipValidationReviewIntent("check my work")).toBe(false);
    expect(hasHardSkipValidationReviewIntent("ready to request a review")).toBe(false);
  });
});
