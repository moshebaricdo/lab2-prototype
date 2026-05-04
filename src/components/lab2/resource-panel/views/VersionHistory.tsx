import { useEffect, useMemo, useRef, useState } from "react";
import { AppButton } from "../../../ui/AppButton";
import { AiTutorIcon } from "../../../ui/icons/AiTutorIcon";
import { FaIcon } from "../../../ui/icons/FaIcon";
import { Dialog } from "../../../ui/Dialog";
import { Tooltip } from "../../../ui/Tooltip";
import { ScrollArea } from "../../../ui/scroll-area";
import { AlertBanner } from "../../../ui/AlertBanner";
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
  showNewProjectEmptyState?: boolean;
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
  showNewProjectEmptyState = false,
}: VersionHistoryProps) {
  const [internalSelectedVersion, setInternalSelectedVersion] = useState("current");
  const [expandedAutoSaveGroups, setExpandedAutoSaveGroups] = useState<Set<string>>(
    () => new Set(),
  );
  const [versionDescription, setVersionDescription] = useState("");
  const [isDescriptionKeyboardFocused, setIsDescriptionKeyboardFocused] = useState(false);
  const [showStartOverConfirm, setShowStartOverConfirm] = useState(false);
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
    if (versionId === "initial") {
      setShowStartOverConfirm(true);
      return;
    }

    onRestoreVersion?.(versionId);
    setShowRestoreSuccessAlert?.(true);
  };

  const handleConfirmStartOver = () => {
    onRestoreVersion?.("initial");
    setShowRestoreSuccessAlert?.(true);
    setShowStartOverConfirm(false);
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
          <div
            className={styles.row}
            onClick={() => handleVersionChange(version.id)}
          >
            <button
              onClick={(event) => {
                event.stopPropagation();
                handleVersionChange(version.id);
              }}
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
                onClick={(event) => {
                  event.stopPropagation();
                  handleRestoreVersion(version.id);
                }}
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
      <ScrollArea
        className={styles.scrollArea}
        viewportClassName={styles.scrollViewport}
      >
        {showNewProjectEmptyState ? (
          <div className={styles.emptyWrap}>
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>
                <FaIcon name="clock-rotate-left" size="l" />
              </div>
              <h2 className={styles.emptyStateTitle}>No version history yet</h2>
              <p className={styles.emptyStateText}>
                Version history will appear once files are created or added to this project.
              </p>
            </div>
          </div>
        ) : (
          <div className={styles.content}>
            <div className={styles.section}>
              <div className={styles.card}>
                <div
                  className={styles.row}
                  onClick={() => handleVersionChange(currentVersion.id)}
                >
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleVersionChange(currentVersion.id);
                    }}
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
        )}
      </ScrollArea>

      {showSaveSuccessAlert || showRestoreSuccessAlert ? (
        <div className={styles.toastWrap}>
          {showSaveSuccessAlert ? (
            <AlertBanner
              duration={2500}
              onDismiss={() => setShowSaveSuccessAlert?.(false)}
              presentation="toast"
              sentiment="success"
              showIcon
              size="xs"
            >
              Successfully saved version.
            </AlertBanner>
          ) : null}

          {showRestoreSuccessAlert ? (
            <AlertBanner
              duration={2500}
              onDismiss={() => setShowRestoreSuccessAlert?.(false)}
              presentation="toast"
              sentiment="success"
              showIcon
              size="xs"
            >
              Version successfully restored!
            </AlertBanner>
          ) : null}
        </div>
      ) : null}

      <Dialog
        open={showStartOverConfirm}
        title="Are you sure you want to start over?"
        size="l"
        onClose={() => setShowStartOverConfirm(false)}
        decorativeIcon={<FaIcon name="clock-rotate-left" size="inherit" />}
        decorativeIconClassName={styles.startOverIcon}
        panelClassName={styles.startOverPanel}
        headerClassName={styles.startOverHeader}
        titleClassName={styles.startOverTitle}
        bodyClassName={styles.startOverBody}
        footerClassName={styles.startOverFooter}
        closeButtonClassName={styles.startOverClose}
        footer={
          <>
            <AppButton
              variant="secondary"
              tone="gray"
              size="m"
              onClick={() => setShowStartOverConfirm(false)}
            >
              Cancel
            </AppButton>
            <AppButton
              variant="primary"
              tone="purple"
              size="m"
              onClick={handleConfirmStartOver}
            >
              Start over
            </AppButton>
          </>
        }
      >
        <p className={styles.startOverText}>
          This will reset the workspace to its start state and remove all the code
          you&apos;ve added or changed.
        </p>
      </Dialog>
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
