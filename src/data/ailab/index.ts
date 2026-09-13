import type { AiLabLevelConfig } from "../../types/aiLab";
import { tacoTruckDataset } from "./tacoTruck";
import { tacoTruckGuidedDataset } from "./tacoTruckGuided";
import { csvDatasets } from "./datasets";

export { csvDatasets } from "./datasets";
export { tacoTruckDataset } from "./tacoTruck";
export { tacoTruckGuidedDataset } from "./tacoTruckGuided";
export {
  aiLabGuidedSectionInstructions,
  aiLabPretrainedInstructions,
  aiLabSectionInstructions,
  aiLabStudioSectionInstructions,
} from "./instructions";

// Studio picker is every CSV in src/data/ailab/datasets/*.csv (build-time glob).
export const aiLabStudioCatalog = csvDatasets;

export const aiLabTrainYourselfConfig: AiLabLevelConfig = {
  dataset: csvDatasets[0]!,
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
