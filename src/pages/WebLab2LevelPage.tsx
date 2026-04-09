import { Lab2Shell } from "../components/lab2/Lab2Shell";
import {
  Workspace,
  CreateFileModal,
} from "../components/weblab2/views";
import {
  fileStructure,
  initialChatMessages,
} from "../data/weblab2";
import { useChatState } from "../hooks/useChatState";
import { useFileWorkspaceState } from "../hooks/useFileWorkspaceState";
import { useLayoutState } from "../hooks/useLayoutState";
import { useVersionHistoryState } from "../hooks/useVersionHistoryState";
import { usePropsOverride } from "../hooks/usePropsOverride";
import type { DevPanelField } from "../components/dev";
import { webLab2LevelLinks } from "./levelTypeLinks";
import type { InstructionsDrawerVisualCue } from "../components/resource-panel/InstructionsDrawer";
import type { AiTutorInputExperiment } from "../components/resource-panel/views/AiTutorPanel";
import type { RubricData } from "../components/resource-panel/views/RubricPanel";

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
}

export function WebLab2LevelPage({
  currentLevelPath = "/levels/weblab2",
  instructionsDrawerInitialHeightRatio,
  instructionsDrawerVisualCue = "none",
  autoSeedTutorConversation = false,
  aiTutorInputExperiment = "default",
  showRubricTab = false,
  rubricData,
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
  } = useFileWorkspaceState();
  const { chatMessages, setChatMessages, chatInput, setChatInput } =
    useChatState(initialChatMessages);
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
          fileStructure={fileStructure}
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
