export type FileKind = "folder" | "file" | "html" | "css" | "image" | "text";

export interface FileItem {
  name: string;
  type: FileKind;
  children?: FileItem[];
  content?: string;
  /** Prototype-only AI-modified content used for pending/accepted change previews. */
  proposedContent?: string;
  /** Prototype-only pending AI operation for accept/reject state. */
  proposedStatus?: "new" | "modified" | "deleted";
  locked?: boolean;
}

export interface CreateFileInput {
  fileName: string;
  fileType: string;
}
