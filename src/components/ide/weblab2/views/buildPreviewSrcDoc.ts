import type { FileItem } from "../../../../types/file";

export interface PreviewHtmlFile {
  name: string;
  path: string;
  item: FileItem;
}

interface FlatFile extends PreviewHtmlFile {}

function flattenFiles(files: FileItem[], parentPath = ""): FlatFile[] {
  return files.flatMap((item) => {
    const path = parentPath ? `${parentPath}/${item.name}` : item.name;
    if (item.children) {
      return flattenFiles(item.children, path);
    }
    return [{ name: item.name, path, item }];
  });
}

function flattenProjectFiles(fileStructure: FileItem[]): FlatFile[] {
  if (
    fileStructure.length === 1 &&
    fileStructure[0].type === "folder" &&
    fileStructure[0].children
  ) {
    return flattenFiles(fileStructure[0].children);
  }

  return flattenFiles(fileStructure);
}

export function normalizePreviewPath(path: string): string | null {
  const withoutQueryOrHash = path.trim().split(/[?#]/, 1)[0] ?? "";
  if (!withoutQueryOrHash) return null;
  if (/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(withoutQueryOrHash)) return null;
  if (/^(?:mailto|tel|javascript|data|blob):/i.test(withoutQueryOrHash)) return null;

  const normalizedSlashes = withoutQueryOrHash
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^\.\//, "");
  const segments: string[] = [];

  for (const segment of normalizedSlashes.split("/")) {
    if (!segment || segment === ".") continue;
    if (segment === "..") {
      if (segments.length === 0) return null;
      segments.pop();
      continue;
    }
    segments.push(segment);
  }

  return segments.length > 0 ? segments.join("/") : null;
}

export function resolvePreviewHref(href: string, currentPath: string): string | null {
  const cleanHref = href.trim();
  if (!cleanHref || cleanHref.startsWith("#")) return null;
  if (/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(cleanHref)) return null;
  if (/^(?:mailto|tel|javascript|data|blob):/i.test(cleanHref)) return null;

  const pathPart = cleanHref.split(/[?#]/, 1)[0] ?? "";
  if (!pathPart) return null;
  if (pathPart.startsWith("/")) return normalizePreviewPath(pathPart);

  const baseFolder = currentPath.split("/").slice(0, -1).join("/");
  return normalizePreviewPath(baseFolder ? `${baseFolder}/${pathPart}` : pathPart);
}

function getEffectiveContent(file: FileItem, useProposedContent: boolean) {
  return useProposedContent && file.proposedStatus && file.proposedContent != null
    ? file.proposedContent
    : file.content;
}

function escapeStyleCloseTag(css: string) {
  return css.replace(/<\/style/gi, "<\\/style");
}

function escapeScriptCloseTag(js: string) {
  return js.replace(/<\/script/gi, "<\\/script");
}

function escapeAttributeValue(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function isHashOnlyHref(href: string) {
  return href.trim().startsWith("#");
}

function constrainProjectLinks(html: string) {
  return html.replace(/<a\b(?=[^>]*\bhref\s*=)([^>]*)>/gi, (tag) => {
    const hrefMatch = tag.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const href = hrefMatch?.[1] ?? hrefMatch?.[2] ?? hrefMatch?.[3] ?? "";
    if (!href || isHashOnlyHref(href)) return tag;

    const withoutNativeNavigation = tag
      .replace(/\s+href\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i, "")
      .replace(/\s+target\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i, "");

    return withoutNativeNavigation.replace(
      /^<a\b/i,
      `<a href="#" data-preview-href="${escapeAttributeValue(href)}"`,
    );
  });
}

const previewRuntime = `
<script>
(() => {
  const NAVIGATION_MESSAGE_TYPE = "weblab-preview:navigate";

  function getLinkFromEvent(event) {
    const target = event.target;
    if (!target) return null;
    const element = target.nodeType === Node.ELEMENT_NODE ? target : target.parentElement;
    return element?.closest ? element.closest("a[href]") : null;
  }

  function handlePreviewNavigation(event) {
    const link = getLinkFromEvent(event);
    if (!link) return;

    const href = link.getAttribute("data-preview-href") || link.getAttribute("href") || "";
    if (/^(mailto:|tel:|javascript:)/i.test(href)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    if (href.startsWith("#")) {
      const id = decodeURIComponent(href.slice(1));
      if (id) {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }

    window.parent.postMessage({ type: NAVIGATION_MESSAGE_TYPE, href }, "*");
  }

  document.addEventListener("click", handlePreviewNavigation, true);
  document.addEventListener("auxclick", handlePreviewNavigation, true);
  document.addEventListener("submit", (event) => event.preventDefault());
})();
</script>`;

function injectPreviewRuntime(html: string) {
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${previewRuntime}\n</body>`);
  }
  return `${html}\n${previewRuntime}`;
}

function isDeletedInPreview(file: FlatFile, useProposedContent: boolean) {
  return useProposedContent && file.item.proposedStatus === "deleted";
}

function isHtmlFile(file: FlatFile, useProposedContent: boolean) {
  const lowerName = file.name.toLowerCase();
  return (
    !isDeletedInPreview(file, useProposedContent) &&
    (file.item.type === "html" || lowerName.endsWith(".html") || lowerName.endsWith(".htm"))
  );
}

export function getPreviewHtmlFiles(
  fileStructure: FileItem[],
  useProposedContent: boolean,
): PreviewHtmlFile[] {
  return flattenProjectFiles(fileStructure)
    .filter((file) => isHtmlFile(file, useProposedContent))
    .map(({ name, path, item }) => ({ name, path, item }));
}

export function findPreviewHtmlFile(
  htmlFiles: PreviewHtmlFile[],
  path: string,
): PreviewHtmlFile | undefined {
  const normalizedPath = normalizePreviewPath(path);
  if (!normalizedPath) return undefined;
  const exactPath = htmlFiles.find((file) => file.path === normalizedPath);
  if (exactPath) return exactPath;

  const matchingNames = htmlFiles.filter((file) => file.name === normalizedPath);
  return matchingNames.length === 1 ? matchingNames[0] : undefined;
}

export function buildPreviewSrcDoc(
  fileStructure: FileItem[],
  useProposedContent: boolean,
  previewPath = "index.html",
) {
  const flatFiles = flattenProjectFiles(fileStructure).filter(
    (file) => !isDeletedInPreview(file, useProposedContent),
  );
  const htmlFiles = getPreviewHtmlFiles(fileStructure, useProposedContent);
  const htmlFile = findPreviewHtmlFile(htmlFiles, previewPath);
  const html = htmlFile
    ? getEffectiveContent(htmlFile.item, useProposedContent)
    : undefined;

  if (html == null || !htmlFile) return undefined;

  const filesByName = new Map(flatFiles.map((file) => [file.name, file]));
  const filesByPath = new Map(flatFiles.map((file) => [file.path, file]));

  const htmlWithInlinedStyles = html.replace(
    /<link\b(?=[^>]*\brel=["']stylesheet["'])(?=[^>]*\bhref=["']([^"']+)["'])[^>]*>/gi,
    (tag, href: string) => {
      if (/^(https?:)?\/\//i.test(href)) return tag;
      const normalizedHref = resolvePreviewHref(href, htmlFile.path);
      if (!normalizedHref) return tag;
      const cssFile =
        filesByPath.get(normalizedHref) ??
        filesByName.get(normalizedHref.split("/").at(-1) ?? normalizedHref);
      const css = cssFile ? getEffectiveContent(cssFile.item, useProposedContent) : undefined;
      if (!css) return tag;
      return `<style data-preview-source="${href}">\n${escapeStyleCloseTag(css)}\n</style>`;
    },
  );

  const htmlWithInlinedScripts = htmlWithInlinedStyles.replace(
    /<script\b(?=[^>]*\bsrc=["']([^"']+)["'])[^>]*>\s*<\/script>/gi,
    (tag, src: string) => {
      if (/^(https?:)?\/\//i.test(src)) return tag;
      const normalizedSrc = resolvePreviewHref(src, htmlFile.path);
      if (!normalizedSrc) return tag;
      const jsFile =
        filesByPath.get(normalizedSrc) ??
        filesByName.get(normalizedSrc.split("/").at(-1) ?? normalizedSrc);
      const js = jsFile ? getEffectiveContent(jsFile.item, useProposedContent) : undefined;
      if (!js) return tag;
      return `<script data-preview-source="${escapeAttributeValue(src)}">\n${escapeScriptCloseTag(js)}\n</script>`;
    },
  );

  return injectPreviewRuntime(constrainProjectLinks(htmlWithInlinedScripts));
}
