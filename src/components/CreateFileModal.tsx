import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faChevronDown,
  faFileCode,
  faFileLines,
  faFileCsv,
} from "@fortawesome/free-solid-svg-icons";
import {
  faCss3,
  faJs,
  faMarkdown,
} from "@fortawesome/free-brands-svg-icons";

interface CreateFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (fileName: string, fileType: string) => void;
}

type FileType = "HTML" | "CSS" | "JS" | "MD" | "TXT" | "CSV";

const FILE_TYPE_ICONS: Record<FileType, any> = {
  HTML: faFileCode,
  CSS: faCss3,
  JS: faJs,
  MD: faMarkdown,
  TXT: faFileLines,
  CSV: faFileCsv,
};

function SeparatorHorizontal() {
  return (
    <div
      className="h-px relative shrink-0 w-full"
      data-name="Separators/Horizontal"
    >
      <div
        aria-hidden="true"
        className="absolute border border-[#d4dae1] border-solid inset-0 pointer-events-none"
      />
    </div>
  );
}

interface FileTypeDropdownProps {
  selectedType: FileType;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (type: FileType) => void;
}

function FileTypeDropdown({
  selectedType,
  isOpen,
  onToggle,
  onSelect,
}: FileTypeDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        if (isOpen) {
          onToggle();
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onToggle]);

  const fileTypes: FileType[] = ["HTML", "CSS", "JS", "MD", "TXT", "CSV"];

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={onToggle}
        className="relative rounded-[4px] shrink-0 w-full hover:bg-[#f0f2f5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0093a4] focus-visible:ring-offset-2"
        data-name="Dropdown Menu Button"
      >
        <div
          aria-hidden="true"
          className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-[4px]"
        />
        <div className="flex flex-row items-center size-full">
          <div className="box-border content-stretch flex items-center justify-between px-[16px] py-[8px] relative w-full">
            <div className="box-border content-stretch flex gap-[8px] items-center pl-0 pr-[8px] py-0 relative shrink-0">
              {/* Icon for selected type */}
              <div
                className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[16px] text-center text-nowrap w-[16px]"
                style={{
                  fontFamily:
                    selectedType === "CSS" || selectedType === "JS" || selectedType === "MD"
                      ? "var(--font-body)"
                      : "var(--font-body)",
                }}
              >
                <FontAwesomeIcon
                  icon={FILE_TYPE_ICONS[selectedType]}
                  className="leading-[normal] whitespace-pre"
                />
              </div>
              <p
                className="leading-[23.68px] not-italic relative shrink-0 text-[#292f36] text-[16px] text-nowrap whitespace-pre"
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: "var(--font-weight-normal)",
                }}
              >
                {selectedType}
              </p>
            </div>
            <div
              className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[16px] text-center w-[20px]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              <FontAwesomeIcon icon={faChevronDown} className="leading-[1.25]" />
            </div>
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 bg-white rounded-[4px]">
          <div className="box-border content-stretch flex flex-col items-start overflow-clip px-0 py-[4px] relative rounded-[inherit]">
            {fileTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  onSelect(type);
                  onToggle();
                }}
                className="bg-white relative shrink-0 w-full hover:bg-[#f0f2f5] transition-colors"
                data-name="Dropdown Menu Items"
              >
                <div className="flex flex-row items-center size-full">
                  <div className="box-border content-stretch flex gap-[12px] items-center pl-[12px] pr-[16px] py-[8px] relative w-full">
                    <div
                      className="box-border content-stretch flex flex-col gap-[10px] items-center justify-center pb-px pt-0 px-0 relative shrink-0 size-[12px]"
                      data-name="File Item Icons"
                    >
                      <div
                        className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[16px] text-center text-nowrap"
                        style={{
                          fontFamily:
                            type === "CSS" || type === "JS" || type === "MD"
                              ? "var(--font-body)"
                              : "var(--font-body)",
                        }}
                      >
                        <FontAwesomeIcon
                          icon={FILE_TYPE_ICONS[type]}
                          className="leading-[normal] whitespace-pre"
                        />
                      </div>
                    </div>
                    <div
                      className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[16px] text-nowrap"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontWeight: "var(--font-weight-normal)",
                      }}
                    >
                      <p className="leading-[23.68px] whitespace-pre">{type}</p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div
            aria-hidden="true"
            className="absolute border border-[#d4dae1] border-solid inset-0 pointer-events-none rounded-[4px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-2px_rgba(0,0,0,0.05)]"
          />
        </div>
      )}
    </div>
  );
}

export function CreateFileModal({
  isOpen,
  onClose,
  onCreate,
}: CreateFileModalProps) {
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState<FileType>("HTML");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setFileName("");
      setFileType("HTML");
      setError("");
      setIsDropdownOpen(false);
    }
  }, [isOpen]);

  const getFileExtension = (type: FileType): string => {
    const extensions: Record<FileType, string> = {
      HTML: ".html",
      CSS: ".css",
      JS: ".js",
      MD: ".md",
      TXT: ".txt",
      CSV: ".csv",
    };
    return extensions[type];
  };

  const getFullFileName = (): string => {
    if (!fileName.trim()) return "";
    
    const trimmedName = fileName.trim();
    const extension = getFileExtension(fileType);
    
    // If the filename already includes an extension, use it as is
    if (trimmedName.includes(".")) {
      return trimmedName;
    }
    
    return `${trimmedName}${extension}`;
  };

  const handleCreate = () => {
    if (!fileName.trim()) {
      setError("Please enter a file name");
      return;
    }

    const fullFileName = getFullFileName();
    onCreate(fullFileName, fileType);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && fileName.trim()) {
      handleCreate();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  const fullFileName = getFullFileName();
  const createButtonLabel = fullFileName ? `Create ${fullFileName}` : "Create file";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white relative rounded-[8px] w-full max-w-[460px] animate-scale-up"
        data-name="Popup Container"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          aria-hidden="true"
          className="absolute border border-[#d4dae1] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[6px_6px_4px_0px_rgba(0,0,0,0.4)]"
        />
        <div className="size-full">
          <div className="box-border content-stretch flex flex-col gap-[16px] items-start px-[32px] py-[24px] relative size-full">
            <h3
              className="min-w-full relative shrink-0 text-[#292f36] text-[28px] w-[min-content]"
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: "var(--font-weight-semibold)",
              }}
            >
              Create a new file
            </h3>

            <SeparatorHorizontal />

            <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
              <div
                className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#576575] text-[16px] w-full"
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: "var(--font-weight-normal)",
                }}
              >
                <p className="leading-[23.68px]">
                  Give your new file a name and type.
                </p>
              </div>

              <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full">
                {/* File name input */}
                <div className="content-stretch flex flex-col gap-[2px] items-start relative shrink-0 w-[263px]">
                  <div className="content-stretch flex items-start relative shrink-0 w-full">
                    <div
                      className="basis-0 flex flex-col grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#292f36] text-[14px]"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontWeight: "var(--font-weight-semibold)",
                      }}
                    >
                      <p className="leading-[21.56px]">File name</p>
                    </div>
                  </div>

                  <div className="bg-white relative rounded-[4px] shrink-0 w-full focus-within:outline-none focus-within:ring-2 focus-within:ring-[#0093a4] focus-within:ring-offset-2">
                    <div
                      aria-hidden="true"
                      className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-[4px]"
                    />
                    <div className="size-full">
                      <div className="box-border content-stretch flex gap-[10px] items-start px-[12px] py-[8px] relative w-full">
                        <input
                          type="text"
                          value={fileName}
                          onChange={(e) => {
                            setFileName(e.target.value);
                            setError("");
                          }}
                          onKeyDown={handleKeyDown}
                          placeholder="Placeholder"
                          className="basis-0 flex flex-col grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[16px] bg-transparent border-0 outline-none placeholder:text-[#b7c1cb] text-[#292f36] leading-[23.68px]"
                          style={{
                            fontFamily: "var(--font-body)",
                            fontWeight: "var(--font-weight-normal)",
                          }}
                          autoFocus
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="content-stretch flex gap-[6px] items-center relative shrink-0 w-full">
                      <div
                        className="basis-0 flex flex-col grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#e02d16] text-[14px]"
                        style={{
                          fontFamily: "var(--font-body)",
                          fontWeight: "var(--font-weight-normal)",
                        }}
                      >
                        <p className="leading-[21.56px]">{error}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* File type dropdown */}
                <div className="basis-0 content-stretch flex flex-col gap-[4px] grow items-start min-h-px min-w-px relative shrink-0">
                  <div className="content-stretch flex flex-col gap-[2px] items-start relative shrink-0 w-full">
                    <div className="content-stretch flex items-start relative shrink-0 w-full z-[3]">
                      <div
                        className="basis-0 flex flex-col grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#292f36] text-[14px]"
                        style={{
                          fontFamily: "var(--font-body)",
                          fontWeight: "var(--font-weight-semibold)",
                        }}
                      >
                        <p className="leading-[21.56px]">File type</p>
                      </div>
                    </div>

                    <FileTypeDropdown
                      selectedType={fileType}
                      isOpen={isDropdownOpen}
                      onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
                      onSelect={setFileType}
                    />
                  </div>
                </div>
              </div>
            </div>

            <SeparatorHorizontal />

            <div className="content-stretch flex gap-[8px] items-start justify-end relative shrink-0 w-full">
              <button
                onClick={onClose}
                className="bg-white box-border content-stretch flex gap-[8px] items-center justify-center min-w-[40px] px-[16px] py-[8px] relative rounded-[4px] shrink-0 hover:bg-[#dfe3e9] active:bg-[#e0f8f9] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0093a4] focus-visible:ring-offset-2"
              >
                <div
                  aria-hidden="true"
                  className="absolute border border-[#292f36] border-solid inset-0 pointer-events-none rounded-[4px]"
                />
                <p
                  className="basis-0 grow leading-[23.68px] min-h-px min-w-px not-italic relative shrink-0 text-[#292f36] text-[16px] text-center"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: "var(--font-weight-semibold)",
                  }}
                >
                  Cancel
                </p>
              </button>

              <button
                onClick={handleCreate}
                className="bg-[#9657c7] box-border content-stretch flex gap-[8px] items-center justify-center min-w-[40px] px-[16px] py-[8px] relative rounded-[4px] shrink-0 hover:bg-[#6c468a] active:bg-[#9657c7] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0093a4] focus-visible:ring-offset-2"
              >
                <p
                  className="basis-0 grow leading-[23.68px] min-h-px min-w-px not-italic relative shrink-0 text-[16px] text-center text-white"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: "var(--font-weight-semibold)",
                  }}
                >
                  {createButtonLabel}
                </p>
              </button>
            </div>

            <button
              onClick={onClose}
              className="absolute content-stretch flex items-center justify-center right-[8px] rounded-[4px] size-[24px] top-[8px] hover:bg-[#f0f2f5] transition-colors"
              data-name="Close Dialog"
            >
              <div
                className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[16px] text-center w-[25px]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                <FontAwesomeIcon icon={faXmark} className="leading-[1.25]" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
