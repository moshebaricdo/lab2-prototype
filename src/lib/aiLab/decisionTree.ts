import type {
  AiLabColumn,
  AiLabDataRow,
  AiLabTreeNode,
  AiLabTreeTrace,
} from "../../types/aiLab";
import { columnType, formatNumber } from "./columnStats";

const MAX_DEPTH = 3;

function labelsFor(rows: AiLabDataRow[], labelColumn: string): string[] {
  return rows.map((row) => String(row[labelColumn]));
}

function labelCounts(labels: string[]): Record<string, number> {
  return labels.reduce<Record<string, number>>((counts, label) => {
    counts[label] = (counts[label] ?? 0) + 1;
    return counts;
  }, {});
}

function labelCountsMap(labels: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const label of labels) counts.set(label, (counts.get(label) ?? 0) + 1);
  return counts;
}

function majorityLabel(labels: string[]): string {
  return (
    Object.entries(labelCounts(labels)).sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    )[0]?.[0] ?? ""
  );
}

function gini(labels: string[]): number {
  const total = labels.length;
  if (total === 0) return 0;
  return (
    1 -
    Object.values(labelCounts(labels)).reduce((sum, count) => {
      const probability = count / total;
      return sum + probability * probability;
    }, 0)
  );
}

function giniFromCounts(counts: Map<string, number>, total: number): number {
  if (total === 0) return 0;
  let sum = 0;
  for (const count of counts.values()) {
    const probability = count / total;
    sum += probability * probability;
  }
  return 1 - sum;
}

function weightedGiniFromCounts(
  groups: { counts: Map<string, number>; size: number }[],
  total: number,
): number {
  let sum = 0;
  for (const group of groups) {
    if (group.size === 0) continue;
    sum += (group.size / total) * giniFromCounts(group.counts, group.size);
  }
  return sum;
}

function leaf(
  rows: AiLabDataRow[],
  labelColumn: string,
  pathKey: string,
): AiLabTreeNode {
  const labels = labelsFor(rows, labelColumn);
  return {
    type: "leaf",
    pathKey,
    prediction: majorityLabel(labels),
    sampleCount: rows.length,
    labelCounts: labelCounts(labels),
  };
}

function bestCategoricalSplit(
  rows: AiLabDataRow[],
  feature: string,
  labelColumn: string,
): { values: string[]; impurityReduction: number } | null {
  // One pass: group label counts by feature value (insertion order keeps the
  // first-seen order the old `Set` produced).
  const groups = new Map<string, { counts: Map<string, number>; size: number }>();
  for (const row of rows) {
    const value = String(row[feature]);
    let group = groups.get(value);
    if (!group) {
      group = { counts: new Map(), size: 0 };
      groups.set(value, group);
    }
    const label = String(row[labelColumn]);
    group.counts.set(label, (group.counts.get(label) ?? 0) + 1);
    group.size += 1;
  }
  if (groups.size < 2) return null;
  const impurityReduction =
    gini(labelsFor(rows, labelColumn)) -
    weightedGiniFromCounts([...groups.values()], rows.length);
  return impurityReduction > 0
    ? { values: [...groups.keys()], impurityReduction }
    : null;
}

function bestNumericalSplit(
  rows: AiLabDataRow[],
  feature: string,
  labelColumn: string,
): { threshold: number; impurityReduction: number } | null {
  const sorted = [...rows].sort(
    (a, b) => Number(a[feature]) - Number(b[feature]),
  );
  let best: { threshold: number; impurityReduction: number } | null = null;
  const labels = labelsFor(sorted, labelColumn);
  const total = sorted.length;
  const rightCounts = labelCountsMap(labels);
  const parent = giniFromCounts(rightCounts, total);
  const leftCounts = new Map<string, number>();

  // Single sweep: move rows from the right group to the left one in sorted
  // order and evaluate each distinct-value boundary from running counts.
  for (let index = 1; index < total; index += 1) {
    const label = labels[index - 1];
    leftCounts.set(label, (leftCounts.get(label) ?? 0) + 1);
    const remaining = (rightCounts.get(label) ?? 0) - 1;
    if (remaining === 0) rightCounts.delete(label);
    else rightCounts.set(label, remaining);

    const previous = Number(sorted[index - 1][feature]);
    const current = Number(sorted[index][feature]);
    if (previous === current) continue;
    const threshold = (previous + current) / 2;
    const impurityReduction =
      parent -
      weightedGiniFromCounts(
        [
          { counts: leftCounts, size: index },
          { counts: rightCounts, size: total - index },
        ],
        total,
      );
    if (!best || impurityReduction > best.impurityReduction) {
      best = { threshold, impurityReduction };
    }
  }

  return best && best.impurityReduction > 0 ? best : null;
}

function buildTree(
  rows: AiLabDataRow[],
  columns: AiLabColumn[],
  features: string[],
  labelColumn: string,
  depth: number,
  pathKey: string,
): AiLabTreeNode {
  const labels = labelsFor(rows, labelColumn);
  if (
    rows.length === 0 ||
    depth >= MAX_DEPTH ||
    features.length === 0 ||
    new Set(labels).size <= 1
  ) {
    return leaf(rows, labelColumn, pathKey);
  }

  let bestFeature: string | null = null;
  let bestReduction = 0;
  let categoricalValues: string[] | null = null;
  let numericalThreshold: number | null = null;

  features.forEach((feature) => {
    if (columnType(columns, feature) === "numerical") {
      const split = bestNumericalSplit(rows, feature, labelColumn);
      if (split && split.impurityReduction > bestReduction) {
        bestFeature = feature;
        bestReduction = split.impurityReduction;
        categoricalValues = null;
        numericalThreshold = split.threshold;
      }
      return;
    }

    const split = bestCategoricalSplit(rows, feature, labelColumn);
    if (split && split.impurityReduction > bestReduction) {
      bestFeature = feature;
      bestReduction = split.impurityReduction;
      categoricalValues = split.values;
      numericalThreshold = null;
    }
  });

  if (!bestFeature) {
    return leaf(rows, labelColumn, pathKey);
  }

  const remaining = features.filter((feature) => feature !== bestFeature);

  if (numericalThreshold !== null) {
    const leftRows = rows.filter(
      (row) => Number(row[bestFeature]) <= numericalThreshold,
    );
    const rightRows = rows.filter(
      (row) => Number(row[bestFeature]) > numericalThreshold,
    );
    return {
      type: "decision",
      pathKey,
      feature: bestFeature,
      splitType: "numerical",
      threshold: numericalThreshold,
      sampleCount: rows.length,
      labelCounts: labelCounts(labels),
      impurityReduction: bestReduction,
      left: buildTree(
        leftRows,
        columns,
        remaining,
        labelColumn,
        depth + 1,
        `${pathKey}.0`,
      ),
      right: buildTree(
        rightRows,
        columns,
        remaining,
        labelColumn,
        depth + 1,
        `${pathKey}.1`,
      ),
    };
  }

  const values = categoricalValues ?? [];
  return {
    type: "decision",
    pathKey,
    feature: bestFeature,
    splitType: "categorical",
    sampleCount: rows.length,
    labelCounts: labelCounts(labels),
    impurityReduction: bestReduction,
    children: Object.fromEntries(
      values.map((value, index) => [
        value,
        buildTree(
          rows.filter((row) => String(row[bestFeature]) === value),
          columns,
          remaining,
          labelColumn,
          depth + 1,
          `${pathKey}.${index}`,
        ),
      ]),
    ),
  };
}

export function trainDecisionTree(
  rows: AiLabDataRow[],
  columns: AiLabColumn[],
  features: string[],
  labelColumn: string,
): AiLabTreeNode {
  return buildTree(rows, columns, features, labelColumn, 0, "root");
}

/** One question the trainer tried at a node, scored the way `buildTree` scores it. */
export interface AiLabSplitCandidate {
  feature: string;
  splitType: "numerical" | "categorical";
  threshold?: number;
  /** The piles it would make, in the order the tree would draw them. */
  branches: { label: string; counts: Record<string, number>; size: number }[];
  impurityReduction: number;
  /** Share of the pile's mix it removes: 0 = no help, 1 = every pile one label. */
  sortedShare: number;
}

export interface AiLabNodeCandidates {
  /** Questions that split the pile at all, in feature order. */
  candidates: AiLabSplitCandidate[];
  /** Index into `candidates` of the question the node asks. */
  best: number;
  /** Features the trainer looked at here (some may not split this pile). */
  checked: number;
}

function scoreCandidate(
  rows: AiLabDataRow[],
  columns: AiLabColumn[],
  feature: string,
  labelColumn: string,
  parentGini: number,
): AiLabSplitCandidate | null {
  const share = (reduction: number) => (parentGini > 0 ? reduction / parentGini : 0);
  if (columnType(columns, feature) === "numerical") {
    const split = bestNumericalSplit(rows, feature, labelColumn);
    if (!split) return null;
    const left = rows.filter((row) => Number(row[feature]) <= split.threshold);
    const right = rows.filter((row) => Number(row[feature]) > split.threshold);
    return {
      feature,
      splitType: "numerical",
      threshold: split.threshold,
      branches: [
        { label: `≤ ${formatNumber(split.threshold)}`, counts: labelCounts(labelsFor(left, labelColumn)), size: left.length },
        { label: `> ${formatNumber(split.threshold)}`, counts: labelCounts(labelsFor(right, labelColumn)), size: right.length },
      ],
      impurityReduction: split.impurityReduction,
      sortedShare: share(split.impurityReduction),
    };
  }
  const split = bestCategoricalSplit(rows, feature, labelColumn);
  if (!split) return null;
  return {
    feature,
    splitType: "categorical",
    branches: split.values.map((value) => {
      const group = rows.filter((row) => String(row[feature]) === value);
      return { label: value, counts: labelCounts(labelsFor(group, labelColumn)), size: group.length };
    }),
    impurityReduction: split.impurityReduction,
    sortedShare: share(split.impurityReduction),
  };
}

/**
 * Every question the trainer tried at each decision node of `tree` (keyed
 * by `pathKey`), replaying `buildTree`'s search: the same rows reach each
 * node, a feature used above isn't tried again, and the node's own feature
 * is the best. Lets a viz show the search instead of just its winner.
 */
export function treeSplitCandidates(
  tree: AiLabTreeNode,
  rows: AiLabDataRow[],
  columns: AiLabColumn[],
  features: string[],
  labelColumn: string,
): Map<string, AiLabNodeCandidates> {
  const byNode = new Map<string, AiLabNodeCandidates>();
  const visit = (node: AiLabTreeNode, nodeRows: AiLabDataRow[], available: string[]) => {
    if (node.type === "leaf") return;
    const parentGini = gini(labelsFor(nodeRows, labelColumn));
    const candidates = available
      .map((feature) => scoreCandidate(nodeRows, columns, feature, labelColumn, parentGini))
      .filter((candidate): candidate is AiLabSplitCandidate => candidate !== null);
    byNode.set(node.pathKey, {
      candidates,
      best: Math.max(0, candidates.findIndex((candidate) => candidate.feature === node.feature)),
      checked: available.length,
    });
    const remaining = available.filter((feature) => feature !== node.feature);
    if (node.splitType === "numerical") {
      visit(node.left, nodeRows.filter((row) => Number(row[node.feature]) <= node.threshold), remaining);
      visit(node.right, nodeRows.filter((row) => Number(row[node.feature]) > node.threshold), remaining);
      return;
    }
    Object.entries(node.children).forEach(([value, child]) =>
      visit(child, nodeRows.filter((row) => String(row[node.feature]) === value), remaining),
    );
  };
  visit(tree, rows, features);
  return byNode;
}

export function traceDecisionTree(
  root: AiLabTreeNode,
  row: AiLabDataRow,
): AiLabTreeTrace {
  const pathKeys = ["root"];
  const steps: AiLabTreeTrace["steps"] = [];
  let node = root;

  while (node.type === "decision") {
    if (node.splitType === "numerical") {
      const value = Number(row[node.feature]);
      const goLeft = value <= node.threshold;
      const next = goLeft ? node.left : node.right;
      steps.push({
        pathKey: node.pathKey,
        feature: node.feature,
        value,
        branchLabel: goLeft
          ? `≤ ${formatNumber(node.threshold)}`
          : `> ${formatNumber(node.threshold)}`,
      });
      pathKeys.push(next.pathKey);
      node = next;
      continue;
    }

    const value = String(row[node.feature]);
    const next = node.children[value] ?? Object.values(node.children)[0];
    steps.push({
      pathKey: node.pathKey,
      feature: node.feature,
      value,
      branchLabel: value,
    });
    pathKeys.push(next.pathKey);
    node = next;
  }

  return {
    prediction: node.prediction,
    pathKeys,
    steps,
  };
}

export interface AiLabTreeBranch {
  /** Text on the edge into this child (`chicken`, `≤ 3.5`). */
  label: string;
  child: AiLabTreeNode;
}

/** Ordered outgoing branches of a decision node, with their edge labels. */
export function treeBranches(node: AiLabTreeNode): AiLabTreeBranch[] {
  if (node.type === "leaf") return [];
  if (node.splitType === "numerical") {
    return [
      { label: `≤ ${formatNumber(node.threshold)}`, child: node.left },
      { label: `> ${formatNumber(node.threshold)}`, child: node.right },
    ];
  }
  return Object.entries(node.children).map(([label, child]) => ({
    label,
    child,
  }));
}

/**
 * Sheet row indexes per node key: each row is listed on every node of its
 * path, so a decision node holds the union of its children. Pass
 * `rowIndexes` to count a subset (the reserved test rows) instead of the
 * whole sheet.
 */
export function rowsByNode(
  root: AiLabTreeNode,
  rows: AiLabDataRow[],
  rowIndexes?: number[],
): Map<string, number[]> {
  const byNode = new Map<string, number[]>();
  const indexes = rowIndexes ?? rows.map((_, index) => index);
  for (const rowIndex of indexes) {
    const row = rows[rowIndex];
    if (!row) continue;
    traceDecisionTree(root, row).pathKeys.forEach((key) => {
      const list = byNode.get(key);
      if (list) list.push(rowIndex);
      else byNode.set(key, [rowIndex]);
    });
  }
  return byNode;
}

/** How many of a chosen set of rows reached a node, and how many a leaf got right. */
export interface AiLabNodeVisits {
  total: number;
  /** Rows at a leaf whose label matches its prediction. Always 0 on a question. */
  correct: number;
}

/**
 * Trace `rowIndexes` through the tree. Every node on a row's path counts
 * it; only the leaf it lands on can count it correct.
 */
export function nodeVisits(
  root: AiLabTreeNode,
  rows: AiLabDataRow[],
  rowIndexes: number[],
  labelColumn: string,
): Map<string, AiLabNodeVisits> {
  const visits = new Map<string, AiLabNodeVisits>();
  const add = (key: string, correct: boolean) => {
    const current = visits.get(key) ?? { total: 0, correct: 0 };
    current.total += 1;
    if (correct) current.correct += 1;
    visits.set(key, current);
  };
  for (const rowIndex of rowIndexes) {
    const row = rows[rowIndex];
    if (!row) continue;
    const trace = traceDecisionTree(root, row);
    const leafKey = trace.pathKeys[trace.pathKeys.length - 1];
    const correct = String(row[labelColumn] ?? "") === trace.prediction;
    for (const key of trace.pathKeys) add(key, key === leafKey && correct);
  }
  return visits;
}

export interface AiLabTreeCondition {
  feature: string;
  branchLabel: string;
}

/** The node at `key` and the branch taken at each question above it. */
export function findTreeNode(
  root: AiLabTreeNode,
  key: string,
): { node: AiLabTreeNode; conditions: AiLabTreeCondition[] } | undefined {
  const visit = (
    node: AiLabTreeNode,
    conditions: AiLabTreeCondition[],
  ): { node: AiLabTreeNode; conditions: AiLabTreeCondition[] } | undefined => {
    if (node.pathKey === key) return { node, conditions };
    if (node.type === "leaf") return undefined;
    for (const branch of treeBranches(node)) {
      const found = visit(branch.child, [
        ...conditions,
        { feature: node.feature, branchLabel: branch.label },
      ]);
      if (found) return found;
    }
    return undefined;
  };
  return visit(root, []);
}

export interface AiLabTreeSummary {
  decisions: number;
  leaves: number;
  /** Number of edges on the longest root-to-leaf path. */
  depth: number;
}

export function summarizeTree(root: AiLabTreeNode): AiLabTreeSummary {
  let decisions = 0;
  let leaves = 0;
  let depth = 0;
  const visit = (node: AiLabTreeNode, level: number) => {
    depth = Math.max(depth, level);
    if (node.type === "leaf") {
      leaves += 1;
      return;
    }
    decisions += 1;
    treeBranches(node).forEach((branch) => visit(branch.child, level + 1));
  };
  visit(root, 0);
  return { decisions, leaves, depth };
}

/** Leaves under a node (1 for a leaf). Used by collapsed-subtree summaries. */
export function countLeaves(node: AiLabTreeNode): number {
  if (node.type === "leaf") return 1;
  return treeBranches(node).reduce(
    (sum, branch) => sum + countLeaves(branch.child),
    0,
  );
}

/** Distinct predictions reachable under a node. */
export function subtreePredictions(node: AiLabTreeNode): string[] {
  const seen = new Set<string>();
  const visit = (current: AiLabTreeNode) => {
    if (current.type === "leaf") {
      seen.add(current.prediction);
      return;
    }
    treeBranches(current).forEach((branch) => visit(branch.child));
  };
  visit(node);
  return [...seen];
}
