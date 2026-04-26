import { useCallback, useMemo, useState } from "react";
import type { VersionItem } from "../components/lab2/resource-panel/views/VersionHistory";
import type { FileItem } from "../types/file";

interface VersionSnapshot {
  id: string;
  label: string;
  description: string;
  createdAt: string;
  fileStructure: FileItem[];
}

interface VersionHistoryStateOptions {
  getFileStructure?: () => FileItem[];
  onRestoreFileStructure?: (fileStructure: FileItem[]) => void;
}

function cloneFileTree(tree: FileItem[]): FileItem[] {
  return tree.map((item) => ({
    ...item,
    children: item.children ? cloneFileTree(item.children) : undefined,
  }));
}

function formatSnapshotLabel(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function useVersionHistoryState(options: VersionHistoryStateOptions = {}) {
  const { getFileStructure, onRestoreFileStructure } = options;
  const [selectedHistoryVersion, setSelectedHistoryVersion] = useState("current");
  const [showSavedTag, setShowSavedTag] = useState(false);
  const [showRestoreSuccessAlert, setShowRestoreSuccessAlert] = useState(false);
  const [showSaveSuccessAlert, setShowSaveSuccessAlert] = useState(false);
  const [snapshots, setSnapshots] = useState<VersionSnapshot[]>([]);

  const handleSaveVersion = useCallback((description: string) => {
    const createdAt = new Date();
    const fileStructure = getFileStructure?.();

    if (fileStructure) {
      setSnapshots((previous) => [
        {
          id: `snapshot-${createdAt.getTime()}`,
          label: formatSnapshotLabel(createdAt),
          description,
          createdAt: createdAt.toISOString(),
          fileStructure: cloneFileTree(fileStructure),
        },
        ...previous,
      ]);
    }

    setShowSavedTag(true);
    setTimeout(() => setShowSavedTag(false), 2500);
    setShowSaveSuccessAlert(true);
    setTimeout(() => setShowSaveSuccessAlert(false), 2500);
  }, [getFileStructure]);

  const handleRestoreVersion = useCallback((versionId: string) => {
    const snapshot = snapshots.find((item) => item.id === versionId);
    if (snapshot) {
      onRestoreFileStructure?.(cloneFileTree(snapshot.fileStructure));
    }

    setSelectedHistoryVersion("current");
    setShowRestoreSuccessAlert(true);
    setTimeout(() => setShowRestoreSuccessAlert(false), 2500);
  }, [onRestoreFileStructure, snapshots]);

  const handleReturnToCurrentVersion = useCallback(() => {
    setSelectedHistoryVersion("current");
  }, []);

  const versions = useMemo<VersionItem[] | undefined>(() => {
    if (!getFileStructure) return undefined;
    return [
      { id: "current", label: "Current Version" },
      ...snapshots.map((snapshot) => ({
        id: snapshot.id,
        label: snapshot.label,
        description: snapshot.description,
      })),
    ];
  }, [getFileStructure, snapshots]);

  return useMemo(
    () => ({
      versions,
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
    [
      versions,
      selectedHistoryVersion,
      showRestoreSuccessAlert,
      showSaveSuccessAlert,
      showSavedTag,
      handleSaveVersion,
      handleRestoreVersion,
      handleReturnToCurrentVersion,
    ],
  );
}
