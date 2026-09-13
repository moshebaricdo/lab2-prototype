import type { AiLabLabelCounts } from "../../../../../types/aiLab";
import { labelFill, labelIndexer } from "./labelPalette";
import styles from "./LabelMarks.module.scss";

interface LabelSwatchProps {
  label: string;
  index: number;
  /** Hide the text and expose the label via `aria-label` instead. */
  compact?: boolean;
  className?: string;
}

/** Colored dot + label text. The dot is decorative; the text carries meaning. */
export function LabelSwatch({
  label,
  index,
  compact = false,
  className = "",
}: LabelSwatchProps) {
  return (
    <span
      className={`${styles.swatch} ${className}`}
      aria-label={compact ? label : undefined}
    >
      <span
        className={styles.dot}
        style={{ background: labelFill(index) }}
        aria-hidden
      />
      {compact ? null : <span className={styles.swatchText}>{label}</span>}
    </span>
  );
}

interface DistributionBarProps {
  counts: AiLabLabelCounts;
  /** All labels in palette order so colors stay stable across nodes. */
  labels: string[];
  /** Read to assistive tech; defaults to "18 yes, 2 no". */
  description?: string;
  className?: string;
}

export function describeCounts(counts: AiLabLabelCounts, labels: string[]) {
  return labels
    .filter((label) => (counts[label] ?? 0) > 0)
    .map((label) => `${counts[label]} ${label}`)
    .join(", ");
}

/**
 * Stacked proportion bar for a node's label mix. Students read purity from
 * how much of the bar is one color; screen readers get the counts.
 */
export function DistributionBar({
  counts,
  labels,
  description,
  className = "",
}: DistributionBarProps) {
  const total = labels.reduce((sum, label) => sum + (counts[label] ?? 0), 0);
  const indexOf = labelIndexer(labels);
  return (
    <span
      className={`${styles.bar} ${className}`}
      role="img"
      aria-label={description ?? describeCounts(counts, labels)}
    >
      {total === 0
        ? null
        : labels.map((label) => {
            const count = counts[label] ?? 0;
            if (count === 0) return null;
            return (
              <span
                key={label}
                className={styles.segment}
                style={{
                  flexGrow: count,
                  background: labelFill(indexOf(label)),
                }}
              />
            );
          })}
    </span>
  );
}

interface LegendProps {
  labels: string[];
  /** Optional per-label suffix, e.g. vote counts. */
  detail?: (label: string) => string | undefined;
  className?: string;
}

export function LabelLegend({ labels, detail, className = "" }: LegendProps) {
  return (
    <ul className={`${styles.legend} ${className}`} aria-label="Label colors">
      {labels.map((label, index) => {
        const extra = detail?.(label);
        return (
          <li key={label} className={styles.legendItem}>
            <LabelSwatch label={label} index={index} />
            {extra ? <span className={styles.legendDetail}>{extra}</span> : null}
          </li>
        );
      })}
    </ul>
  );
}
