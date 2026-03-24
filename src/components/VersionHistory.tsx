import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCloudArrowUp,
  faAnglesDown,
  faAnglesUp,
  faArrowRotateLeft,
  faSave,
} from "@fortawesome/free-solid-svg-icons";
import { Tooltip } from "./Tooltip";
import { ScrollArea } from "./ui/scroll-area";
import { SuccessAlert } from "./SuccessAlert";

interface VersionItem {
  id: string;
  label: string;
  description?: string;
  isAutoSave?: boolean;
}

interface VersionHistoryProps {
  versions?: VersionItem[];
  selectedVersion?: string;
  onVersionChange?: (versionId: string) => void;
  onSaveVersion?: (description: string) => void;
  onRestoreVersion?: (versionId: string) => void;
  showRestoreSuccessAlert?: boolean;
  setShowRestoreSuccessAlert?: (show: boolean) => void;
  showSaveSuccessAlert?: boolean;
  setShowSaveSuccessAlert?: (show: boolean) => void;
}

export function VersionHistory({
  versions = defaultVersions,
  selectedVersion: externalSelectedVersion,
  onVersionChange,
  onSaveVersion,
  onRestoreVersion,
  showRestoreSuccessAlert = false,
  setShowRestoreSuccessAlert,
  showSaveSuccessAlert = false,
  setShowSaveSuccessAlert,
}: VersionHistoryProps) {
  const [internalSelectedVersion, setInternalSelectedVersion] =
    useState("current");
  const selectedVersion = externalSelectedVersion ?? internalSelectedVersion;

  const handleVersionChange = (versionId: string) => {
    setInternalSelectedVersion(versionId);
    onVersionChange?.(versionId);
  };

  const [showSecondAutoSaves, setShowSecondAutoSaves] = useState(true);
  const [versionDescription, setVersionDescription] = useState("");

  const handleSaveVersion = () => {
    if (versionDescription.trim()) {
      onSaveVersion?.(versionDescription);
      setVersionDescription("");
      setShowSaveSuccessAlert?.(true);
    }
  };

  const handleRestoreVersion = (versionId: string) => {
    onRestoreVersion?.(versionId);
    setShowRestoreSuccessAlert?.(true);
  };

  return (
    <ScrollArea className="flex-1 min-h-0">
      <div className="box-border content-stretch flex flex-col items-start pb-[9px] pt-[8px] px-[8px] relative w-full">
        {/* Success Alerts */}
        {showRestoreSuccessAlert && (
          <div className="mb-2 w-full">
            <SuccessAlert
              message="Version successfully restored!"
              onClose={() => setShowRestoreSuccessAlert?.(false)}
            />
          </div>
        )}
        {showSaveSuccessAlert && (
          <div className="mb-2 w-full">
            <SuccessAlert
              message="Successfully saved version."
              onClose={() => setShowSaveSuccessAlert?.(false)}
            />
          </div>
        )}

        {/* Current Version with inline form */}
        <div className="box-border content-stretch flex flex-col items-start mb-[-1px] relative shrink-0 w-full">
          <div className="relative rounded-[4px] shrink-0 w-full">
            <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] w-full">
              {/* Current Version Header */}
              <button
                onClick={() => handleVersionChange("current")}
                className="bg-[#f0f2f5] min-h-[40px] relative shrink-0 w-full group cursor-pointer"
              >
                <div className="flex flex-col justify-center min-h-inherit overflow-clip rounded-[inherit] size-full">
                  <div className="box-border content-stretch flex flex-col gap-[10px] items-start justify-center min-h-inherit pl-[12px] pr-[8px] py-[8px] relative w-full">
                    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                      <div className="basis-0 content-stretch flex gap-[10px] grow items-start min-h-px min-w-px relative shrink-0">
                        <div className="box-border content-stretch flex gap-[10px] items-center pb-0 pt-[2px] px-0 relative shrink-0">
                          <div className="relative shrink-0 size-[18px]">
                            <svg
                              className="block size-full"
                              fill="none"
                              preserveAspectRatio="none"
                              viewBox="0 0 18 18"
                            >
                              <circle
                                cx="9"
                                cy="9"
                                className="transition-colors group-hover:fill-[#e0f8f9]"
                                fill="white"
                                r="8"
                                stroke={
                                  selectedVersion === "current"
                                    ? "#0093A4"
                                    : "#292F36"
                                }
                                strokeWidth="2"
                              />
                              {selectedVersion === "current" && (
                                <circle cx="9" cy="9" fill="#0093A4" r="4" />
                              )}
                            </svg>
                          </div>
                        </div>
                        <div className="basis-0 content-stretch flex gap-[6px] grow items-center min-h-px min-w-px relative shrink-0">
                          <div
                            className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[14px] text-center text-nowrap"
                            style={{
                              fontFamily: "var(--font-body)",
                              fontWeight: "var(--font-weight-semibold)",
                            }}
                          >
                            <p className="leading-[21.56px] whitespace-pre">
                              Current Version
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  aria-hidden="true"
                  className="absolute border-[#d4dae1] border-[0px_0px_1px] border-solid inset-0 pointer-events-none"
                />
              </button>

              {/* Save Version Form - Always visible */}
              <div className="bg-[#f0f2f5] relative shrink-0 w-full">
                <div className="size-full">
                  <div className="box-border content-stretch flex flex-col gap-[6px] items-start p-[8px] relative w-full">
                    {/* Text Area */}
                    <div className="content-stretch flex flex-col gap-[2px] h-[70px] items-start relative shrink-0 w-full">
                      <div className="basis-0 bg-white grow min-h-px min-w-px relative rounded-[4px] shrink-0 w-full focus-within:outline-none focus-within:ring-2 focus-within:ring-[#0093a4] focus-within:ring-offset-2">
                        <div
                          aria-hidden="true"
                          className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-[4px]"
                        />
                        <div className="size-full">
                          <div className="box-border content-stretch flex items-start px-[10px] py-[5px] relative size-full">
                            <textarea
                              value={versionDescription}
                              onChange={(e) =>
                                setVersionDescription(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (
                                  e.key === "Enter" &&
                                  (e.metaKey || e.ctrlKey) &&
                                  versionDescription.trim()
                                ) {
                                  handleSaveVersion();
                                }
                              }}
                              placeholder="Describe your changes"
                              className="basis-0 grow min-h-px min-w-px bg-transparent border-0 outline-none placeholder:text-[#b7c1cb] text-[#292f36] resize-none w-full h-full"
                              style={{
                                fontFamily: "var(--font-body)",
                                fontWeight: "var(--font-weight-normal)",
                                fontSize: "14px",
                                lineHeight: "21.56px",
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Save Button */}
                    <button
                      onClick={handleSaveVersion}
                      disabled={!versionDescription.trim()}
                      className={`h-[32px] min-w-[32px] relative rounded-[4px] shrink-0 w-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0093a4] focus-visible:ring-offset-2 ${
                        versionDescription.trim()
                          ? "bg-white hover:bg-[#f0f2f5]"
                          : "bg-white opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <div
                        aria-hidden="true"
                        className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-[4px]"
                      />
                      <div className="flex flex-row items-center justify-center min-w-inherit size-full">
                        <div className="box-border content-stretch flex gap-[8px] h-[32px] items-center justify-center min-w-inherit not-italic px-[12px] py-[5px] relative text-[#292f36] text-[14px] text-center w-full">
                          <div
                            className="flex flex-col justify-center leading-[0] relative shrink-0 w-[18px]"
                            style={{ fontFamily: "var(--font-body)" }}
                          >
                            <FontAwesomeIcon
                              icon={faSave}
                              className="leading-[1.25]"
                            />
                          </div>
                          <p
                            className="leading-[21.56px] relative shrink-0 text-nowrap whitespace-pre"
                            style={{
                              fontFamily: "var(--font-body)",
                              fontWeight: "var(--font-weight-semibold)",
                            }}
                          >
                            Save current version
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div
              aria-hidden="true"
              className="absolute border border-[#d4dae1] border-solid inset-0 pointer-events-none rounded-[4px]"
            />
          </div>
          <TimelineConnector />
        </div>

        {/* First Version with Description */}
        <VersionItemWithDescription
          id="aug30"
          label="Aug 25, 12:30PM"
          description="Fixed issue with text overflow in containers and buttons not linking properly."
          selectedVersion={selectedVersion}
          onSelect={handleVersionChange}
          onRestore={handleRestoreVersion}
        />

        {/* Hide Auto-saves Toggle */}
        <div className="box-border content-stretch flex flex-col items-start mb-[-1px] relative shrink-0 w-full">
          <div className="relative shrink-0 w-full">
            <div className="flex flex-row items-center size-full">
              <div className="box-border content-stretch flex gap-[2px] items-center pl-[4px] pr-0 py-[4px] relative w-full">
                <button
                  onClick={() => setShowSecondAutoSaves(!showSecondAutoSaves)}
                  className="box-border content-stretch flex gap-[4px] items-center justify-center min-w-[24px] not-italic px-[8px] py-[2px] relative rounded-[4px] shrink-0 text-[#69788a] text-center hover:bg-[#f0f2f5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0093a4] focus-visible:ring-offset-2"
                >
                  <div
                    className="flex flex-col justify-center leading-[0] relative shrink-0 text-[13px] w-[16px]"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    <FontAwesomeIcon
                      icon={showSecondAutoSaves ? faAnglesUp : faAnglesDown}
                      className="leading-[1.25]"
                    />
                  </div>
                  <p
                    className="basis-0 grow leading-[19.68px] min-h-px min-w-px relative shrink-0 text-[12px]"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: "var(--font-weight-semibold)",
                    }}
                  >
                    {showSecondAutoSaves ? "Hide" : "Show"} 4 auto-saves
                  </p>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Second Auto-save Section (Collapsible) */}
        {showSecondAutoSaves && (
          <>
            <AutoSaveVersionItem
              id="aug27"
              label="Aug 25, 12:30PM"
              selectedVersion={selectedVersion}
              onSelect={handleVersionChange}
              onRestore={handleRestoreVersion}
            />
            <AutoSaveVersionItem
              id="aug26-1"
              label="Aug 25, 12:30PM"
              selectedVersion={selectedVersion}
              onSelect={handleVersionChange}
              onRestore={handleRestoreVersion}
            />
            <AutoSaveVersionItem
              id="aug26-2"
              label="Aug 25, 12:30PM"
              selectedVersion={selectedVersion}
              onSelect={handleVersionChange}
              onRestore={handleRestoreVersion}
            />
            <AutoSaveVersionItem
              id="aug24"
              label="Aug 25, 12:30PM"
              selectedVersion={selectedVersion}
              onSelect={handleVersionChange}
              onRestore={handleRestoreVersion}
              showConnectorAfter
            />
          </>
        )}

        {/* Initial Version */}
        <div className="box-border content-stretch flex flex-col items-start mb-[-1px] relative shrink-0 w-full">
          <TimelineConnector />
          <div className="bg-[#f0f2f5] min-h-[40px] relative rounded-[4px] shrink-0 w-full group">
            <div className="flex flex-row items-center min-h-inherit overflow-clip rounded-[inherit] size-full">
              <button
                onClick={() => handleVersionChange("initial")}
                className={`box-border content-stretch flex gap-[10px] items-center pl-[12px] pr-[8px] relative grow cursor-pointer bg-transparent border-0 text-left ${
                  selectedVersion === "initial" ? "py-[8px]" : "pt-[9.5px] pb-[8px]"
                }`}
              >
                <div className="basis-0 content-stretch flex gap-[10px] grow items-start min-h-px min-w-px relative shrink-0">
                  <div className="box-border content-stretch flex gap-[10px] items-center pb-0 pt-[2px] px-0 relative shrink-0">
                    <div className="relative shrink-0 size-[18px]">
                      <svg
                        className="block size-full"
                        fill="none"
                        preserveAspectRatio="none"
                        viewBox="0 0 18 18"
                      >
                        <circle
                          cx="9"
                          cy="9"
                          className="transition-colors group-hover:fill-[#e0f8f9]"
                          fill="white"
                          r="8"
                          stroke={
                            selectedVersion === "initial"
                              ? "#0093A4"
                              : "#292F36"
                          }
                          strokeWidth="2"
                        />
                        {selectedVersion === "initial" && (
                          <circle cx="9" cy="9" fill="#0093A4" r="4" />
                        )}
                      </svg>
                    </div>
                  </div>
                  <div className="basis-0 content-stretch flex gap-[6px] grow items-center min-h-px min-w-px relative shrink-0">
                    <div
                      className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[14px] text-center text-nowrap"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontWeight: "var(--font-weight-semibold)",
                      }}
                    >
                      <p className="leading-[21.56px] whitespace-pre">
                        Initial Version
                      </p>
                    </div>
                  </div>
                </div>
              </button>
              {/* Restore button - only shown when selected */}
              <div className="box-border px-[8px] py-[8px] shrink-0">
                {selectedVersion === "initial" ? (
                  <button
                    onClick={() => handleRestoreVersion("initial")}
                    className="bg-white box-border content-stretch flex gap-[4px] items-center justify-center min-w-[24px] px-[8px] py-[2px] relative rounded-[4px] shrink-0 hover:bg-[#f0f2f5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0093a4] focus-visible:ring-offset-2"
                  >
                    <div
                      aria-hidden="true"
                      className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-[4px]"
                    />
                    <div
                      className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[13px] text-center w-[16px]"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      <FontAwesomeIcon
                        icon={faArrowRotateLeft}
                        className="leading-[1.25]"
                      />
                    </div>
                    <p
                      className="basis-0 grow leading-[19.68px] min-h-px min-w-px not-italic relative shrink-0 text-[#292f36] text-[12px] text-center"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontWeight: "var(--font-weight-semibold)",
                      }}
                    >
                      Restore
                    </p>
                  </button>
                ) : (
                  <div className="h-[20px]" aria-hidden="true" />
                )}
              </div>
            </div>
            <div
              aria-hidden="true"
              className="absolute border border-[#d4dae1] border-solid inset-0 pointer-events-none rounded-[4px]"
            />
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

function TimelineConnector() {
  return (
    <div className="h-[8px] relative shrink-0 w-[20px]">
      <div className="absolute bottom-0 left-0 right-[-5%] top-0">
        <svg
          className="block size-full"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 21 8"
        >
          <line
            stroke="#D4DAE1"
            strokeLinecap="round"
            x1="20.5"
            x2="20.5"
            y1="0.5"
            y2="7.5"
          />
        </svg>
      </div>
    </div>
  );
}

interface VersionItemProps {
  id: string;
  label: string;
  description: string;
  selectedVersion: string;
  onSelect: (id: string) => void;
  onRestore: (id: string) => void;
}

function VersionItemWithDescription({
  id,
  label,
  description,
  selectedVersion,
  onSelect,
  onRestore,
}: VersionItemProps) {
  const isSelected = selectedVersion === id;

  return (
    <div className="box-border content-stretch flex flex-col items-start mb-[-1px] relative shrink-0 w-full">
      <TimelineConnector />
      <div className="relative rounded-[4px] shrink-0 w-full">
        <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] w-full">
          {/* Version Item Header */}
          <div className="bg-[#f0f2f5] min-h-[40px] relative shrink-0 w-full group">
            <div className="flex flex-row items-center min-h-inherit overflow-clip rounded-[inherit] size-full">
              <button
                onClick={() => onSelect(id)}
                className={`box-border content-stretch flex gap-[10px] items-center min-h-inherit pl-[12px] pr-[8px] relative grow cursor-pointer bg-transparent border-0 text-left ${
                  isSelected ? "py-[8px]" : "pt-[9.5px] pb-[8px]"
                }`}
              >
                <div className="basis-0 content-stretch flex grow items-center justify-between min-h-px min-w-px relative shrink-0">
                  <div className="basis-0 content-stretch flex gap-[10px] grow items-start min-h-px min-w-px relative shrink-0">
                    <div className="box-border content-stretch flex gap-[10px] items-center pb-0 pt-[2px] px-0 relative shrink-0">
                      <div className="relative shrink-0 size-[18px]">
                        <svg
                          className="block size-full"
                          fill="none"
                          preserveAspectRatio="none"
                          viewBox="0 0 18 18"
                        >
                          <circle
                            cx="9"
                            cy="9"
                            className="transition-colors group-hover:fill-[#e0f8f9]"
                            fill="white"
                            r="8"
                            stroke={isSelected ? "#0093A4" : "#292F36"}
                            strokeWidth="2"
                          />
                          {isSelected && (
                            <circle cx="9" cy="9" fill="#0093A4" r="4" />
                          )}
                        </svg>
                      </div>
                    </div>
                    <div className="basis-0 content-stretch flex gap-[6px] grow items-center min-h-px min-w-px relative shrink-0">
                      <div
                        className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[14px] text-center text-nowrap"
                        style={{
                          fontFamily: "var(--font-body)",
                          fontWeight: "var(--font-weight-semibold)",
                        }}
                      >
                        <p className="leading-[21.56px] whitespace-pre">
                          {label}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
              {/* Restore button - only shown when selected */}
              <div className="box-border px-[8px] py-[8px] shrink-0">
                {isSelected ? (
                  <button
                    onClick={() => onRestore(id)}
                    className="bg-white box-border content-stretch flex gap-[4px] items-center justify-center min-w-[24px] px-[8px] py-[2px] relative rounded-[4px] shrink-0 hover:bg-[#f0f2f5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0093a4] focus-visible:ring-offset-2"
                  >
                    <div
                      aria-hidden="true"
                      className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-[4px]"
                    />
                    <div
                      className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[13px] text-center w-[16px]"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      <FontAwesomeIcon
                        icon={faArrowRotateLeft}
                        className="leading-[1.25]"
                      />
                    </div>
                    <p
                      className="basis-0 grow leading-[19.68px] min-h-px min-w-px not-italic relative shrink-0 text-[#292f36] text-[12px] text-center"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontWeight: "var(--font-weight-semibold)",
                      }}
                    >
                      Restore
                    </p>
                  </button>
                ) : (
                  <div className="h-[20px]" aria-hidden="true" />
                )}
              </div>
            </div>
            <div
              aria-hidden="true"
              className="absolute border-[#d4dae1] border-[0px_0px_1px] border-solid inset-0 pointer-events-none"
            />
          </div>

          {/* Description */}
          <div className="bg-[#f0f2f5] relative shrink-0 w-full">
            <div className="size-full">
              <div className="box-border content-stretch flex flex-col gap-[6px] items-start px-[12px] py-[8px] relative w-full">
                <div
                  className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#424d59] text-[12px] w-full"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: "var(--font-weight-normal)",
                  }}
                >
                  <p className="leading-[19.68px]">{description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="absolute border border-[#d4dae1] border-solid inset-0 pointer-events-none rounded-[4px]"
        />
      </div>
      <TimelineConnector />
    </div>
  );
}

interface AutoSaveVersionItemProps {
  id: string;
  label: string;
  selectedVersion: string;
  onSelect: (id: string) => void;
  onRestore: (id: string) => void;
  showConnectorAfter?: boolean;
}

function AutoSaveVersionItem({
  id,
  label,
  selectedVersion,
  onSelect,
  onRestore,
  showConnectorAfter = false,
}: AutoSaveVersionItemProps) {
  const isSelected = selectedVersion === id;

  return (
    <div className="box-border content-stretch flex flex-col items-start mb-[-1px] relative shrink-0 w-full">
      <TimelineConnector />
      <div className="bg-[#f0f2f5] min-h-[40px] relative rounded-[4px] shrink-0 w-full group">
        <div className="flex flex-row items-center min-h-inherit overflow-clip rounded-[inherit] size-full">
          <button
            onClick={() => onSelect(id)}
            className={`box-border content-stretch flex gap-[10px] items-center min-h-inherit pl-[12px] pr-[8px] relative grow cursor-pointer bg-transparent border-0 text-left ${
              isSelected ? "py-[8px]" : "pt-[9.5px] pb-[8px]"
            }`}
          >
            <div className="basis-0 content-stretch flex gap-[10px] grow items-start min-h-px min-w-px relative shrink-0">
              <div className="box-border content-stretch flex gap-[10px] items-center pb-0 pt-[2px] px-0 relative shrink-0">
                <div className="relative shrink-0 size-[18px]">
                  <svg
                    className="block size-full"
                    fill="none"
                    preserveAspectRatio="none"
                    viewBox="0 0 18 18"
                  >
                    <circle
                      cx="9"
                      cy="9"
                      className="transition-colors group-hover:fill-[#e0f8f9]"
                      fill="white"
                      r="8"
                      stroke={isSelected ? "#0093A4" : "#292F36"}
                      strokeWidth="2"
                    />
                    {isSelected && (
                      <circle cx="9" cy="9" fill="#0093A4" r="4" />
                    )}
                  </svg>
                </div>
              </div>
              <div className="basis-0 content-stretch flex gap-[6px] grow items-center min-h-px min-w-px relative shrink-0">
                <div
                  className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[14px] text-left"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: "var(--font-weight-normal)",
                  }}
                >
                  <p className="leading-[21.56px] whitespace-pre">{label}</p>
                </div>
              </div>
            </div>
          </button>

          {/* Auto-save icon or Restore button */}
          <div className="box-border px-[8px] py-[8px] shrink-0">
            {isSelected ? (
              <button
                onClick={() => onRestore(id)}
                className="bg-white box-border content-stretch flex gap-[4px] items-center justify-center min-w-[24px] px-[8px] py-[2px] relative rounded-[4px] shrink-0 hover:bg-[#f0f2f5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0093a4] focus-visible:ring-offset-2"
              >
                <div
                  aria-hidden="true"
                  className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-[4px]"
                />
                <div
                  className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[13px] text-center w-[16px]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <FontAwesomeIcon
                    icon={faArrowRotateLeft}
                    className="leading-[1.25]"
                  />
                </div>
                <p
                  className="basis-0 grow leading-[19.68px] min-h-px min-w-px not-italic relative shrink-0 text-[#292f36] text-[12px] text-center"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: "var(--font-weight-semibold)",
                  }}
                >
                  Restore
                </p>
              </button>
            ) : (
              <div className="content-stretch flex h-[16px] items-center justify-center relative shrink-0">
                <Tooltip content="Autosave version" position="top">
                  <div
                    className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#b7c1cb] text-[13px] text-center text-nowrap"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    <FontAwesomeIcon
                      icon={faCloudArrowUp}
                      className="leading-[normal]"
                    />
                  </div>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
        <div
          aria-hidden="true"
          className="absolute border border-[#d4dae1] border-solid inset-0 pointer-events-none rounded-[4px]"
        />
      </div>
      {showConnectorAfter && <TimelineConnector />}
    </div>
  );
}

const defaultVersions: VersionItem[] = [
  { id: "current", label: "Current Version" },
  {
    id: "aug30",
    label: "Aug 30, 1:30PM",
    description:
      "Fixed issue with text overflow in containers and buttons not linking properly.",
  },
  { id: "aug27", label: "Aug 27, 1:30PM", isAutoSave: true },
  { id: "aug26-1", label: "Aug 26, 12:30PM", isAutoSave: true },
  { id: "aug26-2", label: "Aug 26, 9:30AM", isAutoSave: true },
  { id: "aug24", label: "Aug 24, 12:30PM", isAutoSave: true },
  { id: "initial", label: "Initial Version" },
];