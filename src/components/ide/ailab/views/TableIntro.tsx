import { useLayoutEffect, useMemo, useRef, type CSSProperties } from "react";
import { columnById, formatCell } from "../../../../lib/aiLab";
import type { AiLabColumn, AiLabDataRow } from "../../../../types/aiLab";
import { INTRO_FILTER_MS, INTRO_SCROLL_MS } from "./trainingWalk";
import styles from "./TableIntro.module.scss";

/**
 * One sheet row on the training dock's reel (`TreeTableRow`): the dock's
 * columns with its tints, 29px tall so its bottom rule falls just outside
 * the 28px reel window, matching the dock's own row when it stops.
 */
export function ReelRow({
  columns,
  record,
  rowIndex,
  titleColumn,
  features,
  labelColumn,
  dotFill,
}: {
  columns: AiLabColumn[];
  record: AiLabDataRow;
  rowIndex: number;
  titleColumn?: string;
  features: string[];
  labelColumn: string;
  /** Shows the label's dot (the rows that are, or were, in the dock). */
  dotFill?: string;
}) {
  const text = (id: string) =>
    record[id] === undefined ? "—" : formatCell(record[id]!);
  const numeric = (id: string) =>
    columnById(columns, id)?.type === "numerical" ? styles.numeric : "";
  const leadTitle =
    titleColumn &&
    titleColumn !== labelColumn &&
    !features.includes(titleColumn)
      ? titleColumn
      : undefined;
  return (
    <div className={`${styles.row} ${styles.reelRow}`}>
      <span className={styles.tdIndex}>{rowIndex + 1}</span>
      {leadTitle ? (
        <span className={styles.td}>{text(leadTitle)}</span>
      ) : null}
      {features.map((id) => (
        <span
          key={id}
          className={`${styles.td} ${styles.tdFeature} ${numeric(id)}`}
        >
          {text(id)}
        </span>
      ))}
      <span className={`${styles.td} ${styles.tdLabel}`}>
        <span
          className={`${styles.labelDot} ${dotFill ? styles.labelDotOn : ""}`}
          style={dotFill ? { background: dotFill } : undefined}
        />
        {text(labelColumn)}
      </span>
    </div>
  );
}

/** Rows the wheel spins past before it lands. */
const SPIN_ROWS = 64;
/** Rows under the landed one, so the window stays full while it slows. */
const TAIL_ROWS = 18;
/** Mirrors the 28px cells in the SCSS. */
const ROW_HEIGHT = 28;
/** How far the wheel coasts past its row before settling back. */
const OVERSHOOT = 7;
/** Share of the spin before the window starts closing down to one row. */
const SHRINK_FROM = 0.35;

/**
 * The opening of the "Table to tree" story (`WalkState.intro`): the Data
 * Set sheet fills the canvas, narrows to the title column, the chosen
 * features, and the label (right-most) (phase 1), then spins like a lotto
 * wheel while its window closes down to one row, stopping on the first
 * training row right under the header (2). The tree appears around it (3);
 * the header and that row sit exactly over the training dock, which takes
 * over when this unmounts.
 */
export function TableIntro({
  columns,
  rows,
  titleColumn,
  features,
  labelColumn,
  target,
  fill,
  phase,
  instant,
}: {
  columns: AiLabColumn[];
  rows: AiLabDataRow[];
  titleColumn?: string;
  features: string[];
  labelColumn: string;
  /** Row index the wheel lands on (the first training row). */
  target: number;
  /** The landed row's label color (its dot appears as it lands). */
  fill: string;
  phase: number;
  instant?: boolean;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const leadTitle =
    titleColumn &&
    titleColumn !== labelColumn &&
    !features.includes(titleColumn)
      ? titleColumn
      : undefined;
  const order = useMemo(() => {
    const rest = columns
      .map((column) => column.id)
      .filter((id) => id !== labelColumn && id !== leadTitle);
    return [...(leadTitle ? [leadTitle] : []), ...rest, labelColumn];
  }, [columns, labelColumn, leadTitle]);
  const shown = useMemo(() => {
    if (rows.length === 0) return [];
    const cycle = (count: number, from: number) =>
      Array.from({ length: count }, (_, index) => (from + index) % rows.length);
    return [
      ...cycle(SPIN_ROWS, 0),
      target,
      ...cycle(TAIL_ROWS, target + 1),
    ];
  }, [rows.length, target]);
  const land = -SPIN_ROWS * ROW_HEIGHT;
  const narrowed = phase >= 1;
  const spinning = phase >= 2;
  const landed = phase >= 3;

  useLayoutEffect(() => {
    const body = bodyRef.current;
    const view = windowRef.current;
    if (!body || !view) return;
    if (!spinning) {
      body.style.transform = "";
      view.style.flex = "";
      view.style.height = "";
      return;
    }
    if (instant || landed) {
      body.style.transform = `translateY(${land}px)`;
      view.style.flex = "none";
      view.style.height = `${ROW_HEIGHT}px`;
      return;
    }
    /* The window closes down to one row while the wheel slows, so it stops
       on just the landed row. */
    const from = view.getBoundingClientRect().height;
    view.style.flex = "none";
    view.style.height = `${ROW_HEIGHT}px`;
    const close = view.animate(
      [
        { height: `${from}px` },
        { offset: SHRINK_FROM, height: `${from}px`, easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
        { height: `${ROW_HEIGHT}px` },
      ],
      { duration: INTRO_SCROLL_MS * 0.9 },
    );
    const spin = body.animate(
      [
        { transform: "translateY(0)", easing: "cubic-bezier(0.55, 0, 0.3, 1)" },
        {
          offset: 0.88,
          transform: `translateY(${land - OVERSHOOT}px)`,
          easing: "cubic-bezier(0.3, 0, 0.3, 1)",
        },
        { transform: `translateY(${land}px)` },
      ],
      { duration: INTRO_SCROLL_MS, fill: "forwards" },
    );
    spin.onfinish = () => {
      body.style.transform = `translateY(${land}px)`;
      spin.cancel();
    };
    return () => {
      spin.cancel();
      close.cancel();
    };
  }, [spinning, landed, instant, land]);

  const cellClass = (id: string, head: boolean) => {
    const role =
      id === labelColumn
        ? "label"
        : id === leadTitle
          ? "title"
          : features.includes(id)
            ? "feature"
            : "gone";
    return [
      head ? styles.th : styles.td,
      columnById(columns, id)?.type === "numerical" ? styles.numeric : "",
      role === "gone" && narrowed ? styles.gone : "",
      role === "feature" && narrowed
        ? head
          ? styles.thFeature
          : styles.tdFeature
        : "",
      role === "label" && narrowed
        ? head
          ? styles.thLabel
          : styles.tdLabel
        : "",
    ]
      .filter(Boolean)
      .join(" ");
  };

  return (
    <div
      className={styles.intro}
      style={{ "--intro-filter": `${INTRO_FILTER_MS}ms` } as CSSProperties}
      aria-hidden
    >
      <div className={`${styles.row} ${styles.head}`}>
        <span className={styles.thIndex} />
        {order.map((id) => (
          <span key={id} className={cellClass(id, true)}>
            {columnById(columns, id)?.name ?? id}
          </span>
        ))}
      </div>
      <div ref={windowRef} className={styles.window}>
        <div ref={bodyRef} className={styles.body}>
          {shown.map((rowIndex, index) => {
            const isTarget = index === SPIN_ROWS;
            return (
              <div key={index} className={styles.row}>
                <span className={styles.tdIndex}>{rowIndex + 1}</span>
                {order.map((id) => (
                  <span key={id} className={cellClass(id, false)}>
                    {id === labelColumn ? (
                      <span
                        className={`${styles.labelDot} ${isTarget && landed ? styles.labelDotOn : ""}`}
                        style={isTarget ? { background: fill } : undefined}
                      />
                    ) : null}
                    {rows[rowIndex]![id] === undefined
                      ? "—"
                      : formatCell(rows[rowIndex]![id]!)}
                  </span>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
