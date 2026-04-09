import { ButtonHTMLAttributes } from "react";
import { AppButton } from "../../ui/AppButton";
import styles from "./ContinueButton.module.scss";

interface ContinueButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
}

export function ContinueButton({
  className = "",
  disabled,
  label = "Continue to Level 10",
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
      <span className={styles.label}>{label}</span>
    </AppButton>
  );
}
