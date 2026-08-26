import { Modal } from "@moshebaricdo/cads-react";
import styles from "./SaveQuestionPrompt.module.scss";

interface SaveQuestionPromptProps {
  open: boolean;
  questionTitle: string;
  onUpdateShared: () => void;
  onSaveCopy: () => void;
  onCancel: () => void;
}

/**
 * Single-save decision point for edited bank questions: update the shared
 * question everywhere, or fork an assessment-local copy. Only shown when a
 * shared question is dirty — clean editors close with Done, one-offs save
 * directly.
 */
export function SaveQuestionPrompt({
  open,
  questionTitle,
  onUpdateShared,
  onSaveCopy,
  onCancel,
}: SaveQuestionPromptProps) {
  return (
    <Modal
      open={open}
      title="Update the shared question?"
      maxWidth={480}
      primaryActionLabel="Update shared question"
      secondaryActionLabel="Save a copy here"
      onPrimaryAction={onUpdateShared}
      onSecondaryAction={onSaveCopy}
      onClose={onCancel}
    >
      <p className={styles.body}>
        <strong>{questionTitle}</strong> comes from the question bank. Updating
        it changes every assessment that uses it. Saving a copy keeps your edits
        in this assessment only.
      </p>
    </Modal>
  );
}
