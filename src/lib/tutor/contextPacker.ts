import type { ProjectAnalysis, AnalyzedProjectFile } from "./projectAnalyzer";

export interface PackedContextFile {
  path: string;
  type: AnalyzedProjectFile["type"];
  mode: "full" | "snippets" | "preview";
  content?: string;
  snippets?: Array<{
    label: string;
    startLine: number;
    endLine: number;
    content: string;
  }>;
  omittedChars?: number;
}

export interface PackedTutorContext {
  budgetChars: number;
  usedChars: number;
  manifest: string;
  projectMap: {
    html: ProjectAnalysis["html"];
    css: ProjectAnalysis["css"];
    js: ProjectAnalysis["js"];
    linkedFiles: ProjectAnalysis["linkedFiles"];
  };
  files: PackedContextFile[];
}

const DEFAULT_CONTEXT_BUDGET_CHARS = 22000;
const FULL_FILE_LIMIT_CHARS = 6500;
const SNIPPET_RADIUS_LINES = 18;
const MAX_SNIPPETS_PER_FILE = 5;

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function requestTerms(message: string) {
  return unique(
    message
      .toLowerCase()
      .replace(/[^a-z0-9_#.\-\s]/g, " ")
      .split(/\s+/)
      .filter((term) => term.length >= 4),
  );
}

function getLineStartOffsets(content: string) {
  const offsets = [0];
  for (let index = 0; index < content.length; index += 1) {
    if (content[index] === "\n") {
      offsets.push(index + 1);
    }
  }
  return offsets;
}

function lineNumberForIndex(offsets: number[], index: number) {
  let low = 0;
  let high = offsets.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (offsets[mid] <= index) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return Math.max(1, high + 1);
}

function sliceLines(content: string, startLine: number, endLine: number) {
  return content.split("\n").slice(startLine - 1, endLine).join("\n");
}

function scoreFile(file: AnalyzedProjectFile, message: string, terms: string[]) {
  const lowerPath = file.path.toLowerCase();
  const lowerContent = file.content.toLowerCase();
  let score = 0;

  for (const term of terms) {
    if (lowerPath.includes(term)) score += 6;
    if (lowerContent.includes(term)) score += 2;
  }

  if (/\.html?$/i.test(file.fileName)) score += 10;
  if (/\.css$/i.test(file.fileName) && /\b(style|layout|responsive|mobile|color|spacing|panel|sidebar|menu)\b/i.test(message)) {
    score += 12;
  }
  if (/\.m?js$/i.test(file.fileName) && /\b(click|toggle|open|close|show|hide|interactive|dynamic|menu|button|javascript|js)\b/i.test(message)) {
    score += 12;
  }

  return score;
}

function buildSnippets(file: AnalyzedProjectFile, message: string, terms: string[]) {
  const offsets = getLineStartOffsets(file.content);
  const lowerContent = file.content.toLowerCase();
  const anchors = unique([
    ...terms,
    ...(/menu|hamburger|nav/i.test(message) ? ["menu", "sidebar", "nav", "button"] : []),
    ...(/responsive|mobile|layout|screen|viewport/i.test(message) ? ["resize", "canvas", "panel", "sidebar", "app"] : []),
    ...(/click|toggle|open|close|show|hide|interactive/i.test(message) ? ["addeventlistener", "onclick", "queryselector", "getelementbyid", "classlist"] : []),
    "boot",
  ]);

  const lineWindows: Array<{ label: string; startLine: number; endLine: number }> = [];
  for (const anchor of anchors) {
    const index = lowerContent.indexOf(anchor.toLowerCase());
    if (index === -1) continue;
    const line = lineNumberForIndex(offsets, index);
    const startLine = Math.max(1, line - SNIPPET_RADIUS_LINES);
    const endLine = Math.min(file.lineCount, line + SNIPPET_RADIUS_LINES);
    if (lineWindows.some((window) => startLine <= window.endLine && endLine >= window.startLine)) {
      continue;
    }
    lineWindows.push({ label: `around "${anchor}"`, startLine, endLine });
    if (lineWindows.length >= MAX_SNIPPETS_PER_FILE) break;
  }

  if (lineWindows.length === 0) {
    lineWindows.push({
      label: "file start",
      startLine: 1,
      endLine: Math.min(file.lineCount, SNIPPET_RADIUS_LINES * 2),
    });
  }

  return lineWindows.map((window) => ({
    ...window,
    content: sliceLines(file.content, window.startLine, window.endLine),
  }));
}

function packedSize(file: PackedContextFile) {
  return JSON.stringify(file).length;
}

export function packTutorContext(
  analysis: ProjectAnalysis,
  message: string,
  budgetChars = DEFAULT_CONTEXT_BUDGET_CHARS,
): PackedTutorContext {
  const terms = requestTerms(message);
  const filesByPriority = [...analysis.files]
    .sort((a, b) => scoreFile(b, message, terms) - scoreFile(a, message, terms));
  const packedFiles: PackedContextFile[] = [];
  let usedChars = analysis.manifestSummary.length + JSON.stringify({
    html: analysis.html,
    css: analysis.css,
    js: analysis.js,
    linkedFiles: analysis.linkedFiles,
  }).length;

  for (const file of filesByPriority) {
    const fullFile: PackedContextFile = {
      path: file.path,
      type: file.type,
      mode: "full",
      content: file.content,
    };
    const snippets = buildSnippets(file, message, terms);
    const snippetFile: PackedContextFile = {
      path: file.path,
      type: file.type,
      mode: "snippets",
      snippets,
      omittedChars: Math.max(0, file.size - snippets.reduce((sum, snippet) => sum + snippet.content.length, 0)),
    };
    const previewFile: PackedContextFile = {
      path: file.path,
      type: file.type,
      mode: "preview",
      content: file.content.slice(0, Math.min(1600, file.content.length)),
      omittedChars: Math.max(0, file.content.length - 1600),
    };

    const candidate = file.size <= FULL_FILE_LIMIT_CHARS ? fullFile : snippetFile;
    let size = packedSize(candidate);
    if (usedChars + size > budgetChars) {
      size = packedSize(previewFile);
      if (usedChars + size > budgetChars) {
        continue;
      }
      packedFiles.push(previewFile);
      usedChars += size;
      continue;
    }
    packedFiles.push(candidate);
    usedChars += size;
  }

  return {
    budgetChars,
    usedChars,
    manifest: analysis.manifestSummary,
    projectMap: {
      html: analysis.html,
      css: analysis.css,
      js: analysis.js,
      linkedFiles: analysis.linkedFiles,
    },
    files: packedFiles,
  };
}
