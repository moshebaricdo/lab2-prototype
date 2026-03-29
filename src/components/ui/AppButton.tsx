import {
  type ButtonHTMLAttributes,
  type ReactNode,
  forwardRef,
} from "react";
import { FaIcon, type FaIconSize } from "../icons/FaIcon";
import type { FaIconName } from "../../icons/faProRegularCodepoints";
import styles from "./AppButton.module.scss";

type ButtonVariant = "primary" | "secondary" | "tertiary";
type ButtonTone = "purple" | "black" | "white" | "gray";
type ButtonSize = "l" | "m" | "s" | "xs";

const BUTTON_ICON_SIZE: Record<ButtonSize, FaIconSize> = {
  l: "l",
  m: "m",
  s: "s",
  xs: "xs",
};

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Prefer \`iconName\` for new code (FA7 Pro webfont). \`icon\` wins when both are set. */
  icon?: ReactNode;
  iconName?: FaIconName;
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
      iconName,
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
    const resolvedIcon =
      icon ??
      (iconName ? (
        <FaIcon name={iconName} size={BUTTON_ICON_SIZE[size]} />
      ) : null);
    const iconOnly = Boolean(resolvedIcon && !children);

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
        {resolvedIcon && iconPosition === "start" ? (
          <span className={styles.iconWrap} aria-hidden="true">
            {resolvedIcon}
          </span>
        ) : null}
        {children ? <span className={styles.label}>{children}</span> : null}
        {resolvedIcon && iconPosition === "end" ? (
          <span className={styles.iconWrap} aria-hidden="true">
            {resolvedIcon}
          </span>
        ) : null}
      </button>
    );
  },
);

AppButton.displayName = "AppButton";

export type { AppButtonProps, ButtonVariant, ButtonTone, ButtonSize };
export type { FaIconName } from "../../icons/faProRegularCodepoints";
