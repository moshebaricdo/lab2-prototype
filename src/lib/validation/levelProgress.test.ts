import { describe, expect, it } from "vitest";
import { buildLevelProgressSnapshot } from "./levelProgress";
import type { ValidationReviewCardData } from "../../types/validationReview";

describe("buildLevelProgressSnapshot", () => {
  it("summarizes passed and incomplete review criteria", () => {
    const review: ValidationReviewCardData = {
      kind: "summary",
      title: "Photo carousel review",
      mode: "technical",
      status: "in_progress",
      items: [
        {
          id: "next-button",
          label: "Clicking Next shows the second photo.",
          status: "pass",
          detail: "Next works.",
        },
        {
          id: "back-button",
          label: "The student adds a functional Back button.",
          status: "missing",
          detail: "Back is not implemented yet.",
        },
      ],
    };

    expect(buildLevelProgressSnapshot(review)).toEqual(
      expect.objectContaining({
        phase: "partially_complete",
        status: "in_progress",
        passedCriteria: [
          expect.objectContaining({ id: "next-button", status: "pass" }),
        ],
        incompleteCriteria: [
          expect.objectContaining({ id: "back-button", status: "missing" }),
        ],
        nextIncompleteCriterion: expect.objectContaining({
          id: "back-button",
        }),
      }),
    );
  });
});
