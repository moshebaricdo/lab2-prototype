import type { TimelineConfig, TransitionConfig } from "dialkit";

/* ─────────────────────────────────────────────────────────
 * SPLIT INTRO STORYBOARD (Figma: AI Lab 2, node 6340:23871)
 * Tuned in the DialKit dock, 2026-11-05. Focus and pour are not final.
 *
 *  0.00s  progress: "Reading the data"
 *  0.20s  grey dots bloom out from the canvas center, jostling into one cluster
 *  1.32s  "52 animals" fades in under the cluster
 *  1.51s  "● 1 dot = 1 animal" fades in under that
 *  2.51s  the scale key glides to the bottom-right corner
 *  3.00s  dots take their label colors, center out
 *  3.80s  the label legend (with counts) fades in under "52 animals"
 *  4.00s  progress: "Setting aside test rows"
 *  4.88s  "52 animals" fades out
 *  4.98s  the legend glides to the bottom-left
 *  6.00s  progress: "Training"
 *  6.01s  the cluster parts: Training (left) and Testing (right)
 *  6.70s  "Training / 46 animals" and "Testing / 6 animals" fade in
 *  ── Act 2: the pile becomes the tree (first pass, not tuned) ──
 *  8.00s  the Testing pile slides off the right edge, its caption with it
 *  8.50s  the Training pile glides to center, its caption alongside
 *  9.60s  it rises to the top and shrinks to tree size: it's the root
 * 10.60s  the root's question appears under it
 * 11.20s  the pile splits on that question into two child piles
 * 12.50s  each still-mixed pile asks and splits, a level at a time,
 *         each level a little quicker than the last (Tree pace panel);
 *         settled piles take their label as they land; a big tree grows
 *         only the levels that fit, the rest collapse to "+N more questions"
 *  ── Act 3: testing (times for a tree done at 15.9s; it slides) ──
 * 16.40s  a beat after the tree is done, it settles back; "Testing"
 * 16.60s  the test rows return as a grey cluster, top right: answers unseen
 * 17.30s  the row card fades in above the cluster: the row's values,
 *         its real label, and an empty "AI predicts"
 * 17.60s  five rows, one after another, one pace per step: its dot
 *         lights in the cluster, its path lights question by question,
 *         the dot flies into its leaf's pile, "AI predicts" fills in
 *         and holds a moment before the next row
 * 32.80s  testing completes: the cluster fades, the card becomes the
 *         results card, scored on every test row ("9 of 11 correct")
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

/** The tree-finish time act 3's clips are laid out for (\`test.settle\` starts a beat after). */
export const ACT3_ANCHOR = 15.9;

export const SPLIT_INTRO_TIMELINE = {
  /* When each step of the progress row above the canvas becomes current
     ("Reading the data" is current from the start; "Testing" comes after
     this sandbox's run). */
  progress: {
    setAside: { at: 4, duration: 0 },
    training: { at: 6, duration: 0 },
    /* Slides with act 3 (see \`test\`). */
    testing: { at: 16.6, duration: 0 },
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
  /* Act 2. The test pile leaves; no badge or tray: it's back in Testing. */
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
  /* The root's split is tuned on its own. From \`rest\`, every later level
     replays its shape (ask, then split), each a little quicker than the
     last: the Tree pace panel sets how much (\`falloff\`) and the floor. */
  grow: {
    ask: { at: 10.6, duration: 0.35, ...fadeUp },
    split: { at: 11.2, duration: 1, ...glide(0.1) },
    rest: { at: 12.5, duration: 0 },
  },
  /* Act 3. The tree is done; the test rows come back grey (the model
     hasn't seen their answers). Five are tested one after another, at one
     pace per step; then testing completes and the score shows.

     These clips are laid out for a tree that finishes growing at
     \`ACT3_ANCHOR\`. Trees finish anywhere from ~12s to ~18s, so the stage
     plays this act on its own clock, slid to start a beat after the tree
     actually finishes: drag and resize these clips relative to each other.
     Act 3 uses easing only (the stage evaluates it at the slid time). */
  test: {
    settle: { at: 16.4, duration: 0.5, from: { o: 1 }, to: { o: 0.5 }, transition: easing(0.5, [0.4, 0, 0.2, 1]) },
    back: { at: 16.6, duration: 0.8, ...progress(0.8, [0.22, 1, 0.36, 1]) },
    card: { at: 17.3, duration: 0.35, from: { opacity: 0, y: 6 }, to: { opacity: 1, y: 0 }, transition: easing(0.35, [0.22, 1, 0.36, 1]) },
    rows: { at: 17.6, duration: 15, ...progress(15, [0, 0, 1, 1]) },
    result: { at: 32.8, duration: 0.7, ...progress(0.7, [0.4, 0, 0.2, 1]) },
  },
  /* An editing window with room past the last clip, so later beats can
     be moved. */
  duration: 38,
} satisfies TimelineConfig;
