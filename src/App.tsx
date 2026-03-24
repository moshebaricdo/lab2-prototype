import { useState } from "react";
import type { FileItem } from "./components/FileManager";
import { TopNavigation } from "./components/TopNavigation";
import { Sidebar, type SidebarTab } from "./components/Sidebar";
import { Workspace } from "./components/Workspace";
import { SettingsPanel } from "./components/SettingsPanel";
import { CreateFileModal } from "./components/CreateFileModal";
import { ResizableHandle } from "./components/ResizableHandle";
import { fileStructure, initialChatMessages } from "./data/mockData";

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<SidebarTab>("ai-tutor");
  
  // File Management State
  const [openFolders, setOpenFolders] = useState<Set<string>>(
    new Set(["My Project"])
  );
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [openFiles, setOpenFiles] = useState<FileItem[]>([]);

  // View Mode State
  const [viewMode, setViewMode] = useState<"code" | "preview" | "split">("code");
  const [isFileManagerCollapsed, setIsFileManagerCollapsed] = useState(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState(initialChatMessages);
  const [chatInput, setChatInput] = useState("");

  // Version History State
  const [selectedHistoryVersion, setSelectedHistoryVersion] = useState("current");

  // UI State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateFileModalOpen, setIsCreateFileModalOpen] = useState(false);
  const [showSavedTag, setShowSavedTag] = useState(false);
  const [showRestoreSuccessAlert, setShowRestoreSuccessAlert] = useState(false);
  const [showSaveSuccessAlert, setShowSaveSuccessAlert] = useState(false);

  // Resizing State
  const [sidebarWidth, setSidebarWidth] = useState(400); // 56px tabs + 344px content

  // File Management Handlers
  const toggleFolder = (folderPath: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  };

  const openFile = (file: FileItem) => {
    setSelectedFile(file);
    if (!openFiles.find((f) => f.name === file.name)) {
      setOpenFiles([...openFiles, file]);
    }
  };

  const closeFile = (file: FileItem) => {
    const remainingFiles = openFiles.filter((f) => f.name !== file.name);
    setOpenFiles(remainingFiles);
    if (selectedFile?.name === file.name) {
      setSelectedFile(remainingFiles.length > 0 ? remainingFiles[0] : null);
    }
  };

  const handleReorderFiles = (reorderedFiles: FileItem[]) => {
    setOpenFiles(reorderedFiles);
  };

  const handleCreateFile = (fileName: string, fileType: string) => {
    // Create a new file item
    const newFile: FileItem = {
      name: fileName,
      type: fileType.toLowerCase() as any,
      content: "",
    };

    // Add it to open files and select it
    setOpenFiles([...openFiles, newFile]);
    setSelectedFile(newFile);

    // TODO: In a real implementation, this would also add the file to the file structure
    console.log("Created file:", fileName, "of type:", fileType);
  };

  const handleSaveVersion = (description: string) => {
    // Show the saved tag
    setShowSavedTag(true);

    // Hide the saved tag after 2.5 seconds
    setTimeout(() => {
      setShowSavedTag(false);
    }, 2500);

    // Show the save success alert
    setShowSaveSuccessAlert(true);

    // Hide the save success alert after 2.5 seconds
    setTimeout(() => {
      setShowSaveSuccessAlert(false);
    }, 2500);

    // TODO: In a real implementation, this would save the version to the backend
    console.log("Saved version with description:", description);
  };

  const handleRestoreVersion = (versionId: string) => {
    // Return to current version
    setSelectedHistoryVersion("current");
    
    // Show the restore success alert
    setShowRestoreSuccessAlert(true);

    // Hide the restore success alert after 2.5 seconds
    setTimeout(() => {
      setShowRestoreSuccessAlert(false);
    }, 2500);

    // TODO: In a real implementation, this would restore the version
    console.log("Restoring version:", versionId);
  };

  const handleReturnToCurrentVersion = () => {
    setSelectedHistoryVersion("current");
  };

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
          setOpenFiles={setOpenFiles}
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