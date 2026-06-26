import type { ReactNode } from "react";
import { FaIcon, type FaIconSize } from "./icons/FaIcon";
import type { FaIconName } from "../../icons/faProRegularCodepoints";
import styles from "./AppTag.module.scss";

type TagFill = "light" | "solid";
type TagColor =
  | "gray"
  | "purple"
  | "teal"
  | "aqua"
  | "error"
  | "success"
  | "warning"
  | "info";
type TagSize = "l" | "m" | "s";

/** @deprecated Use `color` instead. */
type AppTagLegacyVariant = "neutral" | "purple";

const SIZE_CLASS: Record<TagSize, string> = {
  l: styles.sizeL,
  m: styles.sizeM,
  s: styles.sizeS,
};

const FILL_CLASS: Record<TagFill, string> = {
  light: styles.fillLight,
  solid: styles.fillSolid,
};

const COLOR_CLASS: Record<TagColor, string> = {
  gray: styles.colorGray,
  purple: styles.colorPurple,
  teal: styles.colorTeal,
  aqua: styles.colorAqua,
  error: styles.colorError,
  success: styles.colorSuccess,
  warning: styles.colorWarning,
  info: styles.colorInfo,
};

const TAG_ICON_SIZE: Record<TagSize, FaIconSize> = {
  l: "s",
  m: "xs",
  s: "xs",
};

const LEGACY_VARIANT_COLOR: Record<AppTagLegacyVariant, TagColor> = {
  neutral: "gray",
  purple: "purple",
};

interface AppTagProps {
  children: ReactNode;
  fill?: TagFill;
  color?: TagColor;
  /** @deprecated Use `color` instead. */
  variant?: AppTagLegacyVariant;
  size?: TagSize;
  iconName?: FaIconName;
  iconPosition?: "start" | "end";
  /** When set, renders a small close icon on the end of the tag. */
  onDismiss?: () => void;
  dismissLabel?: string;
  disabled?: boolean;
  className?: string;
}

export function AppTag({
  children,
  fill = "light",
  color,
  variant,
  size = "m",
  iconName,
  iconPosition = "start",
  onDismiss,
  dismissLabel = "Dismiss tag",
  disabled = false,
  className = "",
}: AppTagProps) {
  const resolvedColor = color ?? (variant ? LEGACY_VARIANT_COLOR[variant] : "gray");
  const showStartIcon = Boolean(iconName && iconPosition === "start");
  const showEndIcon = Boolean(iconName && iconPosition === "end" && !onDismiss);
  const showTrailControl = showEndIcon || Boolean(onDismiss);
  const iconSize = TAG_ICON_SIZE[size];

  return (
    <span
      className={[
        styles.tag,
        FILL_CLASS[fill],
        COLOR_CLASS[resolvedColor],
        SIZE_CLASS[size],
        showStartIcon ? styles.hasLeadIcon : "",
        showTrailControl ? styles.hasTrailIcon : "",
        disabled ? styles.disabled : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-disabled={disabled || undefined}
    >
      {showStartIcon ? (
        <span className={[styles.icon, styles.leadIcon].join(" ")} aria-hidden>
          <FaIcon name={iconName!} size={iconSize} />
        </span>
      ) : null}
      <span className={styles.label}>{children}</span>
      {showEndIcon ? (
        <span className={[styles.icon, styles.trailIcon].join(" ")} aria-hidden>
          <FaIcon name={iconName!} size={iconSize} />
        </span>
      ) : null}
      {onDismiss ? (
        <button
          type="button"
          className={styles.dismissButton}
          disabled={disabled}
          aria-label={dismissLabel}
          onClick={onDismiss}
        >
          <FaIcon name="xmark" size={iconSize} className={styles.dismissIcon} />
        </button>
      ) : null}
    </span>
  );
}

export type { AppTagProps, TagFill, TagColor, TagSize };
