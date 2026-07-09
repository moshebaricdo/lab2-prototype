import {
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
  createElement,
  forwardRef,
} from "react";
import styles from "./AppText.module.scss";

/** Variants that accept a weight axis (Bold / Semi Bold / Regular). */
export type AppTextWeightedVariant =
  | "heading-h1"
  | "heading-h2"
  | "heading-h3"
  | "heading-h4"
  | "heading-h5"
  | "heading-h6"
  | "body-1"
  | "body-2"
  | "body-3"
  | "body-4"
  | "body-5"
  | "mono-1"
  | "mono-2"
  | "mono-3"
  | "mono-4"
  | "mono-5";

/** Variants with a fixed Semi Bold weight in CADS. */
export type AppTextFixedVariant =
  | "overline-1"
  | "overline-2"
  | "overline-3"
  | "label-1"
  | "label-2"
  | "label-3"
  | "label-4"
  | "link-1"
  | "link-2"
  | "link-3"
  | "link-4"
  | "link-5";

export type AppTextVariant = AppTextWeightedVariant | AppTextFixedVariant;

export type AppTextWeight = "bold" | "semibold" | "regular";

const WEIGHTED_VARIANTS = new Set<string>([
  "heading-h1",
  "heading-h2",
  "heading-h3",
  "heading-h4",
  "heading-h5",
  "heading-h6",
  "body-1",
  "body-2",
  "body-3",
  "body-4",
  "body-5",
  "mono-1",
  "mono-2",
  "mono-3",
  "mono-4",
  "mono-5",
]);

const STYLE_CLASS: Record<string, string> = {
  "heading-h1-bold": styles.headingH1Bold,
  "heading-h1-semibold": styles.headingH1Semibold,
  "heading-h1-regular": styles.headingH1Regular,
  "heading-h2-bold": styles.headingH2Bold,
  "heading-h2-semibold": styles.headingH2Semibold,
  "heading-h2-regular": styles.headingH2Regular,
  "heading-h3-bold": styles.headingH3Bold,
  "heading-h3-semibold": styles.headingH3Semibold,
  "heading-h3-regular": styles.headingH3Regular,
  "heading-h4-bold": styles.headingH4Bold,
  "heading-h4-semibold": styles.headingH4Semibold,
  "heading-h4-regular": styles.headingH4Regular,
  "heading-h5-bold": styles.headingH5Bold,
  "heading-h5-semibold": styles.headingH5Semibold,
  "heading-h5-regular": styles.headingH5Regular,
  "heading-h6-bold": styles.headingH6Bold,
  "heading-h6-semibold": styles.headingH6Semibold,
  "heading-h6-regular": styles.headingH6Regular,
  "body-1-bold": styles.body1Bold,
  "body-1-semibold": styles.body1Semibold,
  "body-1-regular": styles.body1Regular,
  "body-2-bold": styles.body2Bold,
  "body-2-semibold": styles.body2Semibold,
  "body-2-regular": styles.body2Regular,
  "body-3-bold": styles.body3Bold,
  "body-3-semibold": styles.body3Semibold,
  "body-3-regular": styles.body3Regular,
  "body-4-bold": styles.body4Bold,
  "body-4-semibold": styles.body4Semibold,
  "body-4-regular": styles.body4Regular,
  "body-5-bold": styles.body5Bold,
  "body-5-semibold": styles.body5Semibold,
  "body-5-regular": styles.body5Regular,
  "overline-1": styles.overline1,
  "overline-2": styles.overline2,
  "overline-3": styles.overline3,
  "label-1": styles.label1,
  "label-2": styles.label2,
  "label-3": styles.label3,
  "label-4": styles.label4,
  "link-1": styles.link1,
  "link-2": styles.link2,
  "link-3": styles.link3,
  "link-4": styles.link4,
  "link-5": styles.link5,
  "mono-1-bold": styles.mono1Bold,
  "mono-1-semibold": styles.mono1Semibold,
  "mono-1-regular": styles.mono1Regular,
  "mono-2-bold": styles.mono2Bold,
  "mono-2-semibold": styles.mono2Semibold,
  "mono-2-regular": styles.mono2Regular,
  "mono-3-bold": styles.mono3Bold,
  "mono-3-semibold": styles.mono3Semibold,
  "mono-3-regular": styles.mono3Regular,
  "mono-4-bold": styles.mono4Bold,
  "mono-4-semibold": styles.mono4Semibold,
  "mono-4-regular": styles.mono4Regular,
  "mono-5-bold": styles.mono5Bold,
  "mono-5-semibold": styles.mono5Semibold,
  "mono-5-regular": styles.mono5Regular,
};

const DEFAULT_AS: Partial<Record<AppTextVariant, ElementType>> = {
  "heading-h1": "h1",
  "heading-h2": "h2",
  "heading-h3": "h3",
  "heading-h4": "h4",
  "heading-h5": "h5",
  "heading-h6": "h6",
  "body-1": "p",
  "body-2": "p",
  "body-3": "p",
  "body-4": "p",
  "body-5": "p",
  "overline-1": "span",
  "overline-2": "span",
  "overline-3": "span",
  "label-1": "span",
  "label-2": "span",
  "label-3": "span",
  "label-4": "span",
  "link-1": "a",
  "link-2": "a",
  "link-3": "a",
  "link-4": "a",
  "link-5": "a",
  "mono-1": "code",
  "mono-2": "code",
  "mono-3": "code",
  "mono-4": "code",
  "mono-5": "code",
};

export interface AppTextProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
  variant?: AppTextVariant;
  /** Only applies to heading / body / mono variants. Defaults to semibold. */
  weight?: AppTextWeight;
  as?: ElementType;
  className?: string;
}

function resolveStyleKey(
  variant: AppTextVariant,
  weight: AppTextWeight,
): string {
  if (WEIGHTED_VARIANTS.has(variant)) {
    return `${variant}-${weight}`;
  }
  return variant;
}

/**
 * CADS typography primitive — maps to Figma text styles 1:1.
 * Prefer this for content/copy; use `_typography.scss` mixins for chrome in SCSS modules.
 */
export const AppText = forwardRef<HTMLElement, AppTextProps>(function AppText(
  {
    children,
    variant = "body-2",
    weight = "semibold",
    as,
    className = "",
    ...rest
  },
  ref,
) {
  const styleKey = resolveStyleKey(variant, weight);
  const styleClass = STYLE_CLASS[styleKey] ?? styles.body2Regular;
  const Tag = as ?? DEFAULT_AS[variant] ?? "span";

  return createElement(
    Tag,
    {
      ...rest,
      ref,
      className: [styles.root, styleClass, className].filter(Boolean).join(" "),
    },
    children,
  );
});
