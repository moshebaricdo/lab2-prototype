import { describe, expect, it } from "vitest";
import { finalizeTutorResponse } from "./responseFinalizer";

describe("finalizeTutorResponse", () => {
  it("removes generic closing lines from guidance without shortening useful detail", () => {
    const result = finalizeTutorResponse({
      message: [
        "A Promise represents work that may finish later.",
        "",
        "In this level, check whether each example is still waiting, completed successfully, or failed.",
        "",
        "Let me know if you have any more questions!",
      ].join("\n"),
      changes: [],
    }, {
      intent: "guidance",
      requestMessage: "What is a Promise?",
    });

    expect(result.message).toContain("A Promise represents work");
    expect(result.message).toContain("In this level");
    expect(result.message).not.toContain("Let me know");
    expect(result.changes).toEqual([]);
  });

  it("condenses long code generation summaries without touching changes", () => {
    const result = finalizeTutorResponse({
      message: [
        "I updated `style.css` to make the navigation links feel more interactive with animated hover underlines and a stronger focus-visible outline.",
        "",
        "I also adjusted the transition timing so the links feel smoother, kept the colors readable, and made sure the focus style is visible for keyboard users.",
        "",
        "You can test this in Preview by hovering the nav links and tabbing through them with the keyboard. Review the diff, then accept the changes if they look right.",
        "",
        "Let me know if you want more help polishing the rest of the page.",
      ].join("\n"),
      saveTitle: "Polish nav link states",
      changes: [{
        fileName: "style.css",
        status: "modified",
        content: ".nav-link:hover { text-decoration: underline; }",
      }],
    }, {
      intent: "edit",
      requestMessage: "Make the nav links feel interactive.",
    });

    expect(result.message.length).toBeLessThan(520);
    expect(result.message).toContain("style.css");
    expect(result.message).toContain("hover");
    expect(result.message).not.toContain("Let me know");
    expect(result.saveTitle).toBe("Polish nav link states");
    expect(result.changes).toEqual([
      expect.objectContaining({
        fileName: "style.css",
        status: "modified",
      }),
    ]);
  });

  it("leaves short code generation summaries alone", () => {
    const message = "I updated `style.css` with stronger hover and focus states. Test the nav links in Preview, then review the diff.";
    const result = finalizeTutorResponse({
      message,
      changes: [{
        fileName: "style.css",
        status: "modified",
      }],
    }, {
      intent: "edit",
      requestMessage: "Improve the nav links.",
    });

    expect(result.message).toBe(message);
  });
});
