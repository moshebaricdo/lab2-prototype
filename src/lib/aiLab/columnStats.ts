import type {
  AiLabColumn,
  AiLabColumnType,
  AiLabDataRow,
} from "../../types/aiLab";

export function columnById(
  columns: AiLabColumn[],
  columnId: string,
): AiLabColumn | undefined {
  return columns.find((column) => column.id === columnId);
}

export function columnType(
  columns: AiLabColumn[],
  columnId: string,
): AiLabColumnType {
  return columnById(columns, columnId)?.type ?? "categorical";
}

export function uniqueValues(rows: AiLabDataRow[], columnId: string): string[] {
  return [...new Set(rows.map((row) => String(row[columnId])))].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );
}

export function frequencies(
  rows: AiLabDataRow[],
  columnId: string,
): { value: string; count: number }[] {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const value = String(row[columnId]);
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

export function numericalStats(rows: AiLabDataRow[], columnId: string) {
  const values = rows
    .map((row) => Number(row[columnId]))
    .filter((value) => Number.isFinite(value));
  if (values.length === 0) {
    return { min: 0, max: 0, range: 0, values };
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  return { min, max, range: max - min, values };
}

export function histogramBins(
  values: number[],
  binCount = 5,
): { label: string; count: number }[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    return [{ label: String(min), count: values.length }];
  }
  const width = (max - min) / binCount;
  return Array.from({ length: binCount }, (_, index) => {
    const start = min + width * index;
    const end = index === binCount - 1 ? max : start + width;
    const count = values.filter((value) =>
      index === binCount - 1
        ? value >= start && value <= end
        : value >= start && value < end,
    ).length;
    return {
      label: `${formatNumber(start)}–${formatNumber(end)}`,
      count,
    };
  });
}

export function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function formatCell(value: string | number): string {
  return typeof value === "number" ? formatNumber(value) : String(value);
}
