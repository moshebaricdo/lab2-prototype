import { Button, Tooltip } from "@moshebari/cads-react";
import type { AiLabColumn } from "../../../../types/aiLab";
import styles from "./ColumnScopeToggle.module.scss";

/**
 * Dataset columns to display in a results or tree-node sheet:
 * - When `showAllColumns` is false: the card title column (if set and not
 *   already a feature or the label), the selected features, and the label.
 * - When `showAllColumns` is true: every dataset column in its original
 *   dataset order.
 */
export function sheetColumnsFor(
  columns: AiLabColumn[],
  shown: {
    labelColumn: string;
    features: string[];
    titleColumnId?: string;
    showAllColumns: boolean;
  },
): AiLabColumn[] {
  if (shown.showAllColumns) return columns;
  const featureSet = new Set(shown.features);
  const titleColumn =
    shown.titleColumnId &&
    shown.titleColumnId !== shown.labelColumn &&
    !featureSet.has(shown.titleColumnId)
      ? columns.find((column) => column.id === shown.titleColumnId)
      : undefined;
  const featureColumns = shown.features
    .map((id) => columns.find((column) => column.id === id))
    .filter((column): column is AiLabColumn => Boolean(column));
  const label = columns.find((column) => column.id === shown.labelColumn);
  return [
    ...(titleColumn ? [titleColumn] : []),
    ...featureColumns,
    ...(label ? [label] : []),
  ];
}

/**
 * Dataset columns a results sheet hides by default: everything that is not
 * the label, a trained feature, or the card title (which the sheet already
 * shows). Kept in dataset order.
 */
export function extraSheetColumns(
  columns: AiLabColumn[],
  shown: { labelColumn: string; features: string[]; titleColumnId?: string },
): AiLabColumn[] {
  return columns.filter(
    (column) =>
      column.id !== shown.labelColumn &&
      column.id !== shown.titleColumnId &&
      !shown.features.includes(column.id),
  );
}

/** Switches a results sheet between features + label and every column. */
export function ColumnScopeToggle({
  expanded,
  onChange,
}: {
  expanded: boolean;
  onChange: (expanded: boolean) => void;
}) {
  const label = expanded ? "Show only features and label" : "Show all columns";
  return (
    <Tooltip title={label} placement="bottom">
      <Button
        size="extraSmall"
        variant="outlined"
        color="secondary"
        iconOnly
        startIconName="arrows-left-right-to-line"
        aria-label="Show all columns"
        aria-pressed={expanded}
        className={styles.toggle}
        onClick={() => onChange(!expanded)}
      />
    </Tooltip>
  );
}
