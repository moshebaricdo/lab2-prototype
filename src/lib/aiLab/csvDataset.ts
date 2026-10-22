import type {
  AiLabColumn,
  AiLabColumnType,
  AiLabDataRow,
  AiLabDataset,
  AiLabDatasetCard,
} from "../../types/aiLab";

export interface ProdDatasetFieldMetadata {
  id?: string;
  type?: AiLabColumnType;
  description?: string;
}

export interface ProdDatasetMetadata {
  name?: string;
  defaultLabelColumn?: string;
  card?: {
    description?: string;
    source?: string;
    lastUpdated?: string;
    context?: {
      createdBy?: string;
      potentialUses?: string;
      potentialMisuses?: string;
    };
  };
  fields?: ProdDatasetFieldMetadata[];
}

export interface ParseCsvDatasetOptions {
  id: string;
  name?: string;
  description?: string;
  labelColumn?: string;
  columnDescriptions?: Record<string, string>;
  metadata?: ProdDatasetMetadata;
  story?: AiLabDataset["story"];
  card?: AiLabDatasetCard;
  cover?: string;
  recommendedAlgorithm?: AiLabDataset["recommendedAlgorithm"];
  /**
   * Defer full CSV row parsing until `dataset.rows` or `dataset.columns` is
   * first accessed. Keeps startup instant when dozens of multi-thousand-row
   * datasets sit in the catalog.
   */
  lazy?: boolean;
}

/**
 * Turn a raw CSV file into an `AiLabDataset`.
 *
 * - Header row names the columns; blank / duplicate headers are dropped.
 * - A column is `numerical` when every non-blank cell parses as a number
 *   (unless overridden by `metadata.fields` as `categorical`), otherwise
 *   `categorical`. Values are trimmed.
 * - The last column is the default label unless `options.labelColumn` or
 *   `metadata.defaultLabelColumn` is set.
 * - Rows that are entirely blank are skipped.
 */
export function parseCsvDataset(
  csv: string,
  options: ParseCsvDatasetOptions,
): AiLabDataset {
  const metaCard = options.metadata?.card;
  const card: AiLabDatasetCard | undefined =
    options.card ??
    (metaCard?.description
      ? {
          description: metaCard.description,
          ...(metaCard.source ? { source: metaCard.source } : {}),
          ...(metaCard.lastUpdated ? { lastUpdated: metaCard.lastUpdated } : {}),
          ...(metaCard.context?.potentialUses
            ? { potentialUses: metaCard.context.potentialUses }
            : {}),
          ...(metaCard.context?.potentialMisuses
            ? { potentialMisuses: metaCard.context.potentialMisuses }
            : {}),
        }
      : undefined);

  if (!options.lazy) {
    return buildDataset(csv, options, card);
  }

  let built: AiLabDataset | undefined;
  const ensure = (): AiLabDataset => {
    if (!built) {
      built = buildDataset(csv, options, card);
    }
    return built;
  };

  const quick = quickCsvShape(csv, options.metadata);
  const name = options.name ?? humanize(options.id);
  const description =
    options.description ??
    card?.description ??
    `Imported CSV · ${quick.rowCount} rows · ${quick.columnCount} columns.`;

  const dataset: AiLabDataset = {
    id: options.id,
    name,
    description,
    defaultLabelColumn: "",
    columns: [],
    rows: [],
    rowCount: quick.rowCount,
    columnCount: quick.columnCount,
    ...(options.story ? { story: options.story } : {}),
    ...(card ? { card } : {}),
    ...(options.cover ? { cover: options.cover } : {}),
    ...(options.recommendedAlgorithm
      ? { recommendedAlgorithm: options.recommendedAlgorithm }
      : {}),
  };

  Object.defineProperties(dataset, {
    defaultLabelColumn: {
      enumerable: true,
      configurable: true,
      get() {
        return ensure().defaultLabelColumn;
      },
    },
    columns: {
      enumerable: true,
      configurable: true,
      get() {
        return ensure().columns;
      },
    },
    rows: {
      enumerable: true,
      configurable: true,
      get() {
        return ensure().rows;
      },
    },
  });

  return dataset;
}

function buildDataset(
  csv: string,
  options: ParseCsvDatasetOptions,
  card: AiLabDatasetCard | undefined,
): AiLabDataset {
  const table = parseCsv(csv);
  const [header = [], ...body] = table;

  const seen = new Set<string>();
  const kept: { index: number; id: string; name: string }[] = [];
  header.forEach((rawName, index) => {
    const name = rawName.trim();
    if (!name) return;
    const id = uniqueSlug(name, seen);
    kept.push({ index, id, name });
  });

  const rows: AiLabDataRow[] = [];
  for (let r = 0; r < body.length; r += 1) {
    const cells = body[r]!;
    let allBlank = true;
    for (let c = 0; c < cells.length; c += 1) {
      if (cells[c]!.trim() !== "") {
        allBlank = false;
        break;
      }
    }
    if (allBlank) continue;
    const row: AiLabDataRow = {};
    for (let k = 0; k < kept.length; k += 1) {
      const column = kept[k]!;
      row[column.id] = (cells[column.index] ?? "").trim();
    }
    rows.push(row);
  }

  const fieldMetaByName = new Map<string, ProdDatasetFieldMetadata>();
  const fieldMetaBySlug = new Map<string, ProdDatasetFieldMetadata>();
  for (const field of options.metadata?.fields ?? []) {
    if (!field.id) continue;
    fieldMetaByName.set(field.id.trim(), field);
    fieldMetaBySlug.set(slugify(field.id), field);
  }

  const columns: AiLabColumn[] = kept.map((column) => {
    const fieldMeta =
      fieldMetaByName.get(column.name) ?? fieldMetaBySlug.get(column.id);
    const columnOverride = options.columnDescriptions?.[column.id];
    let nonEmptyCount = 0;
    let allNumeric = true;
    for (let r = 0; r < rows.length; r += 1) {
      const value = String(rows[r]![column.id]);
      if (value === "") continue;
      nonEmptyCount += 1;
      if (allNumeric && !isNumeric(value)) {
        allNumeric = false;
      }
    }
    const inferredNumeric = nonEmptyCount > 0 && allNumeric;
    const numeric =
      fieldMeta?.type === "categorical"
        ? false
        : fieldMeta?.type === "numerical"
          ? inferredNumeric
          : inferredNumeric;

    if (numeric) {
      for (let r = 0; r < rows.length; r += 1) {
        const row = rows[r]!;
        const value = String(row[column.id]);
        row[column.id] = value === "" ? "" : Number(value);
      }
    }

    const description =
      columnOverride ||
      fieldMeta?.description?.trim() ||
      (numeric
        ? `${column.name} (number).`
        : `${column.name} (${countDistinct(rows, column.id)} values).`);

    return {
      id: column.id,
      name: column.name,
      type: numeric ? "numerical" : "categorical",
      description,
    };
  });

  const preferredLabel =
    options.labelColumn || options.metadata?.defaultLabelColumn;
  const labelColumn =
    (preferredLabel &&
      columns.find(
        (column) =>
          column.id === preferredLabel ||
          column.name === preferredLabel ||
          column.id === slugify(preferredLabel),
      )?.id) ||
    columns[columns.length - 1]?.id ||
    "";

  return {
    id: options.id,
    name: options.name ?? humanize(options.id),
    description:
      options.description ??
      card?.description ??
      `Imported CSV · ${rows.length} rows · ${columns.length} columns.`,
    defaultLabelColumn: labelColumn,
    columns,
    rows,
    rowCount: rows.length,
    columnCount: columns.length,
    ...(options.story ? { story: options.story } : {}),
    ...(card ? { card } : {}),
    ...(options.cover ? { cover: options.cover } : {}),
    ...(options.recommendedAlgorithm
      ? { recommendedAlgorithm: options.recommendedAlgorithm }
      : {}),
  };
}

/** Fast O(N) newline/header scan so lazy datasets know row/column count without allocating row objects. */
function quickCsvShape(
  csv: string,
  metadata?: ProdDatasetMetadata,
): { rowCount: number; columnCount: number } {
  const source = csv.replace(/^\uFEFF/, "");
  let inQuotes = false;
  let lineCount = 0;
  let lineHasNonSpace = false;
  let firstLineEnd = source.length;
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (source[i + 1] === '"') i += 1;
        else inQuotes = false;
      }
      lineHasNonSpace = true;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      lineHasNonSpace = true;
    } else if (ch === "\n" || ch === "\r") {
      if (lineCount === 0 && lineHasNonSpace) {
        firstLineEnd = i;
      }
      if (ch === "\r" && source[i + 1] === "\n") i += 1;
      if (lineHasNonSpace) lineCount += 1;
      lineHasNonSpace = false;
    } else if (ch !== " " && ch !== "\t" && ch !== ",") {
      lineHasNonSpace = true;
    }
  }
  if (lineHasNonSpace) lineCount += 1;
  const rowCount = Math.max(0, lineCount - 1);
  if (metadata?.fields?.length) {
    return { rowCount, columnCount: metadata.fields.length };
  }
  const headerCells = parseCsv(source.slice(0, firstLineEnd))[0] ?? [];
  const columnCount = headerCells.filter((cell) => cell.trim() !== "").length;
  return { rowCount, columnCount };
}

/** Build a dataset id / display name from a file path like `./my_data.csv`. */
export function datasetIdFromPath(path: string): string {
  const file = path.split("/").pop() ?? path;
  return slugify(file.replace(/\.csv$/i, ""));
}

function countDistinct(rows: AiLabDataRow[], id: string): number {
  return new Set(rows.map((row) => row[id])).size;
}

function isNumeric(value: string): boolean {
  return /^-?\d+(\.\d+)?$/.test(value);
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "column"
  );
}

function uniqueSlug(text: string, seen: Set<string>): string {
  const base = slugify(text);
  let id = base;
  let n = 2;
  while (seen.has(id)) id = `${base}_${n++}`;
  seen.add(id);
  return id;
}

function humanize(slug: string): string {
  const words = slug.replace(/[_-]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** RFC 4180-ish CSV parser: quoted fields, escaped quotes, CRLF. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const source = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (inQuotes) {
      if (ch === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && source[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}
