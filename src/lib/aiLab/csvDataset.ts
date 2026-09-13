import type {
  AiLabColumn,
  AiLabDataRow,
  AiLabDataset,
} from "../../types/aiLab";

/**
 * Turn a raw CSV file into an `AiLabDataset`.
 *
 * - Header row names the columns; blank / duplicate headers are dropped.
 * - A column is `numerical` when every non-blank cell parses as a number,
 *   otherwise `categorical`. Values are trimmed.
 * - The last column is the default label unless `options.labelColumn` is set.
 * - Rows that are entirely blank are skipped.
 */
export function parseCsvDataset(
  csv: string,
  options: {
    id: string;
    name?: string;
    description?: string;
    labelColumn?: string;
  },
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
  for (const cells of body) {
    if (cells.every((cell) => cell.trim() === "")) continue;
    const row: AiLabDataRow = {};
    for (const column of kept) {
      row[column.id] = (cells[column.index] ?? "").trim();
    }
    rows.push(row);
  }

  const columns: AiLabColumn[] = kept.map((column) => {
    const values = rows
      .map((row) => String(row[column.id]))
      .filter((value) => value !== "");
    const numeric =
      values.length > 0 && values.every((value) => isNumeric(value));
    if (numeric) {
      for (const row of rows) {
        const value = String(row[column.id]);
        row[column.id] = value === "" ? "" : Number(value);
      }
    }
    return {
      id: column.id,
      name: column.name,
      type: numeric ? "numerical" : "categorical",
      description: numeric
        ? `${column.name} (number).`
        : `${column.name} (${countDistinct(rows, column.id)} values).`,
    };
  });

  const labelColumn =
    (options.labelColumn &&
      columns.find(
        (column) =>
          column.id === options.labelColumn ||
          column.name === options.labelColumn,
      )?.id) ||
    columns[columns.length - 1]?.id ||
    "";

  return {
    id: options.id,
    name: options.name ?? humanize(options.id),
    description:
      options.description ??
      `Imported CSV · ${rows.length} rows · ${columns.length} columns.`,
    defaultLabelColumn: labelColumn,
    columns,
    rows,
  };
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
