export type AiLabAlgorithmId = "knn" | "decisionTree";

export type AiLabSection = "algorithm" | "dataset" | "train" | "test";

export type AiLabColumnType = "categorical" | "numerical";

export type AiLabDataView = "table" | "cards";

export type AiLabCardLayout = "catalog" | "carousel";

export type AiLabCellValue = string | number;

export type AiLabDataRow = Record<string, AiLabCellValue>;

export interface AiLabColumn {
  id: string;
  name: string;
  type: AiLabColumnType;
  description: string;
}

export interface AiLabDataset {
  id: string;
  name: string;
  description: string;
  defaultLabelColumn: string;
  columns: AiLabColumn[];
  rows: AiLabDataRow[];
}

export interface AiLabDecisionLeaf {
  type: "leaf";
  pathKey: string;
  prediction: string;
  sampleCount: number;
}

export interface AiLabCategoricalSplit {
  type: "decision";
  pathKey: string;
  feature: string;
  splitType: "categorical";
  sampleCount: number;
  impurityReduction: number;
  children: Record<string, AiLabTreeNode>;
}

export interface AiLabNumericalSplit {
  type: "decision";
  pathKey: string;
  feature: string;
  splitType: "numerical";
  threshold: number;
  sampleCount: number;
  impurityReduction: number;
  left: AiLabTreeNode;
  right: AiLabTreeNode;
}

export type AiLabTreeNode =
  | AiLabDecisionLeaf
  | AiLabCategoricalSplit
  | AiLabNumericalSplit;

export interface AiLabTreeTraceStep {
  pathKey: string;
  feature: string;
  value: AiLabCellValue;
  branchLabel: string;
}

export interface AiLabTreeTrace {
  prediction: string;
  pathKeys: string[];
  steps: AiLabTreeTraceStep[];
}

export interface AiLabKnnNeighbor {
  rowIndex: number;
  distance: number;
}

export interface AiLabKnnPrediction {
  prediction: string;
  neighbors: AiLabKnnNeighbor[];
}

export interface AiLabHoldoutResult {
  rowIndex: number;
  actual: string;
  predicted: string;
  correct: boolean;
}

export interface AiLabTrainedModel {
  algorithm: AiLabAlgorithmId;
  labelColumn: string;
  selectedFeatures: string[];
  holdoutRowIndexes: number[];
  holdoutResults: AiLabHoldoutResult[];
  accuracy: number;
  tree?: AiLabTreeNode;
  knnK?: number;
}

export interface AiLabLevelConfig {
  dataset: AiLabDataset;
  algorithmLock?: AiLabAlgorithmId;
  hideDatasetTab?: boolean;
  hideTrainTab?: boolean;
  hideLabelSelect?: boolean;
  initialSection?: AiLabSection;
  /** When set, only categorical columns can be the label. */
  classificationOnly?: boolean;
  /** Guided studio: train on the dataset surface instead of a Train tab. */
  trainAsOverlay?: boolean;
  defaultKnnK?: number;
  holdoutCount?: number;
  pretrained?: {
    algorithm: AiLabAlgorithmId;
    labelColumn: string;
    selectedFeatures: string[];
  };
}
