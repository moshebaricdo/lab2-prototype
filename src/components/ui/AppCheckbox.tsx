import { InputHTMLAttributes } from "react";
import styles from "./AppCheckbox.module.scss";

type AppCheckboxSize = "l" | "m" | "s" | "xs";

interface AppCheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  checkboxSize?: AppCheckboxSize;
  hovered?: boolean;
}

const SIZE_CLASS: Record<AppCheckboxSize, string> = {
  l: styles.sizeL,
  m: styles.sizeM,
  s: styles.sizeS,
  xs: styles.sizeXs,
};

export function AppCheckbox({
  className = "",
  checkboxSize = "m",
  hovered = false,
  checked,
  disabled,
  ...props
}: AppCheckboxProps) {
  return (
    <span
      className={[
        styles.root,
        SIZE_CLASS[checkboxSize],
        hovered ? styles.hovered : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <input
        type="checkbox"
        className={styles.input}
        checked={checked}
        disabled={disabled}
        {...props}
      />
      <span className={styles.control} aria-hidden="true" />
    </span>
  );
}
