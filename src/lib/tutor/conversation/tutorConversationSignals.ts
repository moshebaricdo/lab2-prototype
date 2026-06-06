import type { ChatMessage } from "../../../types/chat";

const PLANNING_QUESTION_PATTERN =
  /\b(plan|project|idea|audience|feature|style|interaction|question|before\s+building|before\s+we\s+build)\b/i;

const VALIDATION_REVIEW_OFFER_PATTERN =
  /\b(request a review|run (a )?review|ready for (a )?review|ready to (continue|check|review)|check (your|my) (work|progress|answer|solution)|review (your|my) (work|progress)|validate (your|my|the) (work|project)|let you know (whether|if) you'?re ready)\b/i;

const EDITABLE_ARTIFACT_KEYWORD_PATTERN =
  /\b(style\.css|index\.html|script\.js|selector|button|link|hover|focus|style|spacing|color|colour|background|padding|margin|border|class|id)\b/i;

export function getLastAssistantNonAlertMessage(conversation: ChatMessage[]) {
  for (let index = conversation.length - 1; index >= 0; index -= 1) {
    const message = conversation[index];
    if (message.role === "assistant" && !message.isAlert) {
      return message;
    }
  }
  return undefined;
}

export function lastAssistantAskedPlanningQuestion(conversation: ChatMessage[]) {
  const lastAssistantMessage = getLastAssistantNonAlertMessage(conversation);
  if (!lastAssistantMessage?.content.includes("?")) return false;
  return PLANNING_QUESTION_PATTERN.test(lastAssistantMessage.content);
}

export function lastAssistantOfferedValidationReview(conversation: ChatMessage[]) {
  const lastAssistantMessage = getLastAssistantNonAlertMessage(conversation);
  if (!lastAssistantMessage) return false;
  if (lastAssistantMessage.validationReview) return false;
  return VALIDATION_REVIEW_OFFER_PATTERN.test(lastAssistantMessage.content);
}

function recentAssistantMessages(conversation: ChatMessage[], count: number) {
  const assistants: ChatMessage[] = [];
  for (let index = conversation.length - 1; index >= 0 && assistants.length < count; index -= 1) {
    const message = conversation[index];
    if (message.role === "assistant" && !message.isAlert) {
      assistants.push(message);
    }
  }
  return assistants;
}

/**
 * True when the latest assistant turn invited an edit follow-up ("do that").
 * Prefers structured edit-options cards over keyword scans on assistant prose.
 */
export function lastAssistantInvitedEditableFollowUp(conversation: ChatMessage[]) {
  const lastAssistantMessage = getLastAssistantNonAlertMessage(conversation);
  if (!lastAssistantMessage) return false;
  if (lastAssistantMessage.fileChanges?.length || lastAssistantMessage.validationReview) {
    return false;
  }

  if (lastAssistantMessage.editOptions) return true;

  if (recentAssistantMessages(conversation, 3).some((message) => message.editOptions)) {
    return true;
  }

  return EDITABLE_ARTIFACT_KEYWORD_PATTERN.test(lastAssistantMessage.content);
}
