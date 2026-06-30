import { FaIcon } from "../../../components/ui/icons/FaIcon";
import type { ProgressStatus } from "./progressData";
import styles from "./ProgressStatusGlyph.module.scss";

interface ProgressStatusGlyphProps {
  status: ProgressStatus;
}

/**
 * Renders the small completion / teacher-action marker shared by the legend
 * and the progress grid cells.
 */
export function ProgressStatusGlyph({ status }: ProgressStatusGlyphProps) {
  switch (status) {
    case "in-progress":
      return <span className={`${styles.circle} ${styles.inProgress}`} aria-hidden="true" />;
    case "validated":
      return (
        <FaIcon name="circle-check" size="s" className={styles.validated} />
      );
    case "submitted":
      return <span className={`${styles.circle} ${styles.submitted}`} aria-hidden="true" />;
    case "no-work":
      return <span className={styles.noWork} aria-hidden="true" />;
    case "needs-feedback":
      return <span className={`${styles.corner} ${styles.needsFeedback}`} aria-hidden="true" />;
    case "feedback-given":
      return <span className={`${styles.corner} ${styles.feedbackGiven}`} aria-hidden="true" />;
    case "keep-working":
      return <FaIcon name="rotate-left" size="s" className={styles.keepWorking} />;
    default:
      return null;
  }
}
