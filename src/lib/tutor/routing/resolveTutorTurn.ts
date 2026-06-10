import type {
  InstructionFocusContext,
  InstructionGuide,
  InstructionGuideState,
  TutorAction,
  TutorPolicy,
} from "../../../types/tutor";
import {
  buildEditClarificationMessageForFocus,
  shouldOfferEditClarificationForFocusSelection,
} from "./editClarification";
import {
  resolveInstructionCoachResponse,
  type InstructionCoachResult,
} from "../instruction/instructionCoach";
import {
  resolveTutorAction,
  type ResolveTutorActionOptions,
} from "./tutorAction";

export interface TutorInstructionContext {
  guide?: InstructionGuide;
  guideState?: InstructionGuideState;
}

export interface ResolveTutorTurnOptions extends ResolveTutorActionOptions {
  instruction?: TutorInstructionContext;
}

/** One pre-runner decision per student turn: action + optional instruction coach side effects. */
export interface ResolvedTutorTurn {
  action: TutorAction;
  instructionCoachResult?: InstructionCoachResult | null;
  instructionFocus?: InstructionFocusContext;
}

function applyInstructionCoach(
  message: string,
  action: TutorAction,
  instruction: TutorInstructionContext | undefined,
  policy: TutorPolicy,
): Promise<ResolvedTutorTurn> {
  if (action.kind !== "guidance" || !instruction?.guide || !instruction.guideState) {
    return Promise.resolve({ action });
  }

  return resolveInstructionCoachResponse({
    message,
    guide: instruction.guide,
    guideState: instruction.guideState,
  }).then((instructionCoachResult) => {
    const instructionFocus = instructionCoachResult?.instructionFocus;

    if (
      instructionFocus &&
      shouldOfferEditClarificationForFocusSelection(
        message,
        instructionFocus,
        policy.capabilities.workspaceEdits,
      )
    ) {
      return {
        action: {
          kind: "editClarification",
          source: "focus-pick",
          message: buildEditClarificationMessageForFocus(
            message,
            instructionFocus.activeOption!,
          ),
        },
        instructionCoachResult,
        instructionFocus,
      };
    }

    return {
      action,
      instructionCoachResult,
      instructionFocus,
    };
  });
}

/**
 * Single pre-runner decision point for a student turn. Runs `resolveTutorAction`
 * first, then instruction-coach / focus-pick upgrade when the base action is
 * guidance. Callers execute the returned action; they should not invent parallel routes.
 */
export async function resolveTutorTurn(
  options: ResolveTutorTurnOptions,
): Promise<ResolvedTutorTurn> {
  const { instruction, policy, editClarification, ...actionOptions } = options;
  const action = await resolveTutorAction({
    ...actionOptions,
    policy,
    editClarification: {
      ...editClarification,
      guide: editClarification?.guide ?? instruction?.guide,
      guideState: editClarification?.guideState ?? instruction?.guideState,
    },
  });
  return applyInstructionCoach(actionOptions.message, action, instruction, policy);
}
