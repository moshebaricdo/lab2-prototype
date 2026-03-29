import { InputHTMLAttributes } from "react";
import styles from "./AppRadio.module.scss";

type AppRadioSize = "l" | "m" | "s" | "xs";

interface AppRadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  radioSize?: AppRadioSize;
  hovered?: boolean;
}

const SIZE_CLASS: Record<AppRadioSize, string> = {
  l: styles.sizeL,
  m: styles.sizeM,
  s: styles.sizeS,
  xs: styles.sizeXs,
};

export function AppRadio({
  className = "",
  radioSize = "m",
  hovered = false,
  checked,
  disabled,
  ...props
}: AppRadioProps) {
  return (
    <span
      className={[
        styles.root,
        SIZE_CLASS[radioSize],
        hovered ? styles.hovered : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <input
        type="radio"
        className={styles.input}
        checked={checked}
        disabled={disabled}
        {...props}
      />
      <span className={styles.control} aria-hidden="true" />
    </span>
  );
}
