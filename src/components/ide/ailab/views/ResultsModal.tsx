import { useMemo, useState } from "react";
import { Button, Modal, SegmentedButton, Tabs } from "@moshebari/cads-react";
import type { AiLabController } from "../../../../hooks/useAiLabState";
import { columnById, formatCell } from "../../../../lib/aiLab";
import type { AiLabColumn, AiLabTrainingRun } from "../../../../types/aiLab";
import { PredictionStatement } from "./PredictionStatement";
import sheet from "./DataStudio.module.scss";
import styles from "./ResultsModal.module.scss";

export type ResultsTab = "scorecard" | "previous";

const SCORECARD_PAGE_SIZE = 200;

/** Up to two decimals, trailing zeros dropped so 68 stays 68% and 99.40 stays 99.4%. */
export function formatAccuracyPercent(accuracy: number): string {
  const percent = Math.round(accuracy * 10000) / 100;
  if (Number.isInteger(percent)) return `${percent}%`;
  return `${percent.toFixed(2).replace(/0$/, "")}%`;
}

interface ResultsModalProps {
  lab: AiLabController;
  open: boolean;
  initialTab: ResultsTab;
  onClose: () => void;
  onTryRow: (rowIndex: number) => void;
}

/**
 * Testing Results. Remount (via `key`) each time it opens so the entry tab
 * and the Correct filter start fresh; tab changes stick until it closes.
 */
export function ResultsModal({
  lab,
  open,
  initialTab,
  onClose,
  onTryRow,
}: ResultsModalProps) {
  const [tab, setTab] = useState<ResultsTab>(initialTab);
  const model = lab.model;
  if (!model) return null;

  return (
    <Modal
      open={open}
      title="Results"
      maxWidth={800}
      className={styles.modal}
      isDismissable
      hasSecondaryAction={false}
      primaryActionLabel="Back to Testing"
      onPrimaryAction={onClose}
      onClose={onClose}
    >
      <div className={styles.root}>
        <div className={styles.tabStrip}>
          <Tabs
            type="secondary"
            size="medium"
            aria-label="Results"
            value={tab}
            onChange={(value) => setTab(value as ResultsTab)}
            items={[
              { value: "scorecard", label: "Scorecard" },
              { value: "previous", label: "Previous results" },
            ]}
          />
        </div>
        <div className={styles.content}>
          {tab === "scorecard" ? (
            <ScorecardTab lab={lab} onTryRow={onTryRow} />
          ) : (
            <PreviousTab
              columns={lab.config.dataset.columns}
              runs={lab.trainingRuns}
            />
          )}
        </div>
      </div>
    </Modal>
  );
}

function ScorecardTab({
  lab,
  onTryRow,
}: {
  lab: AiLabController;
  onTryRow: (rowIndex: number) => void;
}) {
  const [filter, setFilter] = useState<"correct" | "incorrect">("correct");
  const [pageCount, setPageCount] = useState(1);
  const model = lab.model;
  const columns = lab.config.dataset.columns;
  const featureColumns = useMemo(() => {
    if (!model) return [];
    return model.selectedFeatures
      .map((feature) => columnById(columns, feature))
      .filter((column): column is AiLabColumn => Boolean(column));
  }, [columns, model]);
  const labelName = model
    ? columnById(columns, model.labelColumn)?.name ?? model.labelColumn
    : "";
  const results = useMemo(() => {
    const rows = model?.holdoutResults ?? [];
    return rows.filter((result) =>
      filter === "correct" ? result.correct : !result.correct,
    );
  }, [filter, model]);
  const visibleResults = results.slice(0, pageCount * SCORECARD_PAGE_SIZE);
  const hiddenCount = results.length - visibleResults.length;
  const canTry = !lab.config.hideTestTab;

  if (!model) return null;

  return (
    <>
      <div className={styles.scoreHead}>
        <PredictionStatement
          columns={columns}
          labelColumn={model.labelColumn}
          features={model.selectedFeatures}
          size="large"
          fit
          className={styles.sentence}
        />
        <p className={styles.accuracyText}>
          {formatAccuracyPercent(model.accuracy)} Accuracy
        </p>
        <span className={styles.headDivider} aria-hidden />
        <SegmentedButton
          size="extraSmall"
          aria-label="Filter scorecard rows"
          value={filter}
          onChange={(value) => {
            setFilter(value as "correct" | "incorrect");
            setPageCount(1);
          }}
          options={[
            { value: "correct", label: "Correct" },
            { value: "incorrect", label: "Incorrect" },
          ]}
        />
      </div>
      <div className={styles.tableWrap}>
        <table className={sheet.grid} aria-label="Scorecard">
          <thead>
            <tr>
              <th className={sheet.th} colSpan={featureColumns.length}>
                Feature
              </th>
              <th className={sheet.th}>Actual</th>
              <th className={sheet.th}>AI Prediction</th>
            </tr>
            <tr>
              {featureColumns.map((column) => (
                <th
                  key={column.id}
                  className={`${sheet.th} ${sheet.thFeature} ${styles.nameTh}`}
                >
                  {column.name}
                </th>
              ))}
              <th className={`${sheet.th} ${sheet.thLabel} ${styles.nameTh}`}>
                {labelName}
              </th>
              <th className={`${sheet.th} ${sheet.thLabel} ${styles.nameTh}`}>
                {labelName}
              </th>
            </tr>
          </thead>
          <tbody>
            {results.length === 0 ? (
              <tr>
                <td
                  className={`${sheet.td} ${styles.emptyCell}`}
                  colSpan={featureColumns.length + 2}
                >
                  No rows in this filter.
                </td>
              </tr>
            ) : (
              visibleResults.map((result) => {
                const row = lab.rows[result.rowIndex];
                return (
                  <tr
                    key={result.rowIndex}
                    className={canTry ? styles.tryRow : undefined}
                    tabIndex={canTry ? 0 : undefined}
                    onClick={
                      canTry ? () => onTryRow(result.rowIndex) : undefined
                    }
                    onKeyDown={
                      canTry
                        ? (event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              onTryRow(result.rowIndex);
                            }
                          }
                        : undefined
                    }
                  >
                    {featureColumns.map((column) => (
                      <td
                        key={column.id}
                        className={`${sheet.td} ${sheet.tdFeature} ${
                          column.type === "numerical" ? sheet.tdNumeric : ""
                        }`}
                      >
                        {row ? formatCell(row[column.id]) : "—"}
                      </td>
                    ))}
                    <td className={`${sheet.td} ${sheet.tdLabel}`}>
                      {result.actual}
                    </td>
                    <td className={`${sheet.td} ${sheet.tdLabel}`}>
                      {result.predicted}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {hiddenCount > 0 ? (
          <div className={styles.showMore}>
            <Button
              size="small"
              variant="outlined"
              color="secondary"
              onClick={() => setPageCount((count) => count + 1)}
            >
              Show {Math.min(hiddenCount, SCORECARD_PAGE_SIZE)} more rows (
              {hiddenCount} remaining)
            </Button>
          </div>
        ) : null}
      </div>
    </>
  );
}

function PreviousTab({
  columns,
  runs,
}: {
  columns: AiLabColumn[];
  runs: AiLabTrainingRun[];
}) {
  const newestFirst = [...runs].reverse();
  if (newestFirst.length === 0) {
    return <p className={styles.emptyLine}>No previous results yet.</p>;
  }

  return (
    <div className={styles.log}>
      <div className={styles.logHead}>
        <span>MODEL</span>
        <span>ACCURACY</span>
      </div>
      <ul className={styles.logList}>
        {newestFirst.map((run) => (
          <li key={run.id} className={styles.logRow}>
            <PredictionStatement
              columns={columns}
              labelColumn={run.labelColumn}
              features={run.selectedFeatures}
              size="large"
              fit
              className={styles.sentence}
            />
            <span className={styles.logAccuracy}>
              {formatAccuracyPercent(run.accuracy)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
