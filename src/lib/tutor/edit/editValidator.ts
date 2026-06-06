import type { FileItem } from "../../../types/file";
import type {
  TutorPatchChange,
  TutorPatchEdit,
  TutorPatchResponse,
  TutorValidatedChange,
  TutorValidationResult,
} from "../types";
import { normalizeTutorSaveTitle } from "./saveTitle";

interface FlatFile {
  fileName: string;
  path: string;
  type: FileItem["type"];
  content: string;
}

const PLACEHOLDER_PATTERN =
  /(\.\.\.|…)\s*(rest|remaining|same)|rest of (the )?(code|file)|unchanged|same as before|omitted for brevity/i;
const INTERACTIVE_REQUEST_PATTERN =
  /\b(click|clickable|tap|select|selected|javascript|\bjs\b|event listener|dynamic|toggl\w*|open\w*|clos\w*|show\w*|hid\w*|dropdown|modal|submit|filter|sort)\b|update\s+(the\s+)?\w+\s+when/i;
const REQUIRES_NEW_BEHAVIOR_PATTERN =
  /\b(click|clickable|tap|select|selected|javascript|\bjs\b|event listener|dynamic|toggl\w*|dropdown|modal|submit|filter|sort)\b|\b(add|create|make|wire|implement)\b.{0,50}\b(open|close|show|hide|toggle|update)\b/i;
const STYLE_POLISH_REQUEST_PATTERN =
  /\b(css|stylesheet|style|styles|polish|visual|hover\w*|focus-visible|focus|visited|underline|transition|animate|animation|font|spacing|contrast)\b/i;
const EDIT_REQUEST_PATTERN =
  /\b(add|adjust|change|create|delete|edit|fix|hook up|implement|make|modify|move|remove|replace|resize|restyle|style|turn|update|wire)\b|sidebar|side\s*bar|layout|panel|button|clickable|interactive|responsive|mobile|menu/i;
const JAVASCRIPT_SIGNAL_PATTERN =
  /<script\b|addEventListener|onclick\s*=|querySelector|getElementById|dataset|classList|function\s+\w+\s*\(|=>/i;
const JAVASCRIPT_SIGNAL_COUNT_PATTERN =
  /<script\b|addEventListener|onclick\s*=|querySelector|getElementById|dataset|classList|function\s+\w+\s*\(|=>/gi;

function getEffectiveFileContent(file: FileItem) {
  return file.proposedStatus && file.proposedStatus !== "deleted"
    ? file.proposedContent ?? ""
    : file.content ?? "";
}

function flattenFiles(files: FileItem[], parentPath = ""): FlatFile[] {
  return files.flatMap((item) => {
    const path = parentPath ? `${parentPath}/${item.name}` : item.name;
    if (item.children) {
      return flattenFiles(item.children, path);
    }
    if (item.proposedStatus === "deleted") {
      return [];
    }
    return [{
      fileName: item.name,
      path,
      type: item.type,
      content: getEffectiveFileContent(item),
    }];
  });
}

function countOccurrences(content: string, search: string) {
  if (!search) return 0;
  let count = 0;
  let index = content.indexOf(search);
  while (index !== -1) {
    count += 1;
    index = content.indexOf(search, index + search.length);
  }
  return count;
}

function splitDiffLines(content: string) {
  if (!content) return [];
  const withoutTerminalNewline = content.endsWith("\n")
    ? content.slice(0, -1)
    : content;
  return withoutTerminalNewline ? withoutTerminalNewline.split("\n") : [];
}

function longestCommonSubsequenceLength(beforeLines: string[], afterLines: string[]) {
  let previous = new Array(afterLines.length + 1).fill(0);
  let current = new Array(afterLines.length + 1).fill(0);

  for (let beforeIndex = 0; beforeIndex < beforeLines.length; beforeIndex += 1) {
    for (let afterIndex = 0; afterIndex < afterLines.length; afterIndex += 1) {
      current[afterIndex + 1] = beforeLines[beforeIndex] === afterLines[afterIndex]
        ? previous[afterIndex] + 1
        : Math.max(previous[afterIndex + 1], current[afterIndex]);
    }
    const nextPrevious = current;
    current = previous;
    previous = nextPrevious;
    current.fill(0);
  }

  return previous[afterLines.length];
}

export function countChangedLines(before = "", after = "") {
  const originalBeforeLines = splitDiffLines(before);
  const originalAfterLines = splitDiffLines(after);
  let start = 0;

  while (
    start < originalBeforeLines.length &&
    start < originalAfterLines.length &&
    originalBeforeLines[start] === originalAfterLines[start]
  ) {
    start += 1;
  }

  let beforeEnd = originalBeforeLines.length;
  let afterEnd = originalAfterLines.length;
  while (
    beforeEnd > start &&
    afterEnd > start &&
    originalBeforeLines[beforeEnd - 1] === originalAfterLines[afterEnd - 1]
  ) {
    beforeEnd -= 1;
    afterEnd -= 1;
  }

  const beforeLines = originalBeforeLines.slice(start, beforeEnd);
  const afterLines = originalAfterLines.slice(start, afterEnd);
  const unchangedLines = longestCommonSubsequenceLength(beforeLines, afterLines);

  return {
    linesAdded: afterLines.length - unchangedLines,
    linesRemoved: beforeLines.length - unchangedLines,
  };
}

function hasPlaceholderContent(content = "") {
  return PLACEHOLDER_PATTERN.test(content);
}

function countPattern(content: string, pattern: RegExp) {
  return content.match(pattern)?.length ?? 0;
}

function isJavaScriptFile(fileName: string) {
  return /\.m?js$/i.test(fileName);
}

function isHtmlFile(fileName: string) {
  return /\.html?$/i.test(fileName);
}

function isCssFile(fileName: string) {
  return /\.css$/i.test(fileName);
}

function pathBasename(path: string) {
  const normalized = path.split("?")[0].split("#")[0];
  const parts = normalized.split("/");
  return parts[parts.length - 1] ?? normalized;
}

function htmlReferencesScript(html: string, scriptFileName: string) {
  const scriptName = pathBasename(scriptFileName);
  const scriptSrcPattern = /<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let match = scriptSrcPattern.exec(html);
  while (match) {
    const src = match[1];
    if (src === scriptFileName || pathBasename(src) === scriptName) {
      return true;
    }
    match = scriptSrcPattern.exec(html);
  }
  return false;
}

function dirname(path: string) {
  const parts = path.split("/");
  parts.pop();
  return parts.join("/");
}

function normalizeReferencePath(reference: string, fromPath: string) {
  const cleaned = reference.split("?")[0].split("#")[0].replace(/^\.\//, "");
  if (!cleaned || /^(https?:|mailto:|tel:|data:|blob:|#)/i.test(reference)) {
    return "";
  }
  if (cleaned.startsWith("/")) {
    return cleaned.replace(/^\/+/, "");
  }
  const base = dirname(fromPath);
  return base ? `${base}/${cleaned}` : cleaned;
}

function referenceExists(
  reference: string,
  fromPath: string,
  finalFiles: ReturnType<typeof buildFinalFiles>,
) {
  const normalized = normalizeReferencePath(reference, fromPath);
  if (!normalized) return true;
  return finalFiles.byPath.has(normalized) || finalFiles.byName.has(pathBasename(normalized));
}

function getScriptSrcs(html: string) {
  const srcs: string[] = [];
  const pattern = /<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let match = pattern.exec(html);
  while (match) {
    srcs.push(match[1]);
    match = pattern.exec(html);
  }
  return srcs;
}

function getStylesheetHrefs(html: string) {
  const hrefs: string[] = [];
  const pattern = /<link\b(?=[^>]*\brel\s*=\s*["']stylesheet["'])(?=[^>]*\bhref\s*=\s*["']([^"']+)["'])[^>]*>/gi;
  let match = pattern.exec(html);
  while (match) {
    hrefs.push(match[1]);
    match = pattern.exec(html);
  }
  return hrefs;
}

function buildFinalFiles(
  changes: TutorValidatedChange[],
  files: ReturnType<typeof buildFileMaps>,
) {
  const byPath = new Map(files.flatFiles.map((file) => [file.path, { ...file }]));
  for (const change of changes) {
    const existing = files.byPath.get(change.fileName) ?? files.byName.get(change.fileName);
    const path = existing?.path ?? change.fileName;
    if (change.status === "deleted") {
      byPath.delete(path);
    } else if (typeof change.content === "string") {
      byPath.set(path, {
        fileName: pathBasename(path),
        path,
        type: existing?.type ?? (isHtmlFile(path) ? "html" : isJavaScriptFile(path) ? "file" : "file"),
        content: change.content,
      });
    }
  }
  const values = Array.from(byPath.values());
  return {
    files: values,
    byPath,
    byName: new Map(values.map((file) => [file.fileName, file])),
  };
}

function hasJavaScriptBehaviorChange(
  change: TutorValidatedChange,
  files: ReturnType<typeof buildFileMaps>,
) {
  if (change.status === "deleted" || typeof change.content !== "string") {
    return false;
  }

  if (change.status === "new") {
    return isJavaScriptFile(change.fileName) || JAVASCRIPT_SIGNAL_PATTERN.test(change.content);
  }

  const before = files.byName.get(change.fileName)?.content ?? files.byPath.get(change.fileName)?.content ?? "";
  if (isJavaScriptFile(change.fileName) && change.content !== before) {
    return true;
  }

  return (
    JAVASCRIPT_SIGNAL_PATTERN.test(change.content) &&
    countPattern(change.content, JAVASCRIPT_SIGNAL_COUNT_PATTERN) >
      countPattern(before, JAVASCRIPT_SIGNAL_COUNT_PATTERN)
  );
}

function hasCssChange(change: TutorValidatedChange) {
  return change.status !== "deleted" &&
    typeof change.content === "string" &&
    isCssFile(change.fileName);
}

function buildFileMaps(files: FileItem[]) {
  const flatFiles = flattenFiles(files).filter((file) => file.type !== "image");
  const byName = new Map(flatFiles.map((file) => [file.fileName, file]));
  const byPath = new Map(flatFiles.map((file) => [file.path, file]));
  return { flatFiles, byName, byPath };
}

function findExistingFile(change: TutorPatchChange, files: ReturnType<typeof buildFileMaps>) {
  return files.byPath.get(change.fileName) ?? files.byName.get(change.fileName);
}

function applyPatchEdits(before: string, edits: TutorPatchEdit[], fileName: string) {
  const errors: string[] = [];
  let next = before;

  edits.forEach((edit, index) => {
    if (!edit || typeof edit.search !== "string" || typeof edit.replace !== "string") {
      errors.push(`${fileName}: edit ${index + 1} must include string search and replace values.`);
      return;
    }

    if (!edit.search) {
      errors.push(`${fileName}: edit ${index + 1} has an empty search string.`);
      return;
    }

    if (edit.search === edit.replace) {
      errors.push(`${fileName}: edit ${index + 1} does not change anything.`);
      return;
    }

    const matches = countOccurrences(next, edit.search);
    if (matches === 0) {
      errors.push(`${fileName}: edit ${index + 1} search text was not found exactly.`);
      return;
    }

    if (matches > 1 && !edit.replaceAll) {
      errors.push(`${fileName}: edit ${index + 1} search text matched ${matches} times; make it more specific.`);
      return;
    }

    if (hasPlaceholderContent(edit.replace)) {
      errors.push(`${fileName}: edit ${index + 1} replacement contains placeholder or abbreviated code.`);
      return;
    }

    next = edit.replaceAll
      ? next.split(edit.search).join(edit.replace)
      : next.replace(edit.search, edit.replace);
  });

  return { content: next, errors };
}

function validateLandmarks(fileName: string, before: string, after: string) {
  const errors: string[] = [];
  const requiredPatterns = [
    { label: "doctype/html structure", pattern: /<!doctype|<html/i },
    { label: "body", pattern: /<body/i },
    { label: "main layout", pattern: /<main\b/i },
  ];

  for (const { label, pattern } of requiredPatterns) {
    if (pattern.test(before) && !pattern.test(after)) {
      errors.push(`${fileName}: proposed edit removed existing ${label}.`);
    }
  }

  const beforeLength = before.trim().length;
  const afterLength = after.trim().length;
  if (beforeLength > 400 && afterLength < beforeLength * 0.65) {
    errors.push(`${fileName}: proposed edit shrank the file suspiciously (${beforeLength} -> ${afterLength} chars).`);
  }

  if (hasPlaceholderContent(after)) {
    errors.push(`${fileName}: proposed content contains placeholder or abbreviated code.`);
  }

  return errors;
}

function validateFullContentChange(fileName: string, before: string, after: string) {
  const errors: string[] = [];

  if (!after.trim()) {
    errors.push(`${fileName}: modified file content cannot be empty.`);
  }

  errors.push(...validateLandmarks(fileName, before, after));

  const beforeLines = before.split("\n").length;
  const afterLines = after.split("\n").length;
  if (beforeLines > 40 && afterLines < beforeLines * 0.5) {
    errors.push(`${fileName}: full-file edit removed too many lines (${beforeLines} -> ${afterLines}).`);
  }

  return errors;
}

function validateRequestIntent(
  requestMessage: string,
  responseMessage: string | undefined,
  changes: TutorValidatedChange[],
  files: ReturnType<typeof buildFileMaps>,
) {
  const errors: string[] = [];
  const asksForInteractivity = REQUIRES_NEW_BEHAVIOR_PATTERN.test(requestMessage);
  const responseMentionsInteractivity = INTERACTIVE_REQUEST_PATTERN.test(responseMessage ?? "");
  const asksForStylePolish = STYLE_POLISH_REQUEST_PATTERN.test(requestMessage) && !asksForInteractivity;

  if (EDIT_REQUEST_PATTERN.test(requestMessage) && changes.length === 0) {
    errors.push("Request asks for a project edit, but the scratch workspace has no file changes.");
  }

  if (
    asksForInteractivity &&
    !changes.some((change) => hasJavaScriptBehaviorChange(change, files))
  ) {
    errors.push("Request asks for clickable or dynamic behavior, but the proposed changes do not add JavaScript or event handling.");
  }

  if (
    asksForStylePolish &&
    changes.some((change) => hasJavaScriptBehaviorChange(change, files))
  ) {
    errors.push("Request is for CSS/style polish, so the proposal should not add JavaScript behavior. Use the stylesheet for hover, focus, visited, transition, and animation polish unless the student explicitly asks for dynamic behavior.");
  }

  if (
    asksForStylePolish &&
    changes.length > 0 &&
    !changes.some(hasCssChange)
  ) {
    errors.push("Request is for CSS/style polish, but the proposed changes do not modify a stylesheet.");
  }

  if (asksForInteractivity || responseMentionsInteractivity) {
    const finalFiles = buildFinalFiles(changes, files);
    const finalHtmlFiles = finalFiles.files.filter((file) => isHtmlFile(file.fileName));
    const changedJavaScriptFiles = changes
      .filter((change) =>
        change.status !== "deleted" &&
        typeof change.content === "string" &&
        isJavaScriptFile(change.fileName) &&
        hasJavaScriptBehaviorChange(change, files)
      );

    for (const change of changedJavaScriptFiles) {
      if (!finalHtmlFiles.some((file) => htmlReferencesScript(file.content, change.fileName))) {
        errors.push(`${change.fileName}: JavaScript behavior was added, but no HTML file references it with a script src, so it will not run in preview.`);
      }
    }
  }

  const finalFiles = buildFinalFiles(changes, files);
  for (const htmlFile of finalFiles.files.filter((file) => isHtmlFile(file.fileName))) {
    for (const scriptSrc of getScriptSrcs(htmlFile.content)) {
      if (!referenceExists(scriptSrc, htmlFile.path, finalFiles)) {
        errors.push(`${htmlFile.fileName}: script reference "${scriptSrc}" does not resolve to a project file.`);
      }
    }
    for (const stylesheetHref of getStylesheetHrefs(htmlFile.content)) {
      if (!referenceExists(stylesheetHref, htmlFile.path, finalFiles)) {
        errors.push(`${htmlFile.fileName}: stylesheet reference "${stylesheetHref}" does not resolve to a project file.`);
      }
    }
  }

  return errors;
}

export function validationSummary(errors: string[]) {
  if (errors.length === 0) return "No validation errors.";
  return errors.slice(0, 3).join(" ");
}

export function validateTutorPatchResponse(
  raw: unknown,
  files: FileItem[],
  requestMessage = "",
): TutorValidationResult {
  const parsed = raw as TutorPatchResponse;
  const fileMaps = buildFileMaps(files);
  const errors: string[] = [];

  if (!parsed || typeof parsed !== "object") {
    return { ok: false, errors: ["Response must be a JSON object."] };
  }

  if (!Array.isArray(parsed.changes)) {
    return { ok: false, errors: ["Response must include a changes array."] };
  }

  const validatedChanges: TutorValidatedChange[] = [];

  parsed.changes.forEach((change, index) => {
    if (!change || typeof change.fileName !== "string") {
      errors.push(`Change ${index + 1}: fileName is required.`);
      return;
    }

    if (change.status !== "new" && change.status !== "modified" && change.status !== "deleted") {
      errors.push(`${change.fileName}: status must be new, modified, or deleted.`);
      return;
    }

    const existing = findExistingFile(change, fileMaps);

    if (change.status === "new") {
      if (existing) {
        errors.push(`${change.fileName}: status is new but file already exists; use modified edits.`);
        return;
      }
      if (typeof change.content !== "string" || !change.content.trim()) {
        errors.push(`${change.fileName}: new files must include full content.`);
        return;
      }
      if (hasPlaceholderContent(change.content)) {
        errors.push(`${change.fileName}: new file content contains placeholder or abbreviated code.`);
        return;
      }
      validatedChanges.push({
        fileName: change.fileName,
        status: "new",
        content: change.content,
        ...countChangedLines("", change.content),
      });
      return;
    }

    if (!existing) {
      errors.push(`${change.fileName}: file does not exist.`);
      return;
    }
    const validatedFileName = change.fileName.includes("/") ? existing.path : existing.fileName;

    if (change.status === "deleted") {
      validatedChanges.push({
        fileName: validatedFileName,
        status: "deleted",
        ...countChangedLines(existing.content, ""),
      });
      return;
    }

    if (!Array.isArray(change.edits) || change.edits.length === 0) {
      if (typeof change.content !== "string") {
        errors.push(`${change.fileName}: modified existing files must include exact edits or complete full-file content.`);
        return;
      }

      const fullContentErrors = validateFullContentChange(
        existing.fileName,
        existing.content,
        change.content,
      );
      if (fullContentErrors.length > 0) {
        errors.push(...fullContentErrors);
        return;
      }

      validatedChanges.push({
        fileName: validatedFileName,
        status: "modified",
        content: change.content,
        ...countChangedLines(existing.content, change.content),
      });
      return;
    }

    const applied = applyPatchEdits(existing.content, change.edits, existing.fileName);
    errors.push(...applied.errors);
    if (applied.errors.length > 0) return;

    if (applied.content === existing.content) {
      errors.push(`${existing.fileName}: edits did not change the file.`);
      return;
    }

    const landmarkErrors = validateLandmarks(existing.fileName, existing.content, applied.content);
    if (landmarkErrors.length > 0) {
      errors.push(...landmarkErrors);
      return;
    }

    validatedChanges.push({
      fileName: validatedFileName,
      status: "modified",
      content: applied.content,
      ...countChangedLines(existing.content, applied.content),
    });
  });

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const intentErrors = validateRequestIntent(
    requestMessage,
    parsed.message,
    validatedChanges,
    fileMaps,
  );
  if (intentErrors.length > 0) {
    return { ok: false, errors: intentErrors };
  }

  return {
    ok: true,
    message: typeof parsed.message === "string" && parsed.message.trim()
      ? parsed.message
      : "I made a set of project edits for you to review. Take a look at the diffs and decide whether you want to keep them.",
    saveTitle: normalizeTutorSaveTitle(parsed.saveTitle ?? parsed.message),
    changes: validatedChanges.filter((change) =>
      change.status !== "modified" || change.linesAdded || change.linesRemoved,
    ),
  };
}

export function validateTutorChanges(
  changes: TutorPatchChange[],
  files: FileItem[],
  requestMessage = "",
  responseMessage = "I made a set of project edits for you to review. Take a look at the diffs and decide whether you want to keep them.",
  saveTitle?: string,
) {
  return validateTutorPatchResponse(
    {
      message: responseMessage,
      saveTitle,
      changes,
    },
    files,
    requestMessage,
  );
}
