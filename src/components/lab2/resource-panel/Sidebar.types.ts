import type { ComponentProps, ReactNode } from "react";
import type { DevPanelField } from "../dev";
import type { PropsOverrideResult } from "../../../hooks/usePropsOverride";
import type { UseAnnotationsResult } from "../../../hooks/useAnnotations";
import type { ChatMessage, FileChange } from "../../../types/chat";
import type {
  AiTutorInputExperiment,
  MockTutorConfig,
  TutorContextFile,
  TutorRequestMode,
  TutorSubmitHandler,
} from "../../../types/tutor";
import type { InstructionsDrawerVisualCue } from "./InstructionsDrawer";
import type { VersionHistory } from "./views/VersionHistory";
import type { RubricData } from "./views/RubricPanel";

export type SidebarTab =
  | "checklist"
  | "ai-tutor"
  | "history"
  | "classroom"
  | "rubric"
  | "resources"
  | "dev";

export type DevPanelShareParamsProvider = () => Record<string, string> | null;

export interface SidebarProps {
  activeTab: SidebarTab;
  setActiveTab: (tab: SidebarTab) => void;
  sidebarWidth: number;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  chatMessages: ChatMessage[];
  setChatMessages: (messages: ChatMessage[]) => void;
  chatInput: string;
  setChatInput: (input: string) => void;
  selectedHistoryVersion: string;
  setSelectedHistoryVersion: (version: string) => void;
  onSaveVersion?: (description: string) => void;
  onRestoreVersion?: (versionId: string) => void;
  showRestoreSuccessAlert?: boolean;
  setShowRestoreSuccessAlert?: (show: boolean) => void;
  showSaveSuccessAlert?: boolean;
  setShowSaveSuccessAlert?: (show: boolean) => void;
  showValidationTab?: boolean;
  showAiTutorTab?: boolean;
  showHistoryTab?: boolean;
  showTeacherResourcesTab?: boolean;
  showRubricTab?: boolean;
  showStudentLessonResource?: boolean;
  showDocumentationResource?: boolean;
  showWalkthroughResources?: boolean;
  /** Single rubric or up to four per level; navigation shows when multiple. */
  rubricData?: RubricData | RubricData[];
  showContinueButton?: boolean;
  /** Fires when the Continue button is clicked. */
  onContinue?: () => void;
  /** Override the default "Continue to Level 10" label. */
  continueLabel?: string;
  /**
   * When true, sidebar can be collapsed to a narrow strip.
   * Defaults to disabled for Web Lab 2 and enabled by assessment levels.
   */
  collapsible?: boolean;
  /**
   * Initial collapsed state when `collapsible` is true.
   * Defaults to `collapsible` to preserve assessment-level behavior.
   */
  defaultCollapsed?: boolean;
  /** When false, the AI Tutor instructions drawer is hidden. Default true (Web Lab 2). */
  showInstructionsDrawer?: boolean;
  instructionsDrawerInitialHeightRatio?: number;
  instructionsDrawerVisualCue?: InstructionsDrawerVisualCue;
  aiTutorInputExperiment?: AiTutorInputExperiment;
  mockTutorConfig?: MockTutorConfig;
  /** Callback to add a file to the project tree. */
  onAddFileToProject?: (fileName: string) => void;
  /** Custom content for the instructions drawer (replaces default copy). */
  instructionsContent?: ReactNode;
  availableTutorContextFiles?: TutorContextFile[];
  onTutorSubmit?: TutorSubmitHandler;
  onAcceptAiChanges?: (saveTitle?: string) => void;
  onRejectAiChanges?: () => void;
  isTutorRequestRunning?: boolean;
  onTutorRequestRunningChange?: (isRunning: boolean) => void;
  onOpenFileChangeInEditor?: (change: FileChange) => void;
  onOpenFileChangeInPreview?: (change: FileChange) => void;
  showTutorModelSelector?: boolean;
  tutorRequestMode?: TutorRequestMode;
  setTutorRequestMode?: (mode: TutorRequestMode) => void;
  hasPendingAiChanges?: boolean;
  historyVersions?: ComponentProps<typeof VersionHistory>["versions"];
  showNewProjectHistoryEmptyState?: boolean;
  /** Fires when `collapsible && isCollapsed` changes (for shell chrome such as resize handle). */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** When provided, a Dev tab appears in the rail with live prop controls. */
  devPanelFields?: DevPanelField[];
  devPanelOverrideResult?: PropsOverrideResult<Record<string, unknown>>;
  devPanelSessionValues?: Record<string, unknown>;
  devPanelHasShareParams?: boolean;
  devPanelShareParams?: DevPanelShareParamsProvider;
  onDevPanelSessionValueChange?: (key: string, value: unknown) => void;
  onDevPanelSessionValueReset?: (key: string) => void;
  /** Annotation mode state — passed down from Lab2Shell. */
  annotations?: UseAnnotationsResult;
}
