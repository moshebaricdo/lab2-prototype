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
  {
    name?: string;
    description?: string;
    labelColumn?: string;
    columnDescriptions?: Record<string, string>;
  }
> = {
  online_food_delivery_dataset: {
    name: "Online food delivery",
    description:
      "Survey of food-delivery customers in Bengaluru. Predict whether a customer would order online again.",
    labelColumn: "Output",
  },
  bird_mammal_or_fish: {
    name: "Bird, mammal, or fish",
    description:
      "24 animals. Predict Class from yes/no traits. Do not auto-pretrain without a feature list — Animal would become a name lookup.",
    labelColumn: "Class",
    columnDescriptions: {
      animal: "Name of each animal.",
      has_feathers: "Whether it has feathers.",
      breathes_with_lungs: "Whether it uses lungs.",
      lives_in_water: "Whether it lives in water.",
      class: "Bird, mammal, or fish.",
    },
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
    const override = overrides[id];
    const dataset = parseCsvDataset(csv, { id, ...override });
    const columnDescriptions = override?.columnDescriptions;
    if (!columnDescriptions) return dataset;
    return {
      ...dataset,
      columns: dataset.columns.map((column) => ({
        ...column,
        description: columnDescriptions[column.id] ?? column.description,
      })),
    };
  })
  .filter((dataset) => dataset.columns.length >= 2 && dataset.rows.length > 0);
