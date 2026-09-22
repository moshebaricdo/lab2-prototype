import { useCallback, useEffect, useRef, useState } from "react";

/** Time on each step while Play walks the trace. */
export const PLAY_STEP_MS = 1000;

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export interface StepPlayback {
  playing: boolean;
  /**
   * Rewind to step 0 and walk to the last step at `PLAY_STEP_MS`. Under
   * `prefers-reduced-motion` there is no walk: `reducedMotion` says where to
   * land instead — `"start"` (the manual Play button's historical behavior)
   * or `"end"` (auto-play on a new prediction, which must still arrive at
   * the answer).
   */
  play: (options?: { reducedMotion?: "start" | "end" }) => void;
  stop: () => void;
  /** Stop and jump to the last step. */
  skipToEnd: () => void;
}

/**
 * One timer for "walk the trace". Owned by whoever owns the step index so
 * the viz can auto-play a new prediction and the toolbar's Play / Skip
 * button reflects the same state.
 */
export function useStepPlayback(
  total: number,
  onIndexChange: (index: number) => void,
): StepPlayback {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [playing, setPlaying] = useState(false);
  const latest = useRef({ total, onIndexChange });
  latest.current = { total, onIndexChange };

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPlaying(false);
  }, []);

  useEffect(() => () => stop(), [stop]);

  const play = useCallback(
    (options?: { reducedMotion?: "start" | "end" }) => {
      stop();
      const { total: count, onIndexChange: setIndex } = latest.current;
      if (count < 2) {
        setIndex(0);
        return;
      }
      if (prefersReducedMotion()) {
        setIndex(options?.reducedMotion === "end" ? count - 1 : 0);
        return;
      }
      setIndex(0);
      setPlaying(true);
      let next = 1;
      timerRef.current = setInterval(() => {
        latest.current.onIndexChange(next);
        if (next >= latest.current.total - 1) {
          stop();
          return;
        }
        next += 1;
      }, PLAY_STEP_MS);
    },
    [stop],
  );

  const skipToEnd = useCallback(() => {
    stop();
    latest.current.onIndexChange(Math.max(0, latest.current.total - 1));
  }, [stop]);

  return { playing, play, stop, skipToEnd };
}
