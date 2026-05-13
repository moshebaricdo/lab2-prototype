import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { FileChange } from "../../../types/chat";
import type { FileItem } from "../../../types/file";
import {
  buildPreviewSrcDoc,
  getPreviewHtmlFiles,
} from "./views/buildPreviewSrcDoc";
import { applyPreviewDesignEdit } from "./views/previewDesignEdits";
import type {
  PreviewDesignApplyRequest,
  PreviewDesignElementDescriptor,
  WebLabPreviewConfig,
} from "./views/PreviewPanel";
import { findPreviewHtmlFileForChange } from "./webLab2FileTree";

interface UseWebLab2PreviewOptions {
  currentFileStructure: FileItem[];
  visibleFileStructure: FileItem[];
  visibleHasPendingAiChanges: boolean;
  reactPreviewContent: ReactNode;
  useFilePreview: boolean;
  enableDesignMode: boolean;
  isViewingHistoryVersion: boolean;
  isTutorRequestRunning: boolean;
  hasPendingAiChanges: boolean;
  setActiveTab: (tab: "ai-tutor") => void;
  setViewMode: (mode: "code" | "preview" | "split") => void;
  replaceFileStructure: (fileStructure: FileItem[]) => void;
}

export function useWebLab2Preview({
  currentFileStructure,
  visibleFileStructure,
  visibleHasPendingAiChanges,
  reactPreviewContent,
  useFilePreview,
  enableDesignMode,
  isViewingHistoryVersion,
  isTutorRequestRunning,
  hasPendingAiChanges,
  setActiveTab,
  setViewMode,
  replaceFileStructure,
}: UseWebLab2PreviewOptions) {
  const [previewPath, setPreviewPath] = useState("index.html");
  const previewHtmlFiles = useMemo(
    () => getPreviewHtmlFiles(visibleFileStructure, visibleHasPendingAiChanges),
    [visibleFileStructure, visibleHasPendingAiChanges],
  );

  useEffect(() => {
    if (!useFilePreview || previewHtmlFiles.length === 0) return;
    if (previewHtmlFiles.some((file) => file.path === previewPath)) return;

    const fallbackFile =
      previewHtmlFiles.find((file) => file.path === "index.html") ?? previewHtmlFiles[0];
    setPreviewPath(fallbackFile.path);
  }, [previewHtmlFiles, previewPath, useFilePreview]);

  const previewSrcDoc = useFilePreview
    ? buildPreviewSrcDoc(
        visibleFileStructure,
        visibleHasPendingAiChanges,
        previewPath,
      )
    : undefined;

  const handleOpenFileChangeInPreview = useCallback((change: FileChange) => {
    if (change.status === "deleted" || !useFilePreview) return;

    setViewMode("split");
    const target = findPreviewHtmlFileForChange(previewHtmlFiles, change.fileName);
    if (target) {
      setPreviewPath(target.path);
    }
  }, [previewHtmlFiles, setViewMode, useFilePreview]);

  const designModeDisabledReason = !enableDesignMode
    ? "Design mode is disabled for this level."
    : isViewingHistoryVersion
      ? "Return to the current version before editing preview styles."
      : isTutorRequestRunning
        ? "Wait for AI Tutor to finish generating before editing preview styles."
        : hasPendingAiChanges
          ? "Accept or reject the pending AI changes before editing preview styles."
          : undefined;
  const designEditDisabledReason = designModeDisabledReason;

  const handleApplyPreviewDesignEdit = useCallback((request: PreviewDesignApplyRequest) => {
    if (!enableDesignMode || isViewingHistoryVersion || isTutorRequestRunning || hasPendingAiChanges) return;
    const result = applyPreviewDesignEdit(currentFileStructure, previewPath, request);
    if (result.ok) {
      replaceFileStructure(result.fileStructure);
    } else {
      const error = "error" in result ? result.error : "Unknown preview design edit error.";
      console.warn("[PreviewDesign] Unable to apply design edit", error);
    }
  }, [
    currentFileStructure,
    enableDesignMode,
    hasPendingAiChanges,
    isTutorRequestRunning,
    isViewingHistoryVersion,
    previewPath,
    replaceFileStructure,
  ]);

  const handleAddPreviewElementToTutor = useCallback((element: PreviewDesignElementDescriptor) => {
    setActiveTab("ai-tutor");
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("weblab:add-preview-element-to-tutor", {
        detail: {
          previewPath,
          ...element,
        },
      }));
    }, 0);
  }, [previewPath, setActiveTab]);

  const previewConfig: WebLabPreviewConfig = useFilePreview
    ? {
        kind: "file",
        srcDoc: previewSrcDoc,
        path: previewPath,
        htmlFiles: previewHtmlFiles,
        onPathChange: setPreviewPath,
        showDesignTools: enableDesignMode,
        canEditDesign: !designEditDisabledReason,
        designModeDisabled: Boolean(designModeDisabledReason),
        designDisabledReason: designEditDisabledReason,
        onApplyDesignEdit: handleApplyPreviewDesignEdit,
        onAddPreviewElementToTutor: handleAddPreviewElementToTutor,
      }
    : {
        kind: "react",
        content: reactPreviewContent,
      };

  return {
    previewConfig,
    previewHtmlFiles,
    previewPath,
    setPreviewPath,
    handleOpenFileChangeInPreview,
  };
}
