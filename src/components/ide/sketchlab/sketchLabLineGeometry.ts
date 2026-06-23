import {
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  Position,
} from "@xyflow/react";
import type {
  SketchLineNodeData,
  SketchLineShape,
  SketchNode,
} from "../../../types/sketchLab";

export interface SketchPoint {
  x: number;
  y: number;
}

export interface SketchLineAttachment {
  nodeId: string;
  handleId: string;
}

export type SketchLineStyling = Pick<
  SketchLineNodeData,
  "color" | "thickness" | "style" | "shape" | "arrowheads"
>;

const DEFAULT_NODE_SIZE: Record<string, { width: number; height: number }> = {
  shape: { width: 120, height: 72 },
  text: { width: 100, height: 32 },
  image: { width: 160, height: 120 },
  line: { width: 180, height: 80 },
  group: { width: 120, height: 72 },
};

function numericDimension(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getNodeDimensions(node: SketchNode) {
  const styleWidth = numericDimension(node.style?.width);
  const styleHeight = numericDimension(node.style?.height);
  return {
    width:
      styleWidth ??
      node.measured?.width ??
      node.width ??
      DEFAULT_NODE_SIZE[node.type ?? "shape"]?.width ??
      120,
    height:
      styleHeight ??
      node.measured?.height ??
      node.height ??
      DEFAULT_NODE_SIZE[node.type ?? "shape"]?.height ??
      72,
  };
}

function nodeSize(node: SketchNode) {
  return getNodeDimensions(node);
}

export function getNodeAbsolutePosition(node: SketchNode, nodes: SketchNode[]) {
  const byId = new Map(nodes.map((item) => [item.id, item]));
  let x = node.position.x;
  let y = node.position.y;
  let parentId = node.parentId;
  while (parentId) {
    const parent = byId.get(parentId);
    if (!parent) break;
    x += parent.position.x;
    y += parent.position.y;
    parentId = parent.parentId;
  }
  return { x, y };
}

export function getNodeAbsoluteBounds(node: SketchNode, nodes: SketchNode[]) {
  const origin = getNodeAbsolutePosition(node, nodes);
  if (node.data.kind === "line") {
    const data = node.data as SketchLineNodeData;
    const start = { x: origin.x + data.start.x, y: origin.y + data.start.y };
    const end = { x: origin.x + data.end.x, y: origin.y + data.end.y };
    return getLineBounds(start, end, 0);
  }
  const { width, height } = getNodeDimensions(node);
  return { x: origin.x, y: origin.y, width, height };
}

/** Convert an absolute canvas point to a node's local position (parent-aware). */
export function absoluteToNodePosition(
  absPoint: SketchPoint,
  node: SketchNode,
  nodes: SketchNode[],
): SketchPoint {
  if (!node.parentId) return absPoint;
  const parent = nodes.find((item) => item.id === node.parentId);
  if (!parent) return absPoint;
  const parentOrigin = getNodeAbsolutePosition(parent, nodes);
  return { x: absPoint.x - parentOrigin.x, y: absPoint.y - parentOrigin.y };
}

/** Absolute canvas position for a node's connection handle. */
export function getNodeHandlePosition(
  node: SketchNode,
  handleId: string,
  nodes: SketchNode[],
): SketchPoint {
  if (node.data.kind === "line") {
    const data = node.data as SketchLineNodeData;
    const point = handleId === "start" ? data.start : data.end;
    return { x: node.position.x + point.x, y: node.position.y + point.y };
  }

  const { width, height } = nodeSize(node);
  const { x, y } = getNodeAbsolutePosition(node, nodes);

  if (node.data.kind === "shape" && node.data.shape === "triangle") {
    switch (handleId) {
      case "left":
        return { x: x + width * 0.25, y: y + height * 0.5 };
      case "right":
        return { x: x + width * 0.75, y: y + height * 0.5 };
      case "bottom":
        return { x: x + width * 0.5, y: y + height };
      default:
        return { x: x + width * 0.5, y: y + height * 0.5 };
    }
  }

  switch (handleId) {
    case "top":
      return { x: x + width / 2, y };
    case "right":
      return { x: x + width, y: y + height / 2 };
    case "bottom":
      return { x: x + width / 2, y: y + height };
    case "left":
      return { x, y: y + height / 2 };
    default:
      return { x: x + width / 2, y: y + height / 2 };
  }
}

function getShapeHandleIds(node: SketchNode) {
  if (node.data.kind === "shape" && node.data.shape === "triangle") {
    return ["left", "right", "bottom"] as const;
  }
  return ["top", "right", "bottom", "left"] as const;
}

/**
 * Find the closest shape handle to snap a line endpoint to.
 *
 * Returns a match when `point` falls within (or near) a non-line node, picking
 * the nearest of that node's four side handles. Used for live snapping while a
 * line endpoint is dragged across the canvas.
 */
export function findEndpointSnap(
  nodes: SketchNode[],
  point: SketchPoint,
  excludeId: string,
  radius = 28,
): { attachment: SketchLineAttachment; position: SketchPoint } | null {
  let best: { attachment: SketchLineAttachment; position: SketchPoint } | null = null;
  let bestDist = Infinity;

  for (const node of nodes) {
    if (node.id === excludeId || node.data.kind === "line") continue;

    const { width, height } = nodeSize(node);
    const { x, y } = getNodeAbsolutePosition(node, nodes);
    if (
      point.x < x - radius ||
      point.x > x + width + radius ||
      point.y < y - radius ||
      point.y > y + height + radius
    ) {
      continue;
    }

    for (const handleId of getShapeHandleIds(node)) {
      const handle = getNodeHandlePosition(node, handleId, nodes);
      const dist = Math.hypot(handle.x - point.x, handle.y - point.y);
      if (dist < bestDist) {
        bestDist = dist;
        best = { attachment: { nodeId: node.id, handleId }, position: handle };
      }
    }
  }

  return best;
}

export function getLineBounds(start: SketchPoint, end: SketchPoint, padding = 12) {
  const minX = Math.min(start.x, end.x) - padding;
  const minY = Math.min(start.y, end.y) - padding;
  const maxX = Math.max(start.x, end.x) + padding;
  const maxY = Math.max(start.y, end.y) + padding;
  return {
    x: minX,
    y: minY,
    width: Math.max(maxX - minX, 24),
    height: Math.max(maxY - minY, 24),
  };
}

export function absoluteToRelative(point: SketchPoint, origin: SketchPoint): SketchPoint {
  return { x: point.x - origin.x, y: point.y - origin.y };
}

function positionFromDelta(dx: number, dy: number): Position {
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? Position.Right : Position.Left;
  }
  return dy >= 0 ? Position.Bottom : Position.Top;
}

/** Length of the arrowhead spear in stroke-width units (matches the marker). */
const ARROWHEAD_LENGTH_UNITS = 4;

/**
 * Build an SVG path for a line segment in local node coordinates.
 *
 * When an end carries an arrowhead, that end is pulled back by the arrowhead's
 * length so the (thick) stroke stops at the spear's base instead of running
 * through its tip — the marker then fills base→tip, keeping the head crisp.
 */
export function buildLinePath(
  start: SketchPoint,
  end: SketchPoint,
  shape: SketchLineShape,
  options: { strokeWidth?: number; trimStart?: boolean; trimEnd?: boolean } = {},
): string {
  const { strokeWidth = 0, trimStart = false, trimEnd = false } = options;
  let source = start;
  let target = end;

  const arrowLen = ARROWHEAD_LENGTH_UNITS * strokeWidth;
  if (arrowLen > 0 && (trimStart || trimEnd)) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    // Never let the two trims cross or collapse the segment.
    const maxTrim = Math.max(len / 2 - 1, 0);
    const ts = trimStart ? Math.min(arrowLen, maxTrim) : 0;
    const te = trimEnd ? Math.min(arrowLen, maxTrim) : 0;
    source = { x: start.x + ux * ts, y: start.y + uy * ts };
    target = { x: end.x - ux * te, y: end.y - uy * te };
  }

  const sourcePosition = positionFromDelta(target.x - source.x, target.y - source.y);
  const targetPosition = positionFromDelta(source.x - target.x, source.y - target.y);
  const params = {
    sourceX: source.x,
    sourceY: source.y,
    targetX: target.x,
    targetY: target.y,
    sourcePosition,
    targetPosition,
  };

  if (shape === "curved") {
    return getBezierPath(params)[0];
  }
  if (shape === "sharp-step") {
    return getSmoothStepPath({ ...params, borderRadius: 0 })[0];
  }
  if (shape === "round-step") {
    return getSmoothStepPath({ ...params, borderRadius: 16 })[0];
  }
  return getStraightPath(params)[0];
}

export function createLineNodeFromPoints({
  id,
  startAbs,
  endAbs,
  startAttachment,
  endAttachment,
  data,
}: {
  id: string;
  startAbs: SketchPoint;
  endAbs: SketchPoint;
  startAttachment?: SketchLineAttachment | null;
  endAttachment?: SketchLineAttachment | null;
  data: SketchLineStyling;
}): SketchNode {
  const bounds = getLineBounds(startAbs, endAbs);
  return {
    id,
    type: "line",
    position: { x: bounds.x, y: bounds.y },
    width: bounds.width,
    height: bounds.height,
    selected: true,
    data: {
      ...data,
      kind: "line",
      start: absoluteToRelative(startAbs, bounds),
      end: absoluteToRelative(endAbs, bounds),
      startAttachment: startAttachment ?? null,
      endAttachment: endAttachment ?? null,
    } satisfies SketchLineNodeData,
  };
}

export function createLineBetweenNodes(
  id: string,
  sourceNode: SketchNode,
  sourceHandle: string,
  targetNode: SketchNode,
  targetHandle: string,
  data: SketchLineStyling,
  nodes: SketchNode[],
): SketchNode {
  return createLineNodeFromPoints({
    id,
    startAbs: getNodeHandlePosition(sourceNode, sourceHandle, nodes),
    endAbs: getNodeHandlePosition(targetNode, targetHandle, nodes),
    startAttachment: { nodeId: sourceNode.id, handleId: sourceHandle },
    endAttachment: { nodeId: targetNode.id, handleId: targetHandle },
    data,
  });
}

/** Move a line endpoint to an absolute canvas position, optionally clearing its attachment. */
export function repositionLineEndpoint(
  node: SketchNode,
  endpoint: "start" | "end",
  absPoint: SketchPoint,
  clearAttachment = true,
  nodes: SketchNode[] = [],
): SketchNode {
  const nodeOrigin = nodes.length
    ? getNodeAbsolutePosition(node, nodes)
    : node.position;
  const data = node.data as SketchLineNodeData;
  const startAbs = { x: nodeOrigin.x + data.start.x, y: nodeOrigin.y + data.start.y };
  const endAbs = { x: nodeOrigin.x + data.end.x, y: nodeOrigin.y + data.end.y };
  const nextStartAbs = endpoint === "start" ? absPoint : startAbs;
  const nextEndAbs = endpoint === "end" ? absPoint : endAbs;
  const bounds = getLineBounds(nextStartAbs, nextEndAbs);
  const position = nodes.length
    ? absoluteToNodePosition({ x: bounds.x, y: bounds.y }, node, nodes)
    : { x: bounds.x, y: bounds.y };

  return {
    ...node,
    position,
    width: bounds.width,
    height: bounds.height,
    data: {
      ...data,
      start: absoluteToRelative(nextStartAbs, bounds),
      end: absoluteToRelative(nextEndAbs, bounds),
      startAttachment:
        endpoint === "start" && clearAttachment ? null : (data.startAttachment ?? null),
      endAttachment: endpoint === "end" && clearAttachment ? null : (data.endAttachment ?? null),
    },
  };
}

/** Keep attached line endpoints aligned when connected nodes move. */
export function syncLineAttachments(nodes: SketchNode[]): SketchNode[] {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  return nodes.map((node) => {
    if (node.data.kind !== "line") return node;

    const data = node.data as SketchLineNodeData;
    let start = data.start;
    let end = data.end;
    let changed = false;

    if (data.startAttachment) {
      const attached = nodeById.get(data.startAttachment.nodeId);
      if (attached) {
        const abs = getNodeHandlePosition(attached, data.startAttachment.handleId, nodes);
        const lineOrigin = getNodeAbsolutePosition(node, nodes);
        const next = absoluteToRelative(abs, lineOrigin);
        if (next.x !== start.x || next.y !== start.y) {
          start = next;
          changed = true;
        }
      }
    }

    if (data.endAttachment) {
      const attached = nodeById.get(data.endAttachment.nodeId);
      if (attached) {
        const abs = getNodeHandlePosition(attached, data.endAttachment.handleId, nodes);
        const lineOrigin = getNodeAbsolutePosition(node, nodes);
        const next = absoluteToRelative(abs, lineOrigin);
        if (next.x !== end.x || next.y !== end.y) {
          end = next;
          changed = true;
        }
      }
    }

    if (!changed) return node;

    const lineOrigin = getNodeAbsolutePosition(node, nodes);
    const bounds = getLineBounds(
      { x: lineOrigin.x + start.x, y: lineOrigin.y + start.y },
      { x: lineOrigin.x + end.x, y: lineOrigin.y + end.y },
    );
    const position = absoluteToNodePosition({ x: bounds.x, y: bounds.y }, node, nodes);

    return {
      ...node,
      position,
      width: bounds.width,
      height: bounds.height,
      data: {
        ...data,
        start: absoluteToRelative(
          { x: lineOrigin.x + start.x, y: lineOrigin.y + start.y },
          bounds,
        ),
        end: absoluteToRelative(
          { x: lineOrigin.x + end.x, y: lineOrigin.y + end.y },
          bounds,
        ),
      },
    };
  });
}

/** Convert a legacy ReactFlow edge into a standalone line node. */
export function lineNodeFromLegacyEdge(
  edge: {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
    data?: Partial<SketchLineNodeData>;
  },
  nodes: SketchNode[],
  defaultData: SketchLineStyling,
): SketchNode | null {
  const sourceNode = nodes.find((node) => node.id === edge.source);
  const targetNode = nodes.find((node) => node.id === edge.target);
  if (!sourceNode || !targetNode) return null;

  const sourceHandle = edge.sourceHandle ?? "right";
  const targetHandle = edge.targetHandle ?? "left";

  return createLineBetweenNodes(
    edge.id.replace(/^edge/, "line"),
    sourceNode,
    sourceHandle,
    targetNode,
    targetHandle,
    { ...defaultData, ...edge.data },
    nodes,
  );
}
