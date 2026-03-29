import { ButtonHTMLAttributes } from "react";
import { AppButton } from "../ui/AppButton";
import styles from "./ContinueButton.module.scss";

interface ContinueButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {}

export function ContinueButton({
  className = "",
  disabled,
  ...props
}: ContinueButtonProps) {
  return (
    <AppButton
      variant="primary"
      tone="purple"
      size="s"
      fullWidth
      iconName="arrow-right"
      iconPosition="end"
      className={`${styles.root} ${className}`}
      disabled={disabled}
      {...props}
    >
      <span className={styles.label}>Continue to Level 10</span>
    </AppButton>
  );
}
