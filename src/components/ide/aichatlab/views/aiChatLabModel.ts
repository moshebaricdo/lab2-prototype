import type {
  AiChatConfigTab,
  AiChatLabWorkspaceProps,
  ModelConfigState,
} from "./AiChatLabWorkspace.types";

export const TAB_LABELS: Record<AiChatConfigTab, string> = {
  setup: "Setup",
  retrieval: "Retrieval",
  publish: "Publish",
};

export const MODEL_OPTIONS = [
  { value: "gpt-4o-mini", label: "GPT-4o mini" },
  { value: "claude-sonnet", label: "Claude Sonnet" },
  { value: "gemini-flash", label: "Gemini Flash" },
];

export function getModelLabel(modelId: string) {
  return MODEL_OPTIONS.find((option) => option.value === modelId)?.label ?? modelId;
}

function clampTemperature(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function createConfigState(
  props: AiChatLabWorkspaceProps,
): ModelConfigState {
  return {
    modelId: props.initialModel,
    temperature: clampTemperature(props.initialTemperature),
    systemPrompt: props.systemPrompt,
    retrievalSource: props.retrievalSource,
    modelName: props.modelName,
    modelIntent: props.modelIntent,
    modelDescription: props.modelDescription,
    modelLimitations: props.modelLimitations,
    modelTestingEvaluation: props.modelTestingEvaluation,
    examplePrompts: props.examplePrompts,
  };
}

export function buildAssistantReply(input: string, config: ModelConfigState) {
  const trimmedPrompt = input.trim();
  const modelLabel = getModelLabel(config.modelId);
  const creativity =
    config.temperature < 0.35
      ? "I'll keep this focused and predictable."
      : config.temperature > 0.75
        ? "I'll explore a few creative angles."
        : "I'll balance clarity with a little flexibility.";
  const systemHint = config.systemPrompt.trim()
    ? ` System note: ${config.systemPrompt.trim()}`
    : "";
  const retrievalHint = config.retrievalSource.trim()
    ? ` I also checked the retrieval notes before answering.`
    : "";
  const intentHint = config.modelIntent.trim()
    ? ` This response is tuned for ${config.modelIntent.trim().toLowerCase()}.`
    : "";

  return [
    `${creativity} ${modelLabel} is responding to: "${trimmedPrompt}".`,
    `${retrievalHint}${intentHint}${systemHint}`.trim(),
  ]
    .filter(Boolean)
    .join("\n\n");
}
