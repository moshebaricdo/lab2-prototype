import { Button, Tooltip } from "@moshebari/cads-react";
import type { AiLabColumn } from "../../../../types/aiLab";
import styles from "./ColumnScopeToggle.module.scss";

/**
 * The card-title column when it is acting as a row id: set, and neither the
 * label nor a trained feature. That column stays pinned beside the row index.
 */
export function sheetIdColumnId(shown: {
  labelColumn: string;
  features: readonly string[];
  titleColumnId?: string;
}): string | undefined {
  const id = shown.titleColumnId;
  if (!id || id === shown.labelColumn || shown.features.includes(id)) {
    return undefined;
  }
  return id;
}

/** Keep the row-id column in the sticky slot immediately after the row index. */
export function pinSheetIdColumn(
  columns: AiLabColumn[],
  idColumnId: string | undefined,
): AiLabColumn[] {
  if (!idColumnId) return columns;
  const index = columns.findIndex((column) => column.id === idColumnId);
  if (index <= 0) return columns;
  const idColumn = columns[index]!;
  return [
    idColumn,
    ...columns.slice(0, index),
    ...columns.slice(index + 1),
  ];
}

/**
 * Dataset columns to display in a results or tree-node sheet:
 * - When `showAllColumns` is false: the card title column (if set and not
 *   already a feature or the label), the selected features, and the label.
 * - When `showAllColumns` is true: every dataset column in its original
 *   dataset order, except the card-title id column, which stays first so it
 *   can pin beside the row index.
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
  const idColumnId = sheetIdColumnId(shown);
  if (shown.showAllColumns) return pinSheetIdColumn(columns, idColumnId);
  const titleColumn = idColumnId
    ? columns.find((column) => column.id === idColumnId)
    : undefined;
  const featureColumns = shown.features
    .map((id) => columns.find((column) => column.id === id))
    .filter((column): column is AiLabColumn => Boolean(column));
  const label = columns.find((column) => column.id === shown.labelColumn);
  return pinSheetIdColumn(
    [
      ...(titleColumn ? [titleColumn] : []),
      ...featureColumns,
      ...(label ? [label] : []),
    ],
    idColumnId,
  );
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
