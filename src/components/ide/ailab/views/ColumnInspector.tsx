import { Button, Tag } from "@moshebaricdo/cads-react";
import type { AiLabColumn, AiLabDataRow } from "../../../../types/aiLab";
import {
  frequencies,
  histogramBins,
  numericalStats,
} from "../../../../lib/aiLab";
import styles from "./AiLabWorkspace.module.scss";

interface ColumnInspectorProps {
  column: AiLabColumn;
  rows: AiLabDataRow[];
  showTrainingActions?: boolean;
  isLabel?: boolean;
  isFeature?: boolean;
  canSelectLabel?: boolean;
  onSelectLabel?: () => void;
  onToggleFeature?: () => void;
}

export function ColumnInspector({
  column,
  rows,
  showTrainingActions = false,
  isLabel = false,
  isFeature = false,
  canSelectLabel = true,
  onSelectLabel,
  onToggleFeature,
}: ColumnInspectorProps) {
  const categorical = column.type === "categorical";
  const freq = categorical ? frequencies(rows, column.id) : [];
  const numeric = categorical ? null : numericalStats(rows, column.id);
  const bins = numeric ? histogramBins(numeric.values) : [];
  const maxCount = Math.max(
    1,
    ...(categorical ? freq.map((entry) => entry.count) : bins.map((bin) => bin.count)),
  );

  return (
    <div className={styles.inspector}>
      <div>
        <Tag
          size="small"
          color="neutral"
          label={categorical ? "Categorical" : "Numerical"}
        />
        <h3 className={styles.inspectorTitle}>{column.name}</h3>
        <p className={styles.muted}>{column.description}</p>
      </div>

      {categorical ? (
        <ul className={styles.statList}>
          {freq.map((entry) => (
            <li key={entry.value} className={styles.barRow}>
              <span className={styles.cardLabel}>{entry.value}</span>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{ width: `${(entry.count / maxCount) * 100}%` }}
                />
              </div>
              <span className={styles.cardValue}>{entry.count}</span>
            </li>
          ))}
        </ul>
      ) : (
        <>
          <ul className={styles.statList}>
            <li className={styles.cardRow}>
              <span className={styles.cardLabel}>Min</span>
              <span className={styles.cardValue}>{numeric?.min}</span>
            </li>
            <li className={styles.cardRow}>
              <span className={styles.cardLabel}>Max</span>
              <span className={styles.cardValue}>{numeric?.max}</span>
            </li>
            <li className={styles.cardRow}>
              <span className={styles.cardLabel}>Range</span>
              <span className={styles.cardValue}>{numeric?.range}</span>
            </li>
          </ul>
          <ul className={styles.statList}>
            {bins.map((bin) => (
              <li key={bin.label} className={styles.barRow}>
                <span className={styles.cardLabel}>{bin.label}</span>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${(bin.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className={styles.cardValue}>{bin.count}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {showTrainingActions ? (
        <div className={styles.actions}>
          {canSelectLabel ? (
            <Button
              size="small"
              variant={isLabel ? "contained" : "outlined"}
              color={isLabel ? "primary" : "secondary"}
              onClick={onSelectLabel}
            >
              {isLabel ? "Label selected" : "Select label"}
            </Button>
          ) : null}
          <Button
            size="small"
            variant={isFeature ? "contained" : "outlined"}
            color={isFeature ? "primary" : "secondary"}
            disabled={isLabel}
            onClick={onToggleFeature}
          >
            {isFeature ? "Remove feature" : "Add feature"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
