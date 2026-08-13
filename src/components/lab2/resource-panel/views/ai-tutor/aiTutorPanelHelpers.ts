import type { ChatMessage } from "../../../../../types/chat";
import type { InstructionGuide } from "../../../../../types/tutor";
import type { ValidationReviewCardData } from "../../../../../types/validationReview";
import { getInstructionGuideSignature } from "../../../../../lib/tutor/instruction/instructionGuide";
import { buildLevelProgressSnapshot } from "../../../../../lib/validation/levelProgress";
import { shortValidationCriterionLabel } from "../../../../../lib/validation/validationReviewMessaging";
import type { ValidationReviewFollowUpAction } from "./aiTutorMessageListLogic";

export function buildValidationReviewActionPrompt(
  action: ValidationReviewFollowUpAction,
  review?: ValidationReviewCardData | null,
) {
  const progress = buildLevelProgressSnapshot(review);
  const nextCriterion = progress?.nextIncompleteCriterion?.label;
  const target = nextCriterion
    ? ` for this next checklist item: ${shortValidationCriterionLabel(nextCriterion)}`
    : " for what to check next";

  if (action === "debug") {
    return `Help me work through${target} without giving away the full answer. Ask me what I tried first, then guide me toward what to test next.`;
  }

  if (action === "suggestion") {
    return `Give me one concrete suggestion${target}. Keep it focused on my current project and explain why it would help.`;
  }

  return `Give me one small hint${target}. Do not tell me the exact fix yet.`;
}

export function buildInstructionGuideSeedMessage(
  guide: InstructionGuide,
  content: string,
): ChatMessage {
  return {
    role: "assistant",
    content,
    instructionGuide: guide,
    instructionGuideSignature: getInstructionGuideSignature(guide),
  };
}
