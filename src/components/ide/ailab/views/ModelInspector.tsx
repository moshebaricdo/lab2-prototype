import { useMemo, useState } from "react";
import {
  Button,
  Modal,
  SegmentedButton,
  Tag,
  TextInput,
} from "@moshebaricdo/cads-react";
import type { AiLabController } from "../../../../hooks/useAiLabState";
import {
  columnById,
  formatCell,
  predictionStatement,
  slugifyModelName,
} from "../../../../lib/aiLab";
import styles from "./ModelInspector.module.scss";

export type ModelInspectorTab = "scorecard" | "card";
type ScoreFilter = "all" | "correct" | "incorrect";

const SCORECARD_PAGE_SIZE = 200;

const ALGORITHM_NAMES = {
  knn: "K-Nearest Neighbors",
  decisionTree: "Decision Tree",
} as const;

interface ScorecardModalProps {
  lab: AiLabController;
  open: boolean;
  onClose: () => void;
  onTryRow: (rowIndex: number) => void;
}

interface ExportModalProps {
  lab: AiLabController;
  open: boolean;
  onClose: () => void;
}

/**
 * Scorecard and export used to share one tabbed inspector. They are
 * separate modals so a level can show one, the other, or both.
 */
export function ModelInspector({
  lab,
  open,
  tab,
  onClose,
  onTryRow,
}: ScorecardModalProps & { tab: ModelInspectorTab }) {
  if (tab === "card") {
    return <ExportModal lab={lab} open={open} onClose={onClose} />;
  }
  return (
    <ScorecardModal
      lab={lab}
      open={open}
      onClose={onClose}
      onTryRow={onTryRow}
    />
  );
}

export function ScorecardModal({
  lab,
  open,
  onClose,
  onTryRow,
}: ScorecardModalProps) {
  const model = lab.model;
  if (!model) return null;

  const columns = lab.config.dataset.columns;
  const labelName =
    columnById(columns, model.labelColumn)?.name ?? model.labelColumn;
  const featureColumns = model.selectedFeatures
    .map((feature) => columnById(columns, feature))
    .filter((column): column is NonNullable<typeof column> => Boolean(column));
  const results = model.holdoutResults;
  const correctCount = results.filter((result) => result.correct).length;
  const statement = predictionStatement(
    columns,
    model.labelColumn,
    model.selectedFeatures,
  );

  return (
    <Modal
      open={open}
      title="Scorecard"
      maxWidth={720}
      className={styles.inspectorModal}
      isDismissable
      hasSecondaryAction={false}
      primaryActionLabel="Close"
      onPrimaryAction={onClose}
      onClose={onClose}
    >
      <div className={styles.root}>
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <h2 className={styles.title}>How this model did</h2>
            <p className={styles.meta}>
              {statement}{" "}
              {ALGORITHM_NAMES[model.algorithm]}
              {model.algorithm === "knn" && model.knnK
                ? ` · k = ${model.knnK}`
                : ""}
              {` · ${lab.config.dataset.name}`}
            </p>
          </div>
          <div className={styles.accuracyBlock}>
            <p className={styles.accuracy}>{Math.round(model.accuracy * 100)}%</p>
            <span className={styles.accuracyNote}>
              {correctCount} of {results.length} rows
            </span>
          </div>
        </header>
        <Scorecard
          lab={lab}
          featureColumns={featureColumns}
          labelName={labelName}
          onTryRow={onTryRow}
        />
      </div>
    </Modal>
  );
}

export function ExportModal({ lab, open, onClose }: ExportModalProps) {
  const model = lab.model;
  if (!model) return null;

  const statement = predictionStatement(
    lab.config.dataset.columns,
    model.labelColumn,
    model.selectedFeatures,
  );

  return (
    <Modal
      open={open}
      title="Save model"
      maxWidth={720}
      className={styles.inspectorModal}
      isDismissable
      hasSecondaryAction={false}
      primaryActionLabel="Close"
      onPrimaryAction={onClose}
      onClose={onClose}
    >
      <div className={styles.root}>
        <ModelCard lab={lab} statement={statement} />
      </div>
    </Modal>
  );
}

function Scorecard({
  lab,
  featureColumns,
  labelName,
  onTryRow,
}: {
  lab: AiLabController;
  featureColumns: { id: string; name: string }[];
  labelName: string;
  onTryRow: (rowIndex: number) => void;
}) {
  const [filter, setFilter] = useState<ScoreFilter>("all");
  const [pageCount, setPageCount] = useState(1);
  const model = lab.model;
  const results = useMemo(() => {
    const rows = model?.holdoutResults ?? [];
    if (filter === "correct") {
      return rows.filter((result) => result.correct);
    }
    if (filter === "incorrect") {
      return rows.filter((result) => !result.correct);
    }
    return rows;
  }, [filter, model]);
  // Mount in pages: a full sheet is thousands of rows, and this table lives
  // inside a modal that opens on click.
  const visibleResults = results.slice(0, pageCount * SCORECARD_PAGE_SIZE);
  const hiddenCount = results.length - visibleResults.length;

  if (!model) return null;

  return (
    <div className={styles.panel}>
      <div className={styles.scoreToolbar}>
        <p className={styles.panelLead}>
          {lab.config.hideTestTab
            ? "How this model scored."
            : "How this model scored. Click a row to try those values on Test."}
        </p>
        <div className={styles.scoreFilters}>
          <span className={styles.legend}>
            <span className={styles.legendCorrect}>Correct</span>
            <span className={styles.legendIncorrect}>Incorrect</span>
          </span>
          <SegmentedButton
            size="extraSmall"
            aria-label="Filter scorecard rows"
            value={filter}
            onChange={(value) => {
              setFilter(value as ScoreFilter);
              setPageCount(1);
            }}
            options={[
              { value: "all", label: "All" },
              { value: "correct", label: "Correct" },
              { value: "incorrect", label: "Incorrect" },
            ]}
          />
        </div>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thIndex}> </th>
              {featureColumns.map((column) => (
                <th key={column.id}>{column.name}</th>
              ))}
              <th>Actual {labelName}</th>
              <th>Prediction</th>
            </tr>
          </thead>
          <tbody>
            {results.length === 0 ? (
              <tr>
                <td
                  className={styles.emptyCell}
                  colSpan={featureColumns.length + 3}
                >
                  No rows in this filter.
                </td>
              </tr>
            ) : (
              visibleResults.map((result) => {
                const row = lab.rows[result.rowIndex];
                return (
                  <tr key={result.rowIndex}>
                    <td className={styles.tdIndex}>{result.rowIndex + 1}</td>
                    {featureColumns.map((column) => (
                      <td key={column.id}>
                        {row ? formatCell(row[column.id]) : "—"}
                      </td>
                    ))}
                    <td>{result.actual}</td>
                    <td>
                      {lab.config.hideTestTab ? (
                        <span
                          className={`${styles.predictButton} ${
                            result.correct
                              ? styles.predictCorrect
                              : styles.predictIncorrect
                          }`}
                        >
                          {result.predicted}
                        </span>
                      ) : (
                        <button
                          type="button"
                          className={`${styles.predictButton} ${
                            result.correct
                              ? styles.predictCorrect
                              : styles.predictIncorrect
                          }`}
                          onClick={() => onTryRow(result.rowIndex)}
                        >
                          {result.predicted}
                        </button>
                      )}
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
    </div>
  );
}

function ModelCard({
  lab,
  statement,
}: {
  lab: AiLabController;
  statement: string;
}) {
  const model = lab.model;
  const [name, setName] = useState(() => lab.config.dataset.name);
  const [intendedUse, setIntendedUse] = useState("");
  const [limitations, setLimitations] = useState("");
  if (!model) return null;

  const columns = lab.config.dataset.columns;
  const example = lab.rows[0];
  const slug = slugifyModelName(name);
  const snippetLines = model.selectedFeatures.map((feature) => {
    const column = columnById(columns, feature);
    const raw = example?.[feature];
    const value =
      column?.type === "numerical"
        ? String(raw ?? 0)
        : `"${String(raw ?? "")}"`;
    return `  ${feature}: ${value}`;
  });
  const snippet = `getPrediction("${slug}", {\n${snippetLines.join(",\n")}\n})`;

  return (
    <div className={styles.panel}>
      <p className={styles.panelLead}>
        A short card for handing this model to another lab. Saving keeps it in
        this session.
      </p>
      <p className={styles.statement}>{statement}</p>
      <dl className={styles.facts}>
        <div>
          <dt>Algorithm</dt>
          <dd>{ALGORITHM_NAMES[model.algorithm]}</dd>
        </div>
        <div>
          <dt>Dataset</dt>
          <dd>{lab.config.dataset.name}</dd>
        </div>
        <div>
          <dt>Accuracy</dt>
          <dd>{Math.round(model.accuracy * 100)}%</dd>
        </div>
      </dl>
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          lab.saveModel({ name, intendedUse, limitations });
        }}
      >
        <TextInput
          size="small"
          color="secondary"
          label="Model name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Intended use</span>
          <textarea
            className={styles.textarea}
            rows={2}
            value={intendedUse}
            onChange={(event) => setIntendedUse(event.target.value)}
            placeholder="What should someone use this prediction for?"
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Limitations</span>
          <textarea
            className={styles.textarea}
            rows={2}
            value={limitations}
            onChange={(event) => setLimitations(event.target.value)}
            placeholder="Where might this model be wrong or unfair?"
          />
        </label>
        <div className={styles.formActions}>
          <Button
            size="small"
            variant="contained"
            color="primary"
            type="submit"
            disabled={!name.trim()}
          >
            Save model
          </Button>
        </div>
      </form>
      <div className={styles.snippetBlock}>
        <p className={styles.fieldLabel}>Use in App Lab</p>
        <pre className={styles.snippet}>{snippet}</pre>
      </div>
      {lab.savedModels.length > 0 ? (
        <ul className={styles.savedList}>
          {lab.savedModels.map((saved) => (
            <li key={saved.id} className={styles.savedItem}>
              <div>
                <p className={styles.savedName}>{saved.name}</p>
                <p className={styles.savedMeta}>
                  {saved.datasetName}
                  {saved.intendedUse ? ` · ${saved.intendedUse}` : ""}
                </p>
              </div>
              <Tag size="small" color="neutral" label="Saved" />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
