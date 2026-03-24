import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { Textarea } from "./ui/textarea";

interface SaveVersionPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (description: string) => void;
  anchorEl: HTMLElement | null;
}

export function SaveVersionPopover({
  isOpen,
  onClose,
  onSave,
  anchorEl,
}: SaveVersionPopoverProps) {
  const [description, setDescription] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset description and auto-focus when modal opens
  useEffect(() => {
    if (isOpen) {
      setDescription("");
      // Auto-focus the textarea after a short delay to ensure it's rendered
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorEl &&
        !anchorEl.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, anchorEl]);

  const handleSave = () => {
    onSave(description);
    setDescription("");
  };

  if (!isOpen || !anchorEl) return null;

  // Calculate position
  const rect = anchorEl.getBoundingClientRect();
  const top = rect.bottom + 8; // 8px gap below button
  const right = window.innerWidth - rect.right; // Align right edge with button's right edge

  return (
    <>
      <div
        ref={popoverRef}
        className="fixed rounded-[4px] w-[336px] z-50"
        style={{
          top: `${top}px`,
          right: `${right}px`,
        }}
        data-name="Publish Version Wrapper"
      >
        <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] w-full">
          {/* Header */}
          <div className="bg-[#f0f2f5] h-[40px] relative shrink-0 w-full" data-name="Panel Header V2">
            <div className="content-stretch flex flex-col gap-[10px] h-[40px] items-start overflow-clip relative rounded-[inherit] w-full">
              <div className="bg-[#f0f2f5] min-h-[40px] relative shrink-0 w-full" data-name="Panel Header Building Block">
                <div className="flex flex-row items-center min-h-inherit overflow-clip rounded-[inherit] size-full">
                  <div className="box-border content-stretch flex items-center justify-between min-h-inherit px-[8px] py-[4px] relative w-full">
                    <div className="content-stretch flex flex-col gap-[10px] items-start min-w-[50px] shrink-0" data-name="Visibility Wrapper" />
                    <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0" data-name="Label Wrapper">
                      <div
                        className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[12px] text-center text-nowrap tracking-[0.48px] uppercase"
                        style={{
                          fontFamily: "var(--font-body)",
                          fontWeight: "var(--font-weight-semibold)",
                        }}
                      >
                        <p className="leading-[19.68px] whitespace-pre">SAVE CURRENT VERSION</p>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-[50px]" data-name="Visibility Wrapper">
                      <div className="content-stretch flex gap-[2px] items-center justify-end min-w-[50px] relative shrink-0 w-full" data-name="Action Group Right">
                        <button
                          onClick={onClose}
                          className="box-border content-stretch flex gap-[4px] items-center justify-center p-[4px] relative rounded-[4px] shrink-0 hover:bg-[#dfe3e9] transition-colors"
                          data-name="Button"
                        >
                          <div
                            className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[13px] text-center w-[16px]"
                            style={{ fontFamily: "var(--font-body)" }}
                          >
                            <FontAwesomeIcon icon={faXmark} className="leading-[1.25]" />
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div aria-hidden="true" className="absolute border-[#d4dae1] border-[1px_0px_0px] border-solid inset-0 pointer-events-none" />
          </div>

          {/* Content */}
          <div className="bg-white relative shrink-0 w-full" data-name="Publish Sticky Wrapper">
            <div aria-hidden="true" className="absolute border-[#d4dae1] border-[1px_0px_0px] border-solid inset-0 pointer-events-none" />
            <div className="size-full">
              <div className="box-border content-stretch flex flex-col gap-[12px] items-start pb-[16px] pt-[12px] px-[16px] relative w-full">
                {/* Text Area */}
                <div className="content-stretch flex flex-col gap-[2px] items-start relative shrink-0 w-full" data-name="Text Area">
                  <div className="content-stretch flex items-start relative shrink-0 w-[300px]" data-name="Label Container">
                    <div
                      className="basis-0 flex flex-col grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#292f36] text-[12px]"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontWeight: "var(--font-weight-semibold)",
                      }}
                    >
                      <p className="leading-[19.68px]">Describe your changes</p>
                    </div>
                  </div>
                  <div className="bg-white h-[76px] relative rounded-[4px] shrink-0 w-full focus-within:outline-none focus-within:ring-2 focus-within:ring-[#0093a4] focus-within:ring-offset-2 transition-shadow" data-name="Input Field">
                    <div aria-hidden="true" className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-[4px]" />
                    <div className="size-full">
                      <div className="box-border content-stretch flex items-start px-[8px] py-[3px] relative size-full">
                        <Textarea
                          ref={textareaRef}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder=""
                          className="w-full h-full border-0 p-0 resize-none focus-visible:ring-0 text-[14px] leading-[21.56px]"
                          style={{
                            fontFamily: "var(--font-body)",
                            fontWeight: "var(--font-weight-normal)",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-[300px]" data-name="Helper Text Container">
                    <div
                      className="basis-0 flex flex-col grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#292f36] text-[12px]"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontWeight: "var(--font-weight-normal)",
                      }}
                    >
                      <p className="leading-[19.68px]">
                        Go to the version history tab in your resource panel to see all of your saved versions and auto-saves.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSave}
                  className="bg-[#9657c7] h-[32px] min-w-[32px] relative rounded-[4px] shrink-0 w-full transition-colors hover:bg-[#6c468a] active:bg-[#9657c7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0093a4] focus-visible:ring-offset-2"
                  data-name="Button"
                >
                  <div className="flex flex-row items-center justify-center min-w-inherit size-full">
                    <div className="box-border content-stretch flex gap-[8px] h-[32px] items-center justify-center min-w-inherit px-[12px] py-[5px] relative w-full">
                      <p
                        className="leading-[21.56px] not-italic relative shrink-0 text-[14px] text-center text-nowrap text-white whitespace-pre"
                        style={{
                          fontFamily: "var(--font-body)",
                          fontWeight: "var(--font-weight-semibold)",
                        }}
                      >
                        Save version
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div aria-hidden="true" className="absolute border border-[#d4dae1] border-solid inset-0 pointer-events-none rounded-[4px] shadow-[0px_6px_18px_0px_rgba(0,0,0,0.3)]" />
      </div>
    </>
  );
}
