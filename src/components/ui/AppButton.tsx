import {
  type ButtonHTMLAttributes,
  type ReactNode,
  forwardRef,
} from "react";
import styles from "./AppButton.module.scss";

type ButtonVariant = "primary" | "secondary" | "tertiary";
type ButtonTone = "purple" | "black" | "white" | "gray";
type ButtonSize = "l" | "m" | "s" | "xs";

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  iconPosition?: "start" | "end";
  variant?: ButtonVariant;
  tone?: ButtonTone;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const SIZE_CLASS: Record<ButtonSize, string> = {
  l: styles.sizeL,
  m: styles.sizeM,
  s: styles.sizeS,
  xs: styles.sizeXs,
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: styles.primary,
  secondary: styles.secondary,
  tertiary: styles.tertiary,
};

const TONE_CLASS: Record<ButtonTone, string> = {
  purple: styles.tonePurple,
  black: styles.toneBlack,
  white: styles.toneWhite,
  gray: styles.toneGray,
};

export const AppButton = forwardRef<HTMLButtonElement, AppButtonProps>(
  (
    {
      children,
      className = "",
      disabled,
      icon,
      iconPosition = "start",
      variant = "secondary",
      tone = "black",
      size = "m",
      fullWidth = false,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const iconOnly = Boolean(icon && !children);

    return (
      <button
        ref={ref}
        type={type}
        className={[
          styles.root,
          VARIANT_CLASS[variant],
          TONE_CLASS[tone],
          SIZE_CLASS[size],
          iconOnly ? styles.iconOnly : "",
          disabled ? styles.disabled : styles.enabled,
          fullWidth ? styles.fullWidth : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        disabled={disabled}
        {...props}
      >
        {icon && iconPosition === "start" ? (
          <span className={styles.iconWrap} aria-hidden="true">
            {icon}
          </span>
        ) : null}
        {children ? <span className={styles.label}>{children}</span> : null}
        {icon && iconPosition === "end" ? (
          <span className={styles.iconWrap} aria-hidden="true">
            {icon}
          </span>
        ) : null}
      </button>
    );
  },
);

AppButton.displayName = "AppButton";

export type { AppButtonProps, ButtonVariant, ButtonTone, ButtonSize };
