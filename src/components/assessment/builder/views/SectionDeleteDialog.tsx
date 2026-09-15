import { Button, Dialog } from "@moshebari/cads-react";
import styles from "./SectionDeleteDialog.module.scss";

interface SectionDeleteDialogProps {
  open: boolean;
  displayTitle: string;
  questionCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirm deleting a populated section. Empty sections delete immediately.
 * Removing the section also removes its questions from the quiz.
 */
export function SectionDeleteDialog({
  open,
  displayTitle,
  questionCount,
  onConfirm,
  onCancel,
}: SectionDeleteDialogProps) {
  const countLabel = `${questionCount} question${questionCount === 1 ? "" : "s"}`;

  return (
    <Dialog type="customContent" open={open} isDismissable onClose={onCancel}>
      <div className={styles.body}>
        <div className={styles.copy}>
          <h2 className={styles.title}>Remove {displayTitle}?</h2>
          <p className={styles.description}>
            {displayTitle} has {countLabel}. Removing the section also removes
            those questions from the quiz.
          </p>
        </div>
        <div className={styles.actions}>
          <Button
            size="medium"
            variant="outlined"
            color="secondary"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            size="medium"
            variant="contained"
            color="error"
            onClick={onConfirm}
          >
            Remove section and questions
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
