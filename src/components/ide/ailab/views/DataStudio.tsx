import {
  memo,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  Button,
  Dropdown,
  SegmentedButton,
  TablePagination,
  Tooltip,
} from "@moshebari/cads-react";
import type { AiLabController } from "../../../../hooks/useAiLabState";
import { useChecklistMenuWidth } from "../../../../hooks/useChecklistMenuWidth";
import {
  capDistribution,
  formatCell,
  formatNumber,
  frequencies,
  histogramBins,
  numericalStats,
  uniqueValues,
} from "../../../../lib/aiLab";
import type { AiLabColumn, AiLabDataRow } from "../../../../types/aiLab";
import { PanelHeader } from "../../../ui/PanelHeader";
import { ColumnDistributionChart } from "./ColumnDistributionChart";
import { DataSpreadsheet } from "./DataSpreadsheet";
import { ModelActions } from "./ModelActions";
import type { ModelInspectorTab } from "./ModelInspector";
import styles from "./DataStudio.module.scss";

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
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
  const showAnalysis =
    !lab.needsDataset && lab.dataView === "table" && Boolean(selected);
  const showTrain = !lab.config.hideTrainTab && !lab.needsDataset;

  return (
    <section
      className={`${styles.root} ${showAnalysis ? styles.rootWithAnalysis : ""}`}
    >
      <div className={styles.stage}>
        <div className={styles.sheetColumn}>
          <DataHeader lab={lab} onOpenSetup={onOpenSetup} />
          {lab.needsDataset ? (
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
}: {
  lab: AiLabController;
  onOpenSetup?: () => void;
}) {
  const canSwap = lab.canPickDataset && Boolean(onOpenSetup);
  const datasetLabel = lab.needsDataset
    ? "Choose dataset"
    : lab.config.dataset.name;

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
          <span className={styles.setMeta}>{lab.rows.length} rows</span>
        )}
      </div>
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
        {lab.dataView === "cards" ? (
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
  const featuresMenu = useChecklistMenuWidth();
  const columns = lab.config.dataset.columns;
  const labelOptions = columns
    .filter((column) =>
      lab.config.classificationOnly ? column.type === "categorical" : true,
    )
    .map((column) => ({ value: column.id, label: column.name }));
  const excludedFeatures = new Set(lab.config.excludedFeatureColumns ?? []);
  const featureOptions = columns
    .filter((column) => column.id !== lab.labelColumn)
    .filter((column) => !excludedFeatures.has(column.id))
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

  const runTrain = () => {
    if (!lab.canTrain || isTraining) return;
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
      disabled={!lab.canTrain || isTraining}
      onClick={runTrain}
    >
      {isTraining ? "Training…" : model ? "Rerun training" : "Train model"}
    </Button>
  );

  return (
    <aside className={styles.trainRail} aria-label="Train">
      <PanelHeader label="TRAIN" />
      <div className={styles.railBody}>
        <section className={styles.configCard}>
          <div className={styles.cardFields}>
            {lab.config.hideLabelSelect ? null : (
              <Dropdown
                role="input"
                size="small"
                color="secondary"
                width="full"
                menuWidth="100%"
                label="Predict:"
                labelStyle="thick"
                helperText={
                  lab.labelCardinality?.text ??
                  "The answer your model guesses"
                }
                sentiment={lab.labelCardinality?.sentiment ?? "default"}
                placeholder="Choose a column"
                value={lab.labelColumn ?? ""}
                options={labelOptions}
                disabled={Boolean(lab.config.lockLabelColumn)}
                onChange={(value) => lab.setLabelColumn(String(value))}
                aria-label="Column to predict"
              />
            )}
            <div ref={featuresMenu.ref}>
              <Dropdown
                role="input"
                menuType="checklist"
                size="small"
                color="secondary"
                width="full"
                label="Using:"
                labelStyle="thick"
                helperText={
                  lab.featureCardinality?.text ??
                  "The info it uses to guess"
                }
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
            {/* KNN's k is not a student control. Studio searches k on a
                10% holdout (AI Lab / ml-knn). Guided levels may lock k. */}
          </div>
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
        </section>

        {model ? (
          <section className={styles.configCard} aria-live="polite">
            <div className={styles.metricRow}>
              <div className={`${styles.metric} ${styles.metricDivider}`}>
                <span className={styles.metricLabel}>Accuracy</span>
                <span
                  className={`${styles.metricValue} ${styles.metricValueSuccess}`}
                >
                  {accuracy}%
                </span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Number correct</span>
                <span className={styles.metricValue}>
                  {correct}/{model.holdoutResults.length}
                </span>
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
    </aside>
  );
}

function DataCards({ lab }: { lab: AiLabController }) {
  return (
    <div className={styles.cardsView}>
      {lab.cardLayout === "carousel" ? (
        <CardCarousel lab={lab} />
      ) : (
        <CardCatalog lab={lab} />
      )}
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
                  <RowCard
                    index={rowIndex}
                    row={row}
                    columns={lab.config.dataset.columns}
                    featured
                  />
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
  featured = false,
}: {
  index: number;
  row: AiLabDataRow;
  columns: AiLabColumn[];
  featured?: boolean;
}) {
  return (
    <article
      className={`${styles.card} ${featured ? styles.cardFeatured : ""}`}
      aria-label={`Row ${index + 1}`}
    >
      <p className={styles.cardHeading}>Row {index + 1}</p>
      <dl className={styles.cardBody}>
        {columns.map((column) => {
          const value = formatCell(row[column.id]);
          return (
            <div key={column.id} className={styles.cardRow}>
              <dt className={styles.cardLabel}>{column.name}</dt>
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
      { label: "Median", value: formatNumber(numeric.median) },
    ];
  }

  const categoryCount = freq.length;
  const allUnique =
    categoryCount > 0 &&
    categoryCount === rowCount &&
    freq.every((entry) => entry.count === 1);

  if (allUnique || categoryCount === 1) {
    return [typeCard, { label: "Categories", value: String(categoryCount) }];
  }

  return [
    typeCard,
    { label: "Categories", value: String(categoryCount) },
    { label: "Most common", value: freq[0]?.value ?? "—" },
    {
      label: "Least common",
      value: freq[categoryCount - 1]?.value ?? "—",
    },
  ];
}

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
  // Both branches stay within five rows: categories show the top four plus
  // an "Other" bucket, and the histogram flexes its bin width to fit.
  const distribution: { label: string; count: number; isOther?: boolean }[] =
    categorical
      ? capDistribution(
          freq.map((entry) => ({ label: entry.value, count: entry.count })),
          4,
        )
      : numeric
        ? histogramBins(numeric.values, 5)
        : [];
  const distributionSummary = distribution
    .map((entry) => `${entry.label} ${entry.count}`)
    .join(", ");

  const stats = columnStatCards(column, freq, rows.length, numeric);
  const compactStats = stats.length <= 2;

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
                <dd>{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className={styles.analysisDistribution}>
          <p className={styles.distributionLabel}>Distribution</p>
          <ColumnDistributionChart
            data={distribution}
            labelOrder={
              categorical ? uniqueValues(rows, column.id) : undefined
            }
            ariaLabel={`Distribution: ${distributionSummary}`}
          />
        </div>
      </div>
    </section>
  );
}
