import type {
  AiLabColumn,
  AiLabDataRow,
  AiLabKnnPrediction,
  AiLabTreeTrace,
} from "../../types/aiLab";
import { columnById, formatCell, formatNumber } from "./columnStats";
import { knnVotes } from "./knn";

export function explainTreeTrace(
  columns: AiLabColumn[],
  trace: AiLabTreeTrace,
): string {
  if (trace.steps.length === 0) {
    return `The model predicts ${trace.prediction} because every training example in this group has that label.`;
  }
  const path = trace.steps
    .map((step) => {
      const name = columnById(columns, step.feature)?.name ?? step.feature;
      return `${name} is ${formatCell(step.value)}`;
    })
    .join(", then ");
  return `The model predicts ${trace.prediction} because ${path}.`;
}

export function explainKnn(
  rows: AiLabDataRow[],
  labelColumn: string,
  prediction: AiLabKnnPrediction,
): string {
  const k = prediction.neighbors.length;
  const tally = knnVotes(rows, labelColumn, prediction.neighbors);
  const matching =
    tally.find((vote) => vote.label === prediction.prediction)?.count ?? 0;
  const rowsWord = k === 1 ? "row" : "rows";
  const line = `${prediction.prediction} got the most votes among the ${k} nearest ${rowsWord}.`;
  const tied = tally.filter((vote) => vote.count === matching).length > 1;
  if (tied) {
    return `${line} Tied; first to that count wins.`;
  }
  return line;
}

export function formatDistance(distance: number): string {
  if (distance === 0) return "0";
  return formatNumber(distance);
}
