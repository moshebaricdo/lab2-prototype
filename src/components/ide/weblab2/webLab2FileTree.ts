import { PROJECT_PLAN_FILE } from "../../../lib/tutor/planningRunner";
import type { FileItem } from "../../../types/file";
import {
  findFileEntryInTree as findFileEntryInTreeBase,
  normalizeFileLookupPath,
  pathBasename,
} from "../../../utils/fileTree";
import type { getPreviewHtmlFiles } from "./views/buildPreviewSrcDoc";

export const FIXED_SAVED_SUBTITLE = "Saved a few seconds ago";
export const NON_ROOT_WRAPPER_FOLDERS = new Set(["Plans"]);

export function findFileEntryInTree(
  tree: FileItem[],
  fileName: string,
): ReturnType<typeof findFileEntryInTreeBase> {
  return findFileEntryInTreeBase(tree, fileName, {
    nonRootWrapperFolders: NON_ROOT_WRAPPER_FOLDERS,
  });
}

export function findPreviewHtmlFileForChange(
  previewHtmlFiles: ReturnType<typeof getPreviewHtmlFiles>,
  fileName: string,
) {
  const normalizedFileName = normalizeFileLookupPath(fileName);
  const fileBaseName = pathBasename(normalizedFileName);

  return previewHtmlFiles.find((file) =>
    file.path === normalizedFileName ||
    file.name === normalizedFileName ||
    file.name === fileBaseName ||
    pathBasename(file.path) === fileBaseName
  ) ?? null;
}

export function isInlineImageContent(content: string | undefined) {
  return Boolean(content?.startsWith("data:") || content?.startsWith("blob:"));
}

export function getInitialInlineImageContentMap(items: FileItem[], parentPath = "") {
  const imageContentByPath = new Map<string, string>();

  for (const item of items) {
    const itemPath = parentPath ? `${parentPath}/${item.name}` : item.name;
    if (item.type === "folder") {
      for (const [path, content] of getInitialInlineImageContentMap(item.children ?? [], itemPath)) {
        imageContentByPath.set(path, content);
      }
      continue;
    }

    if (item.type === "image" && isInlineImageContent(item.content)) {
      imageContentByPath.set(itemPath, item.content!);
      imageContentByPath.set(item.name, item.content!);
    }
  }

  return imageContentByPath;
}

export function hydrateInlineImageContent(
  items: FileItem[],
  imageContentByPath: Map<string, string>,
  parentPath = "",
): FileItem[] {
  return items.map((item) => {
    const itemPath = parentPath ? `${parentPath}/${item.name}` : item.name;
    if (item.type === "folder") {
      return {
        ...item,
        children: hydrateInlineImageContent(item.children ?? [], imageContentByPath, itemPath),
      };
    }

    if (item.type !== "image" || isInlineImageContent(item.content)) return item;
    const inlineContent = imageContentByPath.get(itemPath) ?? imageContentByPath.get(item.name);
    return inlineContent ? { ...item, content: inlineContent } : item;
  });
}

export function stripInitialInlineImageContent(
  items: FileItem[],
  imageContentByPath: Map<string, string>,
  parentPath = "",
): FileItem[] {
  return items.map((item) => {
    const itemPath = parentPath ? `${parentPath}/${item.name}` : item.name;
    if (item.type === "folder") {
      return {
        ...item,
        children: stripInitialInlineImageContent(
          item.children ?? [],
          imageContentByPath,
          itemPath,
        ),
      };
    }

    const shouldStripContent =
      item.type === "image" &&
      isInlineImageContent(item.content) &&
      (
        imageContentByPath.get(itemPath) === item.content ||
        imageContentByPath.get(item.name) === item.content
      );

    if (!shouldStripContent) {
      const {
        proposedContent: _proposedContent,
        proposedStatus: _proposedStatus,
        ...rest
      } = item;
      return rest;
    }

    const {
      content: _content,
      proposedContent: _proposedContent,
      proposedStatus: _proposedStatus,
      ...rest
    } = item;
    return rest;
  });
}

export function findFirstOpenableFile(tree: FileItem[]): FileItem | null {
  const flatFiles: FileItem[] = [];
  const visit = (items: FileItem[]) => {
    for (const item of items) {
      if (item.children) {
        visit(item.children);
      } else {
        flatFiles.push(item);
      }
    }
  };
  visit(tree);
  return (
    flatFiles.find((file) => file.name.toLowerCase() === "index.html") ??
    flatFiles.find((file) => file.type === "html") ??
    flatFiles[0] ??
    null
  );
}

export function hasProjectFiles(tree: FileItem[]): boolean {
  return tree.some((item) => item.type === "folder"
    ? hasProjectFiles(item.children ?? [])
    : true);
}

export function hasNonPlanProjectFiles(tree: FileItem[], parentPath = ""): boolean {
  return tree.some((item) => {
    const path = parentPath ? `${parentPath}/${item.name}` : item.name;
    if (item.type === "folder") {
      return hasNonPlanProjectFiles(item.children ?? [], path);
    }
    return !isPlanFilePath(path);
  });
}

export function isPlanOnlyTutorChange(changes: { fileName: string; status: string }[]) {
  return changes.length === 1 &&
    changes[0].fileName === PROJECT_PLAN_FILE &&
    changes[0].status !== "deleted";
}

export function isPlanFilePath(path: string | undefined) {
  if (!path) return false;
  const parts = normalizeFileLookupPath(path).split("/").filter(Boolean);
  return parts.length >= 2 &&
    parts.at(-2) === "Plans" &&
    parts.at(-1)?.toLowerCase().endsWith(".md");
}

export function hasCompletedPlanStatus(file: FileItem | null | undefined) {
  const content = file?.proposedContent ?? file?.content ?? "";
  return /\bStatus:\s*Completed\b/i.test(content);
}

export function hasAcceptedCompletedPlanStatus(file: FileItem | null | undefined) {
  return /\bStatus:\s*Completed\b/i.test(file?.content ?? "");
}

export function formatSavedSubtitle(createdAt: string | undefined, now: number) {
  if (!createdAt) return FIXED_SAVED_SUBTITLE;
  const savedTime = new Date(createdAt).getTime();
  if (!Number.isFinite(savedTime)) return FIXED_SAVED_SUBTITLE;
  const elapsedSeconds = Math.max(
    0,
    Math.floor((now - savedTime) / 1000),
  );

  if (elapsedSeconds < 60) return "Saved a few seconds ago";
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) {
    return `Saved ${elapsedMinutes} minute${elapsedMinutes === 1 ? "" : "s"} ago`;
  }
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  return `Saved ${elapsedHours} hour${elapsedHours === 1 ? "" : "s"} ago`;
}
