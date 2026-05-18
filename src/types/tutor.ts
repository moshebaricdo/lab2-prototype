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

export type TutorSupportContext = "standalone-project" | "curriculum-level";

export type TutorRoutingProfile =
  | "open-ended-project"
  | "guided-level"
  | "validation-checkpoint";

export interface TutorPolicy {
  lab: "weblab2" | "pythonlab";
  supportContext: TutorSupportContext;
  capabilities: {
    guidance: boolean;
    planning: boolean;
    workspaceEdits: boolean;
    validationReview: boolean;
    proposalReview: boolean;
  };
  pedagogy: {
    mode: "open" | "curriculum-socratic";
    revealPolicy?: "hint-first" | "direct-when-asked";
  };
  routingProfile: TutorRoutingProfile;
}

export type TutorActionSource =
  | "message"
  | "ui"
  | "continue"
  | "review-button"
  | "review-offer";

export type TutorActionDeniedReason =
  | "capability-disabled"
  | "pending-proposal"
  | "history-read-only"
  | "validation-required-first";

export interface TutorMessageRoutingContext {
  hasActivePlan?: boolean;
  lastAssistantAskedPlanningQuestion?: boolean;
  lastAssistantSuggestedEditableWork?: boolean;
}

export type TutorAction =
  | { kind: "guidance"; source: "message" | "ui"; message: string }
  | { kind: "plan"; source: "message" | "ui"; message: string }
  | { kind: "edit"; source: "message" | "ui"; message: string }
  | { kind: "validationReview"; source: "continue" | "review-button" | "review-offer"; message: string }
  | {
      kind: "denied";
      requested: "plan" | "edit" | "validationReview";
      fallback: "guidance" | "message";
      disabledReason: TutorActionDeniedReason;
      message: string;
    };

export type TutorStartFlow = "composer" | "new-project-plan-questionnaire";

export interface TutorStartOptions {
  flow?: TutorStartFlow;
}

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
