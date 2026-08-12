import { Dropdown } from "@moshebaricdo/cads-react";
import styles from "./BackpackFilterDropdown.module.scss";

interface BackpackFilterDropdownOption<Id extends string> {
  id: Id;
  label: string;
  count: number;
}

interface BackpackFilterDropdownProps<Id extends string> {
  options: BackpackFilterDropdownOption<Id>[];
  value: Id;
  onChange: (value: Id) => void;
  label?: string;
  selectId?: string;
}

export function BackpackFilterDropdown<Id extends string>({
  options,
  value,
  onChange,
  label = "Show",
  selectId = "backpack-filter-select",
}: BackpackFilterDropdownProps<Id>) {
  if (options.length <= 1) {
    return null;
  }

  return (
    <div className={styles.root}>
      <label className={styles.label} id={selectId}>
        {label}
      </label>
      <Dropdown
        role="input"
        size="extraSmall"
        color="secondary"
        width="full"
        value={value}
        aria-label={label}
        options={options.map((option) => ({
          value: option.id,
          label: `${option.label} (${option.count})`,
        }))}
        onChange={(nextValue) => onChange(String(nextValue) as Id)}
      />
    </div>
  );
}
