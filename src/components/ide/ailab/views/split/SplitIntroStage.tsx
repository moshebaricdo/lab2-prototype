import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Button } from "@moshebari/cads-react";
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
  DEFAULT_BLOOM_PHYSICS,
  type BloomPhysics,
} from "./bloomSim";
import { orderRuns } from "./orderRuns";
import type { SplitTuning } from "./splitIntroTimeline";
import { clipProgress, clipValue, type StoryClip } from "./storyClock";
import styles from "./SplitIntroStage.module.scss";

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
  /** The most test rows walked one at a time; the rest are tested together. */
  rows: number;
  /**
   * Seconds the walked rows may take in all. A deep tree's rows take
   * longer each, so fewer of them are walked (never fewer than two).
   */
  budget: number;
}

export const DEFAULT_TESTING: TestingOptions = { rows: 5, budget: 16 };

/**
 * The modal's action row, as the lab's training modal draws it
 * (`TrainingModalShell`, sort-and-quiz footer): restart and pause on the
 * left; on the right Cancel then Back to dataset, and Skip then Continue.
 */
export interface StageActions {
  paused: boolean;
  onTogglePause: () => void;
  onRestart: () => void;
  /** Jump to the end of the story. */
  onSkip: () => void;
  /** Cancel while it plays, Back to dataset once it is done. */
  onBack?: () => void;
  onContinue?: () => void;
}
/** However long its rows take, a tree with a miss to show still walks a right guess and a miss. */
const LEAST_WALKED = 2;

/** The tree canvas (Figma Training/Testing modal) and the key row under it. */
const CANVAS_H = 437;
const KEY_ROW_H = 44;
const FIELD_H = CANVAS_H + KEY_ROW_H;
/** Figma: caption 18px under a cluster; a key 4px under its 22px caption. */
const CAPTION_GAP = 18;
const CAPTION_LINE = 22;
const KEY_GAP = 4;
/**
 * The keys sit 14px up from the bottom (Figma), and as far in from the
 * sides as the header and footer rows' content: 24px.
 */
const KEY_INSET = { x: 24, bottom: 14 };
const KEY_H = 18;
/** Seconds the legend takes to leave once the tree has formed. */
const LEGEND_OUT = 0.4;
/** The least gap between the two keys once the panel narrows their row. */
const KEY_BETWEEN = 16;
/** Figma: the two halves sit this share of the width either side of center. */
const SPLIT_OFFSET = 123 / 800;
/** The pile tree: room above the root, below the leaves (labels), and at the sides. */
const TREE_TOP = 16;
const TREE_BOTTOM = 12;
const TREE_SIDE = 24;
/** A question chip and the gap between it and its pile. */
const CHIP_H = 24;
const CHIP_GAP = 6;
/**
 * Between two levels: the curve down from a question, then a straight
 * stub into each child. The stub carries the answer, so every answer on a
 * level sits on one line, right over the child it leads to.
 */
const CURVE_BAND = 26;
const ANSWER_BAND = 24;
/** A link stops this far short of a pile's top dot. */
const PILE_GAP = 4;
const LINK_BAND = CURVE_BAND + ANSWER_BAND + PILE_GAP;
/** A tree let out downward (beside the test panel) grows each level's gap by at most this many times itself. */
const TALL_MOST = 1.5;
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
/**
 * A split's links draw once its question has risen clear of them (it
 * starts under its pile and takes the pile's place as the pile empties).
 */
const LINK_FROM = 0.55;
/** Where the test pile leaves to: past the canvas's right edge. */
const PARK_OUT = 80;
/**
 * A big tree grows only the levels that fit at this zoom or closer; the
 * questions below collapse into "+N more questions".
 */
const CAMERA_FLOOR = 0.75;
/**
 * The test panel: flush with the modal's right edge, as tall as the
 * canvas and its key row. It holds the test rows' cluster, the row under
 * test, and at the end the results. The tree and the keys move over.
 */
const PANEL_W = 216;
/** From the panel's top to the cluster, and from the cluster to its caption. */
const PANEL_TOP = 18;
const PANEL_CAPTION_GAP = 10;
/** Its caption (two 22px lines, 2px apart) and the room under it, to the divider. */
const PANEL_CAPTION_H = 46;
const PANEL_HEAD_PAD = 14;
/**
 * The cluster's slot at the panel's top: where the pile sits, never
 * smaller than this, with this much room around it. The view zooms in on
 * the row under test from here, and the close-up fills the panel's whole
 * head, edge to edge.
 */
const SLOT_MIN = 32;
const SLOT_PAD = 4;
/**
 * The close-up runs through where the caption ("Testing / 173 rows")
 * sits, so the caption steps aside for it: gone within this share of the
 * first zoom, and back when the walked rows are done and the rest are
 * tested from the pile.
 */
const CAPTION_OUT = 0.3;
/**
 * Zoomed in, one row is drawn about this big (px): so the zoom goes as
 * deep as it takes to tell a dot's rows apart, within these bounds.
 */
const ROW_PX = 9;
const ZOOM_MIN = 1.8;
const ZOOM_MAX = 9;
/** The lit row stands a little larger than its neighbors. */
const LIT_GROW = 1.2;
/**
 * With 1 dot = 1 row there is no zoom: the row's dot lights in the pile
 * and grows this much, and the dots around it move over to make room:
 * the ones touching it by as much as it grew plus this gap (px), less
 * with distance, none beyond this many dots away.
 */
const DOT_GROW = 1.5;
const ROOM_GAP = 1;
const ROOM_REACH = 3;
/**
 * Zooming in on dots of several rows, every dot in view gives way to the
 * rows inside it: starting once it is drawn this many times its size, and
 * done by this many, so no dot ever swells into a big blank disc.
 */
const RESOLVE_FROM = 1.3;
const RESOLVE_BY = 2.6;
/** The most rows drawn inside one zoomed dot. */
const ROWS_SHOWN = 37;
/** As it takes the predicted label's color, the lit row swells this much for a moment. */
const REVEAL_POP = 0.15;
/** The most columns the panel lists for a row; the rest fold into a count. */
const PANEL_LINES = 6;
/** A value in the row's card turns bold over this share of its question's dwell. */
const BOLD_BY = 0.4;
/**
 * A test's units: the row lights in the cluster, by zooming in on it
 * when a dot holds several rows (`LIGHT`); each question on its path lights (`DWELL`) and the link it
 * takes draws (`FOLLOW`); the AI has its answer, so the lit row takes the
 * predicted label's color and "AI predicts" fills in (`REVEAL`), and that
 * holds a moment (`HOLD`); then the row flies out of the slot into its
 * leaf's pile as the slot zooms back out (`FLY`), and the next row is up.
 */
const LIGHT = 0.8;
const DWELL = 0.7;
const FOLLOW = 1;
const FLY = 1.2;
const REVEAL = 0.6;
const HOLD = 1.2;
/** The units in `test.row`'s bar: one row, one question. */
const REF_ROW_UNITS = LIGHT + DWELL + FOLLOW + FLY + REVEAL + HOLD;
/** A flying test dot's arc (px). */
const FLY_ARC = 28;
/** Seconds the panel and the lit path take to hand over to the next row. */
const ROW_SWAP = 0.18;
/** Seconds the pile rests between one row leaving and the next being picked out. */
const ROW_GAP = 0.15;
/** Of the "remaining rows" beat: the share one dot's flight takes; the rest staggers them. */
const REST_FLY = 0.5;
/** Of that beat: the share by which the running count has reached the total. */
const REST_COUNT_BY = 0.7;
/** Seconds the panel takes to swap the row for the "remaining rows" notice. */
const REST_SWAP = 0.25;
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

/** One test dot: its row's real path through the tree, and how it scored. */
interface TestRun {
  mark: Mark;
  result: TrainingWalk["testResults"][number] | undefined;
  path: string[];
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
 * The split intro: the data becomes a cluster, parts into training and
 * test rows, the training rows sort into a tree, and the test rows are
 * run through it. Drawn entirely from `tuning` and `time`, so it is
 * exactly at the playhead whether playing, paused, or scrubbing, and needs
 * nothing but a clock to run.
 * Figma: AI Lab 2, "initial bloom" → "colors appear" → "content separates".
 */
export function SplitIntroStage({
  data,
  walk,
  tuning,
  time,
  playing = true,
  physics = DEFAULT_BLOOM_PHYSICS,
  pace = DEFAULT_TREE_PACE,
  testing = DEFAULT_TESTING,
  actions,
  onDuration,
}: {
  data: TrainingWalkData;
  /** The `split` walk: its model, holdout, and tally. */
  walk: TrainingWalk;
  /** The timeline's clips: `SPLIT_INTRO_TIMELINE`, or the dock's live edit of it. */
  tuning: SplitTuning;
  /** Seconds into the story. */
  time: number;
  /** False while paused or scrubbing: spinners hold still with everything else. */
  playing?: boolean;
  physics?: BloomPhysics;
  pace?: TreePace;
  testing?: TestingOptions;
  /** Draws the lab modal's action row under the canvas. */
  actions?: StageActions;
  /** This dataset's story length in seconds: it depends on the tree and the test rows. */
  onDuration?: (seconds: number) => void;
}) {
  const { columns, labelColumn, features, rows, titleColumn, rowNoun } = data;
  const { model, holdout, trainSheetIndexes, tally, testResults, score } = walk;
  const { indexOf } = model.grouping;
  const fieldRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  const [keyWidths, setKeyWidths] = useState({ legend: 0, scale: 0 });
  const walked = Math.max(1, Math.round(testing.rows));

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
  /* ── Tests: each test dot's row, its real path, and how it scored ── */
  const tests = useMemo<TestRun[]>(() => {
    const byRow = new Map(testResults.map((result) => [result.rowIndex, result]));
    return marks
      .filter((mark) => mark.test)
      .map((mark) => {
        const row = rows[mark.sheetIndex];
        return {
          mark,
          result: byRow.get(mark.sheetIndex),
          path: row ? traceDecisionTree(data.tree, row).pathKeys : [model.layout.nodes[0]!.key],
        };
      });
  }, [marks, rows, testResults, data.tree, model.layout]);
  const trainMarks = ranks.train.size;
  const testMarks = ranks.test.size;
  const hasTest = tests.length > 0;
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
        /* Its own width, however far the panel has clipped it. */
        const legend = legendRef.current?.scrollWidth ?? 0;
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
          answer: laid.branchLabel ? Math.min(132, measureText(laid.branchLabel) + 10) + 10 : 0,
        },
      ]),
    );
    const counts = new Map(
      layout.nodes.map((laid) => [laid.key, members.get(laid.key)?.length ?? 0]),
    );
    /* The width the test panel takes while it is open. */
    const panel = hasTest ? PANEL_W : 0;
    /* `right`: width kept clear at the right (the tree fits what's left). */
    const fit = (k: number, right = 0, tallAs = 0) =>
      fitFrame(layout, k, counts, words, width - right, dot, pitch, tallAs);
    /* Grow only the levels that stay readable beside the open panel:
       Testing is when a path is traced, so its words must not shrink away. */
    let cap = deepest;
    for (let k = 1; k <= deepest; k += 1) {
      if (fit(k, panel).camera < CAMERA_FLOOR) {
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
    /* Where each test row ends, in the tree as shown. */
    const endOf = new Map<string, string>();
    tests.forEach((run) => {
      endOf.set(run.mark.key, run.path[Math.min(cap, run.path.length - 1)]!);
    });
    const fitted = Array.from({ length: cap + 1 }, (_, k) => fit(k));
    /* The finished tree again, in the room the open panel leaves. That
       room is narrower, not shorter: a tree that has to shrink to fit its
       width is let out downward again, back to the height it had, so it
       narrows without also going short and leaving the canvas empty below. */
    const beside = panel ? fit(cap, panel, fitted[cap]!.height) : undefined;
    /* Frames share the finished tree's top, so it ends centered and nothing
       drifts as it grows; but no frame may run past the canvas bottom (a
       big tree's finished frame is zoomed far out, so its middle frames are
       taller), so a taller frame rides up as far as it must. */
    const room = CANVAS_H - TREE_TOP - TREE_BOTTOM;
    const shared = Math.max(0, (room - fitted[cap]!.height) / 2);
    [...fitted, ...(beside ? [beside] : [])].forEach((frame) => {
      const top = TREE_TOP + Math.max(0, Math.min(shared, room - frame.height));
      frame.spots.forEach((spot) => (spot.y += top));
      frame.tops = frame.tops.map((y) => y + top);
    });
    return { frames: fitted, cap, collapsed: cap < deepest, hidden, endOf, beside };
  }, [model, columns, width, dot, pitch, tests, hasTest]);
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

  /* ── The story's clips, each read at the time it is really playing ── */
  const t = tuning;
  /** `clip`'s progress; `shift` is how much later than the dock it plays. */
  const at = (clip: StoryClip, shift = 0) => clipProgress(clip, time - shift);
  const fade = (clip: StoryClip, shift = 0) => ({
    opacity: clipValue(clip, "opacity", time - shift),
    y: clipValue(clip, "y", time - shift),
  });
  const bloom = at(t.cluster.bloom);
  const tint = at(t.color.tint);
  const separate = at(t.divide.separate);
  const testOut = at(t.park.testOut);
  const center = at(t.center.move);
  const rise = at(t.rise.move);
  const rootAsk = fade(t.grow.ask);
  const rootSplit = at(t.grow.split);
  const bloomed = time >= t.cluster.bloom.at;

  /* Each question's ask (0–1) and split (0–1, may overshoot). The root's
     come from their own clips; every later level starts at `rest` and
     tapers from the root's own length (ask start → split end), so the
     pace eases up rather than jumps. */
  const { layout } = model;
  const deepest = frames.length - 1;
  const rootLength = Math.max(
    0.2,
    t.grow.split.at + t.grow.split.duration - t.grow.ask.at,
  );
  const levelStarts: number[] = [];
  const levelLengths: number[] = [];
  {
    let start = t.grow.rest.at;
    let length = rootLength;
    for (let depth = 1; depth < deepest; depth += 1) {
      length = Math.max(pace.minLevel, length * pace.falloff);
      levelStarts[depth] = start;
      levelLengths[depth] = length;
      start += length;
    }
  }

  /* ── This tree's schedule. The dock lays the testing act out for a tree
     whose last split is the root's; this tree is done when its own last
     split ends, and each row's turn is as long as its path, so the act's
     clips play later by however much longer this tree and these rows take
     (earlier, for a tree with no question at all). ── */
  const rootDone = t.grow.split.at + t.grow.split.duration;
  const treeDone =
    deepest === 0
      ? t.rise.move.at + t.rise.move.duration
      : deepest === 1
        ? rootDone
        : levelStarts[deepest - 1]! + levelLengths[deepest - 1]!;
  /** Everything up to the rows: later by the extra levels. */
  const afterTree = treeDone - rootDone;
  /** Seconds per unit of a test (see `LIGHT`…`HOLD`). */
  const unit = Math.max(0.01, t.test.row.duration / REF_ROW_UNITS);
  /* Each row's turn is as long as its steps (a longer path takes longer),
     so every step plays at the same pace on any tree. What gives on a deep
     tree is how many rows are walked: as many as fit the budget. */
  const { runs, travelers } = useMemo(() => {
    const unitsOf = (run: TestRun) => {
      const asks = Math.max(0, run.path.indexOf(growth.endOf.get(run.mark.key)!));
      return LIGHT + asks * (DWELL + FOLLOW) + FLY + REVEAL + HOLD;
    };
    let count = Math.min(walked, tests.length);
    let ordered = orderRuns(tests, count);
    while (
      count > LEAST_WALKED &&
      ordered.slice(0, count).reduce((sum, run) => sum + unitsOf(run), 0) * unit > testing.budget
    ) {
      count -= 1;
      ordered = orderRuns(tests, count);
    }
    return {
      runs: ordered.map((run) => ({ ...run, units: unitsOf(run) })),
      travelers: count,
    };
  }, [tests, walked, testing.budget, unit, growth]);
  const runOf = useMemo(
    () => new Map(runs.map((run, order) => [run.mark.key, { ...run, order }])),
    [runs],
  );
  /* Between rows the pile rests a beat before the next is picked out. */
  const gapUnits = ROW_GAP / unit;
  const rowUnits = runs
    .slice(0, travelers)
    .map((run, order) => run.units + (order > 0 ? gapUnits : 0));
  const allUnits = rowUnits.reduce((sum, units) => sum + units, 0);
  const rowStarts = rowUnits.map((_, order) =>
    rowUnits.slice(0, order).reduce((sum, units) => sum + units, 0),
  );
  const rowsStart = t.test.row.at + afterTree;
  /** After the rows: later again by however long they took past one row's bar. */
  const afterRows = afterTree + allUnits * unit - t.test.row.duration;
  /* Rows scored but not walked. With none, the "remaining" beat is skipped. */
  const restRows = Math.max(0, score.total - travelers);
  const afterRest =
    restRows > 0 ? afterRows : afterRows - (t.test.result.at - t.test.remaining.at);
  /** When the last thing in the story comes to rest. */
  const storyEnd = hasTest
    ? t.test.statement.at + t.test.statement.duration + afterRest
    : treeDone;
  const reportedEnd = Math.round(storyEnd * 100) / 100;
  /* The whole story has played: the action row turns from Skip to Continue. */
  const done = time >= storyEnd - 0.005;
  useEffect(() => {
    onDuration?.(reportedEnd);
  }, [onDuration, reportedEnd]);

  const settleDown = at(t.test.settle, afterTree);
  /** The panel sliding in (0–1); the tree and keys make room as it does. */
  const open = hasTest ? clamp01(at(t.test.panel, afterTree)) : 0;
  const panelStarted = hasTest && time - afterTree >= t.test.panel.at;
  const cardIn = fade(t.test.card, afterTree);
  const testingStarted = hasTest && time - afterTree >= t.progress.testing.at;
  /** Units into the walked rows. */
  const rowsAt = Math.min(allUnits, Math.max(0, (time - rowsStart) / unit));
  /** The rows not walked, tested together (0–1), and the panel's notice of it. */
  const rest = restRows > 0 ? at(t.test.remaining, afterRows) : 0;
  const restIn =
    restRows > 0 ? clamp01((time - afterRows - t.test.remaining.at) / REST_SWAP) : 0;
  /* The count of rows tested runs with the dots leaving the pile, not
     behind them: quick off the mark and done by this share of the beat,
     so the full count is on screen for a moment before the results. */
  const restCounted = 1 - (1 - clamp01(rest / REST_COUNT_BY)) ** 2;
  /** The panel becoming the results, and the prediction statement joining them. */
  const result = hasTest ? at(t.test.result, afterRest) : 0;
  const statementIn = fade(t.test.statement, afterRest);
  const finished = hasTest ? time - afterRest >= t.test.result.at : time >= treeDone;
  /* The tree dims while a path is traced, and comes back for the results. */
  const settle = lerp(
    lerp(Number(t.test.settle.from?.o ?? 1), Number(t.test.settle.to?.o ?? 1), settleDown),
    1,
    result,
  );

  const levelPhase = (depth: number): { ask: number; split: number } => {
    if (depth === 0) return { ask: rootAsk.opacity, split: rootSplit };
    const local = clamp01((time - levelStarts[depth]!) / levelLengths[depth]!);
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
  /* The finished tree glides over as the panel opens. */
  const making = growth.beside && open > 0;
  const between = making ? open : deepest === 0 ? 0 : clamp01(grown - level);
  const from = making ? frames[deepest]! : frames[level]!;
  const to = making ? growth.beside! : frames[Math.min(deepest, level + 1)]!;
  const zoom = lerp(from.scale, to.scale, between);
  const camera = lerp(from.camera, to.camera, between);
  const chipH = CHIP_H * camera;
  const tree = useMemo(() => {
    const piles = new Map<string, Pile>();
    layout.nodes.forEach((laid) => {
      const a = from.spots.get(laid.key);
      const b = to.spots.get(laid.key);
      if (!a && !b) return;
      const spot = a && b ? { x: lerp(a.x, b.x, between), y: lerp(a.y, b.y, between) } : (b ?? a)!;
      const ids = model.members.get(laid.key) ?? [];
      piles.set(laid.key, {
        laid,
        x: spot.x,
        y: spot.y,
        dot: dot * zoom,
        pitch: pitch * zoom,
        r: (pitch * Math.sqrt(Math.max(1, ids.length)) + dot / 2) * zoom,
        rank: new Map(ids.map((id, rank) => [id, rank])),
      });
    });
    return { piles, root: piles.get(layout.nodes[0]!.key)! };
  }, [layout, model.members, from, to, between, zoom, dot, pitch]);
  /** The top of a level's row: every node on it hangs from this line. */
  const rowTop = (depth: number): number => {
    const a = from.tops[depth];
    const b = to.tops[depth];
    return a !== undefined && b !== undefined ? lerp(a, b, between) : (b ?? a ?? 0);
  };
  /* The rise lands on the first frame's root, before any split moves it. */
  const rootAt = frames[0]!.spots.get(layout.nodes[0]!.key)!;
  const rootZoom = frames[0]!.scale;
  const frame = useMemo(() => sampleBloom(recording, bloom), [recording, bloom]);

  /* ── Testing: the panel, the test cluster at its top, each test, and
     where its dot lands ── */
  const panelLeft = width - open * PANEL_W;
  const clusterR = radius(testMarks);
  const slotR = Math.max(clusterR + SLOT_PAD, SLOT_MIN);
  const home = { x: panelLeft + PANEL_W / 2, y: PANEL_TOP + slotR };
  /* What a dot stands for never changes: the legend's unit, here as on
     the canvas. With 1 dot = 1 row, a dot IS a row, so there is nothing
     to zoom in for: the row's dot lights where it sits in the pile, and it
     is the one that leaves for the tree. With 1 dot = several rows, a row
     is inside a dot: the view zooms in on that dot until its rows show,
     one of them lit; that row leaves (and, less than a dot, sinks into its
     pile) while the dot stays. Either way the cluster's dots, each a full
     dot's worth of rows, join the piles at the end. */
  const dotIsRow = Math.round(model.rowsPerDot) <= 1;
  /* The dots that leave together once the walked rows are done. */
  const restDots = dotIsRow ? runs.length - travelers : runs.length;
  const landRank = useMemo(() => {
    const seen = new Map<string, number>();
    const rank = new Map<string, number>();
    runs.forEach((run) => {
      const end = growth.endOf.get(run.mark.key)!;
      rank.set(run.mark.key, seen.get(end) ?? 0);
      seen.set(end, (seen.get(end) ?? 0) + 1);
    });
    return rank;
  }, [runs, growth]);
  /** Where a test lands: `joining`, the next spot out from the pile's own dots; else near its middle. */
  const landing = (key: string, joining: boolean): Point & { size: number } => {
    const end = tree.piles.get(growth.endOf.get(key)!)!;
    const landed = landRank.get(key) ?? 0;
    const s = sunflower(joining ? end.rank.size + landed : landed, end.pitch);
    return { x: end.x + s.x, y: end.y + s.y, size: end.dot };
  };
  const headH =
    PANEL_TOP + 2 * slotR + PANEL_CAPTION_GAP + PANEL_CAPTION_H + PANEL_HEAD_PAD;
  /** How far along its test a walked row is (0–1). */
  const walkOf = (order: number): number =>
    order >= travelers ? 0 : clamp01((rowsAt - rowStarts[order]!) / rowUnits[order]!);
  /** The row being tested now (the panel shows it). */
  const currentOrder = Math.max(
    0,
    rowStarts.reduce((found, start, order) => (start <= rowsAt ? order : found), 0),
  );
  /* Handing over to the next row: the share of this row's turn it takes. */
  const swapShare = ROW_SWAP / Math.max(1e-6, (rowUnits[currentOrder] ?? 1) * unit);
  const turn = walkOf(currentOrder);
  const handOff = currentOrder >= travelers - 1 ? 1 : clamp01((1 - turn) / swapShare);
  /**
   * A test, in steps: the slot zooms in on the row and it lights; the
   * root's question lights, then the link the row takes draws to the next
   * question, and so on to its leaf; the row takes the predicted label's
   * color and the answer shows, and holds; the row flies into that leaf's
   * pile. Nothing travels the tree: the path lights instead.
   */
  const walkAt = (key: string, u: number) => {
    const run = runOf.get(key)!;
    const end = growth.endOf.get(key)!;
    const stops = run.path.slice(0, run.path.indexOf(end) + 1);
    const taken = new Map<string, number>();
    const asked = new Map<string, number>();
    type Leg = {
      units: number;
      asking?: string;
      link?: string;
      step?: "light" | "reveal" | "fly";
    };
    const legs: Leg[] = [
      ...(run.order > 0 ? [{ units: gapUnits }] : []),
      { units: LIGHT, step: "light" as const },
    ];
    stops.slice(0, -1).forEach((stop, index) => {
      legs.push({ units: DWELL, asking: stop });
      legs.push({ units: FOLLOW, link: stops[index + 1] });
    });
    legs.push({ units: REVEAL, step: "reveal" }, { units: HOLD }, { units: FLY, step: "fly" });
    const total = legs.reduce((sum, leg) => sum + leg.units, 0);
    const walk = {
      light: 0,
      reveal: 0,
      fly: 0,
      asking: undefined as string | undefined,
      taken,
      asked,
    };
    let left = u * total;
    for (const leg of legs) {
      const p = clamp01(left / leg.units);
      if (leg.link) taken.set(leg.link, easeInOut(p));
      if (leg.asking) asked.set(leg.asking, p);
      if (leg.step === "light") walk.light = easeInOut(p);
      if (leg.step === "reveal") walk.reveal = p;
      if (leg.step === "fly") walk.fly = p;
      if (left <= leg.units) {
        walk.asking = leg.asking;
        break;
      }
      left -= leg.units;
    }
    return walk;
  };
  const currentRun = runs[currentOrder];
  const currentState =
    currentRun && turn > 0 ? walkAt(currentRun.mark.key, turn) : undefined;
  /* The row under test lights its path; it fades as the next row takes
     over, and when the walked rows are done. */
  const lit = currentState ? (1 - Math.max(restIn, clamp01(result * 2))) * handOff : 0;
  const onPath = (key: string) =>
    lit > 0 &&
    currentState !== undefined &&
    (currentState.asking === key ||
      currentState.taken.has(childOnPath(currentRun!.path, key)));

  /* ── The zoom: in on the row under test as its turn starts, held while
     its path is traced, and back out as it leaves for the tree ── */
  /* The rows drawn inside a zoomed dot, packed into the dot's own footprint. */
  const rowsInDot = dotIsRow
    ? 1
    : Math.min(ROWS_SHOWN, Math.max(2, Math.round(model.rowsPerDot)));
  const rowPitch = dot / 2 / (Math.sqrt(Math.max(0.5, rowsInDot - 0.5)) + 0.75);
  const rowSize = dotIsRow ? dot : 1.5 * rowPitch;
  const zoomTo = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, ROW_PX / rowSize));
  const closeUp =
    !dotIsRow && currentState ? currentState.light * (1 - easeInOut(currentState.fly)) : 0;
  const zoomScale = lerp(1, zoomTo, closeUp);
  /* The dot zoomed in on: it comes to the slot's center. */
  const focusDot = currentRun
    ? sunflower(ranks.test.get(currentRun.mark.key) ?? 0, pitch)
    : { x: 0, y: 0 };
  /* Which of that dot's rows lights: a different one each turn, so no two
     close-ups look alike. The zoom centers on that row. */
  const litIndex = rowsInDot <= 1 ? 0 : (currentOrder * 5 + 2) % rowsInDot;
  /* Each dot's rows are packed in their own way (not one arrangement
     turned round), so no two clusters in a close-up look the same. */
  const packs = useMemo(
    () =>
      dotIsRow
        ? []
        : Array.from({ length: testMarks }, (_, rank) => packRows(rowsInDot, rowPitch, rank)),
    [dotIsRow, testMarks, rowsInDot, rowPitch],
  );
  /** Row `index` inside the dot at `rank`, from that dot's center. */
  const rowIn = (rank: number, index: number): Point =>
    packs[rank]?.[index] ?? sunflower(index, rowPitch);
  const focusRank = currentRun ? (ranks.test.get(currentRun.mark.key) ?? 0) : 0;
  const litOffset = dotIsRow ? { x: 0, y: 0 } : rowIn(focusRank, litIndex);
  const focus = { x: focusDot.x + litOffset.x, y: focusDot.y + litOffset.y };
  /** A spot in the pile (from the pile's center), where the slot shows it now. */
  const inSlot = (s: Point): Point => ({
    x: home.x + (s.x - focus.x * closeUp) * zoomScale,
    y: home.y + (s.y - focus.y * closeUp) * zoomScale,
  });
  /* Close enough, dots of several rows give way to the rows inside them:
     all of them in view, not just the one zoomed in on, so the close-up
     is a field of rows and never a few swollen dots. */
  const resolved = dotIsRow
    ? 0
    : clamp01(
        (zoomScale - RESOLVE_FROM) /
          Math.max(0.01, Math.min(zoomTo, RESOLVE_BY) - RESOLVE_FROM),
      );
  /** The lit row at full zoom, at the slot's center: where it leaves the slot from. */
  const leaveFrom = { x: home.x, y: home.y, size: rowSize * LIT_GROW * zoomTo };
  /* The close-up fills the panel's head, edge to edge, at full strength,
     and is cut off at its sides and at the rule under it. */
  /* The caption makes way for the close-ups: out as the first one zooms
     in, and back for the rows tested from the pile. With 1 dot = 1 row
     there is no close-up, so it stays. */
  const captionShown = dotIsRow
    ? 1
    : Math.max(1 - clamp01(rowsAt / (LIGHT * CAPTION_OUT)), restIn);
  const slotLeft = home.x - PANEL_W / 2;
  const slotTop = 0;
  /** A dot in the slot, in the slot's own box. */
  const slotDot = (at: Point, size: number, more: CSSProperties = {}) =>
    ({
      transform: `translate(${at.x - slotLeft - size / 2}px, ${at.y - slotTop - size / 2}px) scale(${size / dot})`,
      background: GREY,
      ...more,
    }) satisfies CSSProperties;
  const litShade = (light: number) =>
    `color-mix(in srgb, ${LIT} ${Math.round(light * 100)}%, ${GREY})`;
  /** The color the AI predicted for a row: what its lit dot turns once the path is traced. */
  const predictedFill = (run: TestRun) =>
    run.result ? labelFill(indexOf(run.result.predicted)) : LIT;
  /** The lit row's color: the path's while it is traced, then the predicted label's. */
  const rowShade = (run: TestRun, light: number, reveal: number) =>
    reveal > 0
      ? `color-mix(in srgb, ${predictedFill(run)} ${Math.round(reveal * 100)}%, ${LIT})`
      : litShade(light);
  /** A moment's swell as it takes that color. */
  const pop = (reveal: number) => 1 + REVEAL_POP * Math.sin(Math.PI * reveal);
  /* With 1 dot = 1 row, the dot under test grows where it sits, and gives
     the room back as it leaves for the tree. */
  const activeSpot = sunflower(focusRank, pitch);
  const activeSize =
    dotIsRow && currentState
      ? dot * lerp(1, DOT_GROW, currentState.light) * pop(currentState.reveal)
      : dot;
  const room =
    dotIsRow && currentState
      ? ((activeSize - dot) / 2 + ROOM_GAP * currentState.light) *
        (1 - easeInOut(currentState.fly))
      : 0;
  /** Where a pile dot sits while the dot under test is grown: moved over, out of its way. */
  const makeRoom = (s: Point, key: string): Point => {
    if (room <= 0 || key === currentRun?.mark.key) return s;
    const dx = s.x - activeSpot.x;
    const dy = s.y - activeSpot.y;
    const apart = Math.hypot(dx, dy) || 1;
    const share = clamp01(1 - (apart - dot) / (dot * ROOM_REACH));
    return { x: s.x + (dx / apart) * room * share, y: s.y + (dy / apart) * room * share };
  };
  /** Out of the slot (`from`) into its leaf's pile; `joining` it, or sinking in. */
  const flying = (
    run: TestRun,
    flight: number,
    from: Point & { size: number },
    joining: boolean,
    shade: string,
  ) => {
    const land = landing(run.mark.key, joining);
    const fly = easeInOut(flight);
    const x = lerp(from.x, land.x, fly);
    const y = lerp(from.y, land.y, fly) - Math.sin(Math.PI * fly) * FLY_ARC;
    /* One row of several per dot is less than a dot: it sinks into the pile. */
    const sink = joining ? 0 : clamp01((flight - 0.7) / 0.3);
    const size = lerp(from.size, land.size, fly) * (1 - sink);
    /* Its true color shows as it lands. */
    const tinted = clamp01((flight - 0.6) / 0.4);
    return {
      transform: `translate(${x - size / 2}px, ${y - size / 2}px) scale(${size / dot})`,
      opacity: 1 - sink,
      background:
        tinted > 0
          ? `color-mix(in srgb, ${run.mark.fill} ${Math.round(tinted * 100)}%, ${shade})`
          : shade,
      zIndex: flight < 1 ? 1 : undefined,
    } satisfies CSSProperties;
  };
  /**
   * A test dot once the panel is in: in the slot (zoomed with it), or
   * `loose`, on its way to the tree or landed there.
   */
  const testDot = (mark: Mark): { style: CSSProperties; loose: boolean } => {
    const run = runOf.get(mark.key);
    if (!run) return { style: { opacity: 0 }, loose: true };
    const s = sunflower(ranks.test.get(mark.key) ?? 0, pitch);
    if (dotIsRow && run.order < travelers) {
      /* The dot is the row: lit and grown where it sits (no zoom: there is
         nothing smaller to see) while its neighbors make room, turned the
         predicted label's color, then off to its leaf. */
      const u = walkOf(run.order);
      const state = u > 0 ? walkAt(mark.key, u) : undefined;
      const sits = makeRoom(s, mark.key);
      const spot = { x: home.x + sits.x, y: home.y + sits.y };
      const light = state?.light ?? 0;
      const size = dot * lerp(1, DOT_GROW, light) * pop(state?.reveal ?? 0);
      if (state && state.fly > 0) {
        return {
          style: flying(run, state.fly, { ...spot, size }, true, predictedFill(run)),
          loose: true,
        };
      }
      return {
        style: slotDot(spot, size, {
          background: rowShade(run, light, state?.reveal ?? 0),
          zIndex: light > 0 ? 1 : undefined,
        }),
        loose: false,
      };
    }
    /* A dot of the pile: it waits while rows are walked, then leaves with
       the rest, a beat apart, and joins its leaf's pile. */
    const waiting = dotIsRow ? run.order - travelers : run.order;
    const flight =
      rest > 0 && restDots > 0
        ? clamp01((rest - (waiting / restDots) * (1 - REST_FLY)) / REST_FLY)
        : 0;
    if (flight > 0) {
      const from = { x: home.x + s.x, y: home.y + s.y, size: dot };
      return { style: flying(run, flight, from, true, GREY), loose: true };
    }
    /* Up close it shows its rows instead. A dot with nowhere to go (every
       row was walked) leaves with the panel's testing view. */
    return {
      style: slotDot(inSlot(makeRoom(s, mark.key)), dot * zoomScale, {
        opacity: (1 - clamp01(result * 2)) * (1 - resolved),
      }),
      loose: false,
    };
  };
  const testDots = panelStarted
    ? marks.filter((mark) => mark.test).map((mark) => ({ mark, ...testDot(mark) }))
    : [];

  const placeDot = (mark: Mark, index: number) => {
    const bx = frame[index * 3]!;
    const by = frame[index * 3 + 1]!;
    const scale = bloomed ? frame[index * 3 + 2]! : 0;
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
    } else {
      const rank = ranks.train.get(mark.key) ?? 0;
      const s = sunflower(rank, pitch);
      x = lerp(x, train.x + s.x, separate);
      y = lerp(y, train.y + s.y, separate);
      x = lerp(x, cx + s.x, center);
      y = lerp(y, cy + s.y, center);
      /* Up to the top at tree size, the same arrangement: the root.
         Once the tree starts growing, the root moves with it. */
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
  const rowWord = titleColumn ? rowNoun : "row";
  const noun = (count: number) =>
    `${count.toLocaleString()} ${rowWord}${count === 1 ? "" : "s"}`;
  const perDot = Math.round(model.rowsPerDot);
  const scaleText =
    perDot <= 1 ? `1 dot = 1 ${rowWord}` : `1 dot ≈ ${perDot.toLocaleString()} ${rowWord}s`;
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
  /* Three steps of one size: get the data ready (see it, set the test rows
     aside), train, test. Without a holdout there's nothing to test. */
  const steps = [
    { key: "prepare", label: "Preparing data" },
    { key: "training", label: "Training" },
    ...(hasTest ? [{ key: "testing", label: "Testing" }] : []),
  ];
  const current = finished
    ? steps.length
    : testingStarted
      ? 2
      : time >= t.progress.training.at
        ? 1
        : 0;
  const accuracy = formatAccuracyPercent(score.right / Math.max(1, score.total));
  /* The same story in words, for a screen reader: one line per step. */
  const narration = finished
    ? hasTest
      ? `Done. AI predicts ${score.right.toLocaleString()} of ${noun(score.total)} correctly: ${accuracy} accuracy.`
      : "Done. The model is trained."
    : current === 2
      ? `Testing: the model predicts the ${noun(holdout.length)} that were set aside.`
      : current === 1
        ? `Training: ${noun(trainSheetIndexes.length)} are sorted into a decision tree, one question at a time.`
        : hasTest
          ? `Preparing data: ${noun(rows.length)}, with ${noun(holdout.length)} set aside for testing.`
          : `Preparing data: ${noun(rows.length)}.`;

  /* ── Keys: centered under the count, then to their corners. There the
     legend has only the room the scale key leaves it, and gives way
     (clipped, fading out) before the two would touch. As the panel opens
     their row ends at its edge: the scale key moves over with it and the
     legend gives way further. ── */
  const scaleMove = at(t.color.scaleKeyMove);
  const legendMove = at(t.divide.legendMove);
  const scaleAt = {
    x: lerp(cx - keyWidths.scale / 2, panelLeft - KEY_INSET.x - keyWidths.scale, scaleMove),
    y: lerp(keyTop, cornerTop, scaleMove),
  };
  const legendAt = {
    x: lerp(cx - keyWidths.legend / 2, KEY_INSET.x, legendMove),
    y: lerp(keyTop, cornerTop, legendMove),
  };
  const legendRoom = panelLeft - 2 * KEY_INSET.x - keyWidths.scale - KEY_BETWEEN;
  /* As it settles into its corner, the legend is held to the room there
     (it narrows on the way, so there is no jump), with or without the
     panel: a long legend must not run into the scale key. */
  const legendLimit =
    legendMove > 0
      ? lerp(Math.max(keyWidths.legend, legendRoom), legendRoom, clamp01(legendMove))
      : undefined;
  const legendClipped = legendLimit !== undefined && keyWidths.legend > legendLimit + 0.5;
  const count = fade(t.cluster.count);
  const countOut = clipValue(t.divide.countOut, "opacity", time, 1);
  const scaleIn = fade(t.cluster.scaleKey);
  const legendIn = fade(t.color.legend);
  /* Once the tree has formed, its leaves name their own colors (dot +
     label under each pile), so the legend leaves, on every dataset, and
     only the scale key stays. (Moshe's call: where a label has no leaf of
     its own, or leaves are folded under "+N more questions", those dots
     are left without a key on the canvas.) */
  const legendOut = clamp01((time - treeDone) / LEGEND_OUT);
  const captions = fade(t.divide.captions);
  const testCaptionOut = clipValue(t.park.captionOut, "opacity", time, 1);
  const trainCaptionOut = clipValue(t.rise.captionOut, "opacity", time, 1);

  /* ── The pile tree's words: questions, answers, and leaf labels ── */
  const treeParts = [...tree.piles.entries()].map(([key, pile]) => {
    const { laid } = pile;
    const { ask, split } = phases.get(key)!;
    const parent = laid.parentKey ? tree.piles.get(laid.parentKey) : undefined;
    const arrived = laid.parentKey ? splitOf(laid.parentKey) : clamp01(rise);
    /* The question sits under its pile, then takes the pile's place as it empties. */
    const chipY = lerp(pile.y + pile.r + (CHIP_GAP + CHIP_H / 2) * camera, pile.y, clamp01(split));
    /* Its link ends at the pile's top, then at the question that takes its place. */
    const endY = lerp(pile.y - pile.r - PILE_GAP * camera, chipY - chipH / 2, clamp01(split));
    /* The stub into it starts on the level's shared line, so answers line up. */
    const stubTop = rowTop(laid.depth) - (PILE_GAP + ANSWER_BAND) * camera;
    /* Drawn once the parent's question is out of the way; the answer follows. */
    const drawn = clamp01((arrived - LINK_FROM) / (1 - LINK_FROM));
    return { key, pile, laid, ask, split, parent, arrived, chipY, endY, stubTop, drawn };
  });
  const chipYOf = new Map(treeParts.map((part) => [part.key, part.chipY]));

  /* The row under test, in the panel: its title, the columns its path asks
     about (first), its real label, and what the AI predicts. */
  const currentRow = currentRun ? rows[currentRun.mark.sheetIndex] : undefined;
  const leadTitle =
    titleColumn && titleColumn !== labelColumn && !features.includes(titleColumn)
      ? titleColumn
      : undefined;
  const panelFeatures = useMemo(() => {
    if (!currentRun) return [];
    const asked = currentRun.path
      .map((key) => model.layout.byKey.get(key)?.node)
      .flatMap((node) => (node?.type === "decision" ? [node.feature] : []));
    return [...new Set([...asked, ...features])].slice(0, PANEL_LINES);
  }, [currentRun, model.layout, features]);
  const foldedFeatures = features.length - panelFeatures.length;
  const columnName = (id: string) => columnById(columns, id)?.name ?? id;
  /* A value turns bold as the tree asks about its column, and stays bold:
     the row's card fills in with what the tree has used so far. */
  const weightOf = (id: string) => {
    if (!currentRun || !currentState) return 0;
    let most = 0;
    for (const key of currentRun.path) {
      const node = model.layout.byKey.get(key)?.node;
      if (node?.type !== "decision" || node.feature !== id) continue;
      most = Math.max(most, clamp01((currentState.asked.get(key) ?? 0) / BOLD_BY));
    }
    return most;
  };
  /* The row's real label turns bold with the answer, to be read against it. */
  const answerWeight = clamp01((currentState?.reveal ?? 0) / BOLD_BY);
  /* What the tree predicts for it (its real path, even past a collapsed level). */
  const predicted = currentRun?.result?.predicted;
  /* Between rows the row's values fade out and back in. */
  const swap = Math.min(currentOrder === 0 ? 1 : clamp01(turn / swapShare), handOff);
  const leaving = clamp01(result * 2);

  return (
    <div
      className={`${styles.modal} ${playing ? "" : styles.paused}`}
      role="group"
      aria-label="Training your model"
    >
      {/* The steps are the header: they say what the modal is doing. */}
      <ol className={styles.progress} aria-label="Training progress">
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
      <p className={styles.narration} role="status">
        {narration}
      </p>
      <div ref={fieldRef} className={styles.field} style={{ height: FIELD_H }}>
        <div className={styles.canvas} style={{ height: CANVAS_H }} />

        {/* The pile tree's links, under the dots. */}
        <svg className={styles.links} width={width} height={CANVAS_H} aria-hidden>
          {treeParts.map(({ key, pile, parent, drawn, endY, stubTop }) => {
            if (!parent || drawn <= 0) return null;
            const fromY = chipYOf.get(parent.laid.key)! + chipH / 2;
            const d = linkPath(parent.x, fromY, pile.x, stubTop, endY);
            const trace = lit > 0 ? (currentState?.taken.get(key) ?? 0) : 0;
            return (
              <g key={key}>
                <path
                  className={styles.link}
                  d={d}
                  opacity={settle}
                  pathLength={1}
                  strokeDasharray="1 1"
                  strokeDashoffset={1 - drawn}
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

        {/* Overlay: the training dots, the tree's words, captions, and the two keys. */}
        <div className={styles.overlay} aria-hidden>
          {/* Questions sit under the dots: a pile lifts off its question as it splits. */}
          {treeParts.map(({ key, pile, laid, ask, chipY }) => {
            const traced = onPath(key);
            return laid.node.type === "decision" && ask > 0 ? (
              <span
                key={key}
                className={`${styles.question} ${traced ? styles.questionLit : ""}`}
                style={{
                  left: pile.x,
                  top: chipY,
                  height: CHIP_H,
                  opacity: ask * (traced ? lerp(settle, 1, lit) : settle),
                  transform: `translate(-50%, calc(-50% + ${(1 - clamp01(ask)) * 6}px)) scale(${camera})`,
                }}
              >
                {questionText(laid, columns)}
              </span>
            ) : null;
          })}
          {marks.map((mark, index) =>
            mark.test ? null : (
              <span
                key={mark.key}
                className={styles.dot}
                style={{ width: dot, height: dot, ...placeDot(mark, index) }}
              />
            ),
          )}
          {treeParts.map(({ key, pile, laid, parent, arrived, stubTop, drawn }) => {
            const answered = lit > 0 && (currentState?.taken.get(key) ?? 0) > 0.5;
            return (
              <div key={key}>
                {laid.node.type === "decision" && laid.depth === deepest && growth.collapsed ? (
                  <span
                    className={`${styles.question} ${styles.more}`}
                    style={{
                      left: pile.x,
                      top: pile.y + pile.r + (CHIP_GAP + CHIP_H / 2) * camera,
                      height: CHIP_H,
                      opacity: clamp01((arrived - 0.6) / 0.4) * settle,
                      transform: `translate(-50%, -50%) scale(${camera})`,
                    }}
                  >
                    {moreText(growth.hidden.get(key) ?? 0)}
                  </span>
                ) : null}
                {parent && laid.branchLabel && drawn > 0 ? (
                  /* On the stub into its child: plain words that break the
                     line, so they read as a note on the link, not a node. */
                  <span
                    className={`${styles.answer} ${answered ? styles.answerLit : ""}`}
                    style={{
                      left: pile.x,
                      top: stubTop + (ANSWER_BAND / 2) * camera,
                      transform: `translate(-50%, -50%) scale(${camera})`,
                      opacity: clamp01((drawn - 0.5) / 0.5),
                    }}
                  >
                    <span
                      className={styles.answerText}
                      style={{ opacity: answered ? lerp(settle, 1, lit) : settle }}
                    >
                      {laid.branchLabel}
                    </span>
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
            );
          })}
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
            className={`${styles.key} ${legendClipped ? styles.keyClipped : ""}`}
            style={{
              opacity: legendIn.opacity * (1 - legendOut),
              transform: `translate(${legendAt.x}px, ${legendAt.y + legendIn.y}px)`,
              maxWidth: legendLimit === undefined ? undefined : Math.max(0, legendLimit),
            }}
          >
            {legendEntries.map((entry) => (
              <span key={entry.label} className={styles.keyItem}>
                <span className={styles.keyDot} style={{ background: entry.fill }} />
                {entry.label} ({entry.count.toLocaleString()})
              </span>
            ))}
          </div>
        </div>

        {/* The test panel: the cluster's caption, the row under test, then the results. */}
        {hasTest ? (
          <aside
            className={styles.panel}
            aria-hidden
            style={{
              width: PANEL_W,
              transform: `translateX(${(1 - open) * PANEL_W}px)`,
              visibility: open > 0 ? "visible" : "hidden",
            }}
          >
            {/* The panel's head, full bleed: the pile at rest, the close-up
                when zoomed in, under the panel's words. */}
            {panelStarted ? (
              <div
                className={styles.slot}
                style={{
                  left: 0,
                  top: 0,
                  width: PANEL_W,
                  height: headH,
                }}
              >
                {testDots.map(({ mark, style, loose }) =>
                  loose ? null : (
                    <span
                      key={mark.key}
                      className={styles.dot}
                      style={{ width: dot, height: dot, ...style }}
                    />
                  ),
                )}
                {/* Zoomed in on dots of several rows: the rows inside every
                    dot in view, and in the one zoomed in on, one lit. */}
                {resolved > 0
                  ? testDots.flatMap(({ mark, loose }) => {
                      if (loose) return [];
                      const rank = ranks.test.get(mark.key) ?? 0;
                      const center = sunflower(rank, pitch);
                      const shown = inSlot(center);
                      /* Only the dots the close-up can see. */
                      const reach = (dot * zoomScale) / 2;
                      if (
                        Math.abs(shown.x - home.x) > PANEL_W / 2 + reach ||
                        shown.y < -reach ||
                        shown.y > headH + reach
                      ) {
                        return [];
                      }
                      const focused = mark.key === currentRun?.mark.key;
                      return Array.from({ length: rowsInDot }, (_, index) => {
                        const row = rowIn(rank, index);
                        const lit = focused && index === litIndex;
                        return (
                          <span
                            key={`${mark.key}-${index}`}
                            className={styles.dot}
                            style={{
                              width: dot,
                              height: dot,
                              ...slotDot(
                                inSlot({ x: center.x + row.x, y: center.y + row.y }),
                                rowSize *
                                  zoomScale *
                                  (lit
                                    ? lerp(1, LIT_GROW, closeUp) * pop(currentState?.reveal ?? 0)
                                    : 1),
                                {
                                  opacity: lit && (currentState?.fly ?? 0) > 0 ? 0 : resolved,
                                  background:
                                    lit && currentRun
                                      ? rowShade(currentRun, closeUp, currentState?.reveal ?? 0)
                                      : GREY,
                                  zIndex: lit ? 1 : undefined,
                                },
                              ),
                            }}
                          />
                        );
                      });
                    })
                  : null}
              </div>
            ) : null}
            <div className={styles.panelTesting} style={{ opacity: 1 - leaving }}>
              <div
                className={styles.panelHead}
                style={{
                  height: headH,
                  paddingTop: PANEL_TOP + 2 * slotR + PANEL_CAPTION_GAP,
                }}
              >
                <p className={styles.captionWord} style={{ opacity: captionShown }}>
                  Testing
                </p>
                <p className={styles.captionCount} style={{ opacity: captionShown }}>
                  {noun(holdout.length)}
                </p>
              </div>
              <div className={styles.panelBody}>
                {currentRow && currentRun ? (
                  <div
                    className={styles.panelRow}
                    style={{
                      opacity: cardIn.opacity * swap * (1 - restIn),
                      transform: `translateY(${cardIn.y}px)`,
                    }}
                  >
                    <p className={styles.rowTitle}>
                      {leadTitle
                        ? cell(currentRow[leadTitle])
                        : `Row ${(currentRun.mark.sheetIndex + 1).toLocaleString()}`}
                    </p>
                    <div className={styles.rowLines}>
                      {panelFeatures.map((id) => (
                        <p key={id} className={styles.rowLine}>
                          <span className={styles.rowKey}>{columnName(id)}</span>
                          <span className={styles.rowValue}>
                            <Weighed text={cell(currentRow[id])} bold={weightOf(id)} />
                          </span>
                        </p>
                      ))}
                      {foldedFeatures > 0 ? (
                        <p className={`${styles.rowLine} ${styles.rowMore}`}>
                          +{foldedFeatures.toLocaleString()} more column
                          {foldedFeatures === 1 ? "" : "s"}
                        </p>
                      ) : null}
                    </div>
                    <div className={styles.rowFooter}>
                      <p className={styles.rowLine}>
                        <span className={styles.rowKey}>{columnName(labelColumn)}</span>
                        <span className={styles.rowValue}>
                          <span
                            className={styles.keyDot}
                            style={{ background: currentRun.mark.fill }}
                          />
                          <Weighed text={cell(currentRow[labelColumn])} bold={answerWeight} />
                        </span>
                      </p>
                      <p className={styles.rowLine}>
                        <span className={styles.rowKey}>AI predicts</span>
                        {predicted !== undefined && currentState && currentState.reveal > 0 ? (
                          <span
                            className={styles.rowValue}
                            style={{ opacity: currentState.reveal }}
                          >
                            <span
                              className={styles.keyDot}
                              style={{ background: labelFill(indexOf(predicted)) }}
                            />
                            <Weighed text={String(predicted)} bold={1} />
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </div>
                ) : null}
                {restRows > 0 && restIn > 0 ? (
                  /* The rows not walked: tested the same way, all at once. */
                  <div className={styles.panelRest} style={{ opacity: restIn }}>
                    <FaIcon name="spinner" fontSize="20px" className={styles.spinner} aria-hidden />
                    <p className={styles.restText}>
                      Testing {restRows.toLocaleString()} more {rowWord}
                      {restRows === 1 ? "" : "s"}
                    </p>
                    {/* The count runs up as they go: how many that is. */}
                    <p className={styles.restCount}>
                      {(travelers + Math.round(restRows * restCounted)).toLocaleString()} of{" "}
                      {score.total.toLocaleString()} tested
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
            {result > 0 ? (
              <div className={styles.panelResults} style={{ opacity: clamp01(result * 2 - 1) }}>
                {/* As tall as the testing view's head, so the rule under it doesn't move. */}
                <div className={styles.resultHead} style={{ height: headH }}>
                  <p className={styles.resultLabel}>Accuracy</p>
                  <p className={styles.resultValue}>{accuracy}</p>
                  <p className={styles.resultDetail}>
                    AI predicts {score.right.toLocaleString()} of {noun(score.total)} correctly
                  </p>
                </div>
                {/* What that accuracy is for: the model's one sentence. */}
                <div className={styles.resultBody}>
                  <div
                    style={{
                      opacity: statementIn.opacity,
                      transform: `translateY(${statementIn.y}px)`,
                    }}
                  >
                    <PredictionStatement
                      columns={columns}
                      labelColumn={labelColumn}
                      features={features}
                      size="small"
                      stacked
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </aside>
        ) : null}

        {/* The test rows' dots, over the panel: in its slot, then out of it to the tree. */}
        <div className={`${styles.overlay} ${styles.overlayTop}`} aria-hidden>
          {panelStarted ? (
            <>
              {testDots.map(({ mark, style, loose }) =>
                loose ? (
                  <span
                    key={mark.key}
                    className={styles.dot}
                    style={{ width: dot, height: dot, ...style }}
                  />
                ) : null,
              )}
              {/* One row out of a dot of several, on its way to the tree. */}
              {dotIsRow
                ? null
                : runs.slice(0, travelers).map((run, order) => {
                    const u = walkOf(order);
                    const state = u > 0 ? walkAt(run.mark.key, u) : undefined;
                    return state && state.fly > 0 ? (
                      <span
                        key={`row-${run.mark.key}`}
                        className={styles.dot}
                        style={{
                          width: dot,
                          height: dot,
                          ...flying(run, state.fly, leaveFrom, false, predictedFill(run)),
                        }}
                      />
                    ) : null;
                  })}
            </>
          ) : (
            marks.map((mark, index) =>
              mark.test ? (
                <span
                  key={mark.key}
                  className={styles.dot}
                  style={{ width: dot, height: dot, ...placeDot(mark, index) }}
                />
              ) : null,
            )
          )}
        </div>
      </div>
      {actions ? (
        <div className={styles.actions}>
          <div className={styles.playback}>
            <Button
              size="medium"
              variant="outlined"
              color="secondary"
              iconOnly
              startIconName="rotate-left"
              aria-label="Replay"
              onClick={actions.onRestart}
            />
            {done ? null : (
              <Button
                size="medium"
                variant="contained"
                color="primary"
                iconOnly
                startIconName={actions.paused ? "play" : "pause"}
                aria-label={actions.paused ? "Play" : "Pause"}
                onClick={actions.onTogglePause}
              />
            )}
          </div>
          <Button size="medium" variant="outlined" color="secondary" onClick={actions.onBack}>
            {done ? "Back to dataset" : "Cancel"}
          </Button>
          <Button
            size="medium"
            variant="contained"
            color="primary"
            onClick={done ? actions.onContinue : actions.onSkip}
          >
            <span className={styles.actionLabel}>
              {done ? "Continue" : "Skip"}
              <FaIcon name="arrow-right" fontSize="18px" />
            </span>
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * A value in the row's card, at a weight between regular (0) and bold (1).
 * Both weights are set in the same place and cross-faded, so the value
 * holds the bold width throughout and nothing beside it moves.
 */
function Weighed({ text, bold }: { text: string; bold: number }) {
  return (
    <span className={styles.rowWeighed}>
      <span className={styles.rowText} style={{ opacity: 1 - bold }}>
        {text}
      </span>
      <span className={`${styles.rowText} ${styles.rowBold}`} style={{ opacity: bold }} aria-hidden>
        {text}
      </span>
    </span>
  );
}

function cell(value: string | number | undefined): string {
  return value === undefined ? "—" : formatCell(value);
}

function moreText(count: number): string {
  return `+${count} more question${count === 1 ? "" : "s"}`;
}

/** The node after `key` on `path` (where a row went from that question). */
function childOnPath(path: string[], key: string): string {
  return path[path.indexOf(key) + 1] ?? "";
}

/**
 * From a question down to a child: a soft S to the level's shared line,
 * over the child, then straight down the stub into it.
 */
function linkPath(sx: number, sy: number, tx: number, stubTop: number, ty: number): string {
  /* While a question is still rising into place it may sit below the line: no S yet. */
  const bend = Math.max(sy, stubTop);
  const midY = (sy + bend) / 2;
  return `M ${sx} ${sy} C ${sx} ${midY}, ${tx} ${midY}, ${tx} ${bend} L ${tx} ${Math.max(bend, ty)}`;
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

/**
 * `count` rows packed loosely into a dot's footprint, `pitch` apart or so:
 * a sunflower knocked about (each spot off its place, some more than
 * others, the whole turned and a little out of round), then eased apart
 * until no two overlap. `seed` makes each dot's pack its own, the same
 * every time.
 */
function packRows(count: number, pitch: number, seed: number): Point[] {
  let state = (seed * 2654435761 + 97) >>> 0 || 1;
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const turn = random() * 2 * Math.PI;
  /* Out of round: squeezed one way and stretched the other, by up to a fifth. */
  const squeeze = 1 + (random() - 0.5) * 0.4;
  const lean = random() * Math.PI;
  const spots = Array.from({ length: count }, (_, index) => {
    const spot = sunflower(index, pitch);
    const knock = pitch * 0.9 * random();
    const way = random() * 2 * Math.PI;
    const x = spot.x * Math.cos(turn) - spot.y * Math.sin(turn) + knock * Math.cos(way);
    const y = spot.x * Math.sin(turn) + spot.y * Math.cos(turn) + knock * Math.sin(way);
    /* Squeeze along `lean`. */
    const along = x * Math.cos(lean) + y * Math.sin(lean);
    const across = -x * Math.sin(lean) + y * Math.cos(lean);
    return {
      x: along * squeeze * Math.cos(lean) - (across / squeeze) * Math.sin(lean),
      y: along * squeeze * Math.sin(lean) + (across / squeeze) * Math.cos(lean),
    };
  });
  /* Ease them apart (a row is 1.5 pitches across) and keep them in the dot. */
  const apart = pitch * 1.62;
  const within = pitch * (Math.sqrt(Math.max(0.5, count - 0.5)) + 0.2);
  for (let pass = 0; pass < 30; pass += 1) {
    for (let i = 0; i < count; i += 1) {
      for (let j = i + 1; j < count; j += 1) {
        const dx = spots[j]!.x - spots[i]!.x;
        const dy = spots[j]!.y - spots[i]!.y;
        const d = Math.hypot(dx, dy) || 0.001;
        if (d >= apart) continue;
        const push = (apart - d) / 2;
        spots[i]!.x -= (dx / d) * push;
        spots[i]!.y -= (dy / d) * push;
        spots[j]!.x += (dx / d) * push;
        spots[j]!.y += (dy / d) * push;
      }
    }
    spots.forEach((spot) => {
      const out = Math.hypot(spot.x, spot.y);
      if (out > within) {
        spot.x *= within / out;
        spot.y *= within / out;
      }
    });
  }
  return spots;
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

type TreeWords = Map<string, { chip: number; label: number; answer: number }>;

interface TreeFrame {
  /** Zoom on the dots (1 = the cluster's own size). */
  scale: number;
  /** Zoom on everything else (chips, labels, gaps): 1 unless the tree is too big. */
  camera: number;
  /** Height of the frame's tree, in px. */
  height: number;
  /** Node key → pile center, in overlay px (from the tree's top until placed). */
  spots: Map<string, Point>;
  /** Depth → the top of that level's row, in overlay px (likewise). */
  tops: number[];
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
 * The tree down to depth `k`, laid out from its own contents: a pile, its
 * question, or its label sets each node's width, a parent spans its
 * children, and each level is as tall as its biggest pile (a question that
 * has split is just its chip). Every node hangs from the top of its
 * level's row, so the links into a level all end on one line. Zoomed out
 * as far as it must be to fit.
 */
function fitFrame(
  layout: TreeLayout,
  k: number,
  counts: Map<string, number>,
  words: TreeWords,
  width: number,
  dot: number,
  pitch: number,
  /** Let the levels out downward until the tree is this tall (px), if it comes out shorter. */
  tallAs = 0,
): TreeFrame {
  const root = layout.nodes[0]!;
  const shown = layout.nodes.filter((laid) => laid.depth <= k);
  const ends = (laid: LaidOutNode) => laid.node.type === "leaf" || laid.depth === k;
  const build = (scale: number, slack = 0) => {
    const radius = (laid: LaidOutNode) =>
      (pitch * Math.sqrt(Math.max(1, counts.get(laid.key) ?? 0)) + dot / 2) * scale;
    const spans = new Map<string, number>();
    const span = (laid: LaidOutNode): number => {
      const said = words.get(laid.key)!;
      let wide: number;
      if (ends(laid)) {
        wide = Math.max(2 * radius(laid), laid.node.type === "leaf" ? said.label : said.chip);
      } else {
        const kids = laid.childKeys.map((key) => layout.byKey.get(key)!);
        const sum = kids.reduce((total, kid) => total + span(kid), 0);
        wide = Math.max(sum + LANE_GAP * (kids.length - 1), said.chip);
      }
      wide = Math.max(wide, said.answer);
      spans.set(laid.key, wide);
      return wide;
    };
    const fullWidth = span(root);
    const tops: number[] = [];
    let y = 0;
    for (let depth = 0; depth <= k; depth += 1) {
      const row = shown.filter((laid) => laid.depth === depth);
      /* Each node hangs from the row's top with its label or question
         under it, so the room a row needs is its tallest stack. */
      const stack = Math.max(
        0,
        ...row.map((laid) =>
          !ends(laid)
            ? CHIP_H
            : 2 * radius(laid) + (laid.node.type === "leaf" ? LABEL_BAND : CHIP_GAP + CHIP_H),
        ),
      );
      tops[depth] = y;
      y += stack + (depth < k ? LINK_BAND + slack : 0);
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
        let from = left + (wide - sum) / 2;
        const xs = kids.map((kid) => {
          const kidX = place(kid, from);
          from += spans.get(kid.key)! + LANE_GAP;
          return kidX;
        });
        x = (xs[0]! + xs[xs.length - 1]!) / 2;
      }
      spots.set(laid.key, {
        x,
        y: tops[laid.depth]! + (ends(laid) ? radius(laid) : CHIP_H / 2),
      });
      return x;
    };
    place(root, 0);
    return { fullWidth, fullHeight: y, spots, tops };
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
  /* A tree held small by its width comes out short. The height it is
     owed is shared out between the levels: the links run longer, the
     words and piles keep their size. */
  const short = Math.min(tallAs, roomH) / camera - build(scale).fullHeight;
  const slack = k > 0 && short > 0 ? Math.min(LINK_BAND * TALL_MOST, short / k) : 0;
  const { fullWidth, fullHeight, spots, tops } = build(scale, slack);
  const left = (width - fullWidth * camera) / 2;
  spots.forEach((spot) => {
    spot.x = left + spot.x * camera;
    spot.y *= camera;
  });
  return {
    scale: scale * camera,
    camera,
    height: fullHeight * camera,
    spots,
    tops: tops.map((y) => y * camera),
  };
}
