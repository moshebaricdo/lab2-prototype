import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lab2Shell } from "../../components/lab2/Lab2Shell";
import {
  Workspace,
  CreateFileModal,
} from "../../components/ide/weblab2/views";
import {
  DefaultProjectPreview,
  fileStructure,
  initialChatMessages,
} from "../../data/weblab2";
import { useChatState } from "../../hooks/useChatState";
import { useFileWorkspaceState } from "../../hooks/useFileWorkspaceState";
import { useLayoutState } from "../../hooks/useLayoutState";
import { useVersionHistoryState } from "../../hooks/useVersionHistoryState";
import {
  useLevelShareMode,
  type ShareModeConfig,
} from "../../hooks/useLevelShareMode";
import { PortfolioInstructions } from "../../components/lab2/resource-panel/ProgressionInstructions";
import { sampleProgressionLinks } from "../levelTypeLinks";

const indexHtmlFile = fileStructure[0]?.children?.find(
  (f) => f.name === "index.html",
);

export function ProgressionWebLabPage() {
  const navigate = useNavigate();
  const shareMode = useLevelShareMode();
  const shareModeConfig: ShareModeConfig = {
    mode: shareMode,
    flowCompletion:
      shareMode === "flow"
        ? {
            title: "Task complete",
            message: "Thanks, you have completed this shared task.",
            buttonLabel: "Close",
          }
        : undefined,
  };
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
    moveFileTreeItem,
  } = useFileWorkspaceState(fileStructure);
  const { chatMessages, setChatMessages, chatInput, setChatInput } =
    useChatState(initialChatMessages);
  const {
    selectedHistoryVersion,
    setSelectedHistoryVersion,
    showRestoreSuccessAlert,
    setShowRestoreSuccessAlert,
    showSaveSuccessAlert,
    setShowSaveSuccessAlert,
    handleSaveVersion,
    handleRestoreVersion,
    handleReturnToCurrentVersion,
  } = useVersionHistoryState();

  useEffect(() => {
    if (indexHtmlFile) openFile(indexHtmlFile);
  }, []);

  return (
    <>
      <Lab2Shell
        shareModeConfig={shareModeConfig}
        topNavigationProps={{
          title: "Intro to HTML & CSS: Build Your Portfolio",
          subtitle: "Saved a few seconds ago",
          currentLevel: 1,
          totalLevels: 4,
          levelLinks: sampleProgressionLinks,
          currentLevelPath: "/levels/progression-weblab",
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
          onContinue: () => navigate("/levels/progression-free-response"),
          continueLabel: "Continue to next level",
          instructionsContent: <PortfolioInstructions />,
          showStudentLessonResource: true,
          showDocumentationResource: true,
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
          onMoveFileTreeItem={moveFileTreeItem}
          preview={{ kind: "react", content: <DefaultProjectPreview /> }}
          selectedHistoryVersion={selectedHistoryVersion}
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
