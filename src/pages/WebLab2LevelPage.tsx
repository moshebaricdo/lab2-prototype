import { Lab2Shell } from "../components/lab2/Lab2Shell";
import {
  Workspace,
  CreateFileModal,
} from "../components/ide/weblab2/views";
import {
  fileStructure,
  initialChatMessages,
} from "../data/weblab2";
import type { ChatAttachment, ChatMessage } from "../types/chat";
import { useChatState } from "../hooks/useChatState";
import { useFileWorkspaceState } from "../hooks/useFileWorkspaceState";
import { useLayoutState } from "../hooks/useLayoutState";
import { useVersionHistoryState } from "../hooks/useVersionHistoryState";
import { usePropsOverride } from "../hooks/usePropsOverride";
import type { DevPanelField } from "../components/lab2/dev";
import { webLab2LevelLinks } from "./levelTypeLinks";
import type { InstructionsDrawerVisualCue } from "../components/lab2/resource-panel/InstructionsDrawer";
import type { AiTutorInputExperiment } from "../components/lab2/resource-panel/views/AiTutorPanel";
import type { RubricData } from "../components/lab2/resource-panel/views/RubricPanel";

const webLab2DevFields: DevPanelField[] = [
  {
    key: "instructionsDrawerInitialHeightRatio",
    label: "Drawer height ratio",
    type: "slider",
    min: 0.2,
    max: 0.8,
    step: 0.05,
    group: "Layout",
  },
  {
    key: "instructionsDrawerVisualCue",
    label: "Instructions cue",
    type: "select",
    options: [
      { label: "None", value: "none" },
      { label: "Fade", value: "fade" },
      { label: "Inline link", value: "inline-link" },
    ],
    group: "Layout",
  },
  {
    key: "autoSeedTutorConversation",
    label: "Auto-seed tutor chat",
    type: "boolean",
    group: "Behavior",
  },
  {
    key: "aiTutorInputExperiment",
    label: "AI tutor input",
    type: "select",
    options: [
      { label: "Default", value: "default" },
      { label: "Clarified send", value: "clarified-send" },
      { label: "File drop", value: "file-drop" },
      { label: "File chip + add to project", value: "file-chip-action" },
      { label: "Tutor action card", value: "tutor-action-card" },
    ],
    group: "Behavior",
  },
  {
    key: "title",
    label: "Level title",
    type: "text",
    group: "Header",
  },
  {
    key: "subtitle",
    label: "Subtitle",
    type: "text",
    group: "Header",
  },
];

interface WebLab2LevelPageProps {
  currentLevelPath?: string;
  instructionsDrawerInitialHeightRatio?: number;
  instructionsDrawerVisualCue?: InstructionsDrawerVisualCue;
  autoSeedTutorConversation?: boolean;
  aiTutorInputExperiment?: AiTutorInputExperiment;
  showRubricTab?: boolean;
  rubricData?: RubricData | RubricData[];
  /** Override the default empty chat with a pre-seeded conversation. */
  initialMessages?: ChatMessage[];
  /** Pre-fill the chat input box with text. */
  initialChatInput?: string;
  /** Pre-attach files in the composer (shown as chips before sending). */
  initialAttachedFiles?: string[];
  /** Metadata for attached files (image src, timestamps). Keyed by file path. */
  attachmentMeta?: Record<string, ChatAttachment>;
  /** Custom file structure to replace the default mock data. */
  fileStructureOverride?: import("../types/file").FileItem[];
  /** Custom preview content rendered instead of the default mock website. */
  previewContent?: React.ReactNode;
  /** Hide the instructions drawer in the AI tutor panel. Default true. */
  showInstructionsDrawer?: boolean;
}

export function WebLab2LevelPage({
  currentLevelPath = "/levels/weblab2",
  instructionsDrawerInitialHeightRatio,
  instructionsDrawerVisualCue = "none",
  autoSeedTutorConversation = false,
  aiTutorInputExperiment = "default",
  showRubricTab = false,
  rubricData,
  initialMessages,
  initialChatInput,
  initialAttachedFiles,
  attachmentMeta,
  fileStructureOverride,
  previewContent,
  showInstructionsDrawer,
}: WebLab2LevelPageProps = {}) {
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
    addFileToProject,
  } = useFileWorkspaceState(fileStructureOverride ?? fileStructure);
  const { chatMessages, setChatMessages, chatInput, setChatInput } =
    useChatState(initialMessages ?? initialChatMessages, initialChatInput);
  const {
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
  } = useVersionHistoryState();

  const defaults = {
    instructionsDrawerInitialHeightRatio:
      instructionsDrawerInitialHeightRatio ?? 0.5,
    instructionsDrawerVisualCue,
    autoSeedTutorConversation,
    aiTutorInputExperiment,
    title: "Web Lab 2: Intro Project",
    subtitle: "Saved a few seconds ago",
  };

  const overrideResult = usePropsOverride(defaults);
  const resolved = overrideResult.props;

  const resolvedVisualCue = resolved.instructionsDrawerVisualCue as InstructionsDrawerVisualCue;
  const resolvedAiExperiment = resolved.aiTutorInputExperiment as AiTutorInputExperiment;

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
          onSaveVersion: handleSaveVersion,
          onRestoreVersion: handleRestoreVersion,
          showRestoreSuccessAlert,
          setShowRestoreSuccessAlert,
          showSaveSuccessAlert,
          setShowSaveSuccessAlert,
          instructionsDrawerInitialHeightRatio:
            resolved.instructionsDrawerInitialHeightRatio as number,
          instructionsDrawerVisualCue: resolvedVisualCue,
          autoSeedConversationOnMount:
            resolved.autoSeedTutorConversation as boolean,
          aiTutorInputExperiment: resolvedAiExperiment,
          initialAttachedFiles,
          attachmentMeta,
          onAddFileToProject: addFileToProject,
          showInstructionsDrawer,
          showRubricTab,
          rubricData,
          devPanelFields: webLab2DevFields,
          devPanelOverrideResult: overrideResult,
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
          fileStructure={fileStructureState ?? fileStructure}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          openFiles={openFiles}
          openFolders={openFolders}
          toggleFolder={toggleFolder}
          openFile={openFile}
          closeFile={closeFile}
          handleReorderFiles={handleReorderFiles}
          isFileManagerCollapsed={isFileManagerCollapsed}
          setIsFileManagerCollapsed={setIsFileManagerCollapsed}
          setIsCreateFileModalOpen={setIsCreateFileModalOpen}
          enableFileDragToTutor={resolvedAiExperiment === "file-drop"}
          previewContent={previewContent}
          selectedHistoryVersion={selectedHistoryVersion}
          showSavedTag={showSavedTag}
          onReturnToCurrentVersion={handleReturnToCurrentVersion}
        />
      </Lab2Shell>

      <CreateFileModal
        isOpen={isCreateFileModalOpen}
        onClose={() => setIsCreateFileModalOpen(false)}
        onCreate={handleCreateFile}
      />
    </>
  );
}
