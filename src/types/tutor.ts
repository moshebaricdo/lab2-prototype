import type { ChatAttachment, ChatMessage } from "./chat";

export type AiTutorInputExperiment =
  | "default"
  | "clarified-send"
  | "file-drop"
  | "file-chip-action"
  | "tutor-action-card";

export interface TutorContextFile {
  fileName: string;
  path: string;
  content: string;
  type?: string;
}

export type TutorRequestMode = "auto" | "build" | "plan" | "help";

export type TutorSubmitHandler = (
  message: string,
  conversation: ChatMessage[],
  requestMode?: TutorRequestMode,
) => Promise<ChatMessage | undefined>;

export interface MockTutorConfig {
  initialMessages?: ChatMessage[];
  initialInput?: string;
  initialAttachments?: string[];
  attachmentMeta?: Record<string, ChatAttachment>;
  response?:
    | ChatMessage
    | ((input: string, conversation: ChatMessage[]) => ChatMessage | Promise<ChatMessage>);
  seedConversation?: ChatMessage[] | ((firstUserMessage: string) => ChatMessage[]);
  seedOnMount?: boolean;
  buildAttachmentFollowUp?: (
    attachments: ChatAttachment[],
    inputExperiment: AiTutorInputExperiment,
  ) => ChatMessage | null;
}

export type TutorMode =
  | { kind: "mock"; config?: MockTutorConfig }
  | { kind: "functional" };
