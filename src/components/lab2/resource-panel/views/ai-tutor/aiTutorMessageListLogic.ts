import type { ChatMessage } from "../../../../../types/chat";
import type { ValidationReviewCardData } from "../../../../../types/validationReview";

export type ValidationReviewFollowUpAction = "hint" | "debug" | "suggestion";

export function hasLaterChatMessageForTest(messages: ChatMessage[], messageIndex: number) {
  return messages.length > messageIndex + 1;
}

export function hasInstructionGuideActionsForTest() {
  return false;
}

function validationReviewText(review: ValidationReviewCardData) {
  return [
    review.title,
    review.nextStep,
    ...(review.requirements ?? []),
    ...(review.requirementLabels ?? []),
    ...(review.items ?? []).flatMap((item) => [item.label, item.detail]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function shouldPreferDebugFollowUp(review: ValidationReviewCardData) {
  if (review.followUpPreference === "debug") return true;
  if (review.followUpPreference === "suggestion") return false;

  const text = validationReviewText(review);
  const isStylingFocused =
    review.mode === "open-ended" ||
    /\b(style|styling|css|color|colour|font|typography|spacing|layout|align|alignment|padding|margin|visual|design|polish|responsive)\b/i.test(text);
  const looksBugFocused =
    review.mode === "technical" ||
    /\b(debug|bug|error|broken|fix|logic|javascript|selector|promise|loop|function|event|click|console|trace|not working|fails?)\b/i.test(text);

  return looksBugFocused && !isStylingFocused;
}

export function validationReviewSuggestionActions(review: ValidationReviewCardData) {
  const actions: Array<{
    action: ValidationReviewFollowUpAction;
    label: string;
    iconName: "lightbulb" | "bug" | "wand-magic-sparkles";
  }> = [
    { action: "hint", label: "Give me a hint", iconName: "lightbulb" },
  ];

  if (shouldPreferDebugFollowUp(review)) {
    actions.push({ action: "debug", label: "Help me debug", iconName: "bug" });
    return actions;
  }

  actions.push({
    action: "suggestion",
    label: "Give me a suggestion",
    iconName: "wand-magic-sparkles",
  });

  return actions;
}

export const validationReviewSuggestionActionsForTest = validationReviewSuggestionActions;
