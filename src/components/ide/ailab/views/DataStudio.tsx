import {
  memo,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import {
  Button,
  Dropdown,
  SegmentedButton,
  Tag,
  Tooltip,
} from "@moshebari/cads-react";
import type { AiLabController } from "../../../../hooks/useAiLabState";
import { useChecklistMenuWidth } from "../../../../hooks/useChecklistMenuWidth";
import { useVirtualRange } from "../../../../hooks/useVirtualRange";
import {
  capDistribution,
  formatCell,
  formatNumber,
  frequencies,
  histogramBins,
  numericalStats,
} from "../../../../lib/aiLab";
import type { AiLabColumn, AiLabDataRow } from "../../../../types/aiLab";
import { PanelHeader } from "../../../ui/PanelHeader";
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
    <section className={styles.root}>
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
            <DataCards lab={lab} />
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
        <Button
          variant="outlined"
          color="secondary"
          size="extraSmall"
          className={styles.datasetChip}
          endIconName={canSwap ? "right-left" : undefined}
          disabled={!canSwap}
          aria-haspopup={canSwap ? "dialog" : undefined}
          onClick={canSwap ? onOpenSetup : undefined}
        >
          {datasetLabel}
        </Button>
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
          iconOnly
          aria-label="Dataset view"
          value={lab.dataView}
          onChange={(value) => lab.setDataView(value as "table" | "cards")}
          options={[
            { value: "table", label: "Table", iconName: "list", tooltip: "Table" },
            {
              value: "cards",
              label: "Cards",
              iconName: "cards-blank",
              tooltip: "Cards",
            },
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
  const featureOptions = columns
    .filter((column) => column.id !== lab.labelColumn)
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
  if (lab.cardLayout === "carousel") {
    return <CardCarousel lab={lab} />;
  }
  return <CardCatalog lab={lab} />;
}

/** Must match `.cardStage` padding and `.cardGrid` gap / min column width. */
const CARD_STAGE_PADDING = 16;
const CARD_GAP = 12;
const CARD_MIN_WIDTH = 220;

/**
 * Windowed card grid. Cards in one dataset share a height (same columns), so
 * the grid is virtualized by *card row*: measure one card, count how many fit
 * per row at the current width, and only mount the rows in view.
 */
function CardCatalog({ lab }: { lab: AiLabController }) {
  const columns = lab.config.dataset.columns;
  const rows = lab.rows;
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [gridWidth, setGridWidth] = useState(0);
  // Rough guess until the rendered grid reports its row pitch.
  const [cardHeight, setCardHeight] = useState(48 + columns.length * 24);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      setGridWidth(element.clientWidth - CARD_STAGE_PADDING * 2);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const perRow = Math.max(
    1,
    Math.floor((gridWidth + CARD_GAP) / (CARD_MIN_WIDTH + CARD_GAP)),
  );
  const cardRowCount = Math.ceil(rows.length / perRow);
  const { start, end, topPad, bottomPad } = useVirtualRange({
    scrollRef,
    itemCount: cardRowCount,
    itemSize: cardHeight + CARD_GAP,
    leadingOffset: CARD_STAGE_PADDING,
    overscan: 2,
  });

  // Derive the row pitch from the rendered grid (grid rows stretch to their
  // tallest card), so the estimate self-corrects after the first paint.
  const renderedRows = end - start;
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || renderedRows === 0) return;
    const measure = () => {
      const height = grid.getBoundingClientRect().height;
      const pitch = (height - (renderedRows - 1) * CARD_GAP) / renderedRows;
      if (pitch > 0) {
        setCardHeight((current) =>
          Math.abs(current - pitch) < 0.5 ? current : pitch,
        );
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(grid);
    return () => observer.disconnect();
  }, [renderedRows]);

  const firstIndex = start * perRow;
  const lastIndex = Math.min(rows.length, end * perRow);
  const cards: ReactElement[] = [];
  for (let index = firstIndex; index < lastIndex; index += 1) {
    cards.push(
      <RowCard
        key={index}
        index={index}
        row={rows[index]}
        columns={columns}
        selectedColumnId={lab.selectedColumnId}
        onSelectColumn={lab.selectColumn}
      />,
    );
  }

  return (
    <div ref={scrollRef} className={styles.cardStage}>
      <div className={styles.cardStack}>
        {topPad > 0 ? <div aria-hidden style={{ height: topPad }} /> : null}
        <div ref={gridRef} className={styles.cardGrid}>
          {cards}
        </div>
        {bottomPad > 0 ? <div aria-hidden style={{ height: bottomPad }} /> : null}
      </div>
    </div>
  );
}

function CardCarousel({ lab }: { lab: AiLabController }) {
  const index = Math.min(
    Math.max(0, lab.cardIndex),
    Math.max(0, lab.rows.length - 1),
  );
  const row = lab.rows[index];

  return (
    <div className={styles.cardStage}>
      <div className={styles.carousel}>
        <div className={styles.cardNav}>
          <Button
            size="small"
            variant="outlined"
            color="secondary"
            startIconName="chevron-left"
            disabled={index === 0}
            onClick={() => lab.setCardIndex(index - 1)}
          >
            Previous
          </Button>
          <span className={styles.setMeta}>
            Row {index + 1} of {lab.rows.length}
          </span>
          <Button
            size="small"
            variant="outlined"
            color="secondary"
            endIconName="chevron-right"
            disabled={index >= lab.rows.length - 1}
            onClick={() => lab.setCardIndex(index + 1)}
          >
            Next
          </Button>
        </div>
        {row ? (
          <RowCard
            index={index}
            row={row}
            columns={lab.config.dataset.columns}
            selectedColumnId={lab.selectedColumnId}
            onSelectColumn={lab.selectColumn}
            featured
          />
        ) : null}
      </div>
    </div>
  );
}

const RowCard = memo(function RowCard({
  index,
  row,
  columns,
  selectedColumnId,
  onSelectColumn,
  featured = false,
}: {
  index: number;
  row: AiLabDataRow;
  columns: AiLabColumn[];
  selectedColumnId: string | undefined;
  onSelectColumn: (columnId: string) => void;
  featured?: boolean;
}) {
  return (
    <article
      className={`${styles.card} ${featured ? styles.cardFeatured : ""}`}
      aria-label={`Row ${index + 1}`}
    >
      <p className={styles.cardHeading}>Row {index + 1}</p>
      {columns.map((column) => (
        <div key={column.id} className={styles.cardRow}>
          <button
            type="button"
            className={`${styles.cardLabel} ${
              selectedColumnId === column.id ? styles.cardLabelActive : ""
            }`}
            onClick={() => onSelectColumn(column.id)}
          >
            {column.name}
          </button>
          <span className={styles.cardValue} title={formatCell(row[column.id])}>
            {formatCell(row[column.id])}
          </span>
        </div>
      ))}
    </article>
  );
});

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
  const maxCount = distribution.reduce(
    (max, entry) => Math.max(max, entry.count),
    1,
  );
  const mostCommon = freq[0];
  const leastCommon = freq[freq.length - 1];

  const stats: { label: string; value: string }[] = categorical
    ? [
        { label: "Categories", value: String(freq.length) },
        { label: "Most common", value: mostCommon?.value ?? "—" },
        { label: "Least common", value: leastCommon?.value ?? "—" },
        { label: "Rows", value: String(rows.length) },
      ]
    : [
        { label: "Minimum", value: formatNumber(numeric?.min ?? 0) },
        { label: "Maximum", value: formatNumber(numeric?.max ?? 0) },
        { label: "Median", value: formatNumber(numeric?.median ?? 0) },
        { label: "Range", value: formatNumber(numeric?.range ?? 0) },
      ];

  return (
    <section
      className={styles.analysisDock}
      aria-labelledby="ai-lab-analysis-title"
    >
      <PanelHeader
        label="CATEGORY ANALYSIS"
        borderTop
        className={styles.analysisHeader}
        left={
          <Dropdown
            role="input"
            size="extraSmall"
            color="secondary"
            aria-label="Column to analyze"
            value={column.id}
            options={lab.config.dataset.columns.map((entry) => ({
              value: entry.id,
              label: entry.name,
            }))}
            onChange={(value) => lab.setSelectedColumnId(String(value))}
          />
        }
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
            <div className={styles.analysisTitleRow}>
              <h3 id="ai-lab-analysis-title" className={styles.analysisTitle}>
                {column.name}
              </h3>
              <Tag
                color="brand"
                size="small"
                label={categorical ? "Categorical" : "Numerical"}
                startIconName={categorical ? "input-text" : "input-numeric"}
              />
            </div>
            <p className={styles.analysisCopy}>{column.description}</p>
          </div>
          <dl className={styles.statCards}>
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
          <ul className={styles.statList}>
            {distribution.map((entry) => (
              <li
                key={entry.label}
                className={`${styles.barRow} ${
                  entry.isOther ? styles.barRowOther : ""
                }`}
              >
                <span className={styles.statLabel}>{entry.label}</span>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${(entry.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className={styles.statCount}>{entry.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
