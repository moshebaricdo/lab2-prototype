import { useEffect } from "react";
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
  useShareAwareNavigate,
  type ShareModeConfig,
} from "../../hooks/useLevelShareMode";
import { PortfolioInstructions } from "../../components/lab2/resource-panel/ProgressionInstructions";
import {
  sampleProgressionLinks,
  PROGRESSION_BRANCH_PATHS,
} from "../levelTypeLinks";

const indexHtmlFile = fileStructure[0]?.children?.find(
  (f) => f.name === "index.html",
);

interface ProgressionBranchWebLabPageProps {
  title: string;
  currentLevelPath: string;
}

export function ProgressionBranchWebLabPage({
  title,
  currentLevelPath,
}: ProgressionBranchWebLabPageProps) {
  const navigate = useShareAwareNavigate();
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
    setViewMode("preview");
  }, []);

  const completedPaths = [
    "/levels/progression-weblab",
    "/levels/progression-free-response",
    "/levels/progression-bubble-choice",
    ...PROGRESSION_BRANCH_PATHS.filter((p) => p !== currentLevelPath),
  ];

  return (
    <>
      <Lab2Shell
        shareModeConfig={shareModeConfig}
        topNavigationProps={{
          title,
          subtitle: "Saved a few seconds ago",
          currentLevel: 4,
          totalLevels: 5,
          levelLinks: sampleProgressionLinks,
          currentLevelPath,
          completedLevelPaths: completedPaths,
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
          onContinue: () => navigate("/levels/progression-levelgroup"),
          continueLabel: "Continue to checkpoint",
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

export function ProgressionBranchColorPage() {
  return (
    <ProgressionBranchWebLabPage
      title="Intro to HTML & CSS: Color & Typography"
      currentLevelPath="/levels/progression-branch-color"
    />
  );
}

export function ProgressionBranchLayoutPage() {
  return (
    <ProgressionBranchWebLabPage
      title="Intro to HTML & CSS: Layout & Flexbox"
      currentLevelPath="/levels/progression-branch-layout"
    />
  );
}

export function ProgressionBranchMediaPage() {
  return (
    <ProgressionBranchWebLabPage
      title="Intro to HTML & CSS: Images & Accessibility"
      currentLevelPath="/levels/progression-branch-media"
    />
  );
}
