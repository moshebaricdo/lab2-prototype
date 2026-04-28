import { useCallback, useEffect, useMemo, useState } from "react";
import { Lab2Shell } from "../components/lab2/Lab2Shell";
import {
  Workspace,
  CreateFileModal,
  NameInputModal,
} from "../components/ide/weblab2/views";
import {
  DefaultProjectPreview,
  fileStructure,
  initialChatMessages,
  defaultMockTutorConfig,
} from "../data/weblab2";
import type { ChatMessage } from "../types/chat";
import { useChatState } from "../hooks/useChatState";
import { useFileWorkspaceState } from "../hooks/useFileWorkspaceState";
import { useLayoutState } from "../hooks/useLayoutState";
import { useVersionHistoryState } from "../hooks/useVersionHistoryState";
import { useTutorPromptSettings } from "../hooks/useTutorPromptSettings";
import {
  buildPreviewSrcDoc,
  getPreviewHtmlFiles,
} from "../components/ide/weblab2/views/buildPreviewSrcDoc";
import { usePropsOverride } from "../hooks/usePropsOverride";
import type { DevPanelField } from "../components/lab2/dev";
import { globalEditorDevFields } from "../components/lab2/dev";
import {
  EDITOR_READ_ONLY_STORAGE_KEY,
  setEditorReadOnlyOverride,
  useEditorReadOnlyOverride,
} from "../hooks/useEditorReadOnly";
import { webLab2LevelLinks } from "./levelTypeLinks";
import type { InstructionsDrawerVisualCue } from "../components/lab2/resource-panel/InstructionsDrawer";
import { MarkdownInstructions } from "../components/lab2/resource-panel/MarkdownInstructions";
import type { RubricData } from "../components/lab2/resource-panel/views/RubricPanel";
import { tutorClient } from "../lib/tutor/tutorClient";
import type { FileItem } from "../types/file";
import type { AiTutorInputExperiment, MockTutorConfig, TutorContextFile, TutorMode } from "../types/tutor";
import type { WebLabPreviewConfig } from "../components/ide/weblab2/views/PreviewPanel";

const INSTRUCTIONS_MARKDOWN_DEV_KEY = "instructionsMarkdown";

function getInstructionsMarkdownStorageKey(currentLevelPath: string) {
  return `weblab2:instructions-markdown:${currentLevelPath}`;
}

function readSessionInstructionsMarkdown(storageKey: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return window.sessionStorage.getItem(storageKey) ?? fallback;
}

function writeSessionInstructionsMarkdown(storageKey: string, value: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(storageKey, value);
}

const webLab2ChromeDevFields: DevPanelField[] = [
  {
    key: "title",
    label: "Level title",
    description: "Primary text in the top navigation.",
    type: "text",
    group: "Level chrome",
  },
  {
    key: "subtitle",
    label: "Subtitle",
    description: "Small status text under the level title.",
    type: "text",
    group: "Level chrome",
  },
  {
    key: "continueButtonPlacement",
    label: "Continue button",
    description: "Move the Continue action between the header and sidebar footer.",
    type: "select",
    options: [
      { label: "Sidebar", value: "sidebar" },
      { label: "Header", value: "header" },
    ],
    group: "Level chrome",
  },
];

const webLab2ResourcePanelDevFields: DevPanelField[] = [
  {
    key: "showInstructionsDrawer",
    label: "Show instructions drawer",
    description: "Toggle the collapsible instructions affordance in AI Tutor.",
    type: "boolean",
    group: "Resource panel",
  },
  {
    key: INSTRUCTIONS_MARKDOWN_DEV_KEY,
    label: "Instructions markdown",
    description: "Session-only markdown rendered inside the instructions drawer.",
    type: "textarea",
    rows: 8,
    group: "Resource panel",
    storage: "session",
    visibleWhen: (values) => Boolean(values.showInstructionsDrawer),
  },
  {
    key: "instructionsDrawerInitialHeightRatio",
    label: "Drawer height ratio",
    description: "Starting height for the AI Tutor instructions drawer.",
    type: "slider",
    min: 0.2,
    max: 0.8,
    step: 0.05,
    group: "Resource panel",
  },
];

const webLab2TutorDevFields: DevPanelField[] = [
  {
    key: "tutorModeKind",
    label: "AI tutor mode",
    description: "Switch between scripted mock responses and the functional tutor harness.",
    type: "select",
    options: [
      { label: "Mock", value: "mock" },
      { label: "Functional", value: "functional" },
    ],
    group: "AI Tutor",
  },
  {
    key: "aiTutorInputExperiment",
    label: "Input experiment",
    description: "Try alternate composer and generated-code handoff flows.",
    type: "select",
    options: [
      { label: "Default", value: "default" },
      { label: "Clarified send", value: "clarified-send" },
      { label: "File drop", value: "file-drop" },
      { label: "File chip + add to project", value: "file-chip-action" },
      { label: "Tutor action card", value: "tutor-action-card" },
    ],
    group: "AI Tutor",
  },
  {
    key: "autoSeedTutorConversation",
    label: "Auto-seed tutor chat",
    description: "Start the mock tutor with its configured conversation seed.",
    type: "boolean",
    group: "AI Tutor",
  },
  {
    key: "additionalTutorPrompt",
    label: "Additional system prompt",
    description: "Session-only prompt addendum for functional tutor calls.",
    type: "textarea",
    rows: 6,
    group: "AI Tutor",
    storage: "session",
  },
];

const webLab2WorkspaceDevFields: DevPanelField[] = [
  {
    key: "useFilePreview",
    label: "Use file preview",
    description: "Render the preview iframe from the current project files.",
    type: "boolean",
    group: "Workspace",
  },
];

const webLab2DevFields: DevPanelField[] = [
  ...webLab2ChromeDevFields,
  ...webLab2ResourcePanelDevFields,
  ...webLab2TutorDevFields,
  ...webLab2WorkspaceDevFields,
  ...globalEditorDevFields,
];

function flattenTutorContextFiles(files: FileItem[], parentPath = ""): TutorContextFile[] {
  return files.flatMap((item) => {
    const path = parentPath ? `${parentPath}/${item.name}` : item.name;
    if (item.children) {
      return flattenTutorContextFiles(item.children, path);
    }
    if (item.proposedStatus === "deleted") return [];
    if (item.type === "image") return [];
    return [{
      fileName: item.name,
      path,
      type: item.type,
      content: item.proposedStatus ? item.proposedContent ?? "" : item.content ?? "",
    }];
  });
}

function findFileByNameInTree(tree: FileItem[], name: string): FileItem | null {
  for (const item of tree) {
    if (item.name === name && item.type !== "folder") return item;
    if (item.children) {
      const found = findFileByNameInTree(item.children, name);
      if (found) return found;
    }
  }
  return null;
}

function mapFilesToTree(files: FileItem[], tree: FileItem[]) {
  return files.map((file) => findFileByNameInTree(tree, file.name) ?? file);
}

interface WebLab2LevelPageProps {
  currentLevelPath?: string;
  instructionsDrawerInitialHeightRatio?: number;
  instructionsDrawerVisualCue?: InstructionsDrawerVisualCue;
  autoSeedTutorConversation?: boolean;
  aiTutorInputExperiment?: AiTutorInputExperiment;
  showRubricTab?: boolean;
  rubricData?: RubricData | RubricData[];
  tutorMode?: TutorMode;
  /** Custom file structure to replace the default mock data. */
  fileStructureOverride?: import("../types/file").FileItem[];
  /** Custom preview content rendered instead of the default mock website. */
  previewContent?: React.ReactNode | ((aiActive: boolean) => React.ReactNode);
  /** Hide the instructions drawer in the AI tutor panel. Default true. */
  showInstructionsDrawer?: boolean;
  /** Optional markdown content to pre-seed the instructions drawer editor. */
  instructionsMarkdown?: string;
  /** Where to render the Continue button: "sidebar" (bottom bar) or "header" (next to bubbles). */
  continueButtonPlacement?: "sidebar" | "header";
  /** When true, render preview from project file contents instead of custom React previewContent. */
  useFilePreview?: boolean;
  /** When true, hide placeholder file-manager entries with no starter/proposed content. */
  showOnlyFilesWithContent?: boolean;
}

export function WebLab2LevelPage({
  currentLevelPath = "/levels/weblab2",
  instructionsDrawerInitialHeightRatio,
  instructionsDrawerVisualCue = "none",
  autoSeedTutorConversation = false,
  aiTutorInputExperiment = "default",
  showRubricTab = false,
  rubricData,
  tutorMode,
  fileStructureOverride,
  previewContent,
  showInstructionsDrawer,
  instructionsMarkdown = "",
  continueButtonPlacement = "sidebar",
  useFilePreview = false,
  showOnlyFilesWithContent = false,
}: WebLab2LevelPageProps = {}) {
  const routeTutorMode: TutorMode =
    tutorMode ?? { kind: "mock", config: defaultMockTutorConfig };
  const initialMockTutorConfig =
    routeTutorMode.kind === "mock" ? routeTutorMode.config : undefined;
  const {
    activeTab,
    setActiveTab,
    isSettingsOpen,
    setIsSettingsOpen,
    sidebarWidth,
    setSidebarWidth,
  } = useLayoutState();
  const {
    fileStructureState,
    openFolders,
    selectedFile,
    openFiles,
    viewMode,
    isFileManagerCollapsed,
    isCreateFileModalOpen,
    setSelectedFile,
    setViewMode,
    setIsFileManagerCollapsed,
    setIsCreateFileModalOpen,
    toggleFolder,
    openFile,
    closeFile,
    handleReorderFiles,
    handleCreateFile,
    handleCreateFolder,
    addFileToProject,
    renameFile,
    deleteFile,
    moveFileTreeItem,
    updateFileContent,
    replaceFileStructure,
    beginAiProposal,
    acceptAiProposal,
    rejectAiProposal,
  } = useFileWorkspaceState(
    fileStructureOverride ?? fileStructure,
    { storageKey: `weblab2:file-structure:${currentLevelPath}` },
  );
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [previewPath, setPreviewPath] = useState("index.html");
  const [renameTarget, setRenameTarget] = useState<{
    file: FileItem;
    path: string;
  } | null>(null);
  const { chatMessages, setChatMessages, chatInput, setChatInput } =
    useChatState(
      initialMockTutorConfig?.initialMessages ?? initialChatMessages,
      initialMockTutorConfig?.initialInput,
    );
  const getCurrentFileStructure = useCallback(
    () => fileStructureState ?? fileStructureOverride ?? fileStructure,
    [fileStructureOverride, fileStructureState],
  );
  const defaults = {
    instructionsDrawerInitialHeightRatio:
      instructionsDrawerInitialHeightRatio ?? 0.6,
    showInstructionsDrawer: showInstructionsDrawer ?? true,
    instructionsDrawerVisualCue,
    autoSeedTutorConversation,
    aiTutorInputExperiment,
    tutorModeKind: routeTutorMode.kind,
    continueButtonPlacement,
    useFilePreview,
    title: "Web Lab 2: Intro Project",
    subtitle: "Saved a few seconds ago",
  };

  const overrideResult = usePropsOverride(defaults);
  const resolved = overrideResult.props;
  const instructionsMarkdownStorageKey =
    getInstructionsMarkdownStorageKey(currentLevelPath);
  const [sessionInstructionsMarkdown, setSessionInstructionsMarkdown] = useState(
    () => readSessionInstructionsMarkdown(
      instructionsMarkdownStorageKey,
      instructionsMarkdown,
    ),
  );
  useEffect(() => {
    setSessionInstructionsMarkdown(
      readSessionInstructionsMarkdown(
        instructionsMarkdownStorageKey,
        instructionsMarkdown,
      ),
    );
  }, [instructionsMarkdown, instructionsMarkdownStorageKey]);
  const resolvedTutorModeKind =
    resolved.tutorModeKind === "functional" ? "functional" : "mock";
  const {
    versions: historyVersions,
    selectedHistoryFileStructure,
    selectedHistoryVersionLabel,
    selectedHistoryVersion,
    setSelectedHistoryVersion,
    showSavedTag,
    showRestoreSuccessAlert,
    setShowRestoreSuccessAlert,
    showSaveSuccessAlert,
    setShowSaveSuccessAlert,
    handleSaveVersion,
    handleSaveAiVersion,
    handleRestoreVersion,
    handleReturnToCurrentVersion,
  } = useVersionHistoryState(
    resolvedTutorModeKind === "functional"
      ? {
          getFileStructure: getCurrentFileStructure,
          onRestoreFileStructure: replaceFileStructure,
          storageKey: `weblab2:version-history:${currentLevelPath}`,
        }
      : undefined,
  );
  const {
    additionalTutorPrompt,
    setAdditionalTutorPrompt,
    resetAdditionalTutorPrompt,
  } = useTutorPromptSettings();

  const aiChangedFiles = useMemo(() => {
    const pending = chatMessages.find(
      (m) => m.codeChangeStatus === "pending" && m.fileChanges,
    );
    if (!pending?.fileChanges) return undefined;
    const map: Record<string, "new" | "modified" | "deleted"> = {};
    for (const fc of pending.fileChanges) {
      map[fc.fileName] = fc.status;
    }
    return map;
  }, [chatMessages]);

  const hasAcceptedChanges = chatMessages.some(
    (m) => m.codeChangeStatus === "accepted" && m.fileChanges,
  );
  const hasPendingAiChanges = !!aiChangedFiles && Object.keys(aiChangedFiles).length > 0;
  const isAiActive = hasPendingAiChanges || hasAcceptedChanges;
  const currentFileStructure = fileStructureState ?? fileStructureOverride ?? fileStructure;
  const isViewingHistoryVersion =
    selectedHistoryVersion !== "current" && Boolean(selectedHistoryFileStructure);
  const visibleFileStructure = isViewingHistoryVersion && selectedHistoryFileStructure
    ? selectedHistoryFileStructure
    : currentFileStructure;
  const visibleSelectedFile = selectedFile
    ? findFileByNameInTree(visibleFileStructure, selectedFile.name) ?? selectedFile
    : selectedFile;
  const visibleOpenFiles = mapFilesToTree(openFiles, visibleFileStructure);
  const visibleHasPendingAiChanges = isViewingHistoryVersion ? false : hasPendingAiChanges;
  const resolvedPreviewContent = typeof previewContent === "function"
    ? previewContent(isAiActive)
    : previewContent ?? <DefaultProjectPreview />;
  const previewHtmlFiles = useMemo(
    () => getPreviewHtmlFiles(visibleFileStructure, visibleHasPendingAiChanges),
    [visibleFileStructure, visibleHasPendingAiChanges],
  );
  useEffect(() => {
    if (!resolved.useFilePreview || previewHtmlFiles.length === 0) return;
    if (previewHtmlFiles.some((file) => file.path === previewPath)) return;

    const fallbackFile =
      previewHtmlFiles.find((file) => file.path === "index.html") ?? previewHtmlFiles[0];
    setPreviewPath(fallbackFile.path);
  }, [previewHtmlFiles, previewPath, resolved.useFilePreview]);
  const previewSrcDoc = resolved.useFilePreview
    ? buildPreviewSrcDoc(
        visibleFileStructure,
        visibleHasPendingAiChanges,
        previewPath,
      )
    : undefined;
  const previewConfig: WebLabPreviewConfig = resolved.useFilePreview
    ? {
        kind: "file",
        srcDoc: previewSrcDoc,
        path: previewPath,
        htmlFiles: previewHtmlFiles,
        onPathChange: setPreviewPath,
      }
    : {
        kind: "react",
        content: resolvedPreviewContent,
      };
  const availableTutorContextFiles = useMemo(
    () => flattenTutorContextFiles(currentFileStructure),
    [currentFileStructure],
  );

  const handleTutorSubmit = useCallback(async (
    message: string,
    conversation: ChatMessage[],
  ) => {
    const result = await tutorClient({
      message,
      conversation,
      files: fileStructureState ?? fileStructureOverride ?? fileStructure,
      additionalSystemPrompt: additionalTutorPrompt,
    });

    if (result.changes.length > 0) {
      beginAiProposal(result.changes);
    }

    return {
      role: "assistant",
      content: result.message,
      fileChanges: result.changes.length > 0
        ? result.changes.map(({ fileName, status, linesAdded, linesRemoved }) => ({
            fileName,
            status,
            linesAdded,
            linesRemoved,
          }))
        : undefined,
      codeChangeStatus: result.changes.length > 0 ? "pending" : undefined,
    } satisfies ChatMessage;
  }, [additionalTutorPrompt, beginAiProposal, fileStructureOverride, fileStructureState]);

  const handleAcceptAiChanges = useCallback(() => {
    const acceptedFileStructure = acceptAiProposal();
    handleSaveAiVersion(acceptedFileStructure);
  }, [acceptAiProposal, handleSaveAiVersion]);

  const handleAddFileToTutor = useCallback((file: FileItem, path: string) => {
    setActiveTab("ai-tutor");
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("weblab:add-project-file-to-tutor", {
        detail: {
          name: file.name,
          path,
        },
      }));
    }, 0);
  }, [setActiveTab]);

  const editorReadOnlyOverride = useEditorReadOnlyOverride();

  const resolvedVisualCue = resolved.instructionsDrawerVisualCue as InstructionsDrawerVisualCue;
  const resolvedAiExperiment = resolved.aiTutorInputExperiment as AiTutorInputExperiment;
  const resolvedInstructionsContent = sessionInstructionsMarkdown.trim()
    ? <MarkdownInstructions markdown={sessionInstructionsMarkdown} />
    : undefined;
  const continueInHeader = resolved.continueButtonPlacement === "header";
  const resolvedMockTutorConfig: MockTutorConfig | undefined =
    resolvedTutorModeKind === "mock"
      ? {
          ...defaultMockTutorConfig,
          ...(routeTutorMode.kind === "mock" ? routeTutorMode.config : undefined),
          seedOnMount:
            Boolean(resolved.autoSeedTutorConversation) ||
            Boolean(routeTutorMode.kind === "mock" && routeTutorMode.config?.seedOnMount),
        }
      : undefined;

  return (
    <>
      <Lab2Shell
        topNavigationProps={{
          title: resolved.title as string,
          subtitle: resolved.subtitle as string,
          currentLevel: 9,
          totalLevels: 10,
          completedLevels: [1, 2, 3],
          levelLinks: webLab2LevelLinks,
          currentLevelPath,
          showContinueButton: continueInHeader,
        }}
        sidebarProps={{
          activeTab,
          setActiveTab,
          sidebarWidth,
          isSettingsOpen,
          setIsSettingsOpen,
          chatMessages,
          setChatMessages,
          chatInput,
          setChatInput,
          selectedHistoryVersion,
          setSelectedHistoryVersion,
          historyVersions,
          onSaveVersion: handleSaveVersion,
          onRestoreVersion: handleRestoreVersion,
          showRestoreSuccessAlert,
          setShowRestoreSuccessAlert,
          showSaveSuccessAlert,
          setShowSaveSuccessAlert,
          instructionsDrawerInitialHeightRatio:
            resolved.instructionsDrawerInitialHeightRatio as number,
          showInstructionsDrawer: Boolean(resolved.showInstructionsDrawer),
          instructionsDrawerVisualCue: resolvedVisualCue,
          instructionsContent: resolvedInstructionsContent,
          aiTutorInputExperiment: resolvedAiExperiment,
          mockTutorConfig: resolvedMockTutorConfig,
          onAddFileToProject: addFileToProject,
          availableTutorContextFiles,
          onTutorSubmit: resolvedTutorModeKind === "functional" ? handleTutorSubmit : undefined,
          onAcceptAiChanges: resolvedTutorModeKind === "functional" ? handleAcceptAiChanges : undefined,
          onRejectAiChanges: resolvedTutorModeKind === "functional" ? rejectAiProposal : undefined,
          showRubricTab,
          rubricData,
          showContinueButton: !continueInHeader,
          devPanelFields: webLab2DevFields,
          devPanelOverrideResult: overrideResult,
          devPanelSessionValues: {
            additionalTutorPrompt,
            [INSTRUCTIONS_MARKDOWN_DEV_KEY]: sessionInstructionsMarkdown,
            [EDITOR_READ_ONLY_STORAGE_KEY]: editorReadOnlyOverride,
          },
          onDevPanelSessionValueChange: (key, value) => {
            if (key === "additionalTutorPrompt") {
              setAdditionalTutorPrompt(String(value ?? ""));
            } else if (key === INSTRUCTIONS_MARKDOWN_DEV_KEY) {
              const nextValue = String(value ?? "");
              setSessionInstructionsMarkdown(nextValue);
              writeSessionInstructionsMarkdown(
                instructionsMarkdownStorageKey,
                nextValue,
              );
            } else if (key === EDITOR_READ_ONLY_STORAGE_KEY) {
              setEditorReadOnlyOverride(Boolean(value));
            }
          },
          onDevPanelSessionValueReset: (key) => {
            if (key === "additionalTutorPrompt") {
              resetAdditionalTutorPrompt();
            } else if (key === INSTRUCTIONS_MARKDOWN_DEV_KEY) {
              setSessionInstructionsMarkdown(instructionsMarkdown);
              if (typeof window !== "undefined") {
                window.sessionStorage.removeItem(instructionsMarkdownStorageKey);
              }
            } else if (key === EDITOR_READ_ONLY_STORAGE_KEY) {
              setEditorReadOnlyOverride(false);
            }
          },
        }}
        onResize={(delta) => {
          setSidebarWidth((prev) =>
            Math.max(300, Math.min(600, prev + delta))
          );
        }}
      >
        <Workspace
          viewMode={viewMode}
          setViewMode={setViewMode}
          fileStructure={visibleFileStructure}
          selectedFile={visibleSelectedFile}
          setSelectedFile={setSelectedFile}
          openFiles={visibleOpenFiles}
          openFolders={openFolders}
          toggleFolder={toggleFolder}
          openFile={openFile}
          closeFile={closeFile}
          handleReorderFiles={handleReorderFiles}
          isFileManagerCollapsed={isFileManagerCollapsed}
          setIsFileManagerCollapsed={setIsFileManagerCollapsed}
          setIsCreateFileModalOpen={setIsCreateFileModalOpen}
          setIsCreateFolderModalOpen={setIsCreateFolderModalOpen}
          enableFileDragToTutor
          showOnlyFilesWithContent={showOnlyFilesWithContent}
          onRequestRenameFile={(file, path) => setRenameTarget({ file, path })}
          onAddFileToTutor={handleAddFileToTutor}
          onDeleteFile={(_file, path) => {
            deleteFile(path);
          }}
          onMoveFileTreeItem={moveFileTreeItem}
          preview={previewConfig}
          selectedHistoryVersion={selectedHistoryVersion}
          selectedHistoryVersionLabel={selectedHistoryVersionLabel}
          showSavedTag={showSavedTag}
          onReturnToCurrentVersion={handleReturnToCurrentVersion}
          aiChangedFiles={isViewingHistoryVersion ? undefined : aiChangedFiles}
          onFileContentChange={isViewingHistoryVersion ? undefined : updateFileContent}
        />
      </Lab2Shell>

      <CreateFileModal
        isOpen={isCreateFileModalOpen}
        onClose={() => setIsCreateFileModalOpen(false)}
        onCreate={handleCreateFile}
      />
      <NameInputModal
        isOpen={isCreateFolderModalOpen}
        title="Create a new folder"
        description="Give your new folder a name."
        fieldLabel="Folder name"
        placeholder="Enter folder name"
        confirmLabel="Create folder"
        onClose={() => setIsCreateFolderModalOpen(false)}
        onSubmit={handleCreateFolder}
      />
      <NameInputModal
        isOpen={renameTarget !== null}
        title="Rename file"
        description="Choose a new name for this file."
        fieldLabel="File name"
        placeholder="Enter file name"
        confirmLabel="Rename file"
        initialValue={renameTarget?.file.name}
        onClose={() => setRenameTarget(null)}
        onSubmit={(value) => {
          if (!renameTarget) return "No file selected.";
          return renameFile(renameTarget.path, value);
        }}
      />
    </>
  );
}
