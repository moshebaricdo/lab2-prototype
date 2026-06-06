import type {
  InstructionGuide,
  InstructionGuideState,
  InstructionPinnedStep,
} from "../../../types/tutor";
import type {
  LevelProgressSnapshot,
  WebLab2ValidationReviewConfig,
} from "../../../types/validationReview";
import {
  getActiveInstructionOption,
  getActiveInstructionStep,
  isLinearGuideComplete,
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

function readyToContinuePinnedStep() {
  return {
    positionLabel: "Ready to continue",
    summary: "You've met the level goals. Continue when you're ready.",
  } satisfies InstructionPinnedStep;
}

function parseRequirementIndex(id: string) {
  const match = id.match(/^requirement-(\d+)$/);
  return match ? Number.parseInt(match[1], 10) : undefined;
}

function goalLabel(config: WebLab2ValidationReviewConfig, goalIndex: number) {
  return (
    config.goalLabels?.[goalIndex]?.trim() ||
    config.goals[goalIndex]?.trim() ||
    `Requirement ${goalIndex + 1}`
  );
}

function assessmentGoalCount(config: WebLab2ValidationReviewConfig) {
  return config.goals.filter((goal) => goal.trim()).length;
}

function deriveAssessmentPinnedStep(
  config: WebLab2ValidationReviewConfig,
  levelProgress?: LevelProgressSnapshot,
): InstructionPinnedStep {
  const total = assessmentGoalCount(config);
  const currentGoalIndex = levelProgress?.nextIncompleteCriterion
    ? parseRequirementIndex(levelProgress.nextIncompleteCriterion.id) ?? 0
    : 0;
  const position = currentGoalIndex + 1;
  const next = levelProgress?.nextIncompleteCriterion;

  return {
    positionLabel: `Step ${position} of ${total}`,
    summary:
      next?.detail?.trim() ||
      next?.label?.trim() ||
      goalLabel(config, currentGoalIndex),
  };
}

export function deriveInstructionPinnedStep(
  guide: InstructionGuide | undefined,
  guideState: InstructionGuideState | undefined,
  levelProgress?: LevelProgressSnapshot,
  validationReviewConfig?: WebLab2ValidationReviewConfig,
): InstructionPinnedStep | undefined {
  if (!guide) return undefined;

  if (
    levelProgress?.phase === "ready_to_continue" ||
    guideState?.lastCoachMoveId === "guide-complete"
  ) {
    return readyToContinuePinnedStep();
  }

  if (validationReviewConfig && assessmentGoalCount(validationReviewConfig) > 0) {
    return deriveAssessmentPinnedStep(validationReviewConfig, levelProgress);
  }

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

  if (isLinearGuideComplete(guide, guideState)) {
    return readyToContinuePinnedStep();
  }

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
