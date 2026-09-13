import { compareNatural } from "../../../../../lib/aiLab";
import { LABEL_PALETTE_SIZE, OTHER_LABEL_INDEX } from "./labelPalette";

/**
 * Wedge key for the folded long tail. Not a real label value: it carries a
 * control character so it cannot collide with sheet data.
 */
export const OTHER_WEDGE = "\u0000other";

export interface LabelGrouping {
  /** Wedge keys in draw order. When folding, the last one is `OTHER_WEDGE`. */
  wedges: string[];
  /** Distinct labels folded into Other (0 when nothing is folded). */
  foldedCount: number;
  wedgeOf: (label: string) => string;
  /** Palette index of the label's wedge; `OTHER_LABEL_INDEX` when folded. */
  indexOf: (label: string) => number;
  /** Human name for a wedge key ("Other (349 more)" for the fold). */
  nameOf: (wedge: string) => string;
}

/**
 * Give every label its own wedge while they fit the palette. Past that,
 * keep the labels that matter for *this* prediction — the ones with votes,
 * then the most common in the sheet — and fold the rest into one neutral
 * "Other" wedge so color stays meaningful and the ring stays readable.
 *
 * Priority uses the prediction, not the revealed step, so wedges do not
 * shuffle while a student steps through one trace.
 */
export function groupLabels(
  labels: string[],
  votes: { label: string; count: number }[],
  totals: Map<string, number>,
): LabelGrouping {
  if (labels.length <= LABEL_PALETTE_SIZE) {
    const lookup = new Map(labels.map((label, index) => [label, index]));
    return {
      wedges: labels,
      foldedCount: 0,
      wedgeOf: (label) => label,
      indexOf: (label) => lookup.get(label) ?? labels.length,
      nameOf: (wedge) => wedge,
    };
  }

  // Leave the neutral and brand slots free: Other takes neutral, and brand
  // purple would fight the selection highlight in a crowded ring.
  const keep = LABEL_PALETTE_SIZE - 2;
  const voteCount = new Map(votes.map((vote) => [vote.label, vote.count]));
  const ranked = [...labels].sort(
    (a, b) =>
      (voteCount.get(b) ?? 0) - (voteCount.get(a) ?? 0) ||
      (totals.get(b) ?? 0) - (totals.get(a) ?? 0) ||
      compareNatural(a, b),
  );
  const top = ranked.slice(0, keep);
  const topIndex = new Map(top.map((label, index) => [label, index]));
  const foldedCount = labels.length - top.length;

  return {
    wedges: [...top, OTHER_WEDGE],
    foldedCount,
    wedgeOf: (label) => (topIndex.has(label) ? label : OTHER_WEDGE),
    indexOf: (label) => topIndex.get(label) ?? OTHER_LABEL_INDEX,
    nameOf: (wedge) =>
      wedge === OTHER_WEDGE ? `Other (${foldedCount} more)` : wedge,
  };
}
