import { useEffect, useState, type ReactNode } from "react";
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
import type { CanvasChrome } from "./viz/CanvasCards";
import { DecisionTreeViz, type TreeView } from "./viz/DecisionTreeViz";
import { KnnViz, type KnnView } from "./viz/KnnViz";
import { ModelActions } from "./ModelActions";
import type { ModelInspectorTab } from "./ModelInspector";
import styles from "./TestDashboard.module.scss";

const FEATURE_CHIPS = 2;

function columnName(columns: AiLabColumn[], id: string): string {
  return columnById(columns, id)?.name ?? id;
}

function isFilled(value: unknown): boolean {
  return value !== undefined && String(value).trim() !== "";
}

function missingInputs(lab: AiLabController): number {
  if (!lab.model) return 0;
  return lab.model.selectedFeatures.filter(
    (feature) => !isFilled(lab.testValues[feature]),
  ).length;
}

function queryReady(lab: AiLabController): boolean {
  return Boolean(lab.model) && missingInputs(lab) === 0;
}

/** One random in-range value per feature — not a real sheet row. */
function randomFeatureValue(
  rows: AiLabDataRow[],
  columns: AiLabColumn[],
  feature: string,
): string {
  if (columnType(columns, feature) === "categorical") {
    const values = uniqueValues(rows, feature).filter((value) => value.trim() !== "");
    if (values.length === 0) return "";
    return values[Math.floor(Math.random() * values.length)];
  }
  const stats = numericalStats(rows, feature);
  if (stats.values.length === 0) return "";
  const integers = stats.values.every((value) => Number.isInteger(value));
  if (integers) {
    const min = Math.ceil(stats.min);
    const max = Math.floor(stats.max);
    return String(min + Math.floor(Math.random() * (max - min + 1)));
  }
  return formatNumber(stats.min + Math.random() * (stats.max - stats.min));
}

function currentQuery(lab: AiLabController): AiLabDataRow {
  const query: AiLabDataRow = {};
  lab.model?.selectedFeatures.forEach((feature) => {
    const column = columnById(lab.config.dataset.columns, feature);
    const raw = lab.testValues[feature];
    query[feature] =
      column?.type === "numerical" ? Number(raw) : String(raw ?? "");
  });
  return query;
}

interface TestDashboardProps {
  lab: AiLabController;
  onOpenModel?: (tab: ModelInspectorTab) => void;
}

export function TestDashboard({ lab, onOpenModel }: TestDashboardProps) {
  const model = lab.model;
  const [knnView, setKnnView] = useState<KnnView>("target");
  const [treeView, setTreeView] = useState<TreeView>("diagram");

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

  const ready = queryReady(lab);
  const missing = missingInputs(lab);
  const labelName =
    columnById(lab.config.dataset.columns, model.labelColumn)?.name ??
    model.labelColumn;
  const fillRandom = () => {
    model.selectedFeatures.forEach((feature) => {
      lab.setTestValue(
        feature,
        randomFeatureValue(lab.rows, lab.config.dataset.columns, feature),
      );
    });
  };
  const query = ready ? currentQuery(lab) : undefined;
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
  const explanation = treeTrace
    ? explainTreeTrace(lab.config.dataset.columns, treeTrace)
    : knnPrediction
      ? explainKnn(lab.rows, model.labelColumn, knnPrediction)
      : undefined;
  const labelValues = uniqueValues(lab.rows, model.labelColumn);
  const featureNames = model.selectedFeatures.map((feature) =>
    columnName(lab.config.dataset.columns, feature),
  );
  const visibleFeatures = featureNames.slice(0, FEATURE_CHIPS);
  const overflowFeatures = featureNames.slice(FEATURE_CHIPS);
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
        Try a prediction
      </h3>
      <div className={styles.ioTools}>
        <Tooltip title="Fill with random values" placement="bottom">
          <Button
            size="extraSmall"
            variant="outlined"
            color="secondary"
            iconOnly
            startIconName="shuffle"
            aria-label="Fill with random values"
            onClick={fillRandom}
          />
        </Tooltip>
        {viewToggle}
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

  // Canvas layout: the viz floats the trace toolbar, this input card, and a
  // prediction card that folds the Output card into the algorithm summary.
  const canvasChrome: CanvasChrome | undefined = canvasLayout
    ? {
        outcome: {
          title: labelName,
          value: prediction ?? pendingValue,
          pending: !prediction,
          copy: explanation ?? pendingCopy,
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
          <p className={styles.statement}>
            <span>Predict</span>
            <Tag
              size="large"
              color="brand"
              label={columnName(lab.config.dataset.columns, model.labelColumn)}
              className={styles.statementTag}
            />
            {visibleFeatures.length > 0 ? <span>based on</span> : null}
            {visibleFeatures.map((name) => (
              <Tag
                key={name}
                size="large"
                color="success"
                label={name}
                className={styles.statementTag}
              />
            ))}
            {overflowFeatures.length > 0 ? (
              <Tooltip title={overflowFeatures.join(", ")} placement="bottom">
                <span>
                  <Tag
                    size="large"
                    color="success"
                    label={`+${overflowFeatures.length}`}
                    className={styles.statementTag}
                  />
                </span>
              </Tooltip>
            ) : null}
          </p>
          <div className={styles.metricCluster}>
            <p className={styles.metricMeta}>
              <span>{lab.config.dataset.name}</span>
              {model.algorithm === "knn" && model.knnK ? (
                <>
                  <span className={styles.metricDot} aria-hidden />
                  <span>k={model.knnK}</span>
                </>
              ) : null}
              <span className={styles.metricDot} aria-hidden />
              <span>{Math.round(model.accuracy * 100)}% Accuracy</span>
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
                  {labelName}
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
