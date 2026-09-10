import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Dropdown, Tag, TextInput } from "@moshebaricdo/cads-react";
import { ScrollArea } from "../../../ui/scroll-area";
import type { AiLabController } from "../../../../hooks/useAiLabState";
import type { AiLabDataRow, AiLabKnnPrediction, AiLabTreeTrace } from "../../../../types/aiLab";
import {
  columnById,
  columnType,
  explainKnn,
  explainTreeTrace,
  formatCell,
  formatDistance,
  predictKnn,
  predictionStatement,
  traceDecisionTree,
  uniqueValues,
} from "../../../../lib/aiLab";
import { DecisionTreeViz } from "./DecisionTreeViz";
import { KnnScatterViz } from "./KnnScatterViz";
import styles from "./AiLabGuidedWorkspace.module.scss";

interface GuidedTestPanelProps {
  lab: AiLabController;
}

function queryReady(lab: AiLabController): boolean {
  if (!lab.model) return false;
  return lab.model.selectedFeatures.every((feature) => {
    const value = lab.testValues[feature];
    return value !== undefined && String(value).trim() !== "";
  });
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

export function GuidedTestPanel({ lab }: GuidedTestPanelProps) {
  const model = lab.model;
  const [axisX, setAxisX] = useState<string | undefined>(undefined);
  const [axisY, setAxisY] = useState<string | undefined>(undefined);

  const axisOptions = useMemo(() => {
    if (!model) return [];
    return [
      ...model.selectedFeatures.map((feature) => ({
        value: feature,
        label: columnById(lab.config.dataset.columns, feature)?.name ?? feature,
      })),
      {
        value: model.labelColumn,
        label: `${columnById(lab.config.dataset.columns, model.labelColumn)?.name ?? model.labelColumn} (label)`,
      },
    ];
  }, [lab.config.dataset.columns, model]);

  if (!model) {
    return (
      <section className={styles.panel}>
        <div className={styles.sectionPad}>
          <p className={styles.muted}>Train a model to open Test.</p>
        </div>
      </section>
    );
  }

  const ready = queryReady(lab);
  const query = ready ? currentQuery(lab) : undefined;
  const treeTrace: AiLabTreeTrace | undefined =
    ready && model.tree ? traceDecisionTree(model.tree, query!) : undefined;
  const knnPrediction: AiLabKnnPrediction | undefined =
    ready && model.algorithm === "knn"
      ? predictKnn(
          lab.config.dataset.rows,
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
      ? explainKnn(lab.config.dataset.rows, model.labelColumn, knnPrediction)
      : undefined;

  return (
    <LivePredictionSync lab={lab} prediction={prediction}>
      <section className={styles.panel}>
        <div className={styles.testLayout}>
          <div className={styles.vizPane}>
            <div className={styles.sectionPad}>
              <p className={styles.statement}>
                {predictionStatement(
                  lab.config.dataset.columns,
                  model.labelColumn,
                  model.selectedFeatures,
                )}
              </p>
              <p className={styles.accuracy}>
                {Math.round(model.accuracy * 100)}% on reserved orders
              </p>
              <p className={styles.muted}>
                {model.holdoutResults.filter((result) => result.correct).length} of{" "}
                {model.holdoutResults.length} held-out orders predicted correctly.
                These rows were not used to train.
              </p>
              {prediction ? (
                <>
                  <p className={styles.prediction}>Prediction: {prediction}</p>
                  {explanation ? <p className={styles.muted}>{explanation}</p> : null}
                </>
              ) : (
                <p className={styles.muted}>
                  Fill every Try it out field to see a live prediction.
                </p>
              )}
              {model.algorithm === "knn" ? (
                <div className={styles.axisRow}>
                  <Dropdown
                    role="input"
                    size="small"
                    color="secondary"
                    width="full"
                    label="X axis"
                    value={axisX ?? model.selectedFeatures[0] ?? ""}
                    options={axisOptions}
                    onChange={(value) => setAxisX(String(value))}
                  />
                  <Dropdown
                    role="input"
                    size="small"
                    color="secondary"
                    width="full"
                    label="Y axis"
                    value={
                      axisY ??
                      model.selectedFeatures[1] ??
                      model.labelColumn
                    }
                    options={axisOptions}
                    onChange={(value) => setAxisY(String(value))}
                  />
                </div>
              ) : null}
            </div>
            <div className={styles.vizFill}>
              {model.algorithm === "decisionTree" && model.tree ? (
                <DecisionTreeViz
                  root={model.tree}
                  columns={lab.config.dataset.columns}
                  trace={treeTrace}
                  detailed
                />
              ) : (
                <KnnScatterViz
                  rows={lab.config.dataset.rows}
                  columns={lab.config.dataset.columns}
                  features={model.selectedFeatures}
                  labelColumn={model.labelColumn}
                  holdoutIndexes={model.holdoutRowIndexes}
                  query={query}
                  prediction={knnPrediction}
                  axisX={axisX ?? model.selectedFeatures[0]}
                  axisY={
                    axisY ?? model.selectedFeatures[1] ?? model.labelColumn
                  }
                />
              )}
            </div>
          </div>
          <div className={styles.formPane}>
            <ScrollArea className={styles.scroll}>
              <div className={styles.sectionPad}>
                <h3 className={styles.statement}>Try it out</h3>
                <p className={styles.muted}>
                  The visualization updates as soon as every feature has a value.
                </p>
                <div className={styles.predictGrid}>
                  {model.selectedFeatures.map((feature) => {
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
                          placeholder="Select"
                          value={String(lab.testValues[feature] ?? "")}
                          options={uniqueValues(lab.config.dataset.rows, feature).map(
                            (value) => ({ value, label: value }),
                          )}
                          onChange={(value) => lab.setTestValue(feature, String(value))}
                        />
                      );
                    }
                    return (
                      <TextInput
                        key={feature}
                        size="small"
                        color="secondary"
                        label={column.name}
                        type="number"
                        placeholder=""
                        value={String(lab.testValues[feature] ?? "")}
                        onChange={(event) =>
                          lab.setTestValue(feature, event.target.value)
                        }
                      />
                    );
                  })}
                </div>
                {knnPrediction ? (
                  <>
                    <h3 className={styles.statement}>Nearest neighbors</h3>
                    <p className={styles.muted}>
                      These {knnPrediction.neighbors.length} training orders voted.
                      Distance is not scaled, so a wide-range column can dominate.
                    </p>
                    <ul className={styles.neighborList}>
                      {knnPrediction.neighbors.map((neighbor) => {
                        const row = lab.config.dataset.rows[neighbor.rowIndex];
                        return (
                          <li key={neighbor.rowIndex} className={styles.neighborItem}>
                            <span>
                              {model.selectedFeatures
                                .map((feature) => formatCell(row[feature]))
                                .join(" · ")}
                            </span>
                            <Tag
                              size="small"
                              color="neutral"
                              label={`${row[model.labelColumn]} · d ${formatDistance(neighbor.distance)}`}
                            />
                          </li>
                        );
                      })}
                    </ul>
                  </>
                ) : null}
                <h3 className={styles.statement}>Reserved results</h3>
                <p className={styles.muted}>
                  Click a row to fill Try it out with that order.
                </p>
                <div className={styles.resultsList}>
                  {model.holdoutResults.map((result) => {
                    const row = lab.config.dataset.rows[result.rowIndex];
                    return (
                      <button
                        key={result.rowIndex}
                        type="button"
                        className={`${styles.resultButton} ${
                          result.correct
                            ? styles.resultButtonCorrect
                            : styles.resultButtonIncorrect
                        }`}
                        onClick={() => lab.loadHoldoutRow(result.rowIndex)}
                      >
                        <span>
                          {model.selectedFeatures
                            .map((feature) => formatCell(row[feature]))
                            .join(" · ")}
                        </span>
                        <Tag
                          size="small"
                          color={result.correct ? "success" : "warning"}
                          label={`${result.predicted} / ${result.actual}`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
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
