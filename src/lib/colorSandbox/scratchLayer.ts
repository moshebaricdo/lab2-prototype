import type { Node } from "@xyflow/react";
import type { BrandTheme } from "../../hooks/useTheme";
import { rgbHex } from "../../pages/design-system/colorSystemData";

/**
 * The scratch layer is a set of free-positioned "sandbox" nodes (color swatches
 * and text layers) that live on the color sandbox canvas alongside the color
 * collections. They let you quickly lay colors and text over each other and
 * check contrast. Scratch nodes persist across light/dark mode but are scoped
 * per brand theme (they do NOT carry over between Code.org and CodeAI).
 */

export const COLOR_SANDBOX_SCRATCH_STORAGE_KEY = "lab2:color-sandbox:scratch";

export const SCRATCH_ID_PREFIX = "scratch:";

export const SCRATCH_SWATCH_TYPE = "scratchSwatch";
export const SCRATCH_TEXT_TYPE = "scratchText";

export type ScratchNodeKind = "swatch" | "text";

export interface ScratchNode {
  id: string;
  kind: ScratchNodeKind;
  x: number;
  y: number;
  width: number;
  height: number;
  /** For a swatch this is the background fill; for text it is the text color. */
  fill: string;
  /** Text content (text nodes only). */
  text?: string;
}

/** Payload carried on the React Flow node `data`. */
export interface ScratchNodeData extends Record<string, unknown> {
  kind: ScratchNodeKind;
  fill: string;
  text: string;
}

export type ScratchFlowNode = Node<ScratchNodeData>;

const DEFAULT_SWATCH_SIZE = { width: 112, height: 112 };
const TEXT_HEIGHT = 44;
const TEXT_HORIZONTAL_PADDING = 8;
const TEXT_MIN_WIDTH = 40;

function scratchTextMeasureFont(): string {
  if (typeof document === "undefined") {
    return "600 20px Figtree, sans-serif";
  }
  const rootStyle = getComputedStyle(document.documentElement);
  const weight = rootStyle.getPropertyValue("--font-weight-semibold").trim() || "600";
  const size = rootStyle.getPropertyValue("--text-lg").trim() || "20px";
  const family = rootStyle.getPropertyValue("--font-body").trim() || "Figtree, sans-serif";
  return `${weight} ${size} ${family}`;
}

/** Width for a scratch text node, hugging the rendered label (supports newlines). */
export function measureScratchTextWidth(text: string): number {
  const content = text.trim().length > 0 ? text : "Text";
  if (typeof document === "undefined") {
    return Math.max(TEXT_MIN_WIDTH, content.length * 12 + TEXT_HORIZONTAL_PADDING);
  }
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return Math.max(TEXT_MIN_WIDTH, content.length * 12 + TEXT_HORIZONTAL_PADDING);
  }
  ctx.font = scratchTextMeasureFont();
  const lineWidth = Math.max(
    ...content.split("\n").map((line) => ctx.measureText(line || " ").width),
  );
  return Math.max(TEXT_MIN_WIDTH, Math.ceil(lineWidth) + TEXT_HORIZONTAL_PADDING);
}

function scratchTextSize(text: string): { width: number; height: number } {
  return {
    width: measureScratchTextWidth(text),
    height: TEXT_HEIGHT,
  };
}

export function isScratchId(id: string | undefined): boolean {
  return typeof id === "string" && id.startsWith(SCRATCH_ID_PREFIX);
}

export function generateScratchId(): string {
  const suffix =
    Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  return `${SCRATCH_ID_PREFIX}${suffix}`;
}

export function createScratchNode(
  kind: ScratchNodeKind,
  fill: string,
  position: { x: number; y: number },
): ScratchNode {
  const size = kind === "swatch" ? DEFAULT_SWATCH_SIZE : scratchTextSize("Text");
  return {
    id: generateScratchId(),
    kind,
    x: position.x,
    y: position.y,
    width: size.width,
    height: size.height,
    fill,
    text: kind === "text" ? "Text" : undefined,
  };
}

export function toScratchFlowNode(node: ScratchNode): ScratchFlowNode {
  return {
    id: node.id,
    type: node.kind === "swatch" ? SCRATCH_SWATCH_TYPE : SCRATCH_TEXT_TYPE,
    position: { x: node.x, y: node.y },
    width: node.width,
    height: node.height,
    style: { width: node.width, height: node.height },
    className: "nopan",
    draggable: true,
    selectable: true,
    connectable: false,
    data: {
      kind: node.kind,
      fill: node.fill,
      text: node.text ?? "",
    },
  };
}

export function fromScratchFlowNode(node: ScratchFlowNode): ScratchNode {
  const data = node.data;
  const kind: ScratchNodeKind = data.kind;
  const styleWidth = Number(node.style?.width);
  const styleHeight = Number(node.style?.height);
  const fallback =
    kind === "swatch" ? DEFAULT_SWATCH_SIZE : scratchTextSize(data.text || "Text");
  return {
    id: node.id,
    kind,
    x: node.position.x,
    y: node.position.y,
    width: node.width ?? (Number.isFinite(styleWidth) ? styleWidth : fallback.width),
    height:
      node.height ?? (Number.isFinite(styleHeight) ? styleHeight : fallback.height),
    fill: rgbHex(data.fill),
    text: kind === "text" ? data.text : undefined,
  };
}

type StoredScratchNodes = Partial<Record<BrandTheme, ScratchNode[]>>;

function readAll(): StoredScratchNodes {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(COLOR_SANDBOX_SCRATCH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredScratchNodes) : {};
  } catch {
    return {};
  }
}

export function loadScratchNodes(brand: BrandTheme): ScratchNode[] {
  const stored = readAll()[brand];
  return Array.isArray(stored) ? stored : [];
}

export function persistScratchNodes(brand: BrandTheme, nodes: ScratchNode[]): void {
  if (typeof window === "undefined") return;
  const all = readAll();
  all[brand] = nodes;
  window.localStorage.setItem(
    COLOR_SANDBOX_SCRATCH_STORAGE_KEY,
    JSON.stringify(all),
  );
}
