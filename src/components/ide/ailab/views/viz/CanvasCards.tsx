import type { ReactNode } from "react";
import { Button } from "@moshebaricdo/cads-react";
import { TraceBar, type TraceStep } from "./TraceBar";
import styles from "./CanvasCards.module.scss";

/**
 * Horizontal room the right-hand card column takes (300px card + 8px edge
 * + 8px gap). Vizzes keep their resting center clear of it; they are never
 * clipped by it. Mirrors `$card-width` in the stylesheet.
 */
export const CARD_INSET = 316;

/** What the prediction card says at the top, before any algorithm detail. */
export interface CanvasOutcome {
  /** Label column name — the card title. */
  title: string;
  /** The predicted label, or the pending text ("2 more inputs"). */
  value: ReactNode;
  pending: boolean;
  /** One-sentence explanation, or the pending hint. */
  copy: ReactNode;
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
  /** Table / Rules have nothing to animate, so the toolbar goes away. */
  showStepper: boolean;
  /**
   * Table / Rules: the right-hand cards sit in a train-rail-style column
   * (same card geometry, no header) so the tabular view fills the leftover
   * sheet instead of running under them.
   */
  docked?: boolean;
  /** Selected-node detail (tree); shown above the body with a dismiss. */
  detail?: ReactNode;
  onDismissDetail?: () => void;
  /** Sits in the lede under the explanation — vote tally, etc. */
  metrics?: ReactNode;
  /** Body below the lede — neighbor list, decision path. */
  children?: ReactNode;
  footer?: ReactNode;
}

/**
 * Canvas-mode chrome: nothing is docked and nothing clips the viz. A toolbar
 * card (Play + stepper) floats top-left; a single column on the right stacks
 * the input card over the prediction card so it reads Input → Output. The
 * prediction card always shows the end state; stepping animates the
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
  detail,
  onDismissDetail,
  metrics,
  children,
  footer,
}: CanvasCardsProps) {
  return (
    <>
      {showStepper ? (
        <div className={styles.toolbar} aria-label="Trace controls">
          <TraceBar
            orientation="toolbar"
            steps={steps}
            index={index}
            onIndexChange={onIndexChange}
            emptyText=""
          />
        </div>
      ) : null}

      <div
        className={`${styles.column} ${docked ? styles.columnDocked : ""}`}
      >
        <section className={styles.inputCard} aria-label="Try a prediction">
          {inputCard}
        </section>

        <aside className={styles.card} aria-label="Prediction">
          <div className={styles.head}>
            <h3 className={styles.title}>{outcome.title}</h3>
          </div>
          <div className={styles.main}>
            <div className={styles.lede}>
              <div aria-live="polite">
                <h4
                  className={`${styles.value} ${
                    outcome.pending ? styles.valuePending : ""
                  }`}
                >
                  {outcome.value}
                </h4>
                <p className={styles.copy}>{outcome.copy}</p>
              </div>
              {metrics}
            </div>
            {detail ? (
              <div className={styles.detail}>
                <div className={styles.detailText}>{detail}</div>
                {onDismissDetail ? (
                  <Button
                    size="extraSmall"
                    variant="text"
                    color="tertiary"
                    iconOnly
                    startIconName="xmark"
                    aria-label="Close node details"
                    onClick={onDismissDetail}
                  />
                ) : null}
              </div>
            ) : null}
            {children ? <div className={styles.body}>{children}</div> : null}
          </div>
          {footer ? <div className={styles.footer}>{footer}</div> : null}
        </aside>
      </div>
    </>
  );
}
