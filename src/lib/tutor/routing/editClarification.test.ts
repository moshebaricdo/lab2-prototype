import { describe, expect, it } from "vitest";
import {
  buildCustomEditOptionChoice,
  buildEditClarificationMessageForFocus,
  buildEditOptionsCardFromClarification,
  enrichEditOptionPrompt,
  isEditOrientedInstructionOption,
  isUnderspecifiedEditRequest,
  messageLooksLikeInstructionFocusPick,
  normalizeEditClarificationOptions,
  shouldOfferEditClarificationForFocusSelection,
} from "./editClarification";
import type { InstructionFocusContext, InstructionOption } from "../../../types/tutor";

describe("edit clarification heuristics", () => {
  it("detects broad underspecified edit requests", () => {
    expect(isUnderspecifiedEditRequest("make all of the buttons more exciting")).toBe(true);
    expect(isUnderspecifiedEditRequest("make the buttons better")).toBe(true);
    expect(isUnderspecifiedEditRequest("Let's refine the buttons")).toBe(true);
    expect(isUnderspecifiedEditRequest("make it pop")).toBe(true);
  });

  it("does not treat specific edit requests as underspecified", () => {
    expect(isUnderspecifiedEditRequest("make all buttons blue")).toBe(false);
    expect(isUnderspecifiedEditRequest("improve the button hover styles")).toBe(false);
    expect(isUnderspecifiedEditRequest("Can you explain functions?")).toBe(false);
  });
});

describe("instruction focus edit clarification routing", () => {
  const navOption: InstructionOption = {
    id: "polish-nav-links",
    label: "Polish nav links",
    prompt: "Add an animated hover underline and a focus outline to the nav",
    intent: "style-polish",
  };

  it("treats style-polish options as edit-oriented", () => {
    expect(isEditOrientedInstructionOption(navOption)).toBe(true);
    expect(
      isEditOrientedInstructionOption({
        ...navOption,
        intent: "concept-focus",
      }),
    ).toBe(false);
  });

  it("builds a scoped clarification message from a short focus pick", () => {
    expect(buildEditClarificationMessageForFocus("nav links", navOption)).toBe(
      "Improve nav links. Add an animated hover underline and a focus outline to the nav",
    );
  });

  it("offers clarification when the student just selected an edit-oriented focus", () => {
    const focus: InstructionFocusContext = {
      guideType: "choice-based",
      goal: "Polish styles",
      constraints: [],
      activeOption: navOption,
      availableOptions: [navOption],
      didSelectOption: true,
      guidanceDirective: "Respond within the chosen focus.",
    };

    expect(shouldOfferEditClarificationForFocusSelection("nav links", focus, true)).toBe(true);
    expect(shouldOfferEditClarificationForFocusSelection("nav links", focus, false)).toBe(false);
  });

  it("does not offer clarification when the student is reporting completion", () => {
    const focus: InstructionFocusContext = {
      guideType: "choice-based",
      goal: "Polish styles",
      constraints: [],
      activeOption: navOption,
      availableOptions: [navOption],
      didSelectOption: true,
      guidanceDirective: "Respond within the chosen focus.",
    };

    expect(messageLooksLikeInstructionFocusPick("I'm done")).toBe(false);
    expect(messageLooksLikeInstructionFocusPick("nav links are done")).toBe(false);
    expect(shouldOfferEditClarificationForFocusSelection("I'm done", focus, true)).toBe(false);
    expect(shouldOfferEditClarificationForFocusSelection("nav links are done", focus, true)).toBe(false);
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
