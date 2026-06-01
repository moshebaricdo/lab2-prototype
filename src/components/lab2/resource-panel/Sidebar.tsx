import { SettingsPanel } from "./views/SettingsPanel";
import { SidebarPanelContent } from "./SidebarPanelContent";
import { SidebarTabRail } from "./SidebarTabRail";
import { useEffect, useRef, useState } from "react";
import { defaultMockTutorConfig } from "../../../data/weblab2";
import type { SidebarProps, SidebarTab } from "./Sidebar.types";
import styles from "./Sidebar.module.scss";

const OPEN_TUTOR_PANEL_EVENT = "weblab:open-tutor-panel";
const TUTOR_PANEL_READY_EVENT = "weblab:tutor-panel-ready";
const SIDEBAR_WIDTH_ANIMATION_MS = 220;

export type { SidebarProps, SidebarTab } from "./Sidebar.types";

export function Sidebar({
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
  onSaveVersion,
  onRestoreVersion,
  showRestoreSuccessAlert = false,
  setShowRestoreSuccessAlert,
  showSaveSuccessAlert = false,
  setShowSaveSuccessAlert,
  showInstructionsTab = false,
  showAiTutorTabNotification = false,
  showAiTutorTabNotificationPulse = false,
  tutorDrawerPulseSignal = 0,
  showValidationTab = false,
  validationFileStructure,
  validationTests,
  showAiTutorTab = true,
  showHistoryTab = true,
  showTeacherResourcesTab = false,
  showRubricTab = false,
  showStudentLessonResource = false,
  showDocumentationResource = false,
  showWalkthroughResources = false,
  rubricData,
  showContinueButton = true,
  onContinue,
  continueLabel,
  collapsible = false,
  defaultCollapsed,
  surfaceVariant = "edge",
  compact = false,
  showInstructionsDrawer = true,
  instructionsDrawerDefaultOpen = true,
  instructionsDrawerInitialHeightRatio,
  instructionsDrawerVisualCue = "none",
  instructionsDrawerExperiment = "default",
  instructionGuide,
  instructionGuideState,
  onInstructionGuideStateChange,
  instructionsMarkdown,
  instructionPinnedStep,
  aiTutorInputExperiment = "default",
  mockTutorConfig = defaultMockTutorConfig,
  onStageTutorUpload,
  onAddTutorUploadToProject,
  onRemoveStagedTutorUpload,
  existingProjectFileNames,
  instructionsContent,
  availableTutorContextFiles,
  onTutorSubmit,
  onAcceptAiChanges,
  onRejectAiChanges,
  isTutorRequestRunning: externalTutorRequestRunning = false,
  onTutorRequestRunningChange,
  onOpenFileChangeInEditor,
  onOpenFileChangeInPreview,
  onValidationReview,
  onValidationReviewContinue,
  validationReviewContinueLabel,
  showTutorModelSelector = false,
  aiTutorComposerPlaceholder,
  aiTutorEmptyStateTitle,
  aiTutorEmptyStateText,
  aiTutorSubmitFailureMessage,
  tutorRequestMode = "auto",
  setTutorRequestMode,
  hasPendingAiChanges = false,
  newProjectPlanQuestionnaireSignal = 0,
  historyVersions,
  showNewProjectHistoryEmptyState = false,
  onCollapsedChange,
  devPanelFields,
  devPanelOverrideResult,
  devPanelSessionValues,
  devPanelHasShareParams,
  devPanelShareParams,
  onDevPanelSessionValueChange,
  onDevPanelSessionValueReset,
  annotations,
}: SidebarProps) {
  const showDevTab = Boolean(devPanelFields && devPanelOverrideResult);
  const showResourcesTab = Boolean(
    showStudentLessonResource ||
      showDocumentationResource ||
      showWalkthroughResources,
  );
  const [isCollapsed, setIsCollapsed] = useState(() =>
    Boolean(collapsible && (defaultCollapsed ?? collapsible)),
  );
  const [isWidthAnimating, setIsWidthAnimating] = useState(false);
  const [panelTutorRequestRunning, setPanelTutorRequestRunning] = useState(false);
  const [clearTutorChatSignal, setClearTutorChatSignal] = useState(0);
  const hasMountedCollapseStateRef = useRef(false);
  const hasComposerContent = Boolean(
    chatInput.trim() || mockTutorConfig?.initialAttachments?.length,
  );
  const effectiveTutorRequestRunning =
    panelTutorRequestRunning || externalTutorRequestRunning;

  useEffect(() => {
    if (!collapsible) {
      setIsCollapsed(false);
    }
  }, [collapsible]);

  useEffect(() => {
    if (!collapsible || defaultCollapsed === undefined) return;
    setIsCollapsed(defaultCollapsed);
  }, [collapsible, defaultCollapsed]);

  useEffect(() => {
    const openTutorPanel = () => {
      if (!showAiTutorTab) return;
      const needsSlideOpen = Boolean(collapsible && isCollapsed);
      setActiveTab("ai-tutor");
      if (collapsible) {
        setIsCollapsed(false);
      }
      window.setTimeout(
        () => window.dispatchEvent(new CustomEvent(TUTOR_PANEL_READY_EVENT)),
        needsSlideOpen ? SIDEBAR_WIDTH_ANIMATION_MS : 0,
      );
    };

    window.addEventListener(OPEN_TUTOR_PANEL_EVENT, openTutorPanel);
    return () => window.removeEventListener(OPEN_TUTOR_PANEL_EVENT, openTutorPanel);
  }, [collapsible, isCollapsed, setActiveTab, showAiTutorTab]);

  const onCollapsedChangeRef = useRef(onCollapsedChange);
  onCollapsedChangeRef.current = onCollapsedChange;

  useEffect(() => {
    onCollapsedChangeRef.current?.(Boolean(collapsible && isCollapsed));
  }, [collapsible, isCollapsed]);

  useEffect(() => {
    if (!hasMountedCollapseStateRef.current) {
      hasMountedCollapseStateRef.current = true;
      return undefined;
    }
    if (!collapsible) return undefined;

    setIsWidthAnimating(true);
    const timeoutId = window.setTimeout(
      () => setIsWidthAnimating(false),
      SIDEBAR_WIDTH_ANIMATION_MS,
    );
    return () => window.clearTimeout(timeoutId);
  }, [collapsible, isCollapsed]);

  useEffect(() => {
    const validTabs: SidebarTab[] = [];

    if (showInstructionsTab) validTabs.push("instructions");
    if (showValidationTab) validTabs.push("checklist");
    if (showAiTutorTab) validTabs.push("ai-tutor");
    if (showHistoryTab) validTabs.push("history");
    if (showTeacherResourcesTab) validTabs.push("classroom");
    if (showRubricTab) validTabs.push("rubric");
    if (showResourcesTab) validTabs.push("resources");
    if (showDevTab) validTabs.push("dev");

    if (!validTabs.includes(activeTab) && validTabs.length > 0) {
      setActiveTab(validTabs[0]);
    }
  }, [
    activeTab,
    setActiveTab,
    showAiTutorTab,
    showInstructionsTab,
    showHistoryTab,
    showTeacherResourcesTab,
    showRubricTab,
    showValidationTab,
    showDevTab,
    showResourcesTab,
  ]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (!showDevTab) return;
      if (effectiveTutorRequestRunning) return;
      if ((e.metaKey || e.ctrlKey) && e.key === ".") {
        e.preventDefault();
        if (activeTab === "dev") {
          const fallback: SidebarTab[] = [];
          if (showInstructionsTab) fallback.push("instructions");
          if (showAiTutorTab) fallback.push("ai-tutor");
          if (showValidationTab) fallback.push("checklist");
          setActiveTab(fallback[0] ?? "instructions");
        } else {
          setActiveTab("dev");
          if (collapsible && isCollapsed) {
            setIsCollapsed(false);
          }
        }
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showDevTab, effectiveTutorRequestRunning, activeTab, setActiveTab, showInstructionsTab, showAiTutorTab, showValidationTab, collapsible, isCollapsed]);

  const panelHidden = collapsible && isCollapsed;
  const railWidth = compact ? 40 : 56;
  const panelContentWidth = Math.max(0, sidebarWidth - railWidth);

  const isTabActive = (tab: SidebarTab) => !panelHidden && activeTab === tab;
  const isTabDisabled = (tab: SidebarTab) =>
    effectiveTutorRequestRunning && tab !== "ai-tutor";

  const selectTab = (tab: SidebarTab) => {
    if (isTabDisabled(tab)) return;
    setIsSettingsOpen(false);
    setActiveTab(tab);
    if (collapsible && isCollapsed) {
      setIsCollapsed(false);
    }
  };

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (next) {
        setIsSettingsOpen(false);
      }
      return next;
    });
  };

  const handleToggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  const handleClearTutorChat = () => {
    setChatMessages([]);
    setChatInput("");
    setClearTutorChatSignal((signal) => signal + 1);
  };

  const handleTutorRequestRunningChange = (isRunning: boolean) => {
    setPanelTutorRequestRunning(isRunning);
    onTutorRequestRunningChange?.(isRunning);
  };

  return (
    <div
      className={[
        styles.root,
        surfaceVariant === "card" ? styles.rootCard : "",
        compact ? styles.rootCompact : "",
        panelHidden ? styles.rootCollapsed : "",
        isWidthAnimating ? styles.rootWidthAnimating : "",
      ].filter(Boolean).join(" ")}
      style={{
        width: panelHidden ? `${railWidth}px` : `${sidebarWidth}px`,
      }}
    >
      <SidebarTabRail
        collapsible={collapsible}
        compact={compact}
        isCollapsed={isCollapsed}
        isSettingsOpen={isSettingsOpen}
        showInstructionsTab={showInstructionsTab}
        showValidationTab={showValidationTab}
        showAiTutorTab={showAiTutorTab}
        showHistoryTab={showHistoryTab}
        showTeacherResourcesTab={showTeacherResourcesTab}
        showRubricTab={showRubricTab}
        showResourcesTab={showResourcesTab}
        showDevTab={showDevTab}
        devPanelHasOverrides={devPanelOverrideResult?.hasOverrides}
        showAiTutorTabNotification={showAiTutorTabNotification}
        showAiTutorTabNotificationPulse={showAiTutorTabNotificationPulse}
        annotations={annotations}
        isTabActive={isTabActive}
        isTabDisabled={isTabDisabled}
        onSelectTab={selectTab}
        onToggleCollapse={handleToggleCollapse}
        onToggleSettings={handleToggleSettings}
      />

      <div
        className={styles.contentShell}
        aria-hidden={panelHidden}
      >
        <div
          className={styles.contentFixedWidth}
          style={{ width: `${panelContentWidth}px` }}
        >
          <SidebarPanelContent
            activeTab={activeTab}
            isSettingsOpen={panelHidden ? false : isSettingsOpen}
            setIsSettingsOpen={setIsSettingsOpen}
            chatMessages={chatMessages}
            setChatMessages={setChatMessages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            selectedHistoryVersion={selectedHistoryVersion}
            setSelectedHistoryVersion={setSelectedHistoryVersion}
            onSaveVersion={onSaveVersion}
            onRestoreVersion={onRestoreVersion}
            showRestoreSuccessAlert={showRestoreSuccessAlert}
            setShowRestoreSuccessAlert={setShowRestoreSuccessAlert}
            showSaveSuccessAlert={showSaveSuccessAlert}
            setShowSaveSuccessAlert={setShowSaveSuccessAlert}
            showInstructionsTab={showInstructionsTab}
            validationFileStructure={validationFileStructure}
            validationTests={validationTests}
            rubricData={rubricData}
            showStudentLessonResource={showStudentLessonResource}
            showDocumentationResource={showDocumentationResource}
            showWalkthroughResources={showWalkthroughResources}
            showContinueButton={showContinueButton}
            onContinue={onContinue}
            continueLabel={continueLabel}
            showInstructionsDrawer={showInstructionsDrawer}
            instructionsDrawerDefaultOpen={instructionsDrawerDefaultOpen}
            instructionsDrawerInitialHeightRatio={instructionsDrawerInitialHeightRatio}
            instructionsDrawerVisualCue={instructionsDrawerVisualCue}
            instructionsDrawerExperiment={instructionsDrawerExperiment}
            tutorDrawerPulseSignal={tutorDrawerPulseSignal}
            instructionGuide={instructionGuide}
            instructionGuideState={instructionGuideState}
            onInstructionGuideStateChange={onInstructionGuideStateChange}
            instructionsMarkdown={instructionsMarkdown}
            instructionPinnedStep={instructionPinnedStep}
            aiTutorInputExperiment={aiTutorInputExperiment}
            mockTutorConfig={mockTutorConfig}
            onStageTutorUpload={onStageTutorUpload}
            onAddTutorUploadToProject={onAddTutorUploadToProject}
            onRemoveStagedTutorUpload={onRemoveStagedTutorUpload}
            existingProjectFileNames={existingProjectFileNames}
            instructionsContent={instructionsContent}
            availableTutorContextFiles={availableTutorContextFiles}
            onTutorSubmit={onTutorSubmit}
            onAcceptAiChanges={onAcceptAiChanges}
            onRejectAiChanges={onRejectAiChanges}
            onOpenFileChangeInEditor={onOpenFileChangeInEditor}
            onOpenFileChangeInPreview={onOpenFileChangeInPreview}
            onValidationReview={onValidationReview}
            onValidationReviewContinue={onValidationReviewContinue}
            validationReviewContinueLabel={validationReviewContinueLabel}
            showTutorModelSelector={showTutorModelSelector}
            aiTutorComposerPlaceholder={aiTutorComposerPlaceholder}
            aiTutorEmptyStateTitle={aiTutorEmptyStateTitle}
            aiTutorEmptyStateText={aiTutorEmptyStateText}
            aiTutorSubmitFailureMessage={aiTutorSubmitFailureMessage}
            tutorRequestMode={tutorRequestMode}
            setTutorRequestMode={setTutorRequestMode ?? (() => undefined)}
            hasPendingAiChanges={hasPendingAiChanges}
            newProjectPlanQuestionnaireSignal={newProjectPlanQuestionnaireSignal}
            historyVersions={historyVersions}
            showNewProjectHistoryEmptyState={showNewProjectHistoryEmptyState}
            devPanelFields={devPanelFields}
            devPanelOverrideResult={devPanelOverrideResult}
            devPanelSessionValues={devPanelSessionValues}
            devPanelHasShareParams={devPanelHasShareParams}
            devPanelShareParams={devPanelShareParams}
            onDevPanelSessionValueChange={onDevPanelSessionValueChange}
            onDevPanelSessionValueReset={onDevPanelSessionValueReset}
            hasComposerContent={hasComposerContent}
            isTutorRequestRunning={effectiveTutorRequestRunning}
            clearTutorChatSignal={clearTutorChatSignal}
            onClearTutorChat={handleClearTutorChat}
            onTutorRequestRunningChange={handleTutorRequestRunningChange}
          />
        </div>
      </div>

      {panelHidden && isSettingsOpen && (
        <div className={styles.settingsFloatingWrap}>
          <SettingsPanel
            isOpen={isSettingsOpen}
            variant="floating"
            onClose={() => setIsSettingsOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
