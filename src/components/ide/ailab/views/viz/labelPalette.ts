/**
 * Categorical palette for label values, drawn from CADS Foundations semantic
 * tokens. Brand purple is deliberately last: the path / selection highlight
 * uses `--*-selected-*` (also purple), so label swatches should not compete
 * with it. Color never carries meaning alone — every swatch is paired with
 * the label text.
 */
const LABEL_TOKENS = [
  "info",
  "accent-orange",
  "success",
  "accent-pink",
  "warning",
  "error",
  "neutral-septenary",
  "brand",
] as const;

/** How many labels get their own color before the palette repeats. */
export const LABEL_PALETTE_SIZE = LABEL_TOKENS.length;

/**
 * Palette index for the aggregated "Other" bucket that high-cardinality
 * labels fold into. Always neutral, never one of the named colors.
 */
export const OTHER_LABEL_INDEX = -1;

function tokenFor(index: number): (typeof LABEL_TOKENS)[number] {
  if (index < 0) return "neutral-septenary";
  return LABEL_TOKENS[index % LABEL_TOKENS.length];
}

/** Solid fill for SVG glyphs, bars, and swatches. */
export function labelFill(index: number): string {
  const token = tokenFor(index);
  return token === "neutral-septenary"
    ? "var(--background-neutral-septenary)"
    : `var(--background-${token}-primary)`;
}

/** Text color on a light surface for the same label. */
export function labelText(index: number): string {
  const token = tokenFor(index);
  return token === "neutral-septenary"
    ? "var(--text-neutral-secondary)"
    : `var(--text-${token}-primary)`;
}

/** Stable label → palette index lookup for one model's label set. */
export function labelIndexer(labels: string[]): (label: string) => number {
  const lookup = new Map(labels.map((label, index) => [label, index]));
  return (label: string) => lookup.get(label) ?? labels.length;
}
