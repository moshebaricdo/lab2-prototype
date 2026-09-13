import type { AiLabDecisionLeaf, AiLabTreeNode } from "../../../../../types/aiLab";
import { treeBranches } from "../../../../../lib/aiLab";

/** How much of a node is drawn: a full card or a compact pill. */
export type NodeSize = "card" | "pill";

export const NODE_SIZES: Record<NodeSize, { width: number; height: number }> = {
  card: { width: 184, height: 64 },
  pill: { width: 132, height: 30 },
};

export const TREE_METRICS = {
  /** Vertical gap between stacked frontier nodes. */
  rowGap: 12,
  /** Horizontal room between depths for the connector + edge label. */
  columnGap: 88,
  padding: 20,
  /** Width reserved for the edge label chip on the incoming segment. */
  edgeLabelWidth: 72,
  /** Vertical orientation: gap between leaf columns and between depths. */
  laneGap: 24,
  levelGap: 72,
} as const;

/** `horizontal` reads left→right (leaf rows); `vertical` reads top→bottom (leaf columns). */
export type TreeOrientation = "horizontal" | "vertical";

export interface LaidOutNode {
  key: string;
  node: AiLabTreeNode;
  parentKey?: string;
  /** Text on the edge from the parent (`chicken`, `≤ 3.5`). */
  branchLabel?: string;
  depth: number;
  size: NodeSize;
  width: number;
  height: number;
  /** Top-left corner in stage pixels. */
  x: number;
  y: number;
  /** Center in stage pixels (link anchors). */
  cx: number;
  cy: number;
  /** 1-based index among siblings and sibling count (ARIA). */
  posInSet: number;
  setSize: number;
  /** Children in pre-order (empty on a leaf). */
  childKeys: string[];
}

export interface TreeLink {
  sourceKey: string;
  targetKey: string;
  label: string;
}

export interface TreeLayout {
  /** Pre-order (reading order): parent before children, top to bottom. */
  nodes: LaidOutNode[];
  byKey: Map<string, LaidOutNode>;
  links: TreeLink[];
  width: number;
  height: number;
}

/**
 * "Leaf stack" layout with mixed node sizes. Every leaf owns one lane (a row
 * when horizontal, a column when vertical) sized to fit it; each decision
 * sits at the center of its children's lanes; each depth is as deep as its
 * largest node. The whole tree is always drawn — a big tree grows the stage
 * (scroll) instead of hiding branches.
 */
export function layoutTree(
  root: AiLabTreeNode,
  sizeOf: (key: string) => NodeSize,
  orientation: TreeOrientation = "horizontal",
): TreeLayout {
  const { padding } = TREE_METRICS;
  const vertical = orientation === "vertical";
  const laneGap = vertical ? TREE_METRICS.laneGap : TREE_METRICS.rowGap;
  const levelGap = vertical ? TREE_METRICS.levelGap : TREE_METRICS.columnGap;
  // Lane axis is where leaves stack; level axis is depth.
  const laneExtent = (width: number, height: number) => (vertical ? width : height);
  const levelExtent = (width: number, height: number) => (vertical ? height : width);
  const nodes: LaidOutNode[] = [];
  const links: TreeLink[] = [];
  const laneSizes: number[] = [];
  const levelSizes: number[] = [];
  const laneSpan = new Map<string, [number, number]>();

  const place = (
    node: AiLabTreeNode,
    depth: number,
    parentKey: string | undefined,
    branchLabel: string | undefined,
    posInSet: number,
    setSize: number,
  ): LaidOutNode => {
    const size = sizeOf(node.pathKey);
    const { width, height } = NODE_SIZES[size];
    levelSizes[depth] = Math.max(levelSizes[depth] ?? 0, levelExtent(width, height));
    const laid: LaidOutNode = {
      key: node.pathKey,
      node,
      parentKey,
      branchLabel,
      depth,
      size,
      width,
      height,
      x: 0,
      y: 0,
      cx: 0,
      cy: 0,
      posInSet,
      setSize,
      childKeys: [],
    };
    nodes.push(laid);

    let first: number;
    let last: number;
    if (node.type !== "decision") {
      first = last = laneSizes.length;
      laneSizes.push(laneExtent(width, height) + laneGap);
    } else {
      const branches = treeBranches(node);
      first = laneSizes.length;
      branches.forEach((branch, index) => {
        const child = place(
          branch.child,
          depth + 1,
          node.pathKey,
          branch.label,
          index + 1,
          branches.length,
        );
        laid.childKeys.push(child.key);
        links.push({
          sourceKey: node.pathKey,
          targetKey: branch.child.pathKey,
          label: branch.label,
        });
      });
      last = laneSizes.length - 1;
    }
    // A parent that spans a single lane (one visible child) must still fit.
    if (first === last) {
      laneSizes[first] = Math.max(laneSizes[first], laneExtent(width, height) + laneGap);
    }
    laneSpan.set(laid.key, [first, last]);
    return laid;
  };

  place(root, 0, undefined, undefined, 1, 1);

  const laneStarts: number[] = [];
  let laneCursor = padding;
  laneSizes.forEach((laneSize, index) => {
    laneStarts[index] = laneCursor;
    laneCursor += laneSize;
  });
  const laneCenter = (index: number) => laneStarts[index] + laneSizes[index] / 2;

  const levelStarts: number[] = [];
  let levelCursor = padding;
  levelSizes.forEach((levelSize, index) => {
    levelStarts[index] = levelCursor;
    levelCursor += levelSize + levelGap;
  });

  nodes.forEach((laid) => {
    const [first, last] = laneSpan.get(laid.key) ?? [0, 0];
    const center = (laneCenter(first) + laneCenter(last)) / 2;
    if (vertical) {
      laid.cx = center;
      laid.x = laid.cx - laid.width / 2;
      laid.y = levelStarts[laid.depth];
      laid.cy = laid.y + laid.height / 2;
    } else {
      laid.cy = center;
      laid.y = laid.cy - laid.height / 2;
      laid.x = levelStarts[laid.depth];
      laid.cx = laid.x + laid.width / 2;
    }
  });

  const laneTotal = laneCursor - laneGap + padding;
  const levelTotal = Math.max(0, levelCursor - levelGap) + padding;

  return {
    nodes,
    byKey: new Map(nodes.map((laid) => [laid.key, laid])),
    links,
    width: vertical ? laneTotal : levelTotal,
    height: vertical ? levelTotal : laneTotal,
  };
}

export interface TreeRule {
  leaf: AiLabDecisionLeaf;
  /** Ordered conditions from the root: feature id + branch label. */
  conditions: { feature: string; branchLabel: string }[];
}

/** Every root-to-leaf path as an if/then rule, in tree order. */
export function treeRules(root: AiLabTreeNode): TreeRule[] {
  const rules: TreeRule[] = [];
  const walk = (
    node: AiLabTreeNode,
    conditions: TreeRule["conditions"],
  ) => {
    if (node.type === "leaf") {
      rules.push({ leaf: node, conditions });
      return;
    }
    treeBranches(node).forEach((branch) =>
      walk(branch.child, [
        ...conditions,
        { feature: node.feature, branchLabel: branch.label },
      ]),
    );
  };
  walk(root, []);
  return rules;
}

/**
 * Orthogonal connector with rounded elbows from a source node's right edge
 * to a target node's left edge. Falls back to a straight line when the two
 * share a row.
 */
export function elbowPath(
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  radius = 8,
): string {
  const midX = sx + (tx - sx) * 0.45;
  if (Math.abs(ty - sy) < 1) return `M${sx},${sy} H${tx}`;
  const dir = ty > sy ? 1 : -1;
  const r = Math.min(radius, Math.abs(ty - sy) / 2, Math.abs(midX - sx));
  return [
    `M${sx},${sy}`,
    `H${midX - r}`,
    `Q${midX},${sy} ${midX},${sy + dir * r}`,
    `V${ty - dir * r}`,
    `Q${midX},${ty} ${midX + r},${ty}`,
    `H${tx}`,
  ].join(" ");
}

/**
 * Vertical twin of `elbowPath`: from a source node's bottom edge to a target
 * node's top edge. The horizontal run sits high so the last stub has room
 * for the edge label.
 */
export function elbowPathVertical(
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  radius = 8,
): string {
  const midY = sy + (ty - sy) * 0.45;
  if (Math.abs(tx - sx) < 1) return `M${sx},${sy} V${ty}`;
  const dir = tx > sx ? 1 : -1;
  const r = Math.min(radius, Math.abs(tx - sx) / 2, Math.abs(midY - sy));
  return [
    `M${sx},${sy}`,
    `V${midY - r}`,
    `Q${sx},${midY} ${sx + dir * r},${midY}`,
    `H${tx - dir * r}`,
    `Q${tx},${midY} ${tx},${midY + r}`,
    `V${ty}`,
  ].join(" ");
}
