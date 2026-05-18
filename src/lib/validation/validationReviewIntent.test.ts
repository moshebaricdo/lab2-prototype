import { describe, expect, it } from "vitest";
import { isValidationReviewIntent } from "./validationReviewIntent";

describe("isValidationReviewIntent", () => {
  it("detects readiness and continue intent", () => {
    expect(isValidationReviewIntent("I think I did it.")).toBe(true);
    expect(isValidationReviewIntent("Can I continue?")).toBe(true);
    expect(isValidationReviewIntent("Please check my work.")).toBe(true);
    expect(isValidationReviewIntent("It works now.")).toBe(true);
    expect(isValidationReviewIntent("That worked, thanks.")).toBe(true);
    expect(isValidationReviewIntent("Oh you're right, I updated and it works now.")).toBe(true);
    expect(isValidationReviewIntent("I'm done.")).toBe(true);
    expect(isValidationReviewIntent("I fixed it.")).toBe(true);
    expect(isValidationReviewIntent("I fixed the button, can you check?")).toBe(true);
    expect(isValidationReviewIntent("I fixed the Next button.")).toBe(true);
    expect(isValidationReviewIntent("We completed the first carousel step.")).toBe(true);
    expect(isValidationReviewIntent("We updated the carousel. Can you review it?")).toBe(true);
  });

  it("does not treat debugging or negated readiness as review intent", () => {
    expect(isValidationReviewIntent("Can you check why this button is broken?")).toBe(false);
    expect(isValidationReviewIntent("I'm not ready to continue yet.")).toBe(false);
    expect(isValidationReviewIntent("Can you review this error with me?")).toBe(false);
    expect(isValidationReviewIntent("I updated the selector but it still isn't working.")).toBe(false);
    expect(isValidationReviewIntent("I fixed the button but I need help debugging it.")).toBe(false);
    expect(isValidationReviewIntent("I thought I fixed the issue by updating the selector but it didn't work, can you help?")).toBe(false);
  });
});
