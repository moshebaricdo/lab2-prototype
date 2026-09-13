import type { AiLabDataset, AiLabLevelConfig } from "../../types/aiLab";

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
