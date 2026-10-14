import type { AiLabDataset } from "../../types/aiLab";
import { datasetIdFromPath, parseCsvDataset } from "./csvDataset";

/** Session key for CSV sheets uploaded from the AI Lab Dev panel. */
export const UPLOADED_DATASETS_STORAGE_KEY = "ailab.uploadedDatasets";

/** Enough for a handful of modest sheets without crowding the tab quota. */
export const MAX_UPLOADED_SHEETS = 20;
export const MAX_UPLOADED_CSV_CHARS = 1_500_000;

export interface UploadedSheet {
  id: string;
  fileName: string;
  csv: string;
  updatedAt: string;
}

export interface IncomingCsv {
  name: string;
  content: string;
}

export interface MergeUploadedSheetsResult {
  sheets: UploadedSheet[];
  /** Sheet the lab should open after this upload. */
  focusId?: string;
  /** Set when at least one file was skipped or the batch did not fit. */
  error?: string;
}

type SheetStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function browserStorage(): SheetStorage | undefined {
  if (typeof window === "undefined") return undefined;
  return window.sessionStorage;
}

function isSheet(value: unknown): value is UploadedSheet {
  if (!value || typeof value !== "object") return false;
  const sheet = value as UploadedSheet;
  return (
    typeof sheet.id === "string" &&
    typeof sheet.fileName === "string" &&
    typeof sheet.csv === "string" &&
    typeof sheet.updatedAt === "string"
  );
}

export function readUploadedSheets(storage?: SheetStorage): UploadedSheet[] {
  const target = storage ?? browserStorage();
  if (!target) return [];
  try {
    const raw = target.getItem(UPLOADED_DATASETS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSheet);
  } catch {
    return [];
  }
}

export function writeUploadedSheets(
  sheets: UploadedSheet[],
  storage?: SheetStorage,
): void {
  const target = storage ?? browserStorage();
  if (!target) return;
  const payload = JSON.stringify(sheets);
  try {
    target.setItem(UPLOADED_DATASETS_STORAGE_KEY, payload);
  } catch {
    throw new Error(
      "This tab cannot store that much CSV data. Remove a sheet or use a smaller file.",
    );
  }
}

export function clearUploadedSheets(storage?: SheetStorage): void {
  const target = storage ?? browserStorage();
  target?.removeItem(UPLOADED_DATASETS_STORAGE_KEY);
}

function sheetId(fileName: string, sheets: UploadedSheet[]): string {
  const existing = sheets.find(
    (sheet) => sheet.fileName.toLowerCase() === fileName.toLowerCase(),
  );
  if (existing) return existing.id;
  const base = datasetIdFromPath(fileName);
  const used = new Set(sheets.map((sheet) => sheet.id));
  let id = base;
  let suffix = 2;
  while (used.has(id)) {
    id = `${base}_${suffix}`;
    suffix += 1;
  }
  return id;
}

function usableDataset(csv: string, id: string): AiLabDataset | undefined {
  const dataset = parseCsvDataset(csv, { id });
  if (dataset.columns.length < 2 || dataset.rows.length === 0) return undefined;
  return dataset;
}

/**
 * Add CSV files to the tab's sheet list. The same file name replaces that
 * sheet. Other names are kept. The last file that parsed becomes `focusId`.
 */
export function mergeUploadedSheets(
  current: UploadedSheet[],
  incoming: IncomingCsv[],
  now: () => string = () => new Date().toISOString(),
): MergeUploadedSheetsResult {
  const sheets = current.map((sheet) => ({ ...sheet }));
  const errors: string[] = [];
  let focusId: string | undefined;

  for (const file of incoming) {
    const fileName = file.name.trim() || "dataset.csv";
    const id = sheetId(fileName, sheets);
    if (!usableDataset(file.content, id)) {
      errors.push(
        `${fileName} needs a header row and at least one data row.`,
      );
      continue;
    }

    const existingIndex = sheets.findIndex(
      (sheet) => sheet.fileName.toLowerCase() === fileName.toLowerCase(),
    );
    const updatedAt = now();
    if (existingIndex >= 0) {
      const existing = sheets[existingIndex]!;
      sheets[existingIndex] = { ...existing, csv: file.content, updatedAt };
      focusId = existing.id;
      continue;
    }

    if (sheets.length >= MAX_UPLOADED_SHEETS) {
      errors.push(
        `This tab holds ${MAX_UPLOADED_SHEETS} sheets. Remove one before adding another.`,
      );
      continue;
    }

    sheets.push({ id, fileName, csv: file.content, updatedAt });
    focusId = id;
  }

  const total = sheets.reduce((sum, sheet) => sum + sheet.csv.length, 0);
  if (total > MAX_UPLOADED_CSV_CHARS) {
    return {
      sheets: current,
      error:
        "Those CSV files are too large for this tab. Keep each sheet to a few hundred rows.",
    };
  }

  return {
    sheets,
    focusId,
    error: errors.length > 0 ? errors.join(" ") : undefined,
  };
}

/** Keep the named files and drop the rest. An empty name list clears the tab. */
export function retainUploadedSheets(
  current: UploadedSheet[],
  fileNames: string[],
): UploadedSheet[] {
  const keep = new Set(fileNames.map((name) => name.trim().toLowerCase()));
  return current.filter((sheet) => keep.has(sheet.fileName.toLowerCase()));
}

export function sheetsToDatasets(sheets: UploadedSheet[]): AiLabDataset[] {
  return sheets.flatMap((sheet) => {
    const dataset = usableDataset(sheet.csv, sheet.id);
    return dataset ? [dataset] : [];
  });
}
