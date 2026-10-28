import type {
  AiLabColumn,
  AiLabLevelConfig,
  AiLabTrainedModel,
  AiLabTrainingRun,
} from "../../types/aiLab";

const MAX_TRAINING_RUNS = 20;

/** One log entry for a successful `train()`. The model is the snapshot Load restores. */
export function createTrainingRun(model: AiLabTrainedModel): AiLabTrainingRun {
  return {
    id: `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    algorithm: model.algorithm,
    labelColumn: model.labelColumn,
    selectedFeatures: [...model.selectedFeatures],
    accuracy: model.accuracy,
    createdAt: Date.now(),
    model,
  };
}

/** Oldest first, newest 20 kept. The run just created is always last. */
export function appendTrainingRun(
  runs: AiLabTrainingRun[],
  model: AiLabTrainedModel,
): AiLabTrainingRun[] {
  return [...runs, createTrainingRun(model)].slice(-MAX_TRAINING_RUNS);
}

function sameColumnSet(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const a = [...left].sort();
  const b = [...right].sort();
  return a.every((id, index) => id === b[index]);
}

function hasColumn(columns: AiLabColumn[], id: string): boolean {
  return columns.some((column) => column.id === id);
}

/**
 * Why Load should stay disabled. Undefined means the run can replace the
 * model on Testing. Runs are cleared when the sheet changes, so a missing
 * column is a guard, not the common case.
 */
export function trainingRunLoadBlock(
  config: AiLabLevelConfig,
  run: Pick<AiLabTrainingRun, "algorithm" | "labelColumn" | "selectedFeatures">,
  columns: AiLabColumn[],
): string | undefined {
  if (config.algorithmLock && run.algorithm !== config.algorithmLock) {
    return "This level locks the algorithm, so this result can't be loaded.";
  }
  if (config.lockLabelColumn || config.hideLabelSelect) {
    const locked =
      config.presetLabelColumn ?? config.dataset.defaultLabelColumn;
    if (locked && run.labelColumn !== locked) {
      return "This level locks the label column, so this result can't be loaded.";
    }
  }
  if (config.lockFeatures && (config.presetFeatures?.length ?? 0) > 0) {
    if (!sameColumnSet(config.presetFeatures ?? [], run.selectedFeatures)) {
      return "This level locks the feature columns, so this result can't be loaded.";
    }
  }
  if (
    !hasColumn(columns, run.labelColumn) ||
    run.selectedFeatures.some((feature) => !hasColumn(columns, feature))
  ) {
    return "A column from this result is no longer on the sheet.";
  }
  return undefined;
}
