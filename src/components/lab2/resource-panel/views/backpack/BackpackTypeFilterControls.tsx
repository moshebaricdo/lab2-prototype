import { Dropdown } from "@moshebaricdo/cads-react";
import {
  BACKPACK_SORT_OPTIONS,
  backpackTypeFilterIconName,
  type BackpackSortMode,
  type BackpackTypeFilterId,
  type BackpackTypeFilterOption,
} from "../../../../../lib/backpack/backpackFilters";
import styles from "./BackpackTypeFilterControls.module.scss";

interface BackpackTypeFilterControlsProps {
  options: BackpackTypeFilterOption[];
  value: BackpackTypeFilterId;
  onChange: (value: BackpackTypeFilterId) => void;
  sortMode: BackpackSortMode;
  onSortModeChange: (mode: BackpackSortMode) => void;
}

export function BackpackTypeFilterControls({
  options,
  value,
  onChange,
  sortMode,
  onSortModeChange,
}: BackpackTypeFilterControlsProps) {
  const showTypeFilter = options.length > 1;

  return (
    <div className={showTypeFilter ? `${styles.root} ${styles.rootSplit}` : styles.root}>
      {showTypeFilter ? (
        <div className={styles.field}>
          <Dropdown
            role="input"
            size="small"
            color="secondary"
            width="full"
            className={styles.dropdownTrigger}
            style={{ minWidth: 0, maxWidth: "100%" }}
            label="File type"
            value={value}
            startIconName={backpackTypeFilterIconName(value)}
            options={options.map((option) => ({
              value: option.id,
              label: `${option.label} (${option.count})`,
              iconName: backpackTypeFilterIconName(option.id),
            }))}
            onChange={(nextValue) =>
              onChange(String(nextValue) as BackpackTypeFilterId)
            }
            aria-label="File type"
          />
        </div>
      ) : null}

      <div className={styles.field}>
        <Dropdown
          role="input"
          size="small"
          color="secondary"
          width="full"
          className={styles.dropdownTrigger}
          style={{ minWidth: 0, maxWidth: "100%" }}
          label="Sort"
          value={sortMode}
          options={BACKPACK_SORT_OPTIONS.map((option) => ({
            value: option.id,
            label: option.label,
          }))}
          onChange={(nextValue) =>
            onSortModeChange(String(nextValue) as BackpackSortMode)
          }
          aria-label="Sort backpack files"
        />
      </div>
    </div>
  );
}
