import type {
  AiLabColumn,
  AiLabDataRow,
  AiLabKnnPrediction,
  AiLabTreeTrace,
} from "../../types/aiLab";
import { columnById, formatCell, formatNumber } from "./columnStats";

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
  const votes = prediction.neighbors.map((neighbor) =>
    String(rows[neighbor.rowIndex][labelColumn]),
  );
  const matching = votes.filter((vote) => vote === prediction.prediction).length;
  if (k === 1) {
    return `The model predicts ${prediction.prediction} because the single nearest order had that label.`;
  }
  return `The model predicts ${prediction.prediction} because ${matching} of the ${k} nearest orders voted ${prediction.prediction}.`;
}

export function formatDistance(distance: number): string {
  if (distance === 0) return "0";
  return formatNumber(distance);
}
