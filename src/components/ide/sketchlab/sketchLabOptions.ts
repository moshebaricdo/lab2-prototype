import type { ThemeMode } from "../../../hooks/useTheme";
import type {
  SketchAlign,
  SketchArrowheads,
  SketchColorKey,
  SketchColorValue,
  SketchLineShape,
  SketchLineStyle,
  SketchLineThickness,
  SketchSizeKey,
} from "../../../types/sketchLab";
import type { SketchIconKey } from "./sketchLabIcons";

/**
 * Sketch Lab option catalogs and token resolvers. Preset colors map to
 * `--sketch-palette-*` tokens in `sketchLabPalette.scss` (light + dark).
 */

export type SketchColorPalette = "background" | "border" | "text";

export interface SketchSwatch {
  key: SketchColorKey;
  label: string;
  /** When set, label shown in dark mode (e.g. Black → White). */
  darkLabel?: string;
  /** CSS custom property holding the theme-aware paint value. */
  cssVar: string;
}

const BACKGROUND_SWATCHES: SketchSwatch[] = [
  { key: "gray", label: "Gray", cssVar: "--sketch-palette-bg-gray" },
  { key: "red", label: "Red", cssVar: "--sketch-palette-bg-red" },
  { key: "yellow", label: "Yellow", cssVar: "--sketch-palette-bg-yellow" },
  { key: "green", label: "Green", cssVar: "--sketch-palette-bg-green" },
  { key: "blue", label: "Blue", cssVar: "--sketch-palette-bg-blue" },
  { key: "purple", label: "Purple", cssVar: "--sketch-palette-bg-purple" },
  { key: "pink", label: "Pink", cssVar: "--sketch-palette-bg-pink" },
];

const BORDER_SWATCHES: SketchSwatch[] = [
  { key: "black", label: "Black", darkLabel: "White", cssVar: "--sketch-palette-stroke-neutral" },
  { key: "red", label: "Red", cssVar: "--sketch-palette-stroke-red" },
  { key: "yellow", label: "Yellow", cssVar: "--sketch-palette-stroke-yellow" },
  { key: "green", label: "Green", cssVar: "--sketch-palette-stroke-green" },
  { key: "blue", label: "Blue", cssVar: "--sketch-palette-stroke-blue" },
  { key: "purple", label: "Purple", cssVar: "--sketch-palette-stroke-purple" },
  { key: "pink", label: "Pink", cssVar: "--sketch-palette-stroke-pink" },
];

const TEXT_SWATCHES: SketchSwatch[] = [
  { key: "black", label: "Black", darkLabel: "White", cssVar: "--sketch-palette-text-neutral" },
  { key: "red", label: "Red", cssVar: "--sketch-palette-text-red" },
  { key: "yellow", label: "Yellow", cssVar: "--sketch-palette-text-yellow" },
  { key: "green", label: "Green", cssVar: "--sketch-palette-text-green" },
  { key: "blue", label: "Blue", cssVar: "--sketch-palette-text-blue" },
  { key: "purple", label: "Purple", cssVar: "--sketch-palette-text-purple" },
  { key: "pink", label: "Pink", cssVar: "--sketch-palette-text-pink" },
];

const PALETTE_SWATCHES: Record<SketchColorPalette, SketchSwatch[]> = {
  background: BACKGROUND_SWATCHES,
  border: BORDER_SWATCHES,
  text: TEXT_SWATCHES,
};

/** @deprecated Use getPaletteSwatches(palette) instead. */
export const SKETCH_SWATCHES = TEXT_SWATCHES;

const ALL_SWATCHES = new Map<SketchColorKey, SketchSwatch>(
  [...BACKGROUND_SWATCHES, ...BORDER_SWATCHES, ...TEXT_SWATCHES].map((swatch) => [
    swatch.key,
    swatch,
  ]),
);

/** Legacy keys from earlier palette iterations. */
const LEGACY_COLOR_MAP: Partial<Record<string, SketchColorKey>> = {
  none: "black",
  orange: "yellow",
  teal: "green",
};

export function getPaletteSwatches(palette: SketchColorPalette): SketchSwatch[] {
  return PALETTE_SWATCHES[palette];
}

function normalizeColorKey(value: string): SketchColorKey | null {
  if (LEGACY_COLOR_MAP[value]) return LEGACY_COLOR_MAP[value]!;
  if (ALL_SWATCHES.has(value as SketchColorKey)) return value as SketchColorKey;
  return null;
}

function findSwatch(
  value: SketchColorValue | undefined,
  palette: SketchColorPalette,
): SketchSwatch | undefined {
  if (!value || value.startsWith("custom:")) return undefined;
  const key = normalizeColorKey(value);
  if (!key) return undefined;
  return getPaletteSwatches(palette).find((swatch) => swatch.key === key);
}

/** Resolve a stored color value into a paintable CSS value. */
export function resolveColor(
  value: SketchColorValue | undefined,
  palette: SketchColorPalette = "text",
): string {
  if (!value) return "transparent";
  if (value.startsWith("custom:")) return value.slice("custom:".length);
  if ((value as string) === "none") return "transparent";

  const swatch = findSwatch(value, palette);
  if (swatch) return `var(${swatch.cssVar})`;

  const fallbackKey = normalizeColorKey(value);
  const fallback = fallbackKey ? ALL_SWATCHES.get(fallbackKey) : undefined;
  return fallback ? `var(${fallback.cssVar})` : "transparent";
}

/** Human-readable label for a color value (used in dropdown triggers). */
export function colorLabel(
  value: SketchColorValue | undefined,
  palette: SketchColorPalette = "text",
  theme: ThemeMode = "light",
): string {
  if (!value) return "Black";
  if (value.startsWith("custom:")) return "Custom";

  const swatch = findSwatch(value, palette);
  if (!swatch) return "Black";
  if (theme === "dark" && swatch.darkLabel) return swatch.darkLabel;
  return swatch.label;
}

export function isCustomColor(value: SketchColorValue | undefined): boolean {
  return Boolean(value?.startsWith("custom:"));
}

export function customColorHex(value: SketchColorValue | undefined): string {
  return value?.startsWith("custom:") ? value.slice("custom:".length) : "#000000";
}

export interface SketchSizeOption {
  key: SketchSizeKey;
  label: string;
  /** Font size in px for preset keys; `custom` falls back to the node's customFontSize. */
  px?: number;
}

export const SKETCH_SIZE_OPTIONS: SketchSizeOption[] = [
  { key: "small", label: "Small", px: 12 },
  { key: "medium", label: "Medium", px: 16 },
  { key: "large", label: "Large", px: 24 },
  { key: "xl", label: "Extra Large", px: 32 },
  { key: "custom", label: "Custom" },
];

const SIZE_BY_KEY = new Map(SKETCH_SIZE_OPTIONS.map((option) => [option.key, option]));

export function resolveFontSize(key: SketchSizeKey, customFontSize?: number): number {
  if (key === "custom") return customFontSize ?? 16;
  return SIZE_BY_KEY.get(key)?.px ?? 16;
}

export function sizeLabel(key: SketchSizeKey): string {
  return SIZE_BY_KEY.get(key)?.label ?? "Medium";
}

export interface SketchAlignOption {
  key: SketchAlign;
  label: string;
  icon: SketchIconKey;
}

export const SKETCH_ALIGN_OPTIONS: SketchAlignOption[] = [
  { key: "left", label: "Left", icon: "prop-align" },
  { key: "center", label: "Center", icon: "prop-align" },
  { key: "right", label: "Right", icon: "prop-align" },
];

export interface SketchLineThicknessOption {
  key: SketchLineThickness;
  label: string;
  icon: SketchIconKey;
  /** Stroke width in px. */
  width: number;
}

export const SKETCH_THICKNESS_OPTIONS: SketchLineThicknessOption[] = [
  { key: "thin", label: "Thin", icon: "weight-thin", width: 1.5 },
  { key: "medium", label: "Medium", icon: "weight-medium", width: 3 },
  { key: "thick", label: "Thick", icon: "weight-thick", width: 5 },
];

const THICKNESS_BY_KEY = new Map(
  SKETCH_THICKNESS_OPTIONS.map((option) => [option.key, option]),
);

export function resolveStrokeWidth(thickness: SketchLineThickness): number {
  return THICKNESS_BY_KEY.get(thickness)?.width ?? 3;
}

export interface SketchLineStyleOption {
  key: SketchLineStyle;
  label: string;
  icon: SketchIconKey;
}

export const SKETCH_LINE_STYLE_OPTIONS: SketchLineStyleOption[] = [
  { key: "solid", label: "Solid", icon: "style-solid" },
  { key: "dashed", label: "Dashed", icon: "style-dashed" },
  { key: "dotted", label: "Dotted", icon: "style-dotted" },
];

/** SVG dash pattern for a line style at a given stroke width. */
export function resolveDashArray(
  style: SketchLineStyle,
  width: number,
): string | undefined {
  if (style === "dashed") return `${width * 3} ${width * 2}`;
  if (style === "dotted") return `${width} ${width * 1.8}`;
  return undefined;
}

export interface SketchLineShapeOption {
  key: SketchLineShape;
  label: string;
  icon: SketchIconKey;
}

export const SKETCH_LINE_SHAPE_OPTIONS: SketchLineShapeOption[] = [
  { key: "straight", label: "Straight", icon: "shape-straight" },
  { key: "curved", label: "Curved", icon: "shape-curved" },
  { key: "sharp-step", label: "Sharp Step", icon: "shape-sharp-step" },
  { key: "round-step", label: "Round Step", icon: "shape-round-step" },
];

export interface SketchArrowheadOption {
  key: SketchArrowheads;
  label: string;
  icon: SketchIconKey;
}

export const SKETCH_ARROWHEAD_OPTIONS: SketchArrowheadOption[] = [
  { key: "none", label: "None", icon: "arrow-none" },
  { key: "start", label: "Start", icon: "arrow-start" },
  { key: "end", label: "End", icon: "arrow-end" },
  { key: "both", label: "Both", icon: "arrow-both" },
];

export const SKETCH_ROTATION_MIN = 0;
export const SKETCH_ROTATION_MAX = 360;
