import { useEffect, useMemo, useRef, useState } from "react";
import {
  cartRegressionTolerance,
  columnById,
  columnType,
  traceDecisionTree,
  treeSplitCandidates,
  type AiLabNodeCandidates,
} from "../../../../lib/aiLab";
import type { AiLabHoldoutResult } from "../../../../types/aiLab";
import type { TrainingRowWalkProps } from "./TrainingModalShell";
import { OTHER_WEDGE } from "./viz/labelGroups";
import { labelFill, OTHER_LABEL_INDEX } from "./viz/labelPalette";
import {
   useSortingModel,
  type SortingLook,
  type SortingMarbleStyle,
  type SortingTreeState,
} from "./viz/SortingTree";
import { treeScore } from "./viz/TreeGrowth";
import { prefersReducedMotion } from "./viz/useStepPlayback";

/** Rows that roll through the tree one at a time during Testing. */
const QUIZ_SIZE = 3;
/** Each quiz row plays faster than the last; the idea lands on the first. */
const QUIZ_PACE = [1, 0.8, 0.65];
/**
 * After `guessed`, the landing leaf bounces (`.nodeAnswer`, 250ms) before
 * the guess fills its cell; the reveal waits this out too.
 */
export const GUESS_DELAY_MS = 250;
/**
 * Then the guess flies from the leaf into the row's label cell
 * (`TreeTableRow`), which fills in as it lands.
 */
export const GUESS_FLY_MS = 520;
/** `grow`: how many rows join one at a time, in the dock, before the pour. */
export const GROW_SLOW = 6;
/** Each slow row runs a bit faster than the last, so the pace builds. */
const INTAKE_PACE = [1, 0.85, 0.72, 0.6, 0.5, 0.42];

export type DotEasePreset = "move" | "snappy" | "spring" | "smooth" | "linear";

export const DOT_EASE_VALUES: Record<DotEasePreset, string> = {
  move: "cubic-bezier(0.55, 0, 0.25, 1)",
  snappy: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  spring: "cubic-bezier(0.34, 1.35, 0.64, 1)",
  smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
  linear: "linear",
};

/**
 * `grow`: the data table opens the run, narrows to the chosen
 * columns, spins like a lotto wheel (speeds up, slows, lands on the first
 * training row right where the dock sits), then the rest fades to the tree.
 */
export const INTRO_FILTER_MS = 650;
export const INTRO_SCROLL_MS = 3200;
/** The wheel's small settle after it lands, before the fade. */
const INTRO_LAND_HOLD_MS = 350;
export const INTRO_FADE_MS = 500;

/** Candidate questions the root shows; it's the first search, so it gets them all (up to this). */
const ROOT_SCAN_MAX = 8;
/** Deeper piles show the winner and a few others, faster; the rest are counted, not drawn. */
const SCAN_MAX = 4;

/**
 * Full parametric configuration for the training & testing animation.
 * Every field defaults to the canonical production value so callers that
 * omit options get the exact baseline choreography, while `/experiments/ailab-training`
 * can tune every knob in real time.
 */
export interface TrainingWalkParams {
  /** `grow` only: open on the data table narrowing and scrolling. */
  intro: boolean;
  /** `grow` only: how the tree takes shape; defaults to `organic`. */
  growth: GrowthMode;
  /** `scan` only: show the "Sorts" impurity reduction meter under each candidate. */
  scanMeter: boolean;
  /** Testing path visualization style (`rider`, `trace`, or `marble`). */
  marbleStyle: SortingMarbleStyle;
  /** Tree card density look (`compact` or `default`). */
  look: SortingLook;
  /** Scale CSS transitions & WAAPI flights with the playback speed multiplier. */
  scaleCssWithSpeed: boolean;

  /* ── Dots, piles & tree geometry ── */
  /** Maximum dots before condensing rows (`MAX_DOTS`). */
  maxDots: number;
  /** Multiplier on dot diameter and gap (`0.6`–`1.6`). */
  dotScale: number;
  /** Maximum scale factor for small trees in `TreeTableRow` (`MAX_TREE_SCALE`). */
  maxTreeScale: number;
  /** Vertical gap (px) between tree levels in `compact` look. */
  levelGap: number;
  /** Connector elbow bend position as a fraction of the parent→child gap (`0.15`–`0.75`). */
  bendRatio: number;

  /* ── CSS & stage motion timings ── */
  /** Dot glide transition duration between piles (ms). */
  dotGlideMs: number;
  /** Easing curve preset for dot glides. */
  dotEase: DotEasePreset;
  /** Total stagger window (ms) when dots first pop into the root pile. */
  popStaggerMaxMs: number;
  /** Total stagger window (ms) when a pile splits into child piles. */
  moveStaggerMaxMs: number;
  /** Node & edge-label entrance fade/slide duration (ms). */
  nodeEnterMs: number;
  /** Bottom/top dock sheet slide-in duration (ms). */
  sheetInMs: number;
  /** Bottom/top dock sheet slide-out duration (ms). */
  sheetOutMs: number;

  /* ── Opening & `sort` beats ── */
  /** Wait (ms) before the label legend slides in. */
  openLegendMs: number;
  /** Wait (ms) after legend before the empty root node appears. */
  openRootMs: number;
  /** Wait (ms) after root before dots pop into the root pile. */
  openReadMs: number;
  /** Wait (ms) before the first question appears on the root pile. */
  firstSplitWaitMs: number;
  /** Base wait (ms) before subsequent questions appear (scaled by `splitPace`). */
  splitWaitMs: number;
  /** Base wait (ms) after a question appears before its child piles sprout. */
  branchWaitMs: number;
  /** Base wait (ms) after child piles sprout before dots glide into them. */
  sortWaitMs: number;
  /** Minimum multiplier for `splitPace(splitCount)` on deeper trees (`0.25`–`1`). */
  splitPaceFloor: number;
  /** Base wait (ms) before leaves name their predicted label. */
  namedWaitMs: number;
  /** Hold (ms) after training completes before Testing begins. */
  preTestHoldMs: number;

  /* ── `scan` story beats ── */
  /** Max candidate questions previewed at the root split. */
  rootScanMax: number;
  /** Max candidate questions previewed at deeper splits. */
  deepScanMax: number;
  /** Dwell time (ms) per candidate question at the root split. */
  scanRootStepMs: number;
  /** Base dwell time (ms) per candidate question at deeper splits. */
  scanDeepStepMs: number;
  /** Wait (ms) after picking the winning question at the root before asking it. */
  scanPickHoldMs: number;
  /** Max preview dots drawn across candidate piles in `SplitScan`. */
  scanPreviewDots: number;

  /* ── `grow` story & `TableIntro` beats ── */
  /** Number of initial rows that dock and scan one at a time (`GROW_SLOW`). */
  growSlowCount: number;
  /** Base reel settle duration (ms) for slow rows after the first. */
  intakeSettleMs: number;
  /** Base scanner sweep duration (ms) across a docked slow row. */
  intakeScanMs: number;
  /** Base dot drop flight duration (ms) from the dock cell into the tree. */
  intakeFlyMs: number;
  /** Base gap (ms) after a slow dot lands before the next row spins in. */
  intakeGapMs: number;
  /** Per-row pace multiplier decay (`0.55`–`1.0`; `0.85` matches `INTAKE_PACE`). */
  intakePaceDecay: number;
  /** Base wait (ms) between exponential batch pours after slow rows finish. */
  pourBatchWaitMs: number;
  /** `TableIntro`: column-narrowing transition duration (ms). */
  introFilterMs: number;
  /** `TableIntro`: lotto-wheel spin duration (ms). */
  introScrollMs: number;
  /** `TableIntro`: hold (ms) on the landed first row before fading to the tree. */
  introHoldMs: number;
  /** `TableIntro`: cross-fade duration (ms) from the intro overlay to the dock. */
  introFadeMs: number;
  /** `TableIntro`: number of rows spun past before landing on the target row. */
  introSpinRows: number;
  /** `TableIntro`: overshoot distance (px) before the wheel settles back. */
  introOvershootPx: number;
  /** `TableIntro`: fraction of spin elapsed before the window shrinks to 1 row (`0.1`–`0.8`). */
  introShrinkFrom: number;

  /* ── Testing & Score beats ── */
  /** Number of test rows quizzed one by one (`QUIZ_SIZE`). */
  quizSize: number;
  /** Base marble/trace travel duration (ms) per tree step on the first quiz row. */
  quizTravelMs: number;
  /** Per-row pace decay across quiz rows (`0.5`–`1.0`; `0.8` matches `QUIZ_PACE`). */
  quizPaceDecay: number;
  /** Share of a quiz step spent drawing/rolling along the connector (`CONNECTOR_SHARE`). */
  connectorShare: number;
  /** Extra draw time (ms) added to connector trace duration (`TRACE_EXTRA_MS`). */
  traceExtraMs: number;
  /** Leaf answer bounce delay (ms) before the guess flies to the dock (`GUESS_DELAY_MS`). */
  guessDelayMs: number;
  /** Duration (ms) of the guess pill flying from the leaf to the dock cell (`GUESS_FLY_MS`). */
  guessFlyMs: number;
  /** Upward arc height (px) of the flying guess pill (`FLY_ARC`). */
  flyArcPx: number;
  /** Base pause (ms) after the guess lands before advancing (`500` in `buildBeats`). */
  postRevealHoldMs: number;
  /** Hold (ms) before switching from Testing to Checking all rows. */
  checkingHoldMs: number;
  /** Hold (ms) on the checking state before marking the run `"done"`. */
  doneHoldMs: number;
}

export const DEFAULT_TRAINING_PARAMS: TrainingWalkParams = {
  intro: false,
  growth: "organic",
  scanMeter: true,
  marbleStyle: "rider",
  look: "compact",
  scaleCssWithSpeed: true,

  maxDots: 240,
  dotScale: 1,
  maxTreeScale: 1.35,
  levelGap: 55,
  bendRatio: Number((16 / 55).toFixed(2)),

  dotGlideMs: 560,
  dotEase: "move",
  popStaggerMaxMs: 700,
  moveStaggerMaxMs: 320,
  nodeEnterMs: 320,
  sheetInMs: 285,
  sheetOutMs: 185,

  openLegendMs: 500,
  openRootMs: 500,
  openReadMs: 350,
  firstSplitWaitMs: 1300,
  splitWaitMs: 1000,
  branchWaitMs: 550,
  sortWaitMs: 450,
  splitPaceFloor: 0.45,
  namedWaitMs: 1100,
  preTestHoldMs: 1700,

  rootScanMax: ROOT_SCAN_MAX,
  deepScanMax: SCAN_MAX,
  scanRootStepMs: 800,
  scanDeepStepMs: 420,
  scanPickHoldMs: 1000,
  scanPreviewDots: 48,

  growSlowCount: GROW_SLOW,
  intakeSettleMs: 1100,
  intakeScanMs: 1800,
  intakeFlyMs: 720,
  intakeGapMs: 220,
  intakePaceDecay: 0.85,
  pourBatchWaitMs: 280,
  introFilterMs: INTRO_FILTER_MS,
  introScrollMs: INTRO_SCROLL_MS,
  introHoldMs: INTRO_LAND_HOLD_MS,
  introFadeMs: INTRO_FADE_MS,
  introSpinRows: 64,
  introOvershootPx: 7,
  introShrinkFrom: 0.35,

  quizSize: QUIZ_SIZE,
  quizTravelMs: 680,
  quizPaceDecay: 0.8,
  connectorShare: 0.8,
  traceExtraMs: 50,
  guessDelayMs: GUESS_DELAY_MS,
  guessFlyMs: GUESS_FLY_MS,
  flyArcPx: 28,
  postRevealHoldMs: 500,
  checkingHoldMs: 1100,
  doneHoldMs: 1500,
};

export function resolveTrainingParams(
  overrides?: Partial<TrainingWalkParams>,
): TrainingWalkParams {
  if (!overrides) return DEFAULT_TRAINING_PARAMS;
  return { ...DEFAULT_TRAINING_PARAMS, ...overrides };
}

export interface IntakeTiming {
  /** The sheet sliding down (first row) or the reel spinning to the next. */
  settle: number;
  /** The scanner sweeping across the row and back. */
  scan: number;
  /** The label cell's dot dropping onto its pile. */
  fly: number;
  /** Pause before the next row swaps in. */
  gap: number;
}

function intakePaceAt(rank: number, decay: number): number {
  if (decay === DEFAULT_TRAINING_PARAMS.intakePaceDecay && rank < INTAKE_PACE.length) {
    return INTAKE_PACE[rank]!;
  }
  return Math.max(0.25, Number(Math.pow(decay, rank).toFixed(3)));
}

function quizPaceAt(index: number, decay: number): number {
  if (decay === DEFAULT_TRAINING_PARAMS.quizPaceDecay && index < QUIZ_PACE.length) {
    return QUIZ_PACE[index]!;
  }
  return Math.max(0.3, Number(Math.pow(decay, index).toFixed(3)));
}

/**
 * `grow`: one slow row's timing. The stage (sweep, morph) and the beats
 * (when the dot lands) both read this, so they can't drift apart.
 */
export function intakeTiming(
  rank: number,
  intro = false,
  params: TrainingWalkParams = DEFAULT_TRAINING_PARAMS,
): IntakeTiming {
  const pace = intakePaceAt(rank, params.intakePaceDecay);
  const settleFloor = Math.round(params.intakeSettleMs * 0.545);
  const scanFloor = Math.round(params.intakeScanMs * 0.444);
  const flyFloor = Math.round(params.intakeFlyMs * 0.528);
  return {
    /* The first row slides in with the dock (or waits out the intro's
       handoff); later ones spin in on the dock's reel. */
    settle:
      rank === 0
        ? intro
          ? params.introFadeMs + 120
          : 320
        : Math.round(Math.max(settleFloor, params.intakeSettleMs * pace)),
    /* One left-to-right pass; the first rows take their time. */
    scan: Math.round(Math.max(scanFloor, params.intakeScanMs * pace)),
    fly: Math.round(Math.max(flyFloor, params.intakeFlyMs * pace)),
    gap: Math.round(params.intakeGapMs * pace),
  };
}

export type Act = "training" | "testing" | "checking" | "done";

/**
 * How Training is told. `sort` pours every row into the finished tree's
 * questions. `scan` shows the search our trainer really runs: each pile
 * tries every column's question and keeps the one that sorts best. `grow`
 * is the row-at-a-time picture (rows arrive shuffled; a question appears
 * the first time its pile gets mixed) — not how our trainer works, kept to
 * compare; it grows the same final tree so Testing matches.
 */
export type TrainingStory = "sort" | "scan" | "grow";

export interface WalkState extends SortingTreeState {
  act: Act;
  /** `scan`: split (ask order) whose candidate questions are being tried; −1 none. */
  scan: number;
  /** `scan`: index into that split's `candidates` on show; −1 none. */
  candidate: number;
  /** `scan`: the shown candidate is the winner. */
  picked: boolean;
  /**
   * `grow`: which of the first `GROW_SLOW` arrivals is in the dock (−1 once
   * the rest pour in without a row). Its dot lands on the next `dotsShown`.
   */
  intake: number;
  /**
   * Table intro: 0 the whole sheet, 1 narrowed to the chosen columns,
   * 2 spinning down onto the first training row, 3 everything but that row
   * fading out; −1 not shown (or done).
   */
  intro: number;
  /** The stage's label key has slid in (first beat after open). */
  legend: boolean;
  /** Quiz row on the card (−1 before Testing). */
  quiz: number;
  /** Marble position along the quiz row's path; −1 hides it. */
  step: number;
  /** The leaf the marble landed in has announced its guess. */
  guessed: boolean;
  /** Quiz rows whose real label has been shown. */
  revealed: number;
  travelMs: number;
}

export const INITIAL_WALK: WalkState = {
  act: "training",
  scan: -1,
  candidate: -1,
  picked: false,
  intake: -1,
  intro: -1,
  legend: false,
  rootShown: false,
  read: false,
  splitsShown: 0,
  childrenShown: 0,
  splitsDone: 0,
  named: false,
  quiet: false,
  checked: false,
  quiz: -1,
  step: -1,
  guessed: false,
  revealed: 0,
  travelMs: 600,
};

/** One state change, `wait` ms after the previous one. */
export interface Beat {
  wait: number;
  patch: Partial<WalkState>;
}

export interface QuizRow {
  result: AiLabHoldoutResult;
  pathKeys: string[];
}

/** What a sort-and-quiz stage needs from the lab, minus the modal wiring. */
export type TrainingWalkData = Pick<
  TrainingRowWalkProps,
  | "tree"
  | "columns"
  | "labelColumn"
  | "features"
  | "labels"
  | "rowNoun"
  | "rows"
  | "results"
  | "titleColumn"
>;

export interface TallyEntry {
  label: string;
  fill: string;
  count: number;
  /** Set on the folded entry: the labels it stands for, most common first. */
  folded?: string[];
}

/** `scan`: what one split tries, and which of those tries the stage shows. */
export interface ScanPlan extends AiLabNodeCandidates {
  key: string;
  /** Candidate indexes on show, in feature order (deep piles show a few). */
  shown: number[];
}

/**
 * `grow`: how the tree takes shape as rows arrive.
 * - `organic`: a question appears once its pile holds two labels; each
 *   branch sprouts when the first row heads down it.
 * - `paired`: same questions, but a split's branches sprout together (a
 *   split is one decision), and the first rows are picked to cover both
 *   sides early.
 * - `batch`: the tree is built from the whole table first, as our trainer
 *   does; the rows then sort into it.
 */
export type GrowthMode = "organic" | "paired" | "batch";

/** `grow`: the order questions appear in and the order rows arrive in. */
export interface GrowPlan {
  growth: GrowthMode;
  /**
   * `batch` with the intro: ms the first row waits in the dock while the
   * tree builds, before its scan starts.
   */
  hold: number;
  /** Split keys, in the order their piles first got mixed. */
  order: string[];
  /** Dot id → arrival rank. */
  arrival: number[];
  /** Arrival rank → dot id, so the dock can show that row. */
  arrivals: number[];
  /** Per `order` entry: arrivals landed when it appears. */
  revealAfter: number[];
}

export interface TrainingWalk {
  story: TrainingStory;
  /** `grow`: the run opens on the data table (`WalkState.intro`). */
  intro: boolean;
  /** Resolved parametric configuration driving this walk. */
  params: TrainingWalkParams;
  /** `scan`: one entry per split, in ask order. */
  scanPlan?: ScanPlan[];
  /** `grow`: the stage re-orders its splits (`withSplitOrder`) to match. */
  growPlan?: GrowPlan;
  model: ReturnType<typeof useSortingModel>;
  score: { right: number; total: number };
  indexOf: (label: string) => number;
  quiz: QuizRow[];
  /**
   * Key entries. Past the palette, the last one is the folded rest
   * (`folded`): "+N more", in Other's neutral.
   */
  tally: TallyEntry[];
  labelName: string;
  beats: Beat[];
  final: WalkState;
}

/**
 * Props every sort-and-quiz stage renders from. The lab's modal drives
 * `state` with timers; the training sandbox drives it from a scrubbable
 * clock, so a stage must render any state without relying on how it got
 * there (`instant` means "jumped here, don't animate").
 */
export interface TrainingStageProps {
  data: TrainingWalkData;
  walk: TrainingWalk;
  state: WalkState;
  instant: boolean;
  /** Playback speed multiplier (`1` by default); used when `params.scaleCssWithSpeed` is true. */
  speed?: number;
}

export function useTrainingWalk(
  data: TrainingWalkData,
  story: TrainingStory = "sort",
  options: Partial<TrainingWalkParams> = {},
): TrainingWalk {
  const params = useMemo(() => resolveTrainingParams(options), [options]);
  const intro = story === "grow" && params.intro === true;
  const growth = params.growth;
  const { tree, rows, labelColumn, labels, results, columns, features } = data;
  const model = useSortingModel(tree, rows, labelColumn, labels, "default", columns, {
    maxDots: params.maxDots,
    dotScale: params.dotScale,
    levelGap: params.levelGap,
    bendRatio: params.bendRatio,
  });
  const tolerance = useMemo(
    () =>
      columnType(columns, labelColumn) === "numerical"
        ? cartRegressionTolerance(rows, labelColumn)
        : 0,
    [columns, labelColumn, rows],
  );
  const score = useMemo(() => treeScore(tree, tolerance), [tolerance, tree]);
  const { grouping } = model;
  const indexOf = grouping.indexOf;
  const quiz = useMemo<QuizRow[]>(
    () =>
      orderQuiz(pickSample(results, Math.max(1, params.quizSize))).map((result) => ({
        result,
        pathKeys: rows[result.rowIndex]
          ? traceDecisionTree(tree, rows[result.rowIndex]!).pathKeys
          : ["root"],
      })),
    [results, rows, tree, params.quizSize],
  );
  const tally = useMemo(() => {
    const counts = new Map<string, number>();
    rows.forEach((row) => {
      const label = String(row[labelColumn]);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    });
    if (grouping.foldedCount === 0) {
      return labels.map((label) => ({
        label,
        fill: labelFill(indexOf(label)),
        count: counts.get(label) ?? 0,
      }));
    }
    const named = grouping.wedges.filter((wedge) => wedge !== OTHER_WEDGE);
    const rest = labels
      .filter((label) => grouping.wedgeOf(label) === OTHER_WEDGE)
      .sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0));
    return [
      ...named.map((label) => ({
        label,
        fill: labelFill(indexOf(label)),
        count: counts.get(label) ?? 0,
      })),
      {
        label: `+${grouping.foldedCount} more`,
        fill: labelFill(OTHER_LABEL_INDEX),
        count: rest.reduce((sum, label) => sum + (counts.get(label) ?? 0), 0),
        folded: rest,
      },
    ];
  }, [rows, labelColumn, labels, indexOf, grouping]);
  const splitCount = model.splits.length;
  const scanPlan = useMemo(() => {
    if (story !== "scan") return undefined;
    const byNode = treeSplitCandidates(tree, rows, columns, features, labelColumn);
    return model.splits.map((laid, index): ScanPlan => {
      const found = byNode.get(laid.key) ?? { candidates: [], best: 0, checked: 0 };
      return {
        ...found,
        key: laid.key,
        shown: shownCandidates(
          found,
          index === 0 ? params.rootScanMax : params.deepScanMax,
        ),
      };
    });
  }, [
    story,
    tree,
    rows,
    columns,
    features,
    labelColumn,
    model.splits,
    params.rootScanMax,
    params.deepScanMax,
  ]);
  const growPlan = useMemo(
    () => (story === "grow" ? planGrowth(model, growth, intro, params) : undefined),
    [story, model, growth, intro, params],
  );
  const { beats, final } = useMemo(() => {
    const training = scanPlan
      ? scanBeats(scanPlan, params)
      : growPlan
        ? growBeats(growPlan, model.dots.length, intro, params)
        : sortBeats(splitCount, params);
    return buildBeats(training, splitCount, quiz, params);
  }, [scanPlan, growPlan, model.dots.length, splitCount, quiz, intro, params]);
  const labelName = columnById(columns, labelColumn)?.name ?? labelColumn;
  return useMemo(
    () => ({
      story,
      intro,
      params,
      scanPlan,
      growPlan,
      model,
      score,
      indexOf,
      quiz,
      tally,
      labelName,
      beats,
      final,
    }),
    [
      story,
      intro,
      params,
      scanPlan,
      growPlan,
      model,
      score,
      indexOf,
      quiz,
      tally,
      labelName,
      beats,
      final,
    ],
  );
}

/** The winner plus the first others in feature order, kept in feature order. */
function shownCandidates(found: AiLabNodeCandidates, max: number): number[] {
  const indexes = found.candidates.map((_, index) => index);
  if (indexes.length <= max) return indexes;
  const others = indexes.filter((index) => index !== found.best).slice(0, max - 1);
  return [...others, found.best].sort((a, b) => a - b);
}

/**
 * Rows in a shuffled (fixed) order; after each one lands, any question
 * whose pile now holds two labels appears — the parent's first, so its
 * rows fall into the children before they're checked. `batch` asks every
 * question up front, in layout order.
 */
function planGrowth(
  model: ReturnType<typeof useSortingModel>,
  growth: GrowthMode,
  intro: boolean,
  params: TrainingWalkParams = DEFAULT_TRAINING_PARAMS,
): GrowPlan {
  const { dots, splits, layout } = model;
  const shuffledOrder = shuffled(dots.map((dot) => dot.id), dots.length * 7919 + splits.length);
  const order =
    growth === "organic"
      ? shuffledOrder
      : coverFirst(shuffledOrder, model, params.growSlowCount);
  if (growth === "batch") {
    const arrival: number[] = [];
    order.forEach((id, rank) => (arrival[id] = rank));
    const askMs = 450 + 450 + 400;
    return {
      growth,
      hold: intro
        ? Math.round(
            splits.length * askMs * splitPace(splits.length, params.splitPaceFloor),
          )
        : 0,
      order: splits.map((laid) => laid.key),
      arrival,
      arrivals: order,
      revealAfter: splits.map(() => 0),
    };
  }
  const arrival: number[] = [];
  order.forEach((id, rank) => (arrival[id] = rank));
  const labelsAt = new Map<string, Set<string>>();
  const revealed: string[] = [];
  const revealAfter: number[] = [];
  const isRevealed = new Set<string>();
  const ready = (key: string) => {
    const parent = layout.byKey.get(key)?.parentKey;
    return !parent || isRevealed.has(parent);
  };
  order.forEach((id, rank) => {
    const dot = dots[id]!;
    dot.pathKeys.forEach((key) => {
      const set = labelsAt.get(key) ?? new Set<string>();
      set.add(dot.label);
      labelsAt.set(key, set);
    });
    let changed = true;
    while (changed) {
      changed = false;
      for (const laid of splits) {
        if (isRevealed.has(laid.key) || !ready(laid.key)) continue;
        if ((labelsAt.get(laid.key)?.size ?? 0) >= 2) {
          isRevealed.add(laid.key);
          revealed.push(laid.key);
          revealAfter.push(rank + 1);
          changed = true;
        }
      }
    }
  });
  splits.forEach((laid) => {
    if (isRevealed.has(laid.key)) return;
    revealed.push(laid.key);
    revealAfter.push(order.length);
  });
  return { growth, hold: 0, order: revealed, arrival, arrivals: order, revealAfter };
}

/**
 * Re-picks the first `slowCount` rows so they spread out: each is the
 * earliest remaining row that lands in a leaf no slow row has yet, on the
 * root side with fewer rows so far. The rest keep their shuffled order.
 */
function coverFirst(
  order: number[],
  model: ReturnType<typeof useSortingModel>,
  slowCount: number = GROW_SLOW,
): number[] {
  const rest = [...order];
  const picked: number[] = [];
  const visits = new Map<string, number>();
  const cost = (id: number) => {
    const keys = model.dots[id]!.pathKeys;
    const leaf = keys[keys.length - 1]!;
    return (visits.has(leaf) ? 1000 : 0) + (visits.get(keys[1] ?? "") ?? 0);
  };
  while (picked.length < slowCount && rest.length > 0) {
    let best = 0;
    rest.forEach((id, index) => {
      if (cost(id) < cost(rest[best]!)) best = index;
    });
    const [id] = rest.splice(best, 1);
    picked.push(id!);
    model.dots[id!]!.pathKeys.forEach((key) => visits.set(key, (visits.get(key) ?? 0) + 1));
  }
  return [...picked, ...rest];
}

/** Seeded Fisher–Yates, so scrubbing replays the same arrival order. */
function shuffled<T>(items: T[], seed: number): T[] {
  const out = items.slice();
  let state = seed >>> 0 || 1;
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let index = out.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [out[index], out[swap]] = [out[swap]!, out[index]!];
  }
  return out;
}

/**
 * Timer playback for the lab's modal: every open replays from the empty
 * pile, reduced motion lands on the end, and `skip` stops the timers and
 * lands there too (`instant`, so the stage doesn't animate the jump).
 */
export function useWalkPlayback(open: boolean, walk: TrainingWalk) {
  const { beats, final } = walk;
  const [state, setState] = useState<WalkState>(INITIAL_WALK);
  const [instant, setInstant] = useState(false);
  const [paused, setPaused] = useState(false);
  /** Bumped by `restart` to replay from the first beat. */
  const [run, setRun] = useState(0);
  const controlRef = useRef({ stop: () => {}, pause: () => {}, resume: () => {} });

  useEffect(() => {
    if (!open) return;
    setPaused(false);
    if (prefersReducedMotion()) {
      setInstant(true);
      setState(final);
      return;
    }
    setInstant(false);
    setState(INITIAL_WALK);
    let index = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let due = 0;
    let remaining = 0;
    let held = false;
    const schedule = (ms: number) => {
      due = performance.now() + ms;
      timer = setTimeout(fire, ms);
    };
    const fire = () => {
      const beat = beats[index];
      if (!beat) return;
      index += 1;
      setState((current) => ({ ...current, ...beat.patch }));
      const next = beats[index];
      if (next) schedule(next.wait);
    };
    if (beats[0]) schedule(beats[0].wait);
    controlRef.current = {
      stop: () => clearTimeout(timer),
      pause: () => {
        if (held) return;
        held = true;
        clearTimeout(timer);
        remaining = Math.max(0, due - performance.now());
      },
      resume: () => {
        if (!held) return;
        held = false;
        if (beats[index]) schedule(remaining);
      },
    };
    return () => clearTimeout(timer);
  }, [open, beats, final, run]);

  const skip = () => {
    controlRef.current.stop();
    setPaused(false);
    setInstant(true);
    setState(final);
  };
  /** Holds the next beat; in-flight motion finishes. */
  const togglePause = () => {
    if (paused) controlRef.current.resume();
    else controlRef.current.pause();
    setPaused(!paused);
  };
  const restart = () => setRun((value) => value + 1);

  return { state, instant, skip, paused, togglePause, restart };
}

/** Clock time (ms from open) at which each beat lands. */
export function beatTimes(beats: Beat[]): number[] {
  let at = 0;
  return beats.map((beat) => (at += beat.wait));
}

/** The state after the first `count` beats have landed. */
export function stateAfter(beats: Beat[], count: number): WalkState {
  let state = INITIAL_WALK;
  for (let index = 0; index < count && index < beats.length; index += 1) {
    state = { ...state, ...beats[index]!.patch };
  }
  return state;
}

/** Bigger trees ask each question a bit faster. */
function splitPace(splitCount: number, floor = 0.45): number {
  return Math.min(1, Math.max(floor, 3 / Math.max(1, splitCount)));
}

/**
 * `sort`: the opening stagger (key row, empty root, its dots), then each
 * question appears, branches, and sorts its pile.
 */
function sortBeats(
  splitCount: number,
  params: TrainingWalkParams = DEFAULT_TRAINING_PARAMS,
): Beat[] {
  const f = splitPace(splitCount, params.splitPaceFloor);
  const beats: Beat[] = [
    { wait: params.openLegendMs, patch: { legend: true } },
    { wait: params.openRootMs, patch: { rootShown: true } },
    { wait: params.openReadMs, patch: { read: true } },
  ];
  for (let i = 0; i < splitCount; i += 1) {
    beats.push(
      {
        wait: i === 0 ? params.firstSplitWaitMs : Math.round(params.splitWaitMs * f),
        patch: { splitsShown: i + 1 },
      },
      { wait: Math.round(params.branchWaitMs * f), patch: { childrenShown: i + 1 } },
      { wait: Math.round(params.sortWaitMs * f), patch: { splitsDone: i + 1 } },
    );
  }
  return beats;
}

/**
 * `scan`: the same opening, then each pile tries its candidate questions
 * one by one, comes back to the winner, and only then asks it.
 */
function scanBeats(
  plan: ScanPlan[],
  params: TrainingWalkParams = DEFAULT_TRAINING_PARAMS,
): Beat[] {
  const f = splitPace(plan.length, params.splitPaceFloor);
  const beats: Beat[] = [
    { wait: params.openLegendMs, patch: { legend: true } },
    { wait: params.openRootMs, patch: { rootShown: true } },
    { wait: params.openReadMs, patch: { read: true } },
  ];
  plan.forEach((split, i) => {
    const root = i === 0;
    const per = root ? params.scanRootStepMs : Math.round(params.scanDeepStepMs * f);
    beats.push({
      wait: root ? 1100 : Math.round(600 * f),
      patch: { scan: i, candidate: split.shown[0] ?? -1, picked: false },
    });
    split.shown.slice(1).forEach((candidate) => {
      beats.push({ wait: per, patch: { candidate } });
    });
    beats.push(
      { wait: per, patch: { candidate: split.best, picked: true } },
      {
        wait: root ? params.scanPickHoldMs : Math.round(params.scanPickHoldMs * 0.65 * f),
        patch: { splitsShown: i + 1, scan: -1, candidate: -1, picked: false },
      },
      { wait: Math.round(params.branchWaitMs * f), patch: { childrenShown: i + 1 } },
      { wait: Math.round(params.sortWaitMs * f), patch: { splitsDone: i + 1 } },
    );
  });
  return beats;
}

/**
 * `grow`: an empty root, then the first `growSlowCount` rows one at a time —
 * each drops into the dock over the tree, is scanned, and shrinks into its
 * dot on the pile — then the sheet lifts and the rest skip in, doubling,
 * faster each time. Whenever a pile first holds two labels its question
 * appears and the pile sorts. With `intro`, the data table opens the run
 * and fades straight onto the first row.
 */
function growBeats(
  plan: GrowPlan,
  dotCount: number,
  intro: boolean,
  params: TrainingWalkParams = DEFAULT_TRAINING_PARAMS,
): Beat[] {
  const f = splitPace(plan.order.length, params.splitPaceFloor);
  const beats: Beat[] = intro
    ? [
        { wait: 300, patch: { intro: 0 } },
        { wait: 1100, patch: { intro: 1 } },
        { wait: params.introFilterMs + 350, patch: { intro: 2 } },
        {
          wait: params.introScrollMs + params.introHoldMs,
          patch: { intro: 3, legend: true, rootShown: true, read: true, dotsShown: 0, intake: 0 },
        },
        /* The landed row and header stay on top of the identical dock until here. */
        { wait: params.introFadeMs, patch: { intro: -1 } },
      ]
    : [
        { wait: params.openLegendMs, patch: { legend: true } },
        { wait: params.openRootMs, patch: { rootShown: true, read: true, dotsShown: 0 } },
      ];
  let landed = 0;
  let asked = 0;
  const askReady = (pace: number) => {
    while (asked < plan.order.length && plan.revealAfter[asked]! <= landed) {
      asked += 1;
      beats.push(
        { wait: Math.round(450 * pace), patch: { splitsShown: asked } },
        { wait: Math.round(450 * pace), patch: { childrenShown: asked } },
        { wait: Math.round(400 * pace), patch: { splitsDone: asked } },
      );
    }
  };
  /* `batch`: the whole tree first (with the intro, row 1 waits in the dock:
     `plan.hold`). */
  if (plan.growth === "batch") askReady(f);
  const slow = Math.min(params.growSlowCount, dotCount);
  for (let rank = 0; rank < slow; rank += 1) {
    const timing = intakeTiming(rank, intro, params);
    if (!(intro && rank === 0)) {
      beats.push({ wait: rank === 0 ? 550 : timing.gap, patch: { intake: rank } });
    }
    landed = rank + 1;
    beats.push({
      /* With the intro, the fade beat already spent part of the settle. */
      wait:
        timing.settle -
        (intro && rank === 0 ? params.introFadeMs : 0) +
        timing.scan +
        timing.fly,
      patch: { dotsShown: landed },
    });
    askReady(1);
  }
  if (landed < dotCount) {
    let batch = 2;
    let first = true;
    const minWait = Math.max(60, Math.round(params.pourBatchWaitMs * 0.39));
    while (landed < dotCount) {
      landed = Math.min(dotCount, landed + batch);
      const wait = Math.max(
        minWait,
        params.pourBatchWaitMs - Math.round(Math.log2(batch)) * 40,
      );
      beats.push({
        wait: first ? Math.round(params.pourBatchWaitMs * 1.5) : wait,
        patch: first ? { dotsShown: landed, intake: -1 } : { dotsShown: landed },
      });
      first = false;
      askReady(f);
      batch *= 2;
    }
  } else {
    beats.push({ wait: 400, patch: { intake: -1 } });
  }
  return beats;
}

function buildBeats(
  training: Beat[],
  splitCount: number,
  quiz: QuizRow[],
  params: TrainingWalkParams = DEFAULT_TRAINING_PARAMS,
): { beats: Beat[]; final: WalkState } {
  const f = splitPace(splitCount, params.splitPaceFloor);
  const beats = training.slice();
  beats.push(
    {
      wait: splitCount ? Math.round(params.namedWaitMs * f) : Math.round(params.namedWaitMs * 0.82),
      patch: { named: true },
    },
    { wait: params.preTestHoldMs, patch: { act: "testing", quiet: true } },
  );
  quiz.forEach((row, index) => {
    const pace = quizPaceAt(index, params.quizPaceDecay);
    const travelMs = Math.round(params.quizTravelMs * pace);
    beats.push({
      // The first row follows the Testing title closely; the sheet slides in with it.
      wait: index === 0 ? 250 : Math.round(900 * pace),
      patch: { quiz: index, step: 0, guessed: false, travelMs },
    });
    for (let step = 1; step < row.pathKeys.length; step += 1) {
      beats.push({
        wait: step === 1 ? Math.round(800 * pace) : Math.round(travelMs + 380 * pace),
        patch: { step },
      });
    }
    beats.push(
      {
        wait: row.pathKeys.length > 1 ? Math.round(travelMs + 200 * pace) : Math.round(600 * pace),
        patch: { guessed: true },
      },
      {
        wait:
          params.guessDelayMs +
          params.guessFlyMs +
          Math.round(params.postRevealHoldMs * pace),
        patch: { revealed: index + 1 },
      },
    );
  });
  beats.push(
    {
      wait: params.checkingHoldMs,
      patch: { act: "checking", step: -1, quiet: false, checked: true },
    },
    { wait: params.doneHoldMs, patch: { act: "done" } },
  );
  const final: WalkState = {
    ...INITIAL_WALK,
    act: "done",
    legend: true,
    rootShown: true,
    read: true,
    splitsShown: splitCount,
    childrenShown: splitCount,
    splitsDone: splitCount,
    named: true,
    checked: true,
    quiz: quiz.length - 1,
    guessed: true,
    revealed: quiz.length,
  };
  return { beats, final };
}

/** Right guesses first, the miss last: the idea lands before the twist. */
function orderQuiz(sample: AiLabHoldoutResult[]): AiLabHoldoutResult[] {
  return sample.slice().sort((a, b) => Number(!a.correct) - Number(!b.correct));
}

/**
 * Evenly spaced rows across the sheet, in sheet order, with at least one
 * miss when the model has any — a perfect-looking sample would hide the
 * point of Testing.
 */
function pickSample(results: AiLabHoldoutResult[], size: number): AiLabHoldoutResult[] {
  const n = results.length;
  if (n <= size) return results.slice();
  const picks = Array.from({ length: size }, (_, i) =>
    Math.min(n - 1, Math.floor(((i + 0.5) * n) / size)),
  );
  const picked = picks.map((index) => results[index]!);
  if (!picked.some((result) => !result.correct)) {
    const firstWrong = results.findIndex((result) => !result.correct);
    if (firstWrong >= 0) {
      const slot = picks.findIndex((index) => index >= firstWrong);
      picked[slot >= 0 ? slot : size - 1] = results[firstWrong]!;
      picked.sort((a, b) => a.rowIndex - b.rowIndex);
    }
  }
  return picked;
}

/** Returns only the keys in `params` that differ from `base` (`DEFAULT_TRAINING_PARAMS` by default). */
export function diffTrainingParams(
  params: TrainingWalkParams,
  base: TrainingWalkParams = DEFAULT_TRAINING_PARAMS,
): Partial<TrainingWalkParams> {
  const diff: Partial<TrainingWalkParams> = {};
  (Object.keys(base) as (keyof TrainingWalkParams)[]).forEach((key) => {
    if (params[key] !== base[key]) {
      (diff as Record<string, unknown>)[key] = params[key];
    }
  });
  return diff;
}

/** Formats tuned parameters as a JSON diff, full JSON, or TypeScript constant block for pasting into code. */
export function formatTrainingParamsExport(
  params: TrainingWalkParams,
  mode: "diff" | "full" | "ts" = "ts",
  base: TrainingWalkParams = DEFAULT_TRAINING_PARAMS,
): string {
  const diff = diffTrainingParams(params, base);
  if (mode === "diff") {
    return JSON.stringify(diff, null, 2);
  }
  if (mode === "full") {
    return JSON.stringify(params, null, 2);
  }
  const entries = Object.entries(diff);
  if (entries.length === 0) {
    return "// All parameters match DEFAULT_TRAINING_PARAMS";
  }
  const lines = entries.map(
    ([key, value]) =>
      `  ${key}: ${typeof value === "string" ? `"${value}"` : String(value)}, // default: ${
        typeof base[key as keyof TrainingWalkParams] === "string"
          ? `"${base[key as keyof TrainingWalkParams]}"`
          : String(base[key as keyof TrainingWalkParams])
      }`,
  );
  return `export const TUNED_TRAINING_PARAMS: Partial<TrainingWalkParams> = {\n${lines.join("\n")}\n};`;
}

/** Parses URL query parameters back into a partial `TrainingWalkParams` override object. */
export function parseTrainingParamsFromSearch(
  search: string,
): Partial<TrainingWalkParams> {
  const query = new URLSearchParams(search);
  const out: Partial<TrainingWalkParams> = {};
  (Object.keys(DEFAULT_TRAINING_PARAMS) as (keyof TrainingWalkParams)[]).forEach(
    (key) => {
      const raw = query.get(key);
      if (raw === null) return;
      const def = DEFAULT_TRAINING_PARAMS[key];
      if (typeof def === "boolean") {
        if (raw === "true" || raw === "1") (out as Record<string, unknown>)[key] = true;
        else if (raw === "false" || raw === "0") (out as Record<string, unknown>)[key] = false;
      } else if (typeof def === "number") {
        const parsed = Number(raw);
        if (Number.isFinite(parsed)) (out as Record<string, unknown>)[key] = parsed;
      } else if (typeof def === "string") {
        (out as Record<string, unknown>)[key] = raw;
      }
    },
  );
  return out;
}

/** Serializes non-default `TrainingWalkParams` + extra page state (`fixture`, `variant`, `story`, `speed`) into a query string. */
export function serializeTrainingParamsToSearch(
  params: TrainingWalkParams,
  extra: Record<string, string | undefined> = {},
  base: TrainingWalkParams = DEFAULT_TRAINING_PARAMS,
): string {
  const query = new URLSearchParams();
  Object.entries(extra).forEach(([k, v]) => {
    if (v !== undefined && v !== "") query.set(k, v);
  });
  const diff = diffTrainingParams(params, base);
  Object.entries(diff).forEach(([k, v]) => {
    if (v !== undefined) query.set(k, String(v));
  });
  const str = query.toString();
  return str ? `?${str}` : "";
}
