import type { AiLabColumn, AiLabDataRow } from "../../types/aiLab";
import { columnById, uniqueValues } from "./columnStats";

/**
 * A categorical column with more distinct values than this cannot be the
 * label or a feature. Mirrors production AI Lab's rule: with 50+ classes
 * every class has a handful of rows, so neither KNN nor a tree can
 * generalize, and no legend, wedge, or palette survives that many values.
 */
export const MAX_CATEGORY_VALUES = 50;

/**
 * Above this many label values the Testing visualizations fold the long
 * tail into one "Other" bucket. Matches the size of the label palette.
 */
export const LABEL_FOLD_THRESHOLD = 8;

export type CategoryFit = "ok" | "crowded" | "blocked";

export interface CategoryCheck {
  count: number;
  fit: CategoryFit;
}

/** `undefined` for numerical columns — the rule only applies to categories. */
export function categoryCheck(
  rows: AiLabDataRow[],
  columns: AiLabColumn[],
  columnId: string,
): CategoryCheck | undefined {
  const column = columnById(columns, columnId);
  if (!column || column.type !== "categorical") return undefined;
  const count = uniqueValues(rows, columnId).length;
  return {
    count,
    fit:
      count > MAX_CATEGORY_VALUES
        ? "blocked"
        : count > LABEL_FOLD_THRESHOLD
          ? "crowded"
          : "ok",
  };
}

export interface SetupNotice {
  sentiment: "warning" | "error";
  text: string;
}

export function labelNotice(
  rows: AiLabDataRow[],
  columns: AiLabColumn[],
  labelColumn: string | undefined,
): SetupNotice | undefined {
  if (!labelColumn) return undefined;
  const check = categoryCheck(rows, columns, labelColumn);
  if (!check || check.fit === "ok") return undefined;
  const name = columnById(columns, labelColumn)?.name ?? labelColumn;
  if (check.fit === "blocked") {
    return {
      sentiment: "error",
      text: `${name} has ${check.count} different values. Pick a column with ${MAX_CATEGORY_VALUES} or fewer to predict.`,
    };
  }
  return {
    sentiment: "warning",
    text: `${name} has ${check.count} values, so the chart shows the most common ones and folds the rest into Other.`,
  };
}

/** Features a categorical column cannot be, with the first offender named. */
export function featureNotice(
  rows: AiLabDataRow[],
  columns: AiLabColumn[],
  features: string[],
): SetupNotice | undefined {
  const blocked = features
    .map((feature) => ({
      feature,
      check: categoryCheck(rows, columns, feature),
    }))
    .filter((entry) => entry.check?.fit === "blocked");
  if (blocked.length === 0) return undefined;
  const first = blocked[0]!;
  const name = columnById(columns, first.feature)?.name ?? first.feature;
  const others =
    blocked.length > 1 ? ` (and ${blocked.length - 1} more)` : "";
  return {
    sentiment: "error",
    text: `${name} has ${first.check!.count} different values${others}. A feature can have at most ${MAX_CATEGORY_VALUES}.`,
  };
}
