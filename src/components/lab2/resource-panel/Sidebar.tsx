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
  faSlidersH,
  faCopy,
  faRotateLeft,
  faBookmark,
} from "@fortawesome/free-solid-svg-icons";
import { PanelHeader } from "../../ui/PanelHeader";
import { Tooltip } from "../../ui/Tooltip";
import { Modal } from "../../ui/Modal";
import modalStyles from "../../ui/Modal.module.scss";
import { AppButton } from "../../ui/AppButton";
import { AiTutorIcon } from "../../ui/icons/AiTutorIcon";
import { FaIcon } from "../../ui/icons/FaIcon";
import { ValidationPanel } from "./views/ValidationPanel";
import { VersionHistory } from "./views/VersionHistory";
import { AiTutorPanel } from "./views/AiTutorPanel";
import type { AiTutorInputExperiment } from "./views/AiTutorPanel";
import { TeacherResourcesPanel } from "./views/TeacherResourcesPanel";
import { RubricPanel } from "./views/RubricPanel";
import type { RubricData } from "./views/RubricPanel";
import { ContinueButton } from "./ContinueButton";
import { SettingsPanel } from "./views/SettingsPanel";
import { DevPanelContent } from "../dev";
import type { DevPanelField } from "../dev";
import type { PropsOverrideResult } from "../../../hooks/usePropsOverride";
import type { UseAnnotationsResult } from "../../../hooks/useAnnotations";
import { useSavedVariants } from "../../../hooks/useSavedVariants";
import type { ChatMessage } from "../../../types/chat";
import type { InstructionsDrawerVisualCue } from "./InstructionsDrawer";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import styles from "./Sidebar.module.scss";

export type SidebarTab = "checklist" | "ai-tutor" | "history" | "classroom" | "rubric" | "dev";

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
  /** Single rubric or up to four per level; navigation shows when multiple. */
  rubricData?: RubricData | RubricData[];
  showContinueButton?: boolean;
  /** Fires when the Continue button is clicked. */
  onContinue?: () => void;
  /** Override the default "Continue to Level 10" label. */
  continueLabel?: string;
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
  /** Custom content for the instructions drawer (replaces default copy). */
  instructionsContent?: React.ReactNode;
  /** Fires when `collapsible && isCollapsed` changes (for shell chrome such as resize handle). */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** When provided, a Dev tab appears in the rail with live prop controls. */
  devPanelFields?: DevPanelField[];
  devPanelOverrideResult?: PropsOverrideResult<Record<string, unknown>>;
  /** Annotation mode state — passed down from Lab2Shell. */
  annotations?: UseAnnotationsResult;
}

function DevPanelHeaderActions({
  overrideResult,
}: {
  overrideResult: PropsOverrideResult<Record<string, unknown>>;
}) {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saved, setSaved] = useState(false);
  const location = useLocation();
  const { saveVariant } = useSavedVariants();

  const handleSave = () => {
    if (!saveName.trim()) return;
    saveVariant(saveName.trim(), location.pathname, overrideResult.overrides);
    setSaveName("");
    setShowSaveModal(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <>
      <Modal
        open={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        title="Save variant"
        footer={
          <>
            <AppButton
              variant="secondary"
              tone="black"
              size="s"
              onClick={() => setShowSaveModal(false)}
            >
              Cancel
            </AppButton>
            <AppButton
              variant="primary"
              tone="purple"
              size="s"
              onClick={handleSave}
              disabled={!saveName.trim()}
            >
              Save
            </AppButton>
          </>
        }
      >
        <div className={modalStyles.fieldGroup}>
          <label className={modalStyles.fieldLabel}>
            Variant name
            <input
              className={modalStyles.fieldInput}
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
              placeholder="e.g. Shorter stems, 2-col layout"
              autoFocus
            />
          </label>
          <p className={modalStyles.fieldHint}>
            Saved to <strong>/levels</strong> index. You can promote to a code
            page later.
          </p>
        </div>
      </Modal>
      <div className="flex gap-1">
        <Tooltip content={saved ? "Saved!" : "Save variant"} position="bottom">
          <AppButton
            variant="tertiary"
            tone="gray"
            size="xs"
            icon={<FontAwesomeIcon icon={faBookmark} />}
            onClick={() => {
              setSaveName("");
              setShowSaveModal(true);
            }}
            disabled={!overrideResult.hasOverrides}
          />
        </Tooltip>
        <Tooltip content="Copy link with overrides" position="bottom">
          <AppButton
            variant="tertiary"
            tone="gray"
            size="xs"
            icon={<FontAwesomeIcon icon={faCopy} />}
            onClick={() => overrideResult.copyLink()}
            disabled={!overrideResult.hasOverrides}
          />
        </Tooltip>
        <Tooltip content="Reset all overrides" position="bottom">
          <AppButton
            variant="tertiary"
            tone="gray"
            size="xs"
            icon={<FontAwesomeIcon icon={faRotateLeft} />}
            onClick={() => overrideResult.resetAll()}
            disabled={!overrideResult.hasOverrides}
          />
        </Tooltip>
      </div>
    </>
  );
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
  showRubricTab = false,
  rubricData,
  showContinueButton = true,
  onContinue,
  continueLabel,
  collapsible = false,
  showInstructionsDrawer = true,
  instructionsDrawerInitialHeightRatio,
  instructionsDrawerVisualCue = "none",
  autoSeedConversationOnMount = false,
  aiTutorInputExperiment = "default",
  instructionsContent,
  onCollapsedChange,
  devPanelFields,
  devPanelOverrideResult,
  annotations,
}: SidebarProps) {
  const showDevTab = Boolean(devPanelFields && devPanelOverrideResult);
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
    if (showRubricTab) validTabs.push("rubric");
    if (showDevTab) validTabs.push("dev");

    if (!validTabs.includes(activeTab) && validTabs.length > 0) {
      setActiveTab(validTabs[0]);
    }
  }, [
    activeTab,
    setActiveTab,
    showAiTutorTab,
    showHistoryTab,
    showTeacherResourcesTab,
    showRubricTab,
    showValidationTab,
    showDevTab,
  ]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (!showDevTab) return;
      if ((e.metaKey || e.ctrlKey) && e.key === ".") {
        e.preventDefault();
        if (activeTab === "dev") {
          const fallback: SidebarTab[] = [];
          if (showAiTutorTab) fallback.push("ai-tutor");
          if (showValidationTab) fallback.push("checklist");
          setActiveTab(fallback[0] ?? "ai-tutor");
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
  }, [showDevTab, activeTab, setActiveTab, showAiTutorTab, showValidationTab, collapsible, isCollapsed]);

  const panelHidden = collapsible && isCollapsed;
  const railWidth = 56;

  const isTabActive = (tab: SidebarTab) => !panelHidden && activeTab === tab;

  const selectTab = (tab: SidebarTab) => {
    setActiveTab(tab);
    if (collapsible && isCollapsed) {
      setIsCollapsed(false);
    }
  };

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
              onClick={() => selectTab("checklist")}
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
              onClick={() => selectTab("ai-tutor")}
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
              onClick={() => selectTab("history")}
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
              onClick={() => selectTab("classroom")}
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

        {showRubricTab && (
          <Tooltip content="Rubric" position="right">
            <button
              onClick={() => selectTab("rubric")}
              className={`${styles.tabButton} ${
                isTabActive("rubric") ? styles.tabActive : ""
              }`}
            >
              <FaIcon
                name="clipboard-list"
                size="m"
                className={`text-[18px] transition-colors ${
                  isTabActive("rubric")
                    ? "text-accent"
                    : "text-[#69788a] group-hover:text-[#576575]"
                }`}
              />
              {isTabActive("rubric") && (
                <>
                  <div className={styles.tabActiveAccent} />
                  <div className={styles.tabActiveMask} />
                </>
              )}
            </button>
          </Tooltip>
        )}

        {showDevTab && (
          <Tooltip content="Dev Panel" position="right">
            <button
              onClick={() => selectTab("dev")}
              className={`${styles.tabButton} ${
                isTabActive("dev") ? styles.tabActive : ""
              }`}
            >
              <FontAwesomeIcon
                icon={faSlidersH}
                className={`text-[18px] transition-colors ${
                  isTabActive("dev")
                    ? "text-accent"
                    : "text-[#69788a] group-hover:text-[#576575]"
                }`}
              />
              {isTabActive("dev") && (
                <>
                  <div className={styles.tabActiveAccent} />
                  <div className={styles.tabActiveMask} />
                </>
              )}
              {devPanelOverrideResult?.hasOverrides && !isTabActive("dev") && (
                <span className={styles.devOverrideDot} />
              )}
            </button>
          </Tooltip>
        )}

        <div className="flex-1" />

        <div className={styles.bottomButtons}>
          {annotations && (
            <Tooltip
              content={
                annotations.isActive ? "Exit annotation mode" : "Annotate"
              }
              position="right"
            >
              <AppButton
                variant={annotations.isActive ? "primary" : "tertiary"}
                tone={annotations.isActive ? "purple" : "gray"}
                size="xs"
                iconName="thumbtack"
                onClick={() => annotations.setIsActive(!annotations.isActive)}
                aria-label={
                  annotations.isActive
                    ? "Exit annotation mode"
                    : "Start annotation mode"
                }
              />
            </Tooltip>
          )}
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
          <PanelHeader
            label={
              (activeTab === "checklist" && "VALIDATION") ||
              (activeTab === "ai-tutor" && "AI TUTOR") ||
              (activeTab === "history" && "VERSION HISTORY") ||
              (activeTab === "classroom" && "TEACHER RESOURCES") ||
              (activeTab === "rubric" && "RUBRIC") ||
              (activeTab === "dev" && "DEV PANEL") ||
              ""
            }
            right={
              activeTab === "ai-tutor" ? (
                <div className="flex gap-1">
                  <AppButton variant="tertiary" tone="gray" size="xs" icon={<FontAwesomeIcon icon={faDownload} />} />
                  <AppButton variant="tertiary" tone="gray" size="xs" icon={<FontAwesomeIcon icon={faEraser} />} />
                </div>
              ) : activeTab === "dev" && devPanelOverrideResult ? (
                <DevPanelHeaderActions overrideResult={devPanelOverrideResult} />
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
              autoSeedConversationOnMount={autoSeedConversationOnMount}
              inputExperiment={aiTutorInputExperiment}
              instructionsContent={instructionsContent}
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
          {activeTab === "rubric" && rubricData && (
            <RubricPanel
              rubrics={
                Array.isArray(rubricData) ? rubricData : [rubricData]
              }
            />
          )}
          {activeTab === "dev" && devPanelFields && devPanelOverrideResult && (
            <DevPanelContent fields={devPanelFields} overrideResult={devPanelOverrideResult} />
          )}

          {showContinueButton && (
            <div className={styles.continueBar}>
              <ContinueButton onClick={onContinue} label={continueLabel} />
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
