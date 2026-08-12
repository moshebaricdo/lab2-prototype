import { Checkbox } from "@moshebaricdo/cads-react";
import styles from "./BackpackSupportedToggle.module.scss";

interface BackpackSupportedToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  supportedCount: number;
  totalCount: number;
}

export function BackpackSupportedToggle({
  checked,
  onChange,
  supportedCount,
  totalCount,
}: BackpackSupportedToggleProps) {
  if (totalCount === 0 || supportedCount === totalCount) {
    return null;
  }

  return (
    <label className={styles.root}>
      <Checkbox
        size="extraSmall"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className={styles.label}>
        Show only files supported in this lab ({supportedCount} of {totalCount})
      </span>
    </label>
  );
}
