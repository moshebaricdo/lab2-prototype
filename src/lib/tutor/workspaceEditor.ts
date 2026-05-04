import type { FileItem, FileKind } from "../../types/file";
import type { TutorValidatedChange } from "./types";
import { countChangedLines } from "./editValidator";

const NON_ROOT_WRAPPER_FOLDERS = new Set(["Plans"]);

export interface TutorWorkspaceFile {
  path: string;
  fileName: string;
  type: FileKind;
  content: string;
}

interface WorkspaceEntry extends TutorWorkspaceFile {
  originalContent?: string;
  originalType?: FileKind;
  existedInitially: boolean;
  deleted?: boolean;
}

function inferFileKind(path: string): FileKind {
  const extension = path.split(".").pop()?.toLowerCase();
  if (extension === "html" || extension === "htm") return "html";
  if (extension === "css") return "css";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico"].includes(extension ?? "")) return "image";
  if (extension === "txt" || extension === "md") return "text";
  return "file";
}

function effectiveContent(file: FileItem) {
  return file.proposedStatus && file.proposedStatus !== "deleted"
    ? file.proposedContent ?? ""
    : file.content ?? "";
}

function normalizePath(path: string) {
  const normalized = path
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^\.\//, "");
  const parts: string[] = [];
  for (const part of normalized.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") {
      throw new Error("Paths cannot traverse outside the project.");
    }
    parts.push(part);
  }
  if (parts.length === 0) {
    throw new Error("Path is required.");
  }
  return parts.join("/");
}

function fileNameFromPath(path: string) {
  return path.split("/").at(-1) ?? path;
}

function flattenProjectFiles(files: FileItem[], parentPath = ""): TutorWorkspaceFile[] {
  if (
    parentPath === "" &&
    files.length === 1 &&
    files[0].type === "folder" &&
    !NON_ROOT_WRAPPER_FOLDERS.has(files[0].name) &&
    files[0].children
  ) {
    return flattenProjectFiles(files[0].children);
  }

  return files.flatMap((file) => {
    const path = parentPath ? `${parentPath}/${file.name}` : file.name;
    if (file.children) {
      return flattenProjectFiles(file.children, path);
    }
    if (file.proposedStatus === "deleted") {
      return [];
    }
    return [{
      path,
      fileName: file.name,
      type: file.type,
      content: effectiveContent(file),
    }];
  });
}

export class TutorWorkspaceEditor {
  private entries = new Map<string, WorkspaceEntry>();
  private rootFolderName = "";

  constructor(files: FileItem[]) {
    if (
      files.length === 1 &&
      files[0].type === "folder" &&
      !NON_ROOT_WRAPPER_FOLDERS.has(files[0].name) &&
      files[0].children
    ) {
      this.rootFolderName = files[0].name;
    }
    for (const file of flattenProjectFiles(files)) {
      this.entries.set(file.path, {
        ...file,
        originalContent: file.content,
        originalType: file.type,
        existedInitially: true,
      });
    }
  }

  listFiles() {
    return Array.from(this.entries.values())
      .filter((file) => !file.deleted)
      .map(({ path, fileName, type }) => ({ path, fileName, type }))
      .sort((a, b) => a.path.localeCompare(b.path));
  }

  private resolvePath(path: string) {
    const normalized = normalizePath(path);
    if (this.entries.has(normalized)) {
      return normalized;
    }

    if (this.rootFolderName && normalized.startsWith(`${this.rootFolderName}/`)) {
      const withoutRoot = normalized.slice(this.rootFolderName.length + 1);
      if (this.entries.has(withoutRoot)) {
        return withoutRoot;
      }
    }

    const basename = fileNameFromPath(normalized);
    const matchingPaths = Array.from(this.entries.values())
      .filter((file) => !file.deleted && file.fileName === basename)
      .map((file) => file.path);
    if (matchingPaths.length === 1) {
      return matchingPaths[0];
    }

    return normalized;
  }

  readFile(path: string) {
    const normalized = this.resolvePath(path);
    const file = this.entries.get(normalized);
    if (!file || file.deleted) {
      throw new Error(`${normalized} does not exist.`);
    }
    return file.content;
  }

  createFile(path: string, content: string) {
    const requestedPath = normalizePath(path);
    const normalized =
      this.rootFolderName && requestedPath.startsWith(`${this.rootFolderName}/`)
        ? requestedPath.slice(this.rootFolderName.length + 1)
        : requestedPath;
    const existing = this.entries.get(normalized);
    if (existing && !existing.deleted) {
      throw new Error(`${normalized} already exists. Use replace_file to modify it.`);
    }

    this.entries.set(normalized, {
      path: normalized,
      fileName: fileNameFromPath(normalized),
      type: inferFileKind(normalized),
      content,
      existedInitially: Boolean(existing?.existedInitially),
      originalContent: existing?.originalContent,
      originalType: existing?.originalType,
      deleted: false,
    });
  }

  replaceFile(path: string, content: string) {
    const normalized = this.resolvePath(path);
    const existing = this.entries.get(normalized);
    if (!existing || existing.deleted) {
      throw new Error(`${normalized} does not exist. Use create_file to add it.`);
    }
    this.entries.set(normalized, {
      ...existing,
      content,
      deleted: false,
    });
  }

  patchFile(path: string, search: string, replace: string, replaceAll = false) {
    const current = this.readFile(path);
    if (!search) {
      throw new Error("Patch search text is required.");
    }
    const matchCount = current.split(search).length - 1;
    if (matchCount === 0) {
      throw new Error("Patch search text was not found exactly.");
    }
    if (matchCount > 1 && !replaceAll) {
      throw new Error(`Patch search text matched ${matchCount} times. Use replaceAll when every match should change.`);
    }
    const next = replaceAll ? current.split(search).join(replace) : current.replace(search, replace);
    this.replaceFile(path, next);
  }

  deleteFile(path: string) {
    const normalized = this.resolvePath(path);
    const existing = this.entries.get(normalized);
    if (!existing || existing.deleted) {
      throw new Error(`${normalized} does not exist.`);
    }
    this.entries.set(normalized, {
      ...existing,
      deleted: true,
    });
  }

  toFileItems(): FileItem[] {
    return Array.from(this.entries.values())
      .filter((file) => !file.deleted)
      .map((file) => ({
        name: file.path,
        type: file.type,
        content: file.content,
      }));
  }

  getChanges(): TutorValidatedChange[] {
    const changes: TutorValidatedChange[] = [];
    for (const entry of this.entries.values()) {
      if (entry.deleted) {
        if (entry.existedInitially) {
          changes.push({
            fileName: entry.path,
            status: "deleted",
            ...countChangedLines(entry.originalContent ?? "", ""),
          });
        }
        continue;
      }

      if (!entry.existedInitially) {
        changes.push({
          fileName: entry.path,
          status: "new",
          content: entry.content,
          ...countChangedLines("", entry.content),
        });
        continue;
      }

      if (entry.content !== (entry.originalContent ?? "")) {
        changes.push({
          fileName: entry.path,
          status: "modified",
          content: entry.content,
          ...countChangedLines(entry.originalContent ?? "", entry.content),
        });
      }
    }
    return changes;
  }
}

