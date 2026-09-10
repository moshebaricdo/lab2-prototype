import { Dialog } from "@moshebaricdo/cads-react";

export type SaveQuestionPromptKind = "shared-unpublished" | "published";

interface SaveQuestionPromptProps {
  open: boolean;
  kind: SaveQuestionPromptKind;
  questionTitle: string;
  onUpdateShared: () => void;
  onSaveCopy: () => void;
  onCancel: () => void;
}

/**
 * Save decision for questions used elsewhere. Authors never see “fork.”
 * Unpublished: update everywhere vs copy for this quiz.
 * Published: new version for this quiz only.
 */
export function SaveQuestionPrompt({
  open,
  kind,
  questionTitle,
  onUpdateShared,
  onSaveCopy,
  onCancel,
}: SaveQuestionPromptProps) {
  if (kind === "published") {
    return (
      <Dialog
        open={open}
        title="Save a new version for this quiz?"
        description="This question is on a published unit. Saving creates a new version here so existing student work stays on the previous wording. Other quizzes are unchanged."
        isDismissable
        primaryActionLabel="Save for this quiz"
        secondaryActionLabel="Cancel"
        onPrimaryAction={onSaveCopy}
        onSecondaryAction={onCancel}
        onClose={onCancel}
      />
    );
  }

  return (
    <Dialog
      open={open}
      title="This question is used in other quizzes"
      description={
        <>
          Updating <strong>{questionTitle}</strong> will change those quizzes
          too.
        </>
      }
      isDismissable
      primaryActionLabel="Update everywhere"
      secondaryActionLabel="Save a copy for this quiz"
      onPrimaryAction={onUpdateShared}
      onSecondaryAction={onSaveCopy}
      onClose={onCancel}
    />
  );
}
