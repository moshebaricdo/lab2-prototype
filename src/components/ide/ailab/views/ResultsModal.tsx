import { useMemo, useState, type CSSProperties } from "react";
import { Button, Modal, SegmentedButton, Tabs } from "@moshebari/cads-react";
import type { AiLabController } from "../../../../hooks/useAiLabState";
import { columnById, formatCell } from "../../../../lib/aiLab";
import type {
  AiLabColumn,
  AiLabTrainedModel,
  AiLabTrainingRun,
} from "../../../../types/aiLab";
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
              model={model}
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
  const titleColumnId = lab.config.cardTitleColumn;
  const titleColumn =
    titleColumnId &&
    model &&
    titleColumnId !== model.labelColumn &&
    !model.selectedFeatures.includes(titleColumnId)
      ? columnById(columns, titleColumnId)
      : undefined;
  const results = useMemo(() => {
    const rows = model?.holdoutResults ?? [];
    return rows.filter((result) =>
      filter === "correct" ? result.correct : !result.correct,
    );
  }, [filter, model]);
  const visibleResults = results.slice(0, pageCount * SCORECARD_PAGE_SIZE);
  const hiddenCount = results.length - visibleResults.length;
  const canTry = !lab.config.hideTestTab;
  const lastRowNumber = Math.max(
    1,
    ...results.map((result) => result.rowIndex + 1),
  );

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
        <table
          className={sheet.grid}
          aria-label="Scorecard"
          style={
            {
              "--index-col-ch": String(lastRowNumber).length,
            } as CSSProperties
          }
        >
          <thead>
            <tr>
              <th className={`${sheet.th} ${sheet.thIndex}`} aria-label="Row" />
              {titleColumn ? <th className={sheet.th} /> : null}
              <th className={sheet.th} colSpan={featureColumns.length}>
                Feature
              </th>
              <th className={sheet.th}>Actual</th>
              <th className={sheet.th}>AI Prediction</th>
            </tr>
            <tr>
              <th
                className={`${sheet.th} ${sheet.thIndex} ${styles.nameTh}`}
                aria-hidden
              />
              {titleColumn ? (
                <th className={`${sheet.th} ${styles.nameTh}`}>
                  {titleColumn.name}
                </th>
              ) : null}
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
          {results.length > 0 ? (
          <tbody>
            {visibleResults.map((result) => {
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
                    <td className={`${sheet.td} ${sheet.tdIndex}`}>
                      {result.rowIndex + 1}
                    </td>
                    {titleColumn ? (
                      <td className={sheet.td}>
                        {row ? formatCell(row[titleColumn.id]) : "—"}
                      </td>
                    ) : null}
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
              })}
          </tbody>
          ) : null}
        </table>
        {results.length === 0 ? (
          <p className={styles.emptySheet}>No rows matched this filter</p>
        ) : null}
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
  model,
  runs,
}: {
  columns: AiLabColumn[];
  model: AiLabTrainedModel;
  runs: AiLabTrainingRun[];
}) {
  const newestFirst = [...runs].reverse();
  // The newest run is the model just trained. Current is that model on its
  // own; everything older stays in Previous. A pretrained model has no runs.
  const previousRuns = newestFirst.slice(1);

  return (
    <div className={styles.log}>
      <section className={styles.runGroup} aria-label="Current">
        <RunHeading label="Current" />
        <div className={styles.rule} aria-hidden />
        <ResultRow
          columns={columns}
          labelColumn={model.labelColumn}
          features={model.selectedFeatures}
          accuracy={model.accuracy}
        />
      </section>
      <section className={styles.previousGroup} aria-label="Previous">
        <div className={styles.runGroup}>
          <RunHeading label="Previous" />
          <div className={styles.rule} aria-hidden />
        </div>
        {previousRuns.length === 0 ? (
          <p className={styles.emptyLine}>No previous results yet.</p>
        ) : (
          <ul className={styles.logList}>
            {previousRuns.map((run, index) => (
              <li key={run.id} className={styles.logItem}>
                {index > 0 ? <div className={styles.rule} aria-hidden /> : null}
                <ResultRow
                  columns={columns}
                  labelColumn={run.labelColumn}
                  features={run.selectedFeatures}
                  accuracy={run.accuracy}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function RunHeading({ label }: { label: string }) {
  return (
    <div className={styles.logHead}>
      <span>{label}</span>
      <span className={styles.accuracySlot}>Accuracy</span>
    </div>
  );
}

function ResultRow({
  columns,
  labelColumn,
  features,
  accuracy,
}: {
  columns: AiLabColumn[];
  labelColumn: string;
  features: string[];
  accuracy: number;
}) {
  return (
    <div className={styles.logRow}>
      <PredictionStatement
        columns={columns}
        labelColumn={labelColumn}
        features={features}
        size="large"
        fit
        className={styles.sentence}
      />
      <span className={`${styles.logAccuracy} ${styles.accuracySlot}`}>
        {formatAccuracyPercent(accuracy)}
      </span>
    </div>
  );
}
