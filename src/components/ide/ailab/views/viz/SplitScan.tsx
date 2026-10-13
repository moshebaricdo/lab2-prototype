import { FaIcon } from "@moshebari/cads-react/icons";
import { columnById } from "../../../../../lib/aiLab";
import type { AiLabColumn } from "../../../../../types/aiLab";
import type { ScanPlan } from "../trainingWalk";
import { labelFill } from "./labelPalette";
import type { SortingModel } from "./SortingTree";
import styles from "./SplitScan.module.scss";

/** Piles drawn side by side; a wider categorical split shows its biggest and "+N". */
const MAX_PILES = 3;
/** Dots across all the preview piles, at most. */
const PREVIEW_DOTS = 48;
const PANEL_WIDTH = 252;
/** Gap between the scanned node's bottom edge and the panel. */
const PANEL_GAP = 14;

/**
 * The `scan` training story's search, drawn where the node's children will
 * go: the question being tried, the piles it would sort the rows into
 * (real counts, in label colors), and — with `meter` — how well it sorts,
 * with a tick at the best try so far. Lives in `SortingTree`'s `overlay`,
 * so it's in layout pixels.
 */
export function SplitScan({
  model,
  plan,
  candidate,
  picked,
  meter,
  columns,
}: {
  model: SortingModel;
  plan: ScanPlan;
  candidate: number;
  picked: boolean;
  meter: boolean;
  columns: AiLabColumn[];
}) {
  const laid = model.layout.byKey.get(plan.key);
  const tried = plan.candidates[candidate];
  if (!laid || !tried) return null;
  const indexOf = model.grouping.indexOf;
  const rank = (label: string) => {
    const index = indexOf(label);
    return index < 0 ? Infinity : index;
  };

  const position = plan.shown.indexOf(candidate);
  const triedSoFar = picked ? plan.shown : plan.shown.slice(0, position + 1);
  const bestSoFar = Math.max(
    ...triedSoFar.map((index) => plan.candidates[index]?.sortedShare ?? 0),
  );
  const untold = plan.checked - plan.shown.length;

  const branches = tried.branches.slice().sort((a, b) =>
    tried.splitType === "numerical" ? 0 : b.size - a.size,
  );
  const piles = branches.slice(0, MAX_PILES);
  const extra = branches.length - piles.length;
  const total = tried.branches.reduce((sum, branch) => sum + branch.size, 0);
  const unit = Math.max(1, Math.ceil(total / PREVIEW_DOTS));
  const name = columnById(columns, tried.feature)?.name ?? tried.feature;

  return (
    <div
      className={`${styles.panel} ${picked ? styles.panelPicked : ""}`}
      style={{
        left: laid.cx - PANEL_WIDTH / 2,
        top: laid.y + laid.height + PANEL_GAP,
        width: PANEL_WIDTH,
      }}
      aria-hidden
    >
      <div className={styles.head}>
        <span key={candidate} className={styles.question}>
          {name}?
        </span>
        {picked ? (
          <span className={styles.best}>
            <FaIcon name="circle-check" fontSize="11px" />
            Best
          </span>
        ) : untold > 0 ? (
          <span className={styles.more}>+{untold} more tried</span>
        ) : null}
      </div>
      <div key={candidate} className={styles.piles}>
        {piles.map((branch) => (
          <div key={branch.label} className={styles.pile}>
            <div className={styles.pileDots}>
              {Object.entries(branch.counts)
                .sort((a, b) => rank(a[0]) - rank(b[0]))
                .flatMap(([label, count]) =>
                  Array.from({ length: Math.max(1, Math.round(count / unit)) }, (_, i) => (
                    <span
                      key={`${label}-${i}`}
                      className={styles.dot}
                      style={{ background: labelFill(indexOf(label)) }}
                    />
                  )),
                )}
            </div>
            <span className={styles.pileLabel}>{branch.label}</span>
          </div>
        ))}
        {extra > 0 ? <span className={styles.pileMore}>+{extra}</span> : null}
      </div>
      {meter ? (
        <div className={styles.meter}>
          <span className={styles.meterLabel}>Sorts</span>
          <span className={styles.bar}>
            <span
              className={styles.fill}
              style={{ width: `${Math.round(tried.sortedShare * 100)}%` }}
            />
            <span
              className={styles.tick}
              style={{ left: `${Math.round(bestSoFar * 100)}%` }}
            />
          </span>
        </div>
      ) : null}
    </div>
  );
}
