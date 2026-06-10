import { FaIcon, type FaIconFamily, type FaIconSize } from "../../ui/icons/FaIcon";
import type { FaBrandIconName } from "../../../icons/faBrandsCodepoints";
import type { FaIconName } from "../../../icons/faProRegularCodepoints";

/**
 * ────────────────────────────────────────────────────────────────────────────
 * SKETCH LAB ICON MAP  —  PLACEHOLDERS
 * ────────────────────────────────────────────────────────────────────────────
 * Many Sketch Lab glyphs (line weights, line styles, line shapes, node-handle
 * toggles, etc.) are custom icons that live in our custom FontAwesome kit, which
 * is not in this repo yet. Until that kit lands, every Sketch Lab icon resolves
 * to a stock FA7 Pro glyph below.
 *
 * When the custom kit is added, update ONLY the `name`/`family` values in this
 * map. Every call site uses the semantic `SketchIconKey`, so no other file needs
 * to change. Entries flagged `PLACEHOLDER` are stand-ins for custom glyphs.
 */

type IconDef = { name: FaIconName | FaBrandIconName; family?: FaIconFamily };

export type SketchIconKey =
  // Canvas tools
  | "tool-grab"
  | "tool-select"
  // Node palette tools
  | "tool-rectangle"
  | "tool-triangle"
  | "tool-circle"
  | "tool-diamond"
  | "tool-text"
  | "tool-line"
  | "tool-image"
  // Property row category icons
  | "prop-color"
  | "prop-size"
  | "prop-align"
  | "prop-rotation"
  // Line property category icons (custom)
  | "line-weight"
  | "line-style"
  | "line-shape"
  // Line weight options (custom)
  | "weight-thin"
  | "weight-medium"
  | "weight-thick"
  // Line style options (custom)
  | "style-solid"
  | "style-dashed"
  | "style-dotted"
  // Line shape options (custom)
  | "shape-straight"
  | "shape-curved"
  | "shape-sharp-step"
  | "shape-round-step"
  // Arrowhead options
  | "arrow-none"
  | "arrow-start"
  | "arrow-end"
  | "arrow-both"
  // Action row
  | "action-duplicate"
  | "action-bring-forward"
  | "action-send-back"
  | "action-delete"
  // Chrome
  | "close"
  | "download"
  | "start-over"
  | "add";

export const SKETCH_ICONS: Record<SketchIconKey, IconDef> = {
  // Canvas tools
  "tool-grab": { name: "hand" },
  "tool-select": { name: "arrow-pointer" },
  // Node palette tools
  "tool-rectangle": { name: "square" },
  "tool-triangle": { name: "triangle" },
  "tool-circle": { name: "circle" },
  "tool-diamond": { name: "diamond" },
  "tool-text": { name: "font" },
  "tool-line": { name: "arrow-up-right" }, // PLACEHOLDER (custom line/arrow tool)
  "tool-image": { name: "image" },
  // Property row category icons
  "prop-color": { name: "palette" },
  "prop-size": { name: "text-size" },
  "prop-align": { name: "align-center" },
  "prop-rotation": { name: "angle-90" },
  // Line property category icons
  "line-weight": { name: "grip-lines" }, // PLACEHOLDER (custom)
  "line-style": { name: "ellipsis" }, // PLACEHOLDER (custom)
  "line-shape": { name: "bezier-curve" }, // PLACEHOLDER (custom)
  // Line weight options
  "weight-thin": { name: "minus" }, // PLACEHOLDER (custom)
  "weight-medium": { name: "minus" }, // PLACEHOLDER (custom)
  "weight-thick": { name: "minus" }, // PLACEHOLDER (custom)
  // Line style options
  "style-solid": { name: "minus" }, // PLACEHOLDER (custom)
  "style-dashed": { name: "ellipsis" }, // PLACEHOLDER (custom)
  "style-dotted": { name: "ellipsis" }, // PLACEHOLDER (custom)
  // Line shape options
  "shape-straight": { name: "minus" }, // PLACEHOLDER (custom)
  "shape-curved": { name: "wave-square" }, // PLACEHOLDER (custom)
  "shape-sharp-step": { name: "stairs" }, // PLACEHOLDER (custom)
  "shape-round-step": { name: "stairs" }, // PLACEHOLDER (custom)
  // Arrowhead options
  "arrow-none": { name: "ban" },
  "arrow-start": { name: "arrow-left" },
  "arrow-end": { name: "arrow-right" },
  "arrow-both": { name: "arrows-left-right" },
  // Action row
  "action-duplicate": { name: "copy" },
  "action-bring-forward": { name: "bring-front" },
  "action-send-back": { name: "send-back" },
  "action-delete": { name: "trash" },
  // Chrome
  close: { name: "xmark" },
  download: { name: "download" },
  "start-over": { name: "arrow-rotate-left" },
  add: { name: "plus" },
};

interface SketchIconProps {
  icon: SketchIconKey;
  size?: FaIconSize;
  className?: string;
  title?: string;
}

/** Renders a Sketch Lab icon by its semantic key (placeholder-backed for now). */
export function SketchIcon({ icon, size = "m", className, title }: SketchIconProps) {
  const def = SKETCH_ICONS[icon];
  return (
    <FaIcon
      name={def.name}
      family={def.family ?? "solid"}
      size={size}
      className={className}
      title={title}
    />
  );
}
