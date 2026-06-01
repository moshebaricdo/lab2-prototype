import { useEffect, useState } from "react";
import { AppActionDropdown } from "../../ui/AppDropdown";
import { AppButton } from "../../ui/AppButton";
import { AppTextField } from "../../ui/AppTextField";
import { Modal } from "../../ui/Modal";
import { FaIcon } from "../../ui/icons/FaIcon";
import {
  getFileTypeIconConfigForCreateFileType,
  type CreateFileModalType,
} from "../../../lib/fileTypeIcons";
import styles from "./CreateFileModal.module.scss";

interface CreateFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (fileName: string, fileType: string) => true | string | void;
  defaultFileType?: FileType;
  fileTypes?: FileType[];
}

type FileType = CreateFileModalType;

const DEFAULT_FILE_TYPES: FileType[] = ["HTML", "CSS", "JS", "MD", "TXT", "CSV"];

interface FileTypeDropdownProps {
  selectedType: FileType;
  fileTypes: FileType[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: FileType) => void;
}

function FileTypeDropdown({
  selectedType,
  fileTypes,
  isOpen,
  onOpenChange,
  onSelect,
}: FileTypeDropdownProps) {
  const selectedIcon = getFileTypeIconConfigForCreateFileType(selectedType);

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
              family={selectedIcon.family}
              name={selectedIcon.name}
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
      items={fileTypes.map((type) => {
        const icon = getFileTypeIconConfigForCreateFileType(type);
        return {
          id: type,
          label: type,
          icon: (
            <FaIcon family={icon.family} name={icon.name} size="s" />
          ),
          onSelect: () => onSelect(type),
        };
      })}
    />
  );
}

export function CreateFileModal({
  isOpen,
  onClose,
  onCreate,
  defaultFileType = "HTML",
  fileTypes = DEFAULT_FILE_TYPES,
}: CreateFileModalProps) {
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState<FileType>(defaultFileType);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setFileName("");
      setFileType(defaultFileType);
      setError("");
      setIsDropdownOpen(false);
    }
  }, [defaultFileType, isOpen]);

  const getFileExtension = (type: FileType): string => {
    const extensions: Record<FileType, string> = {
      HTML: ".html",
      CSS: ".css",
      JS: ".js",
      PY: ".py",
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
        <div
          className={styles.fieldGroup}
          style={{ flex: "0 1 76%" }}
        >
          <AppTextField
            label="File name"
            type="text"
            value={fileName}
            onChange={(event) => {
              setFileName(event.target.value);
              setError("");
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter file name"
            autoFocus
            errorText={error || undefined}
            size="m"
            tone="gray"
          />
        </div>

        <div
          className={styles.fieldGroup}
          style={{ flex: "0 1 30%" }}
        >
          <label className={styles.fieldLabel}>File type</label>
          <FileTypeDropdown
            selectedType={fileType}
            fileTypes={fileTypes}
            isOpen={isDropdownOpen}
            onOpenChange={setIsDropdownOpen}
            onSelect={setFileType}
          />
        </div>
      </div>
    </Modal>
  );
}
