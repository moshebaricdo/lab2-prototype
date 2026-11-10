import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { columnById, formatCell } from "../../../../lib/aiLab";
import type { AiLabColumn, AiLabDataRow } from "../../../../types/aiLab";
import type { TallyEntry } from "./trainingWalk";
import { labelFill } from "./viz/labelPalette";
import type { SortingModel } from "./viz/SortingTree";
import styles from "./TableSplit.module.scss";

/** Sheet rows drawn in phase 0; the rest are below the fold. */
const SHEET_ROWS = 16;
/** Golden angle, for sunflower packing. */
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
/** Gap under a cluster before its caption. */
const CAPTION_GAP = 14;
/** Gap between the "52 animals" caption and the legend under it. */
const LEGEND_GAP = 8;
/** Mirrors `.legendKeys` padding in `TreeTableRow.module.scss` (its items sit inside it). */
const STAGE_LEGEND_PAD = 4;

interface Mark {
  /** Stable key: `t<dotId>` for training dots, `h<index>` for test dots. */
  key: string;
  test: boolean;
  /** Sheet row this dot stands for (its color). */
  sheetIndex: number;
  /** Training dots: the tree dot it hands off to. */
  dotId?: number;
  fill: string;
}

interface Place {
  x: number;
  y: number;
  size: number;
  opacity: number;
}

/**
 * The opening of the "Split" story (`WalkState.split`). The same beats at
 * any sheet size, since the dots are capped like the tree's:
 *
 * 0. (`showSheet`) The Data Set sheet, just the chosen columns and the label.
 * 1. Grey dots bloom out from the canvas center into one cluster: "52 animals".
 * 2. They take their label colors, center out; the legend appears under
 *    the caption.
 * 3. The legend glides to the canvas's bottom-left (where the stage's own
 *    legend sits) and the caption goes.
 * 4. The cluster parts in two: Training and Testing.
 * 5. Focus on Training: it moves to the middle and grows; Testing drops
 *    into the tray, which slides up under the tree.
 * 6. The Training dots pour into the root pile; the stage's legend takes
 *    over from this one.
 */
export function TableSplit({
  columns,
  rows,
  titleColumn,
  features,
  labelColumn,
  trainSheetIndexes,
  holdout,
  model,
  tally,
  phase,
  instant,
  boardRef,
  rowNoun,
  showSheet = false,
  bloomMs,
  colorMs,
  legendMs,
  separateMs,
  focusMs,
  flyMs,
  flyStaggerMs,
}: {
  columns: AiLabColumn[];
  /** The whole sheet; marks index into it. */
  rows: AiLabDataRow[];
  titleColumn?: string;
  /** Chosen features, in sheet order. */
  features: string[];
  labelColumn: string;
  /** Sheet index of each training row, in the order the model's dots count them. */
  trainSheetIndexes: number[];
  /** Sheet indexes of the test rows. */
  holdout: number[];
  model: SortingModel;
  /** The stage's label key entries, so this legend matches it. */
  tally: TallyEntry[];
  phase: number;
  instant?: boolean;
  /**
   * The stage, to find the tray (`[data-dock-tray]`), the dots
   * (`[data-dot-id]`), and its legend (`[data-stage-legend]`).
   */
  boardRef: RefObject<HTMLDivElement | null>;
  /** What one row is ("animal"); captions say "row" without a title column. */
  rowNoun: string;
  showSheet?: boolean;
  bloomMs: number;
  colorMs: number;
  legendMs: number;
  separateMs: number;
  focusMs: number;
  flyMs: number;
  flyStaggerMs: number;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLSpanElement>(null);
  const legendRef = useRef<HTMLUListElement>(null);
  const dotRefs = useRef(new Map<string, HTMLSpanElement>());
  /** Where each dot was last sent, so the next move starts from there. */
  const placed = useRef(new Map<string, Place>());
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [legendBox, setLegendBox] = useState({ width: 0, captionH: 20 });
  const [legendHome, setLegendHome] = useState<{ x: number; y: number } | null>(null);
  /* Captions mount hidden and switch on a frame later, so their fade-in
     (and its delay) actually plays. */
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() =>
      requestAnimationFrame(() => setReady(true)),
    );
    return () => cancelAnimationFrame(frame);
  }, []);

  const leadTitle =
    titleColumn &&
    titleColumn !== labelColumn &&
    !features.includes(titleColumn)
      ? titleColumn
      : undefined;
  const sheetColumns = useMemo(
    () => [...(leadTitle ? [leadTitle] : []), ...features, labelColumn],
    [leadTitle, features, labelColumn],
  );
  const { indexOf } = model.grouping;
  const fillOf = (sheetIndex: number) =>
    labelFill(indexOf(String(rows[sheetIndex]?.[labelColumn] ?? "")));

  /* One mark per tree dot, plus test dots in the same proportion (so a
     condensed sheet stays 90 / 10), in sheet order. */
  const marks = useMemo<Mark[]>(() => {
    const train = model.dots.map((dot): Mark => {
      const sheetIndex = trainSheetIndexes[dot.rowIndex] ?? dot.rowIndex;
      return {
        key: `t${dot.id}`,
        test: false,
        sheetIndex,
        dotId: dot.id,
        fill: labelFill(indexOf(dot.label)),
      };
    });
    const testCount =
      holdout.length === 0
        ? 0
        : Math.max(1, Math.round(holdout.length / Math.max(1, model.rowsPerDot)));
    const test = sample(holdout, testCount).map(
      (sheetIndex, index): Mark => ({
        key: `h${index}`,
        test: true,
        sheetIndex,
        fill: labelFill(indexOf(String(rows[sheetIndex]?.[labelColumn] ?? ""))),
      }),
    );
    return [...train, ...test].sort((a, b) => a.sheetIndex - b.sheetIndex);
  }, [model, trainSheetIndexes, holdout, rows, labelColumn, indexOf]);
  const trainCount = marks.filter((mark) => !mark.test).length;
  const testCount = marks.length - trainCount;
  /* Smaller dots for a bigger crowd, so every cluster fits the canvas. */
  const dot = marks.length <= 70 ? 12 : marks.length <= 160 ? 9 : 7;
  const pitch = dot * 0.66;

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    /* Only on a real change: a fresh object would re-run the dot moves and
       replay them from where they already are (no motion). */
    const read = () =>
      setSize((was) =>
        was.width === root.clientWidth && was.height === root.clientHeight
          ? was
          : { width: root.clientWidth, height: root.clientHeight },
      );
    read();
    const observer = new ResizeObserver(read);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  /* Cluster geometry for the current size. The canvas is the top 437px of
     the overlay (the legend row sits under it). */
  const geometry = useMemo(() => {
    const { width } = size;
    const canvasH = Math.min(size.height, 437);
    const cy = canvasH * 0.42;
    const radius = (count: number, grow = 1) =>
      pitch * grow * Math.sqrt(Math.max(1, count)) + dot / 2;
    /* The two halves share a caption line, under the bigger one. */
    const pair = Math.max(radius(trainCount), radius(testCount));
    return {
      whole: { cx: width / 2, cy, r: radius(marks.length) },
      train: { cx: width * 0.4, cy, r: radius(trainCount), captionR: pair },
      test: { cx: width * 0.78, cy, r: radius(testCount), captionR: pair },
      focus: { cx: width / 2, cy, r: radius(trainCount, 1.15) },
    };
  }, [size, pitch, dot, marks.length, trainCount, testCount]);

  /** Sunflower spot `rank` of a cluster centered on (cx, cy). */
  const spot = (rank: number, cx: number, cy: number, grow = 1) => {
    const r = pitch * grow * Math.sqrt(rank + 0.5);
    const a = rank * GOLDEN;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };

  /* The legend's two homes: centered under the caption, then the stage
     legend's spot (its layout box, ignoring the entrance offset). */
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || size.width === 0) return;
    setLegendBox({
      width: legendRef.current?.offsetWidth ?? 0,
      captionH: captionRef.current?.offsetHeight ?? 20,
    });
    /* The overlay sits at the board's top-left, the keys' offset parent,
       so their layout offsets (no entrance transform) are its coordinates. */
    const keys = boardRef.current?.querySelector<HTMLElement>("[data-legend-keys]");
    if (!keys) return;
    setLegendHome({
      x: keys.offsetLeft + STAGE_LEGEND_PAD,
      y: keys.offsetTop + STAGE_LEGEND_PAD,
    });
  }, [size, boardRef, tally]);

  /* Each phase sends every dot somewhere; moves start where it last was. */
  useLayoutEffect(() => {
    const root = rootRef.current;
    const board = boardRef.current;
    if (!root || !board || size.width === 0 || phase < 1) {
      placed.current.clear();
      return;
    }
    const r = root.getBoundingClientRect();
    const tray = board.querySelector("[data-dock-tray]")?.getBoundingClientRect();
    const { whole, train, test, focus } = geometry;
    const trainRank = new Map<string, number>();
    const testRank = new Map<string, number>();
    marks.forEach((mark) =>
      mark.test
        ? testRank.set(mark.key, testRank.size)
        : trainRank.set(mark.key, trainRank.size),
    );

    /* Phases 1–3 share one cluster; each dot starts as a point at the
       canvas center. */
    const startOf = (): Place => ({ x: whole.cx, y: whole.cy, size: 0.01, opacity: 0 });
    const targetOf = (mark: Mark, index: number): Place => {
      if (phase <= 3) {
        return { ...spot(index, whole.cx, whole.cy), size: dot, opacity: 1 };
      }
      if (mark.test) {
        const rank = testRank.get(mark.key) ?? 0;
        if (phase === 4) {
          return { ...spot(rank, test.cx, test.cy), size: dot, opacity: 1 };
        }
        /* Into the tray's row, then gone: the tray holds them now. */
        const x = tray ? tray.left - r.left + tray.width / 2 : test.cx;
        const y = tray ? tray.top - r.top + tray.height / 2 : size.height;
        return { ...spot(rank, x, y, 0.5), size: dot * 0.6, opacity: 0 };
      }
      const rank = trainRank.get(mark.key) ?? 0;
      if (phase === 4) {
        return { ...spot(rank, train.cx, train.cy), size: dot, opacity: 1 };
      }
      if (phase === 5) {
        return { ...spot(rank, focus.cx, focus.cy, 1.15), size: dot, opacity: 1 };
      }
      /* Phase 6: onto its own dot in the root pile. */
      const target = board.querySelector(`[data-dot-id="${mark.dotId}"]`);
      if (!target) return { ...spot(rank, focus.cx, focus.cy, 1.15), size: dot, opacity: 0 };
      const t = target.getBoundingClientRect();
      return {
        x: t.left - r.left + t.width / 2,
        y: t.top - r.top + t.height / 2,
        size: t.width,
        opacity: 1,
      };
    };
    const transformOf = (p: Place) =>
      `translate(${p.x - p.size / 2}px, ${p.y - p.size / 2}px) scale(${p.size / dot})`;

    /* Phases 2 and 3 move nothing (color and legend only). */
    const timing =
      phase === 1
        ? { ms: bloomMs, stagger: bloomMs * 0.55, ease: "cubic-bezier(0.2, 0.8, 0.2, 1)" }
        : phase === 4
          ? { ms: separateMs, stagger: 120, ease: "cubic-bezier(0.55, 0, 0.25, 1)" }
          : phase === 5
            ? { ms: focusMs, stagger: 0, ease: "cubic-bezier(0.4, 0, 0.2, 1)" }
            : phase === 6
              ? { ms: flyMs, stagger: flyStaggerMs, ease: "cubic-bezier(0.55, 0, 0.25, 1)" }
              : undefined;

    if (phase === 1 && !instant) {
      const targets = marks.map((mark, index) => {
        const to = targetOf(mark, index);
        placed.current.set(mark.key, to);
        return to;
      });
      return bloom({
        els: marks.map((mark) => dotRefs.current.get(mark.key)),
        targets,
        center: whole,
        dot,
        timeScale: BLOOM_BASE_MS / Math.max(1, bloomMs),
        transformOf,
      });
    }

    const animations: Animation[] = [];
    marks.forEach((mark, index) => {
      const el = dotRefs.current.get(mark.key);
      if (!el) return;
      const to = targetOf(mark, index);
      const from = placed.current.get(mark.key) ?? startOf();
      placed.current.set(mark.key, to);
      el.style.transform = transformOf(to);
      el.style.opacity = String(to.opacity);
      if (instant || !timing) return;
      /* Bloom: center out (sunflower rank is distance from the center). */
      const order =
        phase === 1
          ? index / Math.max(1, marks.length)
          : mark.test
            ? (testRank.get(mark.key) ?? 0) / Math.max(1, testCount)
            : (trainRank.get(mark.key) ?? 0) / Math.max(1, trainCount);
      animations.push(
        el.animate(
          [
            { transform: transformOf(from), opacity: from.opacity },
            { transform: transformOf(to), opacity: to.opacity },
          ],
          {
            duration: timing.ms,
            delay: Math.round(order * timing.stagger),
            easing: timing.ease,
            fill: "backwards",
          },
        ),
      );
    });
    return () => animations.forEach((animation) => animation.cancel());
    /* Re-run per phase (and on resize); the geometry callbacks close over it. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, size, instant, marks]);

  const unit = titleColumn ? rowNoun : "row";
  const noun = (count: number) => `${count.toLocaleString()} ${unit}${count === 1 ? "" : "s"}`;
  const caption = (
    text: string,
    at: { cx: number; cy: number; r: number; captionR?: number },
    on: boolean,
    tone?: "train" | "test",
    ref?: RefObject<HTMLSpanElement | null>,
    delayMs?: number,
  ) => (
    <span
      ref={ref}
      className={`${styles.caption} ${on && (ready || instant) ? styles.captionOn : ""} ${
        tone === "test" ? styles.captionTest : tone === "train" ? styles.captionTrain : ""
      }`}
      style={{
        left: at.cx,
        top: at.cy + (at.captionR ?? at.r) + CAPTION_GAP,
        transitionDelay: on && delayMs !== undefined && !instant ? `${delayMs}ms` : undefined,
      }}
    >
      {text}
    </span>
  );

  const wholeCaptionTop = geometry.whole.cy + geometry.whole.r + CAPTION_GAP;
  const legendCentered = {
    x: geometry.whole.cx - legendBox.width / 2,
    y: wholeCaptionTop + legendBox.captionH + LEGEND_GAP,
  };
  const legendAt = phase >= 3 && legendHome ? legendHome : legendCentered;

  return (
    <div
      ref={rootRef}
      className={styles.split}
      style={
        {
          "--split-color": `${colorMs}ms`,
          "--split-legend": `${legendMs}ms`,
          "--dot": `${dot}px`,
        } as CSSProperties
      }
      aria-hidden
    >
      {showSheet ? (
        <div className={`${styles.sheet} ${phase >= 1 ? styles.sheetGone : ""}`}>
          <div className={`${styles.row} ${styles.head}`}>
            <span className={styles.thIndex} />
            {sheetColumns.map((id) => (
              <span
                key={id}
                className={[
                  styles.th,
                  id === labelColumn ? styles.thLabel : id === leadTitle ? "" : styles.thFeature,
                ].join(" ")}
              >
                {columnById(columns, id)?.name ?? id}
              </span>
            ))}
          </div>
          {rows.slice(0, SHEET_ROWS).map((record, sheetIndex) => (
            <div key={sheetIndex} className={styles.row}>
              <span className={styles.tdIndex}>{sheetIndex + 1}</span>
              {sheetColumns.map((id) => (
                <span
                  key={id}
                  className={[
                    styles.td,
                    id === labelColumn ? styles.tdLabel : id === leadTitle ? "" : styles.tdFeature,
                  ].join(" ")}
                >
                  {id === labelColumn ? (
                    <span className={styles.labelDot} style={{ background: fillOf(sheetIndex) }} />
                  ) : null}
                  {record[id] === undefined ? "—" : formatCell(record[id]!)}
                </span>
              ))}
            </div>
          ))}
        </div>
      ) : null}

      {marks.map((mark, index) => (
        <span
          key={mark.key}
          ref={(el) => {
            if (el) dotRefs.current.set(mark.key, el);
            else dotRefs.current.delete(mark.key);
          }}
          className={styles.dot}
          style={{
            opacity: 0,
            /* Grey until phase 2, then its label's color, center out. */
            background: phase >= 2 ? mark.fill : undefined,
            transitionDelay:
              phase === 2 && !instant
                ? `${Math.round((index / Math.max(1, marks.length)) * colorMs * 0.5)}ms`
                : undefined,
          }}
        />
      ))}

      {size.width > 0 ? (
        <>
          {caption(
            noun(rows.length),
            geometry.whole,
            phase >= 1 && phase <= 2,
            undefined,
            captionRef,
            /* After the bloom fills in, not as it starts. */
            phase === 1 ? Math.round(bloomMs * 0.85) : undefined,
          )}
          {caption(`Training · ${noun(trainSheetIndexes.length)}`, geometry.train, phase === 4, "train")}
          {caption(`Testing · ${noun(holdout.length)}`, geometry.test, phase === 4, "test")}
          {caption(`Training · ${noun(trainSheetIndexes.length)}`, geometry.focus, phase === 5, "train")}
          <ul
            ref={legendRef}
            className={[
              styles.legend,
              phase >= 2 && phase < 6 ? styles.legendOn : "",
              phase >= 3 ? styles.legendMoving : "",
            ].join(" ")}
            style={{ transform: `translate(${legendAt.x}px, ${legendAt.y}px)` }}
          >
            {tally.map((entry) => (
              <li key={entry.label} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: entry.fill }} />
                {entry.label.trim() === "" ? "(blank)" : entry.label}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

/** The bloom's tuning is in sim seconds at this `bloomMs`; the slider scales time. */
const BLOOM_BASE_MS = 900;
/** Sim seconds over which the dots spawn, center first. */
const SPAWN_WINDOW = 0.55;
/** A dot scales up from nothing over this long after it spawns. */
const POP_IN = 0.16;
/** Spring pulling each dot to its spot, and the damping on it (a little under critical, for a settle with some give). */
const SPRING = 75;
const DAMPING = 10;
/** How hard dots bounce off each other (0 dead, 1 elastic). */
const RESTITUTION = 0.55;
/** Outward kick a dot spawns with, px per sim second. */
const KICK = [90, 220] as const;
/** Give up and snap after this many sim seconds past the last spawn. */
const SETTLE_MAX = 2.2;

/**
 * Phase 1: grey dots spawn at the center one after another (center out),
 * each with a random outward kick, spring toward their own spot in the
 * cluster, and bump off the dots already there, so the cluster fills from
 * the middle and jostles as it grows. Collisions only fire in transit (the
 * spots are spaced wider than a dot), so it always settles exactly on the
 * spots the later beats start from. Returns a cancel.
 */
function bloom({
  els,
  targets,
  center,
  dot,
  timeScale,
  transformOf,
}: {
  els: (HTMLSpanElement | undefined)[];
  targets: Place[];
  center: { cx: number; cy: number };
  dot: number;
  timeScale: number;
  transformOf: (place: Place) => string;
}): () => void {
  const n = targets.length;
  const px = new Float64Array(n).fill(center.cx);
  const py = new Float64Array(n).fill(center.cy);
  const vx = new Float64Array(n);
  const vy = new Float64Array(n);
  const born = new Float64Array(n).fill(-1);
  const random = seeded(n * 7919 + 17);
  const spawnAt = targets.map((_, i) => (i / Math.max(1, n)) * SPAWN_WINDOW);
  const minD = dot * 1.02;
  const minD2 = minD * minD;
  els.forEach((el) => {
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = transformOf({ x: center.cx, y: center.cy, size: 0.01, opacity: 0 });
  });

  let simT = 0;
  let last = performance.now();
  let frame = 0;
  let live = 0;
  const step = (dt: number) => {
    simT += dt;
    while (live < n && spawnAt[live]! <= simT) {
      const angle = random() * Math.PI * 2;
      const speed = KICK[0] + random() * (KICK[1] - KICK[0]);
      px[live] = center.cx + Math.cos(angle) * 0.5;
      py[live] = center.cy + Math.sin(angle) * 0.5;
      vx[live] = Math.cos(angle) * speed;
      vy[live] = Math.sin(angle) * speed;
      born[live] = simT;
      live += 1;
    }
    for (let i = 0; i < live; i += 1) {
      vx[i] += (SPRING * (targets[i]!.x - px[i]!) - DAMPING * vx[i]!) * dt;
      vy[i] += (SPRING * (targets[i]!.y - py[i]!) - DAMPING * vy[i]!) * dt;
      px[i] += vx[i]! * dt;
      py[i] += vy[i]! * dt;
    }
    /* Push overlapping pairs apart and trade their closing speed. */
    for (let i = 0; i < live; i += 1) {
      for (let j = i + 1; j < live; j += 1) {
        const dx = px[j]! - px[i]!;
        const dy = py[j]! - py[i]!;
        const d2 = dx * dx + dy * dy;
        if (d2 >= minD2) continue;
        const d = Math.sqrt(d2) || 0.01;
        const nx = d2 === 0 ? 1 : dx / d;
        const ny = d2 === 0 ? 0 : dy / d;
        const push = (minD - d) / 2;
        px[i] -= nx * push;
        py[i] -= ny * push;
        px[j] += nx * push;
        py[j] += ny * push;
        const closing = (vx[j]! - vx[i]!) * nx + (vy[j]! - vy[i]!) * ny;
        if (closing < 0) {
          const impulse = (-(1 + RESTITUTION) * closing) / 2;
          vx[i] -= impulse * nx;
          vy[i] -= impulse * ny;
          vx[j] += impulse * nx;
          vy[j] += impulse * ny;
        }
      }
    }
  };

  const paint = () => {
    for (let i = 0; i < n; i += 1) {
      const el = els[i];
      if (!el || born[i]! < 0) continue;
      const age = (simT - born[i]!) / POP_IN;
      const grow = age >= 1 ? 1 : easeOutBack(Math.max(0, age));
      el.style.opacity = "1";
      el.style.transform = transformOf({ x: px[i]!, y: py[i]!, size: dot * grow, opacity: 1 });
    }
  };

  const settled = () => {
    if (live < n) return false;
    for (let i = 0; i < n; i += 1) {
      if (Math.abs(vx[i]!) + Math.abs(vy[i]!) > 4) return false;
      if (Math.abs(targets[i]!.x - px[i]!) + Math.abs(targets[i]!.y - py[i]!) > 0.6) return false;
    }
    return true;
  };

  const finish = () => {
    els.forEach((el, i) => {
      if (!el) return;
      el.style.opacity = "1";
      el.style.transform = transformOf(targets[i]!);
    });
  };

  const tick = (now: number) => {
    /* Two fixed substeps a frame keep collisions stable at any frame rate. */
    const dt = (Math.min(48, now - last) / 1000) * timeScale;
    last = now;
    step(dt / 2);
    step(dt / 2);
    paint();
    if (settled() || simT > SPAWN_WINDOW + SETTLE_MAX) {
      finish();
      return;
    }
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(frame);
    finish();
  };
}

function easeOutBack(t: number): number {
  const c = 1.70158;
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
}

/** Deterministic 0–1 noise, so a replay blooms the same way. */
function seeded(seed: number): () => number {
  let state = seed >>> 0 || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/** Evenly spaced picks across `list`, in order, when it's longer than `cap`. */
function sample(list: number[], cap: number): number[] {
  if (list.length <= cap) return list;
  return Array.from(
    { length: cap },
    (_, index) =>
      list[Math.min(list.length - 1, Math.floor(((index + 0.5) * list.length) / cap))]!,
  );
}
