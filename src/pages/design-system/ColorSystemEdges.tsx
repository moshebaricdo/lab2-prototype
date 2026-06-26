import { BaseEdge, type EdgeProps } from "@xyflow/react";

export type GutterEdgeData = {
  gutterY: number;
};

const CORNER_RADIUS = 6;

/** Orthogonal path with a fixed horizontal segment in the primitive/semantic gutter. */
export function buildGutterPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  gutterY: number,
  cornerRadius = CORNER_RADIUS,
): string {
  if (Math.abs(sourceX - targetX) < 0.5) {
    return `M ${sourceX},${sourceY} L ${sourceX},${gutterY} L ${targetX},${targetY}`;
  }

  const hDir = Math.sign(targetX - sourceX);
  const radius = Math.min(
    cornerRadius,
    Math.max(0, gutterY - sourceY),
    Math.max(0, targetY - gutterY),
    Math.abs(targetX - sourceX) / 2,
  );

  if (radius < 0.5) {
    return `M ${sourceX},${sourceY} L ${sourceX},${gutterY} L ${targetX},${gutterY} L ${targetX},${targetY}`;
  }

  return [
    `M ${sourceX},${sourceY}`,
    `L ${sourceX},${gutterY - radius}`,
    `Q ${sourceX},${gutterY} ${sourceX + hDir * radius},${gutterY}`,
    `L ${targetX - hDir * radius},${gutterY}`,
    `Q ${targetX},${gutterY} ${targetX},${gutterY + radius}`,
    `L ${targetX},${targetY}`,
  ].join(" ");
}

export function GutterEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  style,
  markerEnd,
}: EdgeProps) {
  const gutterY =
    typeof data === "object" &&
    data !== null &&
    "gutterY" in data &&
    typeof data.gutterY === "number"
      ? data.gutterY
      : (sourceY + targetY) / 2;

  const path = buildGutterPath(sourceX, sourceY, targetX, targetY, gutterY);

  return <BaseEdge id={id} path={path} style={style} markerEnd={markerEnd} />;
}

export const colorSystemEdgeTypes = {
  gutter: GutterEdge,
};
