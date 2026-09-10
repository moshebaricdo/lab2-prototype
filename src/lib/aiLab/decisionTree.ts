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

function weightedGini(groups: string[][], total: number): number {
  return groups.reduce((sum, group) => {
    if (group.length === 0) return sum;
    return sum + (group.length / total) * gini(group);
  }, 0);
}

function leaf(
  rows: AiLabDataRow[],
  labelColumn: string,
  pathKey: string,
): AiLabTreeNode {
  return {
    type: "leaf",
    pathKey,
    prediction: majorityLabel(labelsFor(rows, labelColumn)),
    sampleCount: rows.length,
  };
}

function bestCategoricalSplit(
  rows: AiLabDataRow[],
  feature: string,
  labelColumn: string,
): { values: string[]; impurityReduction: number } | null {
  const values = [...new Set(rows.map((row) => String(row[feature])))];
  if (values.length < 2) return null;
  const groups = values.map((value) =>
    labelsFor(
      rows.filter((row) => String(row[feature]) === value),
      labelColumn,
    ),
  );
  const impurityReduction =
    gini(labelsFor(rows, labelColumn)) -
    weightedGini(groups, rows.length);
  return impurityReduction > 0 ? { values, impurityReduction } : null;
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
  const parent = gini(labelsFor(sorted, labelColumn));

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = Number(sorted[index - 1][feature]);
    const current = Number(sorted[index][feature]);
    if (previous === current) continue;
    const threshold = (previous + current) / 2;
    const left = labelsFor(
      sorted.filter((row) => Number(row[feature]) <= threshold),
      labelColumn,
    );
    const right = labelsFor(
      sorted.filter((row) => Number(row[feature]) > threshold),
      labelColumn,
    );
    if (left.length === 0 || right.length === 0) continue;
    const impurityReduction = parent - weightedGini([left, right], sorted.length);
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
