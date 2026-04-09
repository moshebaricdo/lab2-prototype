import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
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
import styles from "./CreateFileModal.module.scss";

interface CreateFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (fileName: string, fileType: string) => void;
}

type FileType = "HTML" | "CSS" | "JS" | "MD" | "TXT" | "CSV";

const FILE_TYPE_ICONS: Record<FileType, IconDefinition> = {
  HTML: faFileCode,
  CSS: faCss3,
  JS: faJs,
  MD: faMarkdown,
  TXT: faFileLines,
  CSV: faFileCsv,
};

function SeparatorHorizontal() {
  return <div className={styles.separator} aria-hidden="true" />;
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
    <div className={styles.dropdownRoot} ref={dropdownRef}>
      <button
        type="button"
        onClick={onToggle}
        className={styles.dropdownTrigger}
      >
        <div className={styles.dropdownValue}>
          <span className={styles.dropdownValueText}>
            <FontAwesomeIcon
              icon={FILE_TYPE_ICONS[selectedType]}
              className={styles.dropdownIcon}
            />
            {selectedType}
          </span>
          <FontAwesomeIcon icon={faChevronDown} className={styles.chevronIcon} />
        </div>
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu}>
          <div className={styles.dropdownItems}>
            {fileTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  onSelect(type);
                  onToggle();
                }}
                className={styles.dropdownItem}
              >
                <FontAwesomeIcon
                  icon={FILE_TYPE_ICONS[type]}
                  className={styles.dropdownIcon}
                />
                <span>{type}</span>
              </button>
            ))}
          </div>
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
    <div className={styles.overlay}>
      <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
        <button
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Close dialog"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>

        <h3 className={styles.title}>Create a new file</h3>
        <SeparatorHorizontal />

        <p className={styles.description}>Give your new file a name and type.</p>

        <div className={styles.inputRow}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>File name</label>
            <input
              type="text"
              value={fileName}
              onChange={(event) => {
                setFileName(event.target.value);
                setError("");
              }}
              onKeyDown={handleKeyDown}
              placeholder="Enter file name"
              className={styles.textInput}
              autoFocus
            />
            {error ? <p className={styles.errorText}>{error}</p> : null}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>File type</label>
            <FileTypeDropdown
              selectedType={fileType}
              isOpen={isDropdownOpen}
              onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
              onSelect={setFileType}
            />
          </div>
        </div>

        <SeparatorHorizontal />

        <div className={styles.actionsRow}>
          <button onClick={onClose} className={styles.secondaryButton}>
            Cancel
          </button>
          <button onClick={handleCreate} className={styles.primaryButton}>
            {createButtonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
