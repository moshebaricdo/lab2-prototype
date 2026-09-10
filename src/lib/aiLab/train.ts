import type {
  AiLabColumn,
  AiLabDataRow,
  AiLabHoldoutResult,
  AiLabTrainedModel,
} from "../../types/aiLab";
import { trainDecisionTree, traceDecisionTree } from "./decisionTree";
import { DEFAULT_KNN_K, predictKnn } from "./knn";

const HOLDOUT_COUNT = 4;

export function holdoutIndexes(
  rowCount: number,
  holdoutCount = HOLDOUT_COUNT,
): number[] {
  const count = Math.min(holdoutCount, Math.max(1, Math.floor(rowCount / 5)));
  return Array.from({ length: count }, (_, index) => rowCount - count + index);
}

export function trainingRows(
  rows: AiLabDataRow[],
  holdout: number[],
): AiLabDataRow[] {
  const holdoutSet = new Set(holdout);
  return rows.filter((_, index) => !holdoutSet.has(index));
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
}): AiLabTrainedModel {
  const holdoutRowIndexes = holdoutIndexes(
    options.rows.length,
    options.holdoutCount,
  );
  const trainSet = trainingRows(options.rows, holdoutRowIndexes);
  const tree =
    options.algorithm === "decisionTree"
      ? trainDecisionTree(
          trainSet,
          options.columns,
          options.selectedFeatures,
          options.labelColumn,
        )
      : undefined;

  const draft: AiLabTrainedModel = {
    algorithm: options.algorithm,
    labelColumn: options.labelColumn,
    selectedFeatures: options.selectedFeatures,
    holdoutRowIndexes,
    holdoutResults: [],
    accuracy: 0,
    tree,
    knnK: options.algorithm === "knn" ? (options.knnK ?? DEFAULT_KNN_K) : undefined,
  };

  const holdoutResults: AiLabHoldoutResult[] = holdoutRowIndexes.map(
    (rowIndex) => {
      const row = options.rows[rowIndex];
      const actual = String(row[options.labelColumn]);
      const predicted = predictRow(draft, row, options.rows, options.columns);
      return {
        rowIndex,
        actual,
        predicted,
        correct: actual === predicted,
      };
    },
  );
  const correctCount = holdoutResults.filter((result) => result.correct).length;

  return {
    ...draft,
    holdoutResults,
    accuracy:
      holdoutResults.length === 0 ? 0 : correctCount / holdoutResults.length,
  };
}
