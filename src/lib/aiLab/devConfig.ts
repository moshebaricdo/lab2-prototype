import type { AiLabAlgorithmId, AiLabDataset, AiLabLevelConfig } from "../../types/aiLab";
import {
  AI_LAB_STUDENT_CHOICE,
  findCatalogDataset,
  pretrainedFromDataset,
  resolveOptionalColumn,
  resolvePresetFeatures,
  resolvePresetLabelColumn,
  testingOnlyDataset,
} from "./catalog";

/** Levelbuilder-shaped Dev panel knobs. */
export interface AiLabDevOverrides {
  algorithmLock: string;
  algorithmSwitcher?: string;
  presetDataset: string;
  presetLabelColumn: string;
  cardTitleColumn: string;
  presetFeatures: string[];
  workspaceTabs: string;
  hideTrainPanel: boolean;
  defaultDataView: string;
  bundleWideSplits: boolean;
  trainingAnimation: string;
  treeNodeDetail: string;
  randomizeTestData: boolean;
  projectSaving?: boolean;
}

export function aiLabDevDefaults(
  config: AiLabLevelConfig,
): AiLabDevOverrides {
  const lockedLabel =
    config.presetLabelColumn ??
    (config.lockLabelColumn ? config.dataset.defaultLabelColumn : undefined);
  return {
    algorithmLock: config.algorithmLock ?? "none",
    algorithmSwitcher: config.algorithmSwitcher ?? "modal",
    presetDataset: config.lockDataset
      ? config.dataset.id
      : AI_LAB_STUDENT_CHOICE,
    presetLabelColumn: lockedLabel ?? AI_LAB_STUDENT_CHOICE,
    cardTitleColumn: config.cardTitleColumn ?? AI_LAB_STUDENT_CHOICE,
    presetFeatures: config.presetFeatures ?? [],
    workspaceTabs: config.hideDatasetTab
      ? "test"
      : config.hideTestTab
        ? "dataset"
        : "both",
    hideTrainPanel: Boolean(config.hideTrainTab) && !config.hideDatasetTab,
    defaultDataView: config.defaultDataView ?? "table",
    bundleWideSplits: Boolean(config.bundleWideSplits),
    trainingAnimation: config.trainingAnimation ?? "rows",
    treeNodeDetail: config.treeNodeDetail ?? "modal",
    randomizeTestData: Boolean(config.randomizeTestData),
    projectSaving: Boolean(config.projectSaving),
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
 * the other flags. Canvas Testing, sheet edit, export, and scorecard are
 * not Dev knobs — they stay on the authored config.
 */
export function mergeAiLabDevConfig(
  base: AiLabLevelConfig,
  resolved: AiLabDevOverrides,
  catalog: AiLabDataset[],
): AiLabLevelConfig {
  const hideDatasetTab = resolved.workspaceTabs === "test";
  const hideTestTab = resolved.workspaceTabs === "dataset";
  const hideTrainTab = hideDatasetTab || resolved.hideTrainPanel;
  const chosenDataset = findCatalogDataset(catalog, resolved.presetDataset);
  const lockDataset = Boolean(chosenDataset) || hideDatasetTab;
  const dataset = hideDatasetTab
    ? (chosenDataset ?? testingOnlyDataset(catalog, base.dataset))
    : (chosenDataset ?? base.dataset);
  const presetLabelColumn = resolvePresetLabelColumn(
    dataset,
    resolved.presetLabelColumn,
  );
  const cardTitleColumn = resolveOptionalColumn(
    dataset,
    resolved.cardTitleColumn,
  );
  const presetFeatures = resolvePresetFeatures(
    dataset,
    resolved.presetFeatures,
    presetLabelColumn,
  );
  const chosenAlgorithm = asAlgorithm(resolved.algorithmLock);
  const sheetReady =
    (dataset.rowCount ?? dataset.rows.length) > 0 &&
    (dataset.columnCount ?? dataset.columns.length) >= 2;
  const needsPretrained =
    sheetReady && (hideDatasetTab || (hideTrainTab && !hideTestTab));
  const pretrainedAlgorithm =
    chosenAlgorithm ??
    (needsPretrained ? (base.pretrained?.algorithm ?? "decisionTree") : undefined);
  const sameDatasetAsBase = dataset.id === base.dataset.id;
  const pretrained = needsPretrained
    ? sameDatasetAsBase && base.pretrained
      ? {
          ...base.pretrained,
          algorithm: pretrainedAlgorithm ?? base.pretrained.algorithm,
          labelColumn: presetLabelColumn ?? base.pretrained.labelColumn,
          selectedFeatures: presetFeatures.length
            ? presetFeatures
            : base.pretrained.selectedFeatures,
        }
      : pretrainedFromDataset(
          dataset,
          pretrainedAlgorithm ?? "decisionTree",
          presetLabelColumn,
          presetFeatures,
        )
    : sameDatasetAsBase
      ? base.pretrained
      : undefined;

  return {
    ...base,
    dataset,
    availableDatasets: catalog,
    lockDataset: sheetReady && lockDataset,
    requireDatasetChoice: !(sheetReady && lockDataset),
    algorithmLock: pretrainedAlgorithm,
    algorithmSwitcher:
      resolved.algorithmSwitcher === "dropdown" ? "dropdown" : "modal",
    hideDatasetTab: sheetReady && hideDatasetTab,
    hideTestTab,
    hideTrainTab,
    hideLabelSelect: presetLabelColumn ? false : base.hideLabelSelect,
    lockLabelColumn: Boolean(presetLabelColumn),
    presetLabelColumn,
    presetFeatures,
    lockFeatures: presetFeatures.length > 0,
    cardTitleColumn,
    showExport: Boolean(base.showExport),
    showModelDetails: Boolean(base.showModelDetails),
    allowDataEdit: base.allowDataEdit !== false,
    defaultDataView:
      resolved.defaultDataView === "cards" ? "cards" : "table",
    testLayout: "canvas",
    bundleWideSplits: Boolean(resolved.bundleWideSplits),
    trainingAnimation: resolved.trainingAnimation === "tree" ? "tree" : "rows",
    treeNodeDetail: resolved.treeNodeDetail === "inline" ? "inline" : "modal",
    randomizeTestData: Boolean(resolved.randomizeTestData),
    projectSaving: Boolean(resolved.projectSaving),
    pretrained,
    initialSection: !sheetReady
      ? "dataset"
      : hideDatasetTab
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
    { label: "User chooses", value: AI_LAB_STUDENT_CHOICE },
    ...catalog.map((dataset) => ({
      label: dataset.name,
      value: dataset.id,
    })),
  ];
}
