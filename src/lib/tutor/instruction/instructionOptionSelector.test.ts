import { afterEach, describe, expect, it, vi } from "vitest";

import {
  matchOptionByOverlap,
  selectInstructionOption,
} from "./instructionOptionSelector";
import type { TutorInstructionOptionSelectionProvider } from "../provider/openAiProvider";
import type { InstructionOption } from "../../../types/tutor";
import type { TutorInstructionOptionSelectionResponse } from "../types";

vi.mock("../../../hooks/useTutorApiSettings", () => ({
  getTutorApiKey: () => "",
  getTutorCodeModel: () => "gpt-4.1",
}));

const OPTIONS: InstructionOption[] = [
  { id: "polish-nav-links", label: "Polish nav links", prompt: "Add an animated hover underline and a focus outline to the nav", intent: "style-polish" },
  { id: "improve-buttons", label: "Improve buttons", prompt: "Make the primary button distinct with safe contrast", intent: "style-polish" },
  { id: "apply-a-font", label: "Apply a font", prompt: "Import a Google font and apply it to headings", intent: "style-polish" },
];

function mockProvider(
  response: TutorInstructionOptionSelectionResponse | null,
): TutorInstructionOptionSelectionProvider {
  return {
    requestInstructionOptionSelection: vi.fn(async () => response),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("matchOptionByOverlap", () => {
  it("matches when label words all appear", () => {
    expect(matchOptionByOverlap("let's improve the buttons", OPTIONS)?.id).toBe("improve-buttons");
  });

  it("matches short focus picks whose words appear in the option label", () => {
    expect(matchOptionByOverlap("nav links", OPTIONS)?.id).toBe("polish-nav-links");
  });

  it("matches on a distinctive prompt word", () => {
    expect(matchOptionByOverlap("can we work on the underline?", OPTIONS)?.id).toBe("polish-nav-links");
  });

  it("returns null when nothing clearly overlaps", () => {
    expect(matchOptionByOverlap("I want to make the cards pop more", OPTIONS)).toBeNull();
  });
});

describe("selectInstructionOption", () => {
  it("prefers the deterministic overlap match without calling the model", async () => {
    const provider = mockProvider({ optionId: "apply-a-font" });
    const result = await selectInstructionOption({
      message: "improve buttons please",
      options: OPTIONS,
      provider,
    });

    expect(result?.id).toBe("improve-buttons");
    expect(provider.requestInstructionOptionSelection).not.toHaveBeenCalled();
  });

  it("asks the model when overlap is ambiguous and maps the returned id", async () => {
    const provider = mockProvider({ optionId: "improve-buttons", confidence: "high" });
    const result = await selectInstructionOption({
      message: "the call-to-action looks bland",
      options: OPTIONS,
      provider,
    });

    expect(provider.requestInstructionOptionSelection).toHaveBeenCalledOnce();
    expect(result?.id).toBe("improve-buttons");
  });

  it("returns null when the model declines to choose", async () => {
    const provider = mockProvider({ optionId: "" });
    const result = await selectInstructionOption({
      message: "what does this level want from me?",
      options: OPTIONS,
      provider,
    });

    expect(result).toBeNull();
  });

  it("returns null when the model returns an unknown id", async () => {
    const provider = mockProvider({ optionId: "not-a-real-option" });
    const result = await selectInstructionOption({
      message: "something vague",
      options: OPTIONS,
      provider,
    });

    expect(result).toBeNull();
  });

  it("returns null on provider error", async () => {
    const provider: TutorInstructionOptionSelectionProvider = {
      requestInstructionOptionSelection: vi.fn(async () => {
        throw new Error("network");
      }),
    };
    const result = await selectInstructionOption({
      message: "something vague",
      options: OPTIONS,
      provider,
    });

    expect(result).toBeNull();
  });

  it("returns null with no options", async () => {
    expect(await selectInstructionOption({ message: "anything", options: [] })).toBeNull();
  });
});
