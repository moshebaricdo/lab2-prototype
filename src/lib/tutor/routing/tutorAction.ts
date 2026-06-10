import type {
  TutorAction,
  TutorPolicy,
  TutorRequestMode,
} from "../../../types/tutor";
import {
  resolveValidationReviewIntent,
  type ValidationReviewIntentClassifierContext,
} from "../../validation/validationReviewIntentClassifier";
import { type TutorRequestIntent } from "../intent/requestIntent";
import { resolveAutoTutorRequestIntent } from "../intent/requestIntentClassifier";
import {
  openAiTutorProvider,
  type TutorEditClarificationNeedProvider,
  type TutorRequestIntentProvider,
  type TutorValidationReviewIntentProvider,
} from "../provider/openAiProvider";
import {
  resolveEditClarificationNeed,
  type EditClarificationClassifierContext,
} from "./editClarificationClassifier";

export interface TutorActionWorkflowState {
  hasActivePlan?: boolean;
  lastAssistantAskedPlanningQuestion?: boolean;
  lastAssistantSuggestedEditableWork?: boolean;
  /** The previous Tutor turn offered to review/check the student's work. */
  lastAssistantOfferedReview?: boolean;
  hasPendingProposal?: boolean;
  isHistoryReadOnly?: boolean;
  /** Skip clarification when the request already came from a selected edit option. */
  skipEditClarification?: boolean;
}

export interface EditClarificationRoutingContext extends EditClarificationClassifierContext {}

export interface ValidationReviewIntentRoutingContext
  extends ValidationReviewIntentClassifierContext {}

export interface ResolveTutorActionOptions {
  message: string;
  requestMode?: TutorRequestMode;
  policy: TutorPolicy;
  workflow?: TutorActionWorkflowState;
  editClarification?: EditClarificationRoutingContext;
  validationReviewIntent?: ValidationReviewIntentRoutingContext;
  /** Override the intent classifier provider (tests inject a stub). */
  intentProvider?: TutorRequestIntentProvider;
  /** Override the edit-clarification gate provider (tests inject a stub). */
  editClarificationProvider?: TutorEditClarificationNeedProvider;
  /** Override the validation-review intent gate provider (tests inject a stub). */
  validationReviewIntentProvider?: TutorValidationReviewIntentProvider;
}

function buildEditClarificationContext(
  policy: TutorPolicy,
  routingContext: EditClarificationRoutingContext | undefined,
): EditClarificationClassifierContext {
  return {
    supportContext: policy.supportContext,
    conversation: routingContext?.conversation,
    files: routingContext?.files,
    levelInstructionsMarkdown: routingContext?.levelInstructionsMarkdown,
    levelProgress: routingContext?.levelProgress,
    guide: routingContext?.guide,
    guideState: routingContext?.guideState,
  };
}

async function resolveEditAction({
  message,
  policy,
  source,
  workflow,
  editClarification,
  editClarificationProvider = openAiTutorProvider,
}: {
  message: string;
  policy: TutorPolicy;
  source: "message" | "ui";
  workflow: TutorActionWorkflowState;
  editClarification?: EditClarificationRoutingContext;
  editClarificationProvider?: TutorEditClarificationNeedProvider;
}): Promise<TutorAction> {
  if (!policy.capabilities.workspaceEdits) {
    return denyAction("edit");
  }

  const need = await resolveEditClarificationNeed({
    message,
    context: buildEditClarificationContext(policy, editClarification),
    workflow,
    provider: editClarificationProvider,
  });

  if (need.shouldClarify) {
    return {
      kind: "editClarification",
      source,
      message,
    };
  }

  return { kind: "edit", source, message };
}

function deniedMessage(requested: "guidance" | "plan" | "edit" | "validationReview") {
  if (requested === "guidance") {
    return "I can't answer Tutor help questions in this level right now. Use the level instructions as your next step.";
  }
  if (requested === "edit") {
    return "I can't edit files in this level, but you can make the change in the editor. I can help you reason through the next step or point you to the likely file.";
  }
  if (requested === "plan") {
    return "I can't create a plan file in this level, but you can describe your idea and I can help you think through the next step.";
  }
  return "I can't check your work in this level, but you can use the instructions as a checklist. I can help you review what to look at next.";
}

function denyAction(requested: "guidance" | "plan" | "edit" | "validationReview"): TutorAction {
  return {
    kind: "denied",
    requested,
    fallback: requested === "guidance" ? "message" : "guidance",
    disabledReason: "capability-disabled",
    message: deniedMessage(requested),
  };
}

function actionForIntent(
  intent: TutorRequestIntent,
  message: string,
  policy: TutorPolicy,
  workflow: TutorActionWorkflowState,
  editClarification?: EditClarificationRoutingContext,
  editClarificationProvider?: TutorEditClarificationNeedProvider,
): Promise<TutorAction> {
  if (intent === "edit") {
    return resolveEditAction({
      message,
      policy,
      source: "message",
      workflow,
      editClarification,
      editClarificationProvider,
    });
  }

  if (intent === "planning") {
    return Promise.resolve(
      policy.capabilities.planning
        ? { kind: "plan", source: "message", message }
        : denyAction("plan"),
    );
  }

  return Promise.resolve(
    policy.capabilities.guidance
      ? { kind: "guidance", source: "message", message }
      : denyAction("guidance"),
  );
}

function isDoThatFollowUp(message: string) {
  return /^\s*(please\s+)?(do|make|apply|try)\s+(that|it|this)\s*\.?\s*$/i.test(message) ||
    /^\s*(yes|yeah|yep|ok|okay),?\s+(please\s+)?(do|make|apply|try)\s+(that|it|this)\s*\.?\s*$/i.test(message);
}

export async function resolveTutorAction({
  message,
  requestMode = "auto",
  policy,
  workflow = {},
  editClarification,
  validationReviewIntent,
  intentProvider = openAiTutorProvider,
  editClarificationProvider = openAiTutorProvider,
  validationReviewIntentProvider = openAiTutorProvider,
}: ResolveTutorActionOptions): Promise<TutorAction> {
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

  // Readiness to validate overrides sticky Build/Plan/Help composer mode (e.g. after
  // picking a direction on the edit-options card, which temporarily sets Build).
  if (policy.capabilities.validationReview) {
    const reviewIntent = await resolveValidationReviewIntent({
      message,
      context: validationReviewIntent,
      workflow: { lastAssistantOfferedReview: workflow.lastAssistantOfferedReview },
      provider: validationReviewIntentProvider,
    });
    if (reviewIntent.shouldRunReview) {
      return {
        kind: "validationReview",
        source: "review-offer",
        message,
      };
    }
  }

  if (requestMode === "build") {
    return resolveEditAction({
      message,
      policy,
      source: "ui",
      workflow,
      editClarification,
      editClarificationProvider,
    });
  }

  if (requestMode === "plan") {
    return policy.capabilities.planning
      ? { kind: "plan", source: "ui", message }
      : denyAction("plan");
  }

  if (requestMode === "help") {
    return policy.capabilities.guidance
      ? { kind: "guidance", source: "ui", message }
      : denyAction("guidance");
  }

  if (
    workflow.lastAssistantSuggestedEditableWork &&
    policy.capabilities.workspaceEdits &&
    isDoThatFollowUp(message)
  ) {
    return { kind: "edit", source: "message", message };
  }

  const { intent } = await resolveAutoTutorRequestIntent({
    message,
    context: {
      hasActivePlan: workflow.hasActivePlan,
      lastAssistantAskedPlanningQuestion: workflow.lastAssistantAskedPlanningQuestion,
      supportContext: policy.supportContext,
    },
    provider: intentProvider,
  });

  return actionForIntent(
    intent,
    message,
    policy,
    workflow,
    editClarification,
    editClarificationProvider,
  );
}
