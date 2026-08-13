import { ButtonHTMLAttributes } from "react";
import { Button } from "@moshebaricdo/cads-react";
import styles from "./ContinueButton.module.scss";

interface ContinueButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color" | "size"> {
  label?: string;
  fullWidth?: boolean;
  size?: "small" | "extraSmall";
}

export function ContinueButton({
  className = "",
  disabled,
  label = "Continue to Level 10",
  fullWidth = true,
  size = "small",
  ...props
}: ContinueButtonProps) {
  return (
    <Button
      variant="contained"
      color="primary"
      size={size}
      fullWidth={fullWidth}
      endIconName="arrow-right"
      className={`${styles.root} ${className}`}
      disabled={disabled}
      {...props}
    >
      <span className={styles.label}>{label}</span>
    </Button>
  );
}
