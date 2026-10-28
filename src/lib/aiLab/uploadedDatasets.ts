import type {
  AiLabAlgorithmId,
  AiLabDataset,
  AiLabDatasetCard,
  AiLabUploadedDatasetMetadata,
} from "../../types/aiLab";
import { datasetIdFromPath, parseCsvDataset } from "./csvDataset";

/** Session key for CSV sheets uploaded from AI Lab. */
export const UPLOADED_DATASETS_STORAGE_KEY = "ailab.uploadedDatasets";

/** Session key for the dataset the student last chose on the upload level. */
export const ACTIVE_DATASET_STORAGE_KEY = "ailab.activeDatasetId";

/** Session key for the algorithm the student last chose on the upload level. */
export const ACTIVE_ALGORITHM_STORAGE_KEY = "ailab.activeAlgorithm";

/** Enough for several multi-thousand-row sheets without crowding memory. */
export const MAX_UPLOADED_SHEETS = 20;
export const MAX_UPLOADED_CSV_CHARS = 15_000_000;

/**
 * In-memory fallback when an uploaded batch is valid (< MAX_UPLOADED_CSV_CHARS)
 * but exceeds the browser's ~5 MB `sessionStorage` quota.
 */
let memorySheetsFallback: UploadedSheet[] | undefined;

export interface UploadedSheet {
  id: string;
  fileName: string;
  csv: string;
  updatedAt: string;
  metadata?: AiLabUploadedDatasetMetadata;
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
  if (!storage && memorySheetsFallback) return memorySheetsFallback;
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
    if (!storage) memorySheetsFallback = undefined;
  } catch {
    if (!storage) {
      memorySheetsFallback = sheets;
      return;
    }
    throw new Error(
      "This tab cannot store that much CSV data. Remove a sheet or use a smaller file.",
    );
  }
}

export function clearUploadedSheets(storage?: SheetStorage): void {
  if (!storage) memorySheetsFallback = undefined;
  const target = storage ?? browserStorage();
  target?.removeItem(UPLOADED_DATASETS_STORAGE_KEY);
}

export function readActiveDatasetId(storage?: SheetStorage): string | undefined {
  const target = storage ?? browserStorage();
  const value = target?.getItem(ACTIVE_DATASET_STORAGE_KEY)?.trim();
  return value || undefined;
}

export function writeActiveDatasetId(
  id: string | undefined,
  storage?: SheetStorage,
): void {
  const target = storage ?? browserStorage();
  if (!target) return;
  if (!id) {
    target.removeItem(ACTIVE_DATASET_STORAGE_KEY);
    return;
  }
  target.setItem(ACTIVE_DATASET_STORAGE_KEY, id);
}

export function readActiveAlgorithm(
  storage?: SheetStorage,
): AiLabAlgorithmId | undefined {
  const target = storage ?? browserStorage();
  const value = target?.getItem(ACTIVE_ALGORITHM_STORAGE_KEY)?.trim();
  if (value === "knn" || value === "decisionTree") return value;
  return undefined;
}

export function writeActiveAlgorithm(
  algorithm: AiLabAlgorithmId | undefined,
  storage?: SheetStorage,
): void {
  const target = storage ?? browserStorage();
  if (!target) return;
  if (!algorithm) {
    target.removeItem(ACTIVE_ALGORITHM_STORAGE_KEY);
    return;
  }
  target.setItem(ACTIVE_ALGORITHM_STORAGE_KEY, algorithm);
}

export interface DatasetCatalogParts {
  /** Presets whose ids are not already used by an uploaded sheet. */
  samples: AiLabDataset[];
  uploads: AiLabDataset[];
  /** Samples, then uploads. Dev panel options use this full list. */
  catalog: AiLabDataset[];
}

/**
 * Sample sheets and uploaded CSVs as one catalog. An upload that slugs to
 * the same id as a sample replaces that sample so the id stays unambiguous.
 */
export function combineDatasetCatalog(
  presets: AiLabDataset[],
  uploads: AiLabDataset[],
): DatasetCatalogParts {
  const uploadIds = new Set(uploads.map((dataset) => dataset.id));
  const samples = presets.filter((dataset) => !uploadIds.has(dataset.id));
  return {
    samples,
    uploads,
    catalog: [...samples, ...uploads],
  };
}

/**
 * Catalog the lab session should mount. Extra uploads stay out until one
 * is the open sheet or a levelbuilder lock, so adding a file does not
 * remount an in-progress model.
 */
export function labDatasetCatalog(
  parts: DatasetCatalogParts,
  activeIds: Array<string | undefined>,
): AiLabDataset[] {
  const wanted = new Set(
    activeIds.filter((id): id is string => Boolean(id)),
  );
  const sampleIds = new Set(parts.samples.map((dataset) => dataset.id));
  const extras = parts.uploads.filter(
    (dataset) => wanted.has(dataset.id) && !sampleIds.has(dataset.id),
  );
  return [...parts.samples, ...extras];
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

export function normalizeUploadedMetadata(
  metadata: AiLabUploadedDatasetMetadata | undefined,
): AiLabUploadedDatasetMetadata | undefined {
  if (!metadata) return undefined;
  const name = metadata.name?.trim();
  const cover = metadata.cover?.trim();
  const description = metadata.description?.trim();
  const potentialUses = metadata.potentialUses?.trim();
  const potentialMisuses = metadata.potentialMisuses?.trim();
  const source = metadata.source?.trim();
  if (
    !name &&
    !cover &&
    !description &&
    !potentialUses &&
    !potentialMisuses &&
    !source
  ) {
    return undefined;
  }
  return {
    ...(name ? { name } : {}),
    ...(cover ? { cover } : {}),
    ...(description ? { description } : {}),
    ...(potentialUses ? { potentialUses } : {}),
    ...(potentialMisuses ? { potentialMisuses } : {}),
    ...(source ? { source } : {}),
  };
}

/**
 * Update student-authored metadata on an uploaded sheet without bumping
 * `updatedAt` (so an in-progress trained model is not cleared).
 */
export function updateUploadedSheetMetadata(
  current: UploadedSheet[],
  datasetId: string,
  metadata: AiLabUploadedDatasetMetadata | undefined,
): UploadedSheet[] {
  const index = current.findIndex((sheet) => sheet.id === datasetId);
  if (index < 0) return current;
  const normalized = normalizeUploadedMetadata(metadata);
  return current.map((sheet, idx) => {
    if (idx !== index) return sheet;
    const next: UploadedSheet = {
      id: sheet.id,
      fileName: sheet.fileName,
      csv: sheet.csv,
      updatedAt: sheet.updatedAt,
      ...(normalized ? { metadata: normalized } : {}),
    };
    return next;
  });
}

function applyMetadataToDataset(
  base: AiLabDataset,
  metadata: AiLabUploadedDatasetMetadata | undefined,
): AiLabDataset {
  const normalized = normalizeUploadedMetadata(metadata);
  if (!normalized) return base;
  const hasCardDetails = Boolean(
    normalized.description ||
      normalized.potentialUses ||
      normalized.potentialMisuses ||
      normalized.source,
  );
  const card: AiLabDatasetCard | undefined = hasCardDetails
    ? {
        description: normalized.description ?? "",
        ...(normalized.potentialUses
          ? { potentialUses: normalized.potentialUses }
          : {}),
        ...(normalized.potentialMisuses
          ? { potentialMisuses: normalized.potentialMisuses }
          : {}),
        ...(normalized.source ? { source: normalized.source } : {}),
      }
    : base.card;
  return {
    ...base,
    name: normalized.name ?? base.name,
    description: normalized.description ?? base.description,
    ...(normalized.cover ? { cover: normalized.cover } : {}),
    ...(card ? { card } : {}),
  };
}

/** Cache parsed uploaded sheets by `(id, updatedAt, csv.length)` so re-renders don't re-parse large CSVs. */
const parsedUploadCache = new Map<string, AiLabDataset>();

export function sheetsToDatasets(sheets: UploadedSheet[]): AiLabDataset[] {
  return sheets.flatMap((sheet) => {
    const cacheKey = `${sheet.id}:${sheet.updatedAt}:${sheet.csv.length}`;
    let dataset = parsedUploadCache.get(cacheKey);
    if (!dataset) {
      dataset = usableDataset(sheet.csv, sheet.id);
      if (dataset) parsedUploadCache.set(cacheKey, dataset);
    }
    return dataset ? [applyMetadataToDataset(dataset, sheet.metadata)] : [];
  });
}
