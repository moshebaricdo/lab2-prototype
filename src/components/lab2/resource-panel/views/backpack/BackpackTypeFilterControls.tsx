import { Button, Dropdown, Tooltip } from "@moshebaricdo/cads-react";
import {
  type BackpackSortDirection,
  type BackpackTypeFilterId,
  type BackpackTypeFilterOption,
} from "../../../../../lib/backpack/backpackFilters";
import styles from "./BackpackTypeFilterControls.module.scss";

interface BackpackTypeFilterControlsProps {
  options: BackpackTypeFilterOption[];
  value: BackpackTypeFilterId;
  onChange: (value: BackpackTypeFilterId) => void;
  sortDirection: BackpackSortDirection;
  onToggleSort: () => void;
}

export function BackpackTypeFilterControls({
  options,
  value,
  onChange,
  sortDirection,
  onToggleSort,
}: BackpackTypeFilterControlsProps) {
  return (
    <div className={styles.root}>
      {options.length > 1 ? (
        <div className={styles.field}>
          <span className={styles.label}>File type</span>
          <Dropdown
            role="input"
            size="extraSmall"
            color="secondary"
            width="full"
            className={styles.dropdownTrigger}
            value={value}
            options={options.map((option) => ({
              value: option.id,
              label: `${option.label} (${option.count})`,
            }))}
            onChange={(nextValue) =>
              onChange(String(nextValue) as BackpackTypeFilterId)
            }
            aria-label="File type"
          />
        </div>
      ) : null}

      <div className={styles.sortWrap}>
        <Tooltip
          title={
            sortDirection === "asc"
              ? "Sorted A–Z — sort Z–A"
              : "Sorted Z–A — sort A–Z"
          }
          placement="top"
        >
          <span>
            <Button
              type="button"
              variant="outlined"
              color="secondary"
              size="extraSmall"
              className={styles.sortButton}
              aria-label="Toggle file name sort order"
              iconOnly
              startIconName={
                sortDirection === "asc" ? "arrow-down-a-z" : "arrow-down-z-a"
              }
              onClick={onToggleSort}
            />
          </span>
        </Tooltip>
      </div>
    </div>
  );
}
