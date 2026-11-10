import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { DialTimelineValues, TransitionConfig } from "dialkit";
import { FaIcon } from "@moshebari/cads-react/icons";
import { columnById, formatCell, traceDecisionTree } from "../../../../../lib/aiLab";
import { PredictionStatement } from "../PredictionStatement";
import { formatAccuracyPercent } from "../ResultsModal";
import type { TrainingWalk, TrainingWalkData } from "../trainingWalk";
import { labelFill, OTHER_LABEL_INDEX } from "../viz/labelPalette";
import type { LaidOutNode, TreeLayout } from "../viz/treeLayout";
import {
  recordBloom,
  sampleBloom,
  sunflower,
  type BloomPhysics,
} from "./bloomSim";
import { ACT3_ANCHOR, SPLIT_INTRO_TIMELINE } from "./splitIntroTimeline";
import styles from "./SplitIntroStage.module.scss";

export type SplitIntroTimeline = DialTimelineValues<typeof SPLIT_INTRO_TIMELINE>;

/** How the tree's later levels speed up after the root's split. */
export interface TreePace {
  /** Each level takes this share of the previous level's time (1 = even). */
  falloff: number;
  /** No level is quicker than this, in seconds. */
  minLevel: number;
}

export const DEFAULT_TREE_PACE: TreePace = { falloff: 0.85, minLevel: 0.7 };

/** Testing-act options from the sandbox's panel. */
export interface TestingOptions {
  /** The first test row rides with a card of its own values. */
  rowCard: boolean;
}

/** The tree canvas (Figma Training/Testing modal) and the key row under it. */
const CANVAS_H = 437;
const KEY_ROW_H = 44;
const FIELD_H = CANVAS_H + KEY_ROW_H;
/** Figma: caption 18px under a cluster; a key 4px under its 22px caption. */
const CAPTION_GAP = 18;
const CAPTION_LINE = 22;
const KEY_GAP = 4;
/** Figma: keys sit 16px in from the sides and 14px up from the bottom. */
const KEY_INSET = { x: 16, bottom: 14 };
const KEY_H = 18;
/** Figma: the two halves sit this share of the width either side of center. */
const SPLIT_OFFSET = 123 / 800;
/** The pile tree: room above the root, below the leaves (labels), and at the sides. */
const TREE_TOP = 16;
const TREE_BOTTOM = 12;
const TREE_SIDE = 24;
/** A question chip and the gap between it and its pile. */
const CHIP_H = 24;
const CHIP_GAP = 6;
/** Room for a link (and its answer) between levels, and a leaf's label. */
const LINK_BAND = 48;
/** An answer sits this far above its child, on the connector's last stub. */
const ANSWER_GAP = 6;
const LABEL_BAND = 24;
/** Sibling piles' least gap. */
const LANE_GAP = 16;
/**
 * To fit, the dots shrink first (to this share; words keep their size),
 * then the whole tree zooms out, words and all.
 */
const DOT_FLOOR = 0.5;
/** Within each later level's slice: the share spent asking before the split. */
const ASK_SHARE = 0.35;
/** Share of a split spent waiting for later dots, so a pile pours rather than jumps. */
const SPLIT_STAGGER = 0.3;
/** Where the test pile leaves to: past the canvas's right edge. */
const PARK_OUT = 80;
/**
 * A big tree grows only the levels that fit at this zoom or closer; the
 * questions below collapse into "+N more questions".
 */
const CAMERA_FLOOR = 0.75;
/**
 * The testing corner, top right: the row card, the test rows' cluster
 * under it; the card becomes the score. Its width and inset.
 */
/* Figma's card is 140; a little wider so "AI predicts" and a label both fit. */
const CORNER_W = 152;
const CORNER_INSET = 24;
/** From the card's bottom to the test cluster's top. */
const CARD_TO_CLUSTER = 16;
/** Row card (Figma): header row, value lines, their gap, body padding. */
const CARD_EDGE_ROW = 27;
const CARD_LINE = 18;
const CARD_LINE_GAP = 4;
const CARD_PAD = 6;
/** Its footer: the real label, then "AI predicts" (two lines, padding, rule). */
const CARD_FOOTER = 2 * CARD_LINE + CARD_LINE_GAP + 8 + 1;
/** The results card it becomes: two lines. */
const RESULT_H = 54;
/** Landed test rows sit this far right of their leaf's pile (fit only). */
const TEST_GAP = 6;
/** Test rows tested one after another; the score covers them all. */
const TRAVELERS = 5;
/** A test row's least dot size (px), however far the tree zoomed out. */
const MIN_TEST_DOT = 8;
/**
 * A test's units: its dot lights in the cluster (\`LIGHT\`); each question
 * on its path lights (\`DWELL\`) and the link it takes draws (1); the dot
 * flies into its leaf's pile (\`FLY\`); "AI predicts" fills in (\`REVEAL\`).
 */
const LIGHT = 0.6;
const DWELL = 0.7;
const FLY = 1.2;
const REVEAL = 0.6;
/** Then the answer holds a moment before the next row. */
const HOLD = 1.2;
/** A flying test dot's arc (px), and a lit one's grow. */
const FLY_ARC = 28;
const LIT_GROW = 1.3;
/** Seconds the card and the lit path take to hand over to the next row. */
const ROW_SWAP = 0.18;
/** Share of the tint spent waiting for outer dots (center out). */
const TINT_STAGGER = 0.5;
const GREY = "var(--background-neutral-septenary)";
/** The lit path's color: a test row's dot while it is under test. */
const LIT = "var(--border-selected-primary)";

interface Mark {
  key: string;
  test: boolean;
  sheetIndex: number;
  dotId?: number;
  fill: string;
}

interface Point {
  x: number;
  y: number;
}

/** One node of the pile tree, in overlay px. */
interface Pile extends Point {
  laid: LaidOutNode;
  /** This pile's dot size and spacing: each pile fits its own room. */
  dot: number;
  pitch: number;
  /** Radius of the full pile. */
  r: number;
  /** Dot id → its spot rank in this pile. */
  rank: Map<number, number>;
}

/**
 * The split intro, drawn entirely from the timeline's current values, so
 * it is exactly at the playhead whether playing, paused, or scrubbing.
 * Figma: AI Lab 2, "initial bloom" → "colors appear" → "content separates".
 */
export function SplitIntroStage({
  data,
  walk,
  timeline,
  physics,
  pace,
  testing,
}: {
  data: TrainingWalkData;
  /** The `split` walk: its model, holdout, and tally. */
  walk: TrainingWalk;
  timeline: SplitIntroTimeline;
  physics: BloomPhysics;
  pace: TreePace;
  testing: TestingOptions;
}) {
  const { columns, labelColumn, features, rows, titleColumn, rowNoun, labels } = data;
  const { model, holdout, trainSheetIndexes, tally, testResults, score } = walk;
  const { indexOf } = model.grouping;
  const fieldRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  const [keyWidths, setKeyWidths] = useState({ legend: 0, scale: 0 });

  /* ── Marks: one per tree dot, plus test dots in the same proportion ── */
  const marks = useMemo<Mark[]>(() => {
    const train = model.dots.map((dot): Mark => ({
      key: `t${dot.id}`,
      test: false,
      sheetIndex: trainSheetIndexes[dot.rowIndex] ?? dot.rowIndex,
      dotId: dot.id,
      fill: labelFill(indexOf(dot.label)),
    }));
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
  const ranks = useMemo(() => {
    const train = new Map<string, number>();
    const test = new Map<string, number>();
    marks.forEach((mark) =>
      mark.test ? test.set(mark.key, test.size) : train.set(mark.key, train.size),
    );
    return { train, test };
  }, [marks]);
  /* ── Test runs: each test dot's row, its real path, and how it scored.
     Travelers first: a right guess leads (a clean first walk), a miss is
     among the five when there is one, and endings vary where they can. ── */
  const runs = useMemo(() => {
    const byRow = new Map(testResults.map((result) => [result.rowIndex, result]));
    const all = marks
      .filter((mark) => mark.test)
      .map((mark) => {
        const row = rows[mark.sheetIndex];
        return {
          mark,
          result: byRow.get(mark.sheetIndex),
          path: row ? traceDecisionTree(data.tree, row).pathKeys : [model.layout.nodes[0]!.key],
        };
      });
    const picked: typeof all = [];
    const take = (run: (typeof all)[number] | undefined) => {
      if (run && !picked.includes(run) && picked.length < TRAVELERS) picked.push(run);
    };
    take(all.find((run) => run.result?.correct));
    const ends = new Set(picked.map((run) => run.path[run.path.length - 1]));
    all.forEach((run) => {
      const end = run.path[run.path.length - 1];
      if (!ends.has(end) && picked.length < TRAVELERS - 1) {
        take(run);
        ends.add(end);
      }
    });
    take(all.find((run) => run.result && !run.result.correct && !picked.includes(run)));
    all.forEach(take);
    return [...picked, ...all.filter((run) => !picked.includes(run))];
  }, [marks, rows, testResults, data.tree, model.layout]);
  const runOf = useMemo(
    () => new Map(runs.map((run, order) => [run.mark.key, { ...run, order }])),
    [runs],
  );
  const trainMarks = ranks.train.size;
  const testMarks = ranks.test.size;
  /* Smaller dots for a bigger crowd, so every cluster fits the canvas. */
  const dot = marks.length <= 70 ? 12 : marks.length <= 160 ? 9 : 7;
  const pitch = dot * 0.66;
  const recording = useMemo(
    () => recordBloom(marks.length, dot, pitch, physics),
    [marks.length, dot, pitch, physics],
  );

  /* ── Measurements: width and key widths ── */
  useLayoutEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    const measure = () => {
      setWidth((was) => (was === field.clientWidth ? was : field.clientWidth));
      setKeyWidths((was) => {
        const legend = legendRef.current?.offsetWidth ?? 0;
        const scale = scaleRef.current?.offsetWidth ?? 0;
        return was.legend === legend && was.scale === scale ? was : { legend, scale };
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(field);
    return () => observer.disconnect();
  }, [model, tally]);

  /* ── The pile tree, one fitted frame per level shown: frame k holds the
     nodes down to depth k, each as wide as its pile or its words, and is
     zoomed out (dots and all, words never) until it fits the canvas ── */
  const growth = useMemo(() => {
    const { layout, members } = model;
    const deepest = Math.max(0, ...layout.nodes.map((laid) => laid.depth));
    const measureText = textMeasurer(fieldRef.current);
    /* Every question it hides, per node: its "+N more questions". */
    const hidden = new Map<string, number>();
    const countQuestions = (laid: LaidOutNode): number => {
      const below = laid.childKeys.reduce(
        (sum, key) => sum + countQuestions(layout.byKey.get(key)!),
        0,
      );
      const total = below + (laid.node.type === "decision" ? 1 : 0);
      hidden.set(laid.key, total);
      return total;
    };
    countQuestions(layout.nodes[0]!);
    const words = new Map(
      layout.nodes.map((laid) => [
        laid.key,
        {
          /* A question chip, or the "+N more" chip it may collapse into. */
          chip:
            Math.max(
              measureText(questionText(laid, columns)),
              measureText(moreText(hidden.get(laid.key) ?? 0)),
            ) + 22,
          label:
            laid.node.type === "leaf" ? measureText(laid.node.prediction) + 14 : 0,
          /* Its answer on the link in: siblings' answers must not touch. */
          branch: laid.branchLabel ? Math.min(132, measureText(laid.branchLabel) + 20) + 8 : 0,
        },
      ]),
    );
    const counts = new Map(
      layout.nodes.map((laid) => [laid.key, members.get(laid.key)?.length ?? 0]),
    );
    /* \`right\`: width kept clear at the right (the tree fits what's left). */
    const fit = (k: number, tests: Map<string, number>, _unused = 0, right = 0) =>
      fitFrame(layout, k, counts, words, tests, width - right, dot, pitch);
    /* Grow only the levels that fit at a readable zoom. */
    let cap = deepest;
    for (let k = 1; k <= deepest; k += 1) {
      if (fit(k, new Map()).camera < CAMERA_FLOOR) {
        cap = k - 1;
        break;
      }
    }
    /* Never hide just one question: a lone "+1 more" says less than the question. */
    while (
      cap < deepest &&
      layout.nodes.some(
        (laid) => laid.depth === cap && laid.node.type === "decision",
      ) &&
      layout.nodes
        .filter((laid) => laid.depth === cap && laid.node.type === "decision")
        .every((laid) => (hidden.get(laid.key) ?? 0) <= 1)
    ) {
      cap += 1;
    }
    /* Where each test row ends, in the tree as shown. Tested rows join
       their pile, so no lane needs room beside it (\`tests\` stays empty). */
    const endOf = new Map<string, string>();
    const tests = new Map<string, number>();
    runs.forEach((run) => {
      endOf.set(run.mark.key, run.path[Math.min(cap, run.path.length - 1)]!);
    });
    const fitted = Array.from({ length: cap + 1 }, (_, k) => fit(k, tests));
    /* The testing corner: the row card, then the test cluster. Top right
       if the finished tree leaves it free, else top left; if neither, the
       tree makes room during Testing only (\`roomy\`): it glides left. */
    let side: "right" | "left" = "right";
    let roomy: TreeFrame | undefined;
    if (runs.length > 0) {
      const finished = fitted[cap]!;
      const z = finished.scale;
      const clusterDot = Math.max(MIN_TEST_DOT, dot * z);
      const clusterR = clusterDot * 0.8 * Math.sqrt(runs.length) + clusterDot / 2;
      const cornerBottom =
        TREE_TOP + cardHeight(features.length) + CARD_TO_CLUSTER + 2 * clusterR;
      const room = CANVAS_H - TREE_TOP - TREE_BOTTOM;
      const top = TREE_TOP + Math.max(0, (room - finished.height) / 2);
      const reach = CORNER_INSET + CORNER_W + LANE_GAP;
      const extents = layout.nodes.flatMap((laid) => {
        const spot = finished.spots.get(laid.key);
        if (!spot) return [];
        const said = words.get(laid.key)!;
        const r = (pitch * Math.sqrt(Math.max(1, counts.get(laid.key) ?? 0)) + dot / 2) * z;
        const half = Math.max(r, (Math.max(said.label, said.chip) / 2) * finished.camera);
        return [{ left: spot.x - half, right: spot.x + half, top: spot.y + top - r - LINK_BAND }];
      });
      const high = extents.filter((extent) => extent.top < cornerBottom);
      const rightFree = high.every((extent) => extent.right < width - reach);
      const leftFree = high.every((extent) => extent.left > reach);
      if (!rightFree && leftFree) side = "left";
      else if (!rightFree) roomy = fit(cap, tests, 0, reach);
    }
    /* Frames share the finished tree's top, so it ends centered and nothing
       drifts as it grows; but no frame may run past the canvas bottom (a
       big tree's finished frame is zoomed far out, so its middle frames are
       taller), so a taller frame rides up as far as it must. */
    const room = CANVAS_H - TREE_TOP - TREE_BOTTOM;
    const shared = Math.max(0, (room - fitted[cap]!.height) / 2);
    [...fitted, ...(roomy ? [roomy] : [])].forEach((frame) => {
      const top = TREE_TOP + Math.max(0, Math.min(shared, room - frame.height));
      frame.spots.forEach((spot) => (spot.y += top));
    });
    return { frames: fitted, cap, collapsed: cap < deepest, hidden, endOf, tests, side, roomy };
  }, [model, columns, width, dot, pitch, runs, features.length]);
  const { frames } = growth;

  /* ── Geometry (Figma 800-wide frames) ── */
  const radius = (count: number, grow = 1) =>
    pitch * grow * Math.sqrt(Math.max(1, count)) + dot / 2;
  const cx = width / 2;
  const cy = CANVAS_H * 0.42;
  const whole = { x: cx, y: cy, r: radius(marks.length) };
  const train = { x: cx - width * SPLIT_OFFSET, y: cy, r: radius(trainMarks) };
  const test = { x: cx + width * SPLIT_OFFSET, y: cy, r: radius(testMarks) };
  const countTop = whole.y + whole.r + CAPTION_GAP;
  const keyTop = countTop + CAPTION_LINE + KEY_GAP;
  const pairTop = cy + Math.max(train.r, test.r) + CAPTION_GAP;
  const cornerTop = FIELD_H - KEY_INSET.bottom - KEY_H;

  /* ── Timeline values ── */
  const t = timeline;
  const fade = (clip: { current: Record<string, number | string> | undefined }) => ({
    opacity: Number(clip.current?.opacity ?? 0),
    y: Number(clip.current?.y ?? 0),
  });
  const bloom = Number(t.cluster.bloom.current.p);
  const tint = Number(t.color.tint.current.p);
  const separate = Number(t.divide.separate.current.p);
  const testOut = Number(t.park.testOut.current.p);
  const center = Number(t.center.move.current.p);
  const rise = Number(t.rise.move.current.p);
  const rootAsk = fade(t.grow.ask);
  const rootSplit = Number(t.grow.split.current.p);
  const bloomed = t.cluster.bloom.started;

  /* Each question's ask (0–1) and split (0–1, may overshoot). The root's
     come from their own clips; every later level gets an equal slice of
     \`rest\`, asking for its first share and splitting for the rest. */
  const { layout } = model;
  const deepest = frames.length - 1;
  /* Later levels start at \`rest\` and taper from the root's own length
     (ask start → split end), so the pace eases up rather than jumps. */
  const rootLength = Math.max(
    0.2,
    t.grow.split.at + t.grow.split.duration - t.grow.ask.at,
  );
  const levelStarts: number[] = [];
  const levelLengths: number[] = [];
  {
    let at = t.grow.rest.at;
    let length = rootLength;
    for (let depth = 1; depth < deepest; depth += 1) {
      length = Math.max(pace.minLevel, length * pace.falloff);
      levelStarts[depth] = at;
      levelLengths[depth] = length;
      at += length;
    }
  }
  /* ── Act 3's own clock. Its clips are laid out for a tree done at
     ACT3_ANCHOR; this tree is done when its last split ends, so the act
     slides to keep the same beat after it: no wait after a small tree, no
     overlap with a deep one. ── */
  const treeDone =
    deepest === 0
      ? t.rise.move.at + t.rise.move.duration
      : deepest === 1
        ? t.grow.split.at + t.grow.split.duration
        : levelStarts[deepest - 1]! + levelLengths[deepest - 1]!;
  const actTime = t.time - (treeDone - ACT3_ANCHOR);
  const T3 = SPLIT_INTRO_TIMELINE.test;
  const act = (clip: { at: number; duration: number }, transition: TransitionConfig) => {
    const p = clamp01((actTime - clip.at) / Math.max(1e-6, clip.duration));
    return transition.type === "easing" ? cubicBezier(transition.ease, p) : p;
  };
  const settleP = act(t.test.settle, T3.settle.transition);
  const settle = lerp(Number(t.test.settle.from.o), Number(t.test.settle.to.o), settleP);
  const back = act(t.test.back, T3.back.transition);
  const cardP = act(t.test.card, T3.card.transition);
  const cardIn = {
    opacity: lerp(Number(t.test.card.from.opacity), Number(t.test.card.to.opacity), cardP),
    y: lerp(Number(t.test.card.from.y), Number(t.test.card.to.y), cardP),
  };
  /* Five tests, one after another, at one pace per step. */
  const testRows = act(t.test.rows, T3.rows.transition);
  /* The untested dots fade and the row card becomes the results card. */
  const result = act(t.test.result, T3.result.transition);
  const resultStarted = actTime >= t.test.result.at;
  const testingStarted = actTime >= t.progress.testing.at;

  const levelPhase = (depth: number): { ask: number; split: number } => {
    if (depth === 0) return { ask: rootAsk.opacity, split: rootSplit };
    const local = clamp01((t.time - levelStarts[depth]!) / levelLengths[depth]!);
    return {
      ask: clamp01(local / ASK_SHARE),
      split: easeInOut(clamp01((local - ASK_SHARE) / (1 - ASK_SHARE))),
    };
  };
  const phases = new Map<string, { ask: number; split: number }>();
  layout.nodes.forEach((laid) =>
    phases.set(
      laid.key,
      laid.node.type === "decision" && laid.depth < deepest
        ? levelPhase(laid.depth)
        : { ask: 0, split: 0 },
    ),
  );
  const splitOf = (key: string | undefined) => (key ? (phases.get(key)?.split ?? 0) : 0);

  /* Where the tree is: between frame k and k + 1 while level k splits. */
  let grown = 0;
  for (let depth = 0; depth < deepest; depth += 1) grown += clamp01(levelPhase(depth).split);
  const level = Math.min(Math.max(0, deepest - 1), Math.floor(grown));
  /* With no free corner, the finished tree glides aside as the test pile comes back. */
  const making = growth.roomy && back > 0;
  const between = making ? clamp01(back) : deepest === 0 ? 0 : clamp01(grown - level);
  const from = making ? frames[deepest]! : frames[level]!;
  const to = making ? growth.roomy! : frames[Math.min(deepest, level + 1)]!;
  const zoom = lerp(from.scale, to.scale, between);
  const camera = lerp(from.camera, to.camera, between);
  const chipH = CHIP_H * camera;
  const tree = useMemo(() => {
    const piles = new Map<string, Pile>();
    layout.nodes.forEach((laid) => {
      const a = from.spots.get(laid.key);
      const b = to.spots.get(laid.key);
      if (!a && !b) return;
      const at = a && b ? { x: lerp(a.x, b.x, between), y: lerp(a.y, b.y, between) } : (b ?? a)!;
      const ids = model.members.get(laid.key) ?? [];
      piles.set(laid.key, {
        laid,
        x: at.x,
        y: at.y,
        dot: dot * zoom,
        pitch: pitch * zoom,
        r: (pitch * Math.sqrt(Math.max(1, ids.length)) + dot / 2) * zoom,
        rank: new Map(ids.map((id, rank) => [id, rank])),
      });
    });
    return { piles, root: piles.get(layout.nodes[0]!.key)! };
  }, [layout, model.members, from, to, between, zoom, dot, pitch]);
  /* The rise lands on the first frame's root, before any split moves it. */
  const rootAt = frames[0]!.spots.get(layout.nodes[0]!.key)!;
  const rootZoom = frames[0]!.scale;
  const frame = useMemo(() => sampleBloom(recording, bloom), [recording, bloom]);

  /* ── Testing: the row card, the test cluster under it, each test, and
     where its dot lands ── */
  const final = frames[deepest]!;
  /* Tree size, but never too small to see lit in the cluster. */
  const testDot = Math.max(MIN_TEST_DOT, dot * (growth.roomy ?? final).scale);
  /* A little looser than the tree's piles: each dot here is one row to pick out. */
  const clusterPitch = testDot * 0.8;
  const cornerX = growth.side === "left" ? CORNER_INSET : width - CORNER_INSET - CORNER_W;
  const travelers = Math.min(TRAVELERS, runs.length);
  const rowCardHeight = cardHeight(features.length);
  const cardTop = TREE_TOP;
  const clusterR = clusterPitch * Math.sqrt(Math.max(1, runs.length)) + testDot / 2;
  const home = {
    x: cornerX + CORNER_W / 2,
    y: cardTop + rowCardHeight + CARD_TO_CLUSTER + clusterR,
  };
  /* The cluster keeps act 1's arrangement. */
  const clusterAt = (key: string): Point => {
    const s = sunflower(ranks.test.get(key) ?? 0, clusterPitch);
    return { x: home.x + s.x, y: home.y + s.y };
  };
  /* A tested dot joins its pile; with 1 dot = several rows, one row is less
     than a dot, so it sinks into the pile and is gone. */
  const joins = Math.round(model.rowsPerDot) <= 1;
  const landRank = useMemo(() => {
    const seen = new Map<string, number>();
    const rank = new Map<string, number>();
    runs.slice(0, TRAVELERS).forEach((run) => {
      const end = growth.endOf.get(run.mark.key)!;
      rank.set(run.mark.key, seen.get(end) ?? 0);
      seen.set(end, (seen.get(end) ?? 0) + 1);
    });
    return rank;
  }, [runs, growth]);
  const landing = (key: string): Point & { size: number } => {
    const end = tree.piles.get(growth.endOf.get(key)!)!;
    const landed = landRank.get(key) ?? 0;
    /* Next spot out from the pile's own dots, or a spot near its middle. */
    const s = sunflower(joins ? end.rank.size + landed : landed, end.pitch);
    return { x: end.x + s.x, y: end.y + s.y, size: end.dot };
  };
  /* Each row's turn is as long as its steps (a longer path takes longer),
     so every step plays at the same pace. */
  const rowUnits = runs.slice(0, travelers).map((run) => {
    const asks = Math.max(0, run.path.indexOf(growth.endOf.get(run.mark.key)!));
    return LIGHT + asks * (DWELL + 1) + FLY + REVEAL + HOLD;
  });
  const allUnits = rowUnits.reduce((sum, units) => sum + units, 0) || 1;
  const rowStarts = rowUnits.map((_, order) =>
    rowUnits.slice(0, order).reduce((sum, units) => sum + units, 0),
  );
  const rowsAt = testRows * allUnits;
  /** How far along its test a row is (0–1). */
  const walkOf = (order: number): number =>
    order >= travelers ? 0 : clamp01((rowsAt - rowStarts[order]!) / rowUnits[order]!);
  /** The row being tested now (the card shows it). */
  const currentOrder = Math.max(
    0,
    rowStarts.reduce((at, start, order) => (start <= rowsAt ? order : at), 0),
  );
  /* Handing over to the next row: the share of this row's turn it takes. */
  const swapShare =
    ROW_SWAP / Math.max(1e-6, ((rowUnits[currentOrder] ?? 1) / allUnits) * t.test.rows.duration);
  const turn = walkOf(currentOrder);
  const handOff = currentOrder >= travelers - 1 ? 1 : clamp01((1 - turn) / swapShare);
  /**
   * A test, in steps: its dot lights in the cluster; the root's question
   * lights, then the link the row takes draws to the next question, and
   * so on to its leaf; the dot flies into that leaf's pile; the answer
   * shows. Nothing travels the tree: the path lights instead.
   */
  const walkAt = (key: string, u: number) => {
    const run = runOf.get(key)!;
    const end = growth.endOf.get(key)!;
    const stops = run.path.slice(0, run.path.indexOf(end) + 1);
    const taken = new Map<string, number>();
    type Leg = { units: number; asking?: string; link?: string; step?: "light" | "fly" };
    const legs: Leg[] = [{ units: LIGHT, step: "light" }];
    stops.slice(0, -1).forEach((stop, index) => {
      legs.push({ units: DWELL, asking: stop });
      legs.push({ units: 1, link: stops[index + 1] });
    });
    legs.push({ units: FLY, step: "fly" });
    const total = legs.reduce((sum, leg) => sum + leg.units, 0) + REVEAL + HOLD;
    let left = u * total;
    let light = 0;
    for (const leg of legs) {
      const p = clamp01(left / leg.units);
      if (leg.link) taken.set(leg.link, easeInOut(p));
      if (leg.step === "light") light = easeInOut(p);
      if (left <= leg.units) {
        return { light, fly: leg.step === "fly" ? p : 0, reveal: 0, asking: leg.asking, taken };
      }
      left -= leg.units;
    }
    return { light, fly: 1, reveal: clamp01(left / REVEAL), asking: undefined, taken };
  };
  const currentRun = runs[currentOrder];
  const currentWalk = walkOf(currentOrder);
  const firstState =
    currentRun && currentWalk > 0 ? walkAt(currentRun.mark.key, currentWalk) : undefined;
  /* The row under test lights its path; it fades as the next row takes
     over, and into the results. */
  const lit = firstState ? (1 - result) * handOff : 0;

  const placeDot = (mark: Mark, index: number) => {
    const bx = frame[index * 3]!;
    const by = frame[index * 3 + 1]!;
    let scale = bloomed ? frame[index * 3 + 2]! : 0;
    let x = whole.x + bx;
    let y = whole.y + by;
    let opacity = scale > 0 ? 1 : 0;
    let size = dot;
    if (mark.test) {
      const rank = ranks.test.get(mark.key) ?? 0;
      const s = sunflower(rank, pitch);
      x = lerp(x, test.x + s.x, separate);
      y = lerp(y, test.y + s.y, separate);
      /* Off the right edge: set aside until Testing. */
      x = lerp(x, width + PARK_OUT + s.x, testOut);
      opacity *= 1 - clamp01((testOut - 0.5) / 0.5);
      if (back > 0) {
        /* Back for Testing as a cluster, grey: the model hasn't seen their answers. */
        const run = runOf.get(mark.key);
        if (!run) return { opacity: 0 } satisfies CSSProperties;
        const spot = clusterAt(mark.key);
        /* From the nearer edge into the cluster. */
        const enterX = growth.side === "left" ? -PARK_OUT + s.x : width + PARK_OUT + s.x;
        x = lerp(enterX, spot.x, back);
        y = lerp(test.y + s.y, spot.y, back);
        size = lerp(dot, testDot, clamp01(back));
        opacity = Math.min(1, back * 2);
        const u = walkOf(run.order);
        let light = 0;
        let tinted = 0;
        if (u > 0) {
          const walked = walkAt(mark.key, u);
          const land = landing(mark.key);
          const fly = easeInOut(walked.fly);
          /* Lit while under test; it dims as it leaves for its leaf. */
          light = walked.light * (1 - fly);
          x = lerp(spot.x, land.x, fly);
          y = lerp(spot.y, land.y, fly) - Math.sin(Math.PI * fly) * FLY_ARC;
          size = lerp(testDot, land.size, fly);
          /* Its true color shows as it lands. */
          tinted = clamp01((walked.fly - 0.6) / 0.4);
          /* One row of several per dot: it sinks into the pile. */
          if (!joins) {
            const sink = clamp01((walked.fly - 0.7) / 0.3);
            size *= 1 - sink;
            opacity *= 1 - sink;
          }
        } else {
          /* Untested rows leave with the cluster as testing completes. */
          opacity *= 1 - result;
        }
        const grow = 1 + (LIT_GROW - 1) * light;
        /* Grey, lit in the path's color while under test, then its own color. */
        const lit = `color-mix(in srgb, ${LIT} ${Math.round(light * 100)}%, ${GREY})`;
        return {
          transform: `translate(${x - size / 2}px, ${y - size / 2}px) scale(${(size / dot) * scale * grow})`,
          opacity,
          background:
            tinted <= 0
              ? lit
              : `color-mix(in srgb, ${mark.fill} ${Math.round(tinted * 100)}%, ${GREY})`,
          /* A halo keeps the lit dot apart from its neighbors. */
          boxShadow:
            light > 0
              ? `0 0 0 ${(1.5 * dot) / (size * grow)}px color-mix(in srgb, var(--background-neutral-secondary) ${Math.round(light * 100)}%, transparent)`
              : undefined,
          zIndex: light > 0 || (u > 0 && u < 1) ? 1 : undefined,
        } satisfies CSSProperties;
      }
    } else {
      const rank = ranks.train.get(mark.key) ?? 0;
      const s = sunflower(rank, pitch);
      x = lerp(x, train.x + s.x, separate);
      y = lerp(y, train.y + s.y, separate);
      x = lerp(x, cx + s.x, center);
      y = lerp(y, cy + s.y, center);
      /* Up to the top at tree size, the same arrangement: the root. */
      /* Once the tree starts growing, the root moves with it. */
      const root = grown > 0 ? tree.root : { x: rootAt.x, y: rootAt.y, pitch: pitch * rootZoom };
      const r = sunflower(rank, root.pitch);
      x = lerp(x, root.x + r.x, rise);
      y = lerp(y, root.y + r.y, rise);
      size = lerp(dot, dot * (grown > 0 ? zoom : rootZoom), clamp01(rise));
      /* Down its own path, one split at a time. */
      const path = mark.dotId !== undefined ? model.dots[mark.dotId]?.pathKeys : undefined;
      for (let k = 0; path && k < path.length - 1; k += 1) {
        const p = splitOf(path[k]);
        if (p <= 0) break;
        const child = tree.piles.get(path[k + 1]!);
        const childRank = child?.rank.get(mark.dotId!);
        if (!child || childRank === undefined) break;
        const order = childRank / Math.max(1, child.rank.size);
        const local =
          p >= 1 ? p : clamp01((p - order * SPLIT_STAGGER) / (1 - SPLIT_STAGGER));
        const spot = sunflower(childRank, child.pitch);
        x = lerp(x, child.x + spot.x, local);
        y = lerp(y, child.y + spot.y, local);

      }
    }
    const tintOrder = index / Math.max(1, marks.length);
    const tinted = clamp01((tint - tintOrder * TINT_STAGGER) / (1 - TINT_STAGGER));
    return {
      transform: `translate(${x - size / 2}px, ${y - size / 2}px) scale(${(size / dot) * scale})`,
      opacity,
      background:
        tinted <= 0
          ? GREY
          : tinted >= 1
            ? mark.fill
            : `color-mix(in srgb, ${mark.fill} ${Math.round(tinted * 100)}%, ${GREY})`,
    } satisfies CSSProperties;
  };

  /* ── Words ── */
  const unit = titleColumn ? rowNoun : "row";
  const noun = (count: number) => `${count.toLocaleString()} ${unit}${count === 1 ? "" : "s"}`;
  const perDot = Math.round(model.rowsPerDot);
  const scaleText =
    perDot <= 1 ? `1 dot = 1 ${unit}` : `1 dot ≈ ${perDot.toLocaleString()} ${unit}s`;
  /* The legend counts every row: nothing has been split yet when it appears. */
  const legendEntries = useMemo(() => {
    const counts = new Map<string, number>();
    rows.forEach((row) => {
      const label = String(row[labelColumn]);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    });
    return tally.map((entry) => ({
      label: entry.folded ? entry.label : entry.label.trim() === "" ? "(blank)" : entry.label,
      fill: entry.fill,
      count: entry.folded
        ? entry.folded.reduce((sum, label) => sum + (counts.get(label) ?? 0), 0)
        : (counts.get(entry.label) ?? 0),
    }));
  }, [rows, labelColumn, tally]);
  /* One bar, start to finish: the rows set aside before Training are the
     ones Testing uses. Without a holdout there's nothing to set aside. */
  const steps = [
    { key: "reading", label: "Reading the data", from: true },
    ...(holdout.length > 0
      ? [{ key: "setAside", label: "Setting aside test rows", from: t.progress.setAside.started }]
      : []),
    { key: "training", label: "Training", from: t.progress.training.started },
    { key: "testing", label: "Testing", from: testingStarted },
  ];
  const current = resultStarted
    ? steps.length
    : steps.reduce((at, step, index) => (step.from ? index : at), 0);

  /* ── Keys: centered under the count, then to their corners ── */
  const scaleMove = Number(t.color.scaleKeyMove.current.p);
  const legendMove = Number(t.divide.legendMove.current.p);
  const scaleAt = {
    x: lerp(cx - keyWidths.scale / 2, width - KEY_INSET.x - keyWidths.scale, scaleMove),
    y: lerp(keyTop, cornerTop, scaleMove),
  };
  const legendAt = {
    x: lerp(cx - keyWidths.legend / 2, KEY_INSET.x, legendMove),
    y: lerp(keyTop, cornerTop, legendMove),
  };
  const count = fade(t.cluster.count);
  const countOut = Number(t.divide.countOut.current.opacity);
  const scaleIn = fade(t.cluster.scaleKey);
  const legendIn = fade(t.color.legend);
  const captions = fade(t.divide.captions);
  const testCaptionOut = Number(t.park.captionOut.current.opacity);
  const trainCaptionOut = Number(t.rise.captionOut.current.opacity);

  /* ── The pile tree's words: questions, branch labels, and leaf labels ── */
  const question = (laid: LaidOutNode) => questionText(laid, columns);
  const treeParts = [...tree.piles.entries()].map(([key, pile]) => {
    const { laid } = pile;
    const { ask, split } = phases.get(key)!;
    const parent = laid.parentKey ? tree.piles.get(laid.parentKey) : undefined;
    const arrived = laid.parentKey ? splitOf(laid.parentKey) : clamp01(rise);
    /* The question sits under its pile, then takes the pile's place as it empties. */
    const chipY = lerp(pile.y + pile.r + (CHIP_GAP + CHIP_H / 2) * camera, pile.y, clamp01(split));
    return { key, pile, laid, ask, split, parent, arrived, chipY };
  });
  const chipYOf = new Map(treeParts.map((part) => [part.key, part.chipY]));

  /* The card for the row under test: its title, the features its path asks
     (first), up to four, its real label, and what the AI predicts. */
  const firstRun = currentRun;
  const firstRow = firstRun ? rows[firstRun.mark.sheetIndex] : undefined;
  const leadTitle =
    titleColumn && titleColumn !== labelColumn && !features.includes(titleColumn)
      ? titleColumn
      : undefined;
  const cardFeatures = useMemo(() => {
    if (!firstRun) return [];
    const asked = firstRun.path
      .map((key) => model.layout.byKey.get(key)?.node)
      .flatMap((node) => (node?.type === "decision" ? [node.feature] : []));
    return [...new Set([...asked, ...features])].slice(0, 4);
  }, [firstRun, model.layout, features]);
  const columnName = (id: string) => columnById(columns, id)?.name ?? id;
  /* What the tree predicts for it (its real path, even past a collapsed level). */
  const predicted = firstRun?.result?.predicted;
  /* Between rows the card's contents fade out and back in. */
  const swap = Math.min(currentOrder === 0 ? 1 : clamp01(turn / swapShare), handOff);

  return (
    <div className={styles.modal}>
      <div className={styles.header}>
        <h2 className={styles.title}>Training your model</h2>
      </div>
      <ol
        className={`${styles.progress} ${timeline.playing ? "" : styles.paused}`}
        aria-label="Training progress"
      >
        {steps.map((step, index) => {
          const state = index < current ? "done" : index === current ? "current" : "upcoming";
          return (
            <li
              key={step.key}
              className={`${styles.step} ${styles[state]}`}
              aria-current={state === "current" ? "step" : undefined}
            >
              {step.label}
              {state === "done" ? (
                <FaIcon name="circle-check" fontSize="16px" aria-label="done" />
              ) : state === "current" ? (
                <FaIcon name="spinner" fontSize="16px" className={styles.spinner} aria-hidden />
              ) : (
                <span className={styles.pending} aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
      <div ref={fieldRef} className={styles.field} style={{ height: FIELD_H }}>
        <div className={styles.canvas} style={{ height: CANVAS_H }} />

        {/* The pile tree's links, under the dots. */}
        <svg className={styles.links} width={width} height={CANVAS_H} aria-hidden>
          {treeParts.map(({ key, pile, parent, arrived, split, chipY }) => {
            if (!parent || arrived <= 0) return null;
            const fromY = chipYOf.get(parent.laid.key)! + chipH / 2;
            /* Into the pile's top, then the question that takes its place. */
            const toY = lerp(pile.y - pile.r - 4 * camera, chipY - chipH / 2, clamp01(split));
            const d = curvePath(parent.x, fromY, pile.x, toY);
            const trace = lit > 0 ? (firstState?.taken.get(key) ?? 0) : 0;
            return (
              <g key={key}>
                <path
                  className={styles.link}
                  d={d}
                  opacity={settle}
                  pathLength={1}
                  strokeDasharray="1 1"
                  strokeDashoffset={1 - clamp01(arrived)}
                />
                {trace > 0 ? (
                  <path
                    className={styles.linkLit}
                    d={d}
                    opacity={lit}
                    pathLength={1}
                    strokeDasharray="1 1"
                    strokeDashoffset={1 - trace}
                  />
                ) : null}
              </g>
            );
          })}
        </svg>

        {/* Overlay: dots, captions, and the two keys. */}
        <div className={styles.overlay} aria-hidden>
          {marks.map((mark, index) => (
            <span
              key={mark.key}
              className={styles.dot}
              style={{ width: dot, height: dot, ...placeDot(mark, index) }}
            />
          ))}
          {treeParts.map(({ key, pile, laid, ask, split, parent, arrived, chipY }) => (
            <div key={key}>
              {laid.node.type === "decision" && laid.depth === deepest && growth.collapsed ? (
                <span
                  className={`${styles.question} ${styles.more}`}
                  style={{
                    left: pile.x,
                    top: pile.y + pile.r + (CHIP_GAP + CHIP_H / 2) * camera,
                    height: CHIP_H,
                    opacity: clamp01((arrived - 0.6) / 0.4),
                    transform: `translate(-50%, -50%) scale(${camera})`,
                  }}
                >
                  {moreText(growth.hidden.get(key) ?? 0)}
                </span>
              ) : null}
              {laid.node.type === "decision" && ask > 0 ? (
                <span
                  className={`${styles.question} ${
                    lit > 0 && firstState && (firstState.asking === key || firstState.taken.has(childOnPath(firstRun!.path, key)))
                      ? styles.questionLit
                      : ""
                  }`}
                  style={{
                    left: pile.x,
                    top: chipY,
                    height: CHIP_H,
                    opacity:
                      ask *
                      (lit > 0 && firstState && (firstState.asking === key || firstState.taken.has(childOnPath(firstRun!.path, key)))
                        ? lerp(settle, 1, lit)
                        : settle),
                    transform: `translate(-50%, calc(-50% + ${(1 - clamp01(ask)) * 6}px)) scale(${camera})`,
                  }}
                >
                  {question(laid)}
                </span>
              ) : null}
              {parent && laid.branchLabel && arrived > 0 ? (
                <span
                  className={`${styles.branch} ${
                    lit > 0 && (firstState?.taken.get(key) ?? 0) > 0.5 ? styles.branchLit : ""
                  }`}
                  style={{
                    /* On the connector's last stub, just over its own pile (the lab tree's spot). */
                    left: pile.x,
                    top: lerp(pile.y - pile.r - 4 * camera, chipY - chipH / 2, clamp01(split)) -
                      ANSWER_GAP * camera,
                    transform: `translate(-50%, -100%) scale(${camera})`,
                    opacity:
                      clamp01((arrived - 0.3) / 0.4) *
                      (lit > 0 && (firstState?.taken.get(key) ?? 0) > 0.5 ? lerp(settle, 1, lit) : settle),
                  }}
                >
                  {laid.branchLabel}
                </span>
              ) : null}
              {laid.node.type === "leaf" && (parent ? arrived > 0.6 : rise > 0.6) ? (
                <span
                  className={styles.leafLabel}
                  style={{
                    left: pile.x,
                    top: pile.y + pile.r + 4 * camera,
                    transform: `translateX(-50%) scale(${camera})`,
                    opacity: clamp01(((parent ? arrived : rise) - 0.6) / 0.4),
                  }}
                >
                  <span
                    className={styles.keyDot}
                    style={{ background: labelFill(indexOf(laid.node.prediction)) }}
                  />
                  {laid.node.prediction}
                </span>
              ) : null}
            </div>
          ))}
          <p
            className={styles.count}
            style={{
              left: cx,
              top: countTop,
              opacity: count.opacity * countOut,
              transform: `translate(-50%, ${count.y}px)`,
            }}
          >
            {noun(rows.length)}
          </p>
          {holdout.length > 0
            ? (
                [
                  ["Training", lerp(train.x, cx, center), trainSheetIndexes.length, trainCaptionOut],
                  ["Testing", lerp(test.x, width + PARK_OUT, testOut), holdout.length, testCaptionOut],
                ] as const
              ).map(([word, x, rowsIn, out]) => (
                <div
                  key={word}
                  className={styles.caption}
                  style={{
                    left: x,
                    top: pairTop,
                    opacity: captions.opacity * out,
                    transform: `translate(-50%, ${captions.y}px)`,
                  }}
                >
                  <p className={styles.captionWord}>{word}</p>
                  <p className={styles.captionCount}>{noun(rowsIn)}</p>
                </div>
              ))
            : null}
          <div
            ref={scaleRef}
            className={styles.key}
            style={{
              opacity: scaleIn.opacity,
              transform: `translate(${scaleAt.x}px, ${scaleAt.y + scaleIn.y}px)`,
            }}
          >
            <span className={styles.keyItem}>
              <span
                className={styles.keyDot}
                style={{ background: labelFill(OTHER_LABEL_INDEX) }}
              />
              {scaleText}
            </span>
          </div>
          <div
            ref={legendRef}
            className={styles.key}
            style={{
              opacity: legendIn.opacity,
              transform: `translate(${legendAt.x}px, ${legendAt.y + legendIn.y}px)`,
            }}
          >
            {legendEntries.map((entry) => (
              <span key={entry.label} className={styles.keyItem}>
                <span className={styles.keyDot} style={{ background: entry.fill }} />
                {entry.label} ({entry.count.toLocaleString()})
              </span>
            ))}
          </div>
          {runs.length > 0 && cardIn.opacity > 0 ? (
            /* One card: the walking row's values, then (as the dots fade) the results. */
            <div
              className={styles.rowCard}
              style={{
                left: cornerX,
                top: cardTop,
                width: CORNER_W,
                height: lerp(rowCardHeight, RESULT_H, result),
                opacity: testing.rowCard ? cardIn.opacity : cardIn.opacity * result,
                transform: `translateY(${cardIn.y}px)`,
              }}
            >
              {firstRow && firstRun && result < 1 ? (
                <div
                  className={styles.rowCardBody}
                  style={{ opacity: (1 - clamp01(result * 2)) * swap }}
                >
                  <p className={styles.rowTitle}>
                    {leadTitle
                      ? cell(firstRow[leadTitle])
                      : `Row ${(firstRun.mark.sheetIndex + 1).toLocaleString()}`}
                  </p>
                  <div className={styles.rowLines}>
                    {cardFeatures.map((id) => (
                      <p key={id} className={styles.rowLine}>
                        <span className={styles.rowKey}>{columnName(id)}</span>
                        <span className={styles.rowValue}>{cell(firstRow[id])}</span>
                      </p>
                    ))}
                  </div>
                  <div className={styles.rowFooter}>
                    <p className={styles.rowLine}>
                      <span className={styles.rowKey}>{columnName(labelColumn)}</span>
                      <span className={styles.rowValue}>
                        <span className={styles.keyDot} style={{ background: firstRun.mark.fill }} />
                        <span className={styles.rowText}>{cell(firstRow[labelColumn])}</span>
                      </span>
                    </p>
                    <p className={styles.rowLine}>
                      <span className={styles.rowKey}>AI predicts</span>
                      {predicted !== undefined && firstState && firstState.reveal > 0 ? (
                        <span className={styles.rowValue} style={{ opacity: firstState.reveal }}>
                          <span
                            className={styles.keyDot}
                            style={{ background: labelFill(indexOf(predicted)) }}
                          />
                          <span className={styles.rowText}>{predicted}</span>
                        </span>
                      ) : null}
                    </p>
                  </div>
                </div>
              ) : null}
              {result > 0 ? (
                <div className={styles.resultBody} style={{ opacity: clamp01(result * 2 - 1) }}>
                  <p className={styles.resultValue}>
                    {formatAccuracyPercent(score.right / Math.max(1, score.total))} Accuracy
                  </p>
                  <p className={styles.resultDetail}>
                    {score.right.toLocaleString()} of {score.total.toLocaleString()} correct
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      <div className={styles.statement}>
        <PredictionStatement
          columns={columns}
          labelColumn={labelColumn}
          features={features}
          size="large"
          fit
        />
      </div>
    </div>
  );
}

/** The row card's height: header, up to four value lines, two-line footer, border. */
function cardHeight(featureCount: number): number {
  const lines = Math.min(4, featureCount);
  return (
    CARD_EDGE_ROW +
    2 * CARD_PAD +
    lines * CARD_LINE +
    Math.max(0, lines - 1) * CARD_LINE_GAP +
    CARD_FOOTER +
    2
  );
}

function cell(value: string | number | undefined): string {
  return value === undefined ? "—" : formatCell(value);
}

function moreText(count: number): string {
  return `+${count} more question${count === 1 ? "" : "s"}`;
}

/** The node after \`key\` on \`path\` (where a row went from that question). */
function childOnPath(path: string[], key: string): string {
  return path[path.indexOf(key) + 1] ?? "";
}

/** A point on the soft S between two points, at 0–1. */
function bezierAt(a: Point, b: Point, t: number): Point {
  const midY = (a.y + b.y) / 2;
  const u = 1 - t;
  const w0 = u * u * u;
  const w1 = 3 * u * u * t;
  const w2 = 3 * u * t * t;
  const w3 = t * t * t;
  return {
    x: w0 * a.x + w1 * a.x + w2 * b.x + w3 * b.x,
    y: w0 * a.y + w1 * midY + w2 * midY + w3 * b.y,
  };
}

/** A soft S from a question down to a child: leaves and lands vertically. */
function curvePath(sx: number, sy: number, tx: number, ty: number): string {
  const midY = (sy + ty) / 2;
  return `M ${sx} ${sy} C ${sx} ${midY}, ${tx} ${midY}, ${tx} ${ty}`;
}

/** CSS cubic-bezier easing at \`x\` (0–1), as DialKit's easing clips play it. */
function cubicBezier(ease: [number, number, number, number], x: number): number {
  const [x1, y1, x2, y2] = ease;
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const at = (a: number, b: number, u: number) =>
    3 * a * u * (1 - u) * (1 - u) + 3 * b * u * u * (1 - u) + u * u * u;
  /* Solve for the curve parameter whose x is \`x\` (bisection: always converges). */
  let lo = 0;
  let hi = 1;
  let u = x;
  for (let i = 0; i < 30; i += 1) {
    const guess = at(x1, x2, u);
    if (Math.abs(guess - x) < 1e-5) break;
    if (guess < x) lo = u;
    else hi = u;
    u = (lo + hi) / 2;
  }
  return at(y1, y2, u);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp01(t: number): number {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
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

type TreeWords = Map<string, { chip: number; label: number; branch: number }>;

interface TreeFrame {
  /** Zoom on the dots (1 = the cluster's own size). */
  scale: number;
  /** Zoom on everything else (chips, labels, gaps): 1 unless the tree is too big. */
  camera: number;
  /** Height of the frame's tree, in px. */
  height: number;
  /** Node key → pile center, in overlay px (from the tree's top until placed). */
  spots: Map<string, Point>;
}

function questionText(laid: LaidOutNode, columns: TrainingWalkData["columns"]): string {
  return laid.node.type === "decision"
    ? `${columnById(columns, laid.node.feature)?.name ?? laid.node.feature}?`
    : "";
}

/** Text width at the chips' type (body-4 semibold), or a fair estimate before mount. */
function textMeasurer(host: HTMLElement | null): (text: string) => number {
  const context = document.createElement("canvas").getContext("2d");
  if (!context || !host) return (text) => text.length * 7.2;
  const style = getComputedStyle(host);
  const family = style.getPropertyValue("--font-body").trim() || style.fontFamily;
  const size = style.getPropertyValue("--text-body-xs").trim() || "12px";
  context.font = `600 ${size} ${family}`;
  return (text) => Math.ceil(context.measureText(text).width);
}

/**
 * The tree down to depth \`k\`, laid out from its own contents: a pile, its
 * question, or its label sets each node's width, a parent spans its
 * children, and each level is as tall as its biggest pile (a question that
 * has split is just its chip). Zoomed out as far as it must be to fit.
 */
function fitFrame(
  layout: TreeLayout,
  k: number,
  counts: Map<string, number>,
  words: TreeWords,
  /** Test rows landing at each end, so their spot beside the pile is kept clear. */
  tests: Map<string, number>,
  width: number,
  dot: number,
  pitch: number,
): TreeFrame {
  const root = layout.nodes[0]!;
  const shown = layout.nodes.filter((laid) => laid.depth <= k);
  const ends = (laid: LaidOutNode) => laid.node.type === "leaf" || laid.depth === k;
  const build = (scale: number) => {
    const radius = (laid: LaidOutNode) =>
      (pitch * Math.sqrt(Math.max(1, counts.get(laid.key) ?? 0)) + dot / 2) * scale;
    const spans = new Map<string, number>();
    const span = (laid: LaidOutNode): number => {
      const said = words.get(laid.key)!;
      let wide: number;
      if (ends(laid)) {
        const landed = tests.get(laid.key) ?? 0;
        const testR = landed
          ? (pitch * Math.sqrt(landed) + dot / 2) * scale
          : 0;
        /* Room both sides for the landed test rows, so the pile stays centered. */
        const beside = landed ? 2 * (TEST_GAP + 2 * testR) : 0;
        wide = Math.max(
          2 * radius(laid) + beside,
          laid.node.type === "leaf" ? said.label : said.chip,
        );
      } else {
        const kids = laid.childKeys.map((key) => layout.byKey.get(key)!);
        const sum = kids.reduce((total, kid) => total + span(kid), 0);
        wide = Math.max(sum + LANE_GAP * (kids.length - 1), said.chip);
      }
      wide = Math.max(wide, said.branch);
      spans.set(laid.key, wide);
      return wide;
    };
    const fullWidth = span(root);
    const rowY: number[] = [];
    let y = 0;
    for (let depth = 0; depth <= k; depth += 1) {
      const row = shown.filter((laid) => laid.depth === depth);
      const tall = Math.max(
        0,
        ...row.map((laid) => (ends(laid) ? 2 * radius(laid) : CHIP_H)),
      );
      const under = Math.max(
        0,
        ...row.map((laid) =>
          !ends(laid) ? 0 : laid.node.type === "leaf" ? LABEL_BAND : CHIP_GAP + CHIP_H,
        ),
      );
      rowY[depth] = y + tall / 2;
      y += tall + under + (depth < k ? LINK_BAND : 0);
    }
    const spots = new Map<string, Point>();
    const place = (laid: LaidOutNode, left: number): number => {
      const wide = spans.get(laid.key)!;
      let x = left + wide / 2;
      if (!ends(laid)) {
        const kids = laid.childKeys.map((key) => layout.byKey.get(key)!);
        const sum =
          kids.reduce((total, kid) => total + spans.get(kid.key)!, 0) +
          LANE_GAP * (kids.length - 1);
        let at = left + (wide - sum) / 2;
        const xs = kids.map((kid) => {
          const kidX = place(kid, at);
          at += spans.get(kid.key)! + LANE_GAP;
          return kidX;
        });
        x = (xs[0]! + xs[xs.length - 1]!) / 2;
      }
      spots.set(laid.key, { x, y: rowY[laid.depth]! });
      return x;
    };
    place(root, 0);
    return { fullWidth, fullHeight: y, spots };
  };
  const roomW = width - TREE_SIDE * 2;
  const roomH = CANVAS_H - TREE_TOP - TREE_BOTTOM;
  const fits = (scale: number) => {
    const { fullWidth, fullHeight } = build(scale);
    return fullWidth <= roomW && fullHeight <= roomH;
  };
  let scale = 1;
  let camera = 1;
  if (!fits(1)) {
    if (fits(DOT_FLOOR)) {
      let lo = DOT_FLOOR;
      let hi = 1;
      for (let step = 0; step < 16; step += 1) {
        const mid = (lo + hi) / 2;
        if (fits(mid)) lo = mid;
        else hi = mid;
      }
      scale = lo;
    } else {
      scale = DOT_FLOOR;
      const { fullWidth, fullHeight } = build(scale);
      camera = Math.min(roomW / fullWidth, roomH / fullHeight);
    }
  }
  const { fullWidth, fullHeight, spots } = build(scale);
  const left = (width - fullWidth * camera) / 2;
  spots.forEach((spot) => {
    spot.x = left + spot.x * camera;
    spot.y *= camera;
  });
  return { scale: scale * camera, camera, height: fullHeight * camera, spots };
}
