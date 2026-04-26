import type { ChatAttachment } from "../../../../../types/chat";
import type { TutorContextFile } from "../../../../../types/tutor";

const MAX_UPLOAD_CONTEXT_CHARS = 20_000;
const TEXT_UPLOAD_EXTENSIONS = new Set([
  "css",
  "csv",
  "html",
  "htm",
  "js",
  "json",
  "jsx",
  "md",
  "py",
  "scss",
  "svg",
  "ts",
  "tsx",
  "txt",
  "xml",
]);

interface CodeAttachmentContext {
  content: string;
  startLine: number;
  endLine: number;
  fileName: string;
}

interface BuildAttachmentsInput {
  attachedFiles: string[];
  codeAttachmentTimestamps: Record<string, string>;
  codeAttachmentContexts: Record<string, CodeAttachmentContext>;
  contextFileByPath: Map<string, TutorContextFile>;
  uploadedAttachmentContexts: Record<string, ChatAttachment>;
  attachmentMeta?: Record<string, ChatAttachment>;
}

function fileExtension(fileName: string) {
  const dot = fileName.lastIndexOf(".");
  return dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : "";
}

function isTextUpload(file: File) {
  return file.type.startsWith("text/") || TEXT_UPLOAD_EXTENSIONS.has(fileExtension(file.name));
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function attachmentDisplayName(pathOrName: string) {
  const i = pathOrName.lastIndexOf("/");
  return i >= 0 ? pathOrName.slice(i + 1) : pathOrName;
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function truncateUploadContent(content: string) {
  if (content.length <= MAX_UPLOAD_CONTEXT_CHARS) return content;
  return `${content.slice(0, MAX_UPLOAD_CONTEXT_CHARS)}\n\n[Upload truncated after ${MAX_UPLOAD_CONTEXT_CHARS} characters.]`;
}

export function buildUniqueUploadPath(fileName: string, existingPaths: Set<string>) {
  const basePath = `uploads/${fileName}`;
  if (!existingPaths.has(basePath)) return basePath;

  const dot = fileName.lastIndexOf(".");
  const name = dot >= 0 ? fileName.slice(0, dot) : fileName;
  const ext = dot >= 0 ? fileName.slice(dot) : "";
  let index = 2;
  let candidate = `uploads/${name} (${index})${ext}`;
  while (existingPaths.has(candidate)) {
    index += 1;
    candidate = `uploads/${name} (${index})${ext}`;
  }
  return candidate;
}

export async function buildUploadedAttachment(file: File, path: string): Promise<ChatAttachment> {
  const timestamp = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const mimeType = file.type || "unknown type";
  let imageSrc: string | null = null;
  let content = "";

  if (file.type.startsWith("image/")) {
    imageSrc = await readFileAsDataUrl(file);
    content = `Uploaded image file: ${file.name}\nType: ${mimeType}\nSize: ${formatFileSize(file.size)}\nNote: Image bytes are included in the model request for visual context.`;
  } else if (isTextUpload(file)) {
    content = truncateUploadContent(await file.text());
  } else {
    content = `Uploaded file: ${file.name}\nType: ${mimeType}\nSize: ${formatFileSize(file.size)}\nNote: This file type could not be read as text in the browser.`;
  }

  return {
    fileName: file.name,
    path,
    imageSrc,
    imageDataUrl: imageSrc ?? undefined,
    timestamp,
    source: "upload",
    content,
    mimeType,
    sizeBytes: file.size,
  };
}

export function buildUnreadableUploadAttachment(file: File, path: string): ChatAttachment {
  return {
    fileName: file.name,
    path,
    imageSrc: null,
    timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    source: "upload",
    content: `Uploaded file: ${file.name}\nType: ${file.type || "unknown type"}\nSize: ${formatFileSize(file.size)}\nNote: The browser could not read this file for text context.`,
    mimeType: file.type || "unknown type",
    sizeBytes: file.size,
  };
}

export function buildAttachmentsForSend({
  attachedFiles,
  codeAttachmentTimestamps,
  codeAttachmentContexts,
  contextFileByPath,
  uploadedAttachmentContexts,
  attachmentMeta,
}: BuildAttachmentsInput): ChatAttachment[] | undefined {
  if (attachedFiles.length === 0) return undefined;

  const codeRefs = attachedFiles
    .filter((f) => codeAttachmentTimestamps[f])
    .map((filePath) => ({
      fileName: codeAttachmentContexts[filePath]?.fileName ?? attachmentDisplayName(filePath),
      path: filePath,
      imageSrc: null,
      timestamp: codeAttachmentTimestamps[filePath],
      source: "code-reference" as const,
      content: codeAttachmentContexts[filePath]?.content,
      startLine: codeAttachmentContexts[filePath]?.startLine,
      endLine: codeAttachmentContexts[filePath]?.endLine,
    }));

  const projectRefs = attachedFiles
    .filter((f) => !codeAttachmentTimestamps[f])
    .map((filePath) => {
      const contextFile = contextFileByPath.get(filePath);
      if (!contextFile) return null;
      return {
        fileName: contextFile.fileName,
        path: contextFile.path,
        imageSrc: null,
        timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
        source: "project" as const,
        content: contextFile.content,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const others = attachedFiles
    .filter((f) => !codeAttachmentTimestamps[f] && !contextFileByPath.has(f))
    .map((filePath) => {
      const meta = uploadedAttachmentContexts[filePath] ?? attachmentMeta?.[filePath];
      return {
        fileName: meta?.fileName ?? attachmentDisplayName(filePath),
        path: filePath,
        imageSrc: meta?.imageSrc ?? null,
        imageDataUrl: meta?.imageDataUrl,
        timestamp: meta?.timestamp ?? new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
        source: meta?.source ?? ("upload" as const),
        content: meta?.content,
        mimeType: meta?.mimeType,
        sizeBytes: meta?.sizeBytes,
        startLine: meta?.startLine,
        endLine: meta?.endLine,
      };
    });

  const all = [...codeRefs, ...projectRefs, ...others];
  return all.length > 0 ? all : undefined;
}
