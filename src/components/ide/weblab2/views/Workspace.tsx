import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { FileManager } from "../../shared/FileManager";
import { CodeEditor } from "../../shared/code-editor";
import { NewProjectEmptyState } from "./NewProjectEmptyState";
import {
  PlanActionBar,
  PlanMarkdownPreview,
  type PlanViewMode,
} from "./plan-file";
import { PreviewPanel } from "./PreviewPanel";
import { PreviewDebugPanel } from "./preview-panel/PreviewDebugPanel";
import { ResizableHandle } from "../../../ui/ResizableHandle";
import { VersionBanner } from "./VersionBanner";
import { SegmentedControl, type SegmentedOption } from "./SegmentedControl";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { versionLabels } from "../../../../data/weblab2";
import type { FileItem } from "../../../../types/file";
import type { TutorRequestMode, TutorStartOptions } from "../../../../types/tutor";
import type { ViewMode, FileTabVariant } from "../../../../types/ui";
import type { WebLabPreviewConfig } from "./PreviewPanel";
import type {
  PreviewConsoleMessage,
  PreviewDebugEvent,
  PreviewDebugTab,
  PreviewNetworkRequest,
} from "./preview-panel/types";
import { hasWorkspaceProjectFiles } from "../webLab2FileTree";
import styles from "./Workspace.module.scss";

const DEFAULT_FILE_MANAGER_WIDTH = 158;
const MIN_FILE_MANAGER_WIDTH = 128;
const MAX_FILE_MANAGER_WIDTH = 320;
const MIN_EDITOR_WIDTH = 300;
const FILE_MANAGER_ANIMATION_MS = 220;
const MAX_CONSOLE_MESSAGES = 200;
const MAX_NETWORK_REQUESTS = 100;
const DEFAULT_DEBUG_PANEL_HEIGHT = 300;
const MIN_DEBUG_PANEL_HEIGHT = 180;
const MAX_DEBUG_PANEL_HEIGHT = 520;

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
  onUploadProjectFiles?: (files: FileList) => Promise<true | string | void> | true | string | void;
  projectUploadAccept?: string;
  onStartWithTutor?: (
    prompt?: string,
    requestMode?: TutorRequestMode,
    options?: TutorStartOptions,
  ) => void;
  onUploadStarterFiles?: (files: FileList) => Promise<true | string | void> | true | string | void;
  starterUploadAccept?: string;
  showNewProjectEmptyState?: boolean;
  preview: WebLabPreviewConfig;
  selectedHistoryVersion: string;
  selectedHistoryVersionLabel?: string;
  onReturnToCurrentVersion: () => void;
  aiChangedFiles?: Record<string, "new" | "modified" | "deleted">;
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
  fileTabVariant?: FileTabVariant;
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
  onUploadProjectFiles,
  projectUploadAccept,
  onStartWithTutor,
  onUploadStarterFiles,
  starterUploadAccept,
  showNewProjectEmptyState = true,
  preview,
  selectedHistoryVersion,
  selectedHistoryVersionLabel,
  onReturnToCurrentVersion,
  aiChangedFiles,
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
  fileTabVariant = "chip",
}: WorkspaceProps) {
  const [splitViewCodeWidth, setSplitViewCodeWidth] = useState<number | null>(
    null
  );
  const [fileManagerWidth, setFileManagerWidth] = useState(DEFAULT_FILE_MANAGER_WIDTH);
  const [fileManagerTransition, setFileManagerTransition] = useState<
    "collapsing" | "expanding" | null
  >(null);
  const [planViewMode, setPlanViewMode] = useState<PlanViewMode>("preview");
  const [isDebugPanelOpen, setIsDebugPanelOpen] = useState(false);
  const [debugTab, setDebugTab] = useState<PreviewDebugTab>("console");
  const [consoleMessages, setConsoleMessages] = useState<PreviewConsoleMessage[]>([]);
  const [networkRequests, setNetworkRequests] = useState<PreviewNetworkRequest[]>([]);
  const [selectedNetworkRequestId, setSelectedNetworkRequestId] = useState<string | null>(null);
  const [debugPanelHeight, setDebugPanelHeight] = useState(DEFAULT_DEBUG_PANEL_HEIGHT);
  const [isNetworkBlocked, setIsNetworkBlocked] = useState(false);
  const debugMessageSerialRef = useRef(0);
  const previewResetKey = preview.kind === "file" ? preview.srcDoc ?? "" : "";

  useEffect(() => {
    if (!fileManagerTransition) return;
    const timeoutId = window.setTimeout(() => {
      setFileManagerTransition(null);
    }, FILE_MANAGER_ANIMATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [fileManagerTransition]);

  const clearDebugOutput = () => {
    setConsoleMessages([]);
    setNetworkRequests([]);
    setSelectedNetworkRequestId(null);
  };

  useEffect(() => {
    clearDebugOutput();
  }, [previewResetKey]);

  useEffect(() => {
    const handlePreviewDebugMessage = (event: MessageEvent) => {
      const data = event.data as {
        type?: unknown;
        event?: PreviewDebugEvent;
      } | null;
      if (!data || data.type !== "weblab-preview:debug" || !data.event) return;

      const debugEvent = data.event;
      if (debugEvent.kind === "console") {
        debugMessageSerialRef.current += 1;
        setConsoleMessages((current) => [
          ...current,
          {
            id: `console-${debugMessageSerialRef.current}`,
            level: debugEvent.level,
            message: debugEvent.message,
            timestamp: debugEvent.timestamp,
          },
        ].slice(-MAX_CONSOLE_MESSAGES));
        return;
      }

      if (debugEvent.kind === "network-start") {
        const request: PreviewNetworkRequest = {
          id: debugEvent.id,
          method: debugEvent.method,
          url: debugEvent.url,
          requestTime: debugEvent.requestTime,
          status: "pending",
        };
        setNetworkRequests((current) => [
          request,
          ...current.filter((item) => item.id !== debugEvent.id),
        ].slice(0, MAX_NETWORK_REQUESTS));
        setSelectedNetworkRequestId(debugEvent.id);
        return;
      }

      if (debugEvent.kind === "network-complete") {
        setNetworkRequests((current) =>
          current.map((request) =>
            request.id === debugEvent.id
              ? {
                  ...request,
                  responseTime: debugEvent.responseTime,
                  status: debugEvent.ok ? "success" : "response-error",
                  statusCode: debugEvent.status,
                  statusText: debugEvent.statusText,
                  durationMs: debugEvent.durationMs,
                  responseBody: debugEvent.responseBody,
                }
              : request,
          ),
        );
        return;
      }

      if (debugEvent.kind === "network-error") {
        setNetworkRequests((current) =>
          current.map((request) =>
            request.id === debugEvent.id
              ? {
                  ...request,
                  responseTime: debugEvent.responseTime,
                  status: "request-error",
                  durationMs: debugEvent.durationMs,
                  error: debugEvent.error,
                }
              : request,
          ),
        );
      }
    };

    window.addEventListener("message", handlePreviewDebugMessage);
    return () => window.removeEventListener("message", handlePreviewDebugMessage);
  }, []);

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
  const isEmptyProject = !hasWorkspaceProjectFiles(fileStructure);
  const planFileNames = getPlanFileNames(fileStructure);
  const isPlanOpen = planFileNames.has(selectedFile?.name ?? "") &&
    openFiles.some((file) => file.name === selectedFile?.name);
  // A plan-only project is "empty" of buildable files but still has an artifact
  // to show. When that plan is open, surface the editor instead of the start
  // screen so the freshly generated plan is visible right away.
  const shouldShowNewProjectEmptyState =
    isEmptyProject && showNewProjectEmptyState && !isViewingHistoryVersion && !isPlanOpen;
  const hasPendingAiChanges = !!aiChangedFiles && Object.keys(aiChangedFiles).length > 0;
  const hasPreviewContent =
    openFiles.length > 0 ||
    preview.kind === "react" ||
    Boolean(preview.srcDoc) ||
    Boolean(preview.htmlFiles.length);
  const hasPreviewSurface = preview.kind === "react" || Boolean(preview.srcDoc);
  const hasDebugActivity = consoleMessages.length > 0 || networkRequests.length > 0;
  const resolvedShowPlanActionBar = showPlanActionBar && isPlanOpen;
  const editorOpenFiles = resolvedShowPlanActionBar
    ? openFiles
    : openFiles.filter((file) => !planFileNames.has(file.name));

  useEffect(() => {
    if (!hasPreviewSurface) {
      setIsDebugPanelOpen(false);
    }
  }, [hasPreviewSurface]);

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
      onUploadFiles={isViewingHistoryVersion ? undefined : onUploadProjectFiles}
      uploadAccept={projectUploadAccept}
      enableDragToTutor={isViewingHistoryVersion ? false : enableFileDragToTutor}
      aiChangedFiles={aiChangedFiles}
      builtPlanPaths={builtPlanPaths}
      showOnlyFilesWithContent={showOnlyFilesWithContent}
      showRightBorder={false}
      backpackSourceLab="weblab2"
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
      <>
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
            {!(isFileManagerCollapsed && fileTabVariant === "edge") ? (
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
            ) : null}

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
                fileTabVariant={fileTabVariant}
                onFileManagerExpand={
                  fileTabVariant === "edge" && isFileManagerCollapsed
                    ? () => handleFileManagerCollapseChange(false)
                    : undefined
                }
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
              hasContent={hasPreviewContent}
              preview={preview}
              isDebugPanelOpen={isDebugPanelOpen}
              hasDebugActivity={hasDebugActivity}
              isNetworkBlocked={isNetworkBlocked}
              onToggleDebugPanel={() => setIsDebugPanelOpen((current) => !current)}
              onPreviewSessionReset={clearDebugOutput}
            />
          </div>
        )}
      </div>
      {isDebugPanelOpen ? (
        <>
          <ResizableHandle
            orientation="horizontal"
            onResize={(delta) => {
              setDebugPanelHeight((current) =>
                Math.max(
                  MIN_DEBUG_PANEL_HEIGHT,
                  Math.min(MAX_DEBUG_PANEL_HEIGHT, current - delta),
                ),
              );
            }}
          />
          <PreviewDebugPanel
            activeTab={debugTab}
            consoleMessages={consoleMessages}
            height={debugPanelHeight}
            isNetworkBlocked={isNetworkBlocked}
            networkRequests={networkRequests}
            selectedNetworkRequestId={selectedNetworkRequestId}
            onClearAll={clearDebugOutput}
            onTabChange={setDebugTab}
            onToggleNetworkBlocked={() => setIsNetworkBlocked((current) => !current)}
            onSelectNetworkRequest={setSelectedNetworkRequestId}
            onClose={() => setIsDebugPanelOpen(false)}
          />
        </>
      ) : null}
      </>
      )}
    </div>
  );
}
