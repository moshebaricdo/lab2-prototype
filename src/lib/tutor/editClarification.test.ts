import { describe, expect, it } from "vitest";
import {
  buildCustomEditOptionChoice,
  buildEditOptionsCardFromClarification,
  enrichEditOptionPrompt,
  isUnderspecifiedEditRequest,
  normalizeEditClarificationOptions,
} from "./editClarification";

describe("edit clarification heuristics", () => {
  it("detects broad underspecified edit requests", () => {
    expect(isUnderspecifiedEditRequest("make all of the buttons more exciting")).toBe(true);
    expect(isUnderspecifiedEditRequest("make the buttons better")).toBe(true);
    expect(isUnderspecifiedEditRequest("make it pop")).toBe(true);
  });

  it("does not treat specific edit requests as underspecified", () => {
    expect(isUnderspecifiedEditRequest("make all buttons blue")).toBe(false);
    expect(isUnderspecifiedEditRequest("improve the button hover styles")).toBe(false);
    expect(isUnderspecifiedEditRequest("Can you explain functions?")).toBe(false);
  });
});

describe("edit clarification normalization", () => {
  it("normalizes model options into UI choices with enrich prompts", () => {
    const options = normalizeEditClarificationOptions({
      message: "Pick a direction for your buttons:",
      options: [
        {
          id: "hover-motion",
          label: "Add hover motion",
          enrichPrompt: "Update .btn styles with smooth hover scale and shadow.",
        },
        {
          label: "Stronger colors",
          enrichPrompt: "Increase button contrast and hover colors in style.css.",
        },
      ],
    });

    expect(options).toHaveLength(2);
    expect(options[0].label).toBe("Add hover motion");
    expect(enrichEditOptionPrompt(options[0])).toContain("hover scale");
  });

  it("builds edit option cards from model responses", () => {
    const card = buildEditOptionsCardFromClarification(
      "make the buttons more exciting",
      {
        message: "I can help polish your buttons. Which direction sounds best?",
        options: [
          {
            label: "Playful hover motion",
            enrichPrompt: "Add playful hover transitions to all .btn buttons.",
          },
          {
            label: "Bolder colors",
            enrichPrompt: "Make .btn-primary and .btn-secondary colors bolder.",
          },
        ],
      },
    );

    expect(card?.originalMessage).toBe("make the buttons more exciting");
    expect(card?.intro).toContain("polish your buttons");
    expect(card?.options).toHaveLength(2);
  });

  it("builds custom free-text directions into concrete build prompts", () => {
    const option = buildCustomEditOptionChoice(
      "make the buttons more exciting",
      "make them glow with a neon outline",
    );

    expect(option.id).toBe("custom");
    expect(option.enrichPrompt).toContain("neon outline");
  });
});
