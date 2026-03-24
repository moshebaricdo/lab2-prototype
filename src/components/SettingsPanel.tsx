import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({
  isOpen,
  onClose,
}: SettingsPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="bg-[#f0f2f5] relative shrink-0 w-full">
      <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] w-full">
        {/* Settings Header */}
        <div className="bg-[#f0f2f5] relative shrink-0 w-full">
          <div className="content-stretch flex flex-col gap-[10px] items-start overflow-clip relative rounded-[inherit] w-full">
            <div className="flex items-center bg-[rgb(255,255,255)] min-h-[40px] relative shrink-0 w-full">
              <div className="flex flex-row items-center min-h-inherit overflow-clip rounded-[inherit] size-full">
                <div className="box-border content-stretch flex items-center justify-between min-h-inherit px-[8px] py-[4px] relative w-full">
                  <div className="content-stretch flex flex-col gap-[10px] items-start min-w-[50px] shrink-0" />
                  <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0">
                    <div
                      className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[12px] text-center text-nowrap tracking-[0.48px] uppercase"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontWeight:
                          "var(--font-weight-semibold)",
                      }}
                    >
                      <p className="leading-[19.68px] whitespace-pre">
                        settings
                      </p>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-[50px]">
                    <div className="content-stretch flex gap-[2px] items-center justify-end min-w-[50px] relative shrink-0 w-full">
                      <button
                        onClick={onClose}
                        className="content-stretch flex items-center justify-center relative rounded-[4px] shrink-0 hover:bg-[#dfe3e9] p-1 transition-colors"
                      >
                        <div
                          className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[14px] text-center w-[18px]"
                          style={{
                            fontFamily: "var(--font-body)",
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faXmark}
                            className="leading-[1.25]"
                          />
                        </div>
                      </button>
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
        </div>

        {/* Settings Content */}
        <div className="bg-[#ffffff] relative shrink-0 w-full">
          <div className="size-full">
            <div className="box-border content-stretch flex flex-col gap-[12px] items-start pb-[16px] pt-[8px] px-[8px] relative w-full bg-[rgba(255,255,255,0)]">
              {/* Language Dropdown */}
              <div className="content-stretch flex flex-col gap-[2px] isolate items-start justify-center relative shrink-0 w-full">
                <div className="content-stretch flex items-start relative shrink-0 w-full z-[3]">
                  <div
                    className="basis-0 flex flex-col grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#292f36] text-[12px]"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: "var(--font-weight-semibold)",
                    }}
                  >
                    <p className="leading-[19.68px]">
                      Language
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex flex-col gap-[2px] items-start relative rounded-[4px] shrink-0 w-full z-[2]">
                  <div className="bg-white relative rounded-[4px] shrink-0 w-full">
                    <div
                      aria-hidden="true"
                      className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-[4px]"
                    />
                    <div className="flex flex-row items-center size-full">
                      <div className="box-border content-stretch flex items-center justify-between px-[12px] py-[5px] relative w-full">
                        <div className="box-border content-stretch flex gap-[8px] items-center pl-0 pr-[8px] py-0 relative shrink-0">
                          <p
                            className="leading-[21.56px] not-italic relative shrink-0 text-[#292f36] text-[14px] text-nowrap whitespace-pre"
                            style={{
                              fontFamily: "var(--font-body)",
                              fontWeight:
                                "var(--font-weight-normal)",
                            }}
                          >
                            English
                          </p>
                        </div>
                        <div
                          className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[14px] text-center w-[18px]"
                          style={{
                            fontFamily: "var(--font-body)",
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faChevronDown}
                            className="leading-[1.25]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Editor Font Size Dropdown */}
              <div className="content-stretch flex flex-col gap-[2px] isolate items-start justify-center relative shrink-0 w-full">
                <div className="content-stretch flex items-start relative shrink-0 w-full z-[3]">
                  <div
                    className="basis-0 flex flex-col grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#292f36] text-[12px]"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: "var(--font-weight-semibold)",
                    }}
                  >
                    <p className="leading-[19.68px]">
                      Editor Font Size
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex flex-col gap-[2px] items-start relative rounded-[4px] shrink-0 w-full z-[2]">
                  <div className="bg-white relative rounded-[4px] shrink-0 w-full">
                    <div
                      aria-hidden="true"
                      className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-[4px]"
                    />
                    <div className="flex flex-row items-center size-full">
                      <div className="box-border content-stretch flex items-center justify-between px-[12px] py-[5px] relative w-full">
                        <div className="box-border content-stretch flex gap-[8px] items-center pl-0 pr-[8px] py-0 relative shrink-0">
                          <p
                            className="leading-[21.56px] not-italic relative shrink-0 text-[#292f36] text-[14px] text-nowrap whitespace-pre"
                            style={{
                              fontFamily: "var(--font-body)",
                              fontWeight:
                                "var(--font-weight-normal)",
                            }}
                          >
                            Small
                          </p>
                        </div>
                        <div
                          className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[14px] text-center w-[18px]"
                          style={{
                            fontFamily: "var(--font-body)",
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faChevronDown}
                            className="leading-[1.25]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Theme Dropdown */}
              <div className="content-stretch flex flex-col gap-[2px] isolate items-start justify-center relative shrink-0 w-full">
                <div className="content-stretch flex items-start relative shrink-0 w-full z-[3]">
                  <div
                    className="basis-0 flex flex-col grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#292f36] text-[12px]"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: "var(--font-weight-semibold)",
                    }}
                  >
                    <p className="leading-[19.68px]">Theme</p>
                  </div>
                </div>
                <div className="content-stretch flex flex-col gap-[2px] items-start relative rounded-[4px] shrink-0 w-full z-[2]">
                  <div className="bg-white relative rounded-[4px] shrink-0 w-full">
                    <div
                      aria-hidden="true"
                      className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-[4px]"
                    />
                    <div className="flex flex-row items-center size-full">
                      <div className="box-border content-stretch flex items-center justify-between px-[12px] py-[5px] relative w-full">
                        <div className="box-border content-stretch flex gap-[8px] items-center pl-0 pr-[8px] py-0 relative shrink-0">
                          <p
                            className="leading-[21.56px] not-italic relative shrink-0 text-[#292f36] text-[14px] text-nowrap whitespace-pre"
                            style={{
                              fontFamily: "var(--font-body)",
                              fontWeight:
                                "var(--font-weight-normal)",
                            }}
                          >
                            Light
                          </p>
                        </div>
                        <div
                          className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[14px] text-center w-[18px]"
                          style={{
                            fontFamily: "var(--font-body)",
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faChevronDown}
                            className="leading-[1.25]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="absolute border-[#d4dae1] border-[1px_0px_0px] border-solid inset-0 pointer-events-none"
      />
    </div>
  );
}