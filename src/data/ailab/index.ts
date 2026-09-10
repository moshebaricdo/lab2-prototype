import type { AiLabLevelConfig } from "../../types/aiLab";
import { tacoTruckDataset } from "./tacoTruck";
import { tacoTruckGuidedDataset } from "./tacoTruckGuided";

export { tacoTruckDataset } from "./tacoTruck";
export { tacoTruckGuidedDataset } from "./tacoTruckGuided";
export {
  aiLabGuidedSectionInstructions,
  aiLabPretrainedInstructions,
  aiLabSectionInstructions,
} from "./instructions";

export const aiLabTrainYourselfConfig: AiLabLevelConfig = {
  dataset: tacoTruckDataset,
};

export const aiLabPretrainedConfig: AiLabLevelConfig = {
  dataset: tacoTruckDataset,
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
  classificationOnly: true,
  defaultKnnK: 3,
  holdoutCount: 5,
  trainAsOverlay: true,
};
