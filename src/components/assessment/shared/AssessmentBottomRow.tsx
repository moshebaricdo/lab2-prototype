import type { ReactNode } from "react";
import styles from "./AssessmentBottomRow.module.scss";

/** Styled “Nice work!” (or custom) line for the bottom row right cluster after a correct submit. */
export function AssessmentSuccessFeedback({
  children = "Nice work!",
}: {
  children?: ReactNode;
}) {
  return (
    <p
      className={[
        styles.bottomRowFeedback,
        styles.feedbackCorrect,
        styles.feedbackCorrectDelight,
      ].join(" ")}
    >
      {children}
    </p>
  );
}

export interface AssessmentBottomRowProps {
  /** e.g. teacher tools — when omitted, the row aligns actions to the end. */
  left?: ReactNode;
  /** Primary actions and optional feedback copy. */
  right: ReactNode;
  /**
   * When false, the left cluster is not rendered (e.g. teacher tools like Reveal answer
   * are not supported for this level type). `left` is ignored when `showLeft` is false.
   */
  showLeft?: boolean;
}

/**
 * Shared footer for Lab2 assessment cards: bordered row with optional left cluster
 * (reveal answer, etc.) and a right cluster (feedback + Submit / Continue / Try again).
 */
export function AssessmentBottomRow({
  left,
  right,
  showLeft = true,
}: AssessmentBottomRowProps) {
  const renderLeft = showLeft && left != null;

  return (
    <div
      className={[
        styles.bottomRow,
        !renderLeft ? styles.bottomRowRightOnly : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {renderLeft ? (
        <div className={styles.bottomRowLeft}>{left}</div>
      ) : null}
      <div className={styles.bottomRowRight}>{right}</div>
    </div>
  );
}
