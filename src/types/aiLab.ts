export type AiLabAlgorithmId = "knn" | "decisionTree";

export type AiLabSection = "algorithm" | "dataset" | "train" | "test";

export type AiLabColumnType = "categorical" | "numerical";

export type AiLabDataView = "table" | "cards";

export type AiLabCardLayout = "catalog" | "carousel";

export interface AiLabColumnFilter {
  columnId: string;
  values: string[];
}

export type AiLabCellValue = string | number;

/**
 * Student-authored names for a numeric column. The source numbers stay;
 * this becomes its own categorical column (`id`) the model can use.
 * Two cuts make three buckets: below the first, between them, above the second.
 */
export interface AiLabScale {
  id: string;
  sourceColumnId: string;
  name: string;
  /** Ascending boundaries. `labels.length` is `cuts.length + 1`. */
  cuts: number[];
  labels: string[];
}

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
  /** Class name, or the regression mean rounded the way the production tree draws it. */
  prediction: string;
  /** Exact regression mean. Classification leaves omit it. */
  rawPrediction?: number;
  sampleCount: number;
  labelCounts: AiLabLabelCounts;
}

/**
 * One CART question. A row goes left when its encoded value is strictly
 * below `threshold`, and right otherwise. Categorical columns are first-seen
 * codes; `leftValues` / `rightValues` are the categories on each side.
 */
export interface AiLabDecisionSplit {
  type: "decision";
  pathKey: string;
  feature: string;
  splitType: "numerical" | "categorical";
  threshold: number;
  leftValues?: string[];
  rightValues?: string[];
  sampleCount: number;
  labelCounts: AiLabLabelCounts;
  /** Gini gain for classification, sum of squared errors for regression. */
  impurityReduction: number;
  left: AiLabTreeNode;
  right: AiLabTreeNode;
}

export type AiLabTreeNode = AiLabDecisionLeaf | AiLabDecisionSplit;

export interface AiLabTreeTraceStep {
  pathKey: string;
  feature: string;
  value: AiLabCellValue;
  branchLabel: string;
}

export interface AiLabTreeTrace {
  prediction: string;
  /** Exact regression mean, when the leaf has one. */
  rawPrediction?: number;
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
  /**
   * Rows kept out of training: `Math.ceil(10%)`, from the end of the sheet
   * unless the level drew them at random. `holdoutCount` overrides the
   * count (0 opts out). The testing tree and each node's rows modal count
   * these. Empty when a level opts out.
   */
  holdoutRowIndexes: number[];
  /**
   * Scored rows used for reported accuracy. KNN: the reserved rows that
   * also selected k. Decision tree: the rows the tree was trained on.
   * The reserved rows still choose the depth, and the diagram counts them
   * separately.
   */
  holdoutResults: AiLabHoldoutResult[];
  accuracy: number;
  tree?: AiLabTreeNode;
  /**
   * Depth the decision-tree sweep kept. Production tries 1, 2, 3, 5, and 8,
   * and keeps the shallowest tree tied for best holdout accuracy.
   */
  maxDepth?: number;
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

/** One successful `train()` in the session. Stored oldest-first; the Results modal lists newest first. */
export interface AiLabTrainingRun {
  id: string;
  labelColumn: string;
  selectedFeatures: string[];
  /** Same 0–1 fraction the trained model stores. */
  accuracy: number;
  createdAt: number;
}

/**
 * Inputs the canvas Testing layout last pressed Predict on.
 * Draft fields can change afterward without clearing this snapshot.
 */
export interface AiLabShownTest {
  values: AiLabDataRow;
  rowIndex: number | undefined;
  committedAt: number;
}

/**
 * Testing chrome. `canvas` is the statement bar plus a right-hand prediction
 * rail. `dock` remains as pullback for the Input → Output footer.
 */
export type AiLabTestLayout = "dock" | "canvas";

/** Training modal playback: walk the rows through the tree (default), or grow it. */
export type AiLabTrainingAnimation = "tree" | "rows";

/** What clicking a decision-tree node does: grow it in place, or open its rows. */
export type AiLabTreeNodeDetail = "inline" | "modal";

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
  /**
   * Shown in place of the sheet when no dataset is selected. The setup
   * modal stays closed so the empty state can point at an upload.
   */
  emptyDataset?: {
    title: string;
    copy: string;
  };
  /** Catalog comes from CSV files kept in session storage, not the drop folder. */
  sessionDatasets?: boolean;
  /**
   * Bumps when the active sheet's bytes change so a re-upload remounts
   * the lab even if the dataset id stays the same.
   */
  datasetRevision?: string;
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
   * Feature column ids checked under Using when the sheet opens.
   * Empty leaves that choice to the user, unless a pretrained model
   * already picked features. A non-empty list also sets `lockFeatures`.
   */
  presetFeatures?: string[];
  /** Show Using but lock it to `presetFeatures`. Hover says "You can't change this". */
  lockFeatures?: boolean;
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
  /**
   * What the training modal plays. `rows` (default) is the sort and quiz
   * (`TrainingTableRow`): every row is a dot sorted into piles by the
   * tree's questions (Training), then a few rows from the sheet trace down
   * the tree and get guessed (Testing) before the score. `tree` is the
   * fallback that grows the finished tree depth by depth. Dev panel knob.
   */
  trainingAnimation?: AiLabTrainingAnimation;
  /**
   * Open the training modal on an empty stage instead of the walk. The
   * footer is already **Continue** and **Back to dataset**. Upload level.
   */
  skipTrainingWalk?: boolean;
  /**
   * Testing diagram node click. `modal` (default) keeps every node a compact
   * pill, counts matching and other rows on each leaf, and opens a modal
   * listing the sheet rows that reached the node. `inline` grows the node
   * into a detail card (kept as a pullback). Dev panel knob.
   */
  treeNodeDetail?: AiLabTreeNodeDetail;
  /** Feature columns hidden from the Train rail checklist. */
  excludedFeatureColumns?: string[];
  /** When set, only categorical columns can be the label. */
  classificationOnly?: boolean;
  /**
   * Numeric columns can be grouped into a named scale (COLD / WARM / HOT).
   * Off everywhere except the scale demo.
   */
  allowScaleColumns?: boolean;
  /** Guided studio: train on the dataset surface instead of a Train tab. */
  trainAsOverlay?: boolean;
  defaultKnnK?: number;
  holdoutCount?: number;
  /**
   * Reserve a random 10% for testing instead of the last rows. Production's
   * `randomizeTestData`. Off everywhere unless a level (or the upload
   * level's Dev panel) turns it on.
   */
  randomizeTestData?: boolean;
  pretrained?: {
    algorithm: AiLabAlgorithmId;
    labelColumn: string;
    selectedFeatures: string[];
  };
}
