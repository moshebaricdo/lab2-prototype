import { AppNativeSelect } from "../../../../ui/AppDropdown";
import type {
  BackpackFilterId,
  BackpackFilterOption,
} from "../../../../../lib/backpack/backpackFilters";
import styles from "./BackpackFilterDropdown.module.scss";

interface BackpackFilterDropdownProps {
  options: BackpackFilterOption[];
  value: BackpackFilterId;
  onChange: (value: BackpackFilterId) => void;
}

export function BackpackFilterDropdown({
  options,
  value,
  onChange,
}: BackpackFilterDropdownProps) {
  if (options.length <= 1) {
    return null;
  }

  return (
    <div className={styles.root}>
      <label className={styles.label} htmlFor="backpack-filter-select">
        Show
      </label>
      <AppNativeSelect
        id="backpack-filter-select"
        size="xs"
        tone="gray"
        fullWidth
        value={value}
        options={options.map((option) => ({
          value: option.id,
          label: `${option.label} (${option.count})`,
        }))}
        onValueChange={(nextValue) => onChange(nextValue as BackpackFilterId)}
      />
    </div>
  );
}
