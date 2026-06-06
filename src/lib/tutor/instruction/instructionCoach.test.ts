import { describe, expect, it, vi } from "vitest";
import type { InstructionGuide } from "../../../types/tutor";
import {
  validationPhotoCarouselInstructionsMarkdown,
} from "../../../data/weblab2/projects/validation-photo-carousel";
import {
  createInitialInstructionGuideState,
  getActiveInstructionStep,
  isLinearGuideComplete,
  resetInstructionGuideState,
  resolveInstructionCoachResponse,
  syncInstructionGuideStateWithLevelProgress,
} from "./instructionCoach";
import { buildInstructionGuide } from "./instructionGuide";
import { deriveInstructionPinnedStep } from "./instructionPinnedStep";

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
  it("advances a procedural observation before normal debugging help", async () => {
    const state = createInitialInstructionGuideState(carouselGuide);
    const result = await resolveInstructionCoachResponse({
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

  it("keeps a confused 'I don't know' on the current step", async () => {
    const state = createInitialInstructionGuideState(carouselGuide);
    const result = await resolveInstructionCoachResponse({
      message: "I don't know what to look at.",
      guide: carouselGuide,
      guideState: state,
    });

    expect(result?.guideState.activeStepId).toBe("test-it");
    expect(result?.guideState.completedStepIds).toEqual([]);
  });

  it("keeps explicit help questions scoped to the current step", async () => {
    const state = createInitialInstructionGuideState(carouselGuide);
    const result = await resolveInstructionCoachResponse({
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

  it("sets open-ended focus from the student's typed message without marking validation progress", async () => {
    const guide = buildInstructionGuide(`
# Polish the Style
**Improve the links and buttons while keeping the page usable.**

**Try these prompts:**
* *Make the nav bar links feel interactive.*
* *Improve the main button hover style.*
`);
    const state = createInitialInstructionGuideState(guide);
    const result = await resolveInstructionCoachResponse({
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

  it("matches a short focus pick like nav links after the opening invitation", async () => {
    const guide = buildInstructionGuide(`
# Polish the Style
**Improve the links and buttons while keeping the page usable.**

**Try these prompts:**
* *Make the nav bar links feel interactive.*
* *Improve the main button hover style.*
`);
    const state = createInitialInstructionGuideState(guide);
    const result = await resolveInstructionCoachResponse({
      message: "nav links",
      guide,
      guideState: state,
    });

    expect(result?.guideState.activeOptionId).toBe("polish-nav-links");
    expect(result?.instructionFocus).toMatchObject({
      guideType: "choice-based",
      didSelectOption: true,
      activeOption: expect.objectContaining({
        id: "polish-nav-links",
      }),
    });
  });

  it("uses the model selector when overlap is ambiguous", async () => {
    const guide = buildInstructionGuide(`
# Polish the Style
**Improve the links and buttons while keeping the page usable.**

**Try these prompts:**
* *Make the nav bar links feel interactive.*
* *Improve the main button hover style.*
`);
    const state = createInitialInstructionGuideState(guide);
    const options = guide.type === "choice-based" ? guide.options : [];
    const improveButtons = options.find((option) => option.id === "improve-buttons");
    const selectOption = vi.fn(async () => improveButtons ?? null);

    const result = await resolveInstructionCoachResponse({
      message: "the call-to-action looks bland",
      guide,
      guideState: state,
      selectOption,
    });

    expect(selectOption).toHaveBeenCalledOnce();
    expect(result?.guideState.activeOptionId).toBe("improve-buttons");
    expect(result?.instructionFocus).toMatchObject({
      guideType: "choice-based",
      didSelectOption: true,
    });
  });

  it("holds weak replies when step satisfaction says not satisfied", async () => {
    const guide: InstructionGuide = {
      type: "linear",
      id: "promise-trace",
      sourceSignature: "promise-trace",
      overview: "Label each Promise state.",
      firstMove: "Read the first numbered comment.",
      steps: [
        {
          id: "label-states",
          title: "Label the states",
          prompt: "Write whether each numbered Promise is pending, fulfilled, or rejected.",
          intent: "explain",
          expectedStudentMove: "reflection",
        },
      ],
      fallbackMarkdown: "# Promise trace",
    };
    const assessStep = vi.fn(async () => false);

    const result = await resolveInstructionCoachResponse({
      message: "maybe I should look at the comments",
      guide,
      guideState: createInitialInstructionGuideState(guide),
      assessStep,
    });

    expect(assessStep).toHaveBeenCalledOnce();
    expect(result?.guideState.activeStepId).toBe("label-states");
    expect(result?.guideState.completedStepIds).toEqual([]);
  });

  it("does not treat completion phrasing as a new focus pick", async () => {
    const guide = buildInstructionGuide(`
# Polish the Style
**Improve the links and buttons while keeping the page usable.**

**Try these prompts:**
* *Make the nav bar links feel interactive.*
* *Improve the main button hover style.*
`);
    const state = createInitialInstructionGuideState(guide);
    const result = await resolveInstructionCoachResponse({
      message: "nav links are done",
      guide,
      guideState: state,
    });

    expect(result?.guideState.activeOptionId).toBeUndefined();
    expect(result?.instructionFocus).toMatchObject({
      guideType: "choice-based",
      didSelectOption: false,
    });
  });

  it("advances a fix-intent step on substantive phrasing without exact diagnosis keywords", async () => {
    const guide: InstructionGuide = {
      type: "linear",
      id: "fix-guide",
      sourceSignature: "fix-guide",
      overview: "Fix the layout.",
      firstMove: "Open the stylesheet.",
      steps: [
        {
          id: "make-the-change",
          title: "Make the change",
          prompt: "Update the CSS so the cards sit side by side.",
          intent: "fix",
          expectedStudentMove: "code-change",
        },
        {
          id: "confirm-it",
          title: "Confirm it",
          prompt: "Check the page in preview.",
          intent: "verify",
          expectedStudentMove: "review-request",
        },
      ],
      fallbackMarkdown: "# Fix",
    };
    const state = createInitialInstructionGuideState(guide);

    const result = await resolveInstructionCoachResponse({
      message: "Okay, I just rearranged the layout so they line up.",
      guide,
      guideState: state,
    });

    expect(result?.guideState.completedStepIds).toContain("make-the-change");
    expect(result?.guideState.activeStepId).toBe("confirm-it");
  });

  it("advances an ask-for-help step when the student asks Tutor for help", async () => {
    const guide: InstructionGuide = {
      type: "linear",
      id: "help-guide",
      sourceSignature: "help-guide",
      overview: "Work through the bug.",
      firstMove: "Ask Tutor if you get stuck.",
      steps: [
        {
          id: "ask-tutor",
          title: "Ask Tutor",
          prompt: "If you're stuck, ask Tutor for a hint.",
          intent: "ask-for-help",
          expectedStudentMove: "reflection",
        },
        {
          id: "wrap-up",
          title: "Wrap up",
          prompt: "Confirm the fix.",
          intent: "verify",
          expectedStudentMove: "review-request",
        },
      ],
      fallbackMarkdown: "# Help",
    };
    const state = createInitialInstructionGuideState(guide);

    const result = await resolveInstructionCoachResponse({
      message: "Why isn't this working? I'm stuck.",
      guide,
      guideState: state,
    });

    expect(result?.guideState.completedStepIds).toContain("ask-tutor");
    expect(result?.guideState.activeStepId).toBe("wrap-up");
  });

  it("advances reflective explain steps on completion claims but not on a concept question", async () => {
    const guide: InstructionGuide = {
      type: "linear",
      id: "promise-trace",
      sourceSignature: "promise-trace",
      overview: "Label each Promise state.",
      firstMove: "Read the first numbered comment.",
      steps: [
        {
          id: "label-states",
          title: "Label the states",
          prompt: "Write whether each numbered Promise is pending, fulfilled, or rejected.",
          intent: "explain",
          expectedStudentMove: "reflection",
        },
        {
          id: "explain-why",
          title: "Explain why",
          prompt: "Add a short comment explaining each state.",
          intent: "explain",
          expectedStudentMove: "reflection",
        },
      ],
      fallbackMarkdown: "# Promise trace",
    };

    const conceptResult = await resolveInstructionCoachResponse({
      message: "What is a promise?",
      guide,
      guideState: createInitialInstructionGuideState(guide),
    });
    expect(conceptResult?.guideState.activeStepId).toBe("label-states");
    expect(conceptResult?.guideState.completedStepIds).toEqual([]);

    const completionResult = await resolveInstructionCoachResponse({
      message: "I added the comments describing each step already.",
      guide,
      guideState: createInitialInstructionGuideState(guide),
    });
    expect(completionResult?.guideState.completedStepIds).toContain("label-states");
    expect(completionResult?.guideState.activeStepId).toBe("explain-why");
  });

  it("advances photo-carousel steps through diagnosis and success, not only first observation", async () => {
    const guide = buildInstructionGuide(validationPhotoCarouselInstructionsMarkdown);
    expect(guide.type).toBe("linear");
    if (guide.type !== "linear") throw new Error("Expected linear guide");

    let state = createInitialInstructionGuideState(guide);

    const afterSymptom = await resolveInstructionCoachResponse({
      message: "Nothing happens when I click Next.",
      guide,
      guideState: state,
    });
    expect(afterSymptom?.guideState.activeStepId).not.toBe(guide.steps[0]?.id);
    state = afterSymptom!.guideState;

    const afterDiagnosis = await resolveInstructionCoachResponse({
      message: 'I think it should be "#photo2" instead of nextPhoto.',
      guide,
      guideState: state,
    });
    expect(afterDiagnosis?.guideState.completedStepIds).toContain(guide.steps[1]?.id);
    state = afterDiagnosis!.guideState;

    const afterSuccess = await resolveInstructionCoachResponse({
      message: "It worked!",
      guide,
      guideState: state,
    });
    expect(afterSuccess?.guideState.completedStepIds.length).toBeGreaterThanOrEqual(3);
  });

  it("marks the guide complete and pins ready-to-continue when validation passes", async () => {
    const guide = buildInstructionGuide(validationPhotoCarouselInstructionsMarkdown);
    if (guide.type !== "linear") throw new Error("Expected linear guide");

    const state = createInitialInstructionGuideState(guide);
    const synced = syncInstructionGuideStateWithLevelProgress(guide, state, {
      title: "Photo carousel",
      mode: "technical",
      status: "likely_complete",
      phase: "ready_to_continue",
      passedCriteria: [],
      incompleteCriteria: [],
      requirements: [],
    });

    expect(isLinearGuideComplete(guide, synced)).toBe(true);
    expect(synced?.activeStepId).toBeUndefined();
    expect(deriveInstructionPinnedStep(guide, synced, {
      title: "Photo carousel",
      mode: "technical",
      status: "likely_complete",
      phase: "ready_to_continue",
      passedCriteria: [],
      incompleteCriteria: [],
      requirements: [],
    })).toMatchObject({
      positionLabel: "Ready to continue",
    });
    expect(getActiveInstructionStep(guide, synced)?.id).toBe(
      guide.steps[guide.steps.length - 1]?.id,
    );
  });

  it("pins assessment goals as Step N of M when validation config is present", () => {
    const guide = buildInstructionGuide(`
# Polish the Style
**Try these prompts:**
* *Make the nav bar links feel interactive.*
`);
    const config = {
      goals: ["Make one intentional style refinement"],
      goalLabels: ["Make one intentional style refinement"],
    };

    expect(
      deriveInstructionPinnedStep(guide, undefined, undefined, config),
    ).toEqual({
      positionLabel: "Step 1 of 1",
      summary: "Make one intentional style refinement",
    });
  });

  it("advances the assessment step counter from level progress", () => {
    const guide = buildInstructionGuide("1. Create a feature.\n2. Save.\n3. Revert.");
    const config = {
      goals: ["Create a feature", "Save with a comment", "Revert as needed"],
      goalLabels: ["Create a new feature", "Save with a comment", "Revert as needed"],
    };

    expect(
      deriveInstructionPinnedStep(guide, undefined, {
        title: "Review",
        mode: "open-ended",
        status: "needs_work",
        phase: "partially_complete",
        passedCriteria: [{
          id: "requirement-0",
          label: "Create a new feature",
          status: "pass",
        }],
        incompleteCriteria: [{
          id: "requirement-1",
          label: "Save with a comment",
          status: "missing",
          detail: "Save your work in Version History with a short description.",
        }],
        nextIncompleteCriterion: {
          id: "requirement-1",
          label: "Save with a comment",
          status: "missing",
          detail: "Save your work in Version History with a short description.",
        },
      }, config),
    ).toEqual({
      positionLabel: "Step 2 of 3",
      summary: "Save your work in Version History with a short description.",
    });
  });

  it("resets state when markdown-derived guide signature changes", async () => {
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
