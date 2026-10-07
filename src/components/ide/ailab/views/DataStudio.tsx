import {
  memo,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  Alert,
  Button,
  Dropdown,
  IconTooltip,
  SegmentedButton,
  TablePagination,
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
import type { AiLabColumn, AiLabDataRow } from "../../../../types/aiLab";
import { PanelHeader } from "../../../ui/PanelHeader";
import { ColumnDistributionChart } from "./ColumnDistributionChart";
import { DataSpreadsheet } from "./DataSpreadsheet";
import { ModelActions } from "./ModelActions";
import type { ModelInspectorTab } from "./ModelInspector";
import { ScaleGroupEditor } from "./ScaleGroupEditor";
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
  onOpenSetup?: () => void;
}

export function DataStudio({ lab, onOpenModel, onOpenSetup }: DataStudioProps) {
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
          <DataHeader lab={lab} onOpenSetup={onOpenSetup} inIntro={inIntro} />
          {inIntro ? (
            <IntroActivity lab={lab} />
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
        {showTrain ? <TrainRail lab={lab} onOpenModel={onOpenModel} /> : null}
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

function DataHeader({
  lab,
  onOpenSetup,
  inIntro = false,
}: {
  lab: AiLabController;
  onOpenSetup?: () => void;
  inIntro?: boolean;
}) {
  const canSwap = lab.canPickDataset && Boolean(onOpenSetup);
  const datasetLabel = lab.needsDataset
    ? "Choose dataset"
    : lab.config.dataset.name;
  const [storyOpen, setStoryOpen] = useState(false);

  return (
    <div className={styles.dataHeader}>
      <div className={styles.setName}>
        {canSwap ? (
          <Button
            variant="outlined"
            color="secondary"
            size="extraSmall"
            className={styles.datasetChip}
            endIconName="right-left"
            aria-haspopup="dialog"
            onClick={onOpenSetup}
          >
            {datasetLabel}
          </Button>
        ) : (
          <span className={styles.datasetName}>{datasetLabel}</span>
        )}
        {lab.needsDataset ? null : (
          <>
            <span className={styles.setMeta}>{lab.rows.length} rows</span>
            <Tooltip title="About this data" placement="bottom">
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
        {lab.dataView === "cards" && !lab.config.hideCardLayoutToggle ? (
          <SegmentedButton
            size="extraSmall"
            aria-label="Cards layout"
            value={lab.cardLayout}
            onChange={(value) =>
              lab.setCardLayout(value as "catalog" | "carousel")
            }
            options={[
              { value: "catalog", label: "Catalog" },
              { value: "carousel", label: "Carousel" },
            ]}
          />
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

function TrainRail({
  lab,
  onOpenModel,
}: {
  lab: AiLabController;
  onOpenModel?: (tab: ModelInspectorTab) => void;
}) {
  const [isTraining, setIsTraining] = useState(false);
  const labelMenu = useChecklistMenuWidth();
  const featuresMenu = useChecklistMenuWidth();
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
    const nextFeatures = lab.selectedFeatures.filter(
      (id) => id !== lab.labelColumn && usable(id),
    );
    if (nextFeatures.length !== lab.selectedFeatures.length) {
      lab.setFeatures(nextFeatures);
    }
  }, [lab, columns]);
  const labelOptions = columns
    .filter((column) =>
      lab.config.classificationOnly ? column.type === "categorical" : true,
    )
    .filter((column) => usable(column.id))
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
      <PanelHeader label="TRAIN" />
      <div className={styles.railBody}>
        <section className={styles.configCard}>
          <div className={styles.cardFields}>
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
                  onChange={(value) => lab.setFeatures(asStringArray(value))}
                  onOpenChange={featuresMenu.onOpenChange}
                  aria-label="Feature columns"
                />
              </div>
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

function DataCards({ lab }: { lab: AiLabController }) {
  const useCarousel =
    lab.config.hideCardLayoutToggle || lab.cardLayout === "carousel";
  return (
    <div className={styles.cardsView}>
      {useCarousel ? <CardCarousel lab={lab} /> : <CardCatalog lab={lab} />}
    </div>
  );
}

/** Must match `.cardStage` padding and `.cardGrid` gap / min column width. */
const CARD_STAGE_PADDING = 8;
const CARD_GAP = 8;
const CARD_MIN_WIDTH = 220;
/**
 * Page sizes are multiples of 12 and the grid only ever uses a column count
 * that divides 12, so every page ends on a complete row at any width.
 */
const CARD_PAGE_SIZES = [12, 24, 48, 96, 192];
const CARD_DEFAULT_PAGE_SIZE = 24;
const CARD_COLUMN_COUNTS = [1, 2, 3, 4, 6, 12];

function snapColumnCount(fit: number) {
  let best = 1;
  for (const count of CARD_COLUMN_COUNTS) {
    if (count <= fit) best = count;
  }
  return best;
}

/**
 * Paginated card grid: 24 cards per page by default with a rows-per-page
 * dropdown in the sticky footer. The column count snaps to a divisor of 12
 * (see `CARD_COLUMN_COUNTS`) so no page ends on a ragged row. Datasets that
 * fit the smallest page size drop the dropdown for the compact pager.
 */
function CardCatalog({ lab }: { lab: AiLabController }) {
  const columns = lab.config.dataset.columns;
  const rows = lab.rows;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [gridWidth, setGridWidth] = useState(0);
  const [pageSize, setPageSize] = useState(CARD_DEFAULT_PAGE_SIZE);
  const [page, setPage] = useState(0);
  const compact = rows.length <= CARD_PAGE_SIZES[0];

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      setGridWidth(element.clientWidth - CARD_STAGE_PADDING * 2);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const fit = Math.max(
    1,
    Math.floor((gridWidth + CARD_GAP) / (CARD_MIN_WIDTH + CARD_GAP)),
  );
  const perRow = snapColumnCount(fit);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const firstIndex = currentPage * pageSize;
  const lastIndex = Math.min(rows.length, firstIndex + pageSize);

  const goToPage = (next: number) => {
    setPage(Math.min(Math.max(0, next), pageCount - 1));
    scrollRef.current?.scrollTo({ top: 0 });
  };

  return (
    <>
      <div ref={scrollRef} className={styles.cardStage}>
        <div
          className={styles.cardGrid}
          style={{ "--card-columns": perRow } as CSSProperties}
        >
          {rows.slice(firstIndex, lastIndex).map((row, offset) => (
            <RowCard
              key={firstIndex + offset}
              index={firstIndex + offset}
              row={row}
              columns={columns}
              labelColumnId={lab.labelColumn}
              featureColumnIds={lab.selectedFeatures}
              titleColumnId={lab.config.cardTitleColumn}
            />
          ))}
        </div>
      </div>
      <CardsFooter>
        {compact ? (
          <PagerNav
            label={`${rows.length === 0 ? 0 : firstIndex + 1}–${lastIndex} of ${rows.length}`}
            previousLabel="Go to previous page"
            nextLabel="Go to next page"
            canPrevious={currentPage > 0}
            canNext={currentPage < pageCount - 1}
            onPrevious={() => goToPage(currentPage - 1)}
            onNext={() => goToPage(currentPage + 1)}
          />
        ) : (
          <TablePagination
            size="small"
            aria-label="Card pages"
            count={rows.length}
            page={currentPage}
            rowsPerPage={pageSize}
            rowsPerPageOptions={CARD_PAGE_SIZES}
            labelRowsPerPage="Cards per page"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} of ${count}`
            }
            onPageChange={(_event, next) => goToPage(next)}
            onRowsPerPageChange={(event) => {
              const next = Number(event.target.value);
              if (!Number.isFinite(next) || next <= 0) return;
              // Keep the first visible card in view across the size change.
              setPageSize(next);
              setPage(Math.floor(firstIndex / next));
              scrollRef.current?.scrollTo({ top: 0 });
            }}
          />
        )}
      </CardsFooter>
    </>
  );
}

/** How many cards peek out behind the active one in the carousel deck. */
const DECK_PEEK = 2;
/**
 * Slots rendered around the active card: the previous card (dealt off toward
 * the viewer, so Previous can slide it back), the active card, `DECK_PEEK`
 * visible cards behind it, and one hidden on-deck card so a flip always has
 * a card to fade in at the back.
 */
const DECK_WINDOW_BEFORE = 1;
const DECK_WINDOW_AFTER = DECK_PEEK + 1;

/**
 * One row at a time, presented as the top card of a deck. Cards are keyed by
 * row index and positioned purely by their depth relative to the active
 * card, so a flip is one CSS transition across the whole stack: the top card
 * is dealt off, every card behind steps forward, and a new one fades in at
 * the back. The last row has nothing behind it, so it reads as the bottom of
 * the pile. Arrow keys flip when the stage has focus.
 */
function CardCarousel({ lab }: { lab: AiLabController }) {
  const rows = lab.rows;
  const total = rows.length;
  const index = Math.min(Math.max(0, lab.cardIndex), Math.max(0, total - 1));
  const canPrevious = index > 0;
  const canNext = index < total - 1;
  const windowStart = Math.max(0, index - DECK_WINDOW_BEFORE);
  const windowEnd = Math.min(total, index + DECK_WINDOW_AFTER + 1);

  const go = (next: number) => {
    lab.setCardIndex(Math.min(Math.max(0, next), Math.max(0, total - 1)));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      if (canNext) go(index + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      if (canPrevious) go(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      go(0);
    } else if (event.key === "End") {
      event.preventDefault();
      go(total - 1);
    }
  };

  return (
    <>
      <div
        className={styles.carouselStage}
        role="group"
        aria-roledescription="carousel"
        aria-label="Dataset rows, one card at a time"
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        {total > 0 ? (
          <div className={styles.deck}>
            {rows.slice(windowStart, windowEnd).map((row, offset) => {
              const rowIndex = windowStart + offset;
              const depth = rowIndex - index;
              return (
                <div
                  key={rowIndex}
                  className={`${styles.deckSlot} ${
                    depth < 0 ? styles.deckSlotDealt : ""
                  } ${depth > DECK_PEEK ? styles.deckSlotOnDeck : ""}`}
                  style={{ "--deck-depth": Math.max(0, depth) } as CSSProperties}
                  aria-hidden={depth !== 0}
                >
                  {depth > 0 ? (
                    <div className={styles.deckGhost} />
                  ) : (
                    <RowCard
                      index={rowIndex}
                      row={row}
                      columns={lab.config.dataset.columns}
                      labelColumnId={lab.labelColumn}
                      featureColumnIds={lab.selectedFeatures}
                      titleColumnId={lab.config.cardTitleColumn}
                      featured
                    />
                  )}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
      <CardsFooter>
        <PagerNav
          label={`Row ${total === 0 ? 0 : index + 1} of ${total}`}
          previousLabel="Previous row"
          nextLabel="Next row"
          canPrevious={canPrevious}
          canNext={canNext}
          onPrevious={() => go(index - 1)}
          onNext={() => go(index + 1)}
        />
      </CardsFooter>
    </>
  );
}

/**
 * Sticky bar under the cards stage; hosts whichever pager the layout needs.
 * Matches the resource panel's Continue bar height so the two footers align.
 */
function CardsFooter({ children }: { children: ReactNode }) {
  return <div className={styles.cardsFooter}>{children}</div>;
}

/**
 * Compact pager: prev / counter / next, the same cluster `TablePagination`
 * renders minus the rows-per-page dropdown. Used by the carousel and by the
 * catalog when the dataset fits on one page.
 */
function PagerNav({
  label,
  previousLabel,
  nextLabel,
  canPrevious,
  canNext,
  onPrevious,
  onNext,
}: {
  label: string;
  previousLabel: string;
  nextLabel: string;
  canPrevious: boolean;
  canNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <nav className={styles.pagerNav} aria-label="Card navigation">
      <Button
        size="small"
        variant="outlined"
        color="secondary"
        iconOnly
        startIconName="chevron-left"
        aria-label={previousLabel}
        disabled={!canPrevious}
        onClick={onPrevious}
      />
      <span className={styles.pagerCounter} aria-live="polite">
        {label}
      </span>
      <Button
        size="small"
        variant="outlined"
        color="secondary"
        iconOnly
        startIconName="chevron-right"
        aria-label={nextLabel}
        disabled={!canNext}
        onClick={onNext}
      />
    </nav>
  );
}

const RowCard = memo(function RowCard({
  index,
  row,
  columns,
  labelColumnId,
  featureColumnIds,
  titleColumnId,
  featured = false,
}: {
  index: number;
  row: AiLabDataRow;
  columns: AiLabColumn[];
  labelColumnId?: string;
  featureColumnIds?: string[];
  titleColumnId?: string;
  featured?: boolean;
}) {
  const titleValue = titleColumnId
    ? formatCell(row[titleColumnId])
    : undefined;
  const heading = titleValue || `Row ${index + 1}`;
  return (
    <article
      className={`${styles.card} ${featured ? styles.cardFeatured : ""}`}
      aria-label={`Row ${index + 1}${titleValue ? `, ${titleValue}` : ""}`}
    >
      <p className={styles.cardHeading}>{heading}</p>
      <dl className={styles.cardBody}>
        {columns.map((column) => {
          if (column.id === titleColumnId) return null;
          const value = formatCell(row[column.id]);
          const isLabel = labelColumnId === column.id;
          const isFeature = featureColumnIds?.includes(column.id);
          return (
            <div key={column.id} className={styles.cardRow}>
              <dt
                className={[
                  styles.cardLabel,
                  isLabel || isFeature ? styles.cardLabelRole : "",
                  isLabel ? styles.cardLabelLabel : "",
                  isFeature ? styles.cardLabelFeature : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {column.name}
                {isLabel || isFeature ? (
                  <span
                    className={`${styles.roleDot} ${
                      isLabel ? styles.roleDotLabel : styles.roleDotFeature
                    }`}
                    aria-hidden
                  />
                ) : null}
              </dt>
              <dd className={styles.cardValue} title={featured ? undefined : value}>
                {value}
              </dd>
            </div>
          );
        })}
      </dl>
    </article>
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
