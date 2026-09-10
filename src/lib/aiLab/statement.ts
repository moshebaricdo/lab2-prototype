import type { AiLabColumn } from "../../types/aiLab";
import { columnById } from "./columnStats";

export function predictionStatement(
  columns: AiLabColumn[],
  labelColumn: string | undefined,
  selectedFeatures: string[],
): string {
  const labelName = labelColumn
    ? (columnById(columns, labelColumn)?.name ?? labelColumn)
    : "…";
  const featureNames =
    selectedFeatures.length === 0
      ? "…"
      : selectedFeatures
          .map((feature) => columnById(columns, feature)?.name ?? feature)
          .join(", ");
  return `Predict ${labelName} based on ${featureNames}.`;
}
