import type {
  AiLabColumn,
  AiLabColumnType,
  AiLabDataRow,
  AiLabHoldoutResult,
  AiLabTrainedModel,
  AiLabTreeNode,
} from "../../types/aiLab";
import { columnType, numericalStats } from "./columnStats";
import {
  CART_MAX_DEPTHS,
  cartPredictionCorrect,
  cartRegressionTolerance,
  traceDecisionTree,
  trainDecisionTree,
} from "./decisionTree";
import {
  classificationKCandidates,
  DEFAULT_KNN_K,
  knnDistances,
  majorityVote,
  predictKnn,
  regressionKnnK,
} from "./knn";

/**
 * Last 10% of the sheet, matching AI Lab's reserved test split (end).
 * Production uses `Math.ceil`, so 14 rows reserve 2 and 52 reserve 6.
 * A one-row sheet reserves nothing, so training is never empty.
 */
export const HOLDOUT_FRACTION = 0.1;

function reservedCount(rowCount: number, holdoutCount?: number): number {
  if (rowCount <= 1) return 0;
  const count =
    holdoutCount === undefined
      ? Math.ceil(rowCount * HOLDOUT_FRACTION)
      : holdoutCount;
  if (count <= 0) return 0;
  return Math.min(count, rowCount - 1);
}

export function holdoutIndexes(
  rowCount: number,
  holdoutCount?: number,
): number[] {
  const take = reservedCount(rowCount, holdoutCount);
  if (take === 0) return [];
  return Array.from({ length: take }, (_, index) => rowCount - take + index);
}

/**
 * Production's random reserve (`randomizeTestData`). Same count as the
 * end split. The draw matches `getRandomInt(length - 1)`, which never
 * selects the current last index, so the sheet's last row stays in
 * training. Returned indexes are in sheet order.
 */
export function randomHoldoutIndexes(
  rowCount: number,
  holdoutCount?: number,
  random: () => number = Math.random,
): number[] {
  const take = reservedCount(rowCount, holdoutCount);
  if (take === 0) return [];
  const pool = Array.from({ length: rowCount }, (_, index) => index);
  const reserved: number[] = [];
  while (reserved.length < take) {
    const index = Math.floor(random() * Math.floor(pool.length - 1));
    const picked = pool.splice(index, 1)[0];
    if (picked === undefined) break;
    reserved.push(picked);
  }
  reserved.sort((left, right) => left - right);
  return reserved;
}

export function trainingRows(
  rows: AiLabDataRow[],
  holdout: number[],
): AiLabDataRow[] {
  const holdoutSet = new Set(holdout);
  return rows.filter((_, index) => !holdoutSet.has(index));
}

export function isPredictionCorrect(
  actual: string,
  predicted: string,
  labelType: AiLabColumnType,
  labelRange: number,
): boolean {
  if (labelType !== "numerical") return actual === predicted;
  const actualN = Number(actual);
  const predictedN = Number(predicted);
  if (!Number.isFinite(actualN) || !Number.isFinite(predictedN)) {
    return actual === predicted;
  }
  const tolerance = 0.05 * labelRange;
  if (tolerance === 0) return actualN === predictedN;
  return Math.abs(predictedN - actualN) <= tolerance;
}

function labelRange(rows: AiLabDataRow[], columns: AiLabColumn[], labelColumn: string) {
  return columnType(columns, labelColumn) === "numerical"
    ? numericalStats(rows, labelColumn).range
    : 0;
}

function scorePrediction(
  rows: AiLabDataRow[],
  columns: AiLabColumn[],
  labelColumn: string,
  rowIndex: number,
  predicted: string,
): AiLabHoldoutResult {
  const actual = String(rows[rowIndex][labelColumn]);
  return {
    rowIndex,
    actual,
    predicted,
    correct: isPredictionCorrect(
      actual,
      predicted,
      columnType(columns, labelColumn),
      labelRange(rows, columns, labelColumn),
    ),
  };
}

function holdoutRankings(
  rows: AiLabDataRow[],
  columns: AiLabColumn[],
  features: string[],
  holdoutRowIndexes: number[],
): number[][] {
  return holdoutRowIndexes.map((rowIndex) => {
    const { order } = knnDistances(
      rows,
      rows[rowIndex]!,
      features,
      columns,
      holdoutRowIndexes,
    );
    return order;
  });
}

function voteFromRanking(
  rows: AiLabDataRow[],
  labelColumn: string,
  ranking: number[],
  k: number,
): string {
  return majorityVote(
    ranking
      .slice(0, k)
      .map((neighbor) => String(rows[neighbor]![labelColumn])),
  );
}

function scoreKOnHoldout(
  rows: AiLabDataRow[],
  columns: AiLabColumn[],
  labelColumn: string,
  holdoutRowIndexes: number[],
  rankings: number[][],
  k: number,
): number {
  const type = columnType(columns, labelColumn);
  const range = labelRange(rows, columns, labelColumn);
  let correct = 0;
  holdoutRowIndexes.forEach((rowIndex, index) => {
    const predicted = voteFromRanking(rows, labelColumn, rankings[index]!, k);
    const actual = String(rows[rowIndex]![labelColumn]);
    if (isPredictionCorrect(actual, predicted, type, range)) correct += 1;
  });
  return correct;
}

/**
 * Pick k the way AI Lab does: locked value if provided, else a size rule
 * for numeric labels, else a holdout search over the classification list.
 */
export function chooseKnnK(options: {
  rows: AiLabDataRow[];
  columns: AiLabColumn[];
  features: string[];
  labelColumn: string;
  holdoutRowIndexes: number[];
  lockedK?: number;
  rankings?: number[][];
}): number {
  const trainCount = options.rows.length - options.holdoutRowIndexes.length;
  if (trainCount <= 0) return 1;
  if (options.lockedK != null) {
    return Math.min(options.lockedK, trainCount);
  }
  if (columnType(options.columns, options.labelColumn) === "numerical") {
    return regressionKnnK(trainCount);
  }
  const candidates = classificationKCandidates(trainCount);
  if (candidates.length === 0) return Math.min(DEFAULT_KNN_K, trainCount);
  if (options.holdoutRowIndexes.length === 0 || candidates.length === 1) {
    return candidates[0]!;
  }

  const rankings =
    options.rankings ??
    holdoutRankings(
      options.rows,
      options.columns,
      options.features,
      options.holdoutRowIndexes,
    );

  let bestK = candidates[0]!;
  let bestCorrect = -1;
  for (const k of candidates) {
    const correct = scoreKOnHoldout(
      options.rows,
      options.columns,
      options.labelColumn,
      options.holdoutRowIndexes,
      rankings,
      k,
    );
    if (correct > bestCorrect) {
      bestCorrect = correct;
      bestK = k;
    }
  }
  return bestK;
}

function scoreTreeRow(
  rows: AiLabDataRow[],
  columns: AiLabColumn[],
  labelColumn: string,
  rowIndex: number,
  tree: AiLabTreeNode,
  tolerance: number,
): AiLabHoldoutResult {
  const row = rows[rowIndex]!;
  const trace = traceDecisionTree(tree, row);
  return {
    rowIndex,
    actual: String(row[labelColumn] ?? ""),
    predicted: trace.prediction,
    correct: cartPredictionCorrect(tree, row, labelColumn, columns, tolerance),
  };
}

/**
 * Train one tree per candidate depth and keep the one production would
 * keep: highest holdout accuracy, shallowest depth on a tie. With nothing
 * held out, only depth 1 is trained.
 */
function selectDecisionTree(options: {
  rows: AiLabDataRow[];
  trainSet: AiLabDataRow[];
  columns: AiLabColumn[];
  features: string[];
  labelColumn: string;
  holdoutRowIndexes: number[];
  tolerance: number;
}): { tree: AiLabTreeNode; maxDepth: number } {
  const depths =
    options.holdoutRowIndexes.length === 0 ? [1] : [...CART_MAX_DEPTHS];
  let bestTree: AiLabTreeNode | undefined;
  let bestDepth = depths[0]!;
  let bestAccuracy = -1;
  for (const maxDepth of depths) {
    const tree = trainDecisionTree(
      options.trainSet,
      options.columns,
      options.features,
      options.labelColumn,
      { maxDepth, encodingRows: options.rows },
    );
    if (!bestTree) {
      bestTree = tree;
      bestDepth = maxDepth;
    }
    if (options.holdoutRowIndexes.length === 0) break;
    let correct = 0;
    for (const rowIndex of options.holdoutRowIndexes) {
      const row = options.rows[rowIndex];
      if (
        row &&
        cartPredictionCorrect(
          tree,
          row,
          options.labelColumn,
          options.columns,
          options.tolerance,
        )
      ) {
        correct += 1;
      }
    }
    const accuracy = parseFloat(
      ((correct / options.holdoutRowIndexes.length) * 100).toFixed(2),
    );
    if (accuracy > bestAccuracy) {
      bestAccuracy = accuracy;
      bestTree = tree;
      bestDepth = maxDepth;
    }
  }
  return { tree: bestTree!, maxDepth: bestDepth };
}

export function predictRow(
  model: AiLabTrainedModel,
  row: AiLabDataRow,
  rows: AiLabDataRow[],
  columns: AiLabColumn[],
): string {
  if (model.algorithm === "decisionTree" && model.tree) {
    return traceDecisionTree(model.tree, row).prediction;
  }
  return predictKnn(
    rows,
    row,
    model.selectedFeatures,
    model.labelColumn,
    columns,
    model.knnK ?? DEFAULT_KNN_K,
    model.holdoutRowIndexes,
  ).prediction;
}

export function trainModel(options: {
  algorithm: "knn" | "decisionTree";
  rows: AiLabDataRow[];
  columns: AiLabColumn[];
  labelColumn: string;
  selectedFeatures: string[];
  knnK?: number;
  holdoutCount?: number;
  /** Draw the reserved rows at random. Off keeps the last 10%. */
  randomizeTestData?: boolean;
  holdoutRowIndexes?: number[];
}): AiLabTrainedModel {
  // Both algorithms reserve 10% (`holdoutCount` overrides; 0 opts out).
  // The default is the last rows. `randomizeTestData` draws them at random.
  // The tree is trained on the rest. KNN also picks k on this split.
  const holdoutRowIndexes =
    options.holdoutRowIndexes ??
    (options.randomizeTestData
      ? randomHoldoutIndexes(options.rows.length, options.holdoutCount)
      : holdoutIndexes(options.rows.length, options.holdoutCount));
  const trainSet =
    holdoutRowIndexes.length > 0
      ? trainingRows(options.rows, holdoutRowIndexes)
      : options.rows;
  const treeTolerance =
    options.algorithm === "decisionTree" &&
    columnType(options.columns, options.labelColumn) === "numerical"
      ? cartRegressionTolerance(options.rows, options.labelColumn)
      : 0;
  const treeSelection =
    options.algorithm === "decisionTree"
      ? selectDecisionTree({
          rows: options.rows,
          trainSet,
          columns: options.columns,
          features: options.selectedFeatures,
          labelColumn: options.labelColumn,
          holdoutRowIndexes,
          tolerance: treeTolerance,
        })
      : undefined;
  const tree = treeSelection?.tree;

  const knnRankings =
    options.algorithm === "knn" && holdoutRowIndexes.length > 0
      ? holdoutRankings(
          options.rows,
          options.columns,
          options.selectedFeatures,
          holdoutRowIndexes,
        )
      : undefined;
  const knnK =
    options.algorithm === "knn"
      ? chooseKnnK({
          rows: options.rows,
          columns: options.columns,
          features: options.selectedFeatures,
          labelColumn: options.labelColumn,
          holdoutRowIndexes,
          lockedK: options.knnK,
          rankings: knnRankings,
        })
      : undefined;

  const draft: AiLabTrainedModel = {
    algorithm: options.algorithm,
    labelColumn: options.labelColumn,
    selectedFeatures: options.selectedFeatures,
    holdoutRowIndexes,
    holdoutResults: [],
    accuracy: 0,
    tree,
    maxDepth: treeSelection?.maxDepth,
    knnK,
  };

  const reserved = new Set(holdoutRowIndexes);
  const trainedRowIndexes = options.rows
    .map((_, index) => index)
    .filter((index) => !reserved.has(index));
  const scored =
    options.algorithm === "decisionTree" && tree
      ? trainedRowIndexes.map((rowIndex) =>
          scoreTreeRow(
            options.rows,
            options.columns,
            options.labelColumn,
            rowIndex,
            tree,
            treeTolerance,
          ),
        )
      : options.algorithm === "knn" && knnRankings && knnK != null
        ? holdoutRowIndexes.map((rowIndex, index) =>
            scorePrediction(
              options.rows,
              options.columns,
              options.labelColumn,
              rowIndex,
              voteFromRanking(
                options.rows,
                options.labelColumn,
                knnRankings[index]!,
                knnK,
              ),
            ),
          )
        : options.rows.map((row, rowIndex) =>
            scorePrediction(
              options.rows,
              options.columns,
              options.labelColumn,
              rowIndex,
              predictKnn(
                options.rows,
                row,
                options.selectedFeatures,
                options.labelColumn,
                options.columns,
                knnK,
                [rowIndex],
              ).prediction,
            ),
          );
  const correctCount = scored.filter((result) => result.correct).length;

  return {
    ...draft,
    holdoutResults: scored,
    accuracy: scored.length === 0 ? 0 : correctCount / scored.length,
  };
}
