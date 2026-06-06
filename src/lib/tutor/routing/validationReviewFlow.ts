import type { ChatMessage } from "../../../types/chat";
import type { ValidationReviewCardData } from "../../../types/validationReview";

export type ValidationReviewRequestSource = "card" | "composer" | "continue";

export function buildValidationOfferMessage(
  submittedContent: string,
  review: ValidationReviewCardData,
) {
  const hasMultipleRequirements = (review.requirements?.length ?? 0) > 1;

  if (/\b(works|worked|working|fixed|done|finished|complete|completed)\b/i.test(submittedContent)) {
    return "Great. I can check your work now and let you know whether you're ready to continue.";
  }

  if (/\b(check|review|validate|grade)\b/i.test(submittedContent)) {
    return hasMultipleRequirements
      ? "I can check your progress and show what looks complete and what to work on next."
      : "I can check your work and let you know whether you're ready to continue.";
  }

  return "When you're ready, I can check your work and let you know whether you're ready to continue.";
}

export function buildValidationReviewOfferChatMessage(
  studentMessage: string,
  offer: ValidationReviewCardData,
): ChatMessage {
  return {
    role: "assistant",
    content: buildValidationOfferMessage(studentMessage, offer),
    validationReview: offer,
  };
}

export function hideValidationReviewOfferActionsWithAlert(messages: ChatMessage[]) {
  let insertedAlert = false;
  const nextMessages: ChatMessage[] = [];

  for (const message of messages) {
    if (message.validationReview?.kind !== "offer") {
      nextMessages.push(message);
      continue;
    }

    nextMessages.push({
      ...message,
      validationReview: undefined,
    });

    if (!insertedAlert) {
      nextMessages.push({
        role: "assistant",
        content: "You requested a review.",
        isAlert: true,
        alertVariant: "validation",
      });
      insertedAlert = true;
    }
  }

  return nextMessages;
}

export function appendValidationReviewResultToConversation(
  messages: ChatMessage[],
  review: ValidationReviewCardData,
  resultMessage: string,
): ChatMessage[] {
  return [
    ...hideValidationReviewOfferActionsWithAlert(messages),
    {
      role: "assistant",
      content: resultMessage,
      validationReview: review,
    },
  ];
}
