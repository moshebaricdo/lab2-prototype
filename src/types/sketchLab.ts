/**
 * Shared data contracts for Sketch Lab — the ReactFlow-based whiteboard lab type.
 *
 * Sketch Lab nodes include shapes, text, images, and standalone lines. Lines are
 * first-class nodes with endpoint handles that can attach to other nodes.
 */

import type { Node } from "@xyflow/react";

export type SketchNodeKind = "shape" | "text" | "image" | "line";

/** Canvas interaction mode — grab pans; select enables marquee multi-select. */
export type SketchCanvasTool = "grab" | "select";

export type SketchShapeKind = "rectangle" | "triangle" | "circle" | "diamond";

/** Keys into the Sketch Lab swatch palette (see `sketchLabOptions.ts`). */
export type SketchColorKey =
  | "black"
  | "gray"
  | "red"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "pink";

/** A swatch key, or a `custom:#rrggbb` literal entered via the custom field. */
export type SketchColorValue = SketchColorKey | `custom:${string}`;

export type SketchSizeKey = "small" | "medium" | "large" | "xl" | "custom";

export type SketchAlign = "left" | "center" | "right";

export type SketchLineThickness = "thin" | "medium" | "thick";
export type SketchLineStyle = "solid" | "dashed" | "dotted";
export type SketchLineShape = "straight" | "curved" | "sharp-step" | "round-step";
export type SketchArrowheads = "none" | "start" | "end" | "both";

export interface SketchLineAttachment {
  nodeId: string;
  handleId: string;
}

export interface SketchLinePoint {
  x: number;
  y: number;
}

// Node data interfaces carry an index signature so they satisfy ReactFlow's
// `Node<NodeData extends Record<string, unknown>>` constraint.
export interface SketchShapeNodeData {
  kind: "shape";
  shape: SketchShapeKind;
  text: string;
  background: SketchColorValue;
  border: SketchColorValue;
  fontSizeKey: SketchSizeKey;
  customFontSize?: number;
  align: SketchAlign;
  textColor: SketchColorValue;
  rotation: number;
  handlesHidden?: boolean;
  [key: string]: unknown;
}

export interface SketchTextNodeData {
  kind: "text";
  text: string;
  fontSizeKey: SketchSizeKey;
  customFontSize?: number;
  align: SketchAlign;
  color: SketchColorValue;
  rotation: number;
  handlesHidden?: boolean;
  [key: string]: unknown;
}

export interface SketchImageNodeData {
  kind: "image";
  src: string;
  alt: string;
  rotation: number;
  handlesHidden?: boolean;
  [key: string]: unknown;
}

export interface SketchLineNodeData {
  kind: "line";
  start: SketchLinePoint;
  end: SketchLinePoint;
  startAttachment?: SketchLineAttachment | null;
  endAttachment?: SketchLineAttachment | null;
  color: SketchColorValue;
  thickness: SketchLineThickness;
  style: SketchLineStyle;
  shape: SketchLineShape;
  arrowheads: SketchArrowheads;
  handlesHidden?: boolean;
  [key: string]: unknown;
}

export type SketchNodeData =
  | SketchShapeNodeData
  | SketchTextNodeData
  | SketchImageNodeData
  | SketchLineNodeData;

/** @deprecated Legacy edge payload — migrated to standalone line nodes on load. */
export interface SketchEdgeData {
  color: SketchColorValue;
  thickness: SketchLineThickness;
  style: SketchLineStyle;
  shape: SketchLineShape;
  arrowheads: SketchArrowheads;
  [key: string]: unknown;
}

/** @deprecated Standalone line nodes replaced ReactFlow edges. */
export interface SketchLegacyEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  type?: string;
  data?: SketchEdgeData;
}

/** ReactFlow node instances specialized for Sketch Lab. */
export type SketchNode = Node<SketchNodeData, SketchNodeKind>;
