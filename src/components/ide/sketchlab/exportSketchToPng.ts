import { getNodesBounds } from "@xyflow/react";
import { toJpeg, toPng } from "html-to-image";
import type { SketchNode } from "../../../types/sketchLab";

/** Empty margin (in output px) drawn around the artwork in the exported image. */
const EXPORT_PADDING = 48;

/**
 * Chrome that lives inside the ReactFlow viewport but is not part of the
 * student's artwork: connection handles, line endpoint knobs, and selection
 * rings. We drop these from the capture so the export shows only what was
 * drawn (matching design tokens drive the rest of the styling).
 */
const EXCLUDED_CLASS_PATTERN = /handle|endpointKnob|selectionRing/i;

export interface SketchExportOptions {
  /** Output encoding. JPEG is far smaller — used for backpack/localStorage. */
  format?: "png" | "jpeg";
  /** Device-pixel multiplier for the rasterized output. */
  pixelRatio?: number;
  /** Cap on the longest side of the artwork (output px, before padding). */
  maxDimension?: number;
  /** JPEG quality (0–1); ignored for PNG. */
  quality?: number;
}

export interface SketchImageExport {
  dataUrl: string;
  width: number;
  height: number;
}

function classNameOf(node: Element): string {
  const className = (node as HTMLElement).className;
  if (typeof className === "string") return className;
  // SVG elements expose className as an SVGAnimatedString.
  return (className as { baseVal?: string } | null)?.baseVal ?? "";
}

function resolveCanvasBackground(): string {
  if (typeof window === "undefined") return "#ffffff";
  const token = getComputedStyle(document.documentElement)
    .getPropertyValue("--ds-background-neutral-primary")
    .trim();
  return token || "#ffffff";
}

/**
 * Render every node on the canvas to an image data URL. The capture is framed
 * to the bounding box of the full sketch — independent of the current pan/zoom
 * — so the artifact always contains everything the student created, even when
 * they are zoomed into a single node at save time. Large sketches are scaled
 * down to `maxDimension` so the encoded result stays a reasonable size.
 *
 * Returns `null` when there is nothing to export (empty canvas / missing DOM).
 */
export async function exportSketchImage(
  nodes: SketchNode[],
  viewportEl: HTMLElement | null,
  options: SketchExportOptions = {},
): Promise<SketchImageExport | null> {
  if (typeof window === "undefined") return null;
  if (nodes.length === 0 || !viewportEl) return null;

  const {
    format = "png",
    pixelRatio = 1,
    maxDimension = 2400,
    quality = 0.85,
  } = options;

  const bounds = getNodesBounds(nodes);
  if (
    !Number.isFinite(bounds.width) ||
    !Number.isFinite(bounds.height) ||
    bounds.width <= 0 ||
    bounds.height <= 0
  ) {
    return null;
  }

  // Scale the artwork down so its longest side fits within maxDimension. This
  // keeps the encoded data URL small enough to persist to localStorage.
  const scale = Math.min(1, maxDimension / Math.max(bounds.width, bounds.height));

  const width = Math.ceil(bounds.width * scale + EXPORT_PADDING * 2);
  const height = Math.ceil(bounds.height * scale + EXPORT_PADDING * 2);

  // Reframe the cloned viewport to fit the whole sketch: map the bounding-box
  // top-left to (PADDING, PADDING) regardless of the live transform.
  const translateX = EXPORT_PADDING - bounds.x * scale;
  const translateY = EXPORT_PADDING - bounds.y * scale;

  const config = {
    backgroundColor: resolveCanvasBackground(),
    width,
    height,
    pixelRatio,
    // The custom webfonts are loaded via cross-origin <link> tags whose rules
    // cannot be read for embedding (SecurityError); skip embedding so the
    // export uses the system fallback instead of spamming the console.
    skipFonts: true,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
    },
    filter: (node: HTMLElement) => {
      if (!(node instanceof Element)) return true;
      return !EXCLUDED_CLASS_PATTERN.test(classNameOf(node));
    },
  };

  const dataUrl =
    format === "jpeg"
      ? await toJpeg(viewportEl, { ...config, quality })
      : await toPng(viewportEl, config);

  return { dataUrl, width, height };
}
