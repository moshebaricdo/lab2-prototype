import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { AppButton } from "../../ui/AppButton";
import styles from "./SegmentedControl.module.scss";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon: IconDefinition;
  ariaLabel?: string;
  title?: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className={styles.root}>
      {options.map((option, index) => {
        const isActive = value === option.value;
        const isFirst = index === 0;
        const isLast = index === options.length - 1;

        let roundedClass = "";
        if (isFirst && isLast) {
          roundedClass = styles.roundAll;
        } else if (isFirst) {
          roundedClass = styles.roundLeft;
        } else if (isLast) {
          roundedClass = styles.roundRight;
        } else {
          roundedClass = styles.roundNone;
        }

        return (
          <AppButton
            key={option.value}
            onClick={() => onChange(option.value)}
            size="xs"
            variant="tertiary"
            tone={isActive ? "white" : "black"}
            icon={<FontAwesomeIcon icon={option.icon} className={styles.icon} />}
            aria-pressed={isActive}
            aria-label={option.ariaLabel}
            title={option.title}
            className={`${styles.segment} ${roundedClass} ${
              isActive ? styles.segmentActive : styles.segmentInactive
            }`}
          >
            {option.label}
          </AppButton>
        );
      })}
    </div>
  );
}
