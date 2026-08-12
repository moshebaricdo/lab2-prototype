import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import emptyStateNewProject from "../../../../assets/empty-states/empty-state-new-project.svg";
import { Button } from "@moshebaricdo/cads-react";
import { FaIcon } from "../../../ui/icons/FaIcon";
import type { TutorRequestMode, TutorStartOptions } from "../../../../types/tutor";
import styles from "./NewProjectEmptyState.module.scss";

const DEFAULT_STARTER_UPLOAD_ACCEPT =
  ".html,.htm,.css,.js,.json,.txt,.md,.csv,.png,.jpg,.jpeg,.gif,.webp,.svg,.bmp,.ico";

const BUILD_WITH_TUTOR_PROMPT =
  "Help me make a new project. I want to build a web app that...";

interface NewProjectEmptyStateProps {
  isViewingHistoryVersion: boolean;
  onCreateFile: () => void;
  onStartWithTutor?: (
    prompt?: string,
    requestMode?: TutorRequestMode,
    options?: TutorStartOptions,
  ) => void;
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
        setStarterUploadError("Unable to load those files. Try a smaller project upload.");
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
              How do you want to start?
            </h2>
            <p className={styles.description}>
              Make your own files, add files from your computer, or ask AI Tutor to help turn your idea into a plan.
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
              <h3 className={styles.startPathTitle}>Start on your own</h3>
              <p className={styles.startPathText}>
                Create a new file, or upload starter files you already have on your computer.
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
              <div className={styles.manualActions}>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  startIconName="plus"
                  onClick={onCreateFile}
                  disabled={isViewingHistoryVersion}
                >
                  Create file
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  startIconName="file-arrow-up"
                  onClick={() => uploadInputRef.current?.click()}
                  disabled={isViewingHistoryVersion || !onUploadStarterFiles || isUploadingStarterFiles}
                >
                  Browse files
                </Button>
              </div>
              <div className={styles.manualUploadHint}>
                <p className={styles.manualDropText}>
                  {isUploadingStarterFiles ? "Adding files..." : "Or drag files here from your computer."}
                </p>
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
                Use AI Tutor to plan out your project, or start building with AI-generated code.
              </p>
            </div>
            <div className={styles.aiPromptList}>
              <button
                type="button"
                className={styles.aiPromptButton}
                onClick={() =>
                  onStartWithTutor?.(undefined, "plan", {
                    flow: "new-project-plan-questionnaire",
                  })
                }
                disabled={isViewingHistoryVersion || !onStartWithTutor}
              >
                <span className={styles.aiPromptIcon} aria-hidden="true">
                  <FaIcon name="lightbulb-on" size="s" />
                </span>
                <span>
                  <span className={styles.aiPromptTitle}>Help me create a plan for my idea</span>
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
                  <span className={styles.aiPromptTitle}>Help me make a starter project</span>
                </span>
              </button>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
