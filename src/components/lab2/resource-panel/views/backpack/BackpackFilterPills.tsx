import { Button } from "@moshebaricdo/cads-react";
import styles from "./BackpackFilterPills.module.scss";

interface BackpackFilterPillOption<Id extends string> {
  id: Id;
  label: string;
  count: number;
}

interface BackpackFilterPillsProps<Id extends string> {
  options: BackpackFilterPillOption<Id>[];
  value: Id;
  onChange: (value: Id) => void;
}

export function BackpackFilterPills<Id extends string>({
  options,
  value,
  onChange,
}: BackpackFilterPillsProps<Id>) {
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
            <Button
              key={option.id}
              type="button"
              size="extraSmall"
              variant="text"
              color="secondary"
              aria-pressed={isActive}
              className={`${styles.pill} ${isActive ? styles.pillActive : ""}`}
              onClick={() => onChange(option.id)}
            >
              {label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
