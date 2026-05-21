import type {
  ChoiceBasedInstructionGuide,
  InstructionGuide,
  InstructionFocusContext,
  InstructionGuideState,
  InstructionOption,
  InstructionStep,
  LinearInstructionGuide,
} from "../../types/tutor";
import { getInstructionGuideSignature } from "./instructionGuide";

export interface InstructionCoachResult {
  guideState: InstructionGuideState;
  instructionFocus: InstructionFocusContext;
}

export function createInitialInstructionGuideState(guide: InstructionGuide): InstructionGuideState {
  return {
    guideSignature: getInstructionGuideSignature(guide),
    completedStepIds: [],
    ...(guide.type === "linear" && guide.steps[0]?.id
      ? { activeStepId: guide.steps[0].id }
      : {}),
  };
}

export function resetInstructionGuideState(
  guide: InstructionGuide | undefined,
  current?: InstructionGuideState,
) {
  if (!guide) return undefined;
  const guideSignature = getInstructionGuideSignature(guide);
  if (current?.guideSignature === guideSignature) return current;
  return createInitialInstructionGuideState(guide);
}

export function getActiveInstructionStep(
  guide: LinearInstructionGuide,
  guideState?: InstructionGuideState,
) {
  return guide.steps.find((step) => step.id === guideState?.activeStepId) ?? guide.steps[0];
}

export function getActiveInstructionOption(
  guide: ChoiceBasedInstructionGuide,
  guideState?: InstructionGuideState,
) {
  return guide.options.find((option) => option.id === guideState?.activeOptionId);
}

function nextStepAfter(
  guide: LinearInstructionGuide,
  step: InstructionStep | undefined,
) {
  if (!step) return undefined;
  const index = guide.steps.findIndex((candidate) => candidate.id === step.id);
  return index === -1 ? undefined : guide.steps[index + 1];
}

function formatStepPrompt(step: InstructionStep) {
  return step.prompt && step.prompt !== step.title ? step.prompt : step.title;
}

function advanceLinearGuide(
  guide: LinearInstructionGuide,
  guideState: InstructionGuideState,
  completedStep: InstructionStep | undefined,
): InstructionCoachResult {
  const nextStep = nextStepAfter(guide, completedStep);
  const focusStep = nextStep ?? completedStep ?? getActiveInstructionStep(guide, guideState);
  const completedStepIds = completedStep
    ? Array.from(new Set([...guideState.completedStepIds, completedStep.id]))
    : guideState.completedStepIds;
  const nextState: InstructionGuideState = {
    ...guideState,
    completedStepIds,
    ...(nextStep ? { activeStepId: nextStep.id } : { activeStepId: undefined }),
    lastCoachMoveId: nextStep?.id ?? "guide-complete",
  };

  return {
    guideState: nextState,
    instructionFocus: {
      guideType: "linear",
      overview: guide.overview,
      currentStep: focusStep,
      previousStep: completedStep,
      didAdvance: Boolean(nextStep && completedStep),
      guidanceDirective: nextStep
        ? "The student just gave the expected observation for the previous step. Briefly acknowledge it, then continue the instructional sequence by coaching the current step. Do not jump to a full solution."
        : "The student appears to have reached the end of the guide sequence. Briefly orient them toward verification or validation without claiming the work is complete.",
    },
  };
}

function looksLikeObservation(message: string) {
  return /\b(doesn'?t|does not|isn'?t|is not|nothing|no image|image|photo|caption|appears?|shows?|happens?|clicked|button|result)\b/i.test(message);
}

function looksLikeExplicitHelp(message: string) {
  return /\b(why|explain|debug|help|hint|what should|how do|how can|stuck)\b/i.test(message);
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function messageMatchesOption(message: string, option: InstructionOption) {
  const normalizedMessage = normalizeText(message);
  const labelWords = normalizeText(option.label).split(" ").filter((word) => word.length > 2);
  if (labelWords.length > 0 && labelWords.every((word) => normalizedMessage.includes(word))) {
    return true;
  }

  const promptWords = normalizeText(option.prompt)
    .split(" ")
    .filter((word) => word.length >= 5)
    .slice(0, 8);
  return promptWords.some((word) => normalizedMessage.includes(word));
}

function choiceFocusForState(
  guide: ChoiceBasedInstructionGuide,
  guideState: InstructionGuideState,
): InstructionFocusContext {
  const activeOption = getActiveInstructionOption(guide, guideState);
  return {
    guideType: "choice-based",
    goal: guide.goal,
    constraints: guide.constraints,
    activeOption,
    availableOptions: guide.options,
    didSelectOption: false,
    guidanceDirective: activeOption
      ? "Keep the response scoped to the student's current open-ended focus. Preserve student agency and do not turn the task into a rigid sequence."
      : "The student has not chosen a focus yet. Help them choose a focus conversationally instead of listing the full instructions.",
  };
}

export function resolveInstructionCoachResponse(options: {
  message: string;
  guide?: InstructionGuide;
  guideState?: InstructionGuideState;
}): InstructionCoachResult | null {
  const { message, guide, guideState } = options;
  if (!guide || !guideState) return null;

  if (guide.type === "choice-based") {
    const selectedOption = guide.options.find((option) =>
      messageMatchesOption(message, option)
    );
    if (selectedOption && selectedOption.id !== guideState.activeOptionId) {
      const nextState = {
        ...guideState,
        activeOptionId: selectedOption.id,
        lastCoachMoveId: selectedOption.id,
      };
      return {
        guideState: nextState,
        instructionFocus: {
          guideType: "choice-based",
          goal: guide.goal,
          constraints: guide.constraints,
          activeOption: selectedOption,
          availableOptions: guide.options,
          didSelectOption: true,
          guidanceDirective: "The student just chose this open-ended focus in their own words. Respond conversationally within that focus and ask for their next thought or offer one small next move.",
        },
      };
    }

    return {
      guideState,
      instructionFocus: choiceFocusForState(guide, guideState),
    };
  }

  const activeStep = getActiveInstructionStep(guide, guideState);
  if (!activeStep) return null;
  if (activeStep.intent !== "observe" || looksLikeExplicitHelp(message) || !looksLikeObservation(message)) {
    return {
      guideState,
      instructionFocus: {
        guideType: "linear",
        overview: guide.overview,
        currentStep: activeStep,
        didAdvance: false,
        guidanceDirective: "Keep the response scoped to the current instructional step. If the student asks for help, give one small next check before explaining more.",
      },
    };
  }

  return advanceLinearGuide(guide, guideState, activeStep);
}
