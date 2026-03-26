import { useMemo, useState } from "react";

export function useVersionHistoryState() {
  const [selectedHistoryVersion, setSelectedHistoryVersion] = useState("current");
  const [showSavedTag, setShowSavedTag] = useState(false);
  const [showRestoreSuccessAlert, setShowRestoreSuccessAlert] = useState(false);
  const [showSaveSuccessAlert, setShowSaveSuccessAlert] = useState(false);

  const handleSaveVersion = (description: string) => {
    setShowSavedTag(true);
    setTimeout(() => setShowSavedTag(false), 2500);
    setShowSaveSuccessAlert(true);
    setTimeout(() => setShowSaveSuccessAlert(false), 2500);
    console.log("Saved version with description:", description);
  };

  const handleRestoreVersion = (versionId: string) => {
    setSelectedHistoryVersion("current");
    setShowRestoreSuccessAlert(true);
    setTimeout(() => setShowRestoreSuccessAlert(false), 2500);
    console.log("Restoring version:", versionId);
  };

  const handleReturnToCurrentVersion = () => {
    setSelectedHistoryVersion("current");
  };

  return useMemo(
    () => ({
      selectedHistoryVersion,
      setSelectedHistoryVersion,
      showSavedTag,
      showRestoreSuccessAlert,
      setShowRestoreSuccessAlert,
      showSaveSuccessAlert,
      setShowSaveSuccessAlert,
      handleSaveVersion,
      handleRestoreVersion,
      handleReturnToCurrentVersion,
    }),
    [selectedHistoryVersion, showRestoreSuccessAlert, showSaveSuccessAlert, showSavedTag],
  );
}
