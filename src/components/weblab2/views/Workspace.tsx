import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCode,
  faEye,
  faColumns,
} from "@fortawesome/free-solid-svg-icons";
import { FileManager } from "./FileManager";
import { CodeEditor } from "./CodeEditor";
import { PreviewPanel } from "./PreviewPanel";
import { ResizableHandle } from "./ResizableHandle";
import { VersionBanner } from "./VersionBanner";
import { SavedTag } from "./SavedTag";
import { SegmentedControl, type SegmentedOption } from "./SegmentedControl";
import { versionLabels } from "../../../data/weblab2";
import type { FileItem } from "../../../types/file";
import type { ViewMode } from "../../../types/ui";
import styles from "./Workspace.module.scss";

interface WorkspaceProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  fileStructure: FileItem[];
  selectedFile: FileItem | null;
  setSelectedFile: (file: FileItem | null) => void;
  openFiles: FileItem[];
  openFolders: Set<string>;
  toggleFolder: (folderPath: string) => void;
  openFile: (file: FileItem) => void;
  closeFile: (file: FileItem) => void;
  handleReorderFiles: (files: FileItem[]) => void;
  isFileManagerCollapsed: boolean;
  setIsFileManagerCollapsed: (collapsed: boolean) => void;
  setIsCreateFileModalOpen: (open: boolean) => void;
  selectedHistoryVersion: string;
  showSavedTag: boolean;
  onReturnToCurrentVersion: () => void;
}

export function Workspace({
  viewMode,
  setViewMode,
  fileStructure,
  selectedFile,
  setSelectedFile,
  openFiles,
  openFolders,
  toggleFolder,
  openFile,
  closeFile,
  handleReorderFiles,
  isFileManagerCollapsed,
  setIsFileManagerCollapsed,
  setIsCreateFileModalOpen,
  selectedHistoryVersion,
  showSavedTag,
  onReturnToCurrentVersion,
}: WorkspaceProps) {
  const [splitViewCodeWidth, setSplitViewCodeWidth] = useState<number | null>(
    null
  );

  const viewModeOptions: SegmentedOption<ViewMode>[] = [
    { value: "code", label: "Code", icon: faCode },
    { value: "preview", label: "Preview", icon: faEye },
    { value: "split", label: "Split View", icon: faColumns },
  ];

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <SegmentedControl
          options={viewModeOptions}
          value={viewMode}
          onChange={setViewMode}
        />
        <label className={styles.headerLabel}>
          WORKSPACE
        </label>
        {showSavedTag ? <SavedTag /> : <div />}
      </div>

      {selectedHistoryVersion !== "current" && (
        <VersionBanner
          versionLabel={
            versionLabels[selectedHistoryVersion] ||
            selectedHistoryVersion
          }
          onClose={onReturnToCurrentVersion}
        />
      )}

      <div className={styles.contentRow}>
        {(viewMode === "code" || viewMode === "split") && (
          <div
            data-code-panel="true"
            className={`${styles.codePanel} ${viewMode === "split" && splitViewCodeWidth !== null ? styles.codePanelFixed : styles.codePanelFill}`}
            style={
              viewMode === "split" && splitViewCodeWidth !== null
                ? {
                    width: `${splitViewCodeWidth}px`,
                    minWidth: "300px",
                  }
                : viewMode === "split"
                  ? { minWidth: "300px" }
                  : undefined
            }
          >
            <div
              className={`${styles.fileManagerRail} ${isFileManagerCollapsed ? styles.fileManagerRailCollapsed : ""}`}
            >
              <FileManager
                fileStructure={fileStructure}
                selectedFile={selectedFile}
                openFolders={openFolders}
                onFileSelect={openFile}
                onToggleFolder={toggleFolder}
                collapsed={isFileManagerCollapsed}
                onToggleCollapse={() =>
                  setIsFileManagerCollapsed(!isFileManagerCollapsed)
                }
                onNewFile={() => setIsCreateFileModalOpen(true)}
              />
            </div>

            <div className={styles.editorArea}>
              <CodeEditor
                openFiles={openFiles}
                selectedFile={selectedFile}
                onFileSelect={setSelectedFile}
                onCloseFile={closeFile}
                onReorderFiles={handleReorderFiles}
                isFileManagerCollapsed={isFileManagerCollapsed}
                onCreateFile={() => setIsCreateFileModalOpen(true)}
              />
            </div>
          </div>
        )}

        {viewMode === "split" && (
          <ResizableHandle
            onResize={(delta) => {
              setSplitViewCodeWidth((prev) => {
                if (prev === null) {
                  const codePanel = document.querySelector(
                    '[data-code-panel="true"]'
                  );
                  if (codePanel) {
                    const currentWidth =
                      codePanel.getBoundingClientRect().width;
                    return Math.max(300, currentWidth + delta);
                  }
                  return Math.max(300, 600 + delta);
                }
                const newWidth = prev + delta;
                return Math.max(300, newWidth);
              });
            }}
          />
        )}

        {(viewMode === "preview" || viewMode === "split") && (
          <div
            className={styles.previewPanel}
            style={viewMode === "split" ? { minWidth: "300px" } : undefined}
          >
            <PreviewPanel hasContent={openFiles.length > 0} />
          </div>
        )}
      </div>
    </div>
  );
}
