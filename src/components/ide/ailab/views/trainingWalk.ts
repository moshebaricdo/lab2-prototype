import { useEffect, useMemo, useRef, useState } from "react";
import { columnById, traceDecisionTree } from "../../../../lib/aiLab";
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

export type Act = "training" | "testing" | "checking" | "done";

export interface WalkState extends SortingTreeState {
  act: Act;
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

export interface TrainingWalk {
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

export function useTrainingWalk(data: TrainingWalkData): TrainingWalk {
  const { tree, rows, labelColumn, labels, results, columns } = data;
  const model = useSortingModel(tree, rows, labelColumn, labels);
  const score = useMemo(() => treeScore(tree), [tree]);
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
  const { beats, final } = useMemo(() => buildBeats(splitCount, quiz), [splitCount, quiz]);
  const labelName = columnById(columns, labelColumn)?.name ?? labelColumn;
  return useMemo(
    () => ({ model, score, indexOf, quiz, tally, labelName, beats, final }),
    [model, score, indexOf, quiz, tally, labelName, beats, final],
  );
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
  const stopRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!open) return;
    if (prefersReducedMotion()) {
      setInstant(true);
      setState(final);
      return;
    }
    setInstant(false);
    setState(INITIAL_WALK);
    let index = 0;
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      const beat = beats[index];
      if (!beat) return;
      index += 1;
      timer = setTimeout(() => {
        setState((current) => ({ ...current, ...beat.patch }));
        next();
      }, beat.wait);
    };
    next();
    const stop = () => clearTimeout(timer);
    stopRef.current = stop;
    return stop;
  }, [open, beats, final]);

  const skip = () => {
    stopRef.current();
    setInstant(true);
    setState(final);
  };

  return { state, instant, skip };
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

function buildBeats(splitCount: number, quiz: QuizRow[]): { beats: Beat[]; final: WalkState } {
  const f = Math.min(1, Math.max(0.45, 3 / Math.max(1, splitCount)));
  // Opening stagger: key row, then the empty root, then its dots.
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
