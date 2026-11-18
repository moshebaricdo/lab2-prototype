import { useEffect, useState } from "react";
import { prefersReducedMotion } from "../viz/useStepPlayback";

/** A time past any story's end: where Skip and reduced motion land. */
const AT_THE_END = 1e6;
/** The most one frame may advance the story (seconds), so a tab left in the background doesn't lurch on return. */
const LONGEST_FRAME = 0.1;

/**
 * The split story's clock in the lab's modal: seconds since the modal
 * opened, run off animation frames. Every open plays from the top;
 * reduced motion opens on the finished story instead; Skip jumps there.
 * It stops at `end`, the story's length for this dataset (the stage
 * reports it once it has laid the tree out, so it starts unknown).
 */
export function useStoryClock(open: boolean, end: number | null) {
  const [time, setTime] = useState(0);
  const [paused, setPaused] = useState(false);
  /** Bumped by `restart` to play again from the top. */
  const [run, setRun] = useState(0);
  const done = end !== null && time >= end;

  useEffect(() => {
    if (!open) return;
    setPaused(false);
    setTime(prefersReducedMotion() ? AT_THE_END : 0);
  }, [open, run]);

  useEffect(() => {
    if (!open || paused || done) return;
    let last = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const elapsed = Math.min(LONGEST_FRAME, (now - last) / 1000);
      last = now;
      setTime((was) => was + elapsed);
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [open, paused, done, run]);

  return {
    time,
    paused,
    done,
    togglePause: () => setPaused((was) => !was),
    restart: () => setRun((was) => was + 1),
    skip: () => {
      setPaused(false);
      setTime(AT_THE_END);
    },
  };
}
