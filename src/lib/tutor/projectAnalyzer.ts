import type { FileItem } from "../../types/file";

const NON_ROOT_WRAPPER_FOLDERS = new Set(["Plans"]);

export interface AnalyzedProjectFile {
  path: string;
  fileName: string;
  type: FileItem["type"];
  extension: string;
  size: number;
  lineCount: number;
  content: string;
  summary: string;
}

export interface HtmlProjectInfo {
  path: string;
  ids: string[];
  classes: string[];
  scriptSrcs: string[];
  stylesheetHrefs: string[];
}

export interface CssProjectInfo {
  path: string;
  selectors: string[];
}

export interface JsProjectInfo {
  path: string;
  domRefs: string[];
  functions: string[];
  eventHandlers: string[];
}

export interface PythonProjectInfo {
  path: string;
  imports: string[];
  functions: string[];
  classes: string[];
}

export interface ProjectAnalysis {
  files: AnalyzedProjectFile[];
  html: HtmlProjectInfo[];
  css: CssProjectInfo[];
  js: JsProjectInfo[];
  python: PythonProjectInfo[];
  linkedFiles: Array<{
    htmlPath: string;
    scripts: string[];
    stylesheets: string[];
  }>;
  manifestSummary: string;
}

function effectiveContent(file: FileItem) {
  return file.proposedStatus && file.proposedStatus !== "deleted"
    ? file.proposedContent ?? ""
    : file.content ?? "";
}

function flattenProjectFiles(files: FileItem[], parentPath = ""): AnalyzedProjectFile[] {
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
    if (file.proposedStatus === "deleted" || file.type === "image") {
      return [];
    }
    const content = effectiveContent(file);
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const lineCount = content ? content.split("\n").length : 0;
    return [{
      path,
      fileName: file.name,
      type: file.type,
      extension,
      size: content.length,
      lineCount,
      content,
      summary: `${path} (${file.type}, ${content.length} chars, ${lineCount} lines)`,
    }];
  });
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function matchAll(content: string, pattern: RegExp, groupIndex = 1) {
  const values: string[] = [];
  let match = pattern.exec(content);
  while (match) {
    values.push(match[groupIndex] ?? "");
    match = pattern.exec(content);
  }
  return values;
}

function extractClassNames(classAttribute: string) {
  return classAttribute.split(/\s+/).map((className) => className.trim()).filter(Boolean);
}

function analyzeHtml(file: AnalyzedProjectFile): HtmlProjectInfo {
  const classAttributes = matchAll(file.content, /\bclass\s*=\s*["']([^"']+)["']/gi);
  return {
    path: file.path,
    ids: unique(matchAll(file.content, /\bid\s*=\s*["']([^"']+)["']/gi)),
    classes: unique(classAttributes.flatMap(extractClassNames)),
    scriptSrcs: unique(matchAll(file.content, /<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi)),
    stylesheetHrefs: unique(matchAll(file.content, /<link\b(?=[^>]*\brel\s*=\s*["']stylesheet["'])(?=[^>]*\bhref\s*=\s*["']([^"']+)["'])[^>]*>/gi)),
  };
}

function analyzeCss(file: AnalyzedProjectFile): CssProjectInfo {
  const selectors = matchAll(file.content, /(^|})\s*([^@{}][^{]+)\s*\{/g, 2)
    .flatMap((selectorGroup) => selectorGroup.split(","))
    .map((selector) => selector.trim())
    .filter((selector) => selector && !selector.includes(";"));

  return {
    path: file.path,
    selectors: unique(selectors).slice(0, 80),
  };
}

function analyzeJs(file: AnalyzedProjectFile): JsProjectInfo {
  const domRefs = [
    ...matchAll(file.content, /getElementById\(\s*["']([^"']+)["']\s*\)/g),
    ...matchAll(file.content, /querySelector(?:All)?\(\s*["']([^"']+)["']\s*\)/g),
    ...matchAll(file.content, /dataset\.([A-Za-z_$][\w$]*)/g),
  ];
  return {
    path: file.path,
    domRefs: unique(domRefs).slice(0, 80),
    functions: unique(matchAll(file.content, /function\s+([A-Za-z_$][\w$]*)\s*\(/g)).slice(0, 80),
    eventHandlers: unique(matchAll(file.content, /addEventListener\(\s*["']([^"']+)["']/g)).slice(0, 40),
  };
}

function analyzePython(file: AnalyzedProjectFile): PythonProjectInfo {
  return {
    path: file.path,
    imports: unique([
      ...matchAll(file.content, /^\s*import\s+([A-Za-z_][\w.]*)/gm),
      ...matchAll(file.content, /^\s*from\s+([A-Za-z_][\w.]*)\s+import\b/gm),
    ]).slice(0, 80),
    functions: unique(matchAll(file.content, /^\s*def\s+([A-Za-z_]\w*)\s*\(/gm)).slice(0, 80),
    classes: unique(matchAll(file.content, /^\s*class\s+([A-Za-z_]\w*)\b/gm)).slice(0, 80),
  };
}

function pathBasename(path: string) {
  return path.split("?")[0].split("#")[0].split("/").pop() ?? path;
}

function resolveProjectPath(reference: string, fromPath: string, files: AnalyzedProjectFile[]) {
  const cleaned = reference.split("?")[0].split("#")[0].replace(/^\.\//, "");
  const direct = files.find((file) => file.path === cleaned);
  if (direct) return direct.path;
  const basename = pathBasename(cleaned);
  return files.find((file) => file.fileName === basename)?.path ?? cleaned;
}

export function analyzeProject(files: FileItem[]): ProjectAnalysis {
  const flatFiles = flattenProjectFiles(files);
  const html = flatFiles.filter((file) => /\.html?$/i.test(file.fileName)).map(analyzeHtml);
  const css = flatFiles.filter((file) => /\.css$/i.test(file.fileName)).map(analyzeCss);
  const js = flatFiles.filter((file) => /\.m?js$/i.test(file.fileName)).map(analyzeJs);
  const python = flatFiles.filter((file) => /\.py$/i.test(file.fileName) || file.type === "python").map(analyzePython);
  const linkedFiles = html.map((htmlInfo) => ({
    htmlPath: htmlInfo.path,
    scripts: htmlInfo.scriptSrcs.map((src) => resolveProjectPath(src, htmlInfo.path, flatFiles)),
    stylesheets: htmlInfo.stylesheetHrefs.map((href) => resolveProjectPath(href, htmlInfo.path, flatFiles)),
  }));

  return {
    files: flatFiles,
    html,
    css,
    js,
    python,
    linkedFiles,
    manifestSummary: flatFiles.map((file) => file.summary).join("\n"),
  };
}
