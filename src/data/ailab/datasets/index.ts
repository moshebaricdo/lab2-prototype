import type { AiLabDataset, AiLabDatasetStory } from "../../../types/aiLab";
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
    story?: AiLabDatasetStory;
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
      "24 animals. Predict Type from yes/no traits. Do not auto-pretrain without a feature list — Animal would become a name lookup.",
    labelColumn: "Type",
    columnDescriptions: {
      animal: "Name of each animal.",
      has_feathers: "Whether it has feathers.",
      breathes_with_lungs: "Whether it uses lungs.",
      lives_in_water: "Whether it lives in water.",
      type: "Bird, mammal, or fish.",
    },
    story: {
      rowNoun: "animal",
      whatIsARow:
        "Each row is one animal. The columns are things we know about it: whether it has feathers, breathes with lungs, or lives in water.",
      source:
        "A class made this sheet by looking up 24 animals in a field guide and writing down yes or no for each trait.",
      question: "Given an animal's traits, is it a bird, a mammal, or a fish?",
      whyItMatters:
        "Scientists sort living things into groups by their traits. A model that learns the pattern can sort an animal it has never seen.",
    },
  },
  catsanddogs_v2: {
    story: {
      rowNoun: "pet",
      whatIsARow:
        "Each row is one pet and a few measurements about it.",
      source: "Collected from pet owners who described their animals.",
      question: "From the measurements alone, is this pet a cat or a dog?",
    },
  },
  iris_species: {
    story: {
      rowNoun: "flower",
      whatIsARow:
        "Each row is one iris flower with the length and width of its petals and sepals in centimeters.",
      source:
        "Measured by botanist Edgar Anderson in 1936 — one of the oldest datasets used to teach machine learning.",
      question: "From four measurements, which of three iris species is this flower?",
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
    const { columnDescriptions, story, ...parseOptions } = override ?? {};
    const parsed = parseCsvDataset(csv, { id, ...parseOptions });
    const dataset: AiLabDataset = story ? { ...parsed, story } : parsed;
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
