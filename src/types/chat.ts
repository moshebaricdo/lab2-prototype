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
  source?: "upload" | "project" | "code-reference";
  /** Optional text context sent to Tutor for project files or selected code. */
  content?: string;
  mimeType?: string;
  sizeBytes?: number;
  startLine?: number;
  endLine?: number;
}

export interface ActionCardData {
  prompt: string;
  files: string[];
  status: "pending" | "added" | "dismissed";
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
  actionCard?: ActionCardData;
  /** Files the tutor created, modified, or deleted in this response. */
  fileChanges?: FileChange[];
  /** Accept/reject status for generated code changes. Shows action buttons when "pending". */
  codeChangeStatus?: "pending" | "accepted" | "rejected";
  /** When true, renders as a system-style alert instead of a chat bubble. */
  isAlert?: boolean;
  /** Visual variant for alert messages. Defaults to "success". */
  alertVariant?: "success" | "accepted" | "rejected";
}
