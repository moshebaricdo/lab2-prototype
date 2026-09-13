import type { AiLabColumn, AiLabDataRow } from "../../types/aiLab";
import { columnType } from "./columnStats";

export type FeatureEncodings = Record<string, Record<string, number>>;

/**
 * Distinct values in sheet order. AI Lab / ml-knn maps each category to
 * 0, 1, 2… at first sight — not a sorted catalog — so "B" then "A" is
 * not the same axis as "A" then "B".
 */
export function firstSeenValues(
  rows: AiLabDataRow[],
  columnId: string,
): string[] {
  const seen = new Set<string>();
  const values: string[] = [];
  for (const row of rows) {
    const value = String(row[columnId]);
    if (!seen.has(value)) {
      seen.add(value);
      values.push(value);
    }
  }
  return values;
}

export function buildEncodings(
  rows: AiLabDataRow[],
  columns: AiLabColumn[],
  features: string[],
): FeatureEncodings {
  const encodings: FeatureEncodings = {};
  features.forEach((feature) => {
    if (columnType(columns, feature) !== "categorical") return;
    encodings[feature] = Object.fromEntries(
      firstSeenValues(rows, feature).map((value, index) => [value, index]),
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
