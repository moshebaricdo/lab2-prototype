import type { AiLabColumn, AiLabDataRow } from "../../types/aiLab";
import { columnType, uniqueValues } from "./columnStats";

export type FeatureEncodings = Record<string, Record<string, number>>;

export function buildEncodings(
  rows: AiLabDataRow[],
  columns: AiLabColumn[],
  features: string[],
): FeatureEncodings {
  const encodings: FeatureEncodings = {};
  features.forEach((feature) => {
    if (columnType(columns, feature) !== "categorical") return;
    encodings[feature] = Object.fromEntries(
      uniqueValues(rows, feature).map((value, index) => [value, index]),
    );
  });
  return encodings;
}

export function encodeValue(
  feature: string,
  value: string | number,
  columns: AiLabColumn[],
  encodings: FeatureEncodings,
): number {
  if (columnType(columns, feature) === "numerical") {
    return Number(value);
  }
  return encodings[feature]?.[String(value)] ?? -1;
}

export function encodeRow(
  row: AiLabDataRow,
  features: string[],
  columns: AiLabColumn[],
  encodings: FeatureEncodings,
): number[] {
  return features.map((feature) =>
    encodeValue(feature, row[feature], columns, encodings),
  );
}
