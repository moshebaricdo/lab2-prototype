import type { TimelineConfig, TransitionConfig } from "dialkit";
import type { StoryClip } from "./storyClock";

/* ─────────────────────────────────────────────────────────
 * SPLIT INTRO STORYBOARD (Figma: AI Lab 2, node 6340:23871)
 *
 * The times below are the story for the SMALLEST tree: one question, one
 * test row. That is what the dock shows. Two clips stretch with the data,
 * and everything after a stretched clip plays that much later:
 *
 *   grow.rest   a deeper tree adds a level here for each extra question
 *               level, each a little quicker than the last (Tree pace)
 *   test.row    one test row on a one-question path. Every row tested
 *               takes a turn this long, plus the time of each extra
 *               question on its path, so a step is the same pace on any
 *               tree. Resize it to change that pace.
 *
 * So nothing waits on a tree that is shorter or longer than another: the
 * sandbox's timeline ends where this dataset's story ends.
 *
 *  ── Preparing data ──
 *  0.20s  grey dots bloom out from the canvas center into one cluster
 *  1.32s  "52 animals" fades in under the cluster
 *  1.51s  "● 1 dot = 1 animal" fades in under that
 *  2.51s  the scale key glides to the bottom-right corner
 *  3.00s  dots take their label colors, center out
 *  3.80s  the label legend (with counts) fades in under "52 animals"
 *  4.88s  "52 animals" fades out
 *  4.98s  the legend glides to the bottom-left
 *  6.01s  the cluster parts: Training (left) and Testing (right)
 *  6.70s  "Training / 46 animals" and "Testing / 6 animals" fade in
 *  8.00s  the Testing pile slides off the right edge, its caption with it
 *  ── Training ──
 *  8.50s  the Training pile glides to center, its caption alongside
 *  9.60s  it rises to the top and shrinks to tree size: it's the root
 * 10.60s  the root's question appears under it
 * 11.20s  the pile splits on that question into two child piles
 * 12.50s  (deeper trees) each still-mixed pile asks and splits, a level
 *         at a time; a big tree grows only the levels that stay readable,
 *         the rest collapse to "+N more questions"
 *  ── Testing (slides to a beat after this tree's last split) ──
 * 12.70s  the tree settles back
 * 12.90s  the test panel slides in from the right edge with the test
 *         rows, grey: their answers are unseen. The tree and the keys
 *         move over to make room
 * 13.50s  the first row's values fade in: its columns, its real label,
 *         and an empty "AI predicts"
 * 13.90s  each row in turn: its dot lights in the cluster, its path
 *         lights question by question, the dot flies into its leaf's
 *         pile, "AI predicts" fills in and holds a moment
 * 16.20s  the rows not walked are tested together: the panel says so
 *         with a spinner while their dots fly to their piles
 * 18.20s  the panel becomes the results, scored on every test row
 * 19.10s  the prediction statement ("Predict Type based on …") fades in
 *         under the accuracy
 * ───────────────────────────────────────────────────────── */

/** A time spring: its length is the clip's bar. */
const spring = (bounce: number): TransitionConfig => ({ type: "spring", bounce });

const easing = (
  duration: number,
  ease: [number, number, number, number],
): TransitionConfig => ({ type: "easing", duration, ease });

const fadeUp = {
  from: { opacity: 0, y: 6 },
  to: { opacity: 1, y: 0 },
  transition: spring(0.1),
};

const fadeOut = (duration: number) => ({
  from: { opacity: 1 },
  to: { opacity: 0 },
  transition: easing(duration, [0.4, 0, 1, 1]),
});

/** 0 → 1 progress with a little settle, for things that travel. */
const glide = (bounce: number) => ({
  from: { p: 0 },
  to: { p: 1 },
  transition: spring(bounce),
});

/** 0 → 1 on a curve; `[0, 0, 1, 1]` plays the bloom's recorded physics at a constant rate. */
const progress = (duration: number, ease: [number, number, number, number]) => ({
  from: { p: 0 },
  to: { p: 1 },
  transition: easing(duration, ease),
});

export const SPLIT_INTRO_TIMELINE = {
  /* When each step of the progress row above the canvas becomes current
     ("Preparing data" is current from the start). */
  progress: {
    training: { at: 8.5, duration: 0 },
    /* Slides with the testing act (see `test`). */
    testing: { at: 12.9, duration: 0 },
  },
  cluster: {
    bloom: { at: 0.2, duration: 1.3, ...progress(1.3, [0, 0, 1, 1]) },
    count: { at: 1.32, duration: 0.35, ...fadeUp },
    scaleKey: { at: 1.51, duration: 0.4, ...fadeUp },
  },
  color: {
    scaleKeyMove: { at: 2.51, duration: 0.6, ...glide(0.12) },
    tint: { at: 3, duration: 1.2, ...progress(1.2, [0.4, 0, 0.2, 1]) },
    legend: { at: 3.8, duration: 0.4, ...fadeUp },
  },
  divide: {
    legendMove: { at: 4.98, duration: 0.65, ...glide(0.12) },
    countOut: { at: 4.88, duration: 0.36, ...fadeOut(0.36) },
    separate: { at: 6.01, duration: 0.92, ...glide(0.2) },
    captions: { at: 6.7, duration: 0.42, ...fadeUp },
  },
  /* The test pile leaves; no badge or tray: it's back in Testing. */
  park: {
    testOut: { at: 8, duration: 0.7, ...progress(0.7, [0.5, 0, 0.75, 0]) },
    captionOut: { at: 8, duration: 0.25, ...fadeOut(0.25) },
  },
  center: {
    move: { at: 8.5, duration: 0.7, ...glide(0.08) },
  },
  rise: {
    move: { at: 9.6, duration: 0.8, ...glide(0.08) },
    captionOut: { at: 9.6, duration: 0.2, ...fadeOut(0.2) },
  },
  /* The root's split is tuned on its own. From `rest`, every later level
     replays its shape (ask, then split), each a little quicker than the
     last: the Tree pace panel sets how much (`falloff`) and the floor. */
  grow: {
    ask: { at: 10.6, duration: 0.35, ...fadeUp },
    split: { at: 11.2, duration: 1, ...glide(0.1) },
    rest: { at: 12.5, duration: 0 },
  },
  /* The tree is done; the test rows come back grey (the model hasn't
     seen their answers) in a panel on the right. A few are tested one
     after another, the rest together, and the panel becomes the score.

     These clips are laid out for a tree whose last split is the root's
     (`grow.split`'s end): they keep their distance from the end of this
     tree's last split, whenever that is. Drag and resize them relative to
     each other; the stage plays them at this tree's times. */
  test: {
    settle: {
      at: 12.7,
      duration: 0.5,
      from: { o: 1 },
      to: { o: 0.5 },
      transition: easing(0.5, [0.4, 0, 0.2, 1]),
    },
    panel: { at: 12.9, duration: 0.7, ...progress(0.7, [0.22, 1, 0.36, 1]) },
    card: {
      at: 13.5,
      duration: 0.35,
      from: { opacity: 0, y: 6 },
      to: { opacity: 1, y: 0 },
      transition: easing(0.35, [0.22, 1, 0.36, 1]),
    },
    /* One row's turn on a one-question path; it repeats per row and
       stretches per extra question, and what follows waits for the last. */
    row: { at: 13.9, duration: 2.3 },
    /* The rows not walked, tested together (skipped when every row was walked). */
    remaining: { at: 16.2, duration: 2 },
    result: { at: 18.2, duration: 0.7, ...progress(0.7, [0.4, 0, 0.2, 1]) },
    /* Under the accuracy, a beat after it: what the model predicts, from what. */
    statement: {
      at: 19.1,
      duration: 0.4,
      from: { opacity: 0, y: 6 },
      to: { opacity: 1, y: 0 },
      transition: easing(0.4, [0.22, 1, 0.36, 1]),
    },
  },
  /* The smallest story's length. The sandbox sets the dock's length to
     this dataset's story (`SplitIntroStage`'s `onDuration`). */
  duration: 20,
} satisfies TimelineConfig;

type Config = typeof SPLIT_INTRO_TIMELINE;

/**
 * The timeline's clips as the stage reads them: the config above as it
 * stands, or the dock's live edit of it.
 */
export type SplitTuning = {
  [Group in Exclude<keyof Config, "duration">]: {
    [Clip in keyof Config[Group]]: StoryClip;
  };
};

/** Seconds the last frame holds after the story ends, before a timeline stops. */
export const END_HOLD = 1.5;
