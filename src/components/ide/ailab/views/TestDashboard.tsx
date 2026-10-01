import {
  useEffect,
  useLayoutEffect,
  useRef,
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
import { ActualVerdict, type CanvasChrome } from "./viz/CanvasCards";
import { DecisionTreeViz, type TreeView } from "./viz/DecisionTreeViz";
import { KnnViz, type KnnView } from "./viz/KnnViz";
import { ModelActions } from "./ModelActions";
import type { ModelInspectorTab } from "./ModelInspector";
import statementStyles from "./PredictionStatement.module.scss";
import {
  FEATURE_TAG_COLOR,
  LABEL_TAG_COLOR,
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

function StatementFeatureTags({ featureNames }: { featureNames: string[] }) {
  const rowRef = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(featureNames.length);

  useLayoutEffect(() => {
    const row = rowRef.current;
    const measure = measureRef.current;
    if (!row || !measure) return;

    const run = () => {
      const available = row.clientWidth;
      if (available <= 0) return;

      const gap = 6;
      const chips = Array.from(
        measure.querySelectorAll<HTMLElement>("[data-measure=feature]"),
      );
      const overflowEl = measure.querySelector<HTMLElement>(
        "[data-measure=overflow]",
      );
      const overflowWidth = overflowEl?.offsetWidth ?? 0;
      const max = featureNames.length;

      let visible = max;
      while (visible >= 0) {
        const hidden = featureNames.length - visible;
        let used = 0;
        for (let index = 0; index < visible; index += 1) {
          if (index > 0) used += gap;
          used += chips[index]?.offsetWidth ?? 0;
        }
        if (hidden > 0) used += gap + overflowWidth;
        if (used <= available) {
          setVisibleCount(visible);
          return;
        }
        visible -= 1;
      }

      setVisibleCount(0);
    };

    run();
    const observer = new ResizeObserver(run);
    observer.observe(row);
    return () => observer.disconnect();
  }, [featureNames]);

  const visibleFeatures = featureNames.slice(0, visibleCount);
  const overflowFeatures = featureNames.slice(visibleCount);

  const overflowTooltip =
    visibleCount === 0
      ? featureNames.join(", ")
      : overflowFeatures.join(", ");

  return (
    <span ref={rowRef} className={styles.statementFeatures}>
      {visibleFeatures.map((name) => (
        <Tag
          key={name}
          size="large"
          color={FEATURE_TAG_COLOR}
          label={name}
          className={statementStyles.tag}
        />
      ))}
      {overflowFeatures.length > 0 ? (
        <Tooltip title={overflowTooltip} placement="bottom">
          <span className={styles.overflowTagWrap}>
            <Tag
              size="large"
              color={FEATURE_TAG_COLOR}
              label={`+${overflowFeatures.length}`}
              className={statementStyles.tag}
            />
          </span>
        </Tooltip>
      ) : null}
      <div ref={measureRef} className={styles.tagMeasure} aria-hidden>
        {featureNames.map((name) => (
          <span key={name} data-measure="feature">
            <Tag
              size="large"
              color={FEATURE_TAG_COLOR}
              label={name}
              className={statementStyles.tag}
            />
          </span>
        ))}
        <span data-measure="overflow">
          <Tag
            size="large"
            color={FEATURE_TAG_COLOR}
            label={`+${Math.max(featureNames.length, 9)}`}
            className={statementStyles.tag}
          />
        </span>
      </div>
    </span>
  );
}

interface TestDashboardProps {
  lab: AiLabController;
  onOpenModel?: (tab: ModelInspectorTab) => void;
}

export function TestDashboard({ lab, onOpenModel }: TestDashboardProps) {
  const model = lab.model;
  const [knnView, setKnnView] = useState<KnnView>("target");
  const [treeView, setTreeView] = useState<TreeView>("diagram");
  const [vizPlaying, setVizPlaying] = useState(false);
  const shown = useDeferredInputs(lab, vizPlaying);

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

  const missing = missingInputs(lab, shown.values);
  const ready = missing === 0;
  const fillRandom = () => lab.loadRandomRow();
  const query = ready ? buildQuery(lab, shown.values) : undefined;
  const treeTrace: AiLabTreeTrace | undefined =
    ready && model.tree ? traceDecisionTree(model.tree, query!) : undefined;
  const knnPrediction: AiLabKnnPrediction | undefined =
    ready && model.algorithm === "knn"
      ? predictKnn(
          lab.rows,
          query!,
          model.selectedFeatures,
          model.labelColumn,
          lab.config.dataset.columns,
          model.knnK,
          model.holdoutRowIndexes,
        )
      : undefined;
  const prediction = treeTrace?.prediction ?? knnPrediction?.prediction;
  // Ground truth exists only when the inputs are a real row (Random,
  // Scorecard click) that has not been edited since.
  const shownRow =
    shown.rowIndex !== undefined ? lab.rows[shown.rowIndex] : undefined;
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
  const canvasLayout = lab.config.testLayout === "canvas";

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

  // Canvas layout: the viz floats this input card and a Result card that
  // holds Replay + the stepper in its footer.
  const canvasChrome: CanvasChrome | undefined = canvasLayout
    ? {
        // The card shows the answer alone while inputs are missing, and the
        // tree's path list *is* its explanation, so no sentence repeats it.
        outcome: {
          title: "Result",
          value: prediction,
          pending: !prediction,
          actual,
          copy: prediction
            ? treeTrace
              ? undefined
              : explanation
            : missing === model.selectedFeatures.length
              ? "Fill in the inputs above to get a prediction."
              : `Fill in ${missing} more input${missing === 1 ? "" : "s"} above to get a prediction.`,
        },
        inputCard: (
          <>
            {inputHead}
            <div className={`${styles.inputBody} ${styles.inputBodyStacked}`}>
              <div className={`${styles.inputGrid} ${styles.inputGridStacked}`}>
                {inputFields}
              </div>
            </div>
          </>
        ),
      }
    : undefined;

  return (
    <LivePredictionSync lab={lab} prediction={prediction}>
      <section className={styles.root}>
        <header className={styles.metrics}>
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

        <div className={styles.canvas}>
          {model.algorithm === "decisionTree" && model.tree ? (
            <DecisionTreeViz
              root={model.tree}
              columns={lab.config.dataset.columns}
              labels={labelValues}
              trace={treeTrace}
              view={treeView}
              canvasChrome={canvasChrome}
              bundleWideSplits={Boolean(lab.config.bundleWideSplits)}
              autoPlay={lab.config.autoPlayTrace !== false}
              onPlayingChange={setVizPlaying}
              actual={actual}
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
              canvasChrome={canvasChrome}
            />
          )}
        </div>

        {canvasLayout ? null : (
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
        )}
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
