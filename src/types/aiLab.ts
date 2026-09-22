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

/**
 * The story behind a sheet, told in student terms. Every field is a short
 * sentence or two; the UI (About this data, story-first intro, Setup
 * preview) lays them out. Datasets without a story fall back to
 * `description` and inferred text.
 */
export interface AiLabDatasetStory {
  /** What one row is, singular and lowercase: "animal", "customer", "flower". */
  rowNoun: string;
  /** "Each row is one animal and what we know about it." */
  whatIsARow: string;
  /** Who collected it and how. */
  source: string;
  /** The question a model on this sheet answers. */
  question: string;
  /** Why anyone would want that answer. Optional. */
  whyItMatters?: string;
  /**
   * Column holding a picture per row (URL). Cards show it when present;
   * layout never depends on it.
   */
  imageColumn?: string;
}

export interface AiLabDataset {
  id: string;
  name: string;
  description: string;
  defaultLabelColumn: string;
  columns: AiLabColumn[];
  rows: AiLabDataRow[];
  story?: AiLabDatasetStory;
}

/**
 * What a student does before the aggregate view opens.
 *
 * - `info`: the dataset story as a modal; Continue opens the sheet.
 * - `classify`: a few rows as cards with the label hidden; the student
 *   guesses the label from the other columns, sees the answer, then the
 *   deck opens into the sheet. Generic — the label values, the properties,
 *   and the rows all come from the sheet, never from the level.
 *
 * Levels for older students leave this off and land on the sheet.
 */
export interface AiLabIntroActivity {
  mode: "info" | "classify";
  /** classify: open with the story modal first. Default on. */
  showStoryFirst?: boolean;
  /** classify: how many rows to guess. Default 5. */
  rowCount?: number;
  /** classify: exact rows to use, in order (overrides `rowCount`). */
  rowIndexes?: number[];
  /** classify: columns shown as clues. Default: every column but the label. */
  visibleColumns?: string[];
  /** classify: show clues all at once or one per click. Default `all`. */
  reveal?: "all" | "one-at-a-time";
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
 * Testing chrome. `canvas` is canonical (Result card + Replay over a
 * full-bleed viz). `dock` remains as pullback for the Input → Output footer.
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
  /** Show Predict but lock it to `presetLabelColumn` or the dataset default. */
  lockLabelColumn?: boolean;
  /**
   * Column id the Predict field is locked to when `lockLabelColumn` is on.
   * Levelbuilder "choose a label" — Bird / mammal / fish locks **Type**.
   */
  presetLabelColumn?: string;
  /**
   * Click-to-edit cells and Add row. Defaults on. Curriculum levels can lock
   * the sheet as a read-only table.
   */
  allowDataEdit?: boolean;
  /** Initial Data Set view. Students can still switch Table / Cards unless the level hides Data. */
  defaultDataView?: AiLabDataView;
  /**
   * Column whose value titles each Cards card ("Hawk" instead of "Row 1").
   * The pager still says Row N of N. Omit to keep the row number.
   */
  cardTitleColumn?: string;
  /** Hide Catalog / Carousel; Cards always uses the carousel. */
  hideCardLayoutToggle?: boolean;
  initialSection?: AiLabSection;
  /** Hide Diagram / Rules (or KNN target / table) toggle on Testing. */
  hideTestViewToggle?: boolean;
  /**
   * Walk the decision path from the root on every new prediction (default
   * on). New inputs wait until the walk ends. Off lands on the answer.
   */
  autoPlayTrace?: boolean;
  /** Story / classify step before the sheet opens. Off by default. */
  introActivity?: AiLabIntroActivity;
  /**
   * Decision tree: Train model opens a modal that grows the tree and marks
   * each leaf right / wrong before showing accuracy (default on). Off keeps
   * the inline Results card only. KNN never opens the modal.
   */
  trainingModal?: boolean;
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
