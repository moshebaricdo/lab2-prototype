import type {
  AiLabColumn,
  AiLabDataRow,
  AiLabScale,
} from "../../types/aiLab";

export function scaleColumnId(sourceColumnId: string): string {
  return `${sourceColumnId}_scale`;
}

/**
 * Below the first cut, through the last cut, then above it.
 * `< 60` / `60 to 100` / `> 100` when the cuts are 60 and 100.
 */
export function bucketLabel(value: number, scale: AiLabScale): string {
  const { cuts, labels } = scale;
  for (let index = 0; index < cuts.length; index += 1) {
    const cut = cuts[index];
    const last = index === cuts.length - 1;
    if (!last && value < cut) return labels[index] ?? "";
    if (last && value <= cut) return labels[index] ?? "";
  }
  return labels[labels.length - 1] ?? "";
}

export function applyScales(
  rows: AiLabDataRow[],
  scales: AiLabScale[],
): AiLabDataRow[] {
  if (scales.length === 0) return rows;
  return rows.map((row) => {
    const next: AiLabDataRow = { ...row };
    for (const scale of scales) {
      const raw = Number(row[scale.sourceColumnId]);
      next[scale.id] = Number.isFinite(raw) ? bucketLabel(raw, scale) : "";
    }
    return next;
  });
}

export function scaleToColumn(scale: AiLabScale, sourceName: string): AiLabColumn {
  return {
    id: scale.id,
    name: scale.name,
    type: "categorical",
    description: `Names chosen for ${sourceName}. The numbers are still in ${sourceName}.`,
  };
}

export function columnsWithScales(
  columns: AiLabColumn[],
  scales: AiLabScale[],
): AiLabColumn[] {
  if (scales.length === 0) return columns;
  const extra = scales.map((scale) => {
    const source = columns.find((column) => column.id === scale.sourceColumnId);
    return scaleToColumn(scale, source?.name ?? scale.sourceColumnId);
  });
  const extraIds = new Set(extra.map((column) => column.id));
  return [...columns.filter((column) => !extraIds.has(column.id)), ...extra];
}

export function countBuckets(
  rows: AiLabDataRow[],
  sourceColumnId: string,
  cuts: number[],
  labels: string[],
): number[] {
  const counts = labels.map(() => 0);
  const scale: AiLabScale = {
    id: "",
    sourceColumnId,
    name: "",
    cuts,
    labels,
  };
  for (const row of rows) {
    const raw = Number(row[sourceColumnId]);
    if (!Number.isFinite(raw)) continue;
    const label = bucketLabel(raw, scale);
    const index = labels.indexOf(label);
    if (index >= 0) counts[index] += 1;
  }
  return counts;
}
