import type { FileItem } from "../../types/file";
import { findFileEntryInTree, findFirstFile } from "../../utils/fileTree";

export const INITIAL_OPEN_FILES_DEV_KEY = "initialOpenFiles";

export type InitialOpenFilesProp = string | readonly string[];

export function formatInitialOpenFilesProp(value?: InitialOpenFilesProp): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.map((path) => path.trim()).filter(Boolean).join("\n");
}

export function parseInitialOpenFilesConfig(value: unknown): string[] {
  if (typeof value !== "string") return [];

  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

export function isOpenableWorkspaceFile(file: FileItem): boolean {
  return file.proposedStatus !== "deleted";
}

export function resolveInitialOpenFiles(
  tree: FileItem[],
  paths: string[],
): { openFiles: FileItem[]; selectedFile: FileItem | null } {
  const openFiles: FileItem[] = [];
  const seenNames = new Set<string>();

  for (const path of paths) {
    const entry = findFileEntryInTree(tree, path);
    if (!entry || !isOpenableWorkspaceFile(entry.file)) continue;
    if (seenNames.has(entry.file.name)) continue;

    seenNames.add(entry.file.name);
    openFiles.push(entry.file);
  }

  return {
    openFiles,
    selectedFile: openFiles[0] ?? null,
  };
}

export function resolveOpenFilesForTree(
  tree: FileItem[],
  options: {
    initialOpenFilePaths?: string[];
    fallback?: (tree: FileItem[]) => FileItem | null;
  } = {},
): { openFiles: FileItem[]; selectedFile: FileItem | null } {
  if (options.initialOpenFilePaths?.length) {
    const resolved = resolveInitialOpenFiles(tree, options.initialOpenFilePaths);
    if (resolved.openFiles.length > 0) return resolved;
  }

  const fallbackFile = options.fallback?.(tree) ?? null;
  return {
    openFiles: fallbackFile ? [fallbackFile] : [],
    selectedFile: fallbackFile,
  };
}

export function resolveDefaultOpenFile(tree: FileItem[]): FileItem | null {
  const indexHtml = findFileEntryInTree(tree, "index.html")?.file ?? null;
  return indexHtml ?? findFirstFile(tree);
}
