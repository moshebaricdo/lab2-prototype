import { describe, expect, it } from "vitest";
import type { InstructionGuide } from "../../types/tutor";
import {
  createInitialInstructionGuideState,
  resetInstructionGuideState,
  resolveInstructionCoachResponse,
} from "./instructionCoach";
import { buildInstructionGuide } from "./instructionGuide";

const carouselGuide: InstructionGuide = {
  type: "linear",
  id: "carousel",
  sourceSignature: "carousel",
  overview: "Debug the broken carousel.",
  firstMove: "Run the project and click Next once.",
  steps: [
    {
      id: "test-it",
      title: "Test it",
      prompt: "Run the project and click Next once.",
      intent: "observe",
      expectedStudentMove: "observation",
    },
    {
      id: "check-basics",
      title: "Check the basics",
      prompt: "Compare the JavaScript selector with the matching HTML id or class.",
      intent: "inspect",
      expectedStudentMove: "observation",
    },
  ],
  fallbackMarkdown: "# Debug",
};

describe("instruction coach", () => {
  it("advances a procedural observation before normal debugging help", () => {
    const state = createInitialInstructionGuideState(carouselGuide);
    const result = resolveInstructionCoachResponse({
      message: "The image doesn't appear when I click the button.",
      guide: carouselGuide,
      guideState: state,
    });

    expect(result?.guideState.activeStepId).toBe("check-basics");
    expect(result?.guideState.completedStepIds).toContain("test-it");
    expect(result?.instructionFocus).toMatchObject({
      guideType: "linear",
      didAdvance: true,
      currentStep: expect.objectContaining({
        id: "check-basics",
      }),
      previousStep: expect.objectContaining({
        id: "test-it",
      }),
    });
    expect(result?.instructionFocus.guidanceDirective).toContain("continue the instructional sequence");
  });

  it("keeps explicit help questions scoped to the current step", () => {
    const state = createInitialInstructionGuideState(carouselGuide);
    const result = resolveInstructionCoachResponse({
      message: "Why is the button broken?",
      guide: carouselGuide,
      guideState: state,
    });

    expect(result?.guideState.activeStepId).toBe("test-it");
    expect(result?.instructionFocus).toMatchObject({
      guideType: "linear",
      didAdvance: false,
      currentStep: expect.objectContaining({
        id: "test-it",
      }),
    });
  });

  it("sets open-ended focus from the student's typed message without marking validation progress", () => {
    const guide = buildInstructionGuide(`
# Polish the Style
**Improve the links and buttons while keeping the page usable.**

**Try these prompts:**
* *Make the nav bar links feel interactive.*
* *Improve the main button hover style.*
`);
    const state = createInitialInstructionGuideState(guide);
    const result = resolveInstructionCoachResponse({
      message: "I want to polish the nav links first.",
      guide,
      guideState: state,
    });

    expect(guide.type).toBe("choice-based");
    expect(result?.guideState.activeOptionId).toBe("polish-nav-links");
    expect(result?.guideState.completedStepIds).toEqual([]);
    expect(result?.instructionFocus).toMatchObject({
      guideType: "choice-based",
      didSelectOption: true,
      activeOption: expect.objectContaining({
        id: "polish-nav-links",
      }),
    });
  });

  it("resets state when markdown-derived guide signature changes", () => {
    const firstGuide = buildInstructionGuide("# First\n\n1. Test the button.");
    const secondGuide = buildInstructionGuide("# Second\n\n1. Test the image.");
    const firstState = {
      ...createInitialInstructionGuideState(firstGuide),
      completedStepIds: ["test-the-button"],
    };
    const reset = resetInstructionGuideState(secondGuide, firstState);

    expect(reset?.guideSignature).not.toBe(firstState.guideSignature);
    expect(reset?.completedStepIds).toEqual([]);
  });
});
