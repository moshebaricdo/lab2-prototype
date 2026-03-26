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
import { ValidationPanel } from "./views/ValidationPanel";
import { VersionHistory } from "./views/VersionHistory";
import { AiTutorPanel } from "./views/AiTutorPanel";
import { TeacherResourcesPanel } from "./views/TeacherResourcesPanel";
import { ContinueButton } from "./ContinueButton";
import { SettingsPanel } from "./views/SettingsPanel";
import type { ChatMessage } from "../../types/chat";
import { useEffect } from "react";
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
}: SidebarProps) {
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

  return (
    <div
      className={styles.root}
      style={{ width: `${sidebarWidth}px` }}
    >
      <div className={styles.tabRail}>
        <div className={styles.railTopSpacer} />

        {showValidationTab && (
          <Tooltip content="Validation" position="right">
            <button
              onClick={() => setActiveTab("checklist")}
              className={`${styles.tabButton} ${
                activeTab === "checklist" ? styles.tabActive : ""
              }`}
            >
              <FontAwesomeIcon
                icon={faClipboardCheck}
                className={`text-[18px] transition-colors ${
                  activeTab === "checklist"
                    ? "text-accent"
                    : "text-[#69788a] group-hover:text-[#576575]"
                }`}
              />
              {activeTab === "checklist" && (
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
                activeTab === "ai-tutor" ? styles.tabActive : ""
              }`}
            >
              <AiTutorIcon
                className="w-[22px] h-[22px] transition-colors"
                color={activeTab === "ai-tutor" ? "#0093a4" : "#69788a"}
              />
              {activeTab === "ai-tutor" && (
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
                activeTab === "history" ? styles.tabActive : ""
              }`}
            >
              <FontAwesomeIcon
                icon={faClockRotateLeft}
                className={`text-[18px] transition-colors ${
                  activeTab === "history"
                    ? "text-accent"
                    : "text-[#69788a] group-hover:text-[#576575]"
                }`}
              />
              {activeTab === "history" && (
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
                activeTab === "classroom" ? styles.tabActive : ""
              }`}
            >
              <FontAwesomeIcon
                icon={faPersonChalkboard}
                className={`text-[18px] transition-colors ${
                  activeTab === "classroom"
                    ? "text-accent"
                    : "text-[#69788a] group-hover:text-[#576575]"
                }`}
              />
              {activeTab === "classroom" && (
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

        <div className={styles.continueBar}>
          <ContinueButton />
        </div>

        {isSettingsOpen && (
          <SettingsPanel
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
