import type { FileItem } from "../../../../types/file";
import { resolvePreviewHref } from "./buildPreviewSrcDoc";
import type {
  PreviewDesignApplyRequest,
  PreviewDesignStylePatch,
  PreviewDesignStyleProperty,
} from "./preview-panel/types";

const MANAGED_BLOCK_START = "/* Web Lab design-mode edits */";
const MANAGED_BLOCK_END = "/* End Web Lab design-mode edits */";
const INLINE_STYLE_PATTERN =
  /<style\b[^>]*\bdata-weblab-design-mode=["']true["'][^>]*>[\s\S]*?<\/style>/i;
const LINKED_STYLESHEET_PATTERN =
  /<link\b(?=[^>]*\brel=["']stylesheet["'])(?=[^>]*\bhref=["']([^"']+)["'])[^>]*>/gi;

const CSS_PROPERTY_BY_STYLE: Record<PreviewDesignStyleProperty, string> = {
  backgroundColor: "background-color",
  color: "color",
  fontSize: "font-size",
  fontWeight: "font-weight",
  fontStyle: "font-style",
  textDecoration: "text-decoration",
  textAlign: "text-align",
  letterSpacing: "letter-spacing",
  lineHeight: "line-height",
  display: "display",
  flexDirection: "flex-direction",
  flexWrap: "flex-wrap",
  justifyContent: "justify-content",
  alignItems: "align-items",
  gap: "gap",
  rowGap: "row-gap",
  columnGap: "column-gap",
  gridTemplateColumns: "grid-template-columns",
  gridTemplateRows: "grid-template-rows",
  border: "border",
  borderWidth: "border-width",
  borderTopWidth: "border-top-width",
  borderRightWidth: "border-right-width",
  borderBottomWidth: "border-bottom-width",
  borderLeftWidth: "border-left-width",
  borderColor: "border-color",
  borderRadius: "border-radius",
  padding: "padding",
  paddingTop: "padding-top",
  paddingRight: "padding-right",
  paddingBottom: "padding-bottom",
  paddingLeft: "padding-left",
};

const CSS_DECLARATION_ORDER = Object.values(CSS_PROPERTY_BY_STYLE);
const FLEX_STYLE_KEYS: PreviewDesignStyleProperty[] = [
  "flexDirection",
  "flexWrap",
  "justifyContent",
  "alignItems",
  "gap",
  "rowGap",
  "columnGap",
];

interface FlatProjectFile {
  item: FileItem;
  path: string;
}

export type PreviewDesignEditResult =
  | {
      ok: true;
      fileStructure: FileItem[];
      editedPath: string;
    }
  | {
      ok: false;
      error: string;
    };

function hasSingleRootFolder(files: FileItem[]) {
  return files.length === 1 && files[0].type === "folder" && Boolean(files[0].children);
}

function flattenProjectFiles(files: FileItem[], parentPath = ""): FlatProjectFile[] {
  if (parentPath === "" && hasSingleRootFolder(files)) {
    return flattenProjectFiles(files[0].children ?? []);
  }

  return files.flatMap((item) => {
    const path = parentPath ? `${parentPath}/${item.name}` : item.name;
    if (item.children) return flattenProjectFiles(item.children, path);
    if (item.proposedStatus === "deleted") return [];
    return [{ item, path }];
  });
}

function cloneWithUpdatedContent(
  files: FileItem[],
  targetPath: string,
  content: string,
  parentPath = "",
): FileItem[] {
  if (parentPath === "" && hasSingleRootFolder(files)) {
    return files.map((item) =>
      item.children
        ? {
            ...item,
            children: cloneWithUpdatedContent(item.children, targetPath, content),
          }
        : item,
    );
  }

  return files.map((item) => {
    const path = parentPath ? `${parentPath}/${item.name}` : item.name;
    if (item.children) {
      return {
        ...item,
        children: cloneWithUpdatedContent(item.children, targetPath, content, path),
      };
    }
    if (path !== targetPath) return item;
    return { ...item, content };
  });
}

function effectiveContent(file: FileItem) {
  return file.proposedStatus && file.proposedStatus !== "deleted"
    ? file.proposedContent ?? ""
    : file.content ?? "";
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getManagedBlock(content: string) {
  const pattern = new RegExp(
    `${escapeRegExp(MANAGED_BLOCK_START)}\\n?([\\s\\S]*?)\\n?${escapeRegExp(MANAGED_BLOCK_END)}`,
  );
  const match = content.match(pattern);
  return match?.[1] ?? "";
}

function parseManagedRules(blockContent: string) {
  const rules = new Map<string, Map<string, string>>();
  const rulePattern = /([^{}]+)\{([^}]*)\}/g;
  let match = rulePattern.exec(blockContent);

  while (match) {
    const selector = match[1].trim();
    const declarations = new Map<string, string>();
    for (const declaration of match[2].split(";")) {
      const [rawProperty, ...rawValueParts] = declaration.split(":");
      const property = rawProperty?.trim();
      const value = rawValueParts.join(":").trim();
      if (property && value) declarations.set(property, value);
    }
    if (selector && declarations.size > 0) {
      rules.set(selector, declarations);
    }
    match = rulePattern.exec(blockContent);
  }

  return rules;
}

function buildManagedBlock(rules: Map<string, Map<string, string>>) {
  const ruleBlocks = Array.from(rules.entries()).map(([selector, declarations]) => {
    const sortedDeclarations = Array.from(declarations.entries())
      .sort(([a], [b]) => {
        const aIndex = CSS_DECLARATION_ORDER.indexOf(a);
        const bIndex = CSS_DECLARATION_ORDER.indexOf(b);
        if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      })
      .map(([property, value]) => `  ${property}: ${value};`)
      .join("\n");
    return `${selector} {\n${sortedDeclarations}\n}`;
  });

  return [MANAGED_BLOCK_START, ...ruleBlocks, MANAGED_BLOCK_END].join("\n");
}

function updateCssWithManagedRule(
  content: string,
  targetSelector: string,
  styles: PreviewDesignStylePatch,
  reset = false,
) {
  const existingBlock = getManagedBlock(content);
  const rules = parseManagedRules(existingBlock);
  const selector = targetSelector.trim();

  if (reset) {
    rules.delete(selector);
    const nextBlock = buildManagedBlock(rules);
    const blockPattern = new RegExp(
      `${escapeRegExp(MANAGED_BLOCK_START)}\\n?[\\s\\S]*?\\n?${escapeRegExp(MANAGED_BLOCK_END)}`,
    );
    return blockPattern.test(content)
      ? content.replace(blockPattern, nextBlock)
      : content;
  }

  const declarations = rules.get(selector) ?? new Map<string, string>();
  const includesFlexStyle = FLEX_STYLE_KEYS.some((key) => styles[key]);

  if (includesFlexStyle && !styles.display && !declarations.has("display")) {
    declarations.set("display", "flex");
  }

  for (const [styleKey, value] of Object.entries(styles) as Array<
    [PreviewDesignStyleProperty, string | undefined]
  >) {
    const property = CSS_PROPERTY_BY_STYLE[styleKey];
    if (!property || value == null || value === "") continue;
    declarations.set(property, value);
  }

  rules.set(selector, declarations);
  const nextBlock = buildManagedBlock(rules);
  const blockPattern = new RegExp(
    `${escapeRegExp(MANAGED_BLOCK_START)}\\n?[\\s\\S]*?\\n?${escapeRegExp(MANAGED_BLOCK_END)}`,
  );

  if (blockPattern.test(content)) {
    return content.replace(blockPattern, nextBlock);
  }

  const separator = content.trim() ? "\n\n" : "";
  return `${content.replace(/\s*$/, "")}${separator}${nextBlock}\n`;
}

function updateHtmlWithInlineManagedStyle(
  html: string,
  targetSelector: string,
  styles: PreviewDesignStylePatch,
  reset = false,
) {
  const existingInlineStyle = html.match(INLINE_STYLE_PATTERN)?.[0] ?? "";
  const existingCss = existingInlineStyle
    .replace(/^<style\b[^>]*>/i, "")
    .replace(/<\/style>$/i, "");
  const nextCss = updateCssWithManagedRule(existingCss, targetSelector, styles, reset);
  const nextStyleTag = `<style data-weblab-design-mode="true">\n${nextCss}</style>`;

  if (INLINE_STYLE_PATTERN.test(html)) {
    return html.replace(INLINE_STYLE_PATTERN, nextStyleTag);
  }

  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${nextStyleTag}\n</head>`);
  }
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${nextStyleTag}\n</body>`);
  }
  return `${html}\n${nextStyleTag}`;
}

function findFirstLocalStylesheet(html: string, htmlPath: string, files: FlatProjectFile[]) {
  const filesByPath = new Map(files.map((file) => [file.path, file]));
  const filesByName = new Map(files.map((file) => [file.item.name, file]));
  LINKED_STYLESHEET_PATTERN.lastIndex = 0;
  let match = LINKED_STYLESHEET_PATTERN.exec(html);

  while (match) {
    const href = match[1];
    if (!/^(https?:)?\/\//i.test(href)) {
      const normalizedHref = resolvePreviewHref(href, htmlPath);
      const file = normalizedHref
        ? filesByPath.get(normalizedHref) ??
          filesByName.get(normalizedHref.split("/").at(-1) ?? normalizedHref)
        : undefined;
      if (file) return file;
    }
    match = LINKED_STYLESHEET_PATTERN.exec(html);
  }

  return null;
}

export function applyPreviewDesignEdit(
  files: FileItem[],
  previewPath: string,
  request: PreviewDesignApplyRequest,
): PreviewDesignEditResult {
  const targetSelector = request.targetSelector.trim();
  if (!targetSelector) {
    return { ok: false, error: "Select an element before editing styles." };
  }

  const flatFiles = flattenProjectFiles(files);
  const htmlFile = flatFiles.find((file) => file.path === previewPath);
  if (!htmlFile) {
    return { ok: false, error: "The current preview page could not be found." };
  }

  const html = effectiveContent(htmlFile.item);
  const stylesheetFile = findFirstLocalStylesheet(html, htmlFile.path, flatFiles);

  if (stylesheetFile) {
    const nextCss = updateCssWithManagedRule(
      effectiveContent(stylesheetFile.item),
      targetSelector,
      request.styles,
      request.reset,
    );
    return {
      ok: true,
      fileStructure: cloneWithUpdatedContent(files, stylesheetFile.path, nextCss),
      editedPath: stylesheetFile.path,
    };
  }

  const nextHtml = updateHtmlWithInlineManagedStyle(
    html,
    targetSelector,
    request.styles,
    request.reset,
  );
  return {
    ok: true,
    fileStructure: cloneWithUpdatedContent(files, htmlFile.path, nextHtml),
    editedPath: htmlFile.path,
  };
}

export const previewDesignEditMarkers = {
  managedBlockStart: MANAGED_BLOCK_START,
  managedBlockEnd: MANAGED_BLOCK_END,
};
