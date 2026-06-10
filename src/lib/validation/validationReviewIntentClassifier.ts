import type { ChatMessage } from "../../types/chat";
import type { LevelProgressSnapshot } from "../../types/validationReview";
import { buildConversationContext } from "../tutor/context/contextBuilder";
import { logTutorEvent } from "../tutor/conversation/tutorDebugLogger";
import { isAffirmation } from "../tutor/intent/studentIntentSignals";
import {
  openAiTutorProvider,
  type TutorValidationReviewIntentProvider,
} from "../tutor/provider/openAiProvider";
import type { TutorChatMessage } from "../tutor/types";
import { getTutorApiKey } from "../../hooks/useTutorApiSettings";
import {
  hasHardSkipValidationReviewIntent,
} from "./validationReviewIntent";

export interface ValidationReviewIntentClassifierContext {
  conversation?: ChatMessage[];
  levelInstructionsMarkdown?: string;
  levelProgress?: LevelProgressSnapshot;
}

export interface ValidationReviewIntentWorkflowState {
  lastAssistantOfferedReview?: boolean;
}

export interface ValidationReviewIntentResult {
  shouldRunReview: boolean;
  source: "model" | "deterministic";
  reason?: string;
}

const VALIDATION_REVIEW_INTENT_SYSTEM_PROMPT = `You decide whether a Web Lab student wants Tutor to run Check My Work — the level's formal assessment checklist — right now.

Default to shouldRunReview FALSE. Only return true when the student is clearly asking to be checked, graded, validated, or told whether they can continue — not when they want debugging help or are still working.

Judge intent in context, not keywords. Use recentConversation and whether the previous Tutor turn invited a check (previousTutorOfferedReview).

Prefer shouldRunReview TRUE when:
- The student asks to check, review, validate, or grade their work or progress.
- The student reports completion or success and wants confirmation ("I'm done", "it works now", "I think I did it", "am I ready to continue?").
- The student echoes or accepts a review invitation from Tutor ("yes", "ready to request a review", "can you review my work?", "go ahead and check").
- The student fixed something and is asking for a completion check, not help fixing more.

Prefer shouldRunReview FALSE when:
- The student is debugging or stuck ("why isn't this working?", "can you check why this button is broken?", "still broken", "need help").
- The student negates readiness ("not done yet", "not ready to continue").
- The student asks a meta question about how to know when they are done, without asking to run the check now.
- The student wants Tutor to review an error, explain code, or co-debug — not run the assessment checklist.
- The message is about changing the project (edit/build request), not checking completion.

Examples (shouldRunReview):
- TRUE: "Am I done?", "check my work", "Can you review my work?", "ready to request a review", "I got the button working", "Can I continue?", "yes" (when previousTutorOfferedReview is true)
- FALSE: "Can you check why this button is broken?", "I'm not ready yet", "How do I know when I'm done?", "Can you review this error with me?", "make the nav look better"

Return JSON only:
{
  "shouldRunReview": true|false,
  "confidence": "high|low",
  "reason": "short phrase"
}

Use confidence "high" when you are sure. When genuinely uncertain, set shouldRunReview false with confidence "low" (fail-closed to normal Tutor help).`;

function tutorApiKeyAvailable() {
  try {
    return Boolean(getTutorApiKey().trim());
  } catch {
    return false;
  }
}

export function buildValidationReviewIntentMessages(
  message: string,
  context: ValidationReviewIntentClassifierContext = {},
  workflow: ValidationReviewIntentWorkflowState = {},
): TutorChatMessage[] {
  const payload = {
    studentMessage: message.trim(),
    previousTutorOfferedReview: Boolean(workflow.lastAssistantOfferedReview),
    levelInstructionsMarkdown: context.levelInstructionsMarkdown?.trim() || undefined,
    levelProgress: context.levelProgress,
    recentConversation: context.conversation?.length
      ? buildConversationContext(context.conversation)
      : undefined,
  };

  return [
    { role: "system", content: VALIDATION_REVIEW_INTENT_SYSTEM_PROMPT },
    { role: "user", content: JSON.stringify(payload) },
  ];
}

/** Bare affirmation after Tutor invited a check — no model round-trip. */
export function isAffirmationAfterReviewOffer(
  message: string,
  workflow: ValidationReviewIntentWorkflowState,
) {
  return Boolean(workflow.lastAssistantOfferedReview && isAffirmation(message));
}

export function failClosedValidationReviewIntent(): ValidationReviewIntentResult {
  return { shouldRunReview: false, source: "deterministic" };
}

export async function classifyValidationReviewIntentWithModel({
  message,
  context = {},
  workflow = {},
  provider = openAiTutorProvider,
}: {
  message: string;
  context?: ValidationReviewIntentClassifierContext;
  workflow?: ValidationReviewIntentWorkflowState;
  provider?: TutorValidationReviewIntentProvider;
}): Promise<ValidationReviewIntentResult> {
  if (provider === openAiTutorProvider && !tutorApiKeyAvailable()) {
    return failClosedValidationReviewIntent();
  }

  let response;
  try {
    response = await provider.requestValidationReviewIntent(
      buildValidationReviewIntentMessages(message, context, workflow),
    );
  } catch (error) {
    logTutorEvent("validation review intent classifier failed, fail-closed", error, "warn");
    return failClosedValidationReviewIntent();
  }

  if (!response || typeof response.shouldRunReview !== "boolean") {
    logTutorEvent("validation review intent classifier returned no usable verdict, fail-closed", {
      hasResponse: Boolean(response),
    }, "warn");
    return failClosedValidationReviewIntent();
  }

  const shouldRunReview =
    response.shouldRunReview === true && response.confidence !== "low";

  return {
    shouldRunReview,
    source: "model",
    reason: typeof response.reason === "string" ? response.reason : undefined,
  };
}

/**
 * Resolves whether chat should route to Check My Work.
 * Hard skips and bare affirmations after a review offer stay deterministic.
 * When keyed, the model is the semantic judge. Functional routing requires an
 * API key — use mock Tutor mode for unkeyed demos; Check my work button still works.
 */
export async function resolveValidationReviewIntent({
  message,
  context = {},
  workflow = {},
  provider = openAiTutorProvider,
}: {
  message: string;
  context?: ValidationReviewIntentClassifierContext;
  workflow?: ValidationReviewIntentWorkflowState;
  provider?: TutorValidationReviewIntentProvider;
}): Promise<ValidationReviewIntentResult> {
  if (hasHardSkipValidationReviewIntent(message)) {
    return { shouldRunReview: false, source: "deterministic", reason: "hard-skip" };
  }

  if (isAffirmationAfterReviewOffer(message, workflow)) {
    return {
      shouldRunReview: true,
      source: "deterministic",
      reason: "accepted-review-offer",
    };
  }

  if (provider === openAiTutorProvider && !tutorApiKeyAvailable()) {
    return failClosedValidationReviewIntent();
  }

  return classifyValidationReviewIntentWithModel({
    message,
    context,
    workflow,
    provider,
  });
}
