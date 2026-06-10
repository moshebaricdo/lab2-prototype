import { AppButton } from "../../../../ui/AppButton";
import type {
  BackpackFilterId,
  BackpackFilterOption,
} from "../../../../../lib/backpack/backpackFilters";
import styles from "./BackpackFilterPills.module.scss";

interface BackpackFilterPillsProps {
  options: BackpackFilterOption[];
  value: BackpackFilterId;
  onChange: (value: BackpackFilterId) => void;
}

export function BackpackFilterPills({
  options,
  value,
  onChange,
}: BackpackFilterPillsProps) {
  if (options.length <= 1) {
    return null;
  }

  return (
    <div
      className={styles.root}
      role="group"
      aria-label="Filter backpack files"
    >
      <div className={styles.row}>
        {options.map((option) => {
          const isActive = value === option.id;
          const label = `${option.label} (${option.count})`;

          return (
            <AppButton
              key={option.id}
              type="button"
              size="xs"
              variant="tertiary"
              tone={isActive ? "white" : "gray"}
              aria-pressed={isActive}
              className={`${styles.pill} ${isActive ? styles.pillActive : ""}`}
              onClick={() => onChange(option.id)}
            >
              {label}
            </AppButton>
          );
        })}
      </div>
    </div>
  );
}
