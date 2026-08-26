import { useEffect } from "react";
import { Toast } from "@moshebaricdo/cads-react";
import { useBackpack } from "../../hooks/BackpackContext";

const TOAST_DISMISS_MS = 2000;
const TOAST_UNDO_DISMISS_MS = 5000;

export function BackpackSaveToasts() {
  const {
    showSaveSuccessAlert,
    setShowSaveSuccessAlert,
    showSaveErrorAlert,
    setShowSaveErrorAlert,
    showDeleteAlert,
    setShowDeleteAlert,
    deletedItemName,
    undoLastSave,
    undoLastDelete,
  } = useBackpack();

  useEffect(() => {
    if (!showSaveSuccessAlert) return undefined;
    const timeoutId = window.setTimeout(
      () => setShowSaveSuccessAlert(false),
      TOAST_UNDO_DISMISS_MS,
    );
    return () => window.clearTimeout(timeoutId);
  }, [showSaveSuccessAlert, setShowSaveSuccessAlert]);

  useEffect(() => {
    if (!showSaveErrorAlert) return undefined;
    const timeoutId = window.setTimeout(
      () => setShowSaveErrorAlert(false),
      TOAST_DISMISS_MS,
    );
    return () => window.clearTimeout(timeoutId);
  }, [showSaveErrorAlert, setShowSaveErrorAlert]);

  useEffect(() => {
    if (!showDeleteAlert) return undefined;
    const timeoutId = window.setTimeout(
      () => setShowDeleteAlert(false),
      TOAST_UNDO_DISMISS_MS,
    );
    return () => window.clearTimeout(timeoutId);
  }, [showDeleteAlert, setShowDeleteAlert]);

  const deletedLabel = deletedItemName
    ? `${deletedItemName} deleted from Backpack`
    : "Item deleted from Backpack";

  return (
    <>
      <Toast
        open={showSaveSuccessAlert}
        placement="topCenter"
        sentiment="success"
        isDismissible
        hasAction
        actionLabel="Undo"
        onAction={undoLastSave}
        onClose={() => setShowSaveSuccessAlert(false)}
      >
        File successfully saved to Backpack!
      </Toast>
      <Toast
        open={showSaveErrorAlert}
        placement="topCenter"
        sentiment="error"
        isDismissible
        onClose={() => setShowSaveErrorAlert(false)}
      >
        An error occurred while saving to the Backpack, please try again.
      </Toast>
      <Toast
        open={showDeleteAlert}
        placement="topCenter"
        sentiment="error"
        isDismissible
        hasAction
        actionLabel="Undo"
        onAction={undoLastDelete}
        onClose={() => setShowDeleteAlert(false)}
      >
        {deletedLabel}
      </Toast>
    </>
  );
}
