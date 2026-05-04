import { AppButton } from "../../ui/AppButton";
import { PanelHeader } from "../../ui/PanelHeader";
import { Tooltip } from "../../ui/Tooltip";
import { DevPanelContent, DevPanelHeaderActions } from "../dev";
import { ContinueButton } from "./ContinueButton";
import { SettingsPanel } from "./views/SettingsPanel";
import { ValidationPanel } from "./views/ValidationPanel";
import { VersionHistory } from "./views/VersionHistory";
import { AiTutorPanel } from "./views/ai-tutor/AiTutorPanel";
import { TeacherResourcesPanel } from "./views/TeacherResourcesPanel";
import { RubricPanel } from "./views/RubricPanel";
import { ResourcesPanel } from "./views/ResourcesPanel";
import type { SidebarProps, SidebarTab } from "./Sidebar.types";
import styles from "./Sidebar.module.scss";

interface SidebarPanelContentProps {
  activeTab: SidebarTab;
  isSettingsOpen: SidebarProps["isSettingsOpen"];
  setIsSettingsOpen: SidebarProps["setIsSettingsOpen"];
  chatMessages: SidebarProps["chatMessages"];
  setChatMessages: SidebarProps["setChatMessages"];
  chatInput: SidebarProps["chatInput"];
  setChatInput: SidebarProps["setChatInput"];
  selectedHistoryVersion: SidebarProps["selectedHistoryVersion"];
  setSelectedHistoryVersion: SidebarProps["setSelectedHistoryVersion"];
  onSaveVersion: SidebarProps["onSaveVersion"];
  onRestoreVersion: SidebarProps["onRestoreVersion"];
  showRestoreSuccessAlert: NonNullable<SidebarProps["showRestoreSuccessAlert"]>;
  setShowRestoreSuccessAlert: SidebarProps["setShowRestoreSuccessAlert"];
  showSaveSuccessAlert: NonNullable<SidebarProps["showSaveSuccessAlert"]>;
  setShowSaveSuccessAlert: SidebarProps["setShowSaveSuccessAlert"];
  rubricData: SidebarProps["rubricData"];
  showStudentLessonResource: NonNullable<SidebarProps["showStudentLessonResource"]>;
  showDocumentationResource: NonNullable<SidebarProps["showDocumentationResource"]>;
  showWalkthroughResources: NonNullable<SidebarProps["showWalkthroughResources"]>;
  showContinueButton: NonNullable<SidebarProps["showContinueButton"]>;
  onContinue: SidebarProps["onContinue"];
  continueLabel: SidebarProps["continueLabel"];
  showInstructionsDrawer: NonNullable<SidebarProps["showInstructionsDrawer"]>;
  instructionsDrawerInitialHeightRatio: SidebarProps["instructionsDrawerInitialHeightRatio"];
  instructionsDrawerVisualCue: NonNullable<SidebarProps["instructionsDrawerVisualCue"]>;
  aiTutorInputExperiment: NonNullable<SidebarProps["aiTutorInputExperiment"]>;
  mockTutorConfig: NonNullable<SidebarProps["mockTutorConfig"]>;
  onAddFileToProject: SidebarProps["onAddFileToProject"];
  instructionsContent: SidebarProps["instructionsContent"];
  availableTutorContextFiles: SidebarProps["availableTutorContextFiles"];
  onTutorSubmit: SidebarProps["onTutorSubmit"];
  onAcceptAiChanges: SidebarProps["onAcceptAiChanges"];
  onRejectAiChanges: SidebarProps["onRejectAiChanges"];
  onOpenFileChangeInEditor: SidebarProps["onOpenFileChangeInEditor"];
  onOpenFileChangeInPreview: SidebarProps["onOpenFileChangeInPreview"];
  showTutorModelSelector: NonNullable<SidebarProps["showTutorModelSelector"]>;
  tutorRequestMode: NonNullable<SidebarProps["tutorRequestMode"]>;
  setTutorRequestMode: NonNullable<SidebarProps["setTutorRequestMode"]>;
  hasPendingAiChanges: NonNullable<SidebarProps["hasPendingAiChanges"]>;
  historyVersions: SidebarProps["historyVersions"];
  showNewProjectHistoryEmptyState: NonNullable<SidebarProps["showNewProjectHistoryEmptyState"]>;
  devPanelFields: SidebarProps["devPanelFields"];
  devPanelOverrideResult: SidebarProps["devPanelOverrideResult"];
  devPanelSessionValues: SidebarProps["devPanelSessionValues"];
  devPanelHasShareParams: SidebarProps["devPanelHasShareParams"];
  devPanelShareParams: SidebarProps["devPanelShareParams"];
  onDevPanelSessionValueChange: SidebarProps["onDevPanelSessionValueChange"];
  onDevPanelSessionValueReset: SidebarProps["onDevPanelSessionValueReset"];
  hasComposerContent: boolean;
  isTutorRequestRunning: boolean;
  clearTutorChatSignal: number;
  onClearTutorChat: () => void;
  onTutorRequestRunningChange: (running: boolean) => void;
}

const PANEL_LABEL: Record<SidebarTab, string> = {
  checklist: "VALIDATION",
  "ai-tutor": "AI TUTOR",
  history: "VERSION HISTORY",
  classroom: "TEACHER RESOURCES",
  rubric: "RUBRIC",
  resources: "RESOURCES",
  dev: "DEV PANEL",
};

export function SidebarPanelContent({
  activeTab,
  isSettingsOpen,
  setIsSettingsOpen,
  chatMessages,
  setChatMessages,
  chatInput,
  setChatInput,
  selectedHistoryVersion,
  setSelectedHistoryVersion,
  onSaveVersion,
  onRestoreVersion,
  showRestoreSuccessAlert,
  setShowRestoreSuccessAlert,
  showSaveSuccessAlert,
  setShowSaveSuccessAlert,
  rubricData,
  showStudentLessonResource,
  showDocumentationResource,
  showWalkthroughResources,
  showContinueButton,
  onContinue,
  continueLabel,
  showInstructionsDrawer,
  instructionsDrawerInitialHeightRatio,
  instructionsDrawerVisualCue,
  aiTutorInputExperiment,
  mockTutorConfig,
  onAddFileToProject,
  instructionsContent,
  availableTutorContextFiles,
  onTutorSubmit,
  onAcceptAiChanges,
  onRejectAiChanges,
  onOpenFileChangeInEditor,
  onOpenFileChangeInPreview,
  showTutorModelSelector,
  tutorRequestMode,
  setTutorRequestMode,
  hasPendingAiChanges,
  historyVersions,
  showNewProjectHistoryEmptyState,
  devPanelFields,
  devPanelOverrideResult,
  devPanelSessionValues,
  devPanelHasShareParams,
  devPanelShareParams,
  onDevPanelSessionValueChange,
  onDevPanelSessionValueReset,
  hasComposerContent,
  isTutorRequestRunning,
  clearTutorChatSignal,
  onClearTutorChat,
  onTutorRequestRunningChange,
}: SidebarPanelContentProps) {
  return (
    <div className={styles.content}>
      <PanelHeader
        label={PANEL_LABEL[activeTab]}
        right={
          activeTab === "ai-tutor" ? (
            <div className="flex gap-1">
              <Tooltip content="Clear chat" position="bottom">
                <AppButton
                  variant="tertiary"
                  tone="gray"
                  size="xs"
                  iconName="eraser"
                  onClick={onClearTutorChat}
                  disabled={
                    chatMessages.length === 0 &&
                    !hasComposerContent &&
                    !isTutorRequestRunning
                  }
                  aria-label="Clear AI Tutor chat"
                />
              </Tooltip>
            </div>
          ) : activeTab === "dev" && devPanelOverrideResult ? (
            <DevPanelHeaderActions
              hasShareParams={devPanelHasShareParams}
              devPanelShareParams={devPanelShareParams}
              overrideResult={devPanelOverrideResult}
            />
          ) : undefined
        }
      />

      {activeTab === "checklist" && <ValidationPanel />}
      {activeTab === "ai-tutor" && (
        <AiTutorPanel
          chatMessages={chatMessages}
          setChatMessages={setChatMessages}
          chatInput={chatInput}
          setChatInput={setChatInput}
          showInstructionsDrawer={showInstructionsDrawer}
          instructionsDrawerInitialHeightRatio={instructionsDrawerInitialHeightRatio}
          instructionsDrawerVisualCue={instructionsDrawerVisualCue}
          inputExperiment={aiTutorInputExperiment}
          mockTutorConfig={mockTutorConfig}
          onAddFileToProject={onAddFileToProject}
          instructionsContent={instructionsContent}
          availableContextFiles={availableTutorContextFiles}
          onTutorSubmit={onTutorSubmit}
          onAcceptAiChanges={onAcceptAiChanges}
          onRejectAiChanges={onRejectAiChanges}
          onOpenFileChangeInEditor={onOpenFileChangeInEditor}
          onOpenFileChangeInPreview={onOpenFileChangeInPreview}
          showModelSelector={showTutorModelSelector}
          tutorRequestMode={tutorRequestMode}
          setTutorRequestMode={setTutorRequestMode}
          hasPendingAiChanges={hasPendingAiChanges}
          isRequestRunning={isTutorRequestRunning}
          onRequestRunningChange={onTutorRequestRunningChange}
          clearChatSignal={clearTutorChatSignal}
        />
      )}
      {activeTab === "history" && (
        <VersionHistory
          versions={historyVersions}
          selectedVersion={selectedHistoryVersion}
          onVersionChange={setSelectedHistoryVersion}
          onSaveVersion={onSaveVersion}
          onRestoreVersion={onRestoreVersion}
          showRestoreSuccessAlert={showRestoreSuccessAlert}
          setShowRestoreSuccessAlert={setShowRestoreSuccessAlert}
          showSaveSuccessAlert={showSaveSuccessAlert}
          setShowSaveSuccessAlert={setShowSaveSuccessAlert}
          showNewProjectEmptyState={showNewProjectHistoryEmptyState}
        />
      )}
      {activeTab === "classroom" && <TeacherResourcesPanel />}
      {activeTab === "rubric" && rubricData && (
        <RubricPanel
          rubrics={Array.isArray(rubricData) ? rubricData : [rubricData]}
        />
      )}
      {activeTab === "resources" && (
        <ResourcesPanel
          showStudentLessonResource={showStudentLessonResource}
          showDocumentationResource={showDocumentationResource}
          showWalkthroughResources={showWalkthroughResources}
        />
      )}
      {activeTab === "dev" && devPanelFields && devPanelOverrideResult && (
        <DevPanelContent
          fields={devPanelFields}
          overrideResult={devPanelOverrideResult}
          sessionValues={devPanelSessionValues}
          onSessionValueChange={onDevPanelSessionValueChange}
          onSessionValueReset={onDevPanelSessionValueReset}
        />
      )}

      {showContinueButton && (
        <div className={styles.continueBar}>
          <ContinueButton onClick={onContinue} label={continueLabel} />
        </div>
      )}

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
