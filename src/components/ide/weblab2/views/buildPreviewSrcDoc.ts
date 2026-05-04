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
