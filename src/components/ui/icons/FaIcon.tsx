import type { CSSProperties } from "react";
import {
  type FaBrandIconName,
  getFaBrandCodepoint,
} from "../../../icons/faBrandsCodepoints";
import {
  type FaIconName,
  getFaCodepoint,
} from "../../../icons/faProRegularCodepoints";
import styles from "./FaIcon.module.scss";

export type FaIconSize = "inherit" | "xs" | "s" | "m" | "l";
export type FaIconFamily = "solid" | "brands";

const SIZE_CLASS: Record<FaIconSize, string> = {
  inherit: styles.sizeInherit,
  xs: styles.sizeXs,
  s: styles.sizeS,
  m: styles.sizeM,
  l: styles.sizeL,
};

const FAMILY_CLASS: Record<FaIconFamily, string> = {
  solid: styles.familySolid,
  brands: styles.familyBrands,
};

export interface FaIconProps {
  /** FA icon name (kebab-case), e.g. \`arrow-right\`, \`python\` (brands). */
  name: FaIconName | FaBrandIconName;
  family?: FaIconFamily;
  className?: string;
  /** Visible label for screen readers; when set, \`aria-hidden\` is not applied. */
  title?: string;
  size?: FaIconSize;
  style?: CSSProperties;
}

function resolveCodepoint(name: FaIconName | FaBrandIconName, family: FaIconFamily): string {
  return family === "brands"
    ? getFaBrandCodepoint(name as FaBrandIconName)
    : getFaCodepoint(name as FaIconName);
}

/**
 * Renders a glyph from the licensed Font Awesome 7 webfont (Pro Solid or Brands).
 * Prefer this over \`@fortawesome/react-fontawesome\` for new UI.
 */
export function FaIcon({
  name,
  family = "solid",
  className = "",
  title,
  size = "m",
  style,
}: FaIconProps) {
  const hex = resolveCodepoint(name, family);
  const char = String.fromCodePoint(Number.parseInt(hex, 16));

  return (
    <span
      className={[
        styles.root,
        FAMILY_CLASS[family],
        SIZE_CLASS[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-fa-icon=""
      data-fa-family={family}
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
