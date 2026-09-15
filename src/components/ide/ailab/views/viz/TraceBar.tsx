import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Button, Tooltip } from "@moshebari/cads-react";
import styles from "./TraceBar.module.scss";

/** Time on each step while Play walks the trace. */
const PLAY_STEP_MS = 1000;

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export interface TraceStep {
  id: string;
  /** Short label for the dot tooltip: "Question 2", "Vote". */
  label: string;
  /** Sentence shown beside the dots for this step. */
  statement: ReactNode;
  /** Plain-text version for the live region (defaults to `label`). */
  announcement?: string;
}

interface TraceBarProps {
  steps: TraceStep[];
  index: number;
  onIndexChange: (index: number) => void;
  /** Shown when there are no steps yet (no prediction to trace). */
  emptyText: string;
  /**
   * Temporarily replaces the step statement — e.g. details of the node the
   * student selected in the canvas. One place for detail instead of hover
   * tooltips; `onDismissDetail` restores the statement.
   */
  detail?: ReactNode;
  onDismissDetail?: () => void;
  /**
   * `row` is the viz-footer strip. `column` stacks controls over a wrapping
   * statement so the bar can live in a side rail. `toolbar` is Play + step
   * nav only — the statement lives in `NavigatorCard`.
   */
  orientation?: "row" | "column" | "toolbar";
}

/**
 * Step-through control for "how did the model decide?". Play rewinds to
 * the first step and walks the rest (1s apart). Previous / Next move one
 * at a time; the dots jump. The statement is a polite live region so
 * screen-reader users hear each move without leaving the buttons.
 */
export function TraceBar({
  steps,
  index,
  onIndexChange,
  emptyText,
  detail,
  onDismissDetail,
  orientation = "row",
}: TraceBarProps) {
  const total = steps.length;
  const hasSteps = total > 0;
  const clamped = Math.min(Math.max(index, 0), Math.max(total - 1, 0));
  const current = steps[clamped];
  const liveRef = useRef<HTMLSpanElement>(null);
  const playTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [playing, setPlaying] = useState(false);
  const stepIds = steps.map((step) => step.id).join("|");

  const stopPlay = useCallback(() => {
    if (playTimerRef.current !== null) {
      clearInterval(playTimerRef.current);
      playTimerRef.current = null;
    }
    setPlaying(false);
  }, []);

  useEffect(() => () => stopPlay(), [stopPlay]);
  useEffect(() => {
    stopPlay();
  }, [stepIds, stopPlay]);

  const goTo = (next: number) => {
    stopPlay();
    onIndexChange(next);
  };

  const playFromStart = () => {
    stopPlay();
    onIndexChange(0);
    if (total < 2 || prefersReducedMotion()) return;
    setPlaying(true);
    let next = 1;
    playTimerRef.current = setInterval(() => {
      onIndexChange(next);
      if (next >= total - 1) {
        stopPlay();
        return;
      }
      next += 1;
    }, PLAY_STEP_MS);
  };

  // Only speak on user-driven step changes, not on every prediction re-render.
  const lastAnnounced = useRef<string | undefined>(undefined);
  useEffect(() => {
    const text = current?.announcement ?? current?.label;
    if (!liveRef.current || text === lastAnnounced.current) return;
    lastAnnounced.current = text;
    liveRef.current.textContent = text ?? "";
  }, [current]);

  const isToolbar = orientation === "toolbar";

  const dots = (
    <ol className={styles.dots} aria-label="Steps">
      {hasSteps ? (
        steps.map((step, stepIndex) => {
          const isCurrent = stepIndex === clamped;
          const isDone = stepIndex < clamped;
          return (
            <li key={step.id} className={styles.dotItem}>
              <Tooltip title={step.label} placement="top">
                <button
                  type="button"
                  className={`${styles.dot} ${isDone ? styles.dotDone : ""} ${
                    isCurrent ? styles.dotCurrent : ""
                  }`}
                  aria-label={`Step ${stepIndex + 1} of ${total}: ${step.label}`}
                  aria-current={isCurrent ? "step" : undefined}
                  onClick={() => goTo(stepIndex)}
                />
              </Tooltip>
            </li>
          );
        })
      ) : (
        <li className={styles.dotItem}>
          <span className={`${styles.dot} ${styles.dotEmpty}`} aria-hidden />
        </li>
      )}
    </ol>
  );

  const nav = (
    <div className={styles.controls} role="group" aria-label="Trace steps">
      {isToolbar ? null : (
        <Tooltip title="Replay from the start" placement="top">
          <Button
            size="extraSmall"
            variant="text"
            color="tertiary"
            iconOnly
            startIconName="rotate-left"
            aria-label="Replay from the start"
            disabled={!hasSteps || clamped === 0}
            onClick={() => goTo(0)}
          />
        </Tooltip>
      )}
      <Button
        size="extraSmall"
        variant="outlined"
        color="secondary"
        iconOnly
        startIconName="chevron-left"
        aria-label="Previous step"
        disabled={!hasSteps || clamped === 0}
        onClick={() => goTo(Math.max(0, clamped - 1))}
      />
      {dots}
      <Button
        size="extraSmall"
        variant="outlined"
        color="secondary"
        iconOnly
        startIconName="chevron-right"
        aria-label="Next step"
        disabled={!hasSteps || clamped >= total - 1}
        onClick={() => goTo(Math.min(total - 1, clamped + 1))}
      />
    </div>
  );

  return (
    <div
      className={`${styles.root} ${
        orientation === "column" ? styles.rootColumn : ""
      } ${isToolbar ? styles.rootToolbar : ""}`}
    >
      {isToolbar ? (
        <>
          <Button
            size="extraSmall"
            variant="contained"
            color="primary"
            startIconName="play"
            aria-label="Play from the start"
            aria-pressed={playing}
            disabled={!hasSteps || total < 2}
            onClick={playFromStart}
          >
            Play
          </Button>
          {nav}
        </>
      ) : (
        nav
      )}
      {isToolbar ? (
        <span ref={liveRef} className={styles.live} aria-live="polite" />
      ) : (
        <div className={styles.statement}>
          {detail ? (
            <>
              <span className={styles.detailText}>{detail}</span>
              {onDismissDetail ? (
                <Button
                  size="extraSmall"
                  variant="text"
                  color="tertiary"
                  iconOnly
                  startIconName="xmark"
                  aria-label="Back to the trace"
                  className={styles.detailClose}
                  onClick={onDismissDetail}
                />
              ) : null}
            </>
          ) : hasSteps ? (
            <>
              <span className={styles.stepCount}>
                Step {clamped + 1} of {total}
              </span>
              <span className={styles.statementText}>{current?.statement}</span>
            </>
          ) : (
            <span className={styles.emptyText}>{emptyText}</span>
          )}
          <span ref={liveRef} className={styles.live} aria-live="polite" />
        </div>
      )}
    </div>
  );
}
