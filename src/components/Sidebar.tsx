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
import { Tooltip } from "./Tooltip";
import { TertiaryIconButton } from "./TertiaryIconButton";
import { AiTutorIcon } from "./AiTutorIcon";
import { ValidationPanel } from "./ValidationPanel";
import { VersionHistory } from "./VersionHistory";
import { AiTutorPanel } from "./panels/AiTutorPanel";
import { TeacherResourcesPanel } from "./panels/TeacherResourcesPanel";
import { ContinueButton } from "./ContinueButton";
import { SettingsPanel } from "./SettingsPanel";

export type SidebarTab = "checklist" | "ai-tutor" | "history" | "classroom";

interface SidebarProps {
  activeTab: SidebarTab;
  setActiveTab: (tab: SidebarTab) => void;
  sidebarWidth: number;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  chatMessages: Array<{ role: string; content: string }>;
  setChatMessages: (messages: Array<{ role: string; content: string }>) => void;
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
  // Optional props to control tab visibility
  showValidationTab?: boolean;
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
  showValidationTab = false, // Hidden by default
  showTeacherResourcesTab = false, // Hidden by default
}: SidebarProps) {
  return (
    <div
      className="flex h-full bg-white border-r border-[#d4dae1] shrink-0"
      style={{ width: `${sidebarWidth}px` }}
    >
      {/* Sidebar Tab Navigation */}
      <div className="w-14 flex flex-col border-r border-[#d4dae1]">
        <div className="h-10 flex items-center justify-center border-b border-[#d4dae1]" />
        
        {/* Validation Tab - Hidden by default, can be shown via prop */}
        {showValidationTab && (
          <Tooltip content="Validation" position="right">
            <button
              onClick={() => setActiveTab("checklist")}
              className={`h-14 flex items-center justify-center border-b border-[#d4dae1] relative transition-colors hover:bg-white ${
                activeTab === "checklist" ? "bg-white" : "bg-[#f0f2f5]"
              }`}
            >
              <FontAwesomeIcon
                icon={faClipboardCheck}
                className={`text-[18px] transition-colors ${
                  activeTab === "checklist" ? "text-accent" : "text-[#69788a] group-hover:text-[#576575]"
                }`}
              />
              {activeTab === "checklist" && (
                <>
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />
                  <div className="absolute -right-[1px] top-0 bottom-0 w-[2px] bg-white z-10" />
                </>
              )}
            </button>
          </Tooltip>
        )}

        <Tooltip content="AI Tutor" position="right">
          <button
            onClick={() => setActiveTab("ai-tutor")}
            className={`h-14 flex items-center justify-center border-b border-[#d4dae1] relative transition-colors hover:bg-white ${
              activeTab === "ai-tutor" ? "bg-white" : "bg-[#f0f2f5]"
            }`}
          >
            <AiTutorIcon
              className="w-[22px] h-[22px] transition-colors"
              color={activeTab === "ai-tutor" ? "#0093a4" : "#69788a"}
            />
            {activeTab === "ai-tutor" && (
              <>
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />
                <div className="absolute -right-[1px] top-0 bottom-0 w-[2px] bg-white z-10" />
              </>
            )}
          </button>
        </Tooltip>

        <Tooltip content="Version History" position="right">
          <button
            onClick={() => setActiveTab("history")}
            className={`h-14 flex items-center justify-center border-b border-[#d4dae1] relative transition-colors hover:bg-white ${
              activeTab === "history" ? "bg-white" : "bg-[#f0f2f5]"
            }`}
          >
            <FontAwesomeIcon
              icon={faClockRotateLeft}
              className={`text-[18px] transition-colors ${
                activeTab === "history" ? "text-accent" : "text-[#69788a] group-hover:text-[#576575]"
              }`}
            />
            {activeTab === "history" && (
              <>
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />
                <div className="absolute -right-[1px] top-0 bottom-0 w-[2px] bg-white z-10" />
              </>
            )}
          </button>
        </Tooltip>

        {/* Teacher Resources Tab - Hidden by default, can be shown via prop */}
        {showTeacherResourcesTab && (
          <Tooltip content="Teacher Resources" position="right">
            <button
              onClick={() => setActiveTab("classroom")}
              className={`h-14 flex items-center justify-center border-b border-[#d4dae1] relative transition-colors hover:bg-white ${
                activeTab === "classroom" ? "bg-white" : "bg-[#f0f2f5]"
              }`}
            >
              <FontAwesomeIcon
                icon={faPersonChalkboard}
                className={`text-[18px] transition-colors ${
                  activeTab === "classroom" ? "text-accent" : "text-[#69788a] group-hover:text-[#576575]"
                }`}
              />
              {activeTab === "classroom" && (
                <>
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />
                  <div className="absolute -right-[1px] top-0 bottom-0 w-[2px] bg-white z-10" />
                </>
              )}
            </button>
          </Tooltip>
        )}

        <div className="flex-1" />

        {/* Bottom Icon Buttons */}
        <div className="flex flex-col gap-2 items-center mb-3">
          <Tooltip content="Documentation" position="right">
            <TertiaryIconButton icon={<FontAwesomeIcon icon={faBook} />} />
          </Tooltip>
          <Tooltip content="AI Usage Disclaimer" position="right">
            <TertiaryIconButton
              icon={<FontAwesomeIcon icon={faTriangleExclamation} />}
            />
          </Tooltip>
          <Tooltip content="Settings" position="right">
            <TertiaryIconButton
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              icon={<FontAwesomeIcon icon={faGear} />}
            />
          </Tooltip>
          <Tooltip content="Copyright" position="right">
            <TertiaryIconButton icon={<FontAwesomeIcon icon={faCopyright} />} />
          </Tooltip>
        </div>
      </div>

      {/* Sidebar Content Panel */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        {/* Panel Header */}
        <div className="relative min-h-10 flex items-center justify-between px-2 border-b border-[#d4dae1] bg-white px-[8px] py-[0px] shrink-0">
          <div />
          <label className="absolute left-1/2 -translate-x-1/2 text-xs text-[#69788a] font-semibold tracking-wide uppercase">
            {activeTab === "checklist" && "VALIDATION"}
            {activeTab === "ai-tutor" && "AI TUTOR"}
            {activeTab === "history" && "VERSION HISTORY"}
            {activeTab === "classroom" && "TEACHER RESOURCES"}
          </label>
          {activeTab === "ai-tutor" ? (
            <div className="flex gap-1">
              <TertiaryIconButton icon={<FontAwesomeIcon icon={faDownload} />} />
              <TertiaryIconButton icon={<FontAwesomeIcon icon={faEraser} />} />
            </div>
          ) : (
            <div />
          )}
        </div>

        {/* Panel Content */}
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

        {/* Continue Button - Always visible at bottom */}
        <div className="border-t border-[#d4dae1] p-2 bg-[rgb(255,255,255)] shrink-0">
          <ContinueButton />
        </div>

        {/* Settings */}
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