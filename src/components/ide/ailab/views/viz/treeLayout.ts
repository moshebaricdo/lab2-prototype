import type { AiLabDecisionLeaf, AiLabTreeNode } from "../../../../../types/aiLab";
import { treeBranches } from "../../../../../lib/aiLab";

/**
 * How much of a node is drawn: a compact pill, a full card, or the expanded
 * detail card the student opened in place.
 */
export type NodeSize = "card" | "pill" | "detail";

export interface NodeDimensions {
  width: number;
  height: number;
}

/**
 * All three share a width so revealing the path or opening a node only
 * changes heights and nothing slides sideways; the detail card's height
 * depends on its rows (see `measure`).
 */
export const NODE_SIZES: Record<NodeSize, NodeDimensions> = {
  card: { width: 200, height: 60 },
  pill: { width: 200, height: 44 },
  detail: { width: 200, height: 118 },
};

/**
 * Several sibling leaves that predict the same label, drawn as one node so
 * a wide categorical split (a "name lookup") reads as its outcomes instead
 * of dozens of pills. The traced branch is never folded into a bundle.
 */
export interface TreeBundle {
  key: string;
  parentKey: string;
  prediction: string;
  members: { branchLabel: string; leaf: AiLabDecisionLeaf }[];
}

export interface TreeBundleOptions {
  /** Decision nodes with at least this many branches fold their leaf children. */
  minBranches: number;
  /** Bundle keys the student opened; their members are drawn individually. */
  expanded: ReadonlySet<string>;
  /**
   * Node keys on the traced path. A bundle holding one of them draws open so
   * the taken leaf sits among its siblings instead of outside its own group.
   */
  pathKeys: ReadonlySet<string>;
}

export const bundleKey = (parentKey: string, prediction: string) =>
  `${parentKey}\u0000bundle\u0000${prediction}`;

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
  /** Set when this node stands in for several same-prediction leaves. */
  bundle?: TreeBundle;
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
/** A branch as drawn: either a real child or a bundle standing in for several. */
interface DrawnBranch {
  label: string;
  child: AiLabTreeNode;
  bundle?: TreeBundle;
}

function bundledLeaf(bundle: TreeBundle): AiLabDecisionLeaf {
  const labelCounts: Record<string, number> = {};
  let sampleCount = 0;
  for (const { leaf } of bundle.members) {
    sampleCount += leaf.sampleCount;
    for (const [label, count] of Object.entries(leaf.labelCounts)) {
      labelCounts[label] = (labelCounts[label] ?? 0) + count;
    }
  }
  return {
    type: "leaf",
    pathKey: bundle.key,
    prediction: bundle.prediction,
    sampleCount,
    labelCounts,
  };
}

/**
 * The branches to draw under `node`. With bundling on and enough branches,
 * leaf children that share a prediction collapse into one bundle per label,
 * placed where the first member sat so sibling order is kept. A bundle the
 * traced path runs through (or the student opened) draws its members instead.
 */
function drawnBranches(
  node: AiLabTreeNode,
  options: TreeBundleOptions | undefined,
): DrawnBranch[] {
  const branches = treeBranches(node);
  if (!options || branches.length < options.minBranches) return branches;
  const drawn: DrawnBranch[] = [];
  const bundles = new Map<string, TreeBundle>();
  for (const branch of branches) {
    const { child } = branch;
    if (child.type !== "leaf") {
      drawn.push(branch);
      continue;
    }
    const key = bundleKey(node.pathKey, child.prediction);
    let bundle = bundles.get(key);
    if (!bundle) {
      bundle = { key, parentKey: node.pathKey, prediction: child.prediction, members: [] };
      bundles.set(key, bundle);
      drawn.push({ label: "", child, bundle });
    }
    bundle.members.push({ branchLabel: branch.label, leaf: child });
  }
  return drawn.flatMap((entry) => {
    if (!entry.bundle) return [entry];
    const { bundle } = entry;
    const open =
      options.expanded.has(bundle.key) ||
      bundle.members.some(({ leaf }) => options.pathKeys.has(leaf.pathKey));
    // A lone leaf or an open bundle draws its members as themselves.
    if (bundle.members.length < 2 || open) {
      return bundle.members.map(({ branchLabel, leaf }) => ({ label: branchLabel, child: leaf }));
    }
    return [
      {
        label: `${bundle.members.length} branches`,
        child: bundledLeaf(bundle),
        bundle,
      },
    ];
  });
}

export function layoutTree(
  root: AiLabTreeNode,
  sizeOf: (key: string) => NodeSize,
  orientation: TreeOrientation = "horizontal",
  bundling?: TreeBundleOptions,
  /** Pixel box for a node at a size; defaults to `NODE_SIZES`. */
  measure: (
    node: AiLabTreeNode,
    size: NodeSize,
    bundle: TreeBundle | undefined,
  ) => NodeDimensions = (_, size) => NODE_SIZES[size],
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
    bundle: TreeBundle | undefined,
  ): LaidOutNode => {
    const size = sizeOf(node.pathKey);
    const { width, height } = measure(node, size, bundle);
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
      bundle,
    };
    nodes.push(laid);

    let first: number;
    let last: number;
    if (node.type !== "decision") {
      first = last = laneSizes.length;
      laneSizes.push(laneExtent(width, height) + laneGap);
    } else {
      const branches = drawnBranches(node, bundling);
      first = laneSizes.length;
      branches.forEach((branch, index) => {
        const child = place(
          branch.child,
          depth + 1,
          node.pathKey,
          branch.label,
          index + 1,
          branches.length,
          branch.bundle,
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

  place(root, 0, undefined, undefined, 1, 1, undefined);

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
