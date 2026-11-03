import { Button, Dialog } from "@moshebari/cads-react";
import styles from "./SectionDeleteDialog.module.scss";

interface QuestionDeleteDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirm removing a saved one-off that no other quiz uses. It only lives
 * in this quiz, so removing it deletes it from the bank for good.
 */
export function QuestionDeleteDialog({
  open,
  onConfirm,
  onCancel,
}: QuestionDeleteDialogProps) {
  return (
    <Dialog type="customContent" open={open} isDismissable onClose={onCancel}>
      <div className={styles.body}>
        <div className={styles.copy}>
          <h2 className={styles.title}>Delete this question?</h2>
          <p className={styles.description}>
            This question isn&apos;t used in any other quiz, so deleting it also
            removes it from the question bank. You can&apos;t undo this.
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
            Delete question
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
