import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCloudArrowUp,
  faAnglesDown,
  faAnglesUp,
  faArrowRotateLeft,
  faSave,
} from "@fortawesome/free-solid-svg-icons";
import { Tooltip } from "../../ui/Tooltip";
import { ScrollArea } from "../../ui/scroll-area";
import { SuccessAlert } from "../../ui/SuccessAlert";
import styles from "./VersionHistory.module.scss";

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
  const [internalSelectedVersion, setInternalSelectedVersion] = useState("current");
  const [showAutoSaves, setShowAutoSaves] = useState(true);
  const [versionDescription, setVersionDescription] = useState("");

  const selectedVersion = externalSelectedVersion ?? internalSelectedVersion;

  const currentVersion = useMemo(
    () => versions.find((item) => item.id === "current") ?? defaultVersions[0],
    [versions],
  );
  const nonCurrentVersions = useMemo(
    () =>
      versions.filter(
        (item) => item.id !== "current" && !item.isAutoSave && item.id !== "initial",
      ),
    [versions],
  );
  const initialVersion = useMemo(
    () => versions.find((item) => item.id === "initial"),
    [versions],
  );
  const autoSaveVersions = useMemo(
    () => versions.filter((item) => item.isAutoSave),
    [versions],
  );

  const handleVersionChange = (versionId: string) => {
    setInternalSelectedVersion(versionId);
    onVersionChange?.(versionId);
  };

  const handleSaveVersion = () => {
    if (!versionDescription.trim()) {
      return;
    }
    onSaveVersion?.(versionDescription);
    setVersionDescription("");
    setShowSaveSuccessAlert?.(true);
  };

  const handleRestoreVersion = (versionId: string) => {
    onRestoreVersion?.(versionId);
    setShowRestoreSuccessAlert?.(true);
  };

  const renderVersionRow = (version: VersionItem) => {
    const isSelected = selectedVersion === version.id;
    return (
      <div key={version.id} className={styles.section}>
        <div className={styles.connector} />
        <div className={styles.card}>
          <div className={styles.row}>
            <button
              onClick={() => handleVersionChange(version.id)}
              className={styles.rowMain}
            >
              <span className={`${styles.radio} ${isSelected ? styles.radioSelected : ""}`}>
                {isSelected ? <span className={styles.radioDot} /> : null}
              </span>
              <p className={`${styles.label} ${version.isAutoSave ? styles.labelAutosave : ""}`}>
                {version.label}
              </p>
            </button>

            {isSelected ? (
              <button
                onClick={() => handleRestoreVersion(version.id)}
                className={styles.restoreButton}
              >
                <span className={styles.iconSmall}>
                  <FontAwesomeIcon icon={faArrowRotateLeft} />
                </span>
                <span>Restore</span>
              </button>
            ) : version.isAutoSave ? (
              <Tooltip content="Autosave version" position="top">
                <span className={styles.autosaveIcon}>
                  <FontAwesomeIcon icon={faCloudArrowUp} />
                </span>
              </Tooltip>
            ) : (
              <span aria-hidden="true" className={styles.iconSmall} />
            )}
          </div>
          {version.description ? <p className={styles.description}>{version.description}</p> : null}
        </div>
      </div>
    );
  };

  return (
    <ScrollArea className={styles.root}>
      <div className={styles.content}>
        {showRestoreSuccessAlert ? (
          <div className={styles.alertWrap}>
            <SuccessAlert
              message="Version successfully restored!"
              onClose={() => setShowRestoreSuccessAlert?.(false)}
            />
          </div>
        ) : null}

        {showSaveSuccessAlert ? (
          <div className={styles.alertWrap}>
            <SuccessAlert
              message="Successfully saved version."
              onClose={() => setShowSaveSuccessAlert?.(false)}
            />
          </div>
        ) : null}

        <div className={styles.section}>
          <div className={styles.card}>
            <div className={styles.row}>
              <button
                onClick={() => handleVersionChange(currentVersion.id)}
                className={styles.rowMain}
              >
                <span
                  className={`${styles.radio} ${
                    selectedVersion === currentVersion.id ? styles.radioSelected : ""
                  }`}
                >
                  {selectedVersion === currentVersion.id ? (
                    <span className={styles.radioDot} />
                  ) : null}
                </span>
                <p className={styles.label}>Current Version</p>
              </button>
            </div>

            <div className={styles.savePanel}>
              <div className={styles.textareaWrap}>
                <textarea
                  value={versionDescription}
                  onChange={(event) => setVersionDescription(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      (event.metaKey || event.ctrlKey) &&
                      versionDescription.trim()
                    ) {
                      handleSaveVersion();
                    }
                  }}
                  placeholder="Describe your changes"
                  className={styles.textarea}
                />
              </div>

              <button
                onClick={handleSaveVersion}
                disabled={!versionDescription.trim()}
                className={`${styles.saveButton} ${
                  !versionDescription.trim() ? styles.saveButtonDisabled : ""
                }`}
              >
                <span className={styles.buttonIcon}>
                  <FontAwesomeIcon icon={faSave} />
                </span>
                <span>Save current version</span>
              </button>
            </div>
          </div>
        </div>

        {nonCurrentVersions.map(renderVersionRow)}

        {autoSaveVersions.length > 0 ? (
          <div className={styles.section}>
            <div className={styles.connector} />
            <div className={styles.toggleWrap}>
              <button
                onClick={() => setShowAutoSaves((previous) => !previous)}
                className={styles.toggleButton}
              >
                <span className={styles.iconSmall}>
                  <FontAwesomeIcon icon={showAutoSaves ? faAnglesUp : faAnglesDown} />
                </span>
                <span>{showAutoSaves ? "Hide" : "Show"} {autoSaveVersions.length} auto-saves</span>
              </button>
            </div>
          </div>
        ) : null}

        {showAutoSaves ? autoSaveVersions.map(renderVersionRow) : null}

        {initialVersion ? renderVersionRow(initialVersion) : null}
      </div>
    </ScrollArea>
  );
}

const defaultVersions: VersionItem[] = [
  { id: "current", label: "Current Version" },
  {
    id: "aug30",
    label: "Aug 30, 1:30PM",
    description: "Fixed issue with text overflow in containers and buttons not linking properly.",
  },
  { id: "aug27", label: "Aug 27, 1:30PM", isAutoSave: true },
  { id: "aug26-1", label: "Aug 26, 12:30PM", isAutoSave: true },
  { id: "aug26-2", label: "Aug 26, 9:30AM", isAutoSave: true },
  { id: "aug24", label: "Aug 24, 12:30PM", isAutoSave: true },
  { id: "initial", label: "Initial Version" },
];
