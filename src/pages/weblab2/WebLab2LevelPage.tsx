import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import { useSearchParams } from "react-router-dom";
import { Lab2Shell } from "../../components/lab2/Lab2Shell";
import {
  Workspace,
  CreateFileModal,
  NameInputModal,
} from "../../components/ide/weblab2/views";
import {
  DefaultProjectPreview,
  defaultInstructionsMarkdown,
  fileStructure,
  initialChatMessages,
  defaultMockTutorConfig,
} from "../../data/weblab2";
import type { FileChange } from "../../types/chat";
import { useChatState } from "../../hooks/useChatState";
import { useFileWorkspaceState } from "../../hooks/useFileWorkspaceState";
import { useLayoutState } from "../../hooks/useLayoutState";
import { useVersionHistoryState } from "../../hooks/useVersionHistoryState";
import { usePropsOverride } from "../../hooks/usePropsOverride";
import type { DevPanelField } from "../../components/lab2/dev";
import {
  EDITOR_READ_ONLY_STORAGE_KEY,
  setEditorReadOnlyOverride,
} from "../../hooks/useEditorReadOnly";
import { useLevelShareMode } from "../../hooks/useLevelShareMode";
import { webLab2LevelLinks } from "../levelTypeLinks";
import type { LevelProgressLink } from "../../components/ui/header/LevelProgressBubbles";
import type { InstructionsDrawerVisualCue } from "../../components/lab2/resource-panel/InstructionsDrawer";
import { MarkdownInstructions } from "../../components/lab2/resource-panel/MarkdownInstructions";
import type { RubricData } from "../../components/lab2/resource-panel/views/RubricPanel";
import type { WebLab2ValidationReviewConfig } from "../../types/validationReview";
import {
  createValidationReviewOffer,
  createWebLab2ValidationReview,
} from "../../lib/validation/weblab2Review";
import { PROJECT_PLAN_FILE } from "../../lib/tutor/planningRunner";
import {
  decodeStarterSharePayload,
  encodeStarterSharePayload,
  STARTER_SHARE_PARAM,
  starterSharePayloadToUpload,
} from "../../lib/starterShare";
import type { FileItem } from "../../types/file";
import type {
  AiTutorInputExperiment,
  MockTutorConfig,
  TutorMode,
} from "../../types/tutor";
import type { ViewMode } from "../../types/ui";
import {
  findFileByNameInTree,
  flattenTutorContextFiles,
  mapFilesToTree,
  pathBasename,
} from "../../utils/fileTree";
import {
  applyRubricDevSettings,
  buildRubricsDevFields,
  DEFAULT_RUBRIC_DATA,
  getInitialRubricCategoryId,
  getInitialRubricStatus,
  getRubricCategoryOptions,
  INSTRUCTIONS_MARKDOWN_DEV_KEY,
  normalizeRubricData,
  resolveRubricDevStatus,
  resolveVersionHistoryMode,
  resolveViewMode,
  STARTER_CODE_UPLOAD_DEV_KEY,
  webLab2BaseDevFields,
  webLab2ResourcesTabDevFields,
  type VersionHistoryMode,
} from "./webLab2DevPanel";
import {
  buildFileTreeFromUploadedStarter,
  buildFileTreeWithUploadedFiles,
  getShareableStarterUpload,
  PROJECT_FILE_UPLOAD_ACCEPT,
  readStarterUploadedFiles,
  type StarterCodeUploadValue,
} from "../../components/ide/weblab2/webLab2Uploads";
import {
  findFileEntryInTree,
  findFirstOpenableFile,
  FIXED_SAVED_SUBTITLE,
  formatSavedSubtitle,
  getInitialInlineImageContentMap,
  hasAcceptedCompletedPlanStatus,
  hasCompletedPlanStatus,
  hasProjectFiles,
  hydrateInlineImageContent,
  isPlanFilePath,
  stripInitialInlineImageContent,
} from "../../components/ide/weblab2/webLab2FileTree";
import { useWebLab2Preview } from "../../components/ide/weblab2/useWebLab2Preview";
import { useWebLab2TutorFlow } from "../../components/ide/weblab2/useWebLab2TutorFlow";

interface WebLab2LevelPageProps {
  currentLevelPath?: string;
  title?: string;
  instructionsDrawerInitialHeightRatio?: number;
  instructionsDrawerVisualCue?: InstructionsDrawerVisualCue;
  autoSeedTutorConversation?: boolean;
  aiTutorInputExperiment?: AiTutorInputExperiment;
  showRubricTab?: boolean;
  rubricData?: RubricData | RubricData[];
  tutorMode?: TutorMode;
  /** Custom file structure to replace the default mock data. */
  fileStructureOverride?: FileItem[];
  /** Custom preview content rendered instead of the default mock website. */
  previewContent?: React.ReactNode | ((aiActive: boolean) => React.ReactNode);
  /** Hide the instructions drawer in the AI tutor panel. Default true. */
  showInstructionsDrawer?: boolean;
  /** When true, show the sidebar collapse/expand control. */
  enableSidebarCollapse?: boolean;
  /** When true, the sidebar starts collapsed if sidebar collapse is enabled. */
  collapseSidebarByDefault?: boolean;
  /** Optional markdown content to pre-seed the instructions drawer editor. */
  instructionsMarkdown?: string;
  /** Where to render the Continue button: "sidebar" (bottom bar) or "header" (next to bubbles). */
  continueButtonPlacement?: "sidebar" | "header";
  /** When true, show the tutor composer model dropdown. */
  showTutorModelSelector?: boolean;
  /** Workspace view selected when the level first loads. */
  initialViewMode?: ViewMode;
  /** When true, the file manager starts collapsed in code/split views. */
  collapseFileManagerByDefault?: boolean;
  /** When true, render preview from project file contents instead of custom React previewContent. */
  useFilePreview?: boolean;
  /** When true, file preview exposes design selection and style editing tools. */
  enableDesignMode?: boolean;
  /** Use static mock history or live file snapshots. Functional history requires file preview. */
  versionHistoryMode?: VersionHistoryMode;
  /** When true, hide placeholder file-manager entries with no starter/proposed content. */
  showOnlyFilesWithContent?: boolean;
  /** When true, show the Resources tab card for associated student lesson materials. */
  showStudentLessonResource?: boolean;
  /** When true, show the Resources tab card for lab documentation. */
  showDocumentationResource?: boolean;
  /** When true, show the Resources tab card for level walkthroughs. */
  showWalkthroughResources?: boolean;
  /** Optional suffix for route-scoped file/version storage when starter fixtures change. */
  storageKeySuffix?: string;
  validationReviewConfig?: WebLab2ValidationReviewConfig;
  levelLinks?: LevelProgressLink[];
  completedLevelPaths?: string[];
  currentLevel?: number;
  totalLevels?: number;
  completedLevels?: number[];
  continueLabel?: string;
  onContinue?: () => void;
}

export function WebLab2LevelPage({
  currentLevelPath = "/levels/weblab2",
  title = "Web Lab 2: Intro Project",
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
  enableSidebarCollapse = false,
  collapseSidebarByDefault = false,
  instructionsMarkdown = defaultInstructionsMarkdown,
  continueButtonPlacement = "sidebar",
  showTutorModelSelector = false,
  initialViewMode = "code",
  collapseFileManagerByDefault = false,
  useFilePreview = false,
  enableDesignMode = true,
  versionHistoryMode,
  showOnlyFilesWithContent = false,
  showStudentLessonResource = false,
  showDocumentationResource = true,
  showWalkthroughResources = false,
  storageKeySuffix,
  validationReviewConfig,
  levelLinks,
  completedLevelPaths,
  currentLevel = 9,
  totalLevels = 10,
  completedLevels = [1, 2, 3],
  continueLabel,
  onContinue,
}: WebLab2LevelPageProps = {}) {
  const shareMode = useLevelShareMode();
  const [searchParams] = useSearchParams();
  const starterShareParam = searchParams.get(STARTER_SHARE_PARAM);
  const starterSharePayload = useMemo(
    () => decodeStarterSharePayload(starterShareParam),
    [starterShareParam],
  );
  const routeTutorMode: TutorMode =
    tutorMode ?? { kind: "mock", config: defaultMockTutorConfig };
  const initialMockTutorConfig =
    routeTutorMode.kind === "mock" ? routeTutorMode.config : undefined;
  const baseRubrics = useMemo(
    () => normalizeRubricData(rubricData),
    [rubricData],
  );
  const editableRubrics = useMemo(
    () => baseRubrics.length > 0 ? baseRubrics : [DEFAULT_RUBRIC_DATA],
    [baseRubrics],
  );
  const firstEditableRubric = editableRubrics[0] ?? DEFAULT_RUBRIC_DATA;
  const defaults = {
    instructionsDrawerInitialHeightRatio:
      instructionsDrawerInitialHeightRatio ?? 0.6,
    showInstructionsDrawer: showInstructionsDrawer ?? true,
    enableSidebarCollapse,
    collapseSidebarByDefault,
    [INSTRUCTIONS_MARKDOWN_DEV_KEY]: instructionsMarkdown,
    instructionsDrawerVisualCue,
    autoSeedTutorConversation,
    additionalTutorPrompt: "",
    showTutorModelSelector,
    tutorModeKind: routeTutorMode.kind,
    continueButtonPlacement,
    initialViewMode,
    collapseFileManagerByDefault,
    useFilePreview,
    enableDesignMode,
    [EDITOR_READ_ONLY_STORAGE_KEY]: false,
    versionHistoryMode:
      versionHistoryMode ?? (routeTutorMode.kind === "functional" ? "functional" : "mock"),
    showRubricTab,
    showStudentLessonResource,
    showDocumentationResource,
    showWalkthroughResources,
    rubricName: firstEditableRubric.name,
    rubricTeacherFeedback: firstEditableRubric.feedback ?? "",
    rubricStatus: getInitialRubricStatus(firstEditableRubric),
    rubricSelectedCategoryId: getInitialRubricCategoryId(firstEditableRubric),
    title,
  };
  const overrideResult = usePropsOverride(defaults);
  const resolved = overrideResult.props;
  const resolvedInitialViewMode = resolveViewMode(resolved.initialViewMode);
  const initialFileStructure = fileStructureOverride ?? fileStructure;
  const initialInlineImageContentByPath = useMemo(
    () => getInitialInlineImageContentMap(initialFileStructure),
    [initialFileStructure],
  );
  const stripInitialImagesForStorage = useCallback(
    (tree: FileItem[]) =>
      stripInitialInlineImageContent(tree, initialInlineImageContentByPath),
    [initialInlineImageContentByPath],
  );
  const shouldCollapseEmptyFileManager =
    !hasProjectFiles(initialFileStructure);
  const resolvedCollapseFileManagerByDefault = Boolean(
    resolved.collapseFileManagerByDefault || shouldCollapseEmptyFileManager,
  );
  const resolvedUseFilePreview = Boolean(resolved.useFilePreview);
  const resolvedEnableDesignMode = Boolean(resolved.enableDesignMode);
  const resolvedEditorReadOnlyOverride = Boolean(resolved[EDITOR_READ_ONLY_STORAGE_KEY]);
  const resolvedAdditionalTutorPrompt = String(resolved.additionalTutorPrompt ?? "");
  const resolvedEnableSidebarCollapse = Boolean(resolved.enableSidebarCollapse);
  const resolvedCollapseSidebarByDefault = Boolean(resolved.collapseSidebarByDefault);
  const resolvedShowTutorModelSelector = Boolean(resolved.showTutorModelSelector);
  const resolvedVersionHistoryMode = resolveVersionHistoryMode(
    resolved.versionHistoryMode,
  );
  const resolvedRubricStatus = resolveRubricDevStatus(resolved.rubricStatus);
  const routeStorageKey = storageKeySuffix
    ? `${currentLevelPath}:${storageKeySuffix}`
    : currentLevelPath;
  const handleClearLevelSessionCache = useCallback(() => {
    if (typeof window === "undefined") return;
    const confirmed = window.confirm(
      "Clear this level's saved file tree and version history, then reload the page?",
    );
    if (!confirmed) return;

    const prefixes = [
      `weblab2:file-structure:${currentLevelPath}`,
      `weblab2:version-history:${currentLevelPath}`,
    ];

    for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = window.sessionStorage.key(index);
      if (key && prefixes.some((prefix) => key.startsWith(prefix))) {
        window.sessionStorage.removeItem(key);
      }
    }

    window.location.reload();
  }, [currentLevelPath]);
  const useFunctionalVersionHistory =
    resolvedUseFilePreview && resolvedVersionHistoryMode === "functional";
  const rubricCategoryOptions = useMemo(
    () => getRubricCategoryOptions(editableRubrics),
    [editableRubrics],
  );
  const webLab2DevFields = useMemo(
    () => [
      ...webLab2BaseDevFields,
      {
        key: "clearLevelSessionCache",
        label: "Clear level session cache",
        description:
          "Removes this route's saved file tree and version history, then reloads from the current fixture.",
        type: "action",
        buttonLabel: "Clear cache and reload",
        iconName: "eraser",
        group: "Session cache",
        onAction: handleClearLevelSessionCache,
      } satisfies DevPanelField,
      ...buildRubricsDevFields(rubricCategoryOptions),
      ...webLab2ResourcesTabDevFields,
    ],
    [handleClearLevelSessionCache, rubricCategoryOptions],
  );
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
    setOpenFiles,
    setViewMode,
    setIsFileManagerCollapsed,
    setIsCreateFileModalOpen,
    toggleFolder,
    openFile,
    closeFile,
    handleReorderFiles,
    handleCreateFile,
    handleCreateFolder,
    handleCreatePlan,
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
    initialFileStructure,
    {
      storageKey: `weblab2:file-structure:${routeStorageKey}`,
      initialViewMode: resolvedInitialViewMode,
      initialFileManagerCollapsed: resolvedCollapseFileManagerByDefault,
      storageFileStructureTransform: stripInitialImagesForStorage,
    },
  );
  const lastResolvedInitialViewModeRef = useRef(resolvedInitialViewMode);
  const lastResolvedFileManagerCollapsedRef = useRef(
    resolvedCollapseFileManagerByDefault,
  );
  const appliedStarterShareParamRef = useRef<string | null>(null);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [isCreatePlanModalOpen, setIsCreatePlanModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{
    file: FileItem;
    path: string;
  } | null>(null);
  const [starterCodeUpload, setStarterCodeUpload] =
    useState<StarterCodeUploadValue | null>(null);
  const shareableStarterCodeUpload = useMemo(
    () => getShareableStarterUpload(starterCodeUpload),
    [starterCodeUpload],
  );
  const { chatMessages, setChatMessages, chatInput, setChatInput } =
    useChatState(
      initialMockTutorConfig?.initialMessages ?? initialChatMessages,
      initialMockTutorConfig?.initialInput,
    );
  useEffect(() => {
    if (lastResolvedInitialViewModeRef.current === resolvedInitialViewMode) return;
    lastResolvedInitialViewModeRef.current = resolvedInitialViewMode;
    setViewMode(resolvedInitialViewMode);
  }, [resolvedInitialViewMode, setViewMode]);
  useEffect(() => {
    if (
      lastResolvedFileManagerCollapsedRef.current ===
      resolvedCollapseFileManagerByDefault
    ) {
      return;
    }
    lastResolvedFileManagerCollapsedRef.current =
      resolvedCollapseFileManagerByDefault;
    setIsFileManagerCollapsed(resolvedCollapseFileManagerByDefault);
  }, [resolvedCollapseFileManagerByDefault, setIsFileManagerCollapsed]);
  const getCurrentFileStructure = useCallback(
    () => fileStructureState ?? fileStructureOverride ?? fileStructure,
    [fileStructureOverride, fileStructureState],
  );
  const resolvedTutorModeKind =
    resolved.tutorModeKind === "functional" ? "functional" : "mock";
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
    handleSaveAiVersion,
    handleRestoreVersion,
    handleReturnToCurrentVersion,
    latestSavedAt,
    showNewProjectHistoryEmptyState,
  } = useVersionHistoryState(
    useFunctionalVersionHistory
      ? {
          getFileStructure: getCurrentFileStructure,
          onRestoreFileStructure: replaceFileStructure,
          storageKey: `weblab2:version-history:${routeStorageKey}`,
          snapshotFileStructureTransform: stripInitialImagesForStorage,
        }
      : undefined,
  );
  useEffect(() => {
    setSelectedHistoryVersion("current");
  }, [setSelectedHistoryVersion, useFunctionalVersionHistory]);
  const [subtitleNow, setSubtitleNow] = useState(() => Date.now());
  useEffect(() => {
    if (!useFunctionalVersionHistory) return undefined;
    setSubtitleNow(Date.now());
    const intervalId = window.setInterval(() => setSubtitleNow(Date.now()), 15_000);
    return () => window.clearInterval(intervalId);
  }, [latestSavedAt, useFunctionalVersionHistory]);
  useEffect(() => {
    setEditorReadOnlyOverride(resolvedEditorReadOnlyOverride);
  }, [resolvedEditorReadOnlyOverride]);

  const aiChangedFiles = useMemo(() => {
    const pending = chatMessages.find(
      (m) => m.codeChangeStatus === "pending" && m.fileChanges,
    );
    if (!pending?.fileChanges) return undefined;
    const map: Record<string, "new" | "modified" | "deleted"> = {};
    for (const fc of pending.fileChanges) {
      map[fc.fileName] = fc.status;
      map[pathBasename(fc.fileName)] = fc.status;
    }
    return map;
  }, [chatMessages]);

  const hasAcceptedChanges = chatMessages.some(
    (m) => m.codeChangeStatus === "accepted" && m.fileChanges,
  );
  const hasPendingAiChanges = !!aiChangedFiles && Object.keys(aiChangedFiles).length > 0;
  const isAiActive = hasPendingAiChanges || hasAcceptedChanges;
  const currentFileStructure = fileStructureState ?? fileStructureOverride ?? fileStructure;
  const validationReviewOffer = useMemo(
    () => validationReviewConfig
      ? createValidationReviewOffer(validationReviewConfig)
      : undefined,
    [validationReviewConfig],
  );
  const handleValidationReview = useCallback(() => {
    if (!validationReviewConfig) {
      throw new Error("Validation review requested without a review config.");
    }

    return createWebLab2ValidationReview({
      config: validationReviewConfig,
      currentFileStructure,
      initialFileStructure,
      chatMessages,
    });
  }, [
    chatMessages,
    currentFileStructure,
    initialFileStructure,
    validationReviewConfig,
  ]);
  const currentFileStructureWithHydratedImages = useMemo(
    () => hydrateInlineImageContent(
      currentFileStructure,
      initialInlineImageContentByPath,
    ),
    [currentFileStructure, initialInlineImageContentByPath],
  );
  const showWorkspaceNewProjectEmptyState =
    !useFunctionalVersionHistory || showNewProjectHistoryEmptyState;
  const isViewingHistoryVersion =
    useFunctionalVersionHistory &&
    selectedHistoryVersion !== "current" &&
    Boolean(selectedHistoryFileStructure);
  const visibleFileStructure = useMemo(
    () => isViewingHistoryVersion && selectedHistoryFileStructure
      ? hydrateInlineImageContent(
          selectedHistoryFileStructure,
          initialInlineImageContentByPath,
        )
      : currentFileStructureWithHydratedImages,
    [
      currentFileStructureWithHydratedImages,
      initialInlineImageContentByPath,
      isViewingHistoryVersion,
      selectedHistoryFileStructure,
    ],
  );
  const visibleSelectedFile = selectedFile
    ? findFileByNameInTree(visibleFileStructure, selectedFile.name) ?? selectedFile
    : selectedFile;
  const visibleOpenFiles = mapFilesToTree(openFiles, visibleFileStructure);
  const visibleHasPendingAiChanges = isViewingHistoryVersion ? false : hasPendingAiChanges;
  const selectedPlanEntry = visibleSelectedFile
    ? findFileEntryInTree(visibleFileStructure, visibleSelectedFile.name)
    : null;
  const isSelectedPlanFile =
    isPlanFilePath(selectedPlanEntry?.path) ||
    selectedPlanEntry?.path === pathBasename(PROJECT_PLAN_FILE) ||
    visibleSelectedFile?.name === pathBasename(PROJECT_PLAN_FILE);
  const selectedPlanPath = isSelectedPlanFile
    ? selectedPlanEntry?.path ?? PROJECT_PLAN_FILE
    : PROJECT_PLAN_FILE;
  const selectedPlanFileName = pathBasename(selectedPlanPath);
  const {
    builtPlanPaths,
    buildingPlanPath,
    handleAcceptAiChanges,
    handleAddFileToTutor,
    handleBannerAiChangeAction,
    handleBuildCurrentPlan,
    handleStartWithTutor,
    handleTutorSubmit,
    isTutorRequestRunning,
    newProjectPlanQuestionnaireSignal,
    setIsTutorRequestRunning,
    setTutorRequestMode,
    tutorRequestMode,
  } = useWebLab2TutorFlow({
    chatMessages,
    setChatMessages,
    setChatInput,
    currentFileStructure,
    additionalTutorPrompt: resolvedAdditionalTutorPrompt,
    useFilePreview: resolvedUseFilePreview,
    selectedPlanPath,
    hasPendingAiChanges,
    beginAiProposal,
    acceptAiProposal,
    rejectAiProposal,
    handleSaveAiVersion,
    openFile,
    setActiveTab,
    setIsFileManagerCollapsed,
    setViewMode,
  });
  const isSelectedPlanCompleted =
    builtPlanPaths.has(selectedPlanPath) ||
    hasAcceptedCompletedPlanStatus(selectedPlanEntry?.file);
  const isSelectedPlanBuiltOrPending =
    isSelectedPlanCompleted ||
    hasCompletedPlanStatus(selectedPlanEntry?.file);
  const isSelectedPlanBuilding = buildingPlanPath === selectedPlanPath;
  const planStatusText =
    isSelectedPlanBuiltOrPending && !isSelectedPlanCompleted && hasPendingAiChanges
      ? "Built, awaiting user review."
      : undefined;
  const showPlanActionBar =
    !isViewingHistoryVersion &&
    isSelectedPlanFile;
  const resolvedPreviewContent = typeof previewContent === "function"
    ? previewContent(isAiActive)
    : previewContent ?? <DefaultProjectPreview />;
  const {
    previewConfig,
    previewPath,
    setPreviewPath,
    handleOpenFileChangeInPreview,
  } = useWebLab2Preview({
    currentFileStructure,
    visibleFileStructure,
    visibleHasPendingAiChanges,
    reactPreviewContent: resolvedPreviewContent,
    useFilePreview: resolvedUseFilePreview,
    enableDesignMode: resolvedEnableDesignMode,
    isViewingHistoryVersion,
    isTutorRequestRunning,
    hasPendingAiChanges,
    setActiveTab,
    setViewMode,
    replaceFileStructure,
  });
  const handleOpenFileChangeInEditor = useCallback((change: FileChange) => {
    if (change.status === "deleted") return;
    const target = findFileEntryInTree(visibleFileStructure, change.fileName);
    if (!target) return;

    setViewMode("split");
    openFile(target.file);
  }, [openFile, setViewMode, visibleFileStructure]);
  const availableTutorContextFiles = useMemo(
    () => flattenTutorContextFiles(currentFileStructure),
    [currentFileStructure],
  );

  const handleStarterCodeUpload = useCallback((value: StarterCodeUploadValue | null | undefined) => {
    const uploadedFiles = value?.files ?? [];
    if (uploadedFiles.length === 0) return;
    const uploadValue = value ?? {
      files: uploadedFiles,
      uploadedAt: new Date().toISOString(),
    };

    try {
      const nextTree = buildFileTreeFromUploadedStarter(uploadedFiles);
      const firstFile = findFirstOpenableFile(nextTree);
      setStarterCodeUpload(uploadValue);
      replaceFileStructure(nextTree);
      setSelectedFile(firstFile);
      setOpenFiles(firstFile ? [firstFile] : []);
      if (firstFile?.type === "html") {
        setPreviewPath(firstFile.name);
      }
    } catch (error) {
      console.error("[WebLab2LevelPage] Unable to apply starter upload", error);
    }
  }, [replaceFileStructure, setOpenFiles, setSelectedFile]);
  const handleStarterFileUpload = useCallback(async (files: FileList) => {
    try {
      const uploadedFiles = await readStarterUploadedFiles(files);
      handleStarterCodeUpload({
        files: uploadedFiles,
        uploadedAt: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      console.error("[WebLab2LevelPage] Starter file read failed", error);
      return error instanceof Error
        ? error.message
        : "Unable to read those files. Try uploading supported project files only.";
    }
  }, [handleStarterCodeUpload]);
  const handleProjectFileUpload = useCallback(async (files: FileList) => {
    try {
      const uploadedFiles = await readStarterUploadedFiles(files);
      const baseTree = fileStructureState ?? fileStructureOverride ?? fileStructure;
      const nextTree = buildFileTreeWithUploadedFiles(baseTree, uploadedFiles);
      const firstUploadedName = uploadedFiles[0]?.name;
      const firstUploadedFile = firstUploadedName
        ? findFileByNameInTree(nextTree, firstUploadedName)
        : null;

      replaceFileStructure(nextTree);
      setIsFileManagerCollapsed(false);
      if (firstUploadedFile) {
        setOpenFiles((current) =>
          current.some((file) => file.name === firstUploadedFile.name)
            ? current
            : [...current, firstUploadedFile]
        );
        setSelectedFile(firstUploadedFile);
        if (firstUploadedFile.type === "html") {
          const entry = findFileEntryInTree(nextTree, firstUploadedFile.name);
          setPreviewPath(entry?.path ?? firstUploadedFile.name);
        }
      }
      return true;
    } catch (error) {
      console.error("[WebLab2LevelPage] Project file upload failed", error);
      return error instanceof Error
        ? error.message
        : "Unable to upload those files.";
    }
  }, [
    fileStructureOverride,
    fileStructureState,
    replaceFileStructure,
    setIsFileManagerCollapsed,
    setOpenFiles,
    setSelectedFile,
  ]);
  useEffect(() => {
    if (!starterShareParam || !starterSharePayload) return;
    if (appliedStarterShareParamRef.current === starterShareParam) return;

    appliedStarterShareParamRef.current = starterShareParam;
    handleStarterCodeUpload(starterSharePayloadToUpload(starterSharePayload));
  }, [handleStarterCodeUpload, starterShareParam, starterSharePayload]);
  const handleStarterCodeReset = useCallback(() => {
    const defaultTree = fileStructureOverride ?? fileStructure;
    const firstFile = findFirstOpenableFile(defaultTree);
    setStarterCodeUpload(null);
    replaceFileStructure(defaultTree);
    setSelectedFile(firstFile);
    setOpenFiles(firstFile ? [firstFile] : []);
    setPreviewPath("index.html");
  }, [fileStructureOverride, replaceFileStructure, setOpenFiles, setSelectedFile]);
  const getDevPanelShareParams = useCallback((): Record<string, string> | null => {
    const starterShareResult = encodeStarterSharePayload(shareableStarterCodeUpload);
    if ("reason" in starterShareResult) {
      window.alert(starterShareResult.reason);
      return null;
    }

    return starterShareResult.encoded
      ? { [STARTER_SHARE_PARAM]: starterShareResult.encoded }
      : {};
  }, [shareableStarterCodeUpload]);

  const resolvedVisualCue = resolved.instructionsDrawerVisualCue as InstructionsDrawerVisualCue;
  const resolvedInstructionsMarkdown = String(resolved[INSTRUCTIONS_MARKDOWN_DEV_KEY] ?? "");
  const resolvedInstructionsContent = resolvedInstructionsMarkdown.trim()
    ? <MarkdownInstructions markdown={resolvedInstructionsMarkdown} />
    : undefined;
  const continueInHeader = resolved.continueButtonPlacement === "header";
  const topNavigationSubtitle = useFunctionalVersionHistory
    ? formatSavedSubtitle(latestSavedAt, subtitleNow)
    : FIXED_SAVED_SUBTITLE;
  const resolvedRubrics = useMemo(
    () => applyRubricDevSettings(editableRubrics, {
      name: String(resolved.rubricName ?? ""),
      feedback: String(resolved.rubricTeacherFeedback ?? ""),
      status: resolvedRubricStatus,
      selectedCategoryId: String(resolved.rubricSelectedCategoryId ?? ""),
    }),
    [
      editableRubrics,
      resolved.rubricName,
      resolved.rubricSelectedCategoryId,
      resolved.rubricTeacherFeedback,
      resolvedRubricStatus,
    ],
  );
  const resolvedShowRubricTab = Boolean(resolved.showRubricTab);
  const resolvedShowStudentLessonResource = Boolean(
    resolved.showStudentLessonResource,
  );
  const resolvedShowDocumentationResource = Boolean(
    resolved.showDocumentationResource,
  );
  const resolvedShowWalkthroughResources = Boolean(
    resolved.showWalkthroughResources,
  );
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
  const topNavigationProps: ComponentProps<typeof Lab2Shell>["topNavigationProps"] = {
    title: resolved.title as string,
    subtitle: topNavigationSubtitle,
    currentLevel,
    totalLevels,
    completedLevels,
    levelLinks: levelLinks ?? webLab2LevelLinks,
    currentLevelPath,
    completedLevelPaths,
    showContinueButton: continueInHeader,
    onContinue,
    continueLabel,
  };
  const sidebarProps: Extract<
    ComponentProps<typeof Lab2Shell>,
    { sidebarProps: unknown }
  >["sidebarProps"] = {
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
    collapsible: resolvedEnableSidebarCollapse,
    defaultCollapsed: resolvedEnableSidebarCollapse && resolvedCollapseSidebarByDefault,
    instructionsDrawerInitialHeightRatio:
      resolved.instructionsDrawerInitialHeightRatio as number,
    showInstructionsDrawer: Boolean(resolved.showInstructionsDrawer),
    instructionsDrawerVisualCue: resolvedVisualCue,
    instructionsContent: resolvedInstructionsContent,
    aiTutorInputExperiment,
    mockTutorConfig: resolvedMockTutorConfig,
    onAddFileToProject: addFileToProject,
    availableTutorContextFiles,
    onTutorSubmit: resolvedTutorModeKind === "functional" ? handleTutorSubmit : undefined,
    onAcceptAiChanges: resolvedTutorModeKind === "functional" ? handleAcceptAiChanges : undefined,
    onRejectAiChanges: resolvedTutorModeKind === "functional" ? rejectAiProposal : undefined,
    isTutorRequestRunning,
    onTutorRequestRunningChange: setIsTutorRequestRunning,
    onOpenFileChangeInEditor: handleOpenFileChangeInEditor,
    onOpenFileChangeInPreview: resolvedUseFilePreview
      ? handleOpenFileChangeInPreview
      : undefined,
    onValidationReview: validationReviewConfig ? handleValidationReview : undefined,
    validationReviewOffer,
    showTutorModelSelector: resolvedShowTutorModelSelector,
    tutorRequestMode,
    setTutorRequestMode,
    hasPendingAiChanges,
    newProjectPlanQuestionnaireSignal,
    showRubricTab: resolvedShowRubricTab,
    showStudentLessonResource: resolvedShowStudentLessonResource,
    showDocumentationResource: resolvedShowDocumentationResource,
    showWalkthroughResources: resolvedShowWalkthroughResources,
    rubricData: resolvedRubrics,
    showContinueButton: !continueInHeader,
    onContinue,
    continueLabel,
    devPanelFields: webLab2DevFields,
    devPanelOverrideResult: overrideResult,
    devPanelSessionValues: {
      [STARTER_CODE_UPLOAD_DEV_KEY]: starterCodeUpload,
    },
    devPanelHasShareParams: Boolean(shareableStarterCodeUpload?.files?.length),
    devPanelShareParams: getDevPanelShareParams,
    onDevPanelSessionValueChange: (key, value) => {
      if (key === STARTER_CODE_UPLOAD_DEV_KEY) {
        handleStarterCodeUpload(value as StarterCodeUploadValue);
      }
    },
    onDevPanelSessionValueReset: (key) => {
      if (key === STARTER_CODE_UPLOAD_DEV_KEY) {
        handleStarterCodeReset();
      }
    },
  };
  const workspaceProps: ComponentProps<typeof Workspace> = {
    viewMode,
    setViewMode,
    fileStructure: visibleFileStructure,
    selectedFile: visibleSelectedFile,
    setSelectedFile,
    openFiles: visibleOpenFiles,
    openFolders,
    toggleFolder,
    openFile,
    closeFile,
    handleReorderFiles,
    isFileManagerCollapsed,
    setIsFileManagerCollapsed,
    setIsCreateFileModalOpen,
    setIsCreateFolderModalOpen,
    setIsCreatePlanModalOpen,
    enableFileDragToTutor: true,
    showOnlyFilesWithContent,
    onRequestRenameFile: (file, path) => setRenameTarget({ file, path }),
    onAddFileToTutor: handleAddFileToTutor,
    onStartWithTutor: handleStartWithTutor,
    onUploadStarterFiles: handleStarterFileUpload,
    starterUploadAccept: PROJECT_FILE_UPLOAD_ACCEPT,
    onUploadProjectFiles: handleProjectFileUpload,
    projectUploadAccept: PROJECT_FILE_UPLOAD_ACCEPT,
    showNewProjectEmptyState: showWorkspaceNewProjectEmptyState,
    onDeleteFile: (_file, path) => {
      deleteFile(path);
    },
    onMoveFileTreeItem: moveFileTreeItem,
    preview: previewConfig,
    selectedHistoryVersion,
    selectedHistoryVersionLabel,
    onReturnToCurrentVersion: handleReturnToCurrentVersion,
    aiChangedFiles: isViewingHistoryVersion ? undefined : aiChangedFiles,
    onAcceptAiChanges: () => handleBannerAiChangeAction("accepted"),
    onRejectAiChanges: () => handleBannerAiChangeAction("rejected"),
    builtPlanPaths,
    onFileContentChange: isViewingHistoryVersion ? undefined : updateFileContent,
    showPlanActionBar,
    planFileName: selectedPlanFileName,
    isPlanBuilt: isSelectedPlanCompleted,
    planStatusText,
    onBuildPlan: handleBuildCurrentPlan,
    showBuildPlan: !isSelectedPlanBuiltOrPending,
    buildPlanDisabled: isTutorRequestRunning || hasPendingAiChanges,
    buildPlanRunning: isSelectedPlanBuilding,
  };
  const handleSidebarResize = (delta: number) => {
    setSidebarWidth((prev) =>
      Math.max(300, Math.min(600, prev + delta))
    );
  };

  return (
    <>
      <Lab2Shell
        shareModeConfig={{ mode: shareMode }}
        topNavigationProps={topNavigationProps}
        sidebarProps={sidebarProps}
        onResize={handleSidebarResize}
      >
        <Workspace {...workspaceProps} />
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
        isOpen={isCreatePlanModalOpen}
        title="Create a new plan"
        description="Plan files live in the Plans section and are saved as Markdown."
        fieldLabel="Plan name"
        placeholder="PROJECT_PLAN.md"
        confirmLabel="Create plan"
        onClose={() => setIsCreatePlanModalOpen(false)}
        onSubmit={handleCreatePlan}
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
