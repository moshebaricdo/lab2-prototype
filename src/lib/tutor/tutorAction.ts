import type {
  TutorAction,
  TutorPolicy,
  TutorRequestMode,
} from "../../types/tutor";
import { isValidationReviewIntent } from "../validation/validationReviewIntent";
import {
  resolveTutorRequestIntent,
  type TutorRequestIntent,
} from "./requestIntent";

export interface TutorActionWorkflowState {
  hasActivePlan?: boolean;
  lastAssistantAskedPlanningQuestion?: boolean;
  lastAssistantSuggestedEditableWork?: boolean;
  hasPendingProposal?: boolean;
  isHistoryReadOnly?: boolean;
}

export interface ResolveTutorActionOptions {
  message: string;
  requestMode?: TutorRequestMode;
  policy: TutorPolicy;
  workflow?: TutorActionWorkflowState;
}

function deniedMessage(requested: "plan" | "edit" | "validationReview") {
  if (requested === "edit") {
    return "I can't edit files in this level, but you can make the change in the editor. I can help you reason through the next step or point you to the likely file.";
  }
  if (requested === "plan") {
    return "I can't create a plan file in this level, but you can describe your idea and I can help you think through the next step.";
  }
  return "I can't check your work in this level, but you can use the instructions as a checklist. I can help you review what to look at next.";
}

function denyAction(requested: "plan" | "edit" | "validationReview"): TutorAction {
  return {
    kind: "denied",
    requested,
    fallback: "guidance",
    disabledReason: "capability-disabled",
    message: deniedMessage(requested),
  };
}

function actionForIntent(intent: TutorRequestIntent, message: string, policy: TutorPolicy): TutorAction {
  if (intent === "edit") {
    return policy.capabilities.workspaceEdits
      ? { kind: "edit", source: "message", message }
      : denyAction("edit");
  }

  if (intent === "planning") {
    return policy.capabilities.planning
      ? { kind: "plan", source: "message", message }
      : denyAction("plan");
  }

  return policy.capabilities.guidance
    ? { kind: "guidance", source: "message", message }
    : {
        kind: "denied",
        requested: "edit",
        fallback: "message",
        disabledReason: "capability-disabled",
        message: "I can't help with that in this level right now. Use the level instructions as your next step.",
      };
}

function isDoThatFollowUp(message: string) {
  return /^\s*(please\s+)?(do|make|apply|try)\s+(that|it|this)\s*\.?\s*$/i.test(message) ||
    /^\s*(yes|yeah|yep|ok|okay),?\s+(please\s+)?(do|make|apply|try)\s+(that|it|this)\s*\.?\s*$/i.test(message);
}

export function resolveTutorAction({
  message,
  requestMode = "auto",
  policy,
  workflow = {},
}: ResolveTutorActionOptions): TutorAction {
  if (workflow.hasPendingProposal) {
    return {
      kind: "denied",
      requested: "edit",
      fallback: "message",
      disabledReason: "pending-proposal",
      message: "Review the current Tutor suggestion first. Accept or reject it, then ask for the next change.",
    };
  }

  if (workflow.isHistoryReadOnly && requestMode === "build") {
    return {
      kind: "denied",
      requested: "edit",
      fallback: "message",
      disabledReason: "history-read-only",
      message: "I can't edit a past version. Return to the current version, then ask for the change again.",
    };
  }

  if (requestMode === "build") {
    return policy.capabilities.workspaceEdits
      ? { kind: "edit", source: "ui", message }
      : denyAction("edit");
  }

  if (requestMode === "plan") {
    return policy.capabilities.planning
      ? { kind: "plan", source: "ui", message }
      : denyAction("plan");
  }

  if (requestMode === "help") {
    return policy.capabilities.guidance
      ? { kind: "guidance", source: "ui", message }
      : denyAction("edit");
  }

  if (
    policy.routingProfile === "validation-checkpoint" &&
    policy.capabilities.validationReview &&
    isValidationReviewIntent(message)
  ) {
    return {
      kind: "validationReview",
      source: "review-offer",
      message,
    };
  }

  if (
    workflow.lastAssistantSuggestedEditableWork &&
    policy.capabilities.workspaceEdits &&
    isDoThatFollowUp(message)
  ) {
    return { kind: "edit", source: "message", message };
  }

  const intent = resolveTutorRequestIntent(message, "auto", {
    hasActivePlan: workflow.hasActivePlan,
    lastAssistantAskedPlanningQuestion: workflow.lastAssistantAskedPlanningQuestion,
    supportContext: policy.supportContext,
  });

  return actionForIntent(intent, message, policy);
}
