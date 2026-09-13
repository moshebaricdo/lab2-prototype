import type { AiLabDataset } from "../../../types/aiLab";
import {
  datasetIdFromPath,
  parseCsvDataset,
} from "../../../lib/aiLab/csvDataset";

/**
 * Every `*.csv` dropped in this folder becomes an AI Lab dataset at build
 * time (Vite `import.meta.glob`, eager + raw). No registration needed —
 * add or remove a file and the studio catalog follows.
 *
 * Optional per-file overrides (display name, description, label column)
 * live in `overrides` below, keyed by the file's slug (`My Data.csv` →
 * `my_data`). Everything else is inferred; see `parseCsvDataset`.
 */
const overrides: Record<
  string,
  { name?: string; description?: string; labelColumn?: string }
> = {
  online_food_delivery_dataset: {
    name: "Online food delivery",
    description:
      "Survey of food-delivery customers in Bengaluru. Predict whether a customer would order online again.",
    labelColumn: "Output",
  },
};

const files = import.meta.glob("./*.csv", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export const csvDatasets: AiLabDataset[] = Object.entries(files)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, csv]) => {
    const id = datasetIdFromPath(path);
    return parseCsvDataset(csv, { id, ...overrides[id] });
  })
  .filter((dataset) => dataset.columns.length >= 2 && dataset.rows.length > 0);
