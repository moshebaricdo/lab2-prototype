import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClipboardCheck,
  faClockRotateLeft,
  faPersonChalkboard,
  faBook,
  faTriangleExclamation,
  faGear,
  faCopyright,
  faDownload,
  faEraser,
} from "@fortawesome/free-solid-svg-icons";
import { Tooltip } from "../ui/Tooltip";
import { AppButton } from "../ui/AppButton";
import { AiTutorIcon } from "../icons/AiTutorIcon";
import { FaIcon } from "../icons/FaIcon";
import { ValidationPanel } from "./views/ValidationPanel";
import { VersionHistory } from "./views/VersionHistory";
import { AiTutorPanel } from "./views/AiTutorPanel";
import type { AiTutorInputExperiment } from "./views/AiTutorPanel";
import { TeacherResourcesPanel } from "./views/TeacherResourcesPanel";
import { ContinueButton } from "./ContinueButton";
import { SettingsPanel } from "./views/SettingsPanel";
import type { ChatMessage } from "../../types/chat";
import type { InstructionsDrawerVisualCue } from "./InstructionsDrawer";
import { useEffect, useRef, useState } from "react";
import styles from "./Sidebar.module.scss";

export type SidebarTab = "checklist" | "ai-tutor" | "history" | "classroom";

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
  showContinueButton?: boolean;
  /**
   * When true, sidebar can be collapsed to a narrow strip (assessment levels). Disabled for Web Lab 2.
   * When true, the sidebar also starts collapsed by default.
   */
  collapsible?: boolean;
  /** When false, the AI Tutor instructions drawer is hidden. Default true (Web Lab 2). */
  showInstructionsDrawer?: boolean;
  instructionsDrawerInitialHeightRatio?: number;
  instructionsDrawerVisualCue?: InstructionsDrawerVisualCue;
  autoSeedConversationOnMount?: boolean;
  aiTutorInputExperiment?: AiTutorInputExperiment;
  /** Fires when `collapsible && isCollapsed` changes (for shell chrome such as resize handle). */
  onCollapsedChange?: (collapsed: boolean) => void;
}

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
  showValidationTab = false,
  showAiTutorTab = true,
  showHistoryTab = true,
  showTeacherResourcesTab = false,
  showContinueButton = true,
  collapsible = false,
  showInstructionsDrawer = true,
  instructionsDrawerInitialHeightRatio,
  instructionsDrawerVisualCue = "none",
  autoSeedConversationOnMount = false,
  aiTutorInputExperiment = "default",
  onCollapsedChange,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => Boolean(collapsible));

  useEffect(() => {
    if (!collapsible) {
      setIsCollapsed(false);
    }
  }, [collapsible]);

  const onCollapsedChangeRef = useRef(onCollapsedChange);
  onCollapsedChangeRef.current = onCollapsedChange;

  useEffect(() => {
    onCollapsedChangeRef.current?.(Boolean(collapsible && isCollapsed));
  }, [collapsible, isCollapsed]);

  useEffect(() => {
    const validTabs: SidebarTab[] = [];

    if (showValidationTab) validTabs.push("checklist");
    if (showAiTutorTab) validTabs.push("ai-tutor");
    if (showHistoryTab) validTabs.push("history");
    if (showTeacherResourcesTab) validTabs.push("classroom");

    if (!validTabs.includes(activeTab) && validTabs.length > 0) {
      setActiveTab(validTabs[0]);
    }
  }, [
    activeTab,
    setActiveTab,
    showAiTutorTab,
    showHistoryTab,
    showTeacherResourcesTab,
    showValidationTab,
  ]);

  const panelHidden = collapsible && isCollapsed;
  const railWidth = 56;

  const isTabActive = (tab: SidebarTab) => !panelHidden && activeTab === tab;

  return (
    <div
      className={[styles.root, panelHidden ? styles.rootCollapsed : ""]
        .filter(Boolean)
        .join(" ")}
      style={{
        width: panelHidden ? `${railWidth}px` : `${sidebarWidth}px`,
      }}
    >
      <div className={styles.tabRail}>
        <div className={styles.railTopSpacer}>
          {collapsible && (
            <Tooltip
              content={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              position="right"
            >
              <button
                type="button"
                className={styles.railCollapseButton}
                onClick={() => {
                  setIsCollapsed((prev) => {
                    const next = !prev;
                    if (next) {
                      setIsSettingsOpen(false);
                    }
                    return next;
                  });
                }}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <FaIcon
                  name={
                    isCollapsed ? "arrow-right-from-line" : "arrow-left-from-line"
                  }
                  size="s"
                  className="text-[#69788a] transition-colors hover:text-[#576575]"
                />
              </button>
            </Tooltip>
          )}
        </div>

        {showValidationTab && (
          <Tooltip content="Validation" position="right">
            <button
              onClick={() => setActiveTab("checklist")}
              className={`${styles.tabButton} ${
                isTabActive("checklist") ? styles.tabActive : ""
              }`}
            >
              <FontAwesomeIcon
                icon={faClipboardCheck}
                className={`text-[18px] transition-colors ${
                  isTabActive("checklist")
                    ? "text-accent"
                    : "text-[#69788a] group-hover:text-[#576575]"
                }`}
              />
              {isTabActive("checklist") && (
                <>
                  <div className={styles.tabActiveAccent} />
                  <div className={styles.tabActiveMask} />
                </>
              )}
            </button>
          </Tooltip>
        )}

        {showAiTutorTab && (
          <Tooltip content="AI Tutor" position="right">
            <button
              onClick={() => setActiveTab("ai-tutor")}
              className={`${styles.tabButton} ${
                isTabActive("ai-tutor") ? styles.tabActive : ""
              }`}
            >
              <AiTutorIcon
                className="w-[22px] h-[22px] transition-colors"
                color={isTabActive("ai-tutor") ? "#0093a4" : "#69788a"}
              />
              {isTabActive("ai-tutor") && (
                <>
                  <div className={styles.tabActiveAccent} />
                  <div className={styles.tabActiveMask} />
                </>
              )}
            </button>
          </Tooltip>
        )}

        {showHistoryTab && (
          <Tooltip content="Version History" position="right">
            <button
              onClick={() => setActiveTab("history")}
              className={`${styles.tabButton} ${
                isTabActive("history") ? styles.tabActive : ""
              }`}
            >
              <FontAwesomeIcon
                icon={faClockRotateLeft}
                className={`text-[18px] transition-colors ${
                  isTabActive("history")
                    ? "text-accent"
                    : "text-[#69788a] group-hover:text-[#576575]"
                }`}
              />
              {isTabActive("history") && (
                <>
                  <div className={styles.tabActiveAccent} />
                  <div className={styles.tabActiveMask} />
                </>
              )}
            </button>
          </Tooltip>
        )}

        {showTeacherResourcesTab && (
          <Tooltip content="Teacher Resources" position="right">
            <button
              onClick={() => setActiveTab("classroom")}
              className={`${styles.tabButton} ${
                isTabActive("classroom") ? styles.tabActive : ""
              }`}
            >
              <FontAwesomeIcon
                icon={faPersonChalkboard}
                className={`text-[18px] transition-colors ${
                  isTabActive("classroom")
                    ? "text-accent"
                    : "text-[#69788a] group-hover:text-[#576575]"
                }`}
              />
              {isTabActive("classroom") && (
                <>
                  <div className={styles.tabActiveAccent} />
                  <div className={styles.tabActiveMask} />
                </>
              )}
            </button>
          </Tooltip>
        )}

        <div className="flex-1" />

        <div className={styles.bottomButtons}>
          <Tooltip content="Documentation" position="right">
            <AppButton variant="tertiary" tone="gray" size="xs" icon={<FontAwesomeIcon icon={faBook} />} />
          </Tooltip>
          <Tooltip content="AI Usage Disclaimer" position="right">
            <AppButton
              variant="tertiary"
              tone="gray"
              size="xs"
              icon={<FontAwesomeIcon icon={faTriangleExclamation} />}
            />
          </Tooltip>
          <Tooltip content="Settings" position="right">
            <AppButton
              variant="tertiary"
              tone="gray"
              size="xs"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              icon={<FontAwesomeIcon icon={faGear} />}
            />
          </Tooltip>
          <Tooltip content="Copyright" position="right">
            <AppButton variant="tertiary" tone="gray" size="xs" icon={<FontAwesomeIcon icon={faCopyright} />} />
          </Tooltip>
        </div>
      </div>

      {!panelHidden && (
        <div className={styles.content}>
          <div className={styles.panelHeader}>
            <div />
            <label className={styles.panelHeaderLabel}>
              {activeTab === "checklist" && "VALIDATION"}
              {activeTab === "ai-tutor" && "AI TUTOR"}
              {activeTab === "history" && "VERSION HISTORY"}
              {activeTab === "classroom" && "TEACHER RESOURCES"}
            </label>
            {activeTab === "ai-tutor" ? (
              <div className="flex gap-1">
                <AppButton variant="tertiary" tone="gray" size="xs" icon={<FontAwesomeIcon icon={faDownload} />} />
                <AppButton variant="tertiary" tone="gray" size="xs" icon={<FontAwesomeIcon icon={faEraser} />} />
              </div>
            ) : (
              <div />
            )}
          </div>

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
              autoSeedConversationOnMount={autoSeedConversationOnMount}
              inputExperiment={aiTutorInputExperiment}
            />
          )}
          {activeTab === "history" && (
            <VersionHistory
              selectedVersion={selectedHistoryVersion}
              onVersionChange={setSelectedHistoryVersion}
              onSaveVersion={onSaveVersion}
              onRestoreVersion={onRestoreVersion}
              showRestoreSuccessAlert={showRestoreSuccessAlert}
              setShowRestoreSuccessAlert={setShowRestoreSuccessAlert}
              showSaveSuccessAlert={showSaveSuccessAlert}
              setShowSaveSuccessAlert={setShowSaveSuccessAlert}
            />
          )}
          {activeTab === "classroom" && <TeacherResourcesPanel />}

          {showContinueButton && (
            <div className={styles.continueBar}>
              <ContinueButton />
            </div>
          )}

          {isSettingsOpen && (
            <SettingsPanel
              isOpen={isSettingsOpen}
              onClose={() => setIsSettingsOpen(false)}
            />
          )}
        </div>
      )}

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
