import type {
  AiLabAlgorithmId,
  AiLabDataset,
  AiLabLevelConfig,
  AiLabTestLayout,
} from "../../types/aiLab";
import {
  AI_LAB_STUDENT_CHOICE,
  findCatalogDataset,
  pretrainedFromDataset,
  testingOnlyDataset,
} from "./catalog";

export interface AiLabDevOverrides {
  algorithmLock: string;
  presetDataset: string;
  workspaceTabs: string;
  showTrainPanel: boolean;
  showExport: boolean;
  showModelDetails: boolean;
  allowDataEdit: boolean;
  defaultDataView: string;
  testLayout: string;
}

export function aiLabDevDefaults(
  config: AiLabLevelConfig,
): AiLabDevOverrides {
  return {
    algorithmLock: config.algorithmLock ?? "none",
    presetDataset: config.lockDataset
      ? config.dataset.id
      : AI_LAB_STUDENT_CHOICE,
    workspaceTabs: config.hideDatasetTab
      ? "test"
      : config.hideTestTab
        ? "dataset"
        : "both",
    showTrainPanel: !config.hideTrainTab,
    showExport: Boolean(config.showExport),
    showModelDetails: Boolean(config.showModelDetails),
    allowDataEdit: config.allowDataEdit !== false,
    defaultDataView: config.defaultDataView ?? "table",
    testLayout: config.testLayout ?? "dock",
  };
}

function asAlgorithm(value: string): AiLabAlgorithmId | undefined {
  if (value === "knn" || value === "decisionTree") return value;
  return undefined;
}

/**
 * Map levelbuilder-style dev-panel flags onto `AiLabLevelConfig`.
 *
 * Testing-only (and train-off + Testing) loads a pretrained model so the
 * student can use Testing. Dataset-only hides Testing and combines with
 * the other flags.
 */
export function mergeAiLabDevConfig(
  base: AiLabLevelConfig,
  resolved: AiLabDevOverrides,
  catalog: AiLabDataset[],
): AiLabLevelConfig {
  const hideDatasetTab = resolved.workspaceTabs === "test";
  const hideTestTab = resolved.workspaceTabs === "dataset";
  const hideTrainTab = hideDatasetTab || !resolved.showTrainPanel;
  const chosenDataset = findCatalogDataset(catalog, resolved.presetDataset);
  const lockDataset = Boolean(chosenDataset) || hideDatasetTab;
  const dataset = hideDatasetTab
    ? (chosenDataset ?? testingOnlyDataset(catalog, base.dataset))
    : (chosenDataset ?? base.dataset);
  const chosenAlgorithm = asAlgorithm(resolved.algorithmLock);
  const needsPretrained = hideDatasetTab || (hideTrainTab && !hideTestTab);
  const pretrainedAlgorithm =
    chosenAlgorithm ??
    (needsPretrained ? (base.pretrained?.algorithm ?? "decisionTree") : undefined);
  const sameDatasetAsBase = dataset.id === base.dataset.id;
  const pretrained = needsPretrained
    ? sameDatasetAsBase && base.pretrained
      ? {
          ...base.pretrained,
          algorithm: pretrainedAlgorithm ?? base.pretrained.algorithm,
        }
      : pretrainedFromDataset(dataset, pretrainedAlgorithm ?? "decisionTree")
    : sameDatasetAsBase
      ? base.pretrained
      : undefined;

  return {
    ...base,
    dataset,
    availableDatasets: catalog,
    lockDataset,
    requireDatasetChoice: !lockDataset,
    algorithmLock: pretrainedAlgorithm,
    hideDatasetTab,
    hideTestTab,
    hideTrainTab,
    showExport: Boolean(resolved.showExport),
    showModelDetails: Boolean(resolved.showModelDetails),
    allowDataEdit: Boolean(resolved.allowDataEdit),
    defaultDataView:
      resolved.defaultDataView === "cards" ? "cards" : "table",
    testLayout:
      resolved.testLayout === "canvas" ? "canvas" : ("dock" as AiLabTestLayout),
    pretrained,
    initialSection: hideDatasetTab
      ? "test"
      : hideTestTab
        ? "dataset"
        : base.initialSection,
  };
}

export function uniqueDevCatalog(
  base: AiLabDataset,
  studioCatalog: AiLabDataset[],
): AiLabDataset[] {
  const seen = new Set<string>();
  const catalog: AiLabDataset[] = [];
  for (const dataset of [base, ...studioCatalog]) {
    if (seen.has(dataset.id)) continue;
    seen.add(dataset.id);
    catalog.push(dataset);
  }
  return catalog;
}

export function datasetDevOptions(
  catalog: AiLabDataset[],
): { label: string; value: string }[] {
  return [
    { label: "Student chooses", value: AI_LAB_STUDENT_CHOICE },
    ...catalog.map((dataset) => ({
      label: dataset.name,
      value: dataset.id,
    })),
  ];
}
