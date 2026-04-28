import { useEffect } from "react";
import { Lab2Shell } from "../components/lab2/Lab2Shell";
import { PythonWorkspace } from "../components/ide/pythonlab/views";
import {
  pythonFileStructure,
  pythonInitialChatMessages,
} from "../data/pythonlab";
import { useChatState } from "../hooks/useChatState";
import { useLayoutState } from "../hooks/useLayoutState";
import { useFileWorkspaceState } from "../hooks/useFileWorkspaceState";
import { useVersionHistoryState } from "../hooks/useVersionHistoryState";
import { usePropsOverride } from "../hooks/usePropsOverride";
import type { DevPanelField } from "../components/lab2/dev";
import { globalEditorDevFields } from "../components/lab2/dev";
import {
  EDITOR_READ_ONLY_STORAGE_KEY,
  setEditorReadOnlyOverride,
  useEditorReadOnlyOverride,
} from "../hooks/useEditorReadOnly";
import type { InstructionsDrawerVisualCue } from "../components/lab2/resource-panel/InstructionsDrawer";
import { PythonLabInstructions } from "../components/lab2/resource-panel/PythonLabInstructions";
import { pythonLabLevelLinks } from "./levelTypeLinks";
import { defaultMockTutorConfig } from "../data/weblab2";

const pythonLabDevFields: DevPanelField[] = [
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
    key: "autoSeedTutorConversation",
    label: "Auto-seed tutor chat",
    type: "boolean",
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
  ...globalEditorDevFields,
];

export function PythonLabLevelPage() {
  const {
    activeTab,
    setActiveTab,
    isSettingsOpen,
    setIsSettingsOpen,
    sidebarWidth,
    setSidebarWidth,
  } = useLayoutState();

  const { chatMessages, setChatMessages, chatInput, setChatInput } =
    useChatState(pythonInitialChatMessages);

  const {
    openFolders,
    selectedFile,
    openFiles,
    isFileManagerCollapsed,
    setSelectedFile,
    setIsFileManagerCollapsed,
    setIsCreateFileModalOpen,
    toggleFolder,
    openFile,
    closeFile,
    handleReorderFiles,
  } = useFileWorkspaceState();

  const {
    selectedHistoryVersion,
    setSelectedHistoryVersion,
    showRestoreSuccessAlert,
    setShowRestoreSuccessAlert,
    showSaveSuccessAlert,
    setShowSaveSuccessAlert,
    handleSaveVersion,
    handleRestoreVersion,
  } = useVersionHistoryState();

  const defaults = {
    instructionsDrawerInitialHeightRatio: 0.5,
    instructionsDrawerVisualCue: "none" as InstructionsDrawerVisualCue,
    autoSeedTutorConversation: false,
    title: "Python Lab: Intro Project",
    subtitle: "Saved a few seconds ago",
  };

  const overrideResult = usePropsOverride(defaults);
  const resolved = overrideResult.props;
  const editorReadOnlyOverride = useEditorReadOnlyOverride();

  const resolvedVisualCue =
    resolved.instructionsDrawerVisualCue as InstructionsDrawerVisualCue;

  useEffect(() => {
    if (openFiles.length === 0 && pythonFileStructure.length > 0) {
      openFile(pythonFileStructure[0]);
    }
  }, [openFiles.length, openFile]);

  return (
    <Lab2Shell
      topNavigationProps={{
        title: resolved.title as string,
        subtitle: resolved.subtitle as string,
        currentLevel: 3,
        totalLevels: 8,
        completedLevels: [1, 2],
        levelLinks: pythonLabLevelLinks,
        currentLevelPath: "/levels/pythonlab",
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
        mockTutorConfig: {
          ...defaultMockTutorConfig,
          seedOnMount: Boolean(resolved.autoSeedTutorConversation),
        },
        instructionsContent: <PythonLabInstructions />,
        devPanelFields: pythonLabDevFields,
        devPanelOverrideResult: overrideResult,
        devPanelSessionValues: {
          [EDITOR_READ_ONLY_STORAGE_KEY]: editorReadOnlyOverride,
        },
        onDevPanelSessionValueChange: (key, value) => {
          if (key === EDITOR_READ_ONLY_STORAGE_KEY) {
            setEditorReadOnlyOverride(Boolean(value));
          }
        },
        onDevPanelSessionValueReset: (key) => {
          if (key === EDITOR_READ_ONLY_STORAGE_KEY) {
            setEditorReadOnlyOverride(false);
          }
        },
      }}
      onResize={(delta) => {
        setSidebarWidth((prev) => Math.max(300, Math.min(600, prev + delta)));
      }}
    >
      <PythonWorkspace
        fileStructure={pythonFileStructure}
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
      />
    </Lab2Shell>
  );
}
