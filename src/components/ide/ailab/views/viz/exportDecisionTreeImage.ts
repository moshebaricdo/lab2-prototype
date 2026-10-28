import { toJpeg, toPng } from "html-to-image";

/** Empty margin, in output pixels, around the tree. */
const EXPORT_PADDING = 32;

export interface TreeImageBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface TreeImageExportOptions {
  /** Output encoding. JPEG stays small enough for the backpack. */
  format?: "png" | "jpeg";
  /** Device-pixel multiplier for the raster. */
  pixelRatio?: number;
  /**
   * Longest side of the tree before padding. Larger trees scale down.
   * Defaults to 2400, matching Sketch Lab's device export.
   */
  maxDimension?: number;
  /** JPEG quality, 0–1. Ignored for PNG. */
  quality?: number;
}

export interface TreeImageExport {
  dataUrl: string;
}

const SVG_SHAPE = "path, line, polyline, polygon, circle, rect";

/** Presentation attributes survive the exporter; class-based SVG paint does not. */
function inlineSvgPaint(source: ParentNode, clone: ParentNode) {
  const sourceShapes = source.querySelectorAll(SVG_SHAPE);
  const cloneShapes = clone.querySelectorAll(SVG_SHAPE);
  sourceShapes.forEach((shape, index) => {
    const target = cloneShapes[index];
    if (!(target instanceof SVGElement)) return;
    const computed = getComputedStyle(shape);
    target.setAttribute("fill", computed.fill);
    target.setAttribute("stroke", computed.stroke);
    target.setAttribute("stroke-width", computed.strokeWidth);
    target.setAttribute("stroke-linecap", computed.strokeLinecap);
    target.setAttribute("stroke-linejoin", computed.strokeLinejoin);
    if (computed.strokeDasharray && computed.strokeDasharray !== "none") {
      target.setAttribute("stroke-dasharray", computed.strokeDasharray);
    }
  });
}

const GENERIC_FONT = /^(sans-serif|serif|monospace|cursive|fantasy|system-ui)$/;

/**
 * The picture cannot embed the webfont, so it paints the generic fallback.
 * Measure and draw with that same family. Icon fonts have no generic
 * fallback and are left alone.
 */
function useFallbackFont(root: HTMLElement) {
  const elements = [root, ...root.querySelectorAll("*")];
  for (const node of elements) {
    if (!(node instanceof HTMLElement)) continue;
    const names = getComputedStyle(node)
      .fontFamily.split(",")
      .map((part) => part.trim().replace(/^["']|["']$/g, ""));
    const generic = names.find((name) => GENERIC_FONT.test(name));
    if (!generic || names[0] === generic) continue;
    node.style.fontFamily = generic;
  }
}

/**
 * A label that fits on the canvas should fit in the file. Unclip those;
 * labels that are already cut off on screen stay cut off.
 */
function unclipLabelsThatFit(source: HTMLElement, clone: HTMLElement) {
  const live = source.querySelectorAll("*");
  const copied = clone.querySelectorAll("*");
  live.forEach((node, index) => {
    const target = copied[index];
    if (!(node instanceof HTMLElement) || !(target instanceof HTMLElement)) return;
    const style = getComputedStyle(node);
    if (style.textOverflow !== "ellipsis") return;
    if (node.scrollWidth > node.clientWidth + 1) return;
    target.style.overflow = "visible";
    target.style.textOverflow = "clip";
    target.style.maxWidth = "none";
  });
}

/** Grow each card to the fallback font. Widths were measured with the webfont. */
function widenNodes(root: HTMLElement) {
  for (const card of root.querySelectorAll('[role="treeitem"]')) {
    if (!(card instanceof HTMLElement)) continue;
    const laidWidth = parseFloat(card.style.width);
    const laidHeight = parseFloat(card.style.height);
    if (!Number.isFinite(laidWidth) || laidWidth <= 0) continue;
    card.style.width = "max-content";
    card.style.height = "auto";
    const neededWidth = card.offsetWidth;
    const neededHeight = card.offsetHeight;
    if (neededWidth <= 0) {
      card.style.width = `${laidWidth}px`;
      if (Number.isFinite(laidHeight)) card.style.height = `${laidHeight}px`;
      continue;
    }
    card.style.width = `${Math.max(laidWidth, neededWidth + 1)}px`;
    if (Number.isFinite(laidHeight)) {
      card.style.height = `${Math.max(laidHeight, neededHeight)}px`;
    }
  }
}

/**
 * Layout-space bounds of everything the clone paints. The clone's top-left
 * is the stage origin, so a rect's offset from it is the stage coordinate.
 */
function paintedBounds(root: HTMLElement, fallback: TreeImageBox): TreeImageBox {
  const origin = root.getBoundingClientRect();
  let left = fallback.left;
  let top = fallback.top;
  let right = fallback.right;
  let bottom = fallback.bottom;
  for (const node of root.querySelectorAll("*")) {
    if (!(node instanceof Element)) continue;
    const rect = node.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    left = Math.min(left, rect.left - origin.left);
    top = Math.min(top, rect.top - origin.top);
    right = Math.max(right, rect.right - origin.left);
    bottom = Math.max(bottom, rect.bottom - origin.top);
  }
  return { left, top, right, bottom };
}

function canvasBackground(): string {
  if (typeof window === "undefined") return "white";
  const token = getComputedStyle(document.documentElement)
    .getPropertyValue("--ds-background-neutral-primary")
    .trim();
  return token || "white";
}

/**
 * Rasterize the decision-tree stage. The capture is framed to `box` (the
 * nodes, in stage coordinates) rather than the current pan or zoom, and
 * `classNames` — including the resting-style class — are added only on the
 * clone, so the live canvas does not flash.
 */
export async function exportDecisionTreeImage(
  treeEl: HTMLElement,
  box: TreeImageBox,
  classNames: string[],
  options: TreeImageExportOptions = {},
): Promise<TreeImageExport | null> {
  if (typeof window === "undefined") return null;

  const boxWidth = box.right - box.left;
  const boxHeight = box.bottom - box.top;
  if (
    !Number.isFinite(boxWidth) ||
    !Number.isFinite(boxHeight) ||
    boxWidth <= 0 ||
    boxHeight <= 0
  ) {
    return null;
  }

  const {
    format = "png",
    pixelRatio = 1,
    maxDimension = 2400,
    quality = 0.85,
  } = options;

  // html-to-image copies computed position into the SVG it rasterizes. A
  // fixed element parked off-screen is copied at that offset, so the tree
  // lands outside the picture and the file is blank. The host stays
  // `position: relative` at 0,0. The clip only hides it from the page; it is
  // not the node that gets captured.
  const clip = document.createElement("div");
  clip.setAttribute("data-tree-export-clip", "");
  clip.setAttribute("aria-hidden", "true");
  clip.setAttribute("inert", "");
  // A 0×0 clip skips layout, so label widths cannot be measured. Opacity is
  // not inherited: the captured host still paints at full opacity.
  clip.style.position = "fixed";
  clip.style.left = "0";
  clip.style.top = "0";
  clip.style.opacity = "0";
  clip.style.pointerEvents = "none";
  clip.style.zIndex = "-1";

  const background = canvasBackground();
  const host = document.createElement("div");
  host.setAttribute("data-tree-export", "");
  host.style.position = "relative";
  host.style.left = "0";
  host.style.top = "0";
  host.style.overflow = "hidden";
  host.style.background = background;
  host.style.zoom = "normal";

  const clone = treeEl.cloneNode(true) as HTMLElement;
  clone.classList.add(...classNames.filter(Boolean));
  // SVG children are not restyled by the exporter, so a path's CSS stroke
  // is dropped and the connector fills in black. Copy the paint onto the
  // shapes themselves.
  inlineSvgPaint(treeEl, clone);
  // `zoom` does not paint inside the exporter's SVG. The stage uses it for
  // the live canvas; the clone is reframed with a plain transform instead.
  clone.style.zoom = "normal";
  clone.style.position = "relative";
  clone.style.left = "0";
  clone.style.top = "0";
  clone.style.margin = "0";
  clone.style.transform = "none";
  host.appendChild(clone);
  clip.appendChild(host);
  document.body.appendChild(clip);
  // Node widths were measured with the webfont. The file paints the wider
  // fallback, which clips a short label like "no". Size the cards for the
  // font the picture will actually use, then frame whatever that grows.
  useFallbackFont(clone);
  unclipLabelsThatFit(treeEl, clone);
  widenNodes(clone);
  const frame = paintedBounds(clone, box);
  const frameWidth = frame.right - frame.left;
  const frameHeight = frame.bottom - frame.top;
  const scale = Math.min(1, maxDimension / Math.max(frameWidth, frameHeight));
  const width = Math.ceil(frameWidth * scale + EXPORT_PADDING * 2);
  const height = Math.ceil(frameHeight * scale + EXPORT_PADDING * 2);
  host.style.width = `${width}px`;
  host.style.height = `${height}px`;
  clone.style.transformOrigin = "top left";
  clone.style.transform = `translate(${EXPORT_PADDING - frame.left * scale}px, ${EXPORT_PADDING - frame.top * scale}px) scale(${scale})`;

  try {
    const config = {
      backgroundColor: background,
      width,
      height,
      pixelRatio,
      // Cross-origin webfonts cannot be embedded; the image uses the fallback.
      skipFonts: true,
      style: {
        position: "relative",
        left: "0",
        top: "0",
        transform: "none",
        zoom: "normal",
        margin: "0",
        overflow: "hidden",
      },
    };
    const dataUrl =
      format === "jpeg"
        ? await toJpeg(host, { ...config, quality })
        : await toPng(host, config);
    return { dataUrl };
  } finally {
    clip.remove();
  }
}

/** `Bird, mammal, or fish` → `bird-mammal-or-fish-tree.png`. */
export function decisionTreeImageFileName(
  datasetName: string,
  extension: "png" | "jpg",
): string {
  const slug = datasetName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "decision-tree"}-tree.${extension}`;
}
