import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Lab2Shell } from "../../components/lab2/Lab2Shell";
import { PythonWorkspace } from "../../components/ide/pythonlab/views";
import { CreateFileModal } from "../../components/ide/shared";
import {
  pythonFileStructure,
  pythonInstructionsMarkdown,
  pythonInitialChatMessages,
} from "../../data/pythonlab";
import { useChatState } from "../../hooks/useChatState";
import { useLayoutState } from "../../hooks/useLayoutState";
import { useDevPanelInitialOpenFiles } from "../../hooks/useDevPanelInitialOpenFiles";
import { useFileWorkspaceState } from "../../hooks/useFileWorkspaceState";
import { useVersionHistoryState } from "../../hooks/useVersionHistoryState";
import { usePropsOverride } from "../../hooks/usePropsOverride";
import type { DevPanelField } from "../../components/lab2/dev";
import {
  globalEditorDevFields,
  resourcePanelCompactDevField,
} from "../../components/lab2/dev";
import {
  EDITOR_READ_ONLY_STORAGE_KEY,
  setEditorReadOnlyOverride,
} from "../../hooks/useEditorReadOnly";
import type { InstructionsDrawerVisualCue } from "../../components/lab2/resource-panel/InstructionsDrawer";
import { MarkdownInstructions } from "../../components/lab2/resource-panel/MarkdownInstructions";
import { pythonLabLevelLinks } from "../levelTypeLinks";
import { defaultMockTutorConfig } from "../../data/weblab2";
import { pythonTutorClient } from "../../lib/tutor/tutorClient";
import type { ChatMessage } from "../../types/chat";
import type { BackpackItem } from "../../types/backpack";
import { importBackpackItemToTree } from "../../lib/backpack/importBackpackItemToTree";
import { canImportBackpackItemToLab } from "../../lib/backpack/backpackImportAllowlist";
import type { FileItem } from "../../types/file";
import type { TutorMode, TutorRequestMode } from "../../types/tutor";
import type { ValidationTestDefinition } from "../../types/validation";
import {
  formatInitialOpenFilesProp,
  INITIAL_OPEN_FILES_DEV_KEY,
  parseInitialOpenFilesConfig,
  type InitialOpenFilesProp,
} from "../../lib/editor/initialOpenFiles";
import {
  findFileByNameInTree,
  flattenTutorContextFiles,
  mapFilesToTree,
} from "../../utils/fileTree";

interface PythonLabLevelPageProps {
  currentLevelPath?: string;
  fileStructureOverride?: FileItem[];
  title?: string;
  subtitle?: string;
  showInstructionsDrawer?: boolean;
  enableSidebarCollapse?: boolean;
  collapseSidebarByDefault?: boolean;
  resourcePanelCompact?: boolean;
  showValidationTab?: boolean;
  validationTestsConfig?: string;
  showHistoryTab?: boolean;
  instructionsMarkdown?: string;
  instructionsContent?: ReactNode;
  tutorMode?: TutorMode;
  /** File paths to open when the level loads. Pass a newline string or an array of paths. */
  initialOpenFiles?: InitialOpenFilesProp;
}

type PythonTutorModeKind = "mock" | "functional";

const DEFAULT_PYTHON_STARTER_STORAGE_VERSION = "daily-check-in-v1";

const DEFAULT_PYTHON_VALIDATION_TESTS_CONFIG = String.raw`
Uses input() to ask for the user's name | includes | input(
Defines a clean_name helper function | regex | def\s+clean_name\s*\(
Defines a focus options list | includes | FOCUS_OPTIONS
Loops through the focus options | includes | for index, option in enumerate(options, start=1):
Builds a personalized greeting with an f-string | includes | f"Hello, {name}!"
Prints the generated focus plan | regex | print\s*\(\s*build_focus_plan\s*\(
Includes project notes in README | includes | # Daily Check-In Planner | README.md
`.trim();

function formatSavedSubtitle(createdAt: string | undefined, now: number) {
  if (!createdAt) return "Saved a few seconds ago";
  const savedTime = new Date(createdAt).getTime();
  if (!Number.isFinite(savedTime)) return "Saved a few seconds ago";
  const elapsedSeconds = Math.max(0, Math.floor((now - savedTime) / 1000));

  if (elapsedSeconds < 60) return "Saved a few seconds ago";
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) {
    return `Saved ${elapsedMinutes} minute${elapsedMinutes === 1 ? "" : "s"} ago`;
  }
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  return `Saved ${elapsedHours} hour${elapsedHours === 1 ? "" : "s"} ago`;
}

function parseValidationTestsConfig(value: unknown): ValidationTestDefinition[] {
  if (typeof value !== "string") return [];

  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line, index) => {
      const [description, matcherType, matcherValue, targetFile] = line
        .split("|")
        .map((part) => part.trim());
      const id = `python-validation-${index}-${description}`;

      if (
        !description ||
        !matcherValue ||
        (matcherType !== "includes" && matcherType !== "regex")
      ) {
        return {
          id,
          description: description || `Validation test ${index + 1}`,
        };
      }

      return {
        id,
        description,
        targetFile: targetFile || undefined,
        matcher: matcherType === "includes"
          ? {
              type: "includes",
              value: matcherValue,
            }
          : {
              type: "regex",
              value: matcherValue,
            },
      };
    });
}

function resolvePythonTutorModeKind(value: unknown): PythonTutorModeKind {
  return value === "mock" ? "mock" : "functional";
}

const pythonLabDevFields: DevPanelField[] = [
  resourcePanelCompactDevField,
  {
    key: "showInstructionsDrawer",
    label: "Show instructions drawer",
    type: "boolean",
    group: "Resource panel",
  },
  {
    key: "instructionsDrawerInitialHeightRatio",
    label: "Drawer height ratio",
    type: "number",
    min: 0.2,
    max: 0.8,
    step: 0.05,
    controlLayout: "inline",
    group: "Resource panel",
    visibleWhen: (values) => Boolean(values.showInstructionsDrawer),
  },
  {
    key: "showHistoryTab",
    label: "Show version history",
    type: "boolean",
    group: "Resource panel",
  },
  {
    key: "enableSidebarCollapse",
    label: "Enable sidebar collapse",
    type: "boolean",
    group: "Resource panel",
  },
  {
    key: "collapseSidebarByDefault",
    label: "Collapse sidebar by default",
    type: "boolean",
    group: "Resource panel",
    visibleWhen: (values) => Boolean(values.enableSidebarCollapse),
  },
  {
    key: "showValidationTab",
    label: "Show validation tab",
    type: "boolean",
    group: "Validation",
  },
  {
    key: "validationTestsConfig",
    label: "Validation tests",
    description:
      "One test per line: Description | includes | text or Description | regex | pattern. Add an optional fourth segment for a target file.",
    type: "textarea",
    rows: 6,
    group: "Validation",
    visibleWhen: (values) => Boolean(values.showValidationTab),
  },
  {
    key: "tutorModeKind",
    label: "AI tutor mode",
    description:
      "Switch between scripted mock responses and the functional guidance-only Python Tutor.",
    type: "select",
    options: [
      { label: "Functional", value: "functional" },
      { label: "Mock", value: "mock" },
    ],
    group: "AI Tutor",
  },
  {
    key: "autoSeedTutorConversation",
    label: "Auto-seed tutor chat",
    type: "boolean",
    group: "AI Tutor",
    visibleWhen: (values) => values.tutorModeKind === "mock",
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

export function PythonLabLevelPage({
  currentLevelPath = "/levels/pythonlab",
  fileStructureOverride,
  title = "Python Lab: Intro Project",
  subtitle = "Saved a few seconds ago",
  showInstructionsDrawer = true,
  enableSidebarCollapse = false,
  collapseSidebarByDefault = false,
  resourcePanelCompact = false,
  showValidationTab = true,
  validationTestsConfig = DEFAULT_PYTHON_VALIDATION_TESTS_CONFIG,
  showHistoryTab = true,
  instructionsMarkdown = pythonInstructionsMarkdown,
  instructionsContent,
  tutorMode,
  initialOpenFiles,
}: PythonLabLevelPageProps = {}) {
  const {
    activeTab,
    setActiveTab,
    isSettingsOpen,
    setIsSettingsOpen,
    sidebarWidth,
    setSidebarWidth,
  } = useLayoutState();

  const initialFileStructure = useMemo(
    () => fileStructureOverride ?? pythonFileStructure,
    [fileStructureOverride],
  );
  const storageKeyBase = fileStructureOverride
    ? `pythonlab:${currentLevelPath}`
    : `pythonlab:${currentLevelPath}:${DEFAULT_PYTHON_STARTER_STORAGE_VERSION}`;

  const { chatMessages, setChatMessages, chatInput, setChatInput } =
    useChatState(pythonInitialChatMessages, "", {
      storageKey: `${storageKeyBase}:chat`,
    });
  const [isTutorRequestRunning, setIsTutorRequestRunning] = useState(false);
  const [tutorRequestMode, setTutorRequestMode] =
    useState<TutorRequestMode>("help");

  const defaults = {
    instructionsDrawerInitialHeightRatio: 0.5,
    instructionsDrawerVisualCue: "none" as InstructionsDrawerVisualCue,
    autoSeedTutorConversation: false,
    showInstructionsDrawer,
    enableSidebarCollapse,
    collapseSidebarByDefault,
    resourcePanelCompact,
    showValidationTab,
    validationTestsConfig,
    showHistoryTab,
    tutorModeKind: tutorMode?.kind ?? "functional",
    title,
    subtitle,
    [EDITOR_READ_ONLY_STORAGE_KEY]: false,
    [INITIAL_OPEN_FILES_DEV_KEY]: formatInitialOpenFilesProp(initialOpenFiles),
  };

  const overrideResult = usePropsOverride(defaults);
  const resolved = overrideResult.props;
  const resolvedEditorReadOnlyOverride = Boolean(resolved[EDITOR_READ_ONLY_STORAGE_KEY]);
  const parsedInitialOpenFiles = useMemo(
    () => parseInitialOpenFilesConfig(resolved[INITIAL_OPEN_FILES_DEV_KEY]),
    [resolved],
  );

  const {
    fileStructureState,
    openFolders,
    selectedFile,
    openFiles,
    isFileManagerCollapsed,
    isCreateFileModalOpen,
    setSelectedFile,
    setOpenFiles,
    setIsFileManagerCollapsed,
    setIsCreateFileModalOpen,
    toggleFolder,
    openFile,
    closeFile,
    handleReorderFiles,
    handleCreateFile,
    updateFileContent,
    replaceFileStructure,
  } = useFileWorkspaceState(
    initialFileStructure,
    {
      storageKey: `${storageKeyBase}:file-structure`,
      initialOpenFilePaths: parsedInitialOpenFiles,
    },
  );

  const resolvedVisualCue =
    resolved.instructionsDrawerVisualCue as InstructionsDrawerVisualCue;

  useEffect(() => {
    setEditorReadOnlyOverride(resolvedEditorReadOnlyOverride);
  }, [resolvedEditorReadOnlyOverride]);

  const currentFileStructure = fileStructureState ?? initialFileStructure;
  useDevPanelInitialOpenFiles(
    currentFileStructure,
    resolved[INITIAL_OPEN_FILES_DEV_KEY],
    setOpenFiles,
    setSelectedFile,
  );
  const getCurrentFileStructure = useCallback(
    () => fileStructureState ?? initialFileStructure,
    [fileStructureState, initialFileStructure],
  );
  const {
    versions: historyVersions,
    selectedHistoryFileStructure,
    selectedHistoryVersionLabel,
    selectedHistoryVersion,
    setSelectedHistoryVersion,
    showRestoreSuccessAlert,
    setShowRestoreSuccessAlert,
    showSaveSuccessAlert,
    setShowSaveSuccessAlert,
    handleSaveVersion,
    handleRestoreVersion,
    handleReturnToCurrentVersion,
    latestSavedAt,
    showNewProjectHistoryEmptyState,
  } = useVersionHistoryState({
    getFileStructure: getCurrentFileStructure,
    onRestoreFileStructure: replaceFileStructure,
    storageKey: `${storageKeyBase}:version-history`,
  });
  const [subtitleNow, setSubtitleNow] = useState(() => Date.now());
  useEffect(() => {
    setSubtitleNow(Date.now());
    const intervalId = window.setInterval(() => setSubtitleNow(Date.now()), 15_000);
    return () => window.clearInterval(intervalId);
  }, [latestSavedAt]);
  const isViewingHistoryVersion =
    Boolean(resolved.showHistoryTab) &&
    selectedHistoryVersion !== "current" &&
    Boolean(selectedHistoryFileStructure);
  useEffect(() => {
    if (!resolved.showHistoryTab && selectedHistoryVersion !== "current") {
      setSelectedHistoryVersion("current");
    }
  }, [resolved.showHistoryTab, selectedHistoryVersion, setSelectedHistoryVersion]);
  const visibleFileStructure = isViewingHistoryVersion && selectedHistoryFileStructure
    ? selectedHistoryFileStructure
    : currentFileStructure;
  const visibleSelectedFile = selectedFile
    ? findFileByNameInTree(visibleFileStructure, selectedFile.name) ?? selectedFile
    : selectedFile;
  const visibleOpenFiles = mapFilesToTree(openFiles, visibleFileStructure);
  const resolvedInstructionsContent =
    instructionsContent ?? <MarkdownInstructions markdown={instructionsMarkdown} />;
  const validationTests = useMemo(
    () => parseValidationTestsConfig(resolved.validationTestsConfig),
    [resolved.validationTestsConfig],
  );
  const topNavigationSubtitle = formatSavedSubtitle(latestSavedAt, subtitleNow);
  const resolvedTutorModeKind = resolvePythonTutorModeKind(resolved.tutorModeKind);
  const resolvedMockTutorConfig = resolvedTutorModeKind === "mock"
    ? {
        ...defaultMockTutorConfig,
        ...(tutorMode?.kind === "mock" ? tutorMode.config : undefined),
        seedOnMount:
          Boolean(resolved.autoSeedTutorConversation) ||
          Boolean(tutorMode?.kind === "mock" && tutorMode.config?.seedOnMount),
      }
    : undefined;
  const availableTutorContextFiles = useMemo(
    () => flattenTutorContextFiles(currentFileStructure),
    [currentFileStructure],
  );
  const handleImportBackpackItem = useCallback((item: BackpackItem): true | string => {
    if (isViewingHistoryVersion) {
      return "Switch back to the current version before importing from your backpack.";
    }
    if (!canImportBackpackItemToLab(item, "pythonlab")) {
      return "This file type is not supported in Python Lab.";
    }

    const importResult = importBackpackItemToTree(currentFileStructure, item);
    if (typeof importResult === "string") {
      return importResult;
    }

    replaceFileStructure(importResult.tree);
    setIsFileManagerCollapsed(false);
    setOpenFiles((current) =>
      current.some((file) => file.name === importResult.file.name)
        ? current
        : [...current, importResult.file],
    );
    setSelectedFile(importResult.file);
    return true;
  }, [
    currentFileStructure,
    isViewingHistoryVersion,
    replaceFileStructure,
    setIsFileManagerCollapsed,
    setOpenFiles,
    setSelectedFile,
  ]);
  const handleTutorSubmit = useCallback(async (
    message: string,
    conversation: ChatMessage[],
  ) => {
    const result = await pythonTutorClient({
      message,
      conversation,
      files: currentFileStructure,
      requestMode: "help",
    });

    return {
      role: "assistant",
      content: result.message,
    } satisfies ChatMessage;
  }, [currentFileStructure]);

  return (
    <>
      <Lab2Shell
        topNavigationProps={{
          title: resolved.title as string,
          subtitle: topNavigationSubtitle,
          currentLevel: 3,
          totalLevels: 8,
          completedLevels: [1, 2],
          levelLinks: pythonLabLevelLinks,
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
          historyVersions,
          showNewProjectHistoryEmptyState,
          onSaveVersion: handleSaveVersion,
          onRestoreVersion: handleRestoreVersion,
          showRestoreSuccessAlert,
          setShowRestoreSuccessAlert,
          showSaveSuccessAlert,
          setShowSaveSuccessAlert,
          showValidationTab: Boolean(resolved.showValidationTab),
          validationFileStructure: currentFileStructure,
          validationTests,
          showHistoryTab: Boolean(resolved.showHistoryTab),
          collapsible: Boolean(resolved.enableSidebarCollapse),
          defaultCollapsed:
            Boolean(resolved.enableSidebarCollapse) &&
            Boolean(resolved.collapseSidebarByDefault),
          compact: Boolean(resolved.resourcePanelCompact),
          instructionsDrawerInitialHeightRatio:
            resolved.instructionsDrawerInitialHeightRatio as number,
          showInstructionsDrawer: Boolean(resolved.showInstructionsDrawer),
          instructionsDrawerVisualCue: resolvedVisualCue,
          mockTutorConfig: resolvedMockTutorConfig,
          instructionsContent: resolvedInstructionsContent,
          availableTutorContextFiles,
          onImportBackpackItem: handleImportBackpackItem,
          backpackImportLab: "pythonlab",
          onTutorSubmit: resolvedTutorModeKind === "functional" ? handleTutorSubmit : undefined,
          isTutorRequestRunning,
          onTutorRequestRunningChange: setIsTutorRequestRunning,
          showTutorModelSelector: false,
          tutorRequestMode,
          setTutorRequestMode,
          aiTutorComposerPlaceholder: "Ask for Python help...",
          aiTutorEmptyStateTitle: "Ask Python Tutor for help",
          aiTutorEmptyStateText:
            "Ask a question about your code, a Python concept, or a runtime error. The tutor can read your files but will not change them.",
          aiTutorSubmitFailureMessage:
            "I had trouble answering that Python question. Try sending it again.",
          devPanelFields: pythonLabDevFields,
          devPanelOverrideResult: overrideResult,
        }}
        onResize={(delta) => {
          setSidebarWidth((prev) => Math.max(300, Math.min(600, prev + delta)));
        }}
      >
        <PythonWorkspace
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
          onFileContentChange={isViewingHistoryVersion ? undefined : updateFileContent}
          readOnly={isViewingHistoryVersion || resolvedEditorReadOnlyOverride}
          selectedHistoryVersion={isViewingHistoryVersion ? selectedHistoryVersion : "current"}
          selectedHistoryVersionLabel={selectedHistoryVersionLabel}
          onReturnToCurrentVersion={handleReturnToCurrentVersion}
        />
      </Lab2Shell>
      <CreateFileModal
        isOpen={isCreateFileModalOpen}
        onClose={() => setIsCreateFileModalOpen(false)}
        onCreate={handleCreateFile}
        defaultFileType="PY"
        fileTypes={["PY", "TXT", "CSV", "MD"]}
      />
    </>
  );
}
