import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { VersionItem } from "../components/lab2/resource-panel/views/VersionHistory";
import type { FileItem } from "../types/file";

type VersionSnapshotKind = "initial" | "manual" | "auto" | "ai";

interface VersionSnapshot {
  id: string;
  label: string;
  description?: string;
  createdAt: string;
  kind: VersionSnapshotKind;
  fileStructure: FileItem[];
}

interface VersionHistoryStateOptions {
  getFileStructure?: () => FileItem[];
  onRestoreFileStructure?: (fileStructure: FileItem[]) => void;
  storageKey?: string;
  autosaveIntervalMs?: number;
}

const DEFAULT_AUTOSAVE_INTERVAL_MS = 15_000;

function cloneFileTreeForSnapshot(tree: FileItem[]): FileItem[] {
  return tree.map((item) => ({
    name: item.name,
    type: item.type,
    content: item.content,
    locked: item.locked,
    children: item.children ? cloneFileTreeForSnapshot(item.children) : undefined,
  }));
}

function formatSnapshotLabel(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function createSnapshot(
  kind: VersionSnapshotKind,
  fileStructure: FileItem[],
  description?: string,
): VersionSnapshot {
  const createdAt = new Date();
  return {
    id:
      kind === "initial"
        ? "initial"
        : `${kind}-${createdAt.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    label: kind === "initial" ? "Initial Version" : formatSnapshotLabel(createdAt),
    description,
    createdAt: createdAt.toISOString(),
    kind,
    fileStructure: cloneFileTreeForSnapshot(fileStructure),
  };
}

function sortSnapshots(snapshots: VersionSnapshot[]): VersionSnapshot[] {
  return [...snapshots].sort((a, b) => {
    if (a.kind === "initial" && b.kind === "initial") return 0;
    if (a.kind === "initial") return 1;
    if (b.kind === "initial") return -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function serializeFileTree(tree: FileItem[]) {
  return JSON.stringify(cloneFileTreeForSnapshot(tree));
}

function fileTreeHasProjectFiles(tree: FileItem[]): boolean {
  return tree.some((item) =>
    item.type === "folder"
      ? fileTreeHasProjectFiles(item.children ?? [])
      : true
  );
}

function snapshotsHaveProjectFiles(snapshots: VersionSnapshot[]): boolean {
  return snapshots.some((snapshot) => fileTreeHasProjectFiles(snapshot.fileStructure));
}

function readStoredSnapshots(storageKey: string): VersionSnapshot[] | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { snapshots?: VersionSnapshot[] };
    if (!Array.isArray(parsed.snapshots)) return null;
    return sortSnapshots(parsed.snapshots);
  } catch {
    return null;
  }
}

export function useVersionHistoryState(options: VersionHistoryStateOptions = {}) {
  const {
    getFileStructure,
    onRestoreFileStructure,
    storageKey,
    autosaveIntervalMs = DEFAULT_AUTOSAVE_INTERVAL_MS,
  } = options;
  const [selectedHistoryVersion, setSelectedHistoryVersion] = useState("current");
  const [showRestoreSuccessAlert, setShowRestoreSuccessAlert] = useState(false);
  const [showSaveSuccessAlert, setShowSaveSuccessAlert] = useState(false);
  const getFileStructureRef = useRef(getFileStructure);
  const lastCheckedSignatureRef = useRef<string | null>(null);
  const versioningEnabled = Boolean(getFileStructure);
  const initialStoredSnapshotsRef = useRef<VersionSnapshot[] | null>(null);
  const initialHasProjectFilesRef = useRef(false);
  const [snapshots, setSnapshots] = useState<VersionSnapshot[]>(() => {
    if (!getFileStructure) return [];
    const storedSnapshots = storageKey ? readStoredSnapshots(storageKey) : null;
    initialStoredSnapshotsRef.current = storedSnapshots;
    if (storedSnapshots) {
      initialHasProjectFilesRef.current = snapshotsHaveProjectFiles(storedSnapshots);
      return storedSnapshots;
    }
    const initialFileStructure = getFileStructure();
    initialHasProjectFilesRef.current = fileTreeHasProjectFiles(initialFileStructure);
    return [createSnapshot("initial", initialFileStructure)];
  });
  const [hasProjectEverHadFiles, setHasProjectEverHadFiles] = useState(
    () => initialHasProjectFilesRef.current,
  );
  const [hasRestoredInitialVersion, setHasRestoredInitialVersion] = useState(false);

  getFileStructureRef.current = getFileStructure;

  useEffect(() => {
    if (!versioningEnabled || !onRestoreFileStructure) return;
    const storedSnapshots = initialStoredSnapshotsRef.current;
    if (!storedSnapshots) return;

    const latestChangedSnapshot = storedSnapshots.find((snapshot) => snapshot.kind !== "initial");
    if (!latestChangedSnapshot) return;

    const currentFileStructure = getFileStructureRef.current?.();
    if (!currentFileStructure) return;

    const currentSignature = serializeFileTree(currentFileStructure);
    const latestSignature = serializeFileTree(latestChangedSnapshot.fileStructure);
    if (currentSignature === latestSignature) {
      initialStoredSnapshotsRef.current = null;
      return;
    }

    const initialSnapshot = storedSnapshots.find((snapshot) => snapshot.kind === "initial");
    const initialSignature = initialSnapshot ? serializeFileTree(initialSnapshot.fileStructure) : null;
    if (initialSignature && currentSignature !== initialSignature) {
      initialStoredSnapshotsRef.current = null;
      return;
    }

    const restoredFileStructure = cloneFileTreeForSnapshot(latestChangedSnapshot.fileStructure);
    onRestoreFileStructure(restoredFileStructure);
    lastCheckedSignatureRef.current = latestSignature;
    initialStoredSnapshotsRef.current = null;
  }, [onRestoreFileStructure, versioningEnabled]);

  useEffect(() => {
    if (!versioningEnabled) return;

    setSnapshots((previous) => {
      if (previous.some((snapshot) => snapshot.kind === "initial")) return previous;
      const fileStructure = getFileStructureRef.current?.();
      if (!fileStructure) return previous;
      return sortSnapshots([
        ...previous,
        createSnapshot("initial", fileStructure),
      ]);
    });
  }, [versioningEnabled]);

  useEffect(() => {
    if (!storageKey || !versioningEnabled || typeof window === "undefined") return;

    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify({ snapshots }),
    );
  }, [snapshots, storageKey, versioningEnabled]);

  useEffect(() => {
    if (!versioningEnabled) return;
    const fileStructure = getFileStructureRef.current?.();
    if (fileStructure) {
      lastCheckedSignatureRef.current ??= serializeFileTree(fileStructure);
      if (!hasProjectEverHadFiles && fileTreeHasProjectFiles(fileStructure)) {
        setHasProjectEverHadFiles(true);
      }
    }
  }, [getFileStructure, hasProjectEverHadFiles, versioningEnabled]);

  useEffect(() => {
    if (hasProjectEverHadFiles || !snapshotsHaveProjectFiles(snapshots)) return;
    setHasProjectEverHadFiles(true);
  }, [hasProjectEverHadFiles, snapshots]);

  const addSnapshot = useCallback((
    kind: Exclude<VersionSnapshotKind, "initial">,
    description?: string,
    fileStructureOverride?: FileItem[],
  ) => {
    const fileStructure = fileStructureOverride ?? getFileStructureRef.current?.();
    if (!fileStructure) return null;

    const snapshot = createSnapshot(kind, fileStructure, description);
    if (fileTreeHasProjectFiles(fileStructure)) {
      setHasProjectEverHadFiles(true);
    }
    setSnapshots((previous) => sortSnapshots([...previous, snapshot]));
    lastCheckedSignatureRef.current = serializeFileTree(fileStructure);
    return snapshot;
  }, []);

  useEffect(() => {
    if (!versioningEnabled || autosaveIntervalMs <= 0) return;

    const intervalId = window.setInterval(() => {
      const currentFileStructure = getFileStructureRef.current?.();
      if (!currentFileStructure) return;

      const currentSignature = serializeFileTree(currentFileStructure);
      if (lastCheckedSignatureRef.current === currentSignature) return;

      addSnapshot("auto", undefined, currentFileStructure);
    }, autosaveIntervalMs);

    return () => window.clearInterval(intervalId);
  }, [addSnapshot, autosaveIntervalMs, versioningEnabled]);

  const handleSaveVersion = useCallback((description: string) => {
    addSnapshot("manual", description.trim());
    setShowSaveSuccessAlert(true);
  }, [addSnapshot]);

  const handleSaveAiVersion = useCallback((fileStructure?: FileItem[], saveTitle?: string) => {
    addSnapshot("ai", saveTitle?.trim(), fileStructure);
  }, [addSnapshot]);

  const handleRestoreVersion = useCallback((versionId: string) => {
    const snapshot = snapshots.find((item) => item.id === versionId);
    if (snapshot) {
      const restoredFileStructure = cloneFileTreeForSnapshot(snapshot.fileStructure);
      onRestoreFileStructure?.(restoredFileStructure);
      lastCheckedSignatureRef.current = serializeFileTree(restoredFileStructure);

      if (snapshot.kind === "initial") {
        setHasRestoredInitialVersion(true);
        setSnapshots([snapshot]);
      }
    }

    setSelectedHistoryVersion("current");
    setShowRestoreSuccessAlert(true);
  }, [onRestoreFileStructure, snapshots]);

  const handleReturnToCurrentVersion = useCallback(() => {
    setSelectedHistoryVersion("current");
  }, []);

  const selectedHistorySnapshot = useMemo(
    () => snapshots.find((item) => item.id === selectedHistoryVersion),
    [selectedHistoryVersion, snapshots],
  );

  const versions = useMemo<VersionItem[] | undefined>(() => {
    if (!versioningEnabled) return undefined;
    return [
      { id: "current", label: "Current Version" },
      ...snapshots.map((snapshot) => ({
        id: snapshot.id,
        label: snapshot.label,
        description: snapshot.description,
        isAutoSave: snapshot.kind === "auto",
        isAiSave: snapshot.kind === "ai",
        createdAt: snapshot.createdAt,
      })),
    ];
  }, [snapshots, versioningEnabled]);

  const selectedHistoryVersionLabel = useMemo(
    () =>
      versions?.find((version) => version.id === selectedHistoryVersion)?.label ??
      selectedHistoryVersion,
    [selectedHistoryVersion, versions],
  );
  const latestSavedAt = useMemo(
    () => snapshots.find((snapshot) => snapshot.kind !== "initial")?.createdAt ??
      snapshots.find((snapshot) => snapshot.kind === "initial")?.createdAt,
    [snapshots],
  );
  const showNewProjectHistoryEmptyState =
    versioningEnabled &&
    !hasProjectEverHadFiles &&
    !hasRestoredInitialVersion;

  return useMemo(
    () => ({
      versions,
      selectedHistoryFileStructure: selectedHistorySnapshot?.fileStructure,
      selectedHistoryVersionLabel,
      latestSavedAt,
      selectedHistoryVersion,
      showNewProjectHistoryEmptyState,
      setSelectedHistoryVersion,
      showRestoreSuccessAlert,
      setShowRestoreSuccessAlert,
      showSaveSuccessAlert,
      setShowSaveSuccessAlert,
      handleSaveVersion,
      handleSaveAiVersion,
      handleRestoreVersion,
      handleReturnToCurrentVersion,
    }),
    [
      versions,
      selectedHistorySnapshot,
      selectedHistoryVersionLabel,
      latestSavedAt,
      selectedHistoryVersion,
      showNewProjectHistoryEmptyState,
      showRestoreSuccessAlert,
      showSaveSuccessAlert,
      handleSaveVersion,
      handleSaveAiVersion,
      handleRestoreVersion,
      handleReturnToCurrentVersion,
    ],
  );
}
