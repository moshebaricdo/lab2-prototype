import { Dialog } from "@moshebari/cads-react";
import styles from "./AiLabStartOverDialog.module.scss";

interface AiLabStartOverDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Destructive confirm from AI Lab 2 `6114:27298`. */
export function AiLabStartOverDialog({
  open,
  onConfirm,
  onCancel,
}: AiLabStartOverDialogProps) {
  return (
    <Dialog
      className={styles.dialog}
      type="iconTop"
      topIconName="exclamation"
      open={open}
      title="Are you sure you want to start over?"
      description="Starting over will wipe your current trained model and any training history. This cannot be reversed."
      primaryActionLabel="Start over"
      secondaryActionLabel="Cancel"
      maxWidth={636}
      isDismissable
      onPrimaryAction={onConfirm}
      onSecondaryAction={onCancel}
      onClose={onCancel}
    />
  );
}
