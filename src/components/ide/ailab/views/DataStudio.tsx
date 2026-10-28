import {
  memo,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactElement,
} from "react";
import {
  Alert,
  Button,
  Dropdown,
  IconTooltip,
  SegmentedButton,
  Tooltip,
} from "@moshebari/cads-react";
import { FaIcon } from "../../../ui/icons/FaIcon";
import type { AiLabController } from "../../../../hooks/useAiLabState";
import { useChecklistMenuWidth } from "../../../../hooks/useChecklistMenuWidth";
import {
  columnUsable,
  formatCell,
  formatNumber,
  frequencies,
  histogramBins,
  MAX_CATEGORY_VALUES,
  numericalStats,
  uniqueValues,
} from "../../../../lib/aiLab";
import type {
  AiLabAlgorithmId,
  AiLabColumn,
  AiLabDataRow,
} from "../../../../types/aiLab";
import { PanelHeader } from "../../../ui/PanelHeader";
import { ColumnDistributionChart } from "./ColumnDistributionChart";
import { DatasetFilterControl } from "./DatasetFilterControl";
import { DataSpreadsheet } from "./DataSpreadsheet";
import { ModelActions } from "./ModelActions";
import type { ModelInspectorTab } from "./ModelInspector";
import { ScaleGroupEditor } from "./ScaleGroupEditor";
import { DatasetStartEmptyState } from "./DatasetStartEmptyState";
import type { DatasetPickerController } from "./DatasetPickerModal";
import { DatasetStoryModal } from "./DatasetStoryModal";
import { IntroActivity } from "./IntroActivity";
import { PredictionStatement } from "./PredictionStatement";
import { TrainingModal } from "./TrainingModal";
import { TreeThumbnail } from "./viz/TreeGrowth";
import styles from "./DataStudio.module.scss";

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function sameIdSet(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const seen = new Set(left);
  return right.every((id) => seen.has(id));
}

/** Instructional copy that used to sit under the field, now on the label. */
function TrainFieldLabel({ label, tip }: { label: string; tip: string }) {
  return (
    <div className={styles.fieldLabelRow}>
      <span className={styles.fieldLabel}>{label}</span>
      <IconTooltip title={tip} size="extraSmall" color="tertiary" placement="top" />
    </div>
  );
}

/** Locked Predict field: still readable (readOnly), with a hover reason. */
function LockedLabelTooltip({
  locked,
  children,
}: {
  locked: boolean;
  children: ReactElement;
}) {
  if (!locked) return children;
  return (
    <Tooltip title="You can't change this" placement="top">
      <span className={styles.fullWidthButton}>{children}</span>
    </Tooltip>
  );
}

interface DataStudioProps {
  lab: AiLabController;
  onOpenModel?: (tab: ModelInspectorTab) => void;
  onOpenAlgorithmModal?: () => void;
  /** Empty sheet action. Upload level opens the dataset picker from here. */
  onChooseDataset?: () => void;
  /** Full-screen start when the lab has no sheet yet. */
  datasetStart?: DatasetPickerController;
}

export function DataStudio({
  lab,
  onOpenModel,
  onOpenAlgorithmModal,
  onChooseDataset,
  datasetStart,
}: DataStudioProps) {
  const selected = lab.config.dataset.columns.find(
    (column) => column.id === lab.selectedColumnId,
  );
  // The intro (story / classify deck) stands in for the sheet until done;
  // the Train rail waits with it so the step reads as "data first".
  const inIntro = !lab.needsDataset && !lab.introComplete;
  const showAnalysis =
    !lab.needsDataset && !inIntro && lab.dataView === "table" && Boolean(selected);
  const showScaleDock =
    showAnalysis &&
    selected?.type === "numerical" &&
    Boolean(lab.config.allowScaleColumns);
  const showTrain = !lab.config.hideTrainTab && !lab.needsDataset && !inIntro;
  const awaitingUpload = Boolean(lab.config.emptyDataset) && lab.needsDataset;

  return (
    <section
      className={[
        styles.root,
        showAnalysis ? styles.rootWithAnalysis : "",
        showScaleDock ? styles.rootWithScale : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={styles.stage}>
        <div className={styles.sheetColumn}>
          {awaitingUpload ? null : (
            <DataHeader lab={lab} inIntro={inIntro} />
          )}
          {inIntro ? (
            <IntroActivity lab={lab} />
          ) : awaitingUpload && datasetStart ? (
            <DatasetStartEmptyState {...datasetStart} />
          ) : awaitingUpload ? (
            <EmptyDatasetSheet
              title={lab.config.emptyDataset?.title ?? "No data to show"}
              copy={
                lab.config.emptyDataset?.copy ??
                "Choose a sample dataset, or upload a CSV."
              }
              actionLabel={onChooseDataset ? "Choose a dataset" : undefined}
              onAction={onChooseDataset}
            />
          ) : lab.needsDataset ? (
            <div className={styles.empty}>
              <div className={styles.emptyInner}>
                <h2 className={styles.emptyTitle}>Waiting for a dataset</h2>
                <p className={styles.emptyCopy}>
                  Finish setup in the modal to open the sheet.
                </p>
              </div>
            </div>
          ) : lab.dataView === "cards" ? (
            <DataCards key={lab.datasetId} lab={lab} />
          ) : (
            <DataSpreadsheet key={lab.datasetId} lab={lab} />
          )}
        </div>
        {showTrain ? (
          <TrainRail
            lab={lab}
            onOpenModel={onOpenModel}
            onOpenAlgorithmModal={onOpenAlgorithmModal}
          />
        ) : null}
      </div>
      {showAnalysis && selected ? (
        <ColumnAnalysis
          lab={lab}
          column={selected}
          rows={lab.rows}
          onClose={() => lab.setSelectedColumnId(undefined)}
        />
      ) : null}
    </section>
  );
}

/** Same row height as `.th` / `.td`. The card spans whole cells so its edges are grid lines. */
const EMPTY_SHEET_ROW_HEIGHT = 28;
const EMPTY_SHEET_COLUMNS = 5;
const EMPTY_SHEET_CARD_COLUMNS = 3;
const EMPTY_SHEET_CARD_ROWS = 9;

function EmptyDatasetSheet({
  title,
  copy,
  actionLabel,
  onAction,
}: {
  title: string;
  copy: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState({ rendered: 12, full: 12 });

  useLayoutEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const measure = () => {
      const height = el.clientHeight;
      const rendered = Math.max(2, Math.ceil(height / EMPTY_SHEET_ROW_HEIGHT));
      const full = Math.max(2, Math.floor(height / EMPTY_SHEET_ROW_HEIGHT));
      setRows((current) =>
        current.rendered === rendered && current.full === full
          ? current
          : { rendered, full },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const bodyRows = Math.max(rows.full - 1, 1);
  const cardRows = Math.max(
    1,
    Math.min(EMPTY_SHEET_CARD_ROWS, bodyRows >= 3 ? bodyRows - 2 : bodyRows),
  );
  const rowOffset = Math.floor((bodyRows - cardRows) / 2);
  const gridRowStart = 2 + rowOffset;
  const gridColStart =
    2 + Math.floor((EMPTY_SHEET_COLUMNS - EMPTY_SHEET_CARD_COLUMNS) / 2);

  const cells: ReactElement[] = [];
  for (let row = 0; row < rows.rendered; row += 1) {
    for (let col = 0; col < EMPTY_SHEET_COLUMNS + 1; col += 1) {
      const muted = row === 0 || col === 0;
      const edge = col === EMPTY_SHEET_COLUMNS;
      cells.push(
        <div
          key={`${row}-${col}`}
          className={[
            styles.emptyCell,
            muted ? styles.emptyCellMuted : "",
            edge ? styles.emptyCellEdge : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{ gridRow: row + 1, gridColumn: col + 1 }}
        />,
      );
    }
  }

  return (
    <div className={styles.emptySheet} ref={sheetRef}>
      <div
        className={styles.emptyGrid}
        style={{
          gridTemplateRows: `repeat(${rows.rendered}, ${EMPTY_SHEET_ROW_HEIGHT}px)`,
        }}
      >
        {cells}
        <div
          className={styles.emptyCard}
          style={{
            gridColumn: `${gridColStart} / ${gridColStart + EMPTY_SHEET_CARD_COLUMNS}`,
            gridRow: `${gridRowStart} / ${gridRowStart + cardRows}`,
          }}
        >
          <div className={styles.emptyCardBody}>
            <span className={styles.emptyIcon} aria-hidden>
              <FaIcon name="empty-set" className={styles.emptyGlyph} />
            </span>
            <div className={styles.emptyCardCopy}>
              <h2 className={styles.emptyCardTitle}>{title}</h2>
              <p className={styles.emptyCardText}>{copy}</p>
            </div>
            {onAction && actionLabel ? (
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={onAction}
              >
                {actionLabel}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function DataHeader({
  lab,
  inIntro = false,
}: {
  lab: AiLabController;
  inIntro?: boolean;
}) {
  const datasetLabel = lab.needsDataset
    ? "Choose dataset"
    : lab.config.dataset.name;
  const [storyOpen, setStoryOpen] = useState(false);

  return (
    <div className={styles.dataHeader}>
      <div className={styles.setName}>
        <span className={styles.datasetName}>{datasetLabel}</span>
        {lab.needsDataset ? null : (
          <>
            <span className={styles.setDot} aria-hidden />
            <span className={styles.setMeta}>
              {`${lab.rows.length} rows`}
            </span>
            <Tooltip
              title="About this data"
              placement="bottom"
              open={storyOpen ? false : undefined}
            >
              <Button
                variant="text"
                color="tertiary"
                size="extraSmall"
                iconOnly
                startIconName="circle-info"
                aria-label="About this data"
                aria-haspopup="dialog"
                className={styles.aboutButton}
                onClick={() => setStoryOpen(true)}
              />
            </Tooltip>
            <DatasetStoryModal
              dataset={lab.config.dataset}
              open={storyOpen}
              onClose={() => setStoryOpen(false)}
            />
          </>
        )}
      </div>
      {inIntro ? null : (
      <div className={styles.viewType}>
        {!lab.needsDataset ? <DatasetFilterControl lab={lab} /> : null}
        {lab.dataView === "table" &&
        !lab.needsDataset &&
        lab.config.allowDataEdit !== false ? (
          <Button
            variant="outlined"
            color="secondary"
            size="extraSmall"
            startIconName="plus"
            onClick={() => lab.addRow()}
          >
            Add row
          </Button>
        ) : null}
        <SegmentedButton
          size="extraSmall"
          aria-label="Dataset view"
          value={lab.dataView}
          onChange={(value) => lab.setDataView(value as "table" | "cards")}
          options={[
            { value: "table", label: "Table", iconName: "list" },
            { value: "cards", label: "Cards", iconName: "cards-blank" },
          ]}
        />
      </div>
      )}
    </div>
  );
}

const ALGORITHM_NAMES: Record<AiLabAlgorithmId, string> = {
  decisionTree: "Decision Tree",
  knn: "K-Nearest Neighbors",
};

const ALGORITHM_ICONS: Record<AiLabAlgorithmId, "sitemap" | "chart-scatter"> = {
  decisionTree: "sitemap",
  knn: "chart-scatter",
};

const ALGORITHM_DROPDOWN_OPTIONS = [
  { value: "decisionTree", label: "Decision Tree" },
  { value: "knn", label: "K-Nearest Neighbors" },
];

function TrainRail({
  lab,
  onOpenModel,
  onOpenAlgorithmModal,
}: {
  lab: AiLabController;
  onOpenModel?: (tab: ModelInspectorTab) => void;
  onOpenAlgorithmModal?: () => void;
}) {
  const [isTraining, setIsTraining] = useState(false);
  const algorithmMenu = useChecklistMenuWidth();
  const labelMenu = useChecklistMenuWidth();
  const featuresMenu = useChecklistMenuWidth();
  const canChangeAlgorithm = !lab.config.algorithmLock;
  const algorithmLabel = lab.selectedAlgorithm
    ? ALGORITHM_NAMES[lab.selectedAlgorithm]
    : "Choose an algorithm";
  const algorithmIcon = lab.selectedAlgorithm
    ? ALGORITHM_ICONS[lab.selectedAlgorithm]
    : "sitemap";
  const columns = lab.config.dataset.columns;
  const usable = (columnId: string) =>
    columnUsable(lab.rows, columns, columnId);
  // A blocked column can't be trained on. Drop it from a choice the student
  // can still change so the field doesn't sit on an error they must undo.
  useEffect(() => {
    if (
      !lab.config.lockLabelColumn &&
      !lab.config.hideLabelSelect &&
      lab.labelColumn &&
      !usable(lab.labelColumn)
    ) {
      lab.setLabelColumn("");
    }
    if (!lab.config.lockFeatures) {
      const nextFeatures = lab.selectedFeatures.filter(
        (id) => id !== lab.labelColumn && usable(id),
      );
      if (nextFeatures.length !== lab.selectedFeatures.length) {
        lab.setFeatures(nextFeatures);
      }
    }
  }, [lab, columns]);
  const featuresLocked = Boolean(lab.config.lockFeatures);
  const lockedFeatureIds = new Set(
    featuresLocked ? lab.selectedFeatures : [],
  );
  const labelOptions = columns
    .filter((column) =>
      lab.config.classificationOnly ? column.type === "categorical" : true,
    )
    .filter((column) => usable(column.id))
    .filter((column) => !lockedFeatureIds.has(column.id))
    .map((column) => ({ value: column.id, label: column.name }));
  const excludedFeatures = new Set(lab.config.excludedFeatureColumns ?? []);
  const featureOptions = columns
    .filter((column) => column.id !== lab.labelColumn)
    .filter((column) => !excludedFeatures.has(column.id))
    .filter((column) => usable(column.id))
    .map((column) => ({ value: column.id, label: column.name }));
  const model = lab.model;
  const accuracy = model ? Math.round(model.accuracy * 100) : undefined;
  const correct = model
    ? model.holdoutResults.filter((result) => result.correct).length
    : 0;
  const canTest = !lab.config.hideTestTab && lab.canVisit("test");
  const showScorecard = Boolean(lab.config.showModelDetails);
  const showExport = Boolean(lab.config.showExport);
  const showResultsFooter = showScorecard || showExport || canTest || Boolean(onOpenModel);
  // Decision trees train in a modal that grows the tree; KNN has no tree to
  // grow and keeps the inline pause. The modal only mounts once `model.tree`
  // exists, so opening it eagerly here is safe for either algorithm.
  const useTrainingModal = lab.config.trainingModal !== false;
  const [trainingOpen, setTrainingOpen] = useState(false);
  useEffect(() => {
    if (!lab.model) setTrainingOpen(false);
  }, [lab.model]);
  const hasTree = Boolean(model?.tree);
  // Replay only when the trained tree still matches the dropdowns; a
  // changed label/feature set needs a real train, not a playback.
  const modelMatches =
    Boolean(model) &&
    model.labelColumn === lab.labelColumn &&
    sameIdSet(model.selectedFeatures, lab.selectedFeatures);
  const canReplay = Boolean(useTrainingModal && hasTree && modelMatches);

  const runTrain = () => {
    if (canReplay) {
      setTrainingOpen(true);
      return;
    }
    if (!lab.canTrain || isTraining) return;
    if (useTrainingModal) {
      lab.train();
      setTrainingOpen(true);
      return;
    }
    setIsTraining(true);
    window.setTimeout(() => {
      lab.train();
      setIsTraining(false);
    }, 420);
  };

  const trainButton = (
    <Button
      size="small"
      variant={model ? "outlined" : "contained"}
      color={model ? "secondary" : "primary"}
      startIconName={model ? "arrow-rotate-left" : undefined}
      disabled={canReplay ? false : !lab.canTrain || isTraining}
      onClick={runTrain}
    >
      {isTraining
        ? "Training…"
        : canReplay
          ? "Replay training"
          : model
            ? "Rerun training"
            : "Train model"}
    </Button>
  );

  return (
    <aside className={styles.trainRail} aria-label="Train">
      <PanelHeader
        label="TRAIN"
        right={
          <Tooltip title="Clear selections and model" placement="bottom">
            <span>
              <Button
                variant="text"
                color="tertiary"
                size="extraSmall"
                iconOnly
                startIconName="eraser"
                aria-label="Clear selections and model"
                disabled={!lab.canClearTraining || isTraining}
                onClick={() => lab.clearTraining()}
              />
            </span>
          </Tooltip>
        }
      />
      <div className={styles.railBody}>
        <section className={styles.configCard}>
          <div className={styles.cardFields}>
            {canChangeAlgorithm ? (
              <div className={styles.fieldStack}>
                <TrainFieldLabel
                  label="Algorithm"
                  tip="How your model learns patterns from the data"
                />
                {lab.config.algorithmSwitcher === "dropdown" ? (
                  <div ref={algorithmMenu.ref}>
                    <Dropdown
                      role="input"
                      size="small"
                      color="secondary"
                      width="full"
                      menuWidth="100%"
                      startIconName={algorithmIcon}
                      placeholder="Choose an algorithm"
                      value={lab.selectedAlgorithm ?? ""}
                      options={ALGORITHM_DROPDOWN_OPTIONS}
                      onChange={(value) => {
                        const next = String(value) as AiLabAlgorithmId;
                        if (next && next !== lab.selectedAlgorithm) {
                          lab.selectAlgorithm(next, { advance: false });
                        }
                      }}
                      onOpenChange={algorithmMenu.onOpenChange}
                      aria-label="Algorithm"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    className={styles.algorithmTrigger}
                    aria-label={`Algorithm: ${algorithmLabel}. Change algorithm`}
                    aria-haspopup="dialog"
                    onClick={onOpenAlgorithmModal}
                  >
                    <span className={styles.algorithmTriggerMain}>
                      <span className={styles.algorithmTriggerIcon} aria-hidden>
                        <FaIcon name={algorithmIcon} size="inherit" />
                      </span>
                      <span className={styles.algorithmTriggerLabel}>
                        {algorithmLabel}
                      </span>
                    </span>
                    <span className={styles.algorithmTriggerSwap} aria-hidden>
                      <FaIcon name="right-left" size="inherit" />
                    </span>
                  </button>
                )}
              </div>
            ) : null}
            {lab.config.hideLabelSelect ? null : (
              <div className={styles.fieldStack}>
                <TrainFieldLabel
                  label="Predict"
                  tip="What you want your model to predict"
                />
                <LockedLabelTooltip locked={Boolean(lab.config.lockLabelColumn)}>
                  <div ref={labelMenu.ref}>
                    <Dropdown
                      role="input"
                      size="small"
                      color="secondary"
                      width="full"
                      menuWidth="100%"
                      helperText={lab.labelCardinality?.text}
                      sentiment={lab.labelCardinality?.sentiment ?? "default"}
                      placeholder="Choose a column"
                      value={lab.labelColumn ?? ""}
                      options={labelOptions}
                      readOnly={Boolean(lab.config.lockLabelColumn)}
                      onChange={(value) => lab.setLabelColumn(String(value))}
                      onOpenChange={labelMenu.onOpenChange}
                      aria-label="Column to predict"
                    />
                  </div>
                </LockedLabelTooltip>
              </div>
            )}
            <div className={styles.fieldStack}>
              <TrainFieldLabel
                label="Using"
                tip="What your model predicts using"
              />
              {/* Ref stays on the control: the label's info button is also a
                  button, and the menu-width hook takes the first one. */}
              <LockedLabelTooltip locked={featuresLocked}>
                <div ref={featuresMenu.ref}>
                  <Dropdown
                    role="input"
                    menuType="checklist"
                    size="small"
                    color="secondary"
                    width="full"
                    helperText={lab.featureCardinality?.text}
                    sentiment={lab.featureCardinality?.sentiment ?? "default"}
                    startIconName={
                      lab.selectedFeatures.length > 0 ? "circle-check" : undefined
                    }
                    placeholder="Choose one or more columns"
                    value={lab.selectedFeatures}
                    options={featureOptions}
                    readOnly={featuresLocked}
                    onChange={(value) => lab.setFeatures(asStringArray(value))}
                    onOpenChange={featuresMenu.onOpenChange}
                    aria-label="Feature columns"
                  />
                </div>
              </LockedLabelTooltip>
            </div>
            {/* KNN's k is not a student control. Studio searches k on a
                10% holdout (AI Lab / ml-knn). Guided levels may lock k. */}
          </div>
          {/* The sentence the model is built from, filling in as the
              dropdowns are set. Same Tag colors as the sheet columns and
              the Testing strip. */}
          <div className={styles.statementRow}>
            <PredictionStatement
              columns={columns}
              labelColumn={lab.labelColumn}
              features={lab.selectedFeatures}
            />
          </div>
          {canReplay ? null : (
            <div className={styles.cardFooter}>
              {/* Only explain *why* it is disabled; an always-on tooltip would
                  sit over the Results card right after a click. */}
              {lab.trainBlockedReason ? (
                <Tooltip title={lab.trainBlockedReason} placement="top">
                  <span className={styles.fullWidthButton}>{trainButton}</span>
                </Tooltip>
              ) : (
                <span className={styles.fullWidthButton}>{trainButton}</span>
              )}
            </div>
          )}
        </section>

        {model ? (
          <section className={styles.configCard} aria-live="polite">
            {hasTree && model.tree && useTrainingModal ? (
              <div className={styles.miniMap}>
                <TreeThumbnail
                  root={model.tree}
                  labels={uniqueValues(lab.rows, model.labelColumn)}
                  className={styles.miniMapSvg}
                />
                {canReplay ? (
                  <div className={styles.miniMapReplay}>
                    <Button
                      size="extraSmall"
                      variant="outlined"
                      color="secondary"
                      iconOnly
                      startIconName="play"
                      aria-label="Replay training"
                      onClick={() => setTrainingOpen(true)}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className={styles.metricRow}>
              <div className={`${styles.metric} ${styles.metricDivider}`}>
                <span className={styles.metricValue}>{accuracy}%</span>
                <span className={styles.metricLabel}>Accuracy</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricValue}>
                  {correct}/{model.holdoutResults.length}
                </span>
                <span className={styles.metricLabel}>Number correct</span>
              </div>
            </div>
            {showResultsFooter ? (
              <div className={styles.cardFooter}>
                <div className={styles.footerActions}>
                  <ModelActions lab={lab} onOpen={onOpenModel} size="small" />
                  {lab.config.hideTestTab ? null : (
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      endIconName="arrow-right"
                      disabled={!canTest}
                      onClick={() => lab.setSection("test")}
                    >
                      Test model
                    </Button>
                  )}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
      {useTrainingModal ? (
        <TrainingModal
          lab={lab}
          open={trainingOpen}
          onClose={() => setTrainingOpen(false)}
          onTest={() => {
            setTrainingOpen(false);
            lab.setSection("test");
          }}
        />
      ) : null}
    </aside>
  );
}

/* Shows the dataset one row at a time on a stack of cards, with a pager to
 * step through the rows. Cards behind the current one are blank and peek out
 * above it. */
const DECK_PEEK = 2;

function DataCards({ lab }: { lab: AiLabController }) {
  const rows = lab.rows;
  const filteredIndexes = lab.filteredRowIndexes;
  const total = filteredIndexes.length;
  const rowIndex = Math.min(Math.max(0, lab.cardIndex), Math.max(0, total - 1));

  // Render the previous card so it can animate away, and one card past the
  // peeking ones so it can fade in.
  const windowStart = Math.max(0, rowIndex - 1);
  const windowEnd = Math.min(total, rowIndex + DECK_PEEK + 2);

  const goToRow = (index: number) => {
    lab.setCardIndex(Math.min(Math.max(index, 0), Math.max(0, total - 1)));
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const targetRow = {
      ArrowRight: rowIndex + 1,
      ArrowDown: rowIndex + 1,
      ArrowLeft: rowIndex - 1,
      ArrowUp: rowIndex - 1,
      Home: 0,
      End: total - 1,
    }[event.key];
    if (targetRow !== undefined) {
      event.preventDefault();
      goToRow(targetRow);
    }
  };

  return (
    <div
      className={styles.cardsView}
      role="region"
      aria-roledescription="carousel"
      aria-label="Dataset rows"
    >
      <div className={styles.carouselStage}>
        {total === 0 && lab.columnFilter ? (
          <div className={styles.emptyFilterStage}>
            <p className={styles.emptyFilterText}>No cards match this filter.</p>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              onClick={() => lab.clearColumnFilter()}
            >
              Clear filter
            </Button>
          </div>
        ) : total > 0 ? (
          <div className={styles.deck}>
            {filteredIndexes
              .slice(windowStart, windowEnd)
              .map((datasetRow, offset) => {
                const slotIndex = windowStart + offset;
                const depth = slotIndex - rowIndex;
                const row = rows[datasetRow];
                if (!row) return null;
                return (
                  <div
                    key={datasetRow}
                    className={[
                      styles.deckSlot,
                      depth < 0 ? styles.deckSlotDealt : "",
                      depth > DECK_PEEK ? styles.deckSlotWaiting : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={
                      { "--deck-depth": Math.max(0, depth) } as CSSProperties
                    }
                    aria-hidden={depth === 0 ? undefined : true}
                  >
                    {depth > 0 ? (
                      <div className={styles.deckGhost} />
                    ) : (
                      <DatasetRowCard
                        isCurrent={depth === 0}
                        rowNumber={datasetRow + 1}
                        row={row}
                        columns={lab.config.dataset.columns}
                        labelColumnId={lab.labelColumn}
                        featureColumnIds={lab.selectedFeatures}
                        titleColumnId={lab.config.cardTitleColumn}
                      />
                    )}
                  </div>
                );
              })}
          </div>
        ) : null}
      </div>
      <nav className={styles.pager} aria-label="Card navigation">
        <PagerButton
          label="Previous row"
          icon="chevron-left"
          disabled={total === 0 || rowIndex === 0}
          onClick={() => goToRow(rowIndex - 1)}
          onKeyDown={onKeyDown}
        />
        <span className={styles.pagerCounter} aria-live="polite">
          {`${lab.columnFilter ? "Card" : "Row"} ${total === 0 ? 0 : rowIndex + 1} of ${total}`}
        </span>
        <PagerButton
          label="Next row"
          icon="chevron-right"
          disabled={total === 0 || rowIndex === total - 1}
          onClick={() => goToRow(rowIndex + 1)}
          onKeyDown={onKeyDown}
        />
      </nav>
    </div>
  );
}

function PagerButton({
  label,
  icon,
  disabled,
  onClick,
  onKeyDown,
}: {
  label: string;
  icon: "chevron-left" | "chevron-right";
  disabled: boolean;
  onClick: () => void;
  onKeyDown: (event: KeyboardEvent) => void;
}) {
  return (
    <Button
      size="small"
      variant="outlined"
      color="secondary"
      iconOnly
      startIconName={icon}
      aria-label={label}
      aria-disabled={disabled}
      className={disabled ? "Mui-disabled" : undefined}
      onClick={disabled ? undefined : onClick}
      onKeyDown={onKeyDown}
    />
  );
}

const DatasetRowCard = memo(function DatasetRowCard({
  isCurrent,
  rowNumber,
  row,
  columns,
  labelColumnId,
  featureColumnIds,
  titleColumnId,
}: {
  isCurrent: boolean;
  rowNumber: number;
  row: AiLabDataRow;
  columns: AiLabColumn[];
  labelColumnId?: string;
  featureColumnIds?: string[];
  titleColumnId?: string;
}) {
  const titleId = useId();
  const detailsRef = useRef<HTMLDListElement>(null);
  const rawTitle = titleColumnId ? row[titleColumnId] : undefined;
  const titleValue =
    typeof rawTitle === "string" || typeof rawTitle === "number"
      ? formatCell(rawTitle).trim()
      : "";
  const heading = titleValue || `Row ${rowNumber}`;

  // Coming back to a row would otherwise keep where its list was scrolled.
  useEffect(() => {
    if (isCurrent && detailsRef.current) {
      detailsRef.current.scrollTop = 0;
    }
  }, [isCurrent]);

  // Fade the list's top and bottom edges while there is more to scroll to,
  // and keep the fades clear of the scrollbar.
  useEffect(() => {
    const el = detailsRef.current;
    const list = el?.parentElement;
    if (!el || !list) {
      return;
    }
    const update = () => {
      // Written to the DOM rather than state, so scrolling doesn't re-render.
      const scrollbar = el.offsetWidth - el.clientWidth;
      list.style.setProperty("--scrollbar-width", `${scrollbar}px`);
      // Allow 1px for subpixel scroll positions.
      list.toggleAttribute("data-fade-top", el.scrollTop > 1);
      list.toggleAttribute(
        "data-fade-bottom",
        el.scrollHeight - el.scrollTop - el.clientHeight > 1,
      );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    el.addEventListener("scroll", update);
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", update);
    };
  }, []);

  return (
    <div
      className={styles.card}
      role="group"
      aria-labelledby={titleId}
      aria-roledescription="slide"
    >
      <h3 id={titleId} className={styles.cardTitle}>
        {heading}
      </h3>
      <div className={styles.cardList}>
        <dl
          ref={detailsRef}
          className={styles.cardDetails}
          tabIndex={isCurrent ? 0 : -1}
        >
          {columns.map((column) => {
            if (column.id === titleColumnId) return null;
            const value = formatCell(row[column.id]);
            const role =
              labelColumnId === column.id
                ? "label"
                : featureColumnIds?.includes(column.id)
                  ? "feature"
                  : undefined;
            return (
              <div key={column.id} className={styles.cardRow}>
                <dt className={styles.cardLabel} data-role={role}>
                  {column.name}
                  {role ? (
                    <span className={styles.visuallyHidden}>
                      {role === "label"
                        ? ", used as the label"
                        : ", used as a feature"}
                    </span>
                  ) : null}
                </dt>
                <dd className={styles.cardValue}>{value}</dd>
              </div>
            );
          })}
        </dl>
      </div>
    </div>
  );
});

function columnStatCards(
  column: AiLabColumn,
  freq: { value: string; count: number }[],
  rowCount: number,
  numeric: ReturnType<typeof numericalStats> | null,
): { label: string; value: string }[] {
  const typeCard = {
    label: "Type",
    value: column.type === "categorical" ? "Categorical" : "Numerical",
  };

  if (column.type === "numerical" && numeric) {
    return [
      typeCard,
      { label: "Minimum", value: formatNumber(numeric.min) },
      { label: "Maximum", value: formatNumber(numeric.max) },
      { label: "Range", value: formatNumber(numeric.range) },
    ];
  }

  const categoryCount = freq.length;
  const allUnique =
    categoryCount > 0 &&
    categoryCount === rowCount &&
    freq.every((entry) => entry.count === 1);

  if (allUnique || categoryCount === 1) {
    return [typeCard, { label: "Values", value: String(categoryCount) }];
  }

  return [
    typeCard,
    { label: "Values", value: String(categoryCount) },
    { label: "Most Common", value: freq[0]?.value ?? "—" },
    {
      label: "Least Common",
      value: freq[categoryCount - 1]?.value ?? "—",
    },
  ];
}

/** Categorical distributions only draw when every value fits on its own bar. */
const CATEGORY_CHART_MAX = 5;

function ColumnAnalysis({
  lab,
  column,
  rows,
  onClose,
}: {
  lab: AiLabController;
  column: AiLabColumn;
  rows: AiLabDataRow[];
  onClose: () => void;
}) {
  const categorical = column.type === "categorical";
  const freq = categorical ? frequencies(rows, column.id) : [];
  const numeric = categorical ? null : numericalStats(rows, column.id);
  const categoryCount = freq.length;
  const chartCategories =
    categorical && categoryCount > 0 && categoryCount <= CATEGORY_CHART_MAX;
  const tooManyCategories = categorical && categoryCount > CATEGORY_CHART_MAX;
  const blockedCategory = categorical && categoryCount > MAX_CATEGORY_VALUES;
  // Categorical charts list every value (five or fewer). Numerical columns
  // keep a histogram even though the mocks leave that pane empty.
  const distribution: { label: string; count: number; isOther?: boolean }[] =
    chartCategories
      ? freq.map((entry) => ({ label: entry.value, count: entry.count }))
      : !categorical && numeric
        ? histogramBins(numeric.values, 5)
        : [];
  const distributionSummary = distribution
    .map((entry) => `${entry.label} ${entry.count}`)
    .join(", ");

  const stats = columnStatCards(column, freq, rows.length, numeric);
  const compactStats = stats.length <= 2;
  const showScale = Boolean(lab.config.allowScaleColumns && numeric);
  const showChart = !showScale && distribution.length > 0;
  const showEmpty = !showScale && tooManyCategories;

  return (
    <section
      className={styles.analysisDock}
      aria-labelledby="ai-lab-analysis-title"
    >
      <PanelHeader
        label="COLUMN ANALYSIS"
        borderTop
        className={styles.analysisHeader}
        right={
          <Button
            size="extraSmall"
            variant="text"
            color="tertiary"
            iconOnly
            startIconName="xmark"
            aria-label="Close column analysis"
            onClick={onClose}
          />
        }
      />
      <div className={styles.analysisBody}>
        <div className={styles.analysisSummary}>
          <div className={styles.analysisIntro}>
            <h3 id="ai-lab-analysis-title" className={styles.analysisTitle}>
              {column.name}
            </h3>
            {column.description ? (
              <p className={styles.analysisCopy}>{column.description}</p>
            ) : null}
          </div>
          <dl
            className={`${styles.statCards} ${
              compactStats ? styles.statCardsCompact : ""
            }`}
          >
            {stats.map((stat) => (
              <div key={stat.label} className={styles.statCard}>
                <dt>{stat.label}</dt>
                <dd title={stat.value}>{stat.value}</dd>
              </div>
            ))}
          </dl>
          {blockedCategory ? (
            <div className={styles.analysisAlert}>
              <Alert sentiment="warning" size="extraSmall">
                {`Categorical columns with more than ${MAX_CATEGORY_VALUES} unique values cannot be selected as the label or a feature.`}
              </Alert>
            </div>
          ) : null}
        </div>
        {showChart || showEmpty ? (
          <div className={styles.analysisDistribution}>
            {showChart ? (
              <>
                <p className={styles.distributionLabel}>Distribution</p>
                <ColumnDistributionChart
                  data={distribution}
                  labelOrder={
                    categorical ? uniqueValues(rows, column.id) : undefined
                  }
                  ariaLabel={`Distribution: ${distributionSummary}`}
                />
              </>
            ) : (
              <div className={styles.distributionEmpty}>
                <span className={styles.distributionEmptyIcon} aria-hidden>
                  <FaIcon name="chart-simple" family="solid" size="s" />
                </span>
                <p className={styles.distributionEmptyTitle}>Too many values</p>
                <p className={styles.distributionEmptyCopy}>
                  {`A graph is shown when there are ${CATEGORY_CHART_MAX} or fewer values.`}
                </p>
              </div>
            )}
          </div>
        ) : null}
      </div>
      {showScale && numeric ? (
        <ScaleGroupEditor
          column={column}
          rows={rows}
          min={numeric.min}
          max={numeric.max}
          existing={lab.scales.find((scale) => scale.sourceColumnId === column.id)}
          onSave={lab.saveScale}
          onRemove={lab.removeScale}
        />
      ) : null}
    </section>
  );
}
