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

/** Label → how many training rows reached this node carry that label. */
export type AiLabLabelCounts = Record<string, number>;

export interface AiLabDecisionLeaf {
  type: "leaf";
  pathKey: string;
  prediction: string;
  sampleCount: number;
  labelCounts: AiLabLabelCounts;
}

export interface AiLabCategoricalSplit {
  type: "decision";
  pathKey: string;
  feature: string;
  splitType: "categorical";
  sampleCount: number;
  labelCounts: AiLabLabelCounts;
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
  labelCounts: AiLabLabelCounts;
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

/** Every training row's distance from one query, nearest first. */
export interface AiLabKnnDistances {
  /** Row indexes sorted by ascending distance (ties → lower index). */
  order: number[];
  /** Distance per row index (unsorted, same length as `rows`). */
  distances: Float64Array;
}

/** One feature's contribution to the distance between a query and a row. */
export interface AiLabFeatureDelta {
  feature: string;
  queryValue: AiLabCellValue;
  rowValue: AiLabCellValue;
  /** Encoded difference (0 when categorical values match). */
  delta: number;
  /** `true` for categorical features that share a value, or exact numeric ties. */
  match: boolean;
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
  /**
   * Scored rows used for reported accuracy. KNN: the 10% holdout that
   * also selected k. Decision tree: every current sheet row.
   */
  holdoutResults: AiLabHoldoutResult[];
  accuracy: number;
  tree?: AiLabTreeNode;
  knnK?: number;
}

export interface AiLabSavedModel {
  id: string;
  name: string;
  intendedUse: string;
  limitations: string;
  datasetId: string;
  datasetName: string;
  savedAt: number;
  model: AiLabTrainedModel;
}

/**
 * Testing chrome. `canvas` (default) floats the trace toolbar, input card,
 * and prediction card over a full-bleed viz; `dock` keeps the Input → Output
 * footer under the viz. Dev-panel flag on every AI Lab route.
 */
export type AiLabTestLayout = "dock" | "canvas";

export interface AiLabLevelConfig {
  dataset: AiLabDataset;
  testLayout?: AiLabTestLayout;
  /**
   * Decision-tree diagram: fold same-prediction leaves under a wide split
   * into one bundle per outcome. Experiment flag (dev panel); default off so
   * a wide split still lands as a wall of pills.
   */
  bundleWideSplits?: boolean;
  /** Catalog for student choice. Defaults to `[dataset]` when omitted. */
  availableDatasets?: AiLabDataset[];
  /** Levelbuilder pre-selected the dataset; hide the picker. */
  lockDataset?: boolean;
  /** Student must pick from the catalog before the sheet opens. */
  requireDatasetChoice?: boolean;
  /** Scorecard modal after train. Independent of export. */
  showModelDetails?: boolean;
  /** Save-model modal + getPrediction snippet. Independent of the scorecard. */
  showExport?: boolean;
  algorithmLock?: AiLabAlgorithmId;
  hideDatasetTab?: boolean;
  /** Hide Testing. Dataset-only levels still combine with algorithm, dataset, train, and edit flags. */
  hideTestTab?: boolean;
  hideTrainTab?: boolean;
  hideLabelSelect?: boolean;
  /** Show Predict but lock it to the dataset default (or pretrained label). */
  lockLabelColumn?: boolean;
  /**
   * Click-to-edit cells and Add row. Defaults on. Curriculum levels can lock
   * the sheet as a read-only table.
   */
  allowDataEdit?: boolean;
  /** Initial Data Set view. Students can still switch Table / Cards unless the level hides Data. */
  defaultDataView?: AiLabDataView;
  initialSection?: AiLabSection;
  /** Hide Diagram / Rules (or KNN target / table) toggle on Testing. */
  hideTestViewToggle?: boolean;
  /** Feature columns hidden from the Train rail checklist. */
  excludedFeatureColumns?: string[];
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
