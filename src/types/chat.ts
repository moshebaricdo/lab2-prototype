import type { ValidationReviewCardData } from "./validationReview";
import type { InstructionGuide } from "./tutor";

export interface ChatAttachment {
  fileName: string;
  /** Full path or label */
  path: string;
  /** Optional image src for thumbnail variant */
  imageSrc?: string | null;
  /** Data URL sent to vision-capable Tutor providers for image context. */
  imageDataUrl?: string;
  /** Timestamp label shown on sent chips (e.g. "12:56PM") */
  timestamp?: string;
  /** Whether this file has been added to the project */
  addedToProject?: boolean;
  /** Where the file came from */
  source?: "upload" | "project" | "code-reference" | "preview-element";
  /** Optional text context sent to Tutor for project files or selected code. */
  content?: string;
  mimeType?: string;
  sizeBytes?: number;
  startLine?: number;
  endLine?: number;
  previewPath?: string;
  selector?: string;
  elementId?: string;
  tagName?: string;
}

export interface ActionCardData {
  prompt: string;
  files: string[];
  /** Upload attachment paths from the preceding user message. */
  attachmentPaths?: string[];
  status: "pending" | "added" | "dismissed";
  kind?: "upload-add" | "legacy";
}

export interface AttachmentStatusContext {
  availableUploadCount: number;
  failedUploadCount?: number;
  inferredMentionedUploadCount?: number;
  instruction: string;
}

export interface NewProjectPlanAnswers {
  projectIdea: string;
  audience: string;
  coreInteraction: string;
  visualStyle: string;
}

export interface NewProjectPlanQuestionnaireData {
  status: "pending" | "answered";
  answers?: NewProjectPlanAnswers;
  moodboardAttachments?: ChatAttachment[];
}

export interface EditOptionChoice {
  id: string;
  label: string;
  enrichPrompt: string;
}

export interface EditOptionsCardData {
  status: "pending" | "answered";
  originalMessage: string;
  /** LLM-authored intro shown above the option list. */
  intro?: string;
  options: EditOptionChoice[];
  selectedOptionId?: string;
  /** Student free-text direction when they chose the custom input row. */
  customDirection?: string;
}

export interface FileChange {
  fileName: string;
  status: "new" | "modified" | "deleted";
  linesAdded?: number;
  linesRemoved?: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  attachments?: ChatAttachment[];
  /** Structured context for Tutor to naturally acknowledge missing/unavailable uploads. */
  attachmentStatus?: AttachmentStatusContext;
  actionCard?: ActionCardData;
  newProjectPlanQuestionnaire?: NewProjectPlanQuestionnaireData;
  /** Pre-edit direction picker for broad implementation requests. */
  editOptions?: EditOptionsCardData;
  /** Files the tutor created, modified, or deleted in this response. */
  fileChanges?: FileChange[];
  /** Short AI-generated summary used when accepted changes create a history save. */
  aiSaveTitle?: string;
  /** Accept/reject status for generated code changes. Shows action buttons when "pending". */
  codeChangeStatus?: "pending" | "accepted" | "rejected";
  /** Optional review card for intentional Web Lab validation flows. */
  validationReview?: ValidationReviewCardData;
  /** Optional Tutor-primary instruction guide shown as a structured onboarding card. */
  instructionGuide?: InstructionGuide;
  /** Stable signature for a guide-derived seed message. */
  instructionGuideSignature?: string;
  /** Placeholder opening before a Tutor API key or instruction analysis is available. */
  instructionOpeningPhase?: "api-key-required";
  /** Follow-up chip already selected for this validation review card. */
  validationReviewFollowUpAction?: "hint" | "debug" | "suggestion";
  /** When true, renders as a system-style alert instead of a chat bubble. */
  isAlert?: boolean;
  /** Visual variant for alert messages. Defaults to "success". */
  alertVariant?: "success" | "accepted" | "rejected" | "validation";
}
