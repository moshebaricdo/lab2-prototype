import { useEffect, useState } from "react";
import { Dropdown, Modal, TextInput } from "@moshebaricdo/cads-react";
import { CadsLabProvider } from "../../lab2/CadsLabProvider";
import type { FaIconName } from "../../../icons/faProRegularCodepoints";
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

function cadsFileTypeIcon(type: FileType): FaIconName {
  const icon = getFileTypeIconConfigForCreateFileType(type);
  if (icon.family === "solid") return icon.name;
  if (type === "MD") return "file-lines";
  return "file-code";
}

interface FileTypeDropdownProps {
  selectedType: FileType;
  fileTypes: FileType[];
  onSelect: (type: FileType) => void;
}

function FileTypeDropdown({
  selectedType,
  fileTypes,
  onSelect,
}: FileTypeDropdownProps) {
  return (
    <Dropdown
      role="input"
      label="File type"
      size="medium"
      color="secondary"
      width="full"
      menuWidth="trigger"
      startIconName={cadsFileTypeIcon(selectedType)}
      value={selectedType}
      options={fileTypes.map((type) => ({
        value: type,
        label: type,
        iconName: cadsFileTypeIcon(type),
      }))}
      onChange={(nextValue) => onSelect(String(nextValue) as FileType)}
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
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setFileName("");
      setFileType(defaultFileType);
      setError("");
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

  const fullFileName = getFullFileName();
  const createButtonLabel = fullFileName ? `Create ${fullFileName}` : "Create file";

  return (
    <CadsLabProvider>
      <Modal
        open={isOpen}
        onClose={onClose}
        title="Create a new file"
        primaryActionLabel={createButtonLabel}
        secondaryActionLabel="Cancel"
        onPrimaryAction={handleCreate}
        onSecondaryAction={onClose}
      >
        <div className={styles.body}>
          <p className={styles.description}>Give your new file a name and type.</p>
          <div className={styles.inputRow}>
            <div className={`${styles.fieldGroup} ${styles.fileNameField}`}>
              <TextInput
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
                error={Boolean(error)}
                helperText={error || undefined}
                size="medium"
                color="secondary"
              />
            </div>

            <div className={`${styles.fieldGroup} ${styles.fileTypeField}`}>
              <FileTypeDropdown
                selectedType={fileType}
                fileTypes={fileTypes}
                onSelect={setFileType}
              />
            </div>
          </div>
        </div>
      </Modal>
    </CadsLabProvider>
  );
}
