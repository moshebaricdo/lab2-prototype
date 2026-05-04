import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import emptyStateNewProject from "../../../../assets/empty-states/empty-state-new-project.svg";
import { AppButton } from "../../../ui/AppButton";
import { FaIcon } from "../../../ui/icons/FaIcon";
import type { TutorRequestMode } from "../../../../types/tutor";
import styles from "./NewProjectEmptyState.module.scss";

const DEFAULT_STARTER_UPLOAD_ACCEPT = ".html,.htm,.css,.js,.json,.txt,.md";

const PLAN_WITH_TUTOR_PROMPT =
  "Help me plan a new web project before we build. Ask me some guiding questions and create a plan that we can revise together.";
const BUILD_WITH_TUTOR_PROMPT =
  "Help me start this new project. I want to build a web app that...";

interface NewProjectEmptyStateProps {
  isViewingHistoryVersion: boolean;
  onCreateFile: () => void;
  onStartWithTutor?: (prompt?: string, requestMode?: TutorRequestMode) => void;
  onUploadStarterFiles?: (files: FileList) => Promise<true | string | void> | true | string | void;
  starterUploadAccept?: string;
}

export function NewProjectEmptyState({
  isViewingHistoryVersion,
  onCreateFile,
  onStartWithTutor,
  onUploadStarterFiles,
  starterUploadAccept = DEFAULT_STARTER_UPLOAD_ACCEPT,
}: NewProjectEmptyStateProps) {
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingStarterFiles, setIsUploadingStarterFiles] = useState(false);
  const [starterUploadError, setStarterUploadError] = useState<string | null>(null);
  const [isStarterDropActive, setIsStarterDropActive] = useState(false);

  const uploadStarterFiles = (files: FileList | null, resetInput?: HTMLInputElement) => {
    if (!files || files.length === 0) return;
    if (!onUploadStarterFiles) {
      setStarterUploadError("Starter file upload is not available for this project.");
      if (resetInput) resetInput.value = "";
      return;
    }

    setIsUploadingStarterFiles(true);
    setStarterUploadError(null);
    void Promise.resolve(onUploadStarterFiles(files))
      .then((result) => {
        if (typeof result === "string") {
          setStarterUploadError(result);
        }
      })
      .catch((error) => {
        console.error("[NewProjectEmptyState] Starter file upload failed", error);
        setStarterUploadError("Unable to load those files. Try a smaller text-only project.");
      })
      .finally(() => {
        setIsUploadingStarterFiles(false);
        if (resetInput) resetInput.value = "";
      });
  };

  const handleStarterUploadChange = (event: ChangeEvent<HTMLInputElement>) => {
    uploadStarterFiles(event.currentTarget.files, event.currentTarget);
  };

  const handleStarterDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsStarterDropActive(false);
    if (isViewingHistoryVersion || isUploadingStarterFiles) return;
    uploadStarterFiles(event.dataTransfer.files);
  };

  return (
    <div className={styles.root}>
      <section className={styles.intro} aria-labelledby="new-project-heading">
        <div className={styles.hero}>
          <div className={styles.copy}>
            <p className={styles.eyebrow}>New project</p>
            <h2 id="new-project-heading" className={styles.heading}>
              How do you want to begin?
            </h2>
            <p className={styles.description}>
              Start from a blank file tree, bring in starter files, or use AI Tutor to think through an idea before building.
            </p>
          </div>
          <img
            src={emptyStateNewProject}
            alt=""
            className={styles.illustration}
          />
        </div>

        <div className={styles.startPathGrid}>
          <article className={styles.startPathCard}>
            <div className={styles.startPathContent}>
              <h3 className={styles.startPathTitle}>Set up the files yourself</h3>
              <p className={styles.startPathText}>
                Create the project structure one piece at a time, or upload starter files you already have.
              </p>
            </div>
            <div
              className={`${styles.manualDropZone} ${isStarterDropActive ? styles.manualDropZoneActive : ""}`}
              onDragEnter={(event) => {
                event.preventDefault();
                if (!isViewingHistoryVersion && !isUploadingStarterFiles) {
                  setIsStarterDropActive(true);
                }
              }}
              onDragOver={(event) => {
                event.preventDefault();
              }}
              onDragLeave={(event) => {
                if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
                setIsStarterDropActive(false);
              }}
              onDrop={handleStarterDrop}
            >
              <AppButton
                variant="primary"
                tone="purple"
                size="s"
                iconName="plus"
                onClick={onCreateFile}
                disabled={isViewingHistoryVersion}
              >
                Create file
              </AppButton>
              <div className={styles.manualUploadHint}>
                <p className={styles.manualDropText}>
                  {isUploadingStarterFiles ? "Uploading files..." : "You can also drag files here to upload."}
                </p>
                <button
                  type="button"
                  className={styles.manualBrowseButton}
                  onClick={() => uploadInputRef.current?.click()}
                  disabled={isViewingHistoryVersion || !onUploadStarterFiles || isUploadingStarterFiles}
                >
                  Browse files
                </button>
              </div>
              <input
                ref={uploadInputRef}
                type="file"
                accept={starterUploadAccept}
                multiple
                className={styles.starterUploadInput}
                tabIndex={-1}
                onChange={handleStarterUploadChange}
              />
            </div>
            {starterUploadError ? (
              <p className={styles.startPathError} role="alert">
                {starterUploadError}
              </p>
            ) : null}
          </article>

          <article className={`${styles.startPathCard} ${styles.aiStartPathCard}`}>
            <div className={styles.startPathContent}>
              <h3 className={styles.startPathTitle}>Start with AI Tutor</h3>
              <p className={styles.startPathText}>
                Choose a thinking path when you want help shaping the idea, or a building path when you are ready for starter files.
              </p>
            </div>
            <div className={styles.aiPromptList}>
              <button
                type="button"
                className={styles.aiPromptButton}
                onClick={() => onStartWithTutor?.(PLAN_WITH_TUTOR_PROMPT, "auto")}
                disabled={isViewingHistoryVersion || !onStartWithTutor}
              >
                <span className={styles.aiPromptIcon} aria-hidden="true">
                  <FaIcon name="message-lines" size="s" />
                </span>
                <span>
                  <span className={styles.aiPromptTitle}>Plan out your project</span>
                  <span className={styles.aiPromptText}>Brainstorm ideas and create a plan.</span>
                </span>
              </button>
              <button
                type="button"
                className={styles.aiPromptButton}
                onClick={() => onStartWithTutor?.(BUILD_WITH_TUTOR_PROMPT, "auto")}
                disabled={isViewingHistoryVersion || !onStartWithTutor}
              >
                <span className={styles.aiPromptIcon} aria-hidden="true">
                  <FaIcon name="wand-magic-sparkles" size="s" />
                </span>
                <span>
                  <span className={styles.aiPromptTitle}>Build your project</span>
                  <span className={styles.aiPromptText}>Ask Tutor to generate a new project</span>
                </span>
              </button>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
