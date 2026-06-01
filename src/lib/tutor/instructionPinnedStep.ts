import type {
  InstructionGuide,
  InstructionGuideState,
  InstructionPinnedStep,
} from "../../types/tutor";
import {
  getActiveInstructionOption,
  getActiveInstructionStep,
} from "./instructionCoach";

function summaryForStepId(
  guideState: InstructionGuideState | undefined,
  stepId: string | undefined,
  fallback: string,
) {
  if (!stepId) return fallback;
  const match = guideState?.openingStepSummaries?.find((step) => step.id === stepId);
  return match?.summary?.trim() || match?.shortLabel?.trim() || fallback;
}

export function deriveInstructionPinnedStep(
  guide: InstructionGuide | undefined,
  guideState: InstructionGuideState | undefined,
): InstructionPinnedStep | undefined {
  if (!guide) return undefined;

  if (guide.type === "choice-based") {
    const activeOption = getActiveInstructionOption(guide, guideState);
    if (activeOption) {
      return {
        positionLabel: "Current focus",
        summary: summaryForStepId(guideState, activeOption.id, activeOption.label),
      };
    }

    return {
      positionLabel: "Choose a direction",
      summary: "Pick one area to improve, then tell Tutor what you want to focus on.",
    };
  }

  const steps = guide.steps;
  if (steps.length === 0) return undefined;

  const activeStep = getActiveInstructionStep(guide, guideState);
  const activeIndex = activeStep
    ? Math.max(0, steps.findIndex((step) => step.id === activeStep.id))
    : 0;
  const position = activeIndex + 1;

  return {
    positionLabel: `Step ${position} of ${steps.length}`,
    summary: summaryForStepId(
      guideState,
      activeStep?.id,
      activeStep?.prompt && activeStep.prompt !== activeStep.title
        ? activeStep.prompt
        : activeStep?.title ?? "Follow the level instructions.",
    ),
  };
}
