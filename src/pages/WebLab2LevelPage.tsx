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
import { webLab2LevelLinks } from "./levelTypeLinks";
import type { InstructionsDrawerVisualCue } from "../components/resource-panel/InstructionsDrawer";
import type { AiTutorInputExperiment } from "../components/resource-panel/views/AiTutorPanel";

interface WebLab2LevelPageProps {
  currentLevelPath?: string;
  instructionsDrawerInitialHeightRatio?: number;
  instructionsDrawerVisualCue?: InstructionsDrawerVisualCue;
  autoSeedTutorConversation?: boolean;
  aiTutorInputExperiment?: AiTutorInputExperiment;
}

export function WebLab2LevelPage({
  currentLevelPath = "/levels/weblab2",
  instructionsDrawerInitialHeightRatio,
  instructionsDrawerVisualCue = "none",
  autoSeedTutorConversation = false,
  aiTutorInputExperiment = "default",
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

  return (
    <>
      <Lab2Shell
        topNavigationProps={{
          title: "Web Lab 2: Intro Project",
          subtitle: "Saved a few seconds ago",
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
          instructionsDrawerInitialHeightRatio,
          instructionsDrawerVisualCue,
          autoSeedConversationOnMount: autoSeedTutorConversation,
          aiTutorInputExperiment,
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
          enableFileDragToTutor={aiTutorInputExperiment === "file-drop"}
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
