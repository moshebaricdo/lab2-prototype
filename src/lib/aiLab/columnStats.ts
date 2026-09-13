import type {
  AiLabColumn,
  AiLabColumnType,
  AiLabDataRow,
} from "../../types/aiLab";

/**
 * One shared collator: `String.prototype.localeCompare(..., { numeric })`
 * builds a collator per call, which dominated sorting high-cardinality
 * columns (thousands of distinct strings).
 */
const naturalCollator = new Intl.Collator(undefined, { numeric: true });

export function compareNatural(a: string, b: string): number {
  return naturalCollator.compare(a, b);
}

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

export interface NumericalStats {
  min: number;
  max: number;
  range: number;
  median: number;
  values: number[];
}

interface ColumnSummary {
  unique?: string[];
  frequencies?: { value: string; count: number }[];
  numerical?: NumericalStats;
}

/**
 * Per-column derived data, cached by the identity of the `rows` array.
 *
 * Sheet rows are treated as immutable (`updateCell` maps to a new array), so
 * the array reference is a sound cache key. Every render-time consumer
 * (analysis dock, cell suggestions, KNN encodings, test inputs) shares one
 * computation per column per sheet version instead of rescanning on each
 * click.
 */
const summaryCache = new WeakMap<AiLabDataRow[], Map<string, ColumnSummary>>();

function summaryFor(rows: AiLabDataRow[], columnId: string): ColumnSummary {
  let byColumn = summaryCache.get(rows);
  if (!byColumn) {
    byColumn = new Map();
    summaryCache.set(rows, byColumn);
  }
  let summary = byColumn.get(columnId);
  if (!summary) {
    summary = {};
    byColumn.set(columnId, summary);
  }
  return summary;
}

function countValues(rows: AiLabDataRow[], columnId: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = String(row[columnId]);
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

/** Distinct values in natural sort order (axis ticks, dropdowns, palettes). */
export function uniqueValues(rows: AiLabDataRow[], columnId: string): string[] {
  const summary = summaryFor(rows, columnId);
  if (!summary.unique) {
    summary.unique = [...countValues(rows, columnId).keys()].sort(compareNatural);
  }
  return summary.unique;
}

export function frequencies(
  rows: AiLabDataRow[],
  columnId: string,
): { value: string; count: number }[] {
  const summary = summaryFor(rows, columnId);
  if (!summary.frequencies) {
    summary.frequencies = [...countValues(rows, columnId).entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || compareNatural(a.value, b.value));
  }
  return summary.frequencies;
}

export function numericalStats(
  rows: AiLabDataRow[],
  columnId: string,
): NumericalStats {
  const summary = summaryFor(rows, columnId);
  if (summary.numerical) return summary.numerical;

  const values: number[] = [];
  for (const row of rows) {
    const value = Number(row[columnId]);
    if (Number.isFinite(value)) values.push(value);
  }
  if (values.length === 0) {
    summary.numerical = { min: 0, max: 0, range: 0, median: 0, values };
    return summary.numerical;
  }
  let min = Infinity;
  let max = -Infinity;
  for (const value of values) {
    if (value < min) min = value;
    if (value > max) max = value;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 1
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  summary.numerical = { min, max, range: max - min, median, values };
  return summary.numerical;
}

/**
 * Smallest "nice" bin width (1, 2, 2.5, 5 × 10^k) such that the values fit in
 * at most `maxBins` bins whose edges sit on multiples of the width. Integer
 * columns only get integer widths so labels stay whole numbers ("2–3", not
 * "1.8–2.6").
 */
function niceBinWidth(
  min: number,
  max: number,
  maxBins: number,
  integers: boolean,
): number {
  const range = max - min;
  let exponent = Math.floor(Math.log10(range / maxBins));
  for (let attempt = 0; attempt < 20; attempt += 1, exponent += 1) {
    const magnitude = 10 ** exponent;
    for (const factor of [1, 2, 2.5, 5]) {
      const width = factor * magnitude;
      if (integers && !Number.isInteger(width)) continue;
      const start = Math.floor(min / width) * width;
      const span = max - start;
      const bins = integers
        ? Math.floor(span / width) + 1
        : Math.max(1, Math.ceil(span / width));
      if (bins <= maxBins) return width;
    }
  }
  return range;
}

/**
 * Bin edges are multiples of a nice width, so they need exactly as many
 * decimals as the width itself (0.25 → 2). `toFixed` also scrubs the float
 * drift that accumulates from `start + width * index`.
 */
function formatEdge(value: number, width: number): string {
  const [, fraction = ""] = String(width).split(".");
  return String(Number(value.toFixed(fraction.length)));
}

/**
 * Bucket numeric values into at most `maxBins` rows. The bin width flexes to
 * the data: a 1–5 rating gets one row per value, a 0–100 score gets 20-point
 * bands, so the dock never shows more than `maxBins` rows nor fractional
 * edges on whole-number columns.
 */
export function histogramBins(
  values: number[],
  maxBins = 5,
): { label: string; count: number }[] {
  if (values.length === 0) return [];
  let min = Infinity;
  let max = -Infinity;
  let integers = true;
  for (const value of values) {
    if (value < min) min = value;
    if (value > max) max = value;
    if (integers && !Number.isInteger(value)) integers = false;
  }
  if (min === max) {
    return [{ label: formatNumber(min), count: values.length }];
  }
  const width = niceBinWidth(min, max, maxBins, integers);
  const start = Math.floor(min / width) * width;
  // Integer bins are closed ranges ("20–24"); continuous bins are half-open
  // with the maximum folded into the last bin, as in a standard histogram.
  const binCount = integers
    ? Math.floor((max - start) / width) + 1
    : Math.max(1, Math.ceil((max - start) / width));
  const counts = new Array<number>(binCount).fill(0);
  for (const value of values) {
    const index = Math.min(binCount - 1, Math.floor((value - start) / width));
    counts[index] += 1;
  }
  return counts.map((count, index) => {
    const binStart = start + width * index;
    if (integers) {
      const lo = Math.max(min, binStart);
      const hi = Math.min(max, binStart + width - 1);
      return {
        label: lo === hi ? formatNumber(lo) : `${formatNumber(lo)}–${formatNumber(hi)}`,
        count,
      };
    }
    return {
      label: `${formatEdge(binStart, width)}–${formatEdge(binStart + width, width)}`,
      count,
    };
  });
}

/**
 * Collapse a long frequency list for display: the top `limit` entries plus
 * one aggregated "Other" bucket. High-cardinality columns (IDs, free text)
 * otherwise render thousands of distribution bars.
 */
export function capDistribution<T extends { label: string; count: number }>(
  entries: T[],
  limit = 4,
): { label: string; count: number; isOther?: boolean }[] {
  if (entries.length <= limit) return entries;
  const shown = entries.slice(0, limit);
  const rest = entries.slice(limit);
  const otherCount = rest.reduce((sum, entry) => sum + entry.count, 0);
  return [
    ...shown,
    {
      label: `Other (${rest.length} more)`,
      count: otherCount,
      isOther: true,
    },
  ];
}

export function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function formatCell(value: string | number): string {
  return typeof value === "number" ? formatNumber(value) : String(value);
}
