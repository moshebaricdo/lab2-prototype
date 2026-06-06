import type { TutorRequestMode } from "../../../types/tutor";

/**
 * Composer request mode is sticky UI state. Card-driven one-shot requests (edit-options,
 * plan questionnaire) pass an explicit mode to the submit handler; the composer itself
 * should return to Auto so the next free-text message is routed normally.
 */
export const DEFAULT_COMPOSER_REQUEST_MODE: TutorRequestMode = "auto";

/** After a card submits a one-shot build/plan/help request, reset the composer selector. */
export function composerModeAfterCardAction(): TutorRequestMode {
  return DEFAULT_COMPOSER_REQUEST_MODE;
}

/**
 * When sending from the composer, capture the current mode for this request only.
 * Non-auto modes are one-shot unless the dev model selector keeps them sticky intentionally.
 */
export function composerModeForSend(
  currentMode: TutorRequestMode,
  options?: { persistNonAutoMode?: boolean },
): { modeForRequest: TutorRequestMode; modeAfterSend: TutorRequestMode } {
  if (options?.persistNonAutoMode || currentMode === "auto") {
    return { modeForRequest: currentMode, modeAfterSend: currentMode };
  }
  return { modeForRequest: currentMode, modeAfterSend: DEFAULT_COMPOSER_REQUEST_MODE };
}
