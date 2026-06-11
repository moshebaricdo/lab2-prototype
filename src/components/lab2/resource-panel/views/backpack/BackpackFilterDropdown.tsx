import { AppNativeSelect } from "../../../../ui/AppDropdown";
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
      <label className={styles.label} htmlFor={selectId}>
        {label}
      </label>
      <AppNativeSelect
        id={selectId}
        size="xs"
        tone="gray"
        fullWidth
        value={value}
        options={options.map((option) => ({
          value: option.id,
          label: `${option.label} (${option.count})`,
        }))}
        onValueChange={(nextValue) => onChange(nextValue as Id)}
      />
    </div>
  );
}
