import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  Button,
  Modal,
  SegmentedButton,
  Tabs,
  Tag,
  Tooltip,
} from "@moshebari/cads-react";
import type { AiLabController } from "../../../../hooks/useAiLabState";
import { columnById, formatCell, trainingRunLoadBlock } from "../../../../lib/aiLab";
import type {
  AiLabAlgorithmId,
  AiLabColumn,
} from "../../../../types/aiLab";
import {
  ColumnScopeToggle,
  extraSheetColumns,
  sheetColumnsFor,
  sheetIdColumnId,
} from "./ColumnScopeToggle";
import {
  compareCells,
  SortableSheetTh,
  useSheetHorizontalScroll,
  type ColumnSort,
} from "./DataSpreadsheet";
import { PredictionStatement } from "./PredictionStatement";
import sheet from "./DataStudio.module.scss";
import styles from "./ResultsModal.module.scss";

const ALGORITHM_META: Record<
  AiLabAlgorithmId,
  { label: string; icon: "sitemap" | "chart-scatter" }
> = {
  decisionTree: { label: "Decision Tree", icon: "sitemap" },
  knn: { label: "K-Nearest Neighbors", icon: "chart-scatter" },
};

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
  /** Restore a previous run onto Testing. Shown only when project saving is on. */
  onLoadRun?: (runId: string) => void;
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
  onLoadRun,
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
              lab={lab}
              onLoadRun={
                lab.config.projectSaving && onLoadRun ? onLoadRun : undefined
              }
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
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [sort, setSort] = useState<ColumnSort | null>(null);
  const sheetScroll = useSheetHorizontalScroll();
  const model = lab.model;
  const columns = lab.config.dataset.columns;
  const labelColumnObj = model
    ? columnById(columns, model.labelColumn) ?? {
        id: model.labelColumn,
        name: model.labelColumn,
        type: "categorical" as const,
      }
    : { id: "", name: "", type: "categorical" as const };
  const titleColumnId = lab.config.cardTitleColumn;
  const idColumnId = model
    ? sheetIdColumnId({
        labelColumn: model.labelColumn,
        features: model.selectedFeatures,
        titleColumnId,
      })
    : undefined;
  const shownColumns = useMemo(
    () =>
      model
        ? sheetColumnsFor(columns, {
            labelColumn: model.labelColumn,
            features: model.selectedFeatures,
            titleColumnId,
            showAllColumns,
          })
        : [],
    [columns, model, showAllColumns, titleColumnId],
  );
  useEffect(() => {
    if (
      !showAllColumns &&
      sort &&
      extraSheetColumns(columns, {
        labelColumn: model?.labelColumn ?? "",
        features: model?.selectedFeatures ?? [],
        titleColumnId,
      }).some((column) => column.id === sort.columnId)
    ) {
      setSort(null);
    }
  }, [columns, model, showAllColumns, sort, titleColumnId]);
  const holdoutResults = model?.holdoutResults ?? [];
  const correctCount = useMemo(
    () => holdoutResults.filter((result) => result.correct).length,
    [holdoutResults],
  );
  const results = useMemo(() => {
    const rows = holdoutResults.filter((result) =>
      filter === "correct" ? result.correct : !result.correct,
    );
    if (!sort) return rows;
    const isActual = sort.columnId === model?.labelColumn;
    const isPredicted = sort.columnId === "__predicted__";
    const col =
      isActual || isPredicted
        ? labelColumnObj
        : columnById(columns, sort.columnId);
    if (!col) return rows;
    const numeric = col.type === "numerical";
    return [...rows].sort((a, b) => {
      const valA = isActual
        ? a.actual
        : isPredicted
          ? a.predicted
          : lab.rows[a.rowIndex]?.[col.id];
      const valB = isActual
        ? b.actual
        : isPredicted
          ? b.predicted
          : lab.rows[b.rowIndex]?.[col.id];
      const compared = compareCells(valA, valB, numeric, sort.direction);
      return compared || a.rowIndex - b.rowIndex;
    });
  }, [columns, filter, holdoutResults, lab.rows, labelColumnObj, model, sort]);
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
        <div className={styles.actionGroup}>
          <SegmentedButton
            size="extraSmall"
            aria-label="Filter scorecard rows"
            value={filter}
            onChange={(value) => {
              setFilter(value as "correct" | "incorrect");
              setPageCount(1);
            }}
            options={[
              { value: "correct", label: `Correct (${correctCount})` },
              {
                value: "incorrect",
                label: `Incorrect (${holdoutResults.length - correctCount})`,
              },
            ]}
          />
          <ColumnScopeToggle
            expanded={showAllColumns}
            onChange={setShowAllColumns}
          />
        </div>
      </div>
      <div
        ref={sheetScroll.ref}
        className={`${styles.tableWrap} ${styles.keepRowEdge}`}
      >
        <div
          className={sheet.pinShadow}
          data-visible={sheetScroll.scrolled ? "true" : undefined}
          aria-hidden
        />
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
              {shownColumns.map((column) => {
                const isId = column.id === idColumnId;
                const isLabel = !isId && column.id === model.labelColumn;
                const isFeature =
                  !isId && model.selectedFeatures.includes(column.id);
                return (
                  <SortableSheetTh
                    key={column.id}
                    column={column}
                    sort={sort}
                    onSortChange={setSort}
                    pinned={isId}
                    className={
                      isId
                        ? sheet.thId
                        : isLabel
                          ? sheet.thLabel
                          : isFeature
                            ? sheet.thFeature
                            : undefined
                    }
                  />
                );
              })}
              <SortableSheetTh
                column={{ ...labelColumnObj, name: "AI predicts" }}
                sortId="__predicted__"
                sort={sort}
                onSortChange={setSort}
                className={sheet.thLabel}
              />
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
                    {shownColumns.map((column) => {
                      const isId = column.id === idColumnId;
                      const isLabel = !isId && column.id === model.labelColumn;
                      const isFeature =
                        !isId && model.selectedFeatures.includes(column.id);
                      return (
                        <td
                          key={column.id}
                          className={[
                            sheet.td,
                            isId
                              ? sheet.tdId
                              : isLabel
                                ? sheet.tdLabel
                                : isFeature
                                  ? sheet.tdFeature
                                  : "",
                            column.type === "numerical" ? sheet.tdNumeric : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          {isLabel
                            ? result.actual
                            : row
                              ? formatCell(row[column.id])
                              : "—"}
                        </td>
                      );
                    })}
                    <td
                      className={`${sheet.td} ${sheet.tdLabel} ${
                        labelColumnObj.type === "numerical"
                          ? sheet.tdNumeric
                          : ""
                      }`}
                    >
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
  lab,
  onLoadRun,
}: {
  lab: AiLabController;
  onLoadRun?: (runId: string) => void;
}) {
  const columns = lab.config.dataset.columns;
  const model = lab.model;
  const runs = lab.trainingRuns;
  if (!model) return null;
  const activeRun = runs.find((run) => run.id === lab.activeRunId);
  const newestFirst = [...runs].reverse();
  // Current is the model on Testing. With no active id (a pretrained model,
  // or the first paint) the newest run is that model, so it stays out of
  // Previous. Loading an older run makes that one Current instead.
  const previousRuns = activeRun
    ? newestFirst.filter((run) => run.id !== activeRun.id)
    : newestFirst.slice(1);
  const canLoad = Boolean(onLoadRun);

  return (
    <div className={styles.log}>
      <section className={styles.runGroup} aria-label="Current">
        <RunHeading label="Current" reserveAction={canLoad} />
        <div className={styles.rule} aria-hidden />
        <ResultRow
          columns={columns}
          algorithm={model.algorithm}
          labelColumn={model.labelColumn}
          features={model.selectedFeatures}
          accuracy={model.accuracy}
          reserveAction={canLoad}
        />
      </section>
      <section className={styles.previousGroup} aria-label="Previous">
        <div className={styles.runGroup}>
          <RunHeading label="Previous" reserveAction={canLoad} />
          <div className={styles.rule} aria-hidden />
        </div>
        {previousRuns.length === 0 ? (
          <p className={styles.emptyLine}>No previous results yet.</p>
        ) : (
          <ul className={styles.logList}>
            {previousRuns.map((run, index) => {
              const block = trainingRunLoadBlock(lab.config, run, columns);
              return (
                <li key={run.id} className={styles.logItem}>
                  {index > 0 ? <div className={styles.rule} aria-hidden /> : null}
                  <ResultRow
                    columns={columns}
                    algorithm={run.algorithm ?? model.algorithm}
                    labelColumn={run.labelColumn}
                    features={run.selectedFeatures}
                    accuracy={run.accuracy}
                    reserveAction={canLoad}
                    action={
                      onLoadRun ? (
                        <Tooltip
                          title={
                            block ?? "Use this model on Testing"
                          }
                          placement="top"
                        >
                          <span className={styles.loadWrap}>
                            <Button
                              size="extraSmall"
                              variant="outlined"
                              color="secondary"
                              disabled={Boolean(block)}
                              onClick={() => onLoadRun(run.id)}
                            >
                              Load
                            </Button>
                          </span>
                        </Tooltip>
                      ) : null
                    }
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function RunHeading({
  label,
  reserveAction = false,
}: {
  label: string;
  reserveAction?: boolean;
}) {
  return (
    <div className={styles.logHead}>
      <span className={styles.statementCol}>{label}</span>
      <span className={styles.accuracySlot}>Accuracy</span>
      <span className={styles.modelSlot}>Model</span>
      {reserveAction ? <span className={styles.actionSlot} /> : null}
    </div>
  );
}

function ResultRow({
  columns,
  algorithm,
  labelColumn,
  features,
  accuracy,
  reserveAction = false,
  action,
}: {
  columns: AiLabColumn[];
  algorithm: AiLabAlgorithmId;
  labelColumn: string;
  features: string[];
  accuracy: number;
  reserveAction?: boolean;
  action?: ReactNode;
}) {
  const algoMeta = ALGORITHM_META[algorithm];
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
      <span className={styles.modelSlot}>
        <Tooltip title={algoMeta.label} placement="top">
          <span
            className={styles.modelTagWrap}
            aria-label={`Algorithm: ${algoMeta.label}`}
          >
            <Tag
              size="medium"
              color="brand"
              startIconName={algoMeta.icon}
              label=""
              className={styles.modelTag}
            />
          </span>
        </Tooltip>
      </span>
      {reserveAction ? (
        <span className={styles.actionSlot}>{action}</span>
      ) : null}
    </div>
  );
}
