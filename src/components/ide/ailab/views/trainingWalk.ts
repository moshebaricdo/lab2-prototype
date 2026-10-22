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
import { useSortingModel, type SortingTreeState } from "./viz/SortingTree";
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

/**
 * `grow`: one slow row's timing. The stage (sweep, morph) and the beats
 * (when the dot lands) both read this, so they can't drift apart.
 */
export function intakeTiming(rank: number, intro = false): IntakeTiming {
  const pace = INTAKE_PACE[rank] ?? INTAKE_PACE[INTAKE_PACE.length - 1]!;
  return {
    /* The first row slides in with the dock (or waits out the intro's
       handoff); later ones spin in on the dock's reel. */
    settle:
      rank === 0
        ? intro
          ? INTRO_FADE_MS + 120
          : 320
        : Math.round(Math.max(600, 1100 * pace)),
    /* One left-to-right pass; the first rows take their time. */
    scan: Math.round(Math.max(800, 1800 * pace)),
    fly: Math.round(Math.max(380, 720 * pace)),
    gap: Math.round(220 * pace),
  };
}

/**
 * `grow` with `intro`: the data table opens the run, narrows to the chosen
 * columns, spins like a lotto wheel (speeds up, slows, lands on the first
 * training row right where the dock sits), then the rest fades to the tree.
 */
export const INTRO_FILTER_MS = 650;
export const INTRO_SCROLL_MS = 3200;
/** The wheel's small settle after it lands, before the fade. */
const INTRO_LAND_HOLD_MS = 350;
export const INTRO_FADE_MS = 500;

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
}

export function useTrainingWalk(
  data: TrainingWalkData,
  story: TrainingStory = "sort",
  options: { intro?: boolean; growth?: GrowthMode } = {},
): TrainingWalk {
  const intro = story === "grow" && options.intro === true;
  const growth = options.growth ?? "organic";
  const { tree, rows, labelColumn, labels, results, columns, features } = data;
  const model = useSortingModel(tree, rows, labelColumn, labels, "default", columns);
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
      orderQuiz(pickSample(results, QUIZ_SIZE)).map((result) => ({
        result,
        pathKeys: rows[result.rowIndex]
          ? traceDecisionTree(tree, rows[result.rowIndex]!).pathKeys
          : ["root"],
      })),
    [results, rows, tree],
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
        shown: shownCandidates(found, index === 0 ? ROOT_SCAN_MAX : SCAN_MAX),
      };
    });
  }, [story, tree, rows, columns, features, labelColumn, model.splits]);
  const growPlan = useMemo(
    () => (story === "grow" ? planGrowth(model, growth, intro) : undefined),
    [story, model, growth, intro],
  );
  const { beats, final } = useMemo(() => {
    const training = scanPlan
      ? scanBeats(scanPlan)
      : growPlan
        ? growBeats(growPlan, model.dots.length, intro)
        : sortBeats(splitCount);
    return buildBeats(training, splitCount, quiz);
  }, [scanPlan, growPlan, model.dots.length, splitCount, quiz, intro]);
  const labelName = columnById(columns, labelColumn)?.name ?? labelColumn;
  return useMemo(
    () => ({
      story,
      intro,
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
    [story, intro, scanPlan, growPlan, model, score, indexOf, quiz, tally, labelName, beats, final],
  );
}

/** Candidate questions the root shows; it's the first search, so it gets them all (up to this). */
const ROOT_SCAN_MAX = 8;
/** Deeper piles show the winner and a few others, faster; the rest are counted, not drawn. */
const SCAN_MAX = 4;

/** The winner plus the first others in feature order, kept in feature order. */
function shownCandidates(found: AiLabNodeCandidates, max: number): number[] {
  const indexes = found.candidates.map((_, index) => index);
  if (indexes.length <= max) return indexes;
  const others = indexes.filter((index) => index !== found.best).slice(0, max - 1);
  return [...others, found.best].sort((a, b) => a - b);
}

/** Each question's build in `batch` (or appearance in `grow`): asked, branches, sorted. */
const ASK_MS = 450 + 450 + 400;

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
): GrowPlan {
  const { dots, splits, layout } = model;
  const shuffledOrder = shuffled(dots.map((dot) => dot.id), dots.length * 7919 + splits.length);
  const order =
    growth === "organic" ? shuffledOrder : coverFirst(shuffledOrder, model);
  if (growth === "batch") {
    const arrival: number[] = [];
    order.forEach((id, rank) => (arrival[id] = rank));
    return {
      growth,
      hold: intro ? Math.round(splits.length * ASK_MS * splitPace(splits.length)) : 0,
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
 * Re-picks the first `GROW_SLOW` rows so they spread out: each is the
 * earliest remaining row that lands in a leaf no slow row has yet, on the
 * root side with fewer rows so far. The rest keep their shuffled order.
 */
function coverFirst(order: number[], model: ReturnType<typeof useSortingModel>): number[] {
  const rest = [...order];
  const picked: number[] = [];
  const visits = new Map<string, number>();
  const cost = (id: number) => {
    const keys = model.dots[id]!.pathKeys;
    const leaf = keys[keys.length - 1]!;
    return (visits.has(leaf) ? 1000 : 0) + (visits.get(keys[1] ?? "") ?? 0);
  };
  while (picked.length < GROW_SLOW && rest.length > 0) {
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
function splitPace(splitCount: number): number {
  return Math.min(1, Math.max(0.45, 3 / Math.max(1, splitCount)));
}

/**
 * `sort`: the opening stagger (key row, empty root, its dots), then each
 * question appears, branches, and sorts its pile.
 */
function sortBeats(splitCount: number): Beat[] {
  const f = splitPace(splitCount);
  const beats: Beat[] = [
    { wait: 500, patch: { legend: true } },
    { wait: 500, patch: { rootShown: true } },
    { wait: 350, patch: { read: true } },
  ];
  for (let i = 0; i < splitCount; i += 1) {
    beats.push(
      { wait: i === 0 ? 1300 : 1000 * f, patch: { splitsShown: i + 1 } },
      { wait: 550 * f, patch: { childrenShown: i + 1 } },
      { wait: 450 * f, patch: { splitsDone: i + 1 } },
    );
  }
  return beats;
}

/**
 * `scan`: the same opening, then each pile tries its candidate questions
 * one by one, comes back to the winner, and only then asks it.
 */
function scanBeats(plan: ScanPlan[]): Beat[] {
  const f = splitPace(plan.length);
  const beats: Beat[] = [
    { wait: 500, patch: { legend: true } },
    { wait: 500, patch: { rootShown: true } },
    { wait: 350, patch: { read: true } },
  ];
  plan.forEach((split, i) => {
    const root = i === 0;
    const per = root ? 800 : 420 * f;
    beats.push({
      wait: root ? 1100 : 600 * f,
      patch: { scan: i, candidate: split.shown[0] ?? -1, picked: false },
    });
    split.shown.slice(1).forEach((candidate) => {
      beats.push({ wait: per, patch: { candidate } });
    });
    beats.push(
      { wait: per, patch: { candidate: split.best, picked: true } },
      {
        wait: root ? 1000 : 650 * f,
        patch: { splitsShown: i + 1, scan: -1, candidate: -1, picked: false },
      },
      { wait: 450 * f, patch: { childrenShown: i + 1 } },
      { wait: 450 * f, patch: { splitsDone: i + 1 } },
    );
  });
  return beats;
}

/**
 * `grow`: an empty root, then the first `GROW_SLOW` rows one at a time —
 * each drops into the dock over the tree, is scanned, and shrinks into its
 * dot on the pile — then the sheet lifts and the rest skip in, doubling,
 * faster each time. Whenever a pile first holds two labels its question
 * appears and the pile sorts. With `intro`, the data table opens the run
 * and fades straight onto the first row.
 */
function growBeats(plan: GrowPlan, dotCount: number, intro: boolean): Beat[] {
  const f = splitPace(plan.order.length);
  const beats: Beat[] = intro
    ? [
        { wait: 300, patch: { intro: 0 } },
        { wait: 1100, patch: { intro: 1 } },
        { wait: INTRO_FILTER_MS + 350, patch: { intro: 2 } },
        {
          wait: INTRO_SCROLL_MS + INTRO_LAND_HOLD_MS,
          patch: { intro: 3, legend: true, rootShown: true, read: true, dotsShown: 0, intake: 0 },
        },
        /* The landed row and header stay on top of the identical dock until here. */
        { wait: INTRO_FADE_MS, patch: { intro: -1 } },
      ]
    : [
        { wait: 500, patch: { legend: true } },
        { wait: 500, patch: { rootShown: true, read: true, dotsShown: 0 } },
      ];
  let landed = 0;
  let asked = 0;
  const askReady = (pace: number) => {
    while (asked < plan.order.length && plan.revealAfter[asked]! <= landed) {
      asked += 1;
      beats.push(
        { wait: 450 * pace, patch: { splitsShown: asked } },
        { wait: 450 * pace, patch: { childrenShown: asked } },
        { wait: 400 * pace, patch: { splitsDone: asked } },
      );
    }
  };
  /* `batch`: the whole tree first (with the intro, row 1 waits in the dock:
     `plan.hold`). */
  if (plan.growth === "batch") askReady(f);
  const slow = Math.min(GROW_SLOW, dotCount);
  for (let rank = 0; rank < slow; rank += 1) {
    const timing = intakeTiming(rank, intro);
    if (!(intro && rank === 0)) {
      beats.push({ wait: rank === 0 ? 550 : timing.gap, patch: { intake: rank } });
    }
    landed = rank + 1;
    beats.push({
      /* With the intro, the fade beat already spent part of the settle. */
      wait:
        timing.settle -
        (intro && rank === 0 ? INTRO_FADE_MS : 0) +
        timing.scan +
        timing.fly,
      patch: { dotsShown: landed },
    });
    askReady(1);
  }
  if (landed < dotCount) {
    let batch = 2;
    let first = true;
    while (landed < dotCount) {
      landed = Math.min(dotCount, landed + batch);
      const wait = Math.max(110, 280 - Math.round(Math.log2(batch)) * 40);
      beats.push({
        wait: first ? 420 : wait,
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
): { beats: Beat[]; final: WalkState } {
  const f = splitPace(splitCount);
  const beats = training.slice();
  beats.push(
    { wait: splitCount ? 1100 * f : 900, patch: { named: true } },
    { wait: 1700, patch: { act: "testing", quiet: true } },
  );
  quiz.forEach((row, index) => {
    const pace = QUIZ_PACE[index] ?? QUIZ_PACE[QUIZ_PACE.length - 1]!;
    const travelMs = Math.round(680 * pace);
    beats.push({
      // The first row follows the Testing title closely; the sheet slides in with it.
      wait: index === 0 ? 250 : 900 * pace,
      patch: { quiz: index, step: 0, guessed: false, travelMs },
    });
    for (let step = 1; step < row.pathKeys.length; step += 1) {
      beats.push({ wait: step === 1 ? 800 * pace : travelMs + 380 * pace, patch: { step } });
    }
    beats.push(
      {
        wait: row.pathKeys.length > 1 ? travelMs + 200 * pace : 600 * pace,
        patch: { guessed: true },
      },
      { wait: GUESS_DELAY_MS + GUESS_FLY_MS + 500 * pace, patch: { revealed: index + 1 } },
    );
  });
  beats.push(
    { wait: 1100, patch: { act: "checking", step: -1, quiet: false, checked: true } },
    { wait: 1500, patch: { act: "done" } },
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
