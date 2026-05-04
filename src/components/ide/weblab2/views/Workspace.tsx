import { useEffect, useState, type CSSProperties } from "react";
import { FileManager } from "../../shared/FileManager";
import { CodeEditor } from "../../shared/code-editor";
import { NewProjectEmptyState } from "./NewProjectEmptyState";
import {
  PlanActionBar,
  PlanMarkdownPreview,
  type PlanViewMode,
} from "./plan-file";
import { PreviewPanel } from "./PreviewPanel";
import { ResizableHandle } from "../../../ui/ResizableHandle";
import { VersionBanner } from "./VersionBanner";
import { SegmentedControl, type SegmentedOption } from "./SegmentedControl";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { versionLabels } from "../../../../data/weblab2";
import type { FileItem } from "../../../../types/file";
import type { TutorRequestMode } from "../../../../types/tutor";
import type { ViewMode } from "../../../../types/ui";
import type { WebLabPreviewConfig } from "./PreviewPanel";
import styles from "./Workspace.module.scss";

const DEFAULT_FILE_MANAGER_WIDTH = 158;
const MIN_FILE_MANAGER_WIDTH = 128;
const MAX_FILE_MANAGER_WIDTH = 320;
const MIN_EDITOR_WIDTH = 300;
const FILE_MANAGER_ANIMATION_MS = 220;

function getPlanFileNames(items: FileItem[]): Set<string> {
  const names = new Set<string>();
  for (const item of items) {
    if (item.type === "folder" && item.name === "Plans") {
      for (const child of item.children ?? []) {
        if (child.type !== "folder" && child.name.toLowerCase().endsWith(".md")) {
          names.add(child.name);
        }
      }
    }
    if (item.children) {
      for (const name of getPlanFileNames(item.children)) {
        names.add(name);
      }
    }
  }
  return names;
}

function hasProjectFiles(items: FileItem[]): boolean {
  return items.some((item) =>
    item.children ? hasProjectFiles(item.children) : true
  );
}

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
  setIsCreatePlanModalOpen?: (open: boolean) => void;
  enableFileDragToTutor?: boolean;
  showOnlyFilesWithContent?: boolean;
  onRequestRenameFile?: (file: FileItem, path: string) => void;
  onAddFileToTutor?: (file: FileItem, path: string) => void;
  onDeleteFile?: (file: FileItem, path: string) => void;
  onMoveFileTreeItem?: (sourcePath: string, targetFolderPath: string) => true | string | void;
  onStartWithTutor?: (prompt?: string, requestMode?: TutorRequestMode) => void;
  onUploadStarterFiles?: (files: FileList) => Promise<true | string | void> | true | string | void;
  starterUploadAccept?: string;
  showNewProjectEmptyState?: boolean;
  preview: WebLabPreviewConfig;
  selectedHistoryVersion: string;
  selectedHistoryVersionLabel?: string;
  onReturnToCurrentVersion: () => void;
  aiChangedFiles?: Record<string, "new" | "modified" | "deleted">;
  onAcceptAiChanges?: () => void;
  onRejectAiChanges?: () => void;
  builtPlanPaths?: Set<string>;
  onFileContentChange?: (fileName: string, content: string) => void;
  showPlanActionBar?: boolean;
  planFileName?: string;
  isPlanBuilt?: boolean;
  planStatusText?: string;
  onBuildPlan?: () => void;
  showBuildPlan?: boolean;
  buildPlanDisabled?: boolean;
  buildPlanRunning?: boolean;
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
  setIsCreatePlanModalOpen,
  enableFileDragToTutor = false,
  showOnlyFilesWithContent = false,
  onRequestRenameFile,
  onAddFileToTutor,
  onDeleteFile,
  onMoveFileTreeItem,
  onStartWithTutor,
  onUploadStarterFiles,
  starterUploadAccept,
  showNewProjectEmptyState = true,
  preview,
  selectedHistoryVersion,
  selectedHistoryVersionLabel,
  onReturnToCurrentVersion,
  aiChangedFiles,
  onAcceptAiChanges,
  onRejectAiChanges,
  builtPlanPaths,
  onFileContentChange,
  showPlanActionBar = false,
  planFileName = "PROJECT_PLAN.md",
  isPlanBuilt = false,
  planStatusText,
  onBuildPlan,
  showBuildPlan = true,
  buildPlanDisabled = false,
  buildPlanRunning = false,
}: WorkspaceProps) {
  const [splitViewCodeWidth, setSplitViewCodeWidth] = useState<number | null>(
    null
  );
  const [fileManagerWidth, setFileManagerWidth] = useState(DEFAULT_FILE_MANAGER_WIDTH);
  const [fileManagerTransition, setFileManagerTransition] = useState<
    "collapsing" | "expanding" | null
  >(null);
  const [planViewMode, setPlanViewMode] = useState<PlanViewMode>("preview");

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
  const isViewingHistoryVersion = selectedHistoryVersion !== "current";
  const isEmptyProject = !hasProjectFiles(fileStructure);
  const shouldShowNewProjectEmptyState =
    isEmptyProject && showNewProjectEmptyState && !isViewingHistoryVersion;
  const hasPendingAiChanges = !!aiChangedFiles && Object.keys(aiChangedFiles).length > 0;
  const planFileNames = getPlanFileNames(fileStructure);
  const isPlanOpen = planFileNames.has(selectedFile?.name ?? "") &&
    openFiles.some((file) => file.name === selectedFile?.name);
  const resolvedShowPlanActionBar = showPlanActionBar && isPlanOpen;
  const editorOpenFiles = resolvedShowPlanActionBar
    ? openFiles
    : openFiles.filter((file) => !planFileNames.has(file.name));

  const handleCloseEditorFile = (file: FileItem) => {
    const remainingEditorOpenFiles = editorOpenFiles.filter((openFile) => openFile.name !== file.name);
    closeFile(file);
    if (remainingEditorOpenFiles.length === 0) {
      setSelectedFile(null);
    } else if (selectedFile?.name === file.name) {
      setSelectedFile(remainingEditorOpenFiles[0]);
    }
  };

  const renderExpandedFileManager = () => (
    <FileManager
      fileStructure={fileStructure}
      selectedFile={selectedFile}
      openFolders={openFolders}
      onFileSelect={openFile}
      onToggleFolder={toggleFolder}
      collapsed={false}
      onToggleCollapse={() => handleFileManagerCollapseChange(true)}
      onNewFile={isViewingHistoryVersion ? undefined : () => setIsCreateFileModalOpen(true)}
      onNewFolder={isViewingHistoryVersion ? undefined : () => setIsCreateFolderModalOpen?.(true)}
      onNewPlan={isViewingHistoryVersion ? undefined : () => setIsCreatePlanModalOpen?.(true)}
      onRenameFile={isViewingHistoryVersion ? undefined : onRequestRenameFile}
      onAddFileToChat={isViewingHistoryVersion ? undefined : onAddFileToTutor}
      onDeleteFile={isViewingHistoryVersion ? undefined : onDeleteFile}
      onMoveItem={isViewingHistoryVersion ? undefined : onMoveFileTreeItem}
      enableDragToTutor={isViewingHistoryVersion ? false : enableFileDragToTutor}
      aiChangedFiles={aiChangedFiles}
      builtPlanPaths={builtPlanPaths}
      showOnlyFilesWithContent={showOnlyFilesWithContent}
      showRightBorder={false}
    />
  );

  return (
    <div className={styles.root}>
      <WorkspaceHeader
        left={shouldShowNewProjectEmptyState ? undefined : (
          <SegmentedControl
            options={viewModeOptions}
            value={viewMode}
            onChange={setViewMode}
          />
        )}
        aiChangesActive={hasPendingAiChanges}
        onAcceptAiChanges={onAcceptAiChanges}
        onRejectAiChanges={onRejectAiChanges}
      />

      {selectedHistoryVersion !== "current" && (
        <VersionBanner
          versionLabel={
            selectedHistoryVersionLabel ||
            versionLabels[selectedHistoryVersion] ||
            selectedHistoryVersion
          }
          onClose={onReturnToCurrentVersion}
        />
      )}

      {shouldShowNewProjectEmptyState ? (
        <NewProjectEmptyState
          isViewingHistoryVersion={isViewingHistoryVersion}
          onCreateFile={() => setIsCreateFileModalOpen(true)}
          onStartWithTutor={onStartWithTutor}
          onUploadStarterFiles={onUploadStarterFiles}
          starterUploadAccept={starterUploadAccept}
        />
      ) : (
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
                  transparentCollapsedBackground={resolvedShowPlanActionBar}
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
                openFiles={editorOpenFiles}
                selectedFile={selectedFile}
                onFileSelect={setSelectedFile}
                onCloseFile={handleCloseEditorFile}
                onReorderFiles={handleReorderFiles}
                isFileManagerCollapsed={isFileManagerCollapsed}
                onCreateFile={isViewingHistoryVersion ? undefined : () => setIsCreateFileModalOpen(true)}
                enableDragToTutor={isViewingHistoryVersion ? false : enableFileDragToTutor}
                aiChangedFiles={aiChangedFiles}
                onFileContentChange={onFileContentChange}
                readOnly={isViewingHistoryVersion ? true : undefined}
                hideFileTabs={resolvedShowPlanActionBar}
                planActionBar={resolvedShowPlanActionBar ? (
                  <PlanActionBar
                    viewMode={planViewMode}
                    fileName={planFileName}
                    isBuilt={isPlanBuilt}
                    statusText={planStatusText}
                    onViewModeChange={setPlanViewMode}
                    onBuildPlan={onBuildPlan}
                    showEditPlan={!hasPendingAiChanges}
                    showBuildPlan={showBuildPlan && !hasPendingAiChanges}
                    buildPlanDisabled={buildPlanDisabled}
                    buildPlanRunning={buildPlanRunning}
                  />
                ) : undefined}
                contentOverride={resolvedShowPlanActionBar && planViewMode === "preview"
                  ? ({ code }) => <PlanMarkdownPreview markdown={code} />
                  : undefined}
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
      )}
    </div>
  );
}
