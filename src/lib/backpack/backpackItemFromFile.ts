import type { BackpackItem, BackpackSourceLab } from "../../types/backpack";
import type { FileItem } from "../../types/file";

function isImageContent(content: string) {
  return content.startsWith("data:image/");
}

export function createBackpackItemFromFile(
  file: FileItem,
  options?: {
    sourceLab?: BackpackSourceLab;
    contentOverride?: string;
  },
): BackpackItem | string {
  const content = options?.contentOverride ?? file.content ?? file.proposedContent ?? "";
  if (!content.trim()) {
    return "This file has no content to save yet.";
  }

  const savedAt = new Date().toISOString();
  const thumbnailSrc =
    file.type === "image" || isImageContent(content) ? content : undefined;

  return {
    id: `backpack-${savedAt}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    savedAt,
    content,
    fileKind: file.type === "folder" ? "file" : file.type,
    sourceLab: options?.sourceLab ?? "generic",
    thumbnailSrc,
  };
}

export function formatBackpackSavedDate(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
  }).format(date);
}
