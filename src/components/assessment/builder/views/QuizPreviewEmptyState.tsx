import { Button } from "@moshebari/cads-react";
import quizEmptyState from "../../../../assets/empty-states/quiz-empty-state.svg";
import styles from "./QuizPreviewEmptyState.module.scss";

interface QuizPreviewEmptyStateProps {
  onBackToBuild: () => void;
  title?: string;
  body?: string;
  actionLabel?: string;
}

/** Preview tab when the quiz has no questions and the intro is off (Figma `600:7186`). */
export function QuizPreviewEmptyState({
  onBackToBuild,
  title = "Nothing to preview yet",
  body = "Preview shows the quiz the way users will see it. As you add questions the preview will populate here.",
  actionLabel = "Back to Build",
}: QuizPreviewEmptyStateProps) {
  return (
    <div
      className={styles.root}
      role="region"
      aria-label={`${title}. ${body}`}
    >
      <div className={styles.inner}>
        <div className={styles.message}>
          <img
            src={quizEmptyState}
            alt=""
            width={200}
            height={146}
            className={styles.art}
          />
          <div className={styles.copy}>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.body}>{body}</p>
          </div>
        </div>
        <Button
          variant="outlined"
          color="secondary"
          size="extraSmall"
          startIconName="pen-to-square"
          onClick={onBackToBuild}
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}
