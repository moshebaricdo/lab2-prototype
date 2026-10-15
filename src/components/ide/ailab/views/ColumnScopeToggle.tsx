import { Button, Tooltip } from "@moshebari/cads-react";
import type { AiLabColumn } from "../../../../types/aiLab";
import styles from "./ColumnScopeToggle.module.scss";

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
