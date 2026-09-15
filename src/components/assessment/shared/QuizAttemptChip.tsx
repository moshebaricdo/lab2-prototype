import { FaIcon } from "@moshebari/cads-react/icons";
import styles from "./QuizAttemptChip.module.scss";

interface QuizAttemptChipProps {
  label: string;
}

/** Figma `quizAttemptChip` — sitting count beside Submit / Try again / timer. */
export function QuizAttemptChip({ label }: QuizAttemptChipProps) {
  return (
    <span className={styles.chip}>
      <FaIcon name="bullseye-arrow" size="small" />
      {label}
    </span>
  );
}
