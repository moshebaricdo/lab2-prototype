import type { ReactNode } from "react";
import { Alert, Button } from "@moshebari/cads-react";
import { FaIcon } from "@moshebari/cads-react/icons";
import styles from "./ViewpointChrome.module.scss";

export type ViewpointBannerVariant = "info" | "warning";

interface ViewpointBannerProps {
  variant?: ViewpointBannerVariant;
  children: ReactNode;
}

/**
 * Figma teacher Alert (`356:24536`): full-bleed CADS strip under the header,
 * not a card-width bar in the 64px workspace pad.
 */
export function ViewpointBanner({
  variant = "info",
  children,
}: ViewpointBannerProps) {
  return (
    <Alert
      className={styles.banner}
      sentiment={variant}
      size="extraSmall"
    >
      {children}
    </Alert>
  );
}

export type ResponseResultStatus = "correct" | "incorrect";

interface ResponseResultTagProps {
  status: ResponseResultStatus;
}

/** Figma `responseTag` (`295:40744`) — CADS Alert extraSmall, hug width. */
export function ResponseResultTag({ status }: ResponseResultTagProps) {
  const isCorrect = status === "correct";
  return (
    <Alert
      className={styles.resultTag}
      sentiment={isCorrect ? "success" : "error"}
      size="extraSmall"
      fullWidth={false}
      iconName={isCorrect ? "circle-check" : "circle-xmark"}
    >
      {isCorrect ? "Great job!" : "Incorrect"}
    </Alert>
  );
}

interface AnswerNotesBlockProps {
  /** Student-facing answer explanation (RevealConfig.explanation). Hidden for free response. */
  explanation?: string;
  /**
   * Teacher-only card (`For teachers only`). Free response puts the exemplar
   * here; matching / multi use `teacherNote`.
   */
  teacherNote?: string;
}

/** Figma `answerExplanation` cards — success (student) and info (teachers only). */
export function AnswerNotesBlock({
  explanation,
  teacherNote,
}: AnswerNotesBlockProps) {
  const trimmedExplanation = explanation?.trim();
  const trimmedNote = teacherNote?.trim();
  if (!trimmedExplanation && !trimmedNote) return null;
  return (
    <div className={styles.notes}>
      {trimmedExplanation ? (
        <article className={[styles.card, styles.cardExplanation].join(" ")}>
          <header className={styles.cardHeader}>
            <p className={styles.cardLabel}>Answer explanation</p>
          </header>
          <div className={styles.cardBody}>
            <p className={styles.cardText}>{trimmedExplanation}</p>
          </div>
        </article>
      ) : null}
      {trimmedNote ? (
        <article className={[styles.card, styles.cardTeacher].join(" ")}>
          <header className={styles.cardHeader}>
            <p className={styles.cardLabel}>For teachers only</p>
          </header>
          <div className={styles.cardBody}>
            <p className={styles.cardText}>{trimmedNote}</p>
          </div>
        </article>
      ) : null}
    </div>
  );
}

interface StudentResponsesRowProps {
  count: number;
  /** Class size for the Figma `n/n` ratio. Unused when count is 0. */
  total?: number;
}

/** Figma `responseCount` (`370:31429`): 28px users + n/n or empty pair. Always paired with View student responses. */
export function StudentResponsesRow({
  count,
  total = 24,
}: StudentResponsesRowProps) {
  const hasResponses = count > 0;
  const answered = Math.min(count, total);
  return (
    <div className={styles.teacherActions}>
      <Button
        variant="outlined"
        color="secondary"
        size="small"
        startIconName="pen-field"
      >
        View student responses
      </Button>
      <div
        className={[
          styles.responseCount,
          hasResponses ? styles.responseCountFilled : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <FaIcon
          name="users"
          className={styles.responseIcon}
          fontSize="var(--text-heading-lg)"
        />
        <div className={styles.responseCopy}>
          <p className={styles.responseTitle}>
            {hasResponses ? `${answered}/${total}` : "No responses"}
          </p>
          <p className={styles.responseHelper}>
            {hasResponses ? "Students answered" : "No students have answered"}
          </p>
        </div>
      </div>
    </div>
  );
}
