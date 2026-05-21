import type { ComponentProps, ReactNode } from "react";
import type { DevPanelField } from "../dev";
import type { PropsOverrideResult } from "../../../hooks/usePropsOverride";
import type { UseAnnotationsResult } from "../../../hooks/useAnnotations";
import type { ChatMessage, FileChange } from "../../../types/chat";
import type {
  AiTutorInputExperiment,
  InstructionGuide,
  MockTutorConfig,
  TutorContextFile,
  TutorRequestMode,
  TutorSubmitHandler,
} from "../../../types/tutor";
import type { InstructionsDrawerVisualCue } from "./InstructionsDrawer";
import type { VersionHistory } from "./views/VersionHistory";
import type { RubricData } from "./views/RubricPanel";
import type { FileItem } from "../../../types/file";
import type { ValidationTestDefinition } from "../../../types/validation";
import type { ValidationReviewCardData } from "../../../types/validationReview";

export type SidebarTab =
  | "instructions"
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
  showInstructionsTab?: boolean;
  showValidationTab?: boolean;
  validationFileStructure?: FileItem[];
  validationTests?: ValidationTestDefinition[];
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
   * Defaults to disabled for Web Lab 2, enabled by assessment levels, and enabled for AI Chat Lab card mode.
   */
  collapsible?: boolean;
  /**
   * Initial collapsed state when `collapsible` is true.
   * Defaults to `collapsible` to preserve assessment-level behavior.
   */
  defaultCollapsed?: boolean;
  /**
   * Uses floating card chrome for lab layouts that do not run edge-to-edge.
   * Defaults to the standard edge-to-edge resource panel.
   */
  surfaceVariant?: "edge" | "card";
  /** Condenses the rail from 56px to 40px and uses smaller tab icons. */
  compact?: boolean;
  /** When false, the AI Tutor instructions drawer is hidden. Default true (Web Lab 2). */
  showInstructionsDrawer?: boolean;
  /** Initial open state for the AI Tutor instructions drawer. Default true. */
  instructionsDrawerDefaultOpen?: boolean;
  instructionsDrawerInitialHeightRatio?: number;
  instructionsDrawerVisualCue?: InstructionsDrawerVisualCue;
  instructionGuide?: InstructionGuide;
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
  onValidationReview?: () => ValidationReviewCardData | Promise<ValidationReviewCardData>;
  onValidationReviewContinue?: () => void;
  validationReviewContinueLabel?: string;
  showTutorModelSelector?: boolean;
  aiTutorComposerPlaceholder?: string;
  aiTutorEmptyStateTitle?: string;
  aiTutorEmptyStateText?: string;
  aiTutorSubmitFailureMessage?: string;
  tutorRequestMode?: TutorRequestMode;
  setTutorRequestMode?: (mode: TutorRequestMode) => void;
  hasPendingAiChanges?: boolean;
  newProjectPlanQuestionnaireSignal?: number;
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
