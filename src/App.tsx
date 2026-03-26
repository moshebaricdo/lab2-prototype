import { TopNavigation } from "./components/ui/header/TopNavigation";
import { Sidebar } from "./components/resource-panel";
import {
  Workspace,
  CreateFileModal,
  ResizableHandle,
} from "./components/weblab2/views";
import { fileStructure, initialChatMessages } from "./data/weblab2";
import { useFileWorkspaceState } from "./hooks/useFileWorkspaceState";
import { useChatState } from "./hooks/useChatState";
import { useVersionHistoryState } from "./hooks/useVersionHistoryState";
import { useLayoutState } from "./hooks/useLayoutState";

export default function App() {
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
    <div className="flex flex-col h-screen bg-background">
      {/* Top Navigation */}
      <TopNavigation />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sidebarWidth={sidebarWidth}
          isSettingsOpen={isSettingsOpen}
          setIsSettingsOpen={setIsSettingsOpen}
          chatMessages={chatMessages}
          setChatMessages={setChatMessages}
          chatInput={chatInput}
          setChatInput={setChatInput}
          selectedHistoryVersion={selectedHistoryVersion}
          setSelectedHistoryVersion={setSelectedHistoryVersion}
          onSaveVersion={handleSaveVersion}
          onRestoreVersion={handleRestoreVersion}
          showRestoreSuccessAlert={showRestoreSuccessAlert}
          setShowRestoreSuccessAlert={setShowRestoreSuccessAlert}
          showSaveSuccessAlert={showSaveSuccessAlert}
          setShowSaveSuccessAlert={setShowSaveSuccessAlert}
        />

        {/* Sidebar Resize Handle */}
        <ResizableHandle
          onResize={(delta) => {
            setSidebarWidth((prev) =>
              Math.max(300, Math.min(600, prev + delta))
            );
          }}
        />

        {/* Main Workspace */}
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
          selectedHistoryVersion={selectedHistoryVersion}
          showSavedTag={showSavedTag}
          onReturnToCurrentVersion={handleReturnToCurrentVersion}
        />
      </div>

      {/* Create File Modal */}
      <CreateFileModal
        isOpen={isCreateFileModalOpen}
        onClose={() => setIsCreateFileModalOpen(false)}
        onCreate={handleCreateFile}
      />
    </div>
  );
}