import { useEffect, useState, type CSSProperties } from "react";
import { FileManager } from "../../shared/FileManager";
import { CodeEditor } from "../../shared/code-editor";
import { PanelHeader } from "../../../ui/PanelHeader";
import { PreviewPanel } from "./PreviewPanel";
import { ResizableHandle } from "../../../ui/ResizableHandle";
import { VersionBanner } from "./VersionBanner";
import { AiChangesBanner } from "./AiChangesBanner";
import { SavedTag } from "./SavedTag";
import { SegmentedControl, type SegmentedOption } from "./SegmentedControl";
import { versionLabels } from "../../../../data/weblab2";
import type { FileItem } from "../../../../types/file";
import type { ViewMode } from "../../../../types/ui";
import type { WebLabPreviewConfig } from "./PreviewPanel";
import styles from "./Workspace.module.scss";

const DEFAULT_FILE_MANAGER_WIDTH = 158;
const MIN_FILE_MANAGER_WIDTH = 128;
const MAX_FILE_MANAGER_WIDTH = 320;
const MIN_EDITOR_WIDTH = 300;
const FILE_MANAGER_ANIMATION_MS = 220;

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
  setIsCreateFolderModalOpen?: (open: boolean) => void;
  enableFileDragToTutor?: boolean;
  showOnlyFilesWithContent?: boolean;
  onRequestRenameFile?: (file: FileItem, path: string) => void;
  onAddFileToTutor?: (file: FileItem, path: string) => void;
  onDeleteFile?: (file: FileItem, path: string) => void;
  onMoveFileTreeItem?: (sourcePath: string, targetFolderPath: string) => true | string | void;
  preview: WebLabPreviewConfig;
  selectedHistoryVersion: string;
  showSavedTag: boolean;
  onReturnToCurrentVersion: () => void;
  aiChangedFiles?: Record<string, "new" | "modified" | "deleted">;
  onFileContentChange?: (fileName: string, content: string) => void;
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
  setIsCreateFolderModalOpen,
  enableFileDragToTutor = false,
  showOnlyFilesWithContent = false,
  onRequestRenameFile,
  onAddFileToTutor,
  onDeleteFile,
  onMoveFileTreeItem,
  preview,
  selectedHistoryVersion,
  showSavedTag,
  onReturnToCurrentVersion,
  aiChangedFiles,
  onFileContentChange,
}: WorkspaceProps) {
  const [splitViewCodeWidth, setSplitViewCodeWidth] = useState<number | null>(
    null
  );
  const [fileManagerWidth, setFileManagerWidth] = useState(DEFAULT_FILE_MANAGER_WIDTH);
  const [fileManagerTransition, setFileManagerTransition] = useState<
    "collapsing" | "expanding" | null
  >(null);

  useEffect(() => {
    if (!fileManagerTransition) return;
    const timeoutId = window.setTimeout(() => {
      setFileManagerTransition(null);
    }, FILE_MANAGER_ANIMATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [fileManagerTransition]);

  const handleFileManagerCollapseChange = (collapsed: boolean) => {
    if (collapsed === isFileManagerCollapsed) return;
    setFileManagerTransition(collapsed ? "collapsing" : "expanding");
    setIsFileManagerCollapsed(collapsed);
  };

  const viewModeOptions: SegmentedOption<ViewMode>[] = [
    { value: "code", label: "Code", iconName: "code" },
    { value: "preview", label: "Preview", iconName: "eye" },
    { value: "split", label: "Split View", iconName: "table-columns" },
  ];

  const renderExpandedFileManager = () => (
    <FileManager
      fileStructure={fileStructure}
      selectedFile={selectedFile}
      openFolders={openFolders}
      onFileSelect={openFile}
      onToggleFolder={toggleFolder}
      collapsed={false}
      onToggleCollapse={() => handleFileManagerCollapseChange(true)}
      onNewFile={() => setIsCreateFileModalOpen(true)}
      onNewFolder={() => setIsCreateFolderModalOpen?.(true)}
      onRenameFile={onRequestRenameFile}
      onAddFileToChat={onAddFileToTutor}
      onDeleteFile={onDeleteFile}
      onMoveItem={onMoveFileTreeItem}
      enableDragToTutor={enableFileDragToTutor}
      aiChangedFiles={aiChangedFiles}
      showOnlyFilesWithContent={showOnlyFilesWithContent}
    />
  );

  return (
    <div className={styles.root}>
      <PanelHeader
        label="WORKSPACE"
        left={
          <SegmentedControl
            options={viewModeOptions}
            value={viewMode}
            onChange={setViewMode}
          />
        }
        right={showSavedTag ? <SavedTag /> : undefined}
      />

      <AiChangesBanner visible={!!aiChangedFiles && Object.keys(aiChangedFiles).length > 0} />

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
                    minWidth: `${isFileManagerCollapsed ? MIN_EDITOR_WIDTH : fileManagerWidth + MIN_EDITOR_WIDTH}px`,
                  }
                : viewMode === "split"
                  ? {
                      minWidth: `${isFileManagerCollapsed ? MIN_EDITOR_WIDTH : fileManagerWidth + MIN_EDITOR_WIDTH}px`,
                    }
                  : undefined
            }
          >
            <div
              className={`${styles.fileManagerRail} ${isFileManagerCollapsed ? styles.fileManagerRailCollapsed : ""}`}
              style={isFileManagerCollapsed ? undefined : { width: `${fileManagerWidth}px` }}
            >
              {isFileManagerCollapsed ? (
                <FileManager
                  fileStructure={fileStructure}
                  selectedFile={selectedFile}
                  openFolders={openFolders}
                  onFileSelect={openFile}
                  onToggleFolder={toggleFolder}
                  collapsed
                  onToggleCollapse={() => handleFileManagerCollapseChange(false)}
                />
              ) : (
                <div
                  className={`${styles.fileManagerContent} ${
                    fileManagerTransition === "expanding"
                      ? styles.fileManagerContentEntering
                      : ""
                  }`}
                >
                  {renderExpandedFileManager()}
                </div>
              )}
            </div>

            {fileManagerTransition === "collapsing" && (
              <div
                className={styles.fileManagerCollapseOverlay}
                style={{ width: `${fileManagerWidth}px` }}
                aria-hidden
              >
                <div className={styles.fileManagerContent}>
                  {renderExpandedFileManager()}
                </div>
              </div>
            )}

            {!isFileManagerCollapsed && fileManagerTransition !== "expanding" && (
              <ResizableHandle
                onResize={(delta) => {
                  setFileManagerWidth((prev) =>
                    Math.max(
                      MIN_FILE_MANAGER_WIDTH,
                      Math.min(MAX_FILE_MANAGER_WIDTH, prev + delta),
                    )
                  );
                }}
              />
            )}

            <div
              className={`${styles.editorArea} ${
                fileManagerTransition === "collapsing"
                  ? styles.editorAreaCollapsing
                  : fileManagerTransition === "expanding"
                    ? styles.editorAreaExpanding
                    : ""
              }`}
              style={{
                "--file-manager-width": `${fileManagerWidth}px`,
              } as CSSProperties}
            >
              <CodeEditor
                openFiles={openFiles}
                selectedFile={selectedFile}
                onFileSelect={setSelectedFile}
                onCloseFile={closeFile}
                onReorderFiles={handleReorderFiles}
                isFileManagerCollapsed={isFileManagerCollapsed}
                onCreateFile={() => setIsCreateFileModalOpen(true)}
                enableDragToTutor={enableFileDragToTutor}
                aiChangedFiles={aiChangedFiles}
                onFileContentChange={onFileContentChange}
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
            <PreviewPanel
              hasContent={
                openFiles.length > 0 ||
                preview.kind === "react" ||
                Boolean(preview.srcDoc) ||
                Boolean(preview.htmlFiles.length)
              }
              preview={preview}
            />
          </div>
        )}
      </div>
    </div>
  );
}
