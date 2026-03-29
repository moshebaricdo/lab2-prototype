import type { CSSProperties } from "react";
import {
  type FaIconName,
  getFaProRegularCodepoint,
} from "../../icons/faProRegularCodepoints";
import styles from "./FaIcon.module.scss";

export type FaIconSize = "inherit" | "xs" | "s" | "m" | "l";

const SIZE_CLASS: Record<FaIconSize, string> = {
  inherit: styles.sizeInherit,
  xs: styles.sizeXs,
  s: styles.sizeS,
  m: styles.sizeM,
  l: styles.sizeL,
};

export interface FaIconProps {
  /** FA icon name (kebab-case), e.g. \`arrow-right\`, \`circle-check\`. */
  name: FaIconName;
  className?: string;
  /** Visible label for screen readers; when set, \`aria-hidden\` is not applied. */
  title?: string;
  size?: FaIconSize;
  style?: CSSProperties;
}

/**
 * Renders a glyph from the licensed Font Awesome 7 Pro Solid webfont (900).
 * Prefer this over \`@fortawesome/react-fontawesome\` for new UI.
 */
export function FaIcon({
  name,
  className = "",
  title,
  size = "m",
  style,
}: FaIconProps) {
  const hex = getFaProRegularCodepoint(name);
  const char = String.fromCodePoint(Number.parseInt(hex, 16));

  return (
    <span
      className={[styles.root, SIZE_CLASS[size], className].filter(Boolean).join(" ")}
      data-fa-icon=""
      style={style}
      title={title}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      role={title ? "img" : undefined}
    >
      {char}
    </span>
  );
}
