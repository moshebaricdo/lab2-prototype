import { Button, SegmentedButton } from "@moshebari/cads-react";
import { ScrollArea } from "../../../ui/scroll-area";
import type { AiLabController } from "../../../../hooks/useAiLabState";
import {
  formatCell,
  frequencies,
  histogramBins,
  numericalStats,
} from "../../../../lib/aiLab";
import type { AiLabColumn, AiLabDataRow } from "../../../../types/aiLab";
import { DataStudio } from "./DataStudio";
import type { ModelInspectorTab } from "./ModelInspector";
import styles from "./AiLabGuidedWorkspace.module.scss";

interface GuidedDatasetPanelProps {
  lab: AiLabController;
  showRoles?: boolean;
}

export function GuidedDatasetPanel({
  lab,
  showRoles = false,
}: GuidedDatasetPanelProps) {
  const { dataset } = lab.config;
  const selected = dataset.columns.find(
    (column) => column.id === lab.selectedColumnId,
  );
  return (
    <div className={styles.split}>
      <div className={styles.mainColumn}>
        <div className={styles.sectionPad}>
          <div className={styles.toolbar}>
            <div className={styles.intro}>
              <p className={styles.introTitle}>{dataset.name}</p>
              <p className={styles.muted}>
                {dataset.rows.length} taco-truck orders.
              </p>
            </div>
            <div className={styles.viewSwitch}>
              {lab.config.trainAsOverlay && !lab.config.hideTrainTab ? (
                <Button
                  size="extraSmall"
                  variant={lab.trainingSetupOpen ? "contained" : "outlined"}
                  color={lab.trainingSetupOpen ? "primary" : "secondary"}
                  onClick={() =>
                    lab.setTrainingSetupOpen(!lab.trainingSetupOpen)
                  }
                >
                  {lab.trainingSetupOpen ? "Hide setup" : "Set up training"}
                </Button>
              ) : null}
              <SegmentedButton
                size="extraSmall"
                aria-label="Dataset view"
                value={lab.dataView}
                onChange={(value) => lab.setDataView(value as "table" | "cards")}
                options={[
                  { value: "table", label: "Table", iconName: "table" },
                  { value: "cards", label: "Cards", iconName: "id-card" },
                ]}
              />
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
            </div>
          </div>
        </div>
        <div className={styles.dataStage}>
          {lab.dataView === "table" ? (
            <div className={styles.tableFrame}>
              <ScrollArea className={styles.scroll}>
                <GuidedDataTable lab={lab} showRoles={showRoles} />
              </ScrollArea>
            </div>
          ) : (
            <ScrollArea className={styles.scroll}>
              {lab.cardLayout === "carousel" ? (
                <GuidedCardCarousel lab={lab} />
              ) : (
                <GuidedCardGrid lab={lab} />
              )}
            </ScrollArea>
          )}
        </div>
      </div>
      <aside className={styles.sideColumn}>
        <GuidedColumnInspector
          column={selected}
          rows={dataset.rows}
          onClear={() => {
            if (lab.selectedColumnId) lab.selectColumn(lab.selectedColumnId);
          }}
        />
      </aside>
    </div>
  );
}

export function GuidedDataTable({
  lab,
  showRoles = false,
}: GuidedDatasetPanelProps) {
  const { dataset } = lab.config;

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th className={`${styles.th} ${styles.thIndex}`}> </th>
          {dataset.columns.map((column) => {
            const isLabel = showRoles && lab.labelColumn === column.id;
            const isFeature = showRoles && lab.selectedFeatures.includes(column.id);
            const inspecting = lab.selectedColumnId === column.id;
            return (
              <th
                key={column.id}
                className={`${styles.th} ${isLabel ? styles.thLabel : ""} ${
                  isFeature ? styles.thFeature : ""
                }`}
              >
                <button
                  type="button"
                  className={`${styles.thButton} ${
                    inspecting ? styles.thButtonActive : ""
                  }`}
                  aria-pressed={inspecting}
                  onClick={() => lab.selectColumn(column.id)}
                >
                  {column.name}
                </button>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {dataset.rows.map((row, index) => (
          <tr key={index}>
            <td className={`${styles.td} ${styles.tdIndex}`}>
              <span className={styles.rowNumber}>{index + 1}</span>
            </td>
            {dataset.columns.map((column) => (
              <td key={column.id} className={styles.td}>
                {formatCell(row[column.id])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function GuidedCardGrid({ lab }: { lab: AiLabController }) {
  const { dataset } = lab.config;

  return (
    <div className={styles.cardGrid}>
      {dataset.rows.map((row, index) => (
        <OrderCard key={index} lab={lab} index={index} />
      ))}
    </div>
  );
}

function GuidedCardCarousel({ lab }: { lab: AiLabController }) {
  const { dataset } = lab.config;
  const index = Math.min(
    Math.max(0, lab.cardIndex),
    Math.max(0, dataset.rows.length - 1),
  );

  return (
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
        <span className={styles.muted}>
          Order {index + 1} of {dataset.rows.length}
        </span>
        <Button
          size="small"
          variant="outlined"
          color="secondary"
          endIconName="chevron-right"
          disabled={index >= dataset.rows.length - 1}
          onClick={() => lab.setCardIndex(index + 1)}
        >
          Next
        </Button>
      </div>
      {dataset.rows[index] ? (
        <OrderCard lab={lab} index={index} featured />
      ) : null}
    </div>
  );
}

function OrderCard({
  lab,
  index,
  featured = false,
}: {
  lab: AiLabController;
  index: number;
  featured?: boolean;
}) {
  const row = lab.config.dataset.rows[index];
  if (!row) return null;

  return (
    <article
      className={`${styles.card} ${featured ? styles.cardFeatured : ""}`}
      aria-label={`Order ${index + 1}`}
    >
      <div className={styles.cardTitle}>
        <p className={styles.cardHeading}>Order {index + 1}</p>
      </div>
      {lab.config.dataset.columns.map((column) => (
        <div key={column.id} className={styles.cardRow}>
          <button
            type="button"
            className={`${styles.cardLabel} ${
              lab.selectedColumnId === column.id ? styles.cardLabelActive : ""
            }`}
            onClick={() => lab.selectColumn(column.id)}
          >
            {column.name}
          </button>
          <span className={styles.cardValue}>{formatCell(row[column.id])}</span>
        </div>
      ))}
    </article>
  );
}

function GuidedColumnInspector({
  column,
  rows,
  onClear,
}: {
  column: AiLabColumn | undefined;
  rows: AiLabDataRow[];
  onClear: () => void;
}) {
  if (!column) {
    return (
      <div className={styles.inspectorCard}>
        <p className={styles.inspectorEyebrow}>Column</p>
        <h3 className={styles.inspectorTitle}>Inspect a column</h3>
        <p className={styles.muted}>
          Choose a column name in the table or on a card to see how its values
          are spread.
        </p>
      </div>
    );
  }

  const categorical = column.type === "categorical";
  const freq = categorical ? frequencies(rows, column.id) : [];
  const numeric = categorical ? null : numericalStats(rows, column.id);
  const bins = numeric ? histogramBins(numeric.values) : [];
  const maxCount = Math.max(
    1,
    ...(categorical ? freq.map((entry) => entry.count) : bins.map((bin) => bin.count)),
  );

  return (
    <div className={styles.inspectorCard}>
      <div className={styles.inspectorHeader}>
        <div>
          <p className={styles.inspectorEyebrow}>
            {categorical ? "Categories" : "Numbers"}
          </p>
          <h3 className={styles.inspectorTitle}>{column.name}</h3>
        </div>
        <Button
          size="extraSmall"
          variant="outlined"
          color="secondary"
          onClick={onClear}
        >
          Clear
        </Button>
      </div>
      <p className={styles.muted}>{column.description}</p>
      {categorical ? (
        <ul className={styles.statList}>
          {freq.map((entry) => (
            <li key={entry.value} className={styles.barRow}>
              <span className={styles.statLabel}>{entry.value}</span>
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
      ) : (
        <>
          <dl className={styles.statSummary}>
            <div className={styles.statSummaryItem}>
              <dt>Low</dt>
              <dd>{numeric?.min}</dd>
            </div>
            <div className={styles.statSummaryItem}>
              <dt>High</dt>
              <dd>{numeric?.max}</dd>
            </div>
            <div className={styles.statSummaryItem}>
              <dt>Range</dt>
              <dd>{numeric?.range}</dd>
            </div>
          </dl>
          <ul className={styles.statList}>
            {bins.map((bin) => (
              <li key={bin.label} className={styles.barRow}>
                <span className={styles.statLabel}>{bin.label}</span>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${(bin.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className={styles.statCount}>{bin.count}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function GuidedExplorePanel({
  lab,
  onOpenModel,
  onOpenSetup,
}: {
  lab: AiLabController;
  onOpenModel?: (tab: ModelInspectorTab) => void;
  onOpenSetup?: () => void;
}) {
  return (
    <DataStudio lab={lab} onOpenModel={onOpenModel} onOpenSetup={onOpenSetup} />
  );
}
