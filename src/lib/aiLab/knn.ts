import type {
  AiLabColumn,
  AiLabDataRow,
  AiLabKnnPrediction,
} from "../../types/aiLab";
import { buildEncodings, encodeRow } from "./encode";

export const DEFAULT_KNN_K = 3;

function majorityLabel(labels: string[]): string {
  const counts = new Map<string, number>();
  labels.forEach((label) => counts.set(label, (counts.get(label) ?? 0) + 1));
  return (
    [...counts.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    )[0]?.[0] ?? ""
  );
}

function euclidean(a: number[], b: number[]): number {
  return Math.sqrt(
    a.reduce((sum, value, index) => {
      const delta = value - (b[index] ?? 0);
      return sum + delta * delta;
    }, 0),
  );
}

export function predictKnn(
  rows: AiLabDataRow[],
  query: AiLabDataRow,
  features: string[],
  labelColumn: string,
  columns: AiLabColumn[],
  k = DEFAULT_KNN_K,
  excludeRowIndexes: number[] = [],
): AiLabKnnPrediction {
  const excluded = new Set(excludeRowIndexes);
  const encodings = buildEncodings(rows, columns, features);
  const queryVector = encodeRow(query, features, columns, encodings);
  const neighbors = rows
    .map((row, rowIndex) => ({ row, rowIndex }))
    .filter(({ rowIndex }) => !excluded.has(rowIndex))
    .map(({ row, rowIndex }) => ({
      rowIndex,
      distance: euclidean(
        queryVector,
        encodeRow(row, features, columns, encodings),
      ),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, Math.min(k, rows.length - excluded.size));

  return {
    prediction: majorityLabel(
      neighbors.map((neighbor) => String(rows[neighbor.rowIndex][labelColumn])),
    ),
    neighbors,
  };
}
