import type {
  AiLabAlgorithmId,
  AiLabDataset,
  AiLabDatasetCard,
  AiLabDatasetStory,
} from "../../../types/aiLab";
import {
  datasetIdFromPath,
  parseCsvDataset,
  type ProdDatasetMetadata,
} from "../../../lib/aiLab/csvDataset";

/**
 * Every `*.csv` dropped in this folder becomes an AI Lab dataset at build
 * time (Vite `import.meta.glob`, eager + raw). No registration needed —
 * add or remove a file and the studio catalog follows.
 *
 * A matching `*.json` with the same slug (`zoo.json`) supplies production
 * AI Lab metadata (`card`, `defaultLabelColumn`, and per-column `fields`).
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
    card?: AiLabDatasetCard;
    recommendedAlgorithm?: AiLabAlgorithmId;
  }
> = {
  abalone: {
    name: "Abalone",
    recommendedAlgorithm: "knn",
  },
  basketball_shots: {
    name: "NCAA 3-Point Attempts",
    recommendedAlgorithm: "decisionTree",
  },
  bike_sharing: {
    name: "Bike Sharing",
    recommendedAlgorithm: "knn",
  },
  billionaires: {
    name: "Billionaires",
    recommendedAlgorithm: "decisionTree",
  },
  car_evaluation: {
    name: "Car Evaluation",
    recommendedAlgorithm: "decisionTree",
  },
  census_part: {
    name: "Partial Census Data",
    recommendedAlgorithm: "decisionTree",
  },
  exoplanets: {
    name: "Exoplanets",
    recommendedAlgorithm: "knn",
  },
  global_happiness_raw: {
    name: "Global Happiness",
    recommendedAlgorithm: "knn",
  },
  heart: {
    name: "Heart Health",
    recommendedAlgorithm: "decisionTree",
  },
  housing_data: {
    name: "Housing Prices",
    recommendedAlgorithm: "knn",
  },
  insurance_cost: {
    name: "Insurance Data",
    recommendedAlgorithm: "decisionTree",
  },
  jeans: {
    name: "Jeans Measurements",
    recommendedAlgorithm: "knn",
  },
  movies: {
    name: "Movie Stats",
    recommendedAlgorithm: "knn",
  },
  nutrition: {
    name: "Nutrition",
    recommendedAlgorithm: "knn",
  },
  songs: {
    name: "Top Songs",
    recommendedAlgorithm: "knn",
  },
  student_survey: {
    name: "Student Lifestyle Survey",
    recommendedAlgorithm: "decisionTree",
  },
  thanksgiving: {
    name: "Regional Thanksgiving Food Survey",
    recommendedAlgorithm: "decisionTree",
  },
  zoo: {
    name: "Zoo",
    recommendedAlgorithm: "decisionTree",
  },
};

/**
 * Optional cover art. A PNG or JPG named with the dataset slug
 * (`covers/zoo.png`) becomes that dataset's chooser cover.
 */
const coverFiles = import.meta.glob("./covers/*.{png,jpg,jpeg}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const covers = new Map(
  Object.entries(coverFiles).map(([path, url]) => [
    datasetIdFromPath(path.replace(/\.(png|jpe?g)$/i, ".csv")),
    url,
  ]),
);

/**
 * Optional production AI Lab metadata JSON (`zoo.json`), supplying `card`,
 * `defaultLabelColumn`, and `fields` (explicit column types and descriptions).
 */
const metadataFiles = import.meta.glob("./*.json", {
  eager: true,
  import: "default",
}) as Record<string, ProdDatasetMetadata>;

const metadataById = new Map(
  Object.entries(metadataFiles).map(([path, meta]) => [
    datasetIdFromPath(path.replace(/\.json$/i, ".csv")),
    meta,
  ]),
);

const files = import.meta.glob("./*.csv", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export const csvDatasets: AiLabDataset[] = Object.entries(files)
  .map(([path, csv]) => {
    const id = datasetIdFromPath(path);
    const override = overrides[id];
    const metadata = metadataById.get(id);
    const cover = covers.get(id);
    return parseCsvDataset(csv, {
      id,
      metadata,
      cover,
      lazy: true,
      ...override,
    });
  })
  .filter(
    (dataset) =>
      (dataset.columnCount ?? dataset.columns.length) >= 2 &&
      (dataset.rowCount ?? dataset.rows.length) > 0,
  )
  .sort((a, b) => a.name.localeCompare(b.name));
