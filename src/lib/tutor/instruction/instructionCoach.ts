import type {
  ChoiceBasedInstructionGuide,
  InstructionGuide,
  InstructionFocusContext,
  InstructionGuideState,
  InstructionOption,
  InstructionStep,
  LinearInstructionGuide,
} from "../../../types/tutor";
import type { LevelProgressSnapshot } from "../../../types/validationReview";
import { getInstructionGuideSignature } from "./instructionGuide";
import {
  asksTutorAQuestion,
} from "../intent/studentIntentSignals";
import { messageLooksLikeInstructionFocusPick } from "../routing/editClarification";
import {
  matchInstructionOptionMessage,
  selectInstructionOption,
} from "./instructionOptionSelector";
import {
  assessInstructionStepSatisfaction,
  isStrongStepCompletionSignal,
} from "./instructionStepSatisfaction";

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

export function isLinearGuideComplete(
  guide: LinearInstructionGuide,
  guideState?: InstructionGuideState,
) {
  if (!guideState) return false;
  if (guideState.lastCoachMoveId === "guide-complete") return true;
  if (guide.steps.length === 0) return false;
  return guide.steps.every((step) => guideState.completedStepIds.includes(step.id));
}

export function getActiveInstructionStep(
  guide: LinearInstructionGuide,
  guideState?: InstructionGuideState,
) {
  if (guide.steps.length === 0) return undefined;

  if (guideState?.activeStepId) {
    const active = guide.steps.find((step) => step.id === guideState.activeStepId);
    if (active) return active;
  }

  const firstIncomplete = guide.steps.find(
    (step) => !guideState?.completedStepIds.includes(step.id),
  );
  if (firstIncomplete) return firstIncomplete;

  return guide.steps[guide.steps.length - 1];
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

/**
 * Decides whether the student's typed reply should advance the linear guide past
 * the active step.
 *
 * This is intentionally fail-open and (almost) intent-agnostic: any substantive
 * reply advances, and we only *hold* on the current step while the student is
 * still asking Tutor for help/explanation and hasn't reported a result. The one
 * structured exception is an `ask-for-help` step, where reaching out for help is
 * itself the expected move and should advance.
 *
 * The previous implementation gated each step `intent` on a different keyword
 * list (observation words for observe, diagnosis words for fix, etc.), which
 * left inspect/fix/verify steps stuck whenever the student phrased their move
 * without the exact expected words (the "Step 2 of 4" stall). Advancement no
 * longer marks validation criteria complete, so over-advancing only shifts the
 * conversational focus forward — far cheaper than stalling the guide.
 *
 * When the signal is weak (any substantive reply that is not a Tutor question),
 * an optional keyed model check (`assessInstructionStepSatisfaction`) can hold
 * advancement on rambling or off-topic replies. Strong signals and no-key paths
 * stay fail-open.
 */
async function studentMessageCompletesStep(
  step: InstructionStep,
  message: string,
  assessStep: typeof assessInstructionStepSatisfaction = assessInstructionStepSatisfaction,
) {
  const trimmed = message.trim();
  if (!trimmed) return false;

  if (isStrongStepCompletionSignal(step, trimmed)) return true;

  if (asksTutorAQuestion(trimmed)) return false;

  return assessStep({ step, message: trimmed });
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

export async function resolveInstructionCoachResponse(options: {
  message: string;
  guide?: InstructionGuide;
  guideState?: InstructionGuideState;
  selectOption?: typeof selectInstructionOption;
  assessStep?: typeof assessInstructionStepSatisfaction;
}): Promise<InstructionCoachResult | null> {
  const {
    message,
    guide,
    guideState,
    selectOption = selectInstructionOption,
    assessStep = assessInstructionStepSatisfaction,
  } = options;
  if (!guide || !guideState) return null;

  if (guide.type === "choice-based") {
    let selectedOption: InstructionOption | undefined;
    if (messageLooksLikeInstructionFocusPick(message)) {
      selectedOption = guide.options.find((option) =>
        matchInstructionOptionMessage(message, option),
      );
      if (!selectedOption) {
        selectedOption = (await selectOption({ message, options: guide.options })) ?? undefined;
      }
    }
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

  if (!(await studentMessageCompletesStep(activeStep, message, assessStep))) {
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

export function syncInstructionGuideStateWithLevelProgress(
  guide: InstructionGuide | undefined,
  guideState: InstructionGuideState | undefined,
  levelProgress?: LevelProgressSnapshot,
): InstructionGuideState | undefined {
  if (!guide || !guideState) return guideState;
  if (levelProgress?.phase !== "ready_to_continue") return guideState;
  if (guideState.lastCoachMoveId === "guide-complete") return guideState;

  if (guide.type === "linear") {
    return {
      ...guideState,
      completedStepIds: guide.steps.map((step) => step.id),
      activeStepId: undefined,
      lastCoachMoveId: "guide-complete",
    };
  }

  return {
    ...guideState,
    lastCoachMoveId: "guide-complete",
  };
}
