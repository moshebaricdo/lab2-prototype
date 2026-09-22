import type {
  AiLabAlgorithmId,
  AiLabDataset,
  AiLabLevelConfig,
} from "../../types/aiLab";
import { categoryCheck } from "./cardinality";

/** Studio testing-only example: small labeled sheet that trains instantly. */
export const AI_LAB_TESTING_ONLY_DATASET_ID = "iris_species";

export const AI_LAB_STUDENT_CHOICE = "student";

export function catalogDatasets(config: AiLabLevelConfig): AiLabDataset[] {
  if (config.availableDatasets && config.availableDatasets.length > 0) {
    return config.availableDatasets;
  }
  return [config.dataset];
}

export function resolveDataset(
  config: AiLabLevelConfig,
  datasetId: string | undefined,
): AiLabDataset | undefined {
  if (!datasetId) return undefined;
  return catalogDatasets(config).find((dataset) => dataset.id === datasetId);
}

export function initialDatasetId(
  config: AiLabLevelConfig,
): string | undefined {
  if (config.lockDataset || !config.requireDatasetChoice) {
    return config.dataset.id;
  }
  return undefined;
}

export function slugifyModelName(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "model"
  );
}

export function findCatalogDataset(
  catalog: AiLabDataset[],
  datasetId: string | undefined,
): AiLabDataset | undefined {
  if (!datasetId) return undefined;
  return catalog.find((dataset) => dataset.id === datasetId);
}

/** Prefer Iris for the testing-only example; otherwise the first catalog row. */
export function testingOnlyDataset(
  catalog: AiLabDataset[],
  fallback: AiLabDataset,
): AiLabDataset {
  return (
    findCatalogDataset(catalog, AI_LAB_TESTING_ONLY_DATASET_ID) ??
    catalog[0] ??
    fallback
  );
}

/** Locked Predict column, or undefined when the student may choose. */
export function resolvePresetLabelColumn(
  dataset: AiLabDataset,
  preset: string | undefined,
): string | undefined {
  if (!preset || preset === AI_LAB_STUDENT_CHOICE) return undefined;
  const match = dataset.columns.find(
    (column) => column.id === preset || column.name === preset,
  );
  return match?.id ?? dataset.defaultLabelColumn;
}

export function resolveOptionalColumn(
  dataset: AiLabDataset,
  preset: string | undefined,
): string | undefined {
  if (!preset || preset === AI_LAB_STUDENT_CHOICE) return undefined;
  return dataset.columns.find(
    (column) => column.id === preset || column.name === preset,
  )?.id;
}

export function labelColumnDevOptions(
  dataset: AiLabDataset,
): { label: string; value: string }[] {
  return [
    { label: "Student chooses", value: AI_LAB_STUDENT_CHOICE },
    ...dataset.columns.map((column) => ({
      label: column.name,
      value: column.id,
    })),
  ];
}

export function cardTitleColumnDevOptions(
  dataset: AiLabDataset,
): { label: string; value: string }[] {
  return [
    { label: "Row number", value: AI_LAB_STUDENT_CHOICE },
    ...dataset.columns.map((column) => ({
      label: column.name,
      value: column.id,
    })),
  ];
}

/**
 * Levelbuilder-style pretrained spec: chosen or default label plus the
 * first few usable feature columns (skip `id` and blocked categoricals).
 */
export function pretrainedFromDataset(
  dataset: AiLabDataset,
  algorithm: AiLabAlgorithmId,
  labelColumnId?: string,
): NonNullable<AiLabLevelConfig["pretrained"]> {
  const labelColumn =
    resolvePresetLabelColumn(dataset, labelColumnId) ??
    dataset.defaultLabelColumn;
  const selectedFeatures = dataset.columns
    .filter((column) => column.id !== labelColumn)
    .filter((column) => {
      if (/^id$/i.test(column.id) || /^id$/i.test(column.name)) return false;
      return categoryCheck(dataset.rows, dataset.columns, column.id)?.fit !==
        "blocked";
    })
    .slice(0, 3)
    .map((column) => column.id);

  if (selectedFeatures.length === 0) {
    const fallback = dataset.columns.find((column) => column.id !== labelColumn);
    if (fallback) selectedFeatures.push(fallback.id);
  }

  return {
    algorithm,
    labelColumn,
    selectedFeatures,
  };
}
