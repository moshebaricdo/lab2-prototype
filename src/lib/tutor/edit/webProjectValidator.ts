import type { FileItem } from "../../../types/file";
import type { TutorValidatedChange, TutorValidationResult } from "../types";
import { validateTutorChanges } from "./editValidator";

const NON_ROOT_WRAPPER_FOLDERS = new Set(["Plans"]);

interface FlatFile {
  path: string;
  fileName: string;
  type: FileItem["type"];
  content: string;
}

function effectiveContent(file: FileItem) {
  return file.proposedStatus && file.proposedStatus !== "deleted"
    ? file.proposedContent ?? ""
    : file.content ?? "";
}

function flattenFiles(files: FileItem[], parentPath = ""): FlatFile[] {
  if (
    parentPath === "" &&
    files.length === 1 &&
    files[0].type === "folder" &&
    !NON_ROOT_WRAPPER_FOLDERS.has(files[0].name) &&
    files[0].children
  ) {
    return flattenFiles(files[0].children);
  }

  return files.flatMap((file) => {
    const path = parentPath ? `${parentPath}/${file.name}` : file.name;
    if (file.children) return flattenFiles(file.children, path);
    if (file.proposedStatus === "deleted") return [];
    return [{
      path,
      fileName: file.name,
      type: file.type,
      content: effectiveContent(file),
    }];
  });
}

function pathBasename(path: string) {
  return path.split("/").pop() ?? path;
}

function buildFinalFiles(files: FileItem[], changes: TutorValidatedChange[]) {
  const finalByPath = new Map(flattenFiles(files).map((file) => [file.path, file]));
  const originalByName = new Map(Array.from(finalByPath.values()).map((file) => [file.fileName, file]));

  for (const change of changes) {
    const original = finalByPath.get(change.fileName) ?? originalByName.get(change.fileName);
    const path = original?.path ?? change.fileName;
    if (change.status === "deleted") {
      finalByPath.delete(path);
      continue;
    }
    if (typeof change.content === "string") {
      finalByPath.set(path, {
        path,
        fileName: pathBasename(path),
        type: original?.type ?? (/\.html?$/i.test(path) ? "html" : /\.css$/i.test(path) ? "css" : "file"),
        content: change.content,
      });
    }
  }

  return Array.from(finalByPath.values());
}

function cssBraceErrors(file: FlatFile) {
  const withoutComments = file.content.replace(/\/\*[\s\S]*?\*\//g, "");
  let depth = 0;
  for (const char of withoutComments) {
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth < 0) {
      return [`${file.fileName}: CSS has an unmatched closing brace.`];
    }
  }
  return depth === 0 ? [] : [`${file.fileName}: CSS has ${depth} unmatched opening brace${depth === 1 ? "" : "s"}.`];
}

function duplicateIdErrors(file: FlatFile) {
  const ids = file.content.match(/\bid\s*=\s*["']([^"']+)["']/gi) ?? [];
  const seen = new Set<string>();
  const duplicateIds = new Set<string>();
  for (const rawId of ids) {
    const id = rawId.match(/["']([^"']+)["']/)?.[1];
    if (!id) continue;
    if (seen.has(id)) duplicateIds.add(id);
    seen.add(id);
  }
  return Array.from(duplicateIds).map((id) => `${file.fileName}: duplicate id "${id}" appears more than once.`);
}

function javascriptParseErrors(file: FlatFile) {
  if (/\b(import|export)\b/.test(file.content)) {
    return [];
  }
  try {
    // This catches syntax errors for simple browser scripts without executing them.
    new Function(file.content);
    return [];
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown parse error";
    return [`${file.fileName}: JavaScript syntax check failed (${message}).`];
  }
}

export function validateWebProjectChanges({
  files,
  changes,
  requestMessage,
  responseMessage,
  saveTitle,
}: {
  files: FileItem[];
  changes: TutorValidatedChange[];
  requestMessage: string;
  responseMessage: string;
  saveTitle?: string;
}): TutorValidationResult {
  const baseValidation = validateTutorChanges(
    changes.map(({ fileName, status, content }) => ({ fileName, status, content })),
    files,
    requestMessage,
    responseMessage,
    saveTitle,
  );

  if ("errors" in baseValidation) {
    return baseValidation;
  }

  const finalFiles = buildFinalFiles(files, baseValidation.changes);
  const errors = finalFiles.flatMap((file) => {
    if (/\.css$/i.test(file.fileName)) return cssBraceErrors(file);
    if (/\.html?$/i.test(file.fileName)) return duplicateIdErrors(file);
    if (/\.m?js$/i.test(file.fileName)) return javascriptParseErrors(file);
    return [];
  });

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return baseValidation;
}
