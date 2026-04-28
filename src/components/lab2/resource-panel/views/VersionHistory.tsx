import { useEffect, useMemo, useRef, useState } from "react";
import { AppButton } from "../../../ui/AppButton";
import { AiTutorIcon } from "../../../ui/icons/AiTutorIcon";
import { FaIcon } from "../../../ui/icons/FaIcon";
import { Tooltip } from "../../../ui/Tooltip";
import { ScrollArea } from "../../../ui/scroll-area";
import { SuccessAlert } from "../../../ui/SuccessAlert";
import styles from "./VersionHistory.module.scss";

export interface VersionItem {
  id: string;
  label: string;
  description?: string;
  isAutoSave?: boolean;
  isAiSave?: boolean;
  createdAt?: string;
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
  const [expandedAutoSaveGroups, setExpandedAutoSaveGroups] = useState<Set<string>>(
    () => new Set(),
  );
  const [versionDescription, setVersionDescription] = useState("");
  const [isDescriptionKeyboardFocused, setIsDescriptionKeyboardFocused] = useState(false);
  const lastFocusWasKeyboardRef = useRef(false);

  const selectedVersion = externalSelectedVersion ?? internalSelectedVersion;

  const currentVersion = useMemo(
    () => versions.find((item) => item.id === "current") ?? defaultVersions[0],
    [versions],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        lastFocusWasKeyboardRef.current = true;
      }
    };
    const handlePointerDown = () => {
      lastFocusWasKeyboardRef.current = false;
    };

    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, []);

  const timelineEntries = useMemo(() => {
    const entries: Array<
      | { type: "version"; version: VersionItem }
      | { type: "autosaves"; id: string; versions: VersionItem[] }
    > = [];
    let pendingAutoSaves: VersionItem[] = [];

    const flushAutoSaves = () => {
      if (pendingAutoSaves.length === 0) return;
      entries.push({
        type: "autosaves",
        id: pendingAutoSaves.map((version) => version.id).join(":"),
        versions: pendingAutoSaves,
      });
      pendingAutoSaves = [];
    };

    for (const version of versions.filter((item) => item.id !== "current")) {
      if (version.isAutoSave) {
        pendingAutoSaves.push(version);
      } else {
        flushAutoSaves();
        entries.push({ type: "version", version });
      }
    }

    flushAutoSaves();
    return entries;
  }, [versions]);

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

  const toggleAutoSaveGroup = (groupId: string) => {
    setExpandedAutoSaveGroups((previous) => {
      const next = new Set(previous);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
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
                  <FaIcon name="arrow-rotate-left" size="xs" />
                </span>
                <span>Restore</span>
              </button>
            ) : version.isAutoSave ? (
              <Tooltip content="Autosave version" position="top">
                <span className={styles.autosaveIcon}>
                  <FaIcon name="cloud-arrow-up" size="s" />
                </span>
              </Tooltip>
            ) : version.isAiSave ? (
              <Tooltip content="AI Tutor save" position="top">
                <span className={styles.aiSaveIcon}>
                  <AiTutorIcon
                    className={styles.aiSaveIconSvg}
                    color="currentColor"
                  />
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
    <div className={styles.root}>
      <ScrollArea className={styles.scrollArea}>
        <div className={styles.content}>
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
                <textarea
                  value={versionDescription}
                  onFocus={() => {
                    setIsDescriptionKeyboardFocused(lastFocusWasKeyboardRef.current);
                  }}
                  onBlur={() => setIsDescriptionKeyboardFocused(false)}
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
                  data-keyboard-focused={isDescriptionKeyboardFocused ? "true" : undefined}
                  placeholder="Describe your changes"
                  className={styles.textarea}
                />

                <AppButton
                  variant="secondary"
                  tone="gray"
                  size="s"
                  fullWidth
                  iconName="floppy-disk"
                  onClick={handleSaveVersion}
                  disabled={!versionDescription.trim()}
                >
                  Save current version
                </AppButton>
              </div>
            </div>
          </div>

          {timelineEntries.map((entry) => {
            if (entry.type === "version") {
              return renderVersionRow(entry.version);
            }

            const isExpanded = expandedAutoSaveGroups.has(entry.id);
            return (
              <div key={entry.id}>
                <div className={styles.section}>
                  <div className={styles.connector} />
                  <div className={styles.toggleWrap}>
                    <AppButton
                      variant="tertiary"
                      tone="gray"
                      size="xs"
                      iconName={isExpanded ? "angles-up" : "angles-down"}
                      onClick={() => toggleAutoSaveGroup(entry.id)}
                    >
                      {isExpanded ? "Hide" : "Show"} {entry.versions.length} auto-save
                      {entry.versions.length === 1 ? "" : "s"}
                    </AppButton>
                  </div>
                </div>

                {isExpanded ? entry.versions.map(renderVersionRow) : null}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {showSaveSuccessAlert || showRestoreSuccessAlert ? (
        <div className={styles.toastWrap}>
          {showSaveSuccessAlert ? (
            <SuccessAlert
              message="Successfully saved version."
              onClose={() => setShowSaveSuccessAlert?.(false)}
            />
          ) : null}

          {showRestoreSuccessAlert ? (
            <SuccessAlert
              message="Version successfully restored!"
              onClose={() => setShowRestoreSuccessAlert?.(false)}
            />
          ) : null}
        </div>
      ) : null}
    </div>
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
