import { Dialog } from "@moshebaricdo/cads-react";

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
    <Dialog
      open={open}
      title="Update the shared question?"
      description={
        <>
          <strong>{questionTitle}</strong> is shared with other assessments.
          Updating it changes all of them. Saving a copy keeps your edits in this
          assessment only.
        </>
      }
      maxWidth={480}
      isDismissable
      primaryActionLabel="Update shared question"
      secondaryActionLabel="Save a copy here"
      onPrimaryAction={onUpdateShared}
      onSecondaryAction={onSaveCopy}
      onClose={onCancel}
    />
  );
}
