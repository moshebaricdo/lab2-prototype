import { Button, SegmentedButton } from "@moshebari/cads-react";
import { ScrollArea } from "../../../ui/scroll-area";
import type { AiLabController } from "../../../../hooks/useAiLabState";
import { formatCell } from "../../../../lib/aiLab";
import { ColumnInspector } from "./ColumnInspector";
import styles from "./AiLabWorkspace.module.scss";

interface DatasetViewsProps {
  lab: AiLabController;
  trainingActions?: boolean;
}

export function DatasetViews({
  lab,
  trainingActions = false,
}: DatasetViewsProps) {
  const { dataset } = lab.config;
  const selected = dataset.columns.find(
    (column) => column.id === lab.selectedColumnId,
  );
  const dataView = trainingActions ? "table" : lab.dataView;
  const showInspector = dataView === "table";

  return (
    <div className={showInspector ? styles.split : styles.panelBody}>
      <div className={styles.mainColumn}>
        <div className={styles.sectionPad}>
          <div className={styles.toolbar}>
            <p className={styles.muted}>
              {dataset.rows.length} rows in {dataset.name}
            </p>
            {trainingActions ? null : (
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
            )}
          </div>
        </div>
        <ScrollArea className={styles.scroll}>
          {dataView === "table" ? (
            <DataTable lab={lab} />
          ) : (
            <DataCards lab={lab} />
          )}
        </ScrollArea>
      </div>
      {showInspector ? (
        <aside className={styles.sideColumn}>
          {selected ? (
            <ColumnInspector
              column={selected}
              rows={dataset.rows}
              showTrainingActions={trainingActions}
              isLabel={lab.labelColumn === selected.id}
              isFeature={lab.selectedFeatures.includes(selected.id)}
              canSelectLabel={
                !lab.config.hideLabelSelect && !lab.config.lockLabelColumn
              }
              onSelectLabel={() => lab.setLabelColumn(selected.id)}
              onToggleFeature={() => lab.toggleFeature(selected.id)}
            />
          ) : (
            <p className={styles.emptyInspector}>
              Click a column to inspect its values
              {trainingActions ? " and use it in the model." : "."}
            </p>
          )}
        </aside>
      ) : null}
    </div>
  );
}

function DataTable({ lab }: { lab: AiLabController }) {
  const { dataset } = lab.config;
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {dataset.columns.map((column) => (
              <th
                key={column.id}
                className={`${styles.th} ${
                  lab.selectedColumnId === column.id ? styles.thSelected : ""
                }`}
              >
                <button
                  type="button"
                  className={styles.thButton}
                  onClick={() => lab.selectColumn(column.id)}
                >
                  {column.name}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataset.rows.map((row, index) => (
            <tr key={index}>
              {dataset.columns.map((column) => (
                <td
                  key={column.id}
                  className={`${styles.td} ${
                    lab.selectedColumnId === column.id ? styles.tdSelected : ""
                  }`}
                >
                  {formatCell(row[column.id])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DataCards({ lab }: { lab: AiLabController }) {
  const { dataset } = lab.config;
  const index = Math.min(
    Math.max(0, lab.cardIndex),
    dataset.rows.length - 1,
  );
  const row = dataset.rows[index];

  return (
    <div className={`${styles.sectionPad} ${styles.cardDeck}`}>
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
          Row {index + 1} of {dataset.rows.length}
        </span>
        <Button
          size="small"
          variant="outlined"
          color="secondary"
          endIconName="chevron-right"
          disabled={index === dataset.rows.length - 1}
          onClick={() => lab.setCardIndex(index + 1)}
        >
          Next
        </Button>
      </div>
      {row ? (
        <article className={styles.card} aria-label={`Dataset row ${index + 1}`}>
          <p className={styles.cardTitle}>Row {index + 1}</p>
          {dataset.columns.map((column) => (
            <div key={column.id} className={styles.cardRow}>
              <span className={styles.cardLabel}>{column.name}</span>
              <span className={styles.cardValue}>{formatCell(row[column.id])}</span>
            </div>
          ))}
        </article>
      ) : null}
    </div>
  );
}
