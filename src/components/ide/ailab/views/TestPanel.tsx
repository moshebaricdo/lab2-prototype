import { Button, Dropdown, Tag, TextInput } from "@moshebaricdo/cads-react";
import { ScrollArea } from "../../../ui/scroll-area";
import type { AiLabController } from "../../../../hooks/useAiLabState";
import type { AiLabDataRow, AiLabKnnPrediction, AiLabTreeTrace } from "../../../../types/aiLab";
import {
  columnById,
  columnType,
  formatCell,
  predictKnn,
  predictionStatement,
  traceDecisionTree,
  uniqueValues,
} from "../../../../lib/aiLab";
import { DecisionTreeViz } from "./DecisionTreeViz";
import { KnnScatterViz } from "./KnnScatterViz";
import styles from "./AiLabWorkspace.module.scss";

interface TestPanelProps {
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

export function TestPanel({ lab }: TestPanelProps) {
  const model = lab.model;
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

  const runPredict = () => {
    if (!prediction) return;
    lab.setLastPrediction(prediction);
  };

  return (
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
              {model.holdoutResults.length} reserved rows predicted correctly.
            </p>
          </div>
          <div className={styles.vizFill}>
            {model.algorithm === "decisionTree" && model.tree ? (
              <DecisionTreeViz
                root={model.tree}
                columns={lab.config.dataset.columns}
                trace={treeTrace}
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
              />
            )}
          </div>
        </div>
        <div className={styles.formPane}>
          <ScrollArea className={styles.scroll}>
            <div className={styles.sectionPad}>
              <h3 className={styles.inspectorTitle}>Try it out</h3>
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
                <Button
                  size="medium"
                  variant="contained"
                  color="primary"
                  disabled={!ready}
                  onClick={runPredict}
                >
                  Predict
                </Button>
                {lab.lastPrediction ? (
                  <p className={styles.statement}>
                    Prediction: {lab.lastPrediction}
                  </p>
                ) : null}
              </div>
              <h3 className={styles.inspectorTitle}>Reserved results</h3>
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
                      onClick={() => {
                        lab.loadHoldoutRow(result.rowIndex);
                        lab.setLastPrediction(result.predicted);
                      }}
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
  );
}
