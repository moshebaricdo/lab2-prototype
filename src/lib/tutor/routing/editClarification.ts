import type { EditOptionChoice, EditOptionsCardData } from "../../../types/chat";
import type { InstructionFocusContext, InstructionOption } from "../../../types/tutor";
import { asksForDirectEdit } from "../intent/requestIntent";
import {
  hasConcreteEditDirective,
  hasVagueEditQualityGoal,
  messageIndicatesCompletionOrReadiness,
} from "../intent/studentIntentSignals";
import type { TutorEditClarificationResponse } from "../types";

export type { EditOptionChoice, EditOptionsCardData };

export function isEditOrientedInstructionOption(option: InstructionOption) {
  if (option.editOriented === false) return false;
  if (option.editOriented === true) return true;
  return option.intent === "style-polish" || option.intent === "content-choice";
}

export function buildEditClarificationMessageForFocus(
  userMessage: string,
  option: InstructionOption,
) {
  const trimmed = userMessage.trim();
  if (trimmed && isUnderspecifiedEditRequest(trimmed)) {
    return trimmed;
  }
  const focus = trimmed || option.label.toLowerCase();
  return `Improve ${focus}. ${option.prompt}`;
}

/** True when the student is picking a focus area, not reporting completion. */
export function messageLooksLikeInstructionFocusPick(message: string) {
  return !messageIndicatesCompletionOrReadiness(message);
}

export function shouldOfferEditClarificationForFocusSelection(
  message: string,
  instructionFocus: InstructionFocusContext | undefined,
  workspaceEditsEnabled: boolean,
): instructionFocus is InstructionFocusContext & {
  guideType: "choice-based";
  activeOption: InstructionOption;
  didSelectOption: true;
} {
  if (!messageLooksLikeInstructionFocusPick(message)) return false;
  if (!workspaceEditsEnabled) return false;
  if (!instructionFocus || instructionFocus.guideType !== "choice-based") return false;
  if (!instructionFocus.didSelectOption || !instructionFocus.activeOption) return false;
  return isEditOrientedInstructionOption(instructionFocus.activeOption);
}

export function isUnderspecifiedEditRequest(message: string) {
  const trimmed = message.trim();
  if (!trimmed || !asksForDirectEdit(trimmed)) return false;
  if (!hasVagueEditQualityGoal(trimmed)) return false;
  if (hasConcreteEditDirective(trimmed)) return false;
  return true;
}

function slugifyOptionId(label: string, index: number) {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `option-${index + 1}`;
}

export function normalizeEditClarificationOptions(
  response: TutorEditClarificationResponse,
): EditOptionChoice[] {
  if (!Array.isArray(response.options)) return [];

  const seenIds = new Set<string>();
  const normalized: EditOptionChoice[] = [];

  response.options.forEach((option, index) => {
    const label = typeof option.label === "string" ? option.label.trim() : "";
    const enrichPrompt =
      typeof option.enrichPrompt === "string" ? option.enrichPrompt.trim() : "";
    if (!label || !enrichPrompt) return;

    const requestedId =
      typeof option.id === "string" ? option.id.trim() : "";
    let id = requestedId || slugifyOptionId(label, index);
    if (seenIds.has(id)) {
      id = `${id}-${index + 1}`;
    }
    seenIds.add(id);

    normalized.push({
      id,
      label,
      enrichPrompt,
    });
  });

  return normalized.slice(0, 4);
}

export function buildEditOptionsCardFromClarification(
  originalMessage: string,
  response: TutorEditClarificationResponse,
): EditOptionsCardData | null {
  const options = normalizeEditClarificationOptions(response);
  if (options.length < 2) return null;

  const intro =
    typeof response.message === "string" ? response.message.trim() : "";

  return {
    status: "pending",
    originalMessage: originalMessage.trim(),
    intro: intro || undefined,
    options,
  };
}

export function enrichEditOptionPrompt(option: EditOptionChoice) {
  return option.enrichPrompt.trim();
}

export function buildCustomEditOptionPrompt(
  originalMessage: string,
  customDirection: string,
) {
  const direction = customDirection.trim();
  const base = originalMessage.trim();

  return `${base} Use this student direction: "${direction}". Apply a focused project edit that matches what they asked for, using the current project files as context.`;
}

export function buildCustomEditOptionChoice(
  originalMessage: string,
  customDirection: string,
): EditOptionChoice {
  const direction = customDirection.trim();

  return {
    id: "custom",
    label: direction,
    enrichPrompt: buildCustomEditOptionPrompt(originalMessage, direction),
  };
}
