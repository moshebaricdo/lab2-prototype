import type { ChatMessage } from "../../../types/chat";
import type { InstructionPinnedStep } from "../../../types/tutor";

export const TUTOR_INSTRUCTION_API_KEY_OPENING =
  "Add a Tutor API key in Lab Settings to load a personalized opening and coaching plan for this level.";

export const TUTOR_INSTRUCTION_API_KEY_PINNED_STEP = {
  positionLabel: "API key required",
  summary: "Add a Tutor API key in Lab Settings to load coaching steps.",
} satisfies InstructionPinnedStep;

export const TUTOR_INSTRUCTION_LOADING_PINNED_STEP = {
  positionLabel: "Loading",
  summary: "Preparing your coaching plan…",
} satisfies InstructionPinnedStep;

export function buildApiKeyRequiredSeedMessage(): ChatMessage {
  return {
    role: "assistant",
    content: TUTOR_INSTRUCTION_API_KEY_OPENING,
    instructionOpeningPhase: "api-key-required",
  };
}

export function isApiKeyRequiredSeedMessage(message: ChatMessage | undefined) {
  return message?.instructionOpeningPhase === "api-key-required";
}
