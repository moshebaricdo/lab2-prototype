export type FileKind = "folder" | "file" | "html" | "css" | "image" | "text";

export interface FileItem {
  name: string;
  type: FileKind;
  children?: FileItem[];
  content?: string;
  locked?: boolean;
}

export interface CreateFileInput {
  fileName: string;
  fileType: string;
}
