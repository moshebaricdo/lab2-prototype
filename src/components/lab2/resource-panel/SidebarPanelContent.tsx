import { AppButton } from "../../ui/AppButton";
import { PanelHeader } from "../../ui/PanelHeader";
import { Tooltip } from "../../ui/Tooltip";
import { DevPanelContent, DevPanelHeaderActions } from "../dev";
import { ContinueButton } from "./ContinueButton";
import { SettingsPanel } from "./views/SettingsPanel";
import { ValidationPanel } from "./views/ValidationPanel";
import { VersionHistory } from "./views/VersionHistory";
import { InstructionsPanel } from "./views/InstructionsPanel";
import { AiTutorPanel } from "./views/ai-tutor/AiTutorPanel";
import { downloadChatLog } from "./views/ai-tutor/exportChatLog";
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
  showInstructionsTab: NonNullable<SidebarProps["showInstructionsTab"]>;
  validationFileStructure: SidebarProps["validationFileStructure"];
  validationTests: SidebarProps["validationTests"];
  rubricData: SidebarProps["rubricData"];
  showStudentLessonResource: NonNullable<SidebarProps["showStudentLessonResource"]>;
  showDocumentationResource: NonNullable<SidebarProps["showDocumentationResource"]>;
  showWalkthroughResources: NonNullable<SidebarProps["showWalkthroughResources"]>;
  showContinueButton: NonNullable<SidebarProps["showContinueButton"]>;
  onContinue: SidebarProps["onContinue"];
  continueLabel: SidebarProps["continueLabel"];
  showInstructionsDrawer: NonNullable<SidebarProps["showInstructionsDrawer"]>;
  instructionsDrawerDefaultOpen: NonNullable<SidebarProps["instructionsDrawerDefaultOpen"]>;
  instructionsDrawerInitialHeightRatio: SidebarProps["instructionsDrawerInitialHeightRatio"];
  instructionsDrawerVisualCue: NonNullable<SidebarProps["instructionsDrawerVisualCue"]>;
  instructionsDrawerExperiment: NonNullable<SidebarProps["instructionsDrawerExperiment"]>;
  tutorDrawerPulseSignal: NonNullable<SidebarProps["tutorDrawerPulseSignal"]>;
  instructionGuide: SidebarProps["instructionGuide"];
  instructionGuideState: SidebarProps["instructionGuideState"];
  onInstructionGuideStateChange: SidebarProps["onInstructionGuideStateChange"];
  instructionAnalysisOpening: SidebarProps["instructionAnalysisOpening"];
  isInstructionAnalysisPending: SidebarProps["isInstructionAnalysisPending"];
  tutorInstructionsDelivery: SidebarProps["tutorInstructionsDelivery"];
  instructionsMarkdown: SidebarProps["instructionsMarkdown"];
  instructionPinnedStep: SidebarProps["instructionPinnedStep"];
  aiTutorInputExperiment: NonNullable<SidebarProps["aiTutorInputExperiment"]>;
  mockTutorConfig: NonNullable<SidebarProps["mockTutorConfig"]>;
  onStageTutorUpload: SidebarProps["onStageTutorUpload"];
  onAddTutorUploadToProject: SidebarProps["onAddTutorUploadToProject"];
  onRemoveStagedTutorUpload: SidebarProps["onRemoveStagedTutorUpload"];
  existingProjectFileNames: SidebarProps["existingProjectFileNames"];
  instructionsContent: SidebarProps["instructionsContent"];
  availableTutorContextFiles: SidebarProps["availableTutorContextFiles"];
  onTutorSubmit: SidebarProps["onTutorSubmit"];
  onAcceptAiChanges: SidebarProps["onAcceptAiChanges"];
  onRejectAiChanges: SidebarProps["onRejectAiChanges"];
  onOpenFileChangeInEditor: SidebarProps["onOpenFileChangeInEditor"];
  onOpenFileChangeInPreview: SidebarProps["onOpenFileChangeInPreview"];
  onValidationReview: SidebarProps["onValidationReview"];
  onValidationReviewContinue: SidebarProps["onValidationReviewContinue"];
  validationReviewContinueLabel: SidebarProps["validationReviewContinueLabel"];
  showTutorModelSelector: NonNullable<SidebarProps["showTutorModelSelector"]>;
  aiTutorComposerPlaceholder: SidebarProps["aiTutorComposerPlaceholder"];
  aiTutorEmptyStateTitle: SidebarProps["aiTutorEmptyStateTitle"];
  aiTutorEmptyStateText: SidebarProps["aiTutorEmptyStateText"];
  aiTutorSubmitFailureMessage: SidebarProps["aiTutorSubmitFailureMessage"];
  tutorRequestMode: NonNullable<SidebarProps["tutorRequestMode"]>;
  setTutorRequestMode: NonNullable<SidebarProps["setTutorRequestMode"]>;
  hasPendingAiChanges: NonNullable<SidebarProps["hasPendingAiChanges"]>;
  newProjectPlanQuestionnaireSignal: NonNullable<SidebarProps["newProjectPlanQuestionnaireSignal"]>;
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
  instructions: "INSTRUCTIONS",
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
  showInstructionsTab,
  validationFileStructure,
  validationTests,
  rubricData,
  showStudentLessonResource,
  showDocumentationResource,
  showWalkthroughResources,
  showContinueButton,
  onContinue,
  continueLabel,
  showInstructionsDrawer,
  instructionsDrawerDefaultOpen,
  instructionsDrawerInitialHeightRatio,
  instructionsDrawerVisualCue,
  instructionsDrawerExperiment,
  tutorDrawerPulseSignal,
  instructionGuide,
  instructionGuideState,
  onInstructionGuideStateChange,
  instructionAnalysisOpening,
  isInstructionAnalysisPending,
  tutorInstructionsDelivery,
  instructionsMarkdown,
  instructionPinnedStep,
  aiTutorInputExperiment,
  mockTutorConfig,
  onStageTutorUpload,
  onAddTutorUploadToProject,
  onRemoveStagedTutorUpload,
  existingProjectFileNames,
  instructionsContent,
  availableTutorContextFiles,
  onTutorSubmit,
  onAcceptAiChanges,
  onRejectAiChanges,
  onOpenFileChangeInEditor,
  onOpenFileChangeInPreview,
  onValidationReview,
  onValidationReviewContinue,
  validationReviewContinueLabel,
  showTutorModelSelector,
  aiTutorComposerPlaceholder,
  aiTutorEmptyStateTitle,
  aiTutorEmptyStateText,
  aiTutorSubmitFailureMessage,
  tutorRequestMode,
  setTutorRequestMode,
  hasPendingAiChanges,
  newProjectPlanQuestionnaireSignal,
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
              <Tooltip content="Export chat log" position="bottom">
                <AppButton
                  variant="tertiary"
                  tone="gray"
                  size="xs"
                  iconName="download"
                  onClick={() => downloadChatLog(chatMessages)}
                  disabled={chatMessages.length === 0}
                  aria-label="Export AI Tutor chat log"
                />
              </Tooltip>
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

      {activeTab === "instructions" && showInstructionsTab && (
        <InstructionsPanel>{instructionsContent}</InstructionsPanel>
      )}
      {activeTab === "checklist" && (
        <ValidationPanel
          fileStructure={validationFileStructure}
          tests={validationTests}
        />
      )}
      {activeTab === "ai-tutor" && (
        <AiTutorPanel
          chatMessages={chatMessages}
          setChatMessages={setChatMessages}
          chatInput={chatInput}
          setChatInput={setChatInput}
          showInstructionsDrawer={showInstructionsDrawer}
          instructionsDrawerDefaultOpen={instructionsDrawerDefaultOpen}
          instructionsDrawerInitialHeightRatio={instructionsDrawerInitialHeightRatio}
          instructionsDrawerVisualCue={instructionsDrawerVisualCue}
          instructionsDrawerExperiment={instructionsDrawerExperiment}
          tutorDrawerPulseSignal={tutorDrawerPulseSignal}
          instructionGuide={instructionGuide}
          instructionGuideState={instructionGuideState}
          onInstructionGuideStateChange={onInstructionGuideStateChange}
          instructionAnalysisOpening={instructionAnalysisOpening}
          isInstructionAnalysisPending={isInstructionAnalysisPending}
          tutorInstructionsDelivery={tutorInstructionsDelivery}
          instructionsMarkdown={instructionsMarkdown}
          instructionPinnedStep={instructionPinnedStep}
          inputExperiment={aiTutorInputExperiment}
          mockTutorConfig={mockTutorConfig}
          onStageTutorUpload={onStageTutorUpload}
          onAddTutorUploadToProject={onAddTutorUploadToProject}
          onRemoveStagedTutorUpload={onRemoveStagedTutorUpload}
          existingProjectFileNames={existingProjectFileNames}
          instructionsContent={instructionsContent}
          availableContextFiles={availableTutorContextFiles}
          onTutorSubmit={onTutorSubmit}
          onAcceptAiChanges={onAcceptAiChanges}
          onRejectAiChanges={onRejectAiChanges}
          onOpenFileChangeInEditor={onOpenFileChangeInEditor}
          onOpenFileChangeInPreview={onOpenFileChangeInPreview}
          onValidationReview={onValidationReview}
          onValidationReviewContinue={onValidationReviewContinue}
          validationReviewContinueLabel={validationReviewContinueLabel}
          showModelSelector={showTutorModelSelector}
          composerPlaceholder={aiTutorComposerPlaceholder}
          emptyStateTitle={aiTutorEmptyStateTitle}
          emptyStateText={aiTutorEmptyStateText}
          submitFailureMessage={aiTutorSubmitFailureMessage}
          tutorRequestMode={tutorRequestMode}
          setTutorRequestMode={setTutorRequestMode}
          hasPendingAiChanges={hasPendingAiChanges}
          isRequestRunning={isTutorRequestRunning}
          onRequestRunningChange={onTutorRequestRunningChange}
          clearChatSignal={clearTutorChatSignal}
          newProjectPlanQuestionnaireSignal={newProjectPlanQuestionnaireSignal}
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
