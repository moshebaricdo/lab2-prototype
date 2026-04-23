export interface ChatAttachment {
  fileName: string;
  /** Full path or label */
  path: string;
  /** Optional image src for thumbnail variant */
  imageSrc?: string | null;
  /** Timestamp label shown on sent chips (e.g. "12:56PM") */
  timestamp?: string;
  /** Whether this file has been added to the project */
  addedToProject?: boolean;
  /** Where the file came from — "upload" = user's device, "project" = existing project file */
  source?: "upload" | "project";
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
  /** When true, renders as a system-style alert instead of a chat bubble. */
  isAlert?: boolean;
  /** Visual variant for alert messages. Defaults to "success". */
  alertVariant?: "success" | "accepted" | "rejected";
}
