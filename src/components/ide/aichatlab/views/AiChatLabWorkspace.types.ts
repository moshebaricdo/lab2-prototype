import type { ChatMessage } from "../../../../types/chat";

export type AiChatConfigTab = "setup" | "retrieval" | "publish";

export interface AiChatLabWorkspaceProps {
  showConfigPanel: boolean;
  showSetupTab: boolean;
  showRetrievalTab: boolean;
  showPublishTab: boolean;
  showModelControl: boolean;
  showTemperatureControl: boolean;
  showSystemPromptControl: boolean;
  showRetrievalSourceControl: boolean;
  showPublishNameControl: boolean;
  showPublishIntentControl: boolean;
  showPublishDescriptionControl: boolean;
  showPublishLimitationsControl: boolean;
  showPublishTestingControl: boolean;
  showPublishExamplePromptsControl: boolean;
  initialModel: string;
  initialTemperature: number;
  systemPrompt: string;
  retrievalSource: string;
  modelName: string;
  modelIntent: string;
  modelDescription: string;
  modelLimitations: string;
  modelTestingEvaluation: string;
  examplePrompts: string;
  initialMessages: ChatMessage[];
  chatPlaceholder: string;
  isShareModeActive?: boolean;
  onShareModeChange?: (isActive: boolean) => void;
}

export interface ModelConfigState {
  modelId: string;
  temperature: number;
  systemPrompt: string;
  retrievalSource: string;
  modelName: string;
  modelIntent: string;
  modelDescription: string;
  modelLimitations: string;
  modelTestingEvaluation: string;
  examplePrompts: string;
}
