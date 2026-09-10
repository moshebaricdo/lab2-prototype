import { Button } from "@moshebaricdo/cads-react";
import quizEmptyState from "../../../../assets/empty-states/quiz-empty-state.svg";
import styles from "./QuizPreviewEmptyState.module.scss";

interface QuizPreviewEmptyStateProps {
  onBackToBuild: () => void;
}

/** Preview tab when the quiz has no questions and the intro is off (Figma `600:7186`). */
export function QuizPreviewEmptyState({
  onBackToBuild,
}: QuizPreviewEmptyStateProps) {
  return (
    <div
      className={styles.root}
      role="region"
      aria-label="Nothing to preview yet. Go back to Build to add questions."
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
            <h2 className={styles.title}>Nothing to preview yet</h2>
            <p className={styles.body}>
              Preview shows the quiz the way users will see it. As you add
              questions the preview will populate here.
            </p>
          </div>
        </div>
        <Button
          variant="outlined"
          color="secondary"
          size="extraSmall"
          startIconName="pen-to-square"
          onClick={onBackToBuild}
        >
          Back to Build
        </Button>
      </div>
    </div>
  );
}
