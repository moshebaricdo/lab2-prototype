import type { ChatMessage } from "../../../types/chat";
import type { ValidationReviewCardData } from "../../../types/validationReview";
import { buildValidationReviewOfferMessage } from "../../validation/validationReviewMessaging";

export type ValidationReviewRequestSource = "card" | "composer" | "continue";

/** @deprecated Import from validationReviewMessaging instead. */
export function buildValidationOfferMessage(
  submittedContent: string,
  review: ValidationReviewCardData,
) {
  return buildValidationReviewOfferMessage(submittedContent, review);
}

export function buildValidationReviewOfferChatMessage(
  studentMessage: string,
  offer: ValidationReviewCardData,
  offerMessage?: string,
): ChatMessage {
  return {
    role: "assistant",
    content: offerMessage ?? buildValidationReviewOfferMessage(studentMessage, offer),
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

/** Chat-triggered review (no prior offer card): alert + summary result. */
export function appendChatTriggeredValidationReview(
  messages: ChatMessage[],
  review: ValidationReviewCardData,
  resultMessage: string,
): ChatMessage[] {
  return [
    ...messages,
    {
      role: "assistant",
      content: "You requested a review.",
      isAlert: true,
      alertVariant: "validation",
    },
    {
      role: "assistant",
      content: resultMessage,
      validationReview: review,
    },
  ];
}
