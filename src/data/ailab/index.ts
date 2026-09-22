import type { AiLabLevelConfig } from "../../types/aiLab";
import { tacoTruckDataset } from "./tacoTruck";
import { tacoTruckGuidedDataset } from "./tacoTruckGuided";
import { csvDatasets } from "./datasets";

export { csvDatasets } from "./datasets";
export { tacoTruckDataset } from "./tacoTruck";
export { tacoTruckGuidedDataset } from "./tacoTruckGuided";
export {
  aiLabGuidedSectionInstructions,
  aiLabP0Instructions,
  aiLabPlaytestBuildInstructions,
  aiLabPlaytestLookInstructions,
  aiLabPlaytestTryInstructions,
  aiLabPlaytestV2BuildInstructions,
  aiLabPlaytestV2LookInstructions,
  aiLabPlaytestV2TryInstructions,
  aiLabPretrainedInstructions,
  aiLabSectionInstructions,
  aiLabStudioSectionInstructions,
} from "./instructions";

function datasetById(id: string) {
  const dataset = csvDatasets.find((entry) => entry.id === id);
  if (!dataset) {
    throw new Error(`Missing AI Lab dataset: ${id}`);
  }
  return dataset;
}

/** Playtest sheet. Do not auto-pretrain without a feature list — Animal would win. */
export const aiLabPlaytestDataset = datasetById("bird_mammal_or_fish");

export const AI_LAB_PLAYTEST_LABEL_COLUMN = "type";
export const AI_LAB_PLAYTEST_TREE_FEATURES = [
  "has_feathers",
  "breathes_with_lungs",
] as const;

const aiLabPlaytestShared = {
  dataset: aiLabPlaytestDataset,
  lockDataset: true,
  requireDatasetChoice: false,
  algorithmLock: "decisionTree" as const,
  hideLabelSelect: true,
  allowDataEdit: false,
  showModelDetails: false,
  showExport: false,
  hideTestViewToggle: true,
  trainAsOverlay: true,
  defaultDataView: "table" as const,
};

// Studio picker is every CSV in src/data/ailab/datasets/*.csv (build-time glob).
export const aiLabStudioCatalog = csvDatasets;

const studioDefaultDataset =
  csvDatasets.find((dataset) => dataset.id === "catsanddogs_v2") ??
  csvDatasets[0]!;

export const aiLabTrainYourselfConfig: AiLabLevelConfig = {
  dataset: studioDefaultDataset,
  availableDatasets: aiLabStudioCatalog,
  lockDataset: false,
  requireDatasetChoice: true,
  showModelDetails: true,
  showExport: true,
  trainAsOverlay: true,
};

export const aiLabPretrainedConfig: AiLabLevelConfig = {
  dataset: tacoTruckDataset,
  lockDataset: true,
  showModelDetails: true,
  showExport: false,
  algorithmLock: "decisionTree",
  hideDatasetTab: true,
  hideTrainTab: true,
  hideLabelSelect: true,
  initialSection: "test",
  pretrained: {
    algorithm: "decisionTree",
    labelColumn: "would_order_again",
    selectedFeatures: ["protein", "salsa", "spice"],
  },
};

export const aiLabGuidedConfig: AiLabLevelConfig = {
  dataset: tacoTruckGuidedDataset,
  lockDataset: true,
  showModelDetails: false,
  showExport: false,
  classificationOnly: true,
  defaultKnnK: 3,
  trainAsOverlay: true,
};

/**
 * P0 handoff — curriculum-shaped defaults with the current product on
 * (training modal, auto-play, Cards). Dev panel knobs mirror levelbuilder.
 */
export const aiLabP0Config: AiLabLevelConfig = {
  dataset: aiLabPlaytestDataset,
  availableDatasets: aiLabStudioCatalog,
  lockDataset: true,
  requireDatasetChoice: false,
  algorithmLock: "decisionTree",
  hideLabelSelect: false,
  lockLabelColumn: true,
  presetLabelColumn: AI_LAB_PLAYTEST_LABEL_COLUMN,
  excludedFeatureColumns: ["animal"],
  allowDataEdit: false,
  showModelDetails: false,
  showExport: false,
  trainAsOverlay: true,
  defaultDataView: "cards",
  hideCardLayoutToggle: true,
  cardTitleColumn: "animal",
  hideTestViewToggle: true,
  trainingModal: true,
  autoPlayTrace: true,
  bundleWideSplits: true,
  testLayout: "canvas",
};

export const aiLabPlaytestLookConfig: AiLabLevelConfig = {
  ...aiLabPlaytestShared,
  hideTestTab: true,
  hideTrainTab: true,
  initialSection: "dataset",
};

export const aiLabPlaytestTryConfig: AiLabLevelConfig = {
  ...aiLabPlaytestShared,
  hideDatasetTab: true,
  hideTrainTab: true,
  initialSection: "test",
  pretrained: {
    algorithm: "decisionTree",
    labelColumn: AI_LAB_PLAYTEST_LABEL_COLUMN,
    selectedFeatures: [...AI_LAB_PLAYTEST_TREE_FEATURES],
  },
};

export const aiLabPlaytestBuildConfig: AiLabLevelConfig = {
  ...aiLabPlaytestShared,
  hideLabelSelect: false,
  lockLabelColumn: true,
  presetLabelColumn: AI_LAB_PLAYTEST_LABEL_COLUMN,
  excludedFeatureColumns: ["animal"],
  initialSection: "dataset",
};

/*
 * v2 playtest — same look → try → build shape with the post-playtest work
 * turned on: story-first classify deck before the sheet, Cards as the
 * default view, training modal, auto-played trace, real-row Random. The
 * original three stay as the demo baseline.
 */
export const aiLabPlaytestV2LookConfig: AiLabLevelConfig = {
  ...aiLabPlaytestShared,
  hideTestTab: true,
  hideTrainTab: true,
  initialSection: "dataset",
  defaultDataView: "cards",
  introActivity: {
    mode: "classify",
    showStoryFirst: true,
    rowCount: 5,
    visibleColumns: ["animal", "has_feathers", "breathes_with_lungs", "lives_in_water"],
    reveal: "all",
  },
};

export const aiLabPlaytestV2TryConfig: AiLabLevelConfig = {
  ...aiLabPlaytestTryConfig,
  autoPlayTrace: true,
};

export const aiLabPlaytestV2BuildConfig: AiLabLevelConfig = {
  ...aiLabPlaytestBuildConfig,
  autoPlayTrace: true,
  trainingModal: true,
};
