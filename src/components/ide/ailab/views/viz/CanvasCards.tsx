import type { ReactNode } from "react";
import { FaIcon } from "@moshebari/cads-react/icons";
import { TraceBar, type TraceStep } from "./TraceBar";
import type { StepPlayback } from "./useStepPlayback";
import styles from "./CanvasCards.module.scss";

/**
 * Horizontal room the right-hand card column takes (300px card + 8px edge
 * + 8px gap). Vizzes keep their resting center clear of it; they are never
 * clipped by it. Mirrors `$card-width` in the stylesheet.
 */
export const CARD_INSET = 316;

/** What the prediction card says at the top, before any algorithm detail. */
export interface CanvasOutcome {
  /** Fixed card title ("Result"). */
  title: string;
  /** The predicted label; omit while pending to show only `copy`. */
  value?: ReactNode;
  pending: boolean;
  /** One-sentence explanation or the pending hint; omit when the body says it. */
  copy?: ReactNode;
  /**
   * When the input came from a real sheet row, the row's real label and
   * whether the model matched it. Absent for a made-up input — there is no
   * ground truth to compare against.
   */
  actual?: { value: string; correct: boolean };
}

/** Slots the dashboard hands a viz when the Testing layout is `canvas`. */
export interface CanvasChrome {
  outcome: CanvasOutcome;
  /** Contents of the input card (head + fields); the shell is drawn here. */
  inputCard: ReactNode;
}

interface CanvasCardsProps extends CanvasChrome {
  steps: TraceStep[];
  index: number;
  onIndexChange: (index: number) => void;
  /** Table / Rules have nothing to animate, so the Replay row goes away. */
  showStepper: boolean;
  /**
   * Table / Rules: the right-hand cards sit in a train-rail-style column
   * (same card geometry, no header) so the tabular view fills the leftover
   * sheet instead of running under them.
   */
  docked?: boolean;
  /** Sits in the lede under the explanation — vote tally, etc. */
  metrics?: ReactNode;
  /** Body below the lede — neighbor list, decision path. */
  children?: ReactNode;
  /** Draw the body inside the lede (no divider) — the decision path reads as part of the answer. */
  inlineBody?: boolean;
  footer?: ReactNode;
  /** Shared walk timer so the Result footer Replay / Skip mirrors an auto-play. */
  playback?: StepPlayback;
}

/**
 * Canvas-mode chrome: nothing is docked and nothing clips the viz. A single
 * column on the right stacks the input card over the Result card so it
 * reads Input → Output. Replay + the stepper live in the Result footer.
 * The prediction card always shows the end state; stepping animates the
 * visualization underneath (and, for trees, lights up the path numbers).
 */
export function CanvasCards({
  steps,
  index,
  onIndexChange,
  showStepper,
  docked = false,
  outcome,
  inputCard,
  metrics,
  children,
  inlineBody = false,
  footer,
  playback,
}: CanvasCardsProps) {
  const hasFooter = showStepper || Boolean(footer);

  return (
    <div
      className={`${styles.column} ${docked ? styles.columnDocked : ""}`}
    >
      <section className={styles.inputCard} aria-label="Make a prediction">
        {inputCard}
      </section>

      <aside className={styles.card} aria-label="Result">
        <div className={styles.head}>
          <h3 className={styles.title}>{outcome.title}</h3>
        </div>
        <div className={styles.main}>
          <div className={styles.lede}>
            <div className={styles.answer} aria-live="polite">
              {outcome.value === undefined ? null : (
                <h4
                  className={`${styles.value} ${
                    outcome.pending ? styles.valuePending : ""
                  }`}
                >
                  {outcome.value}
                </h4>
              )}
              {outcome.actual && !outcome.pending ? (
                <ActualVerdict actual={outcome.actual} />
              ) : null}
              {outcome.copy === undefined ? null : (
                <p className={styles.copy}>{outcome.copy}</p>
              )}
            </div>
            {metrics}
            {inlineBody && children ? children : null}
          </div>
          {!inlineBody && children ? (
            <div className={styles.body}>{children}</div>
          ) : null}
        </div>
        {hasFooter ? (
          <div className={styles.footer}>
            {showStepper ? (
              <TraceBar
                orientation="toolbar"
                playLabel="Replay"
                steps={steps}
                index={index}
                onIndexChange={onIndexChange}
                emptyText=""
                playback={playback}
              />
            ) : null}
            {footer}
          </div>
        ) : null}
      </aside>
    </div>
  );
}

/** "Actually Bird" with a check or a cross — only when the input was a real row. */
export function ActualVerdict({
  actual,
  className,
}: {
  actual: { value: string; correct: boolean };
  className?: string;
}) {
  return (
    <p
      className={[
        styles.verdict,
        actual.correct ? styles.verdictCorrect : styles.verdictWrong,
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <FaIcon name={actual.correct ? "circle-check" : "circle-xmark"} size="small" />
      <span>
        {actual.correct ? "Correct" : "Wrong"} — this row is really{" "}
        <strong>{actual.value}</strong>
      </span>
    </p>
  );
}
