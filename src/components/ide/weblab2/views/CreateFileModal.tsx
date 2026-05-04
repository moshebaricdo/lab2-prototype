import { useEffect, useState } from "react";
import { AppActionDropdown } from "../../../ui/AppDropdown";
import { AppButton } from "../../../ui/AppButton";
import { Modal } from "../../../ui/Modal";
import { FaIcon } from "../../../ui/icons/FaIcon";
import type { FaIconName } from "../../../../icons/faProRegularCodepoints";
import styles from "./CreateFileModal.module.scss";

interface CreateFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (fileName: string, fileType: string) => true | string | void;
}

type FileType = "HTML" | "CSS" | "JS" | "MD" | "TXT" | "CSV";

const FILE_TYPE_ICONS: Record<FileType, FaIconName> = {
  HTML: "file-code",
  CSS: "file-brackets-curly",
  JS: "file-code",
  MD: "file-lines",
  TXT: "file-lines",
  CSV: "file-csv",
};

interface FileTypeDropdownProps {
  selectedType: FileType;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: FileType) => void;
}

function FileTypeDropdown({
  selectedType,
  isOpen,
  onOpenChange,
  onSelect,
}: FileTypeDropdownProps) {
  const fileTypes: FileType[] = ["HTML", "CSS", "JS", "MD", "TXT", "CSV"];

  return (
    <AppActionDropdown
      open={isOpen}
      onOpenChange={onOpenChange}
      align="start"
      size="m"
      menuWidth="var(--radix-popover-trigger-width)"
      listLabel="File types"
      trigger={
        <button
          type="button"
          className={styles.dropdownTrigger}
        >
          <span className={styles.dropdownValueText}>
            <FaIcon
              name={FILE_TYPE_ICONS[selectedType]}
              size="s"
              className={styles.dropdownIcon}
            />
            {selectedType}
          </span>
          <FaIcon
            name={isOpen ? "chevron-up" : "chevron-down"}
            size="s"
            className={styles.chevronIcon}
          />
        </button>
      }
      items={fileTypes.map((type) => ({
        id: type,
        label: type,
        iconName: FILE_TYPE_ICONS[type],
        onSelect: () => onSelect(type),
      }))}
    />
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
    const result = onCreate(fullFileName, fileType);
    if (typeof result === "string") {
      setError(result);
      return;
    }
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create a new file"
      description="Give your new file a name and type."
      footer={
        <>
          <AppButton variant="secondary" tone="gray" size="m" onClick={onClose}>
            Cancel
          </AppButton>
          <AppButton variant="primary" tone="purple" size="m" onClick={handleCreate}>
            {createButtonLabel}
          </AppButton>
        </>
      }
    >
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
            onOpenChange={setIsDropdownOpen}
            onSelect={setFileType}
          />
        </div>
      </div>
    </Modal>
  );
}
