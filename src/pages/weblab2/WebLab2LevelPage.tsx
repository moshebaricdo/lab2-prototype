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
import type { ChatAttachment, ChatMessage, FileChange } from "../../types/chat";
import { hydrateChatMessageUploadImages } from "../../lib/chat/chatSessionStorage";
import { useChatState } from "../../hooks/useChatState";
import { useDevPanelInitialOpenFiles } from "../../hooks/useDevPanelInitialOpenFiles";
import { useFileWorkspaceState } from "../../hooks/useFileWorkspaceState";
import { useLayoutState, type ResourcePanelTab } from "../../hooks/useLayoutState";
import { DRAWER_IMPROVEMENTS_TUTOR_TAB_OPENING_MESSAGE } from "../../data/weblab2/drawerImprovements";
import { useVersionHistoryState } from "../../hooks/useVersionHistoryState";
import { usePropsOverride } from "../../hooks/usePropsOverride";
import type { DevPanelField } from "../../components/lab2/dev";
import {
  EDITOR_READ_ONLY_STORAGE_KEY,
  setEditorReadOnlyOverride,
} from "../../hooks/useEditorReadOnly";
import {
  useLevelShareMode,
  type ShareModeConfig,
} from "../../hooks/useLevelShareMode";
import { isProgressionLevelLinks } from "../../lib/levelShareLinks";
import { useTutorApiSettings } from "../../hooks/useTutorApiSettings";
import { webLab2LevelLinks } from "../levelTypeLinks";
import type { LevelProgressLink } from "../../components/ui/header/LevelProgressBubbles";
import {
  isInstructionsTabDrawerExperiment,
  type InstructionsDrawerExperiment,
  type InstructionsDrawerVisualCue,
} from "../../components/lab2/resource-panel/InstructionsDrawer";
import { MarkdownInstructions } from "../../components/lab2/resource-panel/MarkdownInstructions";
import type { RubricData } from "../../components/lab2/resource-panel/views/RubricPanel";
import type {
  ValidationContinueMode,
  ValidationReviewCardData,
  WebLab2ValidationReviewConfig,
} from "../../types/validationReview";
import {
  assessmentNeedsVersionHistorySnapshots,
  buildVersionHistoryValidationSummary,
  createValidationReview,
  createValidationReviewOffer,
} from "../../lib/validation/validationHarness";
import { createAiWebLab2ValidationReview } from "../../lib/validation/aiWebLab2Review";
import { resolveValidationReviewProfile } from "../../lib/validation/validationReviewProfile";
import { buildLevelProgressSnapshot } from "../../lib/validation/levelProgress";
import { PROJECT_PLAN_FILE } from "../../lib/tutor/runners/planningRunner";
import { logTutorEvent } from "../../lib/tutor/conversation/tutorDebugLogger";
import {
  appendValidationReviewResultToConversation,
} from "../../lib/tutor/routing/validationReviewFlow";
import { buildValidationReviewResultMessage } from "../../components/lab2/resource-panel/views/ai-tutor/AiTutorPanel";
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
  TutorPolicyPreset,
  TutorSupportContext,
  InstructionGuideState,
} from "../../types/tutor";
import type { ViewMode } from "../../types/ui";
import {
  findFileByNameInTree,
  flattenTutorContextFiles,
  mapFilesToTree,
  pathBasename,
} from "../../utils/fileTree";
import {
  buildFileTreeWithChatAttachments,
  buildFileTreeWithRootChatAttachments,
  canAddTutorUploadToProjectRoot,
  canStageTutorUploadInProject,
  getProjectFileNames,
  getRootUploadProjectPath,
  getStagedUploadProjectPath,
  isRootTutorUploadInProject,
  isStagedTutorUploadInProject,
  removeStagedTutorUploadFromTree,
} from "../../components/lab2/resource-panel/views/ai-tutor/tutorAttachmentToProject";
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
  resolveValidationContinueMode,
  resolveVersionHistoryMode,
  resolveViewMode,
  STARTER_CODE_UPLOAD_DEV_KEY,
  TUTOR_INSTRUCTIONS_DELIVERY_DEV_KEY,
  VALIDATION_REQUIREMENTS_DEV_KEY,
  webLab2BaseDevFields,
  webLab2ResourcesTabDevFields,
  type VersionHistoryMode,
} from "./webLab2DevPanel";
import {
  ALLOW_TUTOR_BUILD_DEV_KEY,
  ALLOW_TUTOR_HELP_DEV_KEY,
  ALLOW_TUTOR_PLAN_DEV_KEY,
  resolveWebLab2TutorDevSettings,
  TUTOR_BUILD_CONTRACT_DEV_KEY,
  TUTOR_HELP_CONTRACT_DEV_KEY,
  TUTOR_PLAN_CONTRACT_DEV_KEY,
  TUTOR_POLICY_PRESET_DEV_KEY,
  TUTOR_ROUTING_DIAGNOSTICS_DEV_KEY,
} from "./tutorDevSettings";
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
  filterTutorStagedUploadsFromWorkspaceTree,
  formatSavedSubtitle,
  getInitialInlineImageContentMap,
  hasAcceptedCompletedPlanStatus,
  hasCompletedPlanStatus,
  hasWorkspaceProjectFiles,
  hydrateInlineImageContent,
  isPlanFilePath,
  mergeTutorStagedUploadsIntoWorkspaceTree,
  stripInitialInlineImageContent,
} from "../../components/ide/weblab2/webLab2FileTree";
import {
  formatInitialOpenFilesProp,
  INITIAL_OPEN_FILES_DEV_KEY,
  parseInitialOpenFilesConfig,
  resolveOpenFilesForTree,
  type InitialOpenFilesProp,
} from "../../lib/editor/initialOpenFiles";
import { useWebLab2Preview } from "../../components/ide/weblab2/useWebLab2Preview";
import { useWebLab2TutorFlow } from "../../components/ide/weblab2/useWebLab2TutorFlow";
import {
  runInstructionAnalysis,
  toInstructionAnalysisOpeningCache,
  type InstructionAnalysisOpeningCache,
} from "../../lib/tutor/instruction/instructionAnalysisRunner";
import {
  TUTOR_INSTRUCTION_API_KEY_PINNED_STEP,
  TUTOR_INSTRUCTION_LOADING_PINNED_STEP,
} from "../../lib/tutor/instruction/instructionDelivery";
import { deriveInstructionPinnedStep } from "../../lib/tutor/instruction/instructionPinnedStep";
import { buildInstructionGuide } from "../../lib/tutor/instruction/instructionGuide";
import {
  resetInstructionGuideState,
  syncInstructionGuideStateWithLevelProgress,
} from "../../lib/tutor/instruction/instructionCoach";

const OPEN_TUTOR_PANEL_EVENT = "weblab:open-tutor-panel";

function parseValidationRequirements(value: unknown, fallback: string[] = []) {
  if (typeof value !== "string") return fallback;
  const parsed = value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
  return parsed.length > 0 ? parsed : fallback;
}

function stripValidationRequirementLabel(requirement: string) {
  return requirement.replace(/^\[([^\]]+)\]\s+(.+)$/, "$2").trim();
}

function getValidationRequirementLabel(requirement: string) {
  const match = requirement.match(/^\[([^\]]+)\]\s+(.+)$/);
  return match?.[1]?.trim();
}

function sameRequirements(left: string[] = [], right: string[] = []) {
  return left.length === right.length &&
    left.every((requirement, index) => requirement === right[index]);
}

function formatValidationRequirementsForDevPanel(
  config?: WebLab2ValidationReviewConfig,
) {
  if (!config) return "";
  return config.goals.map((goal, index) => {
    const label = config.goalLabels?.[index]?.trim();
    if (!label || label === goal) return goal;
    return `[${label}] ${goal}`;
  }).join("\n");
}

interface WebLab2LevelPageProps {
  currentLevelPath?: string;
  title?: string;
  instructionsDrawerInitialHeightRatio?: number;
  instructionsDrawerVisualCue?: InstructionsDrawerVisualCue;
  instructionsDrawerExperiment?: InstructionsDrawerExperiment;
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
  /** When true, Tutor greets students with an instruction guide and the drawer starts collapsed. */
  tutorInstructionsDelivery?: boolean;
  /** When true, show the sidebar collapse/expand control. */
  enableSidebarCollapse?: boolean;
  /** When true, the sidebar starts collapsed if sidebar collapse is enabled. */
  collapseSidebarByDefault?: boolean;
  /** When true, condense the resource panel rail to 40px. */
  resourcePanelCompact?: boolean;
  /** Optional markdown content to pre-seed the instructions drawer editor. */
  instructionsMarkdown?: string;
  /** Where to render the Continue button: "sidebar" (bottom bar) or "header" (next to bubbles). */
  continueButtonPlacement?: "sidebar" | "header";
  /** Workspace view selected when the level first loads. */
  initialViewMode?: ViewMode;
  /** File paths to open when the level loads. Pass a newline string or an array of paths. */
  initialOpenFiles?: InitialOpenFilesProp;
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
  /** When false, Tutor composer uploads stay in chat only for mock upload-mechanism demos. */
  enableTutorUploadStaging?: boolean;
  tutorSupportContext?: TutorSupportContext;
  tutorPolicyPreset?: TutorPolicyPreset;
  allowTutorBuild?: boolean;
  allowTutorPlan?: boolean;
  allowTutorHelp?: boolean;
  tutorBuildContract?: string;
  tutorPlanContract?: string;
  tutorHelpContract?: string;
  validationReviewConfig?: WebLab2ValidationReviewConfig;
  validationContinueMode?: ValidationContinueMode;
  levelLinks?: LevelProgressLink[];
  completedLevelPaths?: string[];
  currentLevel?: number;
  totalLevels?: number;
  completedLevels?: number[];
  continueLabel?: string;
  onContinue?: () => void;
  hideProgression?: boolean;
}

export function WebLab2LevelPage({
  currentLevelPath = "/levels/weblab2",
  title = "Web Lab 2: Intro Project",
  instructionsDrawerInitialHeightRatio,
  instructionsDrawerVisualCue = "none",
  instructionsDrawerExperiment = "default",
  autoSeedTutorConversation = false,
  aiTutorInputExperiment = "default",
  showRubricTab = false,
  rubricData,
  tutorMode,
  fileStructureOverride,
  previewContent,
  showInstructionsDrawer,
  tutorInstructionsDelivery = false,
  enableSidebarCollapse = false,
  collapseSidebarByDefault = false,
  resourcePanelCompact = false,
  instructionsMarkdown = defaultInstructionsMarkdown,
  continueButtonPlacement = "sidebar",
  initialViewMode = "code",
  initialOpenFiles,
  collapseFileManagerByDefault = false,
  useFilePreview = false,
  enableDesignMode = true,
  versionHistoryMode,
  showOnlyFilesWithContent = false,
  showStudentLessonResource = false,
  showDocumentationResource = true,
  showWalkthroughResources = false,
  storageKeySuffix,
  enableTutorUploadStaging = true,
  tutorSupportContext = "curriculum-level",
  tutorPolicyPreset = "route-default",
  allowTutorBuild = true,
  allowTutorPlan,
  allowTutorHelp = true,
  tutorBuildContract = "",
  tutorPlanContract = "",
  tutorHelpContract = "",
  validationReviewConfig,
  validationContinueMode = "standard",
  levelLinks,
  completedLevelPaths,
  currentLevel = 9,
  totalLevels = 10,
  completedLevels = [1, 2, 3],
  continueLabel,
  onContinue,
  hideProgression = false,
}: WebLab2LevelPageProps = {}) {
  const shareMode = useLevelShareMode();
  const { hasApiKey: hasTutorApiKey } = useTutorApiSettings();
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
  const routeAllowTutorPlan = allowTutorPlan ?? tutorSupportContext === "standalone-project";
  const defaults = {
    instructionsDrawerInitialHeightRatio:
      instructionsDrawerInitialHeightRatio ?? 0.6,
    showInstructionsDrawer: showInstructionsDrawer ?? true,
    [TUTOR_INSTRUCTIONS_DELIVERY_DEV_KEY]: tutorInstructionsDelivery,
    enableSidebarCollapse,
    collapseSidebarByDefault,
    resourcePanelCompact,
    [INSTRUCTIONS_MARKDOWN_DEV_KEY]: instructionsMarkdown,
    instructionsDrawerVisualCue,
    instructionsDrawerExperiment,
    autoSeedTutorConversation,
    tutorModeKind: routeTutorMode.kind,
    [TUTOR_POLICY_PRESET_DEV_KEY]: tutorPolicyPreset,
    [ALLOW_TUTOR_BUILD_DEV_KEY]: allowTutorBuild,
    [ALLOW_TUTOR_PLAN_DEV_KEY]: routeAllowTutorPlan,
    [ALLOW_TUTOR_HELP_DEV_KEY]: allowTutorHelp,
    [TUTOR_BUILD_CONTRACT_DEV_KEY]: tutorBuildContract,
    [TUTOR_PLAN_CONTRACT_DEV_KEY]: tutorPlanContract,
    [TUTOR_HELP_CONTRACT_DEV_KEY]: tutorHelpContract,
    [TUTOR_ROUTING_DIAGNOSTICS_DEV_KEY]: true,
    continueButtonPlacement,
    initialViewMode,
    collapseFileManagerByDefault,
    useFilePreview,
    enableDesignMode,
    [EDITOR_READ_ONLY_STORAGE_KEY]: false,
    [INITIAL_OPEN_FILES_DEV_KEY]: formatInitialOpenFilesProp(initialOpenFiles),
    versionHistoryMode:
      versionHistoryMode ?? (routeTutorMode.kind === "functional" ? "functional" : "mock"),
    showRubricTab,
    showStudentLessonResource,
    showDocumentationResource,
    showWalkthroughResources,
    validationContinueMode,
    [VALIDATION_REQUIREMENTS_DEV_KEY]:
      formatValidationRequirementsForDevPanel(validationReviewConfig),
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
  const stripInitialImagesForFileStorage = useCallback(
    (tree: FileItem[]) =>
      stripInitialInlineImageContent(tree, initialInlineImageContentByPath),
    [initialInlineImageContentByPath],
  );
  const stripInitialImagesAndUploadsForHistory = useCallback(
    (tree: FileItem[]) =>
      stripInitialInlineImageContent(
        filterTutorStagedUploadsFromWorkspaceTree(tree),
        initialInlineImageContentByPath,
      ),
    [initialInlineImageContentByPath],
  );
  const shouldCollapseEmptyFileManager =
    !hasWorkspaceProjectFiles(initialFileStructure);
  const resolvedCollapseFileManagerByDefault = Boolean(
    resolved.collapseFileManagerByDefault || shouldCollapseEmptyFileManager,
  );
  const resolvedUseFilePreview = Boolean(resolved.useFilePreview);
  const resolvedEnableDesignMode = Boolean(resolved.enableDesignMode);
  const resolvedEditorReadOnlyOverride = Boolean(resolved[EDITOR_READ_ONLY_STORAGE_KEY]);
  const parsedInitialOpenFiles = useMemo(
    () => parseInitialOpenFilesConfig(resolved[INITIAL_OPEN_FILES_DEV_KEY]),
    [resolved],
  );
  const resolvedInstructionsMarkdown = String(resolved[INSTRUCTIONS_MARKDOWN_DEV_KEY] ?? "");
  const resolvedTutorInstructionsDelivery = Boolean(
    resolved[TUTOR_INSTRUCTIONS_DELIVERY_DEV_KEY],
  );
  const [instructionGuide, setInstructionGuide] = useState<ReturnType<typeof buildInstructionGuide>>();
  const [instructionAnalysisOpening, setInstructionAnalysisOpening] =
    useState<InstructionAnalysisOpeningCache>();
  const [isInstructionAnalysisPending, setIsInstructionAnalysisPending] = useState(false);
  const [instructionGuideState, setInstructionGuideState] =
    useState<InstructionGuideState | undefined>();
  useEffect(() => {
    setInstructionGuideState((current) =>
      resetInstructionGuideState(instructionGuide, current)
    );
  }, [instructionGuide]);
  const resolvedEnableSidebarCollapse = Boolean(resolved.enableSidebarCollapse);
  const resolvedCollapseSidebarByDefault = Boolean(resolved.collapseSidebarByDefault);
  const resolvedValidationContinueMode = resolveValidationContinueMode(
    resolved.validationContinueMode,
  );
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
      "Clear this level's saved file tree, version history, and AI Tutor chat, then reload the page?",
    );
    if (!confirmed) return;

    const prefixes = [
      `weblab2:file-structure:${currentLevelPath}`,
      `weblab2:version-history:${currentLevelPath}`,
      `weblab2:chat:${currentLevelPath}`,
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
      ...buildRubricsDevFields(rubricCategoryOptions),
      ...webLab2ResourcesTabDevFields,
      {
        key: "clearLevelSessionCache",
        label: "Clear level session cache",
        description:
          "Removes this route's saved file tree, version history, and AI Tutor chat, then reloads from the current fixture.",
        type: "action",
        buttonLabel: "Clear cache and reload",
        iconName: "eraser",
        group: "Session cache",
        onAction: handleClearLevelSessionCache,
      } satisfies DevPanelField,
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
  } = useLayoutState(
    (isInstructionsTabDrawerExperiment(instructionsDrawerExperiment)
      ? "instructions"
      : "ai-tutor") satisfies ResourcePanelTab,
  );
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
      initialOpenFilePaths: parsedInitialOpenFiles,
      storageFileStructureTransform: stripInitialImagesForFileStorage,
    },
  );
  const lastResolvedInitialViewModeRef = useRef(resolvedInitialViewMode);
  const lastResolvedFileManagerCollapsedRef = useRef(
    resolvedCollapseFileManagerByDefault,
  );
  const [latestValidationReview, setLatestValidationReview] =
    useState<ValidationReviewCardData | null>(null);
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
  const hasWelcomedOnTutorTabRef = useRef(false);
  const [tutorDrawerPulseSignal, setTutorDrawerPulseSignal] = useState(0);
  const { chatMessages, setChatMessages, chatInput, setChatInput } =
    useChatState(
      initialMockTutorConfig?.initialMessages ?? initialChatMessages,
      initialMockTutorConfig?.initialInput,
      { storageKey: `weblab2:chat:${routeStorageKey}` },
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
    [fileStructure, fileStructureOverride, fileStructureState],
  );
  const restoreFileStructurePreservingUploads = useCallback(
    (restoredFileStructure: FileItem[]) => {
      replaceFileStructure(
        mergeTutorStagedUploadsIntoWorkspaceTree(
          restoredFileStructure,
          getCurrentFileStructure(),
        ),
      );
    },
    [getCurrentFileStructure, replaceFileStructure],
  );
  const resolvedTutorModeKind =
    resolved.tutorModeKind === "functional" ? "functional" : "mock";
  const {
    snapshots: historySnapshots,
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
          onRestoreFileStructure: restoreFileStructurePreservingUploads,
          storageKey: `weblab2:version-history:${routeStorageKey}`,
          snapshotFileStructureTransform: stripInitialImagesAndUploadsForHistory,
          hasProjectFiles: hasWorkspaceProjectFiles,
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
  const currentFileStructureRef = useRef(currentFileStructure);
  useEffect(() => {
    currentFileStructureRef.current = currentFileStructure;
  }, [currentFileStructure]);
  useDevPanelInitialOpenFiles(
    currentFileStructure,
    resolved[INITIAL_OPEN_FILES_DEV_KEY],
    setOpenFiles,
    setSelectedFile,
  );
  const resolveStarterOpenFiles = useCallback((tree: FileItem[]) => (
    resolveOpenFilesForTree(tree, {
      initialOpenFilePaths: parsedInitialOpenFiles,
      fallback: findFirstOpenableFile,
    })
  ), [parsedInitialOpenFiles]);
  const effectiveValidationReviewConfig = useMemo(() => {
    if (!validationReviewConfig) return undefined;
    const rawRequirements = parseValidationRequirements(
      resolved[VALIDATION_REQUIREMENTS_DEV_KEY],
      validationReviewConfig.goals,
    );
    const goals = rawRequirements.map(stripValidationRequirementLabel);
    const devLabels = rawRequirements.map(getValidationRequirementLabel);
    const shouldUseConfiguredLabels = sameRequirements(goals, validationReviewConfig.goals);
    return {
      ...validationReviewConfig,
      goals,
      goalLabels: shouldUseConfiguredLabels
        ? validationReviewConfig.goalLabels
        : devLabels.map((label, index) => label ?? goals[index]),
    };
  }, [resolved, validationReviewConfig]);
  const instructionAnalysisSessionKey = useMemo(() => {
    if (!resolvedTutorInstructionsDelivery || !resolvedInstructionsMarkdown.trim()) {
      return "";
    }
    const keyPresence = hasTutorApiKey ? "keyed" : "unkeyed";
    if (!validationReviewConfig) {
      return `${keyPresence}\0${resolvedInstructionsMarkdown}`;
    }
    const rawRequirements = parseValidationRequirements(
      resolved[VALIDATION_REQUIREMENTS_DEV_KEY],
      validationReviewConfig.goals,
    );
    const goals = rawRequirements
      .map(stripValidationRequirementLabel)
      .filter((goal) => goal.trim());
    return `${keyPresence}\0${resolvedInstructionsMarkdown}\0${goals.join("\0")}`;
  }, [
    hasTutorApiKey,
    resolvedTutorInstructionsDelivery,
    resolvedInstructionsMarkdown,
    validationReviewConfig,
    resolved[VALIDATION_REQUIREMENTS_DEV_KEY],
  ]);
  const instructionAnalysisSessionRef = useRef<string | null>(null);
  useEffect(() => {
    if (!instructionAnalysisSessionKey) {
      instructionAnalysisSessionRef.current = null;
      setInstructionGuide(undefined);
      setInstructionAnalysisOpening(undefined);
      setIsInstructionAnalysisPending(false);
      return;
    }

    if (instructionAnalysisSessionRef.current === instructionAnalysisSessionKey) {
      return;
    }
    instructionAnalysisSessionRef.current = instructionAnalysisSessionKey;

    if (!hasTutorApiKey) {
      setInstructionGuide(undefined);
      setInstructionAnalysisOpening(undefined);
      setIsInstructionAnalysisPending(false);
      return;
    }

    const markdown = resolvedInstructionsMarkdown;
    setInstructionGuide(undefined);
    setInstructionAnalysisOpening(undefined);
    setIsInstructionAnalysisPending(true);

    const assessment = effectiveValidationReviewConfig?.goals.some((goal) => goal.trim())
      ? {
          goals: effectiveValidationReviewConfig.goals,
          goalLabels: effectiveValidationReviewConfig.goalLabels,
        }
      : undefined;

    let cancelled = false;
    void runInstructionAnalysis({
      instructionsMarkdown: markdown,
      assessment,
    }).then((result) => {
      if (cancelled) return;
      setInstructionGuide(result.guide);
      setInstructionAnalysisOpening(toInstructionAnalysisOpeningCache(result));
      setIsInstructionAnalysisPending(false);
    });

    return () => {
      cancelled = true;
    };
  }, [instructionAnalysisSessionKey, hasTutorApiKey, resolvedInstructionsMarkdown]);
  const tutorDevSettings = useMemo(
    () => resolveWebLab2TutorDevSettings({
      values: resolved,
      routeSupportContext: tutorSupportContext,
      hasValidationReviewConfig: Boolean(effectiveValidationReviewConfig),
      allowTutorBuild,
      allowTutorPlan: routeAllowTutorPlan,
      allowTutorHelp,
      tutorBuildContract,
      tutorPlanContract,
      tutorHelpContract,
    }),
    [
      allowTutorBuild,
      allowTutorHelp,
      effectiveValidationReviewConfig,
      resolved,
      routeAllowTutorPlan,
      tutorBuildContract,
      tutorHelpContract,
      tutorPlanContract,
      tutorSupportContext,
    ],
  );
  const validationReviewOffer = useMemo(
    () => effectiveValidationReviewConfig && tutorDevSettings.policy.capabilities.validationReview
      ? createValidationReviewOffer(
        effectiveValidationReviewConfig,
        resolvedInstructionsMarkdown,
      )
      : undefined,
    [
      effectiveValidationReviewConfig,
      resolvedInstructionsMarkdown,
      tutorDevSettings.policy.capabilities.validationReview,
    ],
  );
  const evaluateVersionHistory = useMemo(
    () => Boolean(
      effectiveValidationReviewConfig &&
      assessmentNeedsVersionHistorySnapshots(effectiveValidationReviewConfig),
    ),
    [effectiveValidationReviewConfig],
  );
  const versionHistorySummary = useMemo(() => {
    if (!evaluateVersionHistory || !useFunctionalVersionHistory) {
      return undefined;
    }

    return buildVersionHistoryValidationSummary(
      historySnapshots ?? [],
      currentFileStructure,
    );
  }, [
    currentFileStructure,
    evaluateVersionHistory,
    historySnapshots,
    useFunctionalVersionHistory,
  ]);
  const handleValidationReview = useCallback(async () => {
    if (!effectiveValidationReviewConfig) {
      throw new Error("Validation review requested without a review config.");
    }
    const reviewProfile = resolveValidationReviewProfile(
      effectiveValidationReviewConfig,
      { instructionsMarkdown: resolvedInstructionsMarkdown },
    );
    logTutorEvent("page validation review started", {
      title: reviewProfile.title,
      mode: reviewProfile.reviewMode,
      goalCount: effectiveValidationReviewConfig.goals.length,
      conversationTurns: chatMessages.length,
    });

    const fallbackReview = () => createValidationReview({
      config: effectiveValidationReviewConfig,
      instructionsMarkdown: resolvedInstructionsMarkdown,
      currentFileStructure,
      initialFileStructure,
      chatMessages,
      versionHistorySummary,
    });
    let review: ValidationReviewCardData;

    try {
      review = await createAiWebLab2ValidationReview({
        config: effectiveValidationReviewConfig,
        instructionsMarkdown: resolvedInstructionsMarkdown,
        currentFileStructure,
        initialFileStructure,
        chatMessages,
        versionHistorySummary,
      }) ?? fallbackReview();
      logTutorEvent("page validation review evaluated", {
        title: review.title,
        status: review.status,
        confidence: review.confidence,
        source: "ai-or-fallback",
        itemCount: review.items?.length ?? 0,
      });
    } catch (error) {
      logTutorEvent("page AI validation review fell back", error, "warn");
      console.warn("[WebLab2LevelPage] AI validation review fell back to local review", error);
      review = fallbackReview();
      logTutorEvent("page validation fallback evaluated", {
        title: review.title,
        status: review.status,
        confidence: review.confidence,
        itemCount: review.items?.length ?? 0,
      });
    }

    setLatestValidationReview(review);
    return review;
  }, [
    chatMessages,
    currentFileStructure,
    effectiveValidationReviewConfig,
    initialFileStructure,
    resolvedInstructionsMarkdown,
    versionHistorySummary,
  ]);
  useEffect(() => {
    setLatestValidationReview(null);
  }, [currentFileStructure]);
  const currentFileStructureWithHydratedImages = useMemo(
    () => hydrateInlineImageContent(
      currentFileStructure,
      initialInlineImageContentByPath,
    ),
    [currentFileStructure, initialInlineImageContentByPath],
  );
  useEffect(() => {
    const imageContentByPath = getInitialInlineImageContentMap(
      currentFileStructureWithHydratedImages,
    );
    if (imageContentByPath.size === 0) return;

    setChatMessages((messages) =>
      hydrateChatMessageUploadImages(messages, imageContentByPath),
    );
  }, [currentFileStructureWithHydratedImages, setChatMessages]);
  const showWorkspaceNewProjectEmptyState =
    !useFunctionalVersionHistory || showNewProjectHistoryEmptyState;
  const isViewingHistoryVersion =
    useFunctionalVersionHistory &&
    selectedHistoryVersion !== "current" &&
    Boolean(selectedHistoryFileStructure);
  const visibleFileStructure = useMemo(
    () => isViewingHistoryVersion && selectedHistoryFileStructure
      ? hydrateInlineImageContent(
          mergeTutorStagedUploadsIntoWorkspaceTree(
            selectedHistoryFileStructure,
            currentFileStructure,
          ),
          initialInlineImageContentByPath,
        )
      : currentFileStructureWithHydratedImages,
    [
      currentFileStructure,
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
  const levelProgress = useMemo(
    () => buildLevelProgressSnapshot(latestValidationReview),
    [latestValidationReview],
  );

  useEffect(() => {
    setInstructionGuideState((current) =>
      syncInstructionGuideStateWithLevelProgress(
        instructionGuide,
        current,
        levelProgress,
      ),
    );
  }, [instructionGuide, levelProgress]);

  const instructionPinnedStep = useMemo(() => {
    if (!resolvedTutorInstructionsDelivery) return undefined;
    if (!hasTutorApiKey) return TUTOR_INSTRUCTION_API_KEY_PINNED_STEP;
    if (isInstructionAnalysisPending || !instructionGuide) {
      return TUTOR_INSTRUCTION_LOADING_PINNED_STEP;
    }
    return deriveInstructionPinnedStep(
      instructionGuide,
      instructionGuideState,
      levelProgress,
      effectiveValidationReviewConfig,
    );
  }, [
    effectiveValidationReviewConfig,
    hasTutorApiKey,
    instructionGuide,
    instructionGuideState,
    isInstructionAnalysisPending,
    levelProgress,
    resolvedTutorInstructionsDelivery,
  ]);

  const tutorPolicy = tutorDevSettings.policy;
  const tutorRunnerContracts = tutorDevSettings.runnerContracts;
  const handleRejectAiChanges = useCallback(() => {
    logTutorEvent("proposal rejected", {
      pendingFileCount: Object.keys(aiChangedFiles ?? {}).length,
    });
    rejectAiProposal();
  }, [aiChangedFiles, rejectAiProposal]);
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
    runnerContracts: tutorRunnerContracts,
    levelInstructionsMarkdown: resolvedInstructionsMarkdown,
    levelProgress,
    instructionGuide,
    instructionGuideState,
    onInstructionGuideStateChange: setInstructionGuideState,
    tutorSupportContext: tutorPolicy.supportContext,
    tutorPolicy,
    routingDiagnostics: tutorDevSettings.routingDiagnostics,
    validationReviewOffer,
    useFilePreview: resolvedUseFilePreview,
    selectedPlanPath,
    hasPendingAiChanges,
    beginAiProposal,
    acceptAiProposal,
    rejectAiProposal: handleRejectAiChanges,
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
  const existingProjectFileNames = useMemo(
    () => [...getProjectFileNames(currentFileStructure)],
    [currentFileStructure],
  );
  const handleStageTutorUpload = useCallback((attachment: ChatAttachment): true | string => {
    const baseTree = currentFileStructureRef.current;
    const validation = canStageTutorUploadInProject(attachment, baseTree);
    if (validation !== true) return validation;

    if (isStagedTutorUploadInProject(baseTree, attachment)) {
      return true;
    }

    try {
      const nextTree = buildFileTreeWithChatAttachments(baseTree, [attachment]);
      currentFileStructureRef.current = nextTree;
      replaceFileStructure(nextTree);
      console.info("[WebLab2TutorUpload] staged in project", {
        fileName: attachment.fileName,
        path: attachment.path,
        projectPath: getStagedUploadProjectPath(attachment),
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
        hasImageDataUrl: Boolean(attachment.imageDataUrl),
        hasContent: Boolean(attachment.content?.trim()),
      });
      return true;
    } catch (error) {
      console.warn("[WebLab2TutorUpload] staging failed", {
        fileName: attachment.fileName,
        path: attachment.path,
        error,
      });
      return error instanceof Error
        ? error.message
        : "Unable to add that file to your project.";
    }
  }, [replaceFileStructure]);

  const handleAddTutorUploadToProjectRoot = useCallback((attachment: ChatAttachment): true | string => {
    const baseTree = currentFileStructureRef.current;
    const validation = canAddTutorUploadToProjectRoot(attachment, baseTree);
    if (validation !== true) return validation;

    if (isRootTutorUploadInProject(baseTree, attachment)) {
      return true;
    }

    try {
      const nextTree = buildFileTreeWithRootChatAttachments(baseTree, [attachment]);
      currentFileStructureRef.current = nextTree;
      replaceFileStructure(nextTree);
      console.info("[WebLab2TutorUpload] added to project root", {
        fileName: attachment.fileName,
        path: attachment.path,
        projectPath: getRootUploadProjectPath(attachment),
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
        hasImageDataUrl: Boolean(attachment.imageDataUrl),
        hasContent: Boolean(attachment.content?.trim()),
      });
      return true;
    } catch (error) {
      console.warn("[WebLab2TutorUpload] root add failed", {
        fileName: attachment.fileName,
        path: attachment.path,
        error,
      });
      return error instanceof Error
        ? error.message
        : "Unable to add that file to your project.";
    }
  }, [replaceFileStructure]);

  const handleRemoveStagedTutorUpload = useCallback((attachment: ChatAttachment) => {
    const baseTree = currentFileStructureRef.current;
    if (!isStagedTutorUploadInProject(baseTree, attachment)) return;
    const nextTree = removeStagedTutorUploadFromTree(baseTree, attachment);
    currentFileStructureRef.current = nextTree;
    replaceFileStructure(nextTree);
    console.info("[WebLab2TutorUpload] removed from project", {
      fileName: attachment.fileName,
      path: attachment.path,
      projectPath: getStagedUploadProjectPath(attachment),
    });
  }, [replaceFileStructure]);

  const handleStarterCodeUpload = useCallback((value: StarterCodeUploadValue | null | undefined) => {
    const uploadedFiles = value?.files ?? [];
    if (uploadedFiles.length === 0) return;
    const uploadValue = value ?? {
      files: uploadedFiles,
      uploadedAt: new Date().toISOString(),
    };

    try {
      const nextTree = buildFileTreeFromUploadedStarter(uploadedFiles);
      const { openFiles: nextOpenFiles, selectedFile: nextSelectedFile } =
        resolveStarterOpenFiles(nextTree);
      setStarterCodeUpload(uploadValue);
      replaceFileStructure(nextTree);
      setSelectedFile(nextSelectedFile);
      setOpenFiles(nextOpenFiles);
      if (nextSelectedFile?.type === "html") {
        setPreviewPath(nextSelectedFile.name);
      }
    } catch (error) {
      console.error("[WebLab2LevelPage] Unable to apply starter upload", error);
    }
  }, [replaceFileStructure, resolveStarterOpenFiles, setOpenFiles, setSelectedFile]);
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
    const { openFiles: nextOpenFiles, selectedFile: nextSelectedFile } =
      resolveStarterOpenFiles(defaultTree);
    setStarterCodeUpload(null);
    replaceFileStructure(defaultTree);
    setSelectedFile(nextSelectedFile);
    setOpenFiles(nextOpenFiles);
    setPreviewPath("index.html");
  }, [fileStructureOverride, replaceFileStructure, resolveStarterOpenFiles, setOpenFiles, setSelectedFile]);
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
  const resolvedDrawerExperiment =
    (resolved.instructionsDrawerExperiment as InstructionsDrawerExperiment) ??
    "default";
  const isInstructionsTabDrawerExperimentActive = isInstructionsTabDrawerExperiment(
    resolvedDrawerExperiment,
  );
  const isInstructionsTabNotificationHaloExperiment =
    resolvedDrawerExperiment === "instructions-tab-notification-halo";
  useEffect(() => {
    if (!isInstructionsTabDrawerExperimentActive) return;
    if (activeTab !== "ai-tutor") return;
    if (hasWelcomedOnTutorTabRef.current) return;
    hasWelcomedOnTutorTabRef.current = true;

    setChatMessages((current) => {
      if (current.length > 0) return current;
      return [
        {
          role: "assistant",
          content: DRAWER_IMPROVEMENTS_TUTOR_TAB_OPENING_MESSAGE,
        },
      ];
    });
    if (!isInstructionsTabNotificationHaloExperiment) {
      setTutorDrawerPulseSignal((signal) => signal + 1);
    }
  }, [
    activeTab,
    isInstructionsTabDrawerExperimentActive,
    isInstructionsTabNotificationHaloExperiment,
    setChatMessages,
  ]);
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
  const validationContinueRequiresReview = Boolean(
    effectiveValidationReviewConfig &&
    tutorDevSettings.policy.capabilities.validationReview &&
    resolvedValidationContinueMode === "require-successful-review",
  );
  const validationRunsThroughTutor = Boolean(
    effectiveValidationReviewConfig &&
    resolvedTutorModeKind === "functional" &&
    hasTutorApiKey &&
    tutorDevSettings.policy.capabilities.validationReview,
  );
  const validationContinueSatisfied =
    latestValidationReview?.status === "likely_complete";
  const resolvedContinueLabel = validationContinueRequiresReview &&
    !validationContinueSatisfied
    ? "Check my work"
    : continueLabel;
  const handleContinueAction = useCallback(() => {
    logTutorEvent("continue action clicked", {
      validationContinueRequiresReview,
      validationContinueSatisfied,
      label: resolvedContinueLabel,
    });
    if (!validationContinueRequiresReview || validationContinueSatisfied) {
      onContinue?.();
      return;
    }

    setActiveTab("ai-tutor");
    window.dispatchEvent(new CustomEvent(OPEN_TUTOR_PANEL_EVENT));
    setIsTutorRequestRunning(true);
    void handleValidationReview()
      .then((review) => {
        logTutorEvent("continue validation review completed", {
          status: review.status,
          confidence: review.confidence,
        });
        setChatMessages((current) => appendValidationReviewResultToConversation(
          current,
          review,
          buildValidationReviewResultMessage(review),
        ));
      })
      .catch((error) => {
        logTutorEvent("continue validation review failed", error, "error");
        console.error("[WebLab2LevelPage] Continue validation review failed", error);
        setChatMessages((current) => [
          ...current,
          {
            role: "assistant",
            content: "I had trouble checking your work. Try again in a moment.",
          },
        ]);
      })
      .finally(() => setIsTutorRequestRunning(false));
  }, [
    handleValidationReview,
    onContinue,
    setActiveTab,
    setChatMessages,
    setIsTutorRequestRunning,
    resolvedContinueLabel,
    validationContinueRequiresReview,
    validationContinueSatisfied,
  ]);
  const topNavigationProps: ComponentProps<typeof Lab2Shell>["topNavigationProps"] = {
    title: resolved.title as string,
    subtitle: topNavigationSubtitle,
    currentLevel,
    totalLevels,
    completedLevels,
    levelLinks: levelLinks ?? webLab2LevelLinks,
    currentLevelPath,
    completedLevelPaths,
    showContinueButton: continueInHeader && !validationRunsThroughTutor,
    onContinue: handleContinueAction,
    continueLabel: resolvedContinueLabel,
    hideProgression,
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
    compact: Boolean(resolved.resourcePanelCompact),
    instructionsDrawerInitialHeightRatio:
      resolved.instructionsDrawerInitialHeightRatio as number,
    showInstructionsTab: isInstructionsTabDrawerExperimentActive,
    showAiTutorTabNotification:
      isInstructionsTabDrawerExperimentActive && activeTab !== "ai-tutor",
    showAiTutorTabNotificationPulse:
      isInstructionsTabNotificationHaloExperiment && activeTab !== "ai-tutor",
    showInstructionsDrawer: Boolean(resolved.showInstructionsDrawer),
    instructionsDrawerDefaultOpen: isInstructionsTabDrawerExperimentActive
      ? false
      : !resolvedTutorInstructionsDelivery,
    instructionsDrawerVisualCue: resolvedVisualCue,
    instructionsDrawerExperiment: resolvedDrawerExperiment,
    tutorDrawerPulseSignal,
    instructionGuide,
    instructionGuideState,
    onInstructionGuideStateChange: setInstructionGuideState,
    instructionAnalysisOpening,
    isInstructionAnalysisPending,
    tutorInstructionsDelivery: resolvedTutorInstructionsDelivery,
    instructionsMarkdown: resolvedInstructionsMarkdown,
    instructionPinnedStep,
    instructionsContent: resolvedInstructionsContent,
    aiTutorInputExperiment,
    mockTutorConfig: resolvedMockTutorConfig,
    existingProjectFileNames,
    onStageTutorUpload: enableTutorUploadStaging ? handleStageTutorUpload : undefined,
    onAddTutorUploadToProject: enableTutorUploadStaging
      ? undefined
      : handleAddTutorUploadToProjectRoot,
    onRemoveStagedTutorUpload: enableTutorUploadStaging ? handleRemoveStagedTutorUpload : undefined,
    availableTutorContextFiles,
    onTutorSubmit: resolvedTutorModeKind === "functional" ? handleTutorSubmit : undefined,
    onAcceptAiChanges: resolvedTutorModeKind === "functional" ? handleAcceptAiChanges : undefined,
    onRejectAiChanges: resolvedTutorModeKind === "functional" ? handleRejectAiChanges : undefined,
    isTutorRequestRunning,
    onTutorRequestRunningChange: setIsTutorRequestRunning,
    onOpenFileChangeInEditor: handleOpenFileChangeInEditor,
    onOpenFileChangeInPreview: resolvedUseFilePreview
      ? handleOpenFileChangeInPreview
      : undefined,
    onValidationReview: effectiveValidationReviewConfig ? handleValidationReview : undefined,
    onValidationReviewContinue: validationContinueRequiresReview && onContinue
      ? handleContinueAction
      : undefined,
    validationReviewContinueLabel: continueLabel,
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
    onContinue: handleContinueAction,
    continueLabel: resolvedContinueLabel,
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

  const effectiveLevelLinks = levelLinks ?? webLab2LevelLinks;
  const shareModeConfig = useMemo((): ShareModeConfig => {
    return {
      mode: shareMode,
      flowCompletion:
        shareMode === "flow" && isProgressionLevelLinks(effectiveLevelLinks)
          ? {
              title: "Task complete",
              message: "Thanks, you have completed this shared task.",
              buttonLabel: "Close",
            }
          : undefined,
    };
  }, [effectiveLevelLinks, shareMode]);

  return (
    <>
      <Lab2Shell
        shareModeConfig={shareModeConfig}
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
