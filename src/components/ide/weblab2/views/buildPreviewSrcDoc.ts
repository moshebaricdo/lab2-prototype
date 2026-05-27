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

function escapeCssUrlValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/\n/g, "");
}

function isHashOnlyHref(href: string) {
  return href.trim().startsWith("#");
}

function hasDeferAttribute(tag: string) {
  return /\sdefer(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?(?=\s|>|\/)/i.test(tag);
}

function hashPreviewSourceLabel(label: string) {
  let hash = 0;
  for (let index = 0; index < label.length; index += 1) {
    hash = Math.imul(31, hash) + label.charCodeAt(index);
  }
  return Math.abs(hash).toString(36);
}

function skipQuotedJavaScript(source: string, index: number) {
  const quote = source[index];
  let current = index + 1;
  while (current < source.length) {
    const char = source[current];
    if (char === "\\") {
      current += 2;
      continue;
    }
    if (char === quote) return current + 1;
    current += 1;
  }
  return current;
}

function skipTemplateJavaScript(source: string, index: number) {
  let current = index + 1;
  while (current < source.length) {
    const char = source[current];
    if (char === "\\") {
      current += 2;
      continue;
    }
    if (char === "`") return current + 1;
    current += 1;
  }
  return current;
}

function skipWhitespaceAndComments(source: string, index: number) {
  let current = index;
  while (current < source.length) {
    if (/\s/.test(source[current])) {
      current += 1;
      continue;
    }
    if (source[current] === "/" && source[current + 1] === "/") {
      const newlineIndex = source.indexOf("\n", current + 2);
      current = newlineIndex === -1 ? source.length : newlineIndex + 1;
      continue;
    }
    if (source[current] === "/" && source[current + 1] === "*") {
      const endIndex = source.indexOf("*/", current + 2);
      current = endIndex === -1 ? source.length : endIndex + 2;
      continue;
    }
    return current;
  }
  return current;
}

function findMatchingParen(source: string, index: number) {
  let depth = 0;
  let current = index;
  while (current < source.length) {
    const char = source[current];
    const nextChar = source[current + 1];
    if (char === "\"" || char === "'") {
      current = skipQuotedJavaScript(source, current);
      continue;
    }
    if (char === "`") {
      current = skipTemplateJavaScript(source, current);
      continue;
    }
    if (char === "/" && nextChar === "/") {
      const newlineIndex = source.indexOf("\n", current + 2);
      current = newlineIndex === -1 ? source.length : newlineIndex + 1;
      continue;
    }
    if (char === "/" && nextChar === "*") {
      const endIndex = source.indexOf("*/", current + 2);
      current = endIndex === -1 ? source.length : endIndex + 2;
      continue;
    }
    if (char === "(") depth += 1;
    if (char === ")") {
      depth -= 1;
      if (depth === 0) return current;
    }
    current += 1;
  }
  return -1;
}

function isIdentifierChar(char: string | undefined) {
  return Boolean(char && /[$_\p{L}\p{N}]/u.test(char));
}

function getPreviewLoopGuardInsertPositions(source: string) {
  const insertPositions: number[] = [];
  let index = 0;

  while (index < source.length) {
    const char = source[index];
    const nextChar = source[index + 1];

    if (char === "\"" || char === "'") {
      index = skipQuotedJavaScript(source, index);
      continue;
    }
    if (char === "`") {
      index = skipTemplateJavaScript(source, index);
      continue;
    }
    if (char === "/" && nextChar === "/") {
      const newlineIndex = source.indexOf("\n", index + 2);
      index = newlineIndex === -1 ? source.length : newlineIndex + 1;
      continue;
    }
    if (char === "/" && nextChar === "*") {
      const endIndex = source.indexOf("*/", index + 2);
      index = endIndex === -1 ? source.length : endIndex + 2;
      continue;
    }
    if (!/[A-Za-z_$]/.test(char)) {
      index += 1;
      continue;
    }

    const wordStart = index;
    index += 1;
    while (isIdentifierChar(source[index])) index += 1;
    const word = source.slice(wordStart, index);
    if (isIdentifierChar(source[wordStart - 1])) continue;

    if (word === "while" || word === "for") {
      const openParenIndex = skipWhitespaceAndComments(source, index);
      if (source[openParenIndex] !== "(") continue;
      const closeParenIndex = findMatchingParen(source, openParenIndex);
      if (closeParenIndex === -1) continue;
      const openBraceIndex = skipWhitespaceAndComments(source, closeParenIndex + 1);
      if (source[openBraceIndex] === "{") insertPositions.push(openBraceIndex + 1);
      index = openBraceIndex + 1;
      continue;
    }

    if (word === "do") {
      const openBraceIndex = skipWhitespaceAndComments(source, index);
      if (source[openBraceIndex] === "{") insertPositions.push(openBraceIndex + 1);
      index = openBraceIndex + 1;
    }
  }

  return insertPositions;
}

function injectPreviewLoopGuard(js: string, sourceLabel: string) {
  const insertPositions = getPreviewLoopGuardInsertPositions(js);
  if (insertPositions.length === 0) return js;

  const guardName = `__weblabPreviewLoopGuard_${hashPreviewSourceLabel(sourceLabel)}`;
  const errorMessage = JSON.stringify(
    `Web Lab preview stopped a possible infinite loop in ${sourceLabel}. Check your loop condition and update step.`,
  );
  const guardSource = `\nconst ${guardName} = (() => {\n  let iterations = 0;\n  const limit = 100000;\n  return () => {\n    iterations += 1;\n    if (iterations > limit) {\n      throw new Error(${errorMessage});\n    }\n  };\n})();\n`;
  let guardedJs = js;
  for (const insertPosition of [...insertPositions].sort((a, b) => b - a)) {
    guardedJs = `${guardedJs.slice(0, insertPosition)}\n${guardName}();${guardedJs.slice(insertPosition)}`;
  }
  return `${guardSource}\n${guardedJs}`;
}

function injectBeforeBodyClose(html: string, content: string) {
  if (!content) return html;
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${content}\n</body>`);
  }
  return `${html}\n${content}`;
}

const previewDebugRuntime = `
<script>
(() => {
  if (window.__weblabPreviewDebugRuntimeInstalled) return;
  Object.defineProperty(window, "__weblabPreviewDebugRuntimeInstalled", {
    value: true,
    configurable: false
  });

  const DEBUG_MESSAGE_TYPE = "weblab-preview:debug";
  const DEBUG_CONTROL_MESSAGE_TYPE = "weblab-preview:debug-control";
  const NETWORK_BLOCKED_MESSAGE = "Network activity is blocked in the debug panel.";
  let requestSerial = 0;
  let networkBlocked = false;

  function now() {
    return new Date().toISOString();
  }

  function nextRequestId() {
    requestSerial += 1;
    return "request-" + Date.now().toString(36) + "-" + requestSerial.toString(36);
  }

  function truncate(value, maxLength) {
    const text = String(value ?? "");
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  }

  function formatConsoleValue(value) {
    if (value instanceof Error) {
      return value.stack || value.message || value.name;
    }
    if (typeof value === "string") return value;
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  function postDebug(event) {
    window.parent.postMessage({ type: DEBUG_MESSAGE_TYPE, event }, "*");
  }

  function postBlockedNetworkError(id, start) {
    postDebug({
      kind: "network-error",
      id,
      durationMs: Math.round(performance.now() - start),
      responseTime: now(),
      error: NETWORK_BLOCKED_MESSAGE
    });
  }

  function installConsoleCapture() {
    const levels = ["log", "info", "warn", "error"];
    for (const level of levels) {
      const original = window.console && window.console[level];
      if (typeof original !== "function") continue;
      window.console[level] = function patchedConsoleMethod(...args) {
        postDebug({
          kind: "console",
          level,
          message: truncate(args.map(formatConsoleValue).join(" "), 2000),
          timestamp: now()
        });
        return original.apply(this, args);
      };
    }

    window.addEventListener("error", (event) => {
      postDebug({
        kind: "console",
        level: "error",
        message: truncate(event.message || "Uncaught error", 2000),
        timestamp: now()
      });
    });

    window.addEventListener("unhandledrejection", (event) => {
      postDebug({
        kind: "console",
        level: "error",
        message: truncate(formatConsoleValue(event.reason || "Unhandled promise rejection"), 2000),
        timestamp: now()
      });
    });
  }

  function getFetchMethod(input, init) {
    const requestMethod = input && typeof Request !== "undefined" && input instanceof Request
      ? input.method
      : "";
    return String((init && init.method) || requestMethod || "GET").toUpperCase();
  }

  function getFetchUrl(input) {
    if (typeof input === "string") return input;
    if (input && typeof URL !== "undefined" && input instanceof URL) return input.href;
    if (input && typeof Request !== "undefined" && input instanceof Request) return input.url;
    return String(input || "");
  }

  async function getResponsePreview(response) {
    const contentType = response.headers.get("content-type") || "";
    if (
      contentType &&
      !/(json|text|xml|html|javascript|x-www-form-urlencoded)/i.test(contentType)
    ) {
      return "(" + contentType + " response)";
    }

    try {
      return truncate(await response.clone().text(), 3000);
    } catch {
      return "";
    }
  }

  function installFetchCapture() {
    if (typeof window.fetch !== "function") return;
    const originalFetch = window.fetch.bind(window);
    window.fetch = async function patchedFetch(input, init) {
      const id = nextRequestId();
      const method = getFetchMethod(input, init);
      const url = getFetchUrl(input);
      const requestTime = now();
      const start = performance.now();

      postDebug({
        kind: "network-start",
        id,
        method,
        url,
        requestTime
      });

      if (networkBlocked) {
        postBlockedNetworkError(id, start);
        throw new TypeError(NETWORK_BLOCKED_MESSAGE);
      }

      try {
        const response = await originalFetch(input, init);
        postDebug({
          kind: "network-complete",
          id,
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          durationMs: Math.round(performance.now() - start),
          responseTime: now(),
          responseBody: await getResponsePreview(response)
        });
        return response;
      } catch (error) {
        postDebug({
          kind: "network-error",
          id,
          durationMs: Math.round(performance.now() - start),
          responseTime: now(),
          error: truncate(formatConsoleValue(error), 2000)
        });
        throw error;
      }
    };
  }

  function installXhrCapture() {
    if (typeof window.XMLHttpRequest !== "function") return;
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function patchedXhrOpen(method, url, ...rest) {
      this.__weblabDebugRequest = {
        id: nextRequestId(),
        method: String(method || "GET").toUpperCase(),
        url: String(url || "")
      };
      return originalOpen.call(this, method, url, ...rest);
    };

    XMLHttpRequest.prototype.send = function patchedXhrSend(...args) {
      const meta = this.__weblabDebugRequest || {
        id: nextRequestId(),
        method: "GET",
        url: ""
      };
      const requestTime = now();
      const start = performance.now();
      let settled = false;

      postDebug({
        kind: "network-start",
        id: meta.id,
        method: meta.method,
        url: meta.url,
        requestTime
      });

      if (networkBlocked) {
        window.setTimeout(() => {
          postBlockedNetworkError(meta.id, start);
          this.dispatchEvent(new ProgressEvent("error"));
          this.dispatchEvent(new ProgressEvent("loadend"));
        }, 0);
        return undefined;
      }

      const finish = (isRequestError, errorMessage) => {
        if (settled) return;
        settled = true;
        let responseBody = "";
        try {
          responseBody = truncate(this.responseText || "", 3000);
        } catch {
          responseBody = "";
        }

        if (isRequestError) {
          postDebug({
            kind: "network-error",
            id: meta.id,
            durationMs: Math.round(performance.now() - start),
            responseTime: now(),
            error: errorMessage
          });
          return;
        }

        postDebug({
          kind: "network-complete",
          id: meta.id,
          status: this.status,
          statusText: this.statusText,
          ok: this.status >= 200 && this.status < 400,
          durationMs: Math.round(performance.now() - start),
          responseTime: now(),
          responseBody
        });
      };

      this.addEventListener("loadend", () => finish(false));
      this.addEventListener("error", () => finish(true, "Network request failed"));
      this.addEventListener("abort", () => finish(true, "Network request aborted"));
      this.addEventListener("timeout", () => finish(true, "Network request timed out"));
      return originalSend.apply(this, args);
    };
  }

  installConsoleCapture();
  installFetchCapture();
  installXhrCapture();

  window.addEventListener("message", (event) => {
    const data = event.data || {};
    if (data.type !== DEBUG_CONTROL_MESSAGE_TYPE) return;
    networkBlocked = Boolean(data.networkBlocked);
  });
})();
</script>`;

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
  const DESIGN_MODE_MESSAGE_TYPE = "weblab-preview:design-mode";
  const DESIGN_APPLY_MESSAGE_TYPE = "weblab-preview:apply-design-edit";
  const DESIGN_ESCAPE_MESSAGE_TYPE = "weblab-preview:design-escape";
  const ELEMENT_HOVER_MESSAGE_TYPE = "weblab-preview:element-hover";
  const ELEMENT_SELECT_MESSAGE_TYPE = "weblab-preview:element-select";
  const ELEMENT_CLEAR_MESSAGE_TYPE = "weblab-preview:element-clear";
  const DESIGN_OVERLAY_ATTRIBUTE = "data-weblab-design-overlay";
  const LIVE_DESIGN_STYLE_ID = "weblab-live-design-edits";
  const DESIGN_OVERLAY_COLORS = {
    hoverFill: "#BFE4E8",
    hoverStroke: "#0093A4",
    selectedFill: "#E8CBFF",
    selectedStroke: "#9657C7",
    text: "#292F36"
  };
  const DESCRIBED_STYLE_PROPERTIES = [
    "backgroundColor",
    "color",
    "fontSize",
    "fontWeight",
    "fontStyle",
    "textDecoration",
    "textAlign",
    "letterSpacing",
    "lineHeight",
    "display",
    "flexDirection",
    "flexWrap",
    "justifyContent",
    "alignItems",
    "gap",
    "rowGap",
    "columnGap",
    "gridTemplateColumns",
    "gridTemplateRows",
    "border",
    "borderWidth",
    "borderTopWidth",
    "borderRightWidth",
    "borderBottomWidth",
    "borderLeftWidth",
    "borderColor",
    "borderRadius",
    "padding",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft"
  ];
  const CSS_PROPERTY_BY_STYLE = {
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
    paddingLeft: "padding-left"
  };
  const liveDesignRules = new Map();
  let designModeActive = false;
  let hoveredElement = null;
  let selectedElement = null;
  let selectedSelector = "";
  let hoverBox = null;
  let hoverLabel = null;
  let selectedBox = null;
  let selectedLabel = null;

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === "function") {
      return window.CSS.escape(value);
    }
    return String(value).replace(/[^a-zA-Z0-9_-]/g, "\\\\$&");
  }

  function getElementLabel(element) {
    const tag = element.tagName.toLowerCase();
    if (element.id) return tag + "#" + element.id;
    const className = Array.from(element.classList || []).slice(0, 2).join(".");
    return className ? tag + "." + className : tag;
  }

  function buildGeneratedSelector(element) {
    if (element.id) return "#" + cssEscape(element.id);
    const segments = [];
    let current = element;

    while (
      current &&
      current.nodeType === Node.ELEMENT_NODE &&
      current !== document.body &&
      current !== document.documentElement
    ) {
      let segment = current.tagName.toLowerCase();
      const classes = Array.from(current.classList || []).slice(0, 2);
      if (classes.length > 0) {
        segment += "." + classes.map(cssEscape).join(".");
      } else if (current.parentElement) {
        const siblings = Array.from(current.parentElement.children)
          .filter((sibling) => sibling.tagName === current.tagName);
        if (siblings.length > 1) {
          segment += ":nth-of-type(" + (siblings.indexOf(current) + 1) + ")";
        }
      }
      segments.unshift(segment);
      current = current.parentElement;
    }

    return segments.length > 0 ? segments.join(" > ") : element.tagName.toLowerCase();
  }

  function buildSelectionSelector(element) {
    if (element.id) return "#" + cssEscape(element.id);
    const segments = [];
    let current = element;

    while (
      current &&
      current.nodeType === Node.ELEMENT_NODE &&
      current !== document.body &&
      current !== document.documentElement
    ) {
      let segment = current.tagName.toLowerCase();
      const classes = Array.from(current.classList || []).slice(0, 2);
      if (classes.length > 0) {
        segment += "." + classes.map(cssEscape).join(".");
      }
      if (current.parentElement) {
        const siblings = Array.from(current.parentElement.children)
          .filter((sibling) => sibling.tagName === current.tagName);
        if (siblings.length > 1) {
          segment += ":nth-of-type(" + (siblings.indexOf(current) + 1) + ")";
        }
      }
      segments.unshift(segment);
      current = current.parentElement;
    }

    return segments.length > 0 ? segments.join(" > ") : element.tagName.toLowerCase();
  }

  function summarizeText(element) {
    return (element.innerText || element.textContent || "")
      .replace(/\\s+/g, " ")
      .trim()
      .slice(0, 160);
  }

  function summarizeOuterHTML(element) {
    return (element.outerHTML || "").replace(/\\s+/g, " ").trim().slice(0, 1000);
  }

  function describeElement(element) {
    const computed = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const computedStyles = {};
    for (const property of DESCRIBED_STYLE_PROPERTIES) {
      computedStyles[property] =
        property === "textDecoration"
          ? computed.textDecorationLine || computed.textDecoration
          : computed[property] || "";
    }

    return {
      tagName: element.tagName.toLowerCase(),
      id: element.id || "",
      classList: Array.from(element.classList || []),
      childElementCount: element.childElementCount || 0,
      selector: buildGeneratedSelector(element),
      selectionSelector: buildSelectionSelector(element),
      text: summarizeText(element),
      outerHTML: summarizeOuterHTML(element),
      rect: {
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
        width: rect.width,
        height: rect.height
      },
      computedStyles
    };
  }

  function getSelectableElement(target) {
    if (!target) return null;
    const element = target.nodeType === Node.ELEMENT_NODE ? target : target.parentElement;
    if (!element || element.closest("[" + DESIGN_OVERLAY_ATTRIBUTE + "]")) return null;
    if (element === document.documentElement || element === document.head) return null;
    return element;
  }

  function createOverlayNode(kind, isLabel) {
    const node = document.createElement("div");
    node.setAttribute(DESIGN_OVERLAY_ATTRIBUTE, kind);
    Object.assign(node.style, {
      position: "fixed",
      zIndex: "2147483647",
      pointerEvents: "none",
      boxSizing: "border-box",
      display: "none"
    });

    if (isLabel) {
      const isSelected = kind === "selected-label";
      const fill = isSelected ? DESIGN_OVERLAY_COLORS.selectedFill : DESIGN_OVERLAY_COLORS.hoverFill;
      const stroke = isSelected ? DESIGN_OVERLAY_COLORS.selectedStroke : DESIGN_OVERLAY_COLORS.hoverStroke;
      Object.assign(node.style, {
        padding: "3px 6px",
        borderRadius: "4px",
        border: "1px solid " + stroke,
        background: fill,
        color: DESIGN_OVERLAY_COLORS.text,
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: "12px",
        fontWeight: "600",
        lineHeight: "1.2",
        boxShadow: "0 6px 18px rgba(0, 0, 0, 0.22)"
      });
    } else {
      const isSelected = kind === "selected-box";
      const fill = isSelected ? DESIGN_OVERLAY_COLORS.selectedFill : DESIGN_OVERLAY_COLORS.hoverFill;
      const stroke = isSelected ? DESIGN_OVERLAY_COLORS.selectedStroke : DESIGN_OVERLAY_COLORS.hoverStroke;
      Object.assign(node.style, {
        border: "2px solid " + stroke,
        background: "color-mix(in srgb, " + fill + " 20%, transparent)"
      });
    }

    document.documentElement.appendChild(node);
    return node;
  }

  function ensureOverlay() {
    hoverBox ||= createOverlayNode("hover-box", false);
    hoverLabel ||= createOverlayNode("hover-label", true);
    selectedBox ||= createOverlayNode("selected-box", false);
    selectedLabel ||= createOverlayNode("selected-label", true);
  }

  function hideOverlayPair(box, label) {
    if (box) box.style.display = "none";
    if (label) label.style.display = "none";
  }

  function drawOverlayPair(element, box, label) {
    if (!element || !document.documentElement.contains(element)) {
      hideOverlayPair(box, label);
      return;
    }

    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      hideOverlayPair(box, label);
      return;
    }

    Object.assign(box.style, {
      display: "block",
      left: rect.left + "px",
      top: rect.top + "px",
      width: rect.width + "px",
      height: rect.height + "px"
    });

    label.textContent = getElementLabel(element);
    label.style.display = "block";
    label.style.left = Math.max(4, rect.left) + "px";
    label.style.top = Math.max(4, rect.top - 24) + "px";
  }

  function redrawOverlays() {
    if (!designModeActive) {
      hideOverlayPair(hoverBox, hoverLabel);
      hideOverlayPair(selectedBox, selectedLabel);
      return;
    }

    ensureOverlay();
    drawOverlayPair(hoveredElement === selectedElement ? null : hoveredElement, hoverBox, hoverLabel);
    drawOverlayPair(selectedElement, selectedBox, selectedLabel);
    if (selectedElement) {
      postElementMessage(ELEMENT_SELECT_MESSAGE_TYPE, selectedElement);
    }
  }

  function postElementMessage(type, element) {
    window.parent.postMessage({ type, element: describeElement(element) }, "*");
  }

  function getLiveDesignStyleElement() {
    let style = document.getElementById(LIVE_DESIGN_STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = LIVE_DESIGN_STYLE_ID;
      style.setAttribute("data-weblab-design-mode", "live");
      document.head.appendChild(style);
    }
    return style;
  }

  function syncLiveDesignStyleElement() {
    const css = Array.from(liveDesignRules.entries())
      .map(([selector, declarations]) => {
        const body = Array.from(declarations.entries())
          .map(([property, value]) => "  " + property + ": " + value + ";")
          .join("\\n");
        return selector + " {\\n" + body + "\\n}";
      })
      .join("\\n\\n");
    getLiveDesignStyleElement().textContent = css;
  }

  function applyLiveDesignEdit(message) {
    const selector = typeof message.targetSelector === "string" ? message.targetSelector.trim() : "";
    if (!selector) return;

    if (message.reset) {
      liveDesignRules.delete(selector);
      syncLiveDesignStyleElement();
      window.requestAnimationFrame(redrawOverlays);
      return;
    }

    const declarations = liveDesignRules.get(selector) || new Map();
    const styles = message.styles || {};
    for (const [styleKey, value] of Object.entries(styles)) {
      const property = CSS_PROPERTY_BY_STYLE[styleKey];
      if (!property || value == null || value === "") continue;
      declarations.set(property, String(value));
    }

    liveDesignRules.set(selector, declarations);
    syncLiveDesignStyleElement();
    window.requestAnimationFrame(() => {
      redrawOverlays();
      if (selectedElement) postElementMessage(ELEMENT_SELECT_MESSAGE_TYPE, selectedElement);
    });
  }

  function handleDesignPointerMove(event) {
    if (!designModeActive) return;
    const nextElement = getSelectableElement(event.target);
    if (!nextElement || nextElement === hoveredElement) return;
    hoveredElement = nextElement;
    redrawOverlays();
    postElementMessage(ELEMENT_HOVER_MESSAGE_TYPE, nextElement);
  }

  function clearHoveredElement() {
    if (!hoveredElement) return;
    hoveredElement = null;
    redrawOverlays();
  }

  function handleDesignPointerOut(event) {
    if (!designModeActive) return;
    const relatedTarget = event.relatedTarget;
    if (relatedTarget && document.documentElement.contains(relatedTarget)) return;
    clearHoveredElement();
  }

  function handleDesignClick(event) {
    if (!designModeActive) return;
    const nextElement = getSelectableElement(event.target);
    if (!nextElement) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    selectedElement = nextElement;
    selectedSelector = buildSelectionSelector(nextElement);
    redrawOverlays();
    postElementMessage(ELEMENT_SELECT_MESSAGE_TYPE, nextElement);
  }

  function clearSelection() {
    selectedElement = null;
    selectedSelector = "";
    redrawOverlays();
    window.parent.postMessage({ type: ELEMENT_CLEAR_MESSAGE_TYPE }, "*");
  }

  function handleDesignEscape(event) {
    if (!designModeActive || event.key !== "Escape") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (selectedElement) {
      clearSelection();
      return;
    }
    window.parent.postMessage({ type: DESIGN_ESCAPE_MESSAGE_TYPE }, "*");
  }

  function getLinkFromEvent(event) {
    const target = event.target;
    if (!target) return null;
    const element = target.nodeType === Node.ELEMENT_NODE ? target : target.parentElement;
    return element?.closest ? element.closest("a[href]") : null;
  }

  function handlePreviewNavigation(event) {
    if (designModeActive) return;
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

  function handlePreviewFormSubmit(event) {
    event.preventDefault();
  }

  function dispatchPreviewFormSubmit(form, submitter) {
    const eventInit = { bubbles: true, cancelable: true };
    const event = typeof SubmitEvent === "function"
      ? new SubmitEvent("submit", { ...eventInit, submitter })
      : new Event("submit", eventInit);
    form.dispatchEvent(event);
  }

  function installFormSubmissionGuard() {
    const prototype = window.HTMLFormElement && window.HTMLFormElement.prototype;
    if (!prototype || prototype.__weblabPreviewFormGuard) return;

    Object.defineProperty(prototype, "__weblabPreviewFormGuard", {
      value: true,
      configurable: false
    });

    prototype.submit = function submit() {
      dispatchPreviewFormSubmit(this, null);
    };

    if (typeof prototype.requestSubmit === "function") {
      prototype.requestSubmit = function requestSubmit(submitter) {
        dispatchPreviewFormSubmit(this, submitter || null);
      };
    }
  }

  window.addEventListener("message", (event) => {
    const data = event.data || {};
    if (data.type === DESIGN_APPLY_MESSAGE_TYPE) {
      applyLiveDesignEdit(data);
      return;
    }
    if (data.type !== DESIGN_MODE_MESSAGE_TYPE) return;
    designModeActive = Boolean(data.active);
    selectedSelector = typeof data.selectedSelector === "string" ? data.selectedSelector : selectedSelector;
    document.documentElement.style.cursor = designModeActive ? "crosshair" : "";

    if (!designModeActive) {
      hoveredElement = null;
      selectedElement = null;
      redrawOverlays();
      return;
    }

    if (!selectedSelector) {
      selectedElement = null;
    } else {
      try {
        selectedElement = document.querySelector(selectedSelector);
        if (selectedElement) {
          postElementMessage(ELEMENT_SELECT_MESSAGE_TYPE, selectedElement);
        }
      } catch {
        selectedElement = null;
      }
    }
    redrawOverlays();
  });

  installFormSubmissionGuard();
  document.addEventListener("pointermove", handleDesignPointerMove, true);
  document.addEventListener("pointerout", handleDesignPointerOut, true);
  document.addEventListener("click", handleDesignClick, true);
  document.addEventListener("keydown", handleDesignEscape, true);
  window.addEventListener("scroll", redrawOverlays, true);
  window.addEventListener("resize", redrawOverlays);
  window.addEventListener("blur", clearHoveredElement);
  document.addEventListener("click", handlePreviewNavigation, true);
  document.addEventListener("auxclick", handlePreviewNavigation, true);
  document.addEventListener("submit", handlePreviewFormSubmit, true);
})();
</script>`;

function injectPreviewRuntime(html: string) {
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${previewRuntime}\n</body>`);
  }
  return `${html}\n${previewRuntime}`;
}

function injectPreviewDebugRuntime(html: string) {
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>\n${previewDebugRuntime}`);
  }
  return `${previewDebugRuntime}\n${html}`;
}

function isImageAssetFile(file: FlatFile, useProposedContent: boolean) {
  const lowerName = file.name.toLowerCase();
  return (
    !isDeletedInPreview(file, useProposedContent) &&
    (
      file.item.type === "image" ||
      /\.(?:png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(lowerName)
    )
  );
}

function resolveProjectFile(
  reference: string,
  currentPath: string,
  filesByName: Map<string, FlatFile>,
  filesByPath: Map<string, FlatFile>,
) {
  const normalizedReference = resolvePreviewHref(reference, currentPath);
  if (!normalizedReference) return undefined;
  const decodedReference = safeDecodePreviewPath(normalizedReference);
  const pathCandidates = Array.from(new Set([normalizedReference, decodedReference]));
  for (const path of pathCandidates) {
    const file = filesByPath.get(path);
    if (file) return file;
  }

  for (const path of pathCandidates) {
    const name = path.split("/").at(-1) ?? path;
    const file = filesByName.get(name);
    if (file) return file;
  }

  return undefined;
}

function safeDecodePreviewPath(path: string) {
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

function toPreviewSafeAssetUrl(content: string) {
  const trimmedContent = content.trim();
  if (!trimmedContent) return undefined;
  if (trimmedContent.startsWith("data:") || trimmedContent.startsWith("blob:")) {
    return trimmedContent;
  }

  if (typeof window === "undefined") return undefined;

  if (trimmedContent.startsWith("/")) {
    // Do not rewrite network-backed app assets into srcDoc iframes. With the
    // preview sandbox and COEP headers, those requests can be blocked even when
    // the path is correct. Starter assets should use data URLs instead.
    return undefined;
  }

  const rootRelativeAssetPath = trimmedContent.replace(/^\.\//, "");
  if (/^(?:assets|src)\//.test(rootRelativeAssetPath)) {
    return undefined;
  }

  if (/^https?:\/\//i.test(trimmedContent)) {
    try {
      const url = new URL(trimmedContent);
      return url.origin === window.location.origin ? url.href : undefined;
    } catch {
      return undefined;
    }
  }

  return undefined;
}

function getImageAssetUrl(
  reference: string,
  currentPath: string,
  filesByName: Map<string, FlatFile>,
  filesByPath: Map<string, FlatFile>,
  useProposedContent: boolean,
) {
  const file = resolveProjectFile(reference, currentPath, filesByName, filesByPath);
  if (!file || !isImageAssetFile(file, useProposedContent)) return undefined;
  const content = getEffectiveContent(file.item, useProposedContent);
  return content ? toPreviewSafeAssetUrl(content) : undefined;
}

function rewriteHtmlImageAssetUrls(
  html: string,
  currentPath: string,
  filesByName: Map<string, FlatFile>,
  filesByPath: Map<string, FlatFile>,
  useProposedContent: boolean,
) {
  return html.replace(
    /\b(src|href)\s*=\s*("[^"]*"|'[^']*'|[^\s"'=<>`]+)/gi,
    (attribute, name: string, rawValue: string) => {
      const quote = rawValue.startsWith("\"") || rawValue.startsWith("'") ? rawValue[0] : "";
      const value = quote ? rawValue.slice(1, -1) : rawValue;
      const assetUrl = getImageAssetUrl(
        value,
        currentPath,
        filesByName,
        filesByPath,
        useProposedContent,
      );
      if (!assetUrl) return attribute;
      return `${name}="${escapeAttributeValue(assetUrl)}"`;
    },
  );
}

function rewriteCssImageAssetUrls(
  css: string,
  currentPath: string,
  filesByName: Map<string, FlatFile>,
  filesByPath: Map<string, FlatFile>,
  useProposedContent: boolean,
) {
  return css.replace(
    /url\(\s*("[^"]*"|'[^']*'|[^'")]+)\s*\)/gi,
    (match, rawValue: string) => {
      const quote = rawValue.startsWith("\"") || rawValue.startsWith("'") ? rawValue[0] : "";
      const value = quote ? rawValue.slice(1, -1) : rawValue.trim();
      const assetUrl = getImageAssetUrl(
        value,
        currentPath,
        filesByName,
        filesByPath,
        useProposedContent,
      );
      return assetUrl ? `url("${escapeCssUrlValue(assetUrl)}")` : match;
    },
  );
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

export function stampPreviewReloadNonce(srcDoc: string, reloadKey: number): string {
  if (reloadKey <= 0) return srcDoc;

  const nonce = `<!-- weblab-preview-reload:${reloadKey} -->`;
  if (/<\/head>/i.test(srcDoc)) {
    return srcDoc.replace(/<\/head>/i, `${nonce}\n</head>`);
  }
  if (/<html[^>]*>/i.test(srcDoc)) {
    return srcDoc.replace(/<html[^>]*>/i, (match) => `${match}\n${nonce}`);
  }
  return `${nonce}\n${srcDoc}`;
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

  const htmlWithImageAssets = rewriteHtmlImageAssetUrls(
    html,
    htmlFile.path,
    filesByName,
    filesByPath,
    useProposedContent,
  );

  const htmlWithInlinedStyles = htmlWithImageAssets.replace(
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
      const cssWithImageAssets = rewriteCssImageAssetUrls(
        css,
        cssFile.path,
        filesByName,
        filesByPath,
        useProposedContent,
      );
      return `<style data-preview-source="${href}">\n${escapeStyleCloseTag(cssWithImageAssets)}\n</style>`;
    },
  );

  const deferredScripts: string[] = [];
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
      const guardedJs = injectPreviewLoopGuard(js, normalizedSrc);
      const inlinedScript = `<script data-preview-source="${escapeAttributeValue(src)}">\n${escapeScriptCloseTag(guardedJs)}\n</script>`;
      if (hasDeferAttribute(tag)) {
        deferredScripts.push(inlinedScript);
        return "";
      }
      return inlinedScript;
    },
  );

  const htmlWithDeferredScripts = injectBeforeBodyClose(
    htmlWithInlinedScripts,
    deferredScripts.join("\n"),
  );

  const htmlWithResolvedInlineStyleAssets = htmlWithDeferredScripts.replace(
    /<style\b([^>]*)>([\s\S]*?)<\/style>/gi,
    (_tag, attributes: string, css: string) =>
      `<style${attributes}>${rewriteCssImageAssetUrls(
        css,
        htmlFile.path,
        filesByName,
        filesByPath,
        useProposedContent,
      )}</style>`,
  );

  return injectPreviewRuntime(injectPreviewDebugRuntime(constrainProjectLinks(htmlWithResolvedInlineStyleAssets)));
}
