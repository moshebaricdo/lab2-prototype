import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  Button,
  Dropdown,
  SegmentedButton,
  Tag,
  TextInput,
  Tooltip,
} from "@moshebari/cads-react";
import { FaIcon } from "@moshebari/cads-react/icons";
import type { AiLabController } from "../../../../hooks/useAiLabState";
import type {
  AiLabColumn,
  AiLabDataRow,
  AiLabKnnPrediction,
  AiLabTreeTrace,
} from "../../../../types/aiLab";
import {
  columnById,
  columnType,
  DEFAULT_KNN_K,
  explainKnn,
  explainTreeTrace,
  formatNumber,
  numericalStats,
  predictKnn,
  traceDecisionTree,
  uniqueValues,
} from "../../../../lib/aiLab";
import { ActualVerdict } from "./viz/CanvasCards";
import { DecisionTreeViz, type TreeView } from "./viz/DecisionTreeViz";
import { KnnViz, KNN_TRACE_STEP_COUNT, type KnnView } from "./viz/KnnViz";
import { TraceBar, type TraceStep } from "./viz/TraceBar";
import { useStepPlayback } from "./viz/useStepPlayback";
import { ModelActions } from "./ModelActions";
import type { ModelInspectorTab } from "./ModelInspector";
import {
  formatAccuracyPercent,
  ResultsModal,
  type ResultsTab,
} from "./ResultsModal";
import { TreeNodeModal } from "./TreeNodeModal";
import statementStyles from "./PredictionStatement.module.scss";
import {
  LABEL_TAG_COLOR,
  StatementFeatureTags,
} from "./PredictionStatement";
import styles from "./TestDashboard.module.scss";

function columnName(columns: AiLabColumn[], id: string): string {
  return columnById(columns, id)?.name ?? id;
}

function isFilled(value: unknown): boolean {
  return value !== undefined && String(value).trim() !== "";
}

function missingInputs(lab: AiLabController, values: AiLabDataRow): number {
  if (!lab.model) return 0;
  return lab.model.selectedFeatures.filter(
    (feature) => !isFilled(values[feature]),
  ).length;
}

function buildQuery(lab: AiLabController, values: AiLabDataRow): AiLabDataRow {
  const query: AiLabDataRow = {};
  lab.model?.selectedFeatures.forEach((feature) => {
    const column = columnById(lab.config.dataset.columns, feature);
    const raw = values[feature];
    query[feature] =
      column?.type === "numerical" ? Number(raw) : String(raw ?? "");
  });
  return query;
}

function treePlaybackSteps(
  columns: AiLabColumn[],
  trace: AiLabTreeTrace,
): TraceStep[] {
  const questions = trace.steps.map<TraceStep>((step, index) => {
    const name = columnById(columns, step.feature)?.name ?? step.feature;
    const text = `${name} is ${step.branchLabel}`;
    return {
      id: step.pathKey,
      label: `Question ${index + 1}`,
      statement: text,
      announcement: `${text}.`,
    };
  });
  return [
    ...questions,
    {
      id: `${trace.pathKeys[trace.pathKeys.length - 1]}-prediction`,
      label: "Prediction",
      statement: `Prediction is ${trace.prediction}`,
      announcement: `Prediction is ${trace.prediction}.`,
    },
  ];
}

function knnPlaybackSteps(prediction: string): TraceStep[] {
  return [
    {
      id: "place",
      label: "Place your example",
      statement: "Your input is placed in the center",
      announcement: "Your input is placed in the center.",
    },
    {
      id: "measure",
      label: "Measure distances",
      statement: "Your nearest neighbors are mapped",
      announcement: "Your nearest neighbors are mapped.",
    },
    {
      id: "vote",
      label: "Vote",
      statement: `Prediction is ${prediction}`,
      announcement: `Prediction is ${prediction}.`,
    },
  ].slice(0, KNN_TRACE_STEP_COUNT);
}

/** The inputs the viz is currently showing, plus the sheet row they came from. */
interface ShownInputs {
  values: AiLabDataRow;
  rowIndex: number | undefined;
}

/**
 * While the tree is walking a prediction, new inputs wait their turn: the
 * fields update live, but the query the viz and Result card answer stays put
 * until the walk ends, then catches up to whatever was typed last.
 */
function useDeferredInputs(lab: AiLabController, hold: boolean): ShownInputs {
  const [shown, setShown] = useState<ShownInputs>({
    values: lab.testValues,
    rowIndex: lab.testRowIndex,
  });
  useEffect(() => {
    if (hold) return;
    setShown((current) =>
      current.values === lab.testValues && current.rowIndex === lab.testRowIndex
        ? current
        : { values: lab.testValues, rowIndex: lab.testRowIndex },
    );
  }, [hold, lab.testRowIndex, lab.testValues]);
  return shown;
}

/**
 * Right strip the floating prediction cards cover on the diagram canvas:
 * 271px cards + 8px edge. Fit keeps its resting center clear of it; the
 * canvas itself is full-bleed and is not clipped. Mirrors `.stageFloat`.
 */
export const PREDICTION_RAIL_INSET = 279;

interface TestDashboardProps {
  lab: AiLabController;
  onOpenModel?: (tab: ModelInspectorTab) => void;
}

export function TestDashboard({ lab, onOpenModel }: TestDashboardProps) {
  const model = lab.model;
  const canvasLayout = lab.config.testLayout === "canvas";
  const [knnView, setKnnView] = useState<KnnView>("target");
  const [treeView, setTreeView] = useState<TreeView>("diagram");
  const [vizPlaying, setVizPlaying] = useState(false);
  const shown = useDeferredInputs(lab, !canvasLayout && vizPlaying);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [resultsEntry, setResultsEntry] = useState<ResultsTab>("scorecard");
  const [resultsSession, setResultsSession] = useState(0);
  const [openNodeKey, setOpenNodeKey] = useState<string | undefined>(undefined);
  const nodeModal = lab.config.treeNodeDetail === "modal";
  const [stepIndex, setStepIndex] = useState(0);
  const setTraceStep = useCallback((index: number) => {
    setStepIndex(index);
  }, []);

  const sourceValues = canvasLayout ? lab.shownTest?.values : shown.values;
  const sourceRowIndex = canvasLayout
    ? lab.shownTest?.rowIndex
    : shown.rowIndex;
  const sourceReady = canvasLayout
    ? Boolean(lab.shownTest)
    : missingInputs(lab, shown.values) === 0;
  const query =
    model && sourceReady && sourceValues
      ? buildQuery(lab, sourceValues)
      : undefined;
  const treeTrace: AiLabTreeTrace | undefined =
    query && model?.algorithm === "decisionTree" && model.tree
      ? traceDecisionTree(model.tree, query)
      : undefined;
  const knnPrediction: AiLabKnnPrediction | undefined =
    query && model?.algorithm === "knn"
      ? predictKnn(
          lab.rows,
          query,
          model.selectedFeatures,
          model.labelColumn,
          lab.config.dataset.columns,
          model.knnK,
          model.holdoutRowIndexes,
        )
      : undefined;
  const playbackSteps: TraceStep[] =
    canvasLayout && treeTrace
      ? treePlaybackSteps(lab.config.dataset.columns, treeTrace)
      : canvasLayout && knnPrediction
        ? knnPlaybackSteps(knnPrediction.prediction)
        : [];
  const playback = useStepPlayback(playbackSteps.length, setTraceStep);
  const { play, stop } = playback;
  const committedAt = canvasLayout ? lab.shownTest?.committedAt : undefined;
  const autoPlayTrace = lab.config.autoPlayTrace !== false;
  const isTreeModel = model?.algorithm === "decisionTree";

  useEffect(() => {
    if (!canvasLayout || committedAt == null) return;
    if (isTreeModel && autoPlayTrace && playbackSteps.length >= 2) {
      play({ reducedMotion: "end" });
    } else if (playbackSteps.length > 0) {
      stop();
      setTraceStep(playbackSteps.length - 1);
    }
  }, [
    autoPlayTrace,
    canvasLayout,
    committedAt,
    isTreeModel,
    play,
    playbackSteps.length,
    setTraceStep,
    stop,
  ]);

  if (!model) {
    return (
      <section className={styles.root}>
        <div className={styles.empty}>
          <div className={styles.emptyInner}>
            <h2 className={styles.emptyTitle}>Train a model first</h2>
            <p className={styles.emptyCopy}>
              Test stays locked until you train from the statement on Data.
            </p>
            {lab.config.hideDatasetTab ? null : (
              <Button
                size="small"
                variant="contained"
                color="primary"
                onClick={() => lab.setSection("dataset")}
              >
                Open Data
              </Button>
            )}
          </div>
        </div>
      </section>
    );
  }

  const missing = missingInputs(
    lab,
    canvasLayout ? lab.testValues : shown.values,
  );
  const fillRandom = () => lab.loadRandomRow();
  const prediction = treeTrace?.prediction ?? knnPrediction?.prediction;
  // Ground truth exists only when the inputs are a real row (Random,
  // Scorecard click) that has not been edited since.
  const shownRow =
    sourceRowIndex !== undefined ? lab.rows[sourceRowIndex] : undefined;
  const actual =
    prediction !== undefined && shownRow
      ? {
          value: String(shownRow[model.labelColumn] ?? ""),
          correct: String(shownRow[model.labelColumn] ?? "") === prediction,
        }
      : undefined;
  const explanation = treeTrace
    ? explainTreeTrace(lab.config.dataset.columns, treeTrace)
    : knnPrediction
      ? explainKnn(lab.rows, model.labelColumn, knnPrediction)
      : undefined;
  const labelValues = uniqueValues(lab.rows, model.labelColumn);
  const featureNames = model.selectedFeatures.map((feature) =>
    columnName(lab.config.dataset.columns, feature),
  );
  const draftReady = missing === 0;

  const pendingValue =
    missing === model.selectedFeatures.length
      ? "—"
      : `${missing} more input${missing === 1 ? "" : "s"}`;
  const pendingCopy =
    missing === model.selectedFeatures.length
      ? "Fill in the inputs and the model answers as you go."
      : "The model answers once every input has a value.";

  const viewToggle =
    model.algorithm === "decisionTree" ? (
      <SegmentedButton
        size="extraSmall"
        iconOnly
        aria-label="Tree view"
        value={treeView}
        onChange={(value) => setTreeView(value as TreeView)}
        options={[
          {
            value: "diagram",
            label: "Diagram",
            iconName: "diagram-project",
            tooltip: "Diagram",
          },
          {
            value: "rules",
            label: "Rules",
            iconName: "list-ol",
            tooltip: "Rules",
          },
        ]}
      />
    ) : (
      <SegmentedButton
        size="extraSmall"
        iconOnly
        aria-label="Neighbors view"
        value={knnView}
        onChange={(value) => setKnnView(value as KnnView)}
        options={[
          {
            value: "target",
            label: "Target",
            iconName: "bullseye-arrow",
            tooltip: "Distance target",
          },
          {
            value: "table",
            label: "Table",
            iconName: "table",
            tooltip: "Table",
          },
        ]}
      />
    );

  const inputHead = (
    <div className={styles.ioHead}>
      <h3 id="ai-lab-input-title" className={styles.ioTitle}>
        Make a prediction
      </h3>
      <div className={styles.ioTools}>
        <Button
          size="extraSmall"
          variant="contained"
          color="primary"
          startIconName="shuffle"
          onClick={fillRandom}
        >
          Random
        </Button>
        {lab.config.hideTestViewToggle ? null : viewToggle}
      </div>
    </div>
  );

  const inputFields = model.selectedFeatures.map((feature) => {
    const column = columnById(lab.config.dataset.columns, feature);
    if (!column) return null;
    if (columnType(lab.config.dataset.columns, feature) === "categorical") {
      return (
        <Dropdown
          key={feature}
          role="input"
          size="small"
          color="secondary"
          width="full"
          label={column.name}
          labelStyle="thin"
          placeholder="Choose"
          value={String(lab.testValues[feature] ?? "")}
          options={uniqueValues(lab.rows, feature).map((value) => ({
            value,
            label: value,
          }))}
          onChange={(value) => lab.setTestValue(feature, String(value))}
        />
      );
    }
    const stats = numericalStats(lab.rows, feature);
    return (
      <TextInput
        key={feature}
        size="small"
        color="secondary"
        label={column.name}
        type="number"
        placeholder={
          stats.values.length > 0
            ? `min ${formatNumber(stats.min)}, max ${formatNumber(stats.max)}`
            : "Enter a number"
        }
        value={String(lab.testValues[feature] ?? "")}
        onChange={(event) => lab.setTestValue(feature, event.target.value)}
      />
    );
  });

  const openResults = (tab: ResultsTab) => {
    setResultsEntry(tab);
    setResultsSession((session) => session + 1);
    setResultsOpen(true);
  };

  const visualCanvas =
    model.algorithm === "decisionTree"
      ? treeView === "diagram"
      : knnView === "target";
  const showPlayback = playbackSteps.length > 1 && visualCanvas;
  const floatRail = canvasLayout && visualCanvas;

  const statement = (
    <div className={styles.statement}>
      <span className={styles.statementLeading}>
        <span>Predict</span>
        <Tag
          size="large"
          color={LABEL_TAG_COLOR}
          label={columnName(lab.config.dataset.columns, model.labelColumn)}
          className={statementStyles.tag}
        />
        {featureNames.length > 0 ? <span>based on</span> : null}
      </span>
      {featureNames.length > 0 ? (
        <StatementFeatureTags featureNames={featureNames} />
      ) : null}
    </div>
  );

  const viz =
    model.algorithm === "decisionTree" && model.tree ? (
      <DecisionTreeViz
        root={model.tree}
        columns={lab.config.dataset.columns}
        labels={labelValues}
        trace={treeTrace}
        view={treeView}
        bundleWideSplits={Boolean(lab.config.bundleWideSplits)}
        autoPlay={lab.config.autoPlayTrace !== false}
        onPlayingChange={canvasLayout ? undefined : setVizPlaying}
        externalRail={canvasLayout}
        frameInsetRight={floatRail ? PREDICTION_RAIL_INSET : 0}
        controlledStep={canvasLayout ? stepIndex : undefined}
        onControlledStep={canvasLayout ? setTraceStep : undefined}
        controlledPlayback={canvasLayout ? playback : undefined}
        onOpenNode={nodeModal ? setOpenNodeKey : undefined}
        openedKey={nodeModal ? openNodeKey : undefined}
      />
    ) : (
      <KnnViz
        rows={lab.rows}
        columns={lab.config.dataset.columns}
        features={model.selectedFeatures}
        labelColumn={model.labelColumn}
        labels={labelValues}
        k={model.knnK ?? DEFAULT_KNN_K}
        excludeRowIndexes={model.holdoutRowIndexes}
        query={query}
        prediction={knnPrediction}
        view={knnView}
        onViewChange={setKnnView}
        externalRail={canvasLayout}
        frameInsetRight={floatRail ? PREDICTION_RAIL_INSET : 0}
        controlledStep={canvasLayout ? stepIndex : undefined}
        onControlledStep={canvasLayout ? setTraceStep : undefined}
      />
    );

  const clampedStep = Math.min(
    stepIndex,
    Math.max(0, playbackSteps.length - 1),
  );

  return (
    <LivePredictionSync lab={lab} prediction={prediction}>
      <section className={styles.root}>
        {canvasLayout ? (
          <header className={styles.statementBar}>
            {statement}
            <div className={styles.statementActions}>
              <Tooltip title="View results" placement="bottom">
                <button
                  type="button"
                  className={styles.accuracyChip}
                  onClick={() => openResults("scorecard")}
                >
                  <span className={styles.accuracyIcon} aria-hidden>
                    <FaIcon name="clipboard-list-check" fontSize="12px" />
                  </span>
                  <span className={styles.accuracyValue}>
                    {formatAccuracyPercent(model.accuracy)} Accuracy
                  </span>
                </button>
              </Tooltip>
              <Button
                size="extraSmall"
                variant="outlined"
                color="secondary"
                startIconName="clipboard-clock"
                onClick={() => openResults("previous")}
              >
                Previous results
              </Button>
            </div>
          </header>
        ) : (
          <header className={styles.metrics}>
            {statement}
            <div className={styles.metricCluster}>
              <p className={styles.metricMeta}>
                <span className={styles.metricDatasetWrap}>
                  <Tooltip
                    title={lab.config.dataset.name}
                    placement="bottom"
                    slotProps={{ popper: { disablePortal: true } }}
                  >
                    <span className={styles.metricDatasetName}>
                      {lab.config.dataset.name}
                    </span>
                  </Tooltip>
                </span>
                {model.algorithm === "knn" && model.knnK ? (
                  <>
                    <span className={styles.metricDot} aria-hidden />
                    <span className={styles.metricStat}>k={model.knnK}</span>
                  </>
                ) : null}
                <span className={styles.metricDot} aria-hidden />
                <span className={styles.metricStat}>
                  {Math.round(model.accuracy * 100)}% Accuracy
                </span>
              </p>
              <div className={styles.metricActions}>
                <ModelActions
                  lab={lab}
                  onOpen={onOpenModel}
                  saveVariant="contained"
                />
              </div>
            </div>
          </header>
        )}

        {canvasLayout ? (
          <div
            className={
              floatRail ? `${styles.stage} ${styles.stageFloat}` : styles.stage
            }
          >
            <div className={styles.canvas}>{viz}</div>
            <aside className={styles.rail} aria-label="Prediction">
              <section
                className={styles.railCard}
                aria-labelledby="ai-lab-input-title"
              >
                <div className={styles.railHead}>
                  <h3 id="ai-lab-input-title" className={styles.railTitle}>
                    Make a prediction
                  </h3>
                  {lab.config.hideTestViewToggle ? null : viewToggle}
                </div>
                <div className={styles.railFields}>{inputFields}</div>
                <div className={styles.railActions}>
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    disabled={!draftReady}
                    onClick={() => lab.commitShownTest()}
                  >
                    Predict
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="secondary"
                    startIconName="shuffle"
                    onClick={fillRandom}
                  >
                    Random
                  </Button>
                </div>
              </section>

              {prediction ? (
                <section
                  className={styles.railCard}
                  aria-live="polite"
                  aria-label={`AI predicts ${prediction}`}
                >
                  <div className={styles.verdictHead}>
                    <h3 className={styles.verdictTitle}>
                      AI predicts <strong>{prediction}</strong>
                    </h3>
                  </div>
                  {treeTrace ? (
                    <ol className={styles.stepList}>
                      {treeTrace.steps.map((step, index) => {
                        const name = columnName(
                          lab.config.dataset.columns,
                          step.feature,
                        );
                        return (
                          <li
                            key={step.pathKey}
                            className={
                              index === clampedStep ? styles.stepCurrent : undefined
                            }
                            aria-current={index === clampedStep ? "step" : undefined}
                          >
                            <span className={styles.stepIndex} aria-hidden>
                              {index + 1}
                            </span>
                            <span>
                              {name} is <strong>{step.branchLabel}</strong>
                            </span>
                          </li>
                        );
                      })}
                      <li
                        className={
                          clampedStep === treeTrace.steps.length
                            ? styles.stepCurrent
                            : undefined
                        }
                        aria-current={
                          clampedStep === treeTrace.steps.length ? "step" : undefined
                        }
                      >
                        <span className={styles.stepIndex} aria-hidden>
                          {treeTrace.steps.length + 1}
                        </span>
                        <span>
                          Prediction is{" "}
                          <span className={styles.predictionValue}>
                            <span className={styles.successDot} aria-hidden />
                            <strong>{prediction}</strong>
                          </span>
                        </span>
                      </li>
                    </ol>
                  ) : (
                    <p className={styles.railCopy}>{explanation}</p>
                  )}
                  {showPlayback ? (
                    <div className={styles.railPlayback}>
                      <TraceBar
                        orientation="toolbar"
                        playLabel="Play"
                        showDots={false}
                        steps={playbackSteps}
                        index={clampedStep}
                        onIndexChange={setTraceStep}
                        emptyText=""
                        playback={playback}
                      />
                    </div>
                  ) : null}
                </section>
              ) : null}
            </aside>
          </div>
        ) : (
          <>
            <div className={styles.canvas}>{viz}</div>
            <footer className={styles.dock} aria-label="Try a prediction">
              <section
                className={styles.ioCard}
                aria-labelledby="ai-lab-input-title"
              >
                {inputHead}
                <div className={styles.inputBody}>
                  <div className={styles.inputGrid}>{inputFields}</div>
                </div>
              </section>

              <div className={styles.connector} aria-hidden>
                <span className={styles.connectorBadge}>
                  <FaIcon name="arrow-right" size="small" />
                </span>
              </div>

              <section
                className={styles.ioCard}
                aria-labelledby="ai-lab-output-title"
                aria-live="polite"
              >
                <div className={styles.ioHead}>
                  <h3 id="ai-lab-output-title" className={styles.ioTitle}>
                    Result
                  </h3>
                </div>
                <div className={styles.outputBody}>
                  <h4
                    className={`${styles.outputValue} ${
                      prediction ? "" : styles.outputValuePending
                    }`}
                  >
                    {prediction ?? pendingValue}
                  </h4>
                  {actual ? <ActualVerdict actual={actual} /> : null}
                  <p className={styles.outputCopy}>{explanation ?? pendingCopy}</p>
                </div>
              </section>
            </footer>
          </>
        )}

        {canvasLayout ? (
          <ResultsModal
            key={resultsSession}
            lab={lab}
            open={resultsOpen}
            initialTab={resultsEntry}
            onClose={() => setResultsOpen(false)}
            onTryRow={(rowIndex) => {
              lab.loadHoldoutRow(rowIndex);
              setResultsOpen(false);
            }}
          />
        ) : null}
        {nodeModal && model.algorithm === "decisionTree" ? (
          <TreeNodeModal
            lab={lab}
            nodeKey={openNodeKey}
            example={
              treeTrace && query
                ? {
                    values: query,
                    rowIndex: sourceRowIndex,
                    pathKeys: treeTrace.pathKeys,
                  }
                : undefined
            }
            onClose={() => setOpenNodeKey(undefined)}
          />
        ) : null}
      </section>
    </LivePredictionSync>
  );
}

function LivePredictionSync({
  lab,
  prediction,
  children,
}: {
  lab: AiLabController;
  prediction: string | undefined;
  children: ReactNode;
}) {
  useEffect(() => {
    lab.setLastPrediction(prediction);
  }, [lab.setLastPrediction, prediction]);

  return children;
}
