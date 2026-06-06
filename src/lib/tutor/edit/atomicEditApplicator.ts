import type { FileItem } from "../../../types/file";
import type { TutorStructuredEdit, TutorValidatedChange } from "../types";
import { TutorWorkspaceEditor } from "./workspaceEditor";

export type AtomicEditApplyResult =
  | {
      ok: true;
      workspace: TutorWorkspaceEditor;
      changes: TutorValidatedChange[];
    }
  | {
      ok: false;
      errors: string[];
    };

function ensureString(value: unknown, label: string) {
  if (typeof value !== "string") {
    throw new Error(`${label} must be a string.`);
  }
  return value;
}

function hasFile(workspace: TutorWorkspaceEditor, path: string) {
  try {
    workspace.readFile(path);
    return true;
  } catch {
    return false;
  }
}

function applyStructuredEdit(workspace: TutorWorkspaceEditor, edit: TutorStructuredEdit, index: number) {
  if (!edit || typeof edit !== "object") {
    throw new Error(`Edit ${index + 1}: edit must be an object.`);
  }
  const path = ensureString(edit.path, `Edit ${index + 1}: path`).trim();
  if (!path) {
    throw new Error(`Edit ${index + 1}: path is required.`);
  }

  if (edit.strategy === "delete") {
    workspace.deleteFile(path);
    return;
  }

  if (edit.strategy === "replace") {
    const content = ensureString(edit.content, `${path}: content`);
    if (!content.trim()) {
      throw new Error(`${path}: replacement content cannot be empty.`);
    }
    if (hasFile(workspace, path)) {
      const before = workspace.readFile(path);
      if (before === content) {
        throw new Error(`${path}: replacement does not change the file.`);
      }
      workspace.replaceFile(path, content);
    } else {
      workspace.createFile(path, content);
    }
    return;
  }

  if (edit.strategy === "searchReplace") {
    if (!Array.isArray(edit.replacements) || edit.replacements.length === 0) {
      throw new Error(`${path}: searchReplace edits require at least one replacement.`);
    }
    for (const [replacementIndex, replacement] of edit.replacements.entries()) {
      const search = ensureString(replacement.search, `${path}: replacement ${replacementIndex + 1} search`);
      const replace = ensureString(replacement.replace, `${path}: replacement ${replacementIndex + 1} replace`);
      if (search === replace) {
        throw new Error(`${path}: replacement ${replacementIndex + 1} does not change anything.`);
      }
      workspace.patchFile(path, search, replace, Boolean(replacement.replaceAll));
    }
    return;
  }

  throw new Error(`${path}: unsupported edit strategy "${String(edit.strategy)}".`);
}

export function applyStructuredEditsAtomically(
  files: FileItem[],
  edits: TutorStructuredEdit[],
): AtomicEditApplyResult {
  if (!Array.isArray(edits)) {
    return { ok: false, errors: ["Structured edit response must include an edits array."] };
  }

  if (edits.length === 0) {
    return { ok: false, errors: ["Structured edit response did not include any file edits."] };
  }

  const workspace = new TutorWorkspaceEditor(files);
  const errors: string[] = [];

  for (const [index, edit] of edits.entries()) {
    try {
      applyStructuredEdit(workspace, edit, index);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : `Edit ${index + 1} failed.`);
      break;
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const changes = workspace.getChanges();
  if (changes.length === 0) {
    return { ok: false, errors: ["Structured edits applied successfully but produced no file changes."] };
  }

  return {
    ok: true,
    workspace,
    changes,
  };
}
