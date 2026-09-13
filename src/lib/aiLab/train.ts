import type {
  AiLabColumn,
  AiLabColumnType,
  AiLabDataRow,
  AiLabHoldoutResult,
  AiLabTrainedModel,
} from "../../types/aiLab";
import { columnType, numericalStats } from "./columnStats";
import { trainDecisionTree, traceDecisionTree } from "./decisionTree";
import {
  classificationKCandidates,
  DEFAULT_KNN_K,
  knnDistances,
  majorityVote,
  predictKnn,
  regressionKnnK,
} from "./knn";

/** Last 10% of the sheet, matching AI Lab's reserved test split (end). */
export const HOLDOUT_FRACTION = 0.1;

export function holdoutIndexes(
  rowCount: number,
  holdoutCount?: number,
): number[] {
  if (rowCount <= 1) return [];
  const count =
    holdoutCount === undefined
      ? Math.max(1, Math.round(rowCount * HOLDOUT_FRACTION))
      : holdoutCount;
  if (count <= 0) return [];
  const take = Math.min(count, rowCount - 1);
  return Array.from({ length: take }, (_, index) => rowCount - take + index);
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
  holdoutRowIndexes?: number[];
}): AiLabTrainedModel {
  const holdoutRowIndexes =
    options.holdoutRowIndexes ??
    holdoutIndexes(
      options.rows.length,
      options.algorithm === "knn"
        ? options.holdoutCount
        : (options.holdoutCount ?? 0),
    );
  const trainSet =
    holdoutRowIndexes.length > 0
      ? trainingRows(options.rows, holdoutRowIndexes)
      : options.rows;
  const tree =
    options.algorithm === "decisionTree"
      ? trainDecisionTree(
          trainSet,
          options.columns,
          options.selectedFeatures,
          options.labelColumn,
        )
      : undefined;

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
    knnK,
  };

  const scored =
    options.algorithm === "knn" && knnRankings && knnK != null
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
            options.algorithm === "knn"
              ? predictKnn(
                  options.rows,
                  row,
                  options.selectedFeatures,
                  options.labelColumn,
                  options.columns,
                  knnK,
                  [rowIndex],
                ).prediction
              : predictRow(draft, row, options.rows, options.columns),
          ),
        );
  const correctCount = scored.filter((result) => result.correct).length;

  return {
    ...draft,
    holdoutResults: scored,
    accuracy: scored.length === 0 ? 0 : correctCount / scored.length,
  };
}
