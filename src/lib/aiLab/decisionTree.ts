import { DecisionTreeClassifier, DecisionTreeRegression } from "ml-cart";
import type { CartNode } from "ml-cart";
import type {
  AiLabColumn,
  AiLabDataRow,
  AiLabTreeNode,
  AiLabTreeTrace,
} from "../../types/aiLab";
import { columnType } from "./columnStats";

/**
 * Production AI Lab trains with `ml-cart` 2.1.1 (`DecisionTreeTrainer`).
 * The lab never grows a tree past these depths; a tie on the held-out rows
 * keeps the shallowest one, and an empty holdout trains only depth 1.
 */
export const CART_MAX_DEPTHS = [1, 2, 3, 5, 8] as const;

/** Deepest depth the lab will consider. Direct `trainDecisionTree` calls use it. */
const DEFAULT_MAX_DEPTH = CART_MAX_DEPTHS[CART_MAX_DEPTHS.length - 1]!;

const orList = new Intl.ListFormat("en", { type: "disjunction" });

interface CategoryCodes {
  [columnId: string]: Record<string, number>;
}

interface EncodedSheet {
  regression: boolean;
  codes: CategoryCodes;
  labelByCode: string[];
  matrix: number[][];
  labels: number[];
}

export interface TrainDecisionTreeOptions {
  /** CART `maxDepth`. Defaults to 8, the deepest depth production tries. */
  maxDepth?: number;
  /**
   * Rows the category codes are taken from. Production numbers categories
   * on the whole sheet, then fits the tree on the rows that remain after
   * the holdout is removed. Defaults to `rows`.
   */
  encodingRows?: AiLabDataRow[];
}

function categoryCodes(rows: AiLabDataRow[], columnId: string): Record<string, number> {
  const seen: (string | number)[] = [];
  const included = new Set<string | number>();
  for (const row of rows) {
    const option = row[columnId];
    if (option === undefined || option === "") continue;
    if (included.has(option)) continue;
    included.add(option);
    seen.push(option);
  }
  const codes: Record<string, number> = {};
  seen.forEach((option) => {
    codes[String(option)] = seen.indexOf(option);
  });
  return codes;
}

function encodeCell(
  value: string | number | undefined,
  columnId: string,
  columns: AiLabColumn[],
  codes: CategoryCodes,
): number {
  if (columnType(columns, columnId) === "numerical") {
    return parseFloat(String(value));
  }
  const code = codes[columnId]?.[String(value)];
  return code === undefined ? Number.NaN : code;
}

function encodeSheet(
  rows: AiLabDataRow[],
  columns: AiLabColumn[],
  features: string[],
  labelColumn: string,
  encodingRows: AiLabDataRow[],
): EncodedSheet {
  const regression = columnType(columns, labelColumn) === "numerical";
  const codes: CategoryCodes = {};
  const categorical = regression ? features : [...features, labelColumn];
  for (const columnId of categorical) {
    if (columnType(columns, columnId) === "categorical") {
      codes[columnId] = categoryCodes(encodingRows, columnId);
    }
  }
  const labelByCode: string[] = [];
  if (!regression) {
    for (const [label, code] of Object.entries(codes[labelColumn] ?? {})) {
      labelByCode[code] = label;
    }
  }
  return {
    regression,
    codes,
    labelByCode,
    matrix: rows.map((row) =>
      features.map((feature) => encodeCell(row[feature], feature, columns, codes)),
    ),
    labels: rows.map((row) =>
      regression
        ? parseFloat(String(row[labelColumn]))
        : encodeCell(row[labelColumn], labelColumn, columns, codes),
    ),
  };
}

function labelCounts(labels: string[]): Record<string, number> {
  return labels.reduce<Record<string, number>>((counts, label) => {
    counts[label] = (counts[label] ?? 0) + 1;
    return counts;
  }, {});
}

function countsFor(rows: AiLabDataRow[], labelColumn: string): Record<string, number> {
  return labelCounts(rows.map((row) => String(row[labelColumn] ?? "")));
}

/** Same rounding the production tree uses on a regression leaf. */
export function formatRegressionPrediction(value: number): string {
  return String(Number(value.toFixed(2)));
}

/** Unrounded, so the threshold stays on the correct side of a student's input. */
export function thresholdText(threshold: number): string {
  return String(Number(threshold.toPrecision(12)));
}

function valueList(values: string[]): string {
  return values.length === 0 ? "" : orList.format(values);
}

function sortValues(values: string[]): string[] {
  return [...values].sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
}

function classIndex(distribution: { getRow(row: number): number[] }): number {
  const probabilities = distribution.getRow(0);
  let best = 0;
  for (let index = 1; index < probabilities.length; index += 1) {
    if (probabilities[index]! > probabilities[best]!) best = index;
  }
  return best;
}

function leafFromModel(
  node: CartNode,
  rows: AiLabDataRow[],
  labelColumn: string,
  labelByCode: string[],
  regression: boolean,
  pathKey: string,
): AiLabTreeNode {
  const counts = countsFor(rows, labelColumn);
  if (regression) {
    const mean = typeof node.distribution === "number" ? node.distribution : 0;
    return {
      type: "leaf",
      pathKey,
      prediction: formatRegressionPrediction(mean),
      rawPrediction: mean,
      sampleCount: rows.length,
      labelCounts: counts,
    };
  }
  const distribution = node.distribution;
  const index =
    distribution && typeof distribution === "object" ? classIndex(distribution) : 0;
  return {
    type: "leaf",
    pathKey,
    prediction: labelByCode[index] ?? String(index),
    sampleCount: rows.length,
    labelCounts: counts,
  };
}

function emptyLeaf(pathKey: string): AiLabTreeNode {
  return {
    type: "leaf",
    pathKey,
    prediction: "",
    sampleCount: 0,
    labelCounts: {},
  };
}

function valuesOnSide(
  values: string[],
  codes: Record<string, number>,
  threshold: number,
  side: "left" | "right",
): string[] {
  return sortValues(
    values.filter((value) => {
      const code = codes[value];
      if (code === undefined) return false;
      return side === "left" ? code < threshold : code >= threshold;
    }),
  );
}

function buildDisplay(
  node: CartNode,
  rows: AiLabDataRow[],
  matrix: number[][],
  features: string[],
  columns: AiLabColumn[],
  labelColumn: string,
  codes: CategoryCodes,
  labelByCode: string[],
  regression: boolean,
  valuesByColumn: Record<string, string[]>,
  pathKey: string,
): AiLabTreeNode {
  if (!node.left || !node.right || node.splitColumn === undefined || node.splitValue === undefined) {
    return leafFromModel(node, rows, labelColumn, labelByCode, regression, pathKey);
  }

  const column = node.splitColumn;
  const threshold = node.splitValue;
  const feature = features[column] ?? "";
  const leftRows: AiLabDataRow[] = [];
  const rightRows: AiLabDataRow[] = [];
  const leftMatrix: number[][] = [];
  const rightMatrix: number[][] = [];
  rows.forEach((row, index) => {
    const encoded = matrix[index]?.[column] ?? Number.NaN;
    if (encoded < threshold) {
      leftRows.push(row);
      leftMatrix.push(matrix[index] ?? []);
    } else {
      rightRows.push(row);
      rightMatrix.push(matrix[index] ?? []);
    }
  });

  const categorical = columnType(columns, feature) === "categorical";
  const currentValues = valuesByColumn[feature] ?? [];
  const featureCodes = codes[feature] ?? {};
  const leftValues = categorical
    ? valuesOnSide(currentValues, featureCodes, threshold, "left")
    : undefined;
  const rightValues = categorical
    ? valuesOnSide(currentValues, featureCodes, threshold, "right")
    : undefined;
  const nextValues = categorical
    ? { ...valuesByColumn, [feature]: leftValues ?? [] }
    : valuesByColumn;
  const rightValuesByColumn = categorical
    ? { ...valuesByColumn, [feature]: rightValues ?? [] }
    : valuesByColumn;

  return {
    type: "decision",
    pathKey,
    feature,
    splitType: categorical ? "categorical" : "numerical",
    threshold,
    leftValues,
    rightValues,
    sampleCount: rows.length,
    labelCounts: countsFor(rows, labelColumn),
    impurityReduction: node.gain ?? 0,
    left: buildDisplay(
      node.left,
      leftRows,
      leftMatrix,
      features,
      columns,
      labelColumn,
      codes,
      labelByCode,
      regression,
      nextValues,
      `${pathKey}.0`,
    ),
    right: buildDisplay(
      node.right,
      rightRows,
      rightMatrix,
      features,
      columns,
      labelColumn,
      codes,
      labelByCode,
      regression,
      rightValuesByColumn,
      `${pathKey}.1`,
    ),
  };
}

export function trainDecisionTree(
  rows: AiLabDataRow[],
  columns: AiLabColumn[],
  features: string[],
  labelColumn: string,
  options: TrainDecisionTreeOptions = {},
): AiLabTreeNode {
  if (rows.length === 0) return emptyLeaf("root");
  const encodingRows = options.encodingRows ?? rows;
  const encoded = encodeSheet(rows, columns, features, labelColumn, encodingRows);
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
  const model = encoded.regression
    ? new DecisionTreeRegression({ maxDepth })
    : new DecisionTreeClassifier({ maxDepth });
  model.train(encoded.matrix, encoded.labels);
  const valuesByColumn: Record<string, string[]> = {};
  for (const feature of features) {
    const codes = encoded.codes[feature];
    if (codes) valuesByColumn[feature] = Object.keys(codes);
  }
  return buildDisplay(
    model.root,
    rows,
    encoded.matrix,
    features,
    columns,
    labelColumn,
    encoded.codes,
    encoded.labelByCode,
    encoded.regression,
    valuesByColumn,
    "root",
  );
}

/** One question the trainer tried at a node, scored the way CART scores it. */
export interface AiLabSplitCandidate {
  feature: string;
  splitType: "numerical" | "categorical";
  threshold?: number;
  /** The two piles CART would make, left then right. */
  branches: { label: string; counts: Record<string, number>; size: number }[];
  impurityReduction: number;
  /** Share of the pile's mix it removes: 0 = no help, 1 = every pile pure. */
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

function squaredError(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.reduce((sum, value) => sum + (value - mean) ** 2, 0);
}

function giniImpurity(labels: number[]): number {
  if (labels.length === 0) return 0;
  const classes = labels.reduce((max, label) => Math.max(max, label + 1), 0);
  if (!Number.isFinite(classes) || classes <= 0) return 0;
  const counts = new Array<number>(classes).fill(0);
  for (const label of labels) {
    if (Number.isInteger(label) && label >= 0 && label < classes) {
      counts[label] = (counts[label] ?? 0) + 1 / labels.length;
    }
  }
  const sum = counts.reduce((total, probability) => total + probability * probability, 0);
  return 1 - sum;
}

function splitLabels(
  values: number[],
  labels: number[],
  threshold: number,
): { left: number[]; right: number[] } {
  const left: number[] = [];
  const right: number[] = [];
  values.forEach((value, index) => {
    const label = labels[index]!;
    if (value < threshold) left.push(label);
    else right.push(label);
  });
  return { left, right };
}

function bestThreshold(
  values: number[],
  labels: number[],
  regression: boolean,
): { threshold: number; gain: number } | null {
  const pairs = values.map((value, index) => [value, labels[index]!] as const);
  pairs.sort((a, b) => a[0] - b[0]);
  let best: { threshold: number; gain: number } | null = null;
  for (let index = 1; index < pairs.length; index += 1) {
    if (pairs[index - 1]![1] === pairs[index]![1]) continue;
    const threshold = (pairs[index - 1]![0] + pairs[index]![0]) / 2;
    const { left, right } = splitLabels(values, labels, threshold);
    if (left.length === 0 || right.length === 0) continue;
    const gain = regression
      ? squaredError(left) + squaredError(right)
      : giniImpurity(labels) -
        (giniImpurity(left) * left.length + giniImpurity(right) * right.length) / labels.length;
    const better = regression
      ? !best || gain < best.gain
      : !best || gain > best.gain;
    if (better) best = { threshold, gain };
  }
  return best;
}

function scoreCandidate(
  rows: AiLabDataRow[],
  matrix: number[][],
  featureIndex: number,
  feature: string,
  columns: AiLabColumn[],
  labelColumn: string,
  codes: CategoryCodes,
  values: string[],
  regression: boolean,
  parentScore: number,
): AiLabSplitCandidate | null {
  const column = matrix.map((row) => row[featureIndex] ?? Number.NaN);
  const labels = rows.map((row) =>
    regression
      ? parseFloat(String(row[labelColumn]))
      : (codes[labelColumn]?.[String(row[labelColumn])] ?? Number.NaN),
  );
  const split = bestThreshold(column, labels, regression);
  if (!split) return null;
  const leftRows = rows.filter((_, index) => column[index]! < split.threshold);
  const rightRows = rows.filter((_, index) => column[index]! >= split.threshold);
  const categorical = columnType(columns, feature) === "categorical";
  const featureCodes = codes[feature] ?? {};
  const branches = categorical
    ? [
        valuesOnSide(values, featureCodes, split.threshold, "left"),
        valuesOnSide(values, featureCodes, split.threshold, "right"),
      ].map((side, index) => {
        const group = index === 0 ? leftRows : rightRows;
        return {
          label: valueList(side),
          counts: countsFor(group, labelColumn),
          size: group.length,
        };
      })
    : [
        {
          label: `< ${thresholdText(split.threshold)}`,
          counts: countsFor(leftRows, labelColumn),
          size: leftRows.length,
        },
        {
          label: `≥ ${thresholdText(split.threshold)}`,
          counts: countsFor(rightRows, labelColumn),
          size: rightRows.length,
        },
      ];
  const sortedShare = regression
    ? parentScore > 0
      ? Math.max(0, (parentScore - split.gain) / parentScore)
      : 0
    : parentScore > 0
      ? split.gain / parentScore
      : 0;
  return {
    feature,
    splitType: categorical ? "categorical" : "numerical",
    threshold: split.threshold,
    branches,
    impurityReduction: split.gain,
    sortedShare,
  };
}

/**
 * Every question CART tried at each decision node of `tree` (keyed by
 * `pathKey`). A feature used above can be tried again. The node's own
 * feature is the one the finished tree asks.
 */
export function treeSplitCandidates(
  tree: AiLabTreeNode,
  rows: AiLabDataRow[],
  columns: AiLabColumn[],
  features: string[],
  labelColumn: string,
): Map<string, AiLabNodeCandidates> {
  const encoded = encodeSheet(rows, columns, features, labelColumn, rows);
  const valuesByColumn: Record<string, string[]> = {};
  for (const feature of features) {
    const codes = encoded.codes[feature];
    if (codes) valuesByColumn[feature] = Object.keys(codes);
  }
  const byNode = new Map<string, AiLabNodeCandidates>();
  const visit = (
    node: AiLabTreeNode,
    nodeRows: AiLabDataRow[],
    matrix: number[][],
    availableValues: Record<string, string[]>,
  ) => {
    if (node.type === "leaf") return;
    const parentLabels = nodeRows.map((row) =>
      encoded.regression
        ? parseFloat(String(row[labelColumn]))
        : (encoded.codes[labelColumn]?.[String(row[labelColumn])] ?? Number.NaN),
    );
    const parentScore = encoded.regression
      ? squaredError(parentLabels)
      : giniImpurity(parentLabels);
    const candidates = features
      .map((feature, index) =>
        scoreCandidate(
          nodeRows,
          matrix,
          index,
          feature,
          columns,
          labelColumn,
          encoded.codes,
          availableValues[feature] ?? [],
          encoded.regression,
          parentScore,
        ),
      )
      .filter((candidate): candidate is AiLabSplitCandidate => candidate !== null);
    byNode.set(node.pathKey, {
      candidates,
      best: Math.max(0, candidates.findIndex((candidate) => candidate.feature === node.feature)),
      checked: features.length,
    });
    const column = features.indexOf(node.feature);
    const leftRows: AiLabDataRow[] = [];
    const rightRows: AiLabDataRow[] = [];
    const leftMatrix: number[][] = [];
    const rightMatrix: number[][] = [];
    nodeRows.forEach((row, index) => {
      const value = matrix[index]?.[column] ?? Number.NaN;
      if (value < node.threshold) {
        leftRows.push(row);
        leftMatrix.push(matrix[index] ?? []);
      } else {
        rightRows.push(row);
        rightMatrix.push(matrix[index] ?? []);
      }
    });
    const nextValues =
      node.splitType === "categorical"
        ? { ...availableValues, [node.feature]: node.leftValues ?? [] }
        : availableValues;
    const rightValues =
      node.splitType === "categorical"
        ? { ...availableValues, [node.feature]: node.rightValues ?? [] }
        : availableValues;
    visit(node.left, leftRows, leftMatrix, nextValues);
    visit(node.right, rightRows, rightMatrix, rightValues);
  };
  visit(tree, rows, encoded.matrix, valuesByColumn);
  return byNode;
}

function goesLeft(node: Extract<AiLabTreeNode, { type: "decision" }>, row: AiLabDataRow): boolean {
  if (node.splitType === "categorical") {
    return (node.leftValues ?? []).includes(String(row[node.feature] ?? ""));
  }
  return parseFloat(String(row[node.feature])) < node.threshold;
}

export function traceDecisionTree(
  root: AiLabTreeNode,
  row: AiLabDataRow,
): AiLabTreeTrace {
  const pathKeys = ["root"];
  const steps: AiLabTreeTrace["steps"] = [];
  let node = root;

  while (node.type === "decision") {
    const left = goesLeft(node, row);
    const next = left ? node.left : node.right;
    const branches = treeBranches(node);
    steps.push({
      pathKey: node.pathKey,
      feature: node.feature,
      value: row[node.feature] ?? "",
      branchLabel: (left ? branches[0] : branches[1])?.label ?? "",
    });
    pathKeys.push(next.pathKey);
    node = next;
  }

  return {
    prediction: node.prediction,
    rawPrediction: node.rawPrediction,
    pathKeys,
    steps,
  };
}

export interface AiLabTreeBranch {
  /** Text on the edge into this child (`hot or mild`, `< 3.5`). */
  label: string;
  child: AiLabTreeNode;
}

/** Ordered outgoing branches of a decision node, with their edge labels. */
export function treeBranches(node: AiLabTreeNode): AiLabTreeBranch[] {
  if (node.type === "leaf") return [];
  if (node.splitType === "numerical") {
    const threshold = thresholdText(node.threshold);
    return [
      { label: `< ${threshold}`, child: node.left },
      { label: `≥ ${threshold}`, child: node.right },
    ];
  }
  return [
    { label: valueList(node.leftValues ?? []), child: node.left },
    { label: valueList(node.rightValues ?? []), child: node.right },
  ];
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
  return treeBranches(node).reduce((sum, branch) => sum + countLeaves(branch.child), 0);
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

/**
 * Whether one held-out row matches the way production grades a tree:
 * categories must match exactly, and a numeric label must land within 5%
 * of the label column's range on the whole sheet.
 */
export function cartPredictionCorrect(
  tree: AiLabTreeNode,
  row: AiLabDataRow,
  labelColumn: string,
  columns: AiLabColumn[],
  tolerance: number,
): boolean {
  const trace = traceDecisionTree(tree, row);
  const actual = String(row[labelColumn] ?? "");
  if (columnType(columns, labelColumn) !== "numerical") return actual === trace.prediction;
  const predicted = trace.rawPrediction ?? Number(trace.prediction);
  return Math.abs(Number(actual) - predicted) <= tolerance;
}

/** `5%` of `max(label) - min(label)` over every cell, including blanks as 0. */
export function cartRegressionTolerance(
  rows: AiLabDataRow[],
  labelColumn: string,
): number {
  let max = -Infinity;
  let min = Infinity;
  let dirty = false;
  for (const row of rows) {
    const value = Number(row[labelColumn]);
    if (Number.isNaN(value)) {
      dirty = true;
      break;
    }
    if (value > max) max = value;
    if (value < min) min = value;
  }
  if (dirty || !Number.isFinite(max) || !Number.isFinite(min)) return Number.NaN;
  return (Math.abs(max - min) * 5) / 100;
}
