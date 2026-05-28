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

export type InstructionStepIntent =
  | "observe"
  | "inspect"
  | "explain"
  | "fix"
  | "verify"
  | "ask-for-help";

export type InstructionExpectedStudentMove =
  | "observation"
  | "code-change"
  | "reflection"
  | "review-request";

export interface InstructionStep {
  id: string;
  title: string;
  prompt?: string;
  intent: InstructionStepIntent;
  expectedStudentMove?: InstructionExpectedStudentMove;
  notes?: string[];
}

export type InstructionCheckpoint = InstructionStep;

export interface LinearInstructionGuide {
  type: "linear";
  id: string;
  sourceSignature: string;
  overview: string;
  firstMove: string;
  steps: InstructionStep[];
  fallbackMarkdown: string;
}

export interface InstructionOption {
  id: string;
  label: string;
  prompt: string;
  intent: "style-polish" | "content-choice" | "debug-focus" | "concept-focus";
  editOriented?: boolean;
}

export interface ChoiceBasedInstructionGuide {
  type: "choice-based";
  id: string;
  sourceSignature: string;
  goal: string;
  constraints: string[];
  options: InstructionOption[];
  fallbackMarkdown: string;
}

export type InstructionGuide = LinearInstructionGuide | ChoiceBasedInstructionGuide;

export type TutorOpeningTone = "debug" | "concept" | "creative" | "procedure";

export interface TutorOpening {
  tone: TutorOpeningTone;
  welcome?: string;
  goal: string;
  success: string;
  firstMove: string;
  sourceSignature: string;
}

export interface InstructionGuideState {
  guideSignature: string;
  activeStepId?: string;
  completedStepIds: string[];
  activeOptionId?: string;
  lastCoachMoveId?: string;
  dismissedIntro?: boolean;
}

export type InstructionFocusContext =
  | {
      guideType: "linear";
      overview: string;
      currentStep: InstructionStep;
      previousStep?: InstructionStep;
      didAdvance: boolean;
      guidanceDirective: string;
    }
  | {
      guideType: "choice-based";
      goal: string;
      constraints: string[];
      activeOption?: InstructionOption;
      availableOptions: InstructionOption[];
      didSelectOption: boolean;
      guidanceDirective: string;
    };

export type TutorRoutingProfile =
  | "open-ended-project"
  | "guided-level"
  | "validation-checkpoint";

export type TutorPolicyPreset =
  | "route-default"
  | "standalone-project"
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
  | "guide-chip"
  | "continue"
  | "review-button"
  | "review-offer"
  | "edit-options";

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
  | {
      kind: "instructionStep";
      source: "message" | "guide-chip";
      message: string;
      guideState: InstructionGuideState;
    }
  | { kind: "guidance"; source: "message" | "ui"; message: string }
  | { kind: "plan"; source: "message" | "ui"; message: string }
  | { kind: "edit"; source: "message" | "ui" | "edit-options"; message: string }
  | {
      kind: "editClarification";
      source: "message" | "ui";
      message: string;
    }
  | { kind: "validationReview"; source: "continue" | "review-button" | "review-offer"; message: string }
  | {
      kind: "denied";
      requested: "guidance" | "plan" | "edit" | "validationReview";
      fallback: "guidance" | "message";
      disabledReason: TutorActionDeniedReason;
      message: string;
    };

export type TutorStartFlow = "composer" | "new-project-plan-questionnaire";

export interface TutorStartOptions {
  flow?: TutorStartFlow;
}

export interface TutorSubmitOptions {
  skipEditClarification?: boolean;
}

export type TutorSubmitHandler = (
  message: string,
  conversation: ChatMessage[],
  requestMode?: TutorRequestMode,
  options?: TutorSubmitOptions,
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
