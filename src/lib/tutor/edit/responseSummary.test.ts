import { describe, expect, it } from "vitest";
import { summarizeTutorEditResponse } from "./responseSummary";

describe("summarizeTutorEditResponse", () => {
  it("replaces generic edit messages with a file-aware summary", () => {
    expect(
      summarizeTutorEditResponse({
        responseMessage: "Updated the project.",
        requestMessage: "Improve the nav link hover styles.",
        changes: [{ fileName: "style.css", status: "modified", linesAdded: 3, linesRemoved: 1 }],
      }),
    ).toContain("`style.css`");
  });

  it("keeps useful model-provided messages", () => {
    const message = "I updated `style.css` so the nav links have clearer hover and focus states.";

    expect(
      summarizeTutorEditResponse({
        responseMessage: message,
        requestMessage: "Improve the nav link hover styles.",
        changes: [{ fileName: "style.css", status: "modified", linesAdded: 3, linesRemoved: 1 }],
      }),
    ).toBe(message);
  });
});
