import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { AppButton } from "../../../ui/AppButton";
import { Lab2Shell } from "../../../lab2/Lab2Shell";
import {
  mockFreeResponseLevel,
  type FreeResponseLevelPayload,
} from "../../../../data/assessment";
import { initialChatMessages } from "../../../../data/weblab2";
import { useChatState } from "../../../../hooks/useChatState";
import { useLayoutState } from "../../../../hooks/useLayoutState";
import { useVersionHistoryState } from "../../../../hooks/useVersionHistoryState";
import type { LevelProgressLink } from "../../../ui/header/LevelProgressBubbles";
import {
  AssessmentBottomRow,
  AssessmentStemSection,
} from "../../shared";
import { FaIcon } from "@/icons";
import { UploadedFileChip } from "./UploadedFileChip";
import styles from "./FreeResponseWorkspace.module.scss";

interface FreeResponseWorkspaceProps {
  payload?: FreeResponseLevelPayload;
  levelLinks?: LevelProgressLink[];
  currentLevelPath?: string;
  completedLevelPaths?: string[];
}

export function FreeResponseWorkspace({
  payload = mockFreeResponseLevel,
  levelLinks,
  currentLevelPath,
  completedLevelPaths,
}: FreeResponseWorkspaceProps = {}) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    activeTab,
    setActiveTab,
    isSettingsOpen,
    setIsSettingsOpen,
    sidebarWidth,
    setSidebarWidth,
  } = useLayoutState();
  const { chatMessages, setChatMessages, chatInput, setChatInput } =
    useChatState(initialChatMessages);
  const {
    selectedHistoryVersion,
    setSelectedHistoryVersion,
    showRestoreSuccessAlert,
    setShowRestoreSuccessAlert,
    showSaveSuccessAlert,
    setShowSaveSuccessAlert,
    handleSaveVersion,
    handleRestoreVersion,
  } = useVersionHistoryState();

  const { level } = payload;
  const revealAnswerEnabled = level.revealAnswerEnabled === true;
  const allowFileUpload = level.allowFileUpload === true;
  const teacherAnswer = level.teacherAnswer;

  const [responseText, setResponseText] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isTeacherAnswerRevealed, setIsTeacherAnswerRevealed] =
    useState(false);

  useEffect(() => {
    setResponseText("");
    setIsSubmitted(false);
    setAttachedFile(null);
    setIsTeacherAnswerRevealed(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [level.id]);

  const continuePath = useMemo(() => {
    if (!levelLinks?.length || !currentLevelPath) {
      return "/levels";
    }
    const index = levelLinks.findIndex(
      (link) => link.path === currentLevelPath,
    );
    if (index === -1) {
      return "/levels";
    }
    return levelLinks[index + 1]?.path ?? "/levels";
  }, [levelLinks, currentLevelPath]);

  const meetsMinimumLength = useMemo(
    () => responseText.trim().length >= level.question.minCharacters,
    [level.question.minCharacters, responseText],
  );

  const hasFile = attachedFile != null;

  const canSubmit = useMemo(() => {
    if (allowFileUpload) {
      return meetsMinimumLength || hasFile;
    }
    return meetsMinimumLength;
  }, [allowFileUpload, meetsMinimumLength, hasFile]);

  const inputDisabled =
    isSubmitted || (revealAnswerEnabled && isTeacherAnswerRevealed);

  const rubricCriteria =
    teacherAnswer?.rubricCriteria?.filter(Boolean) ?? [];
  const expectedElements =
    teacherAnswer?.expectedElements?.filter(Boolean) ?? [];
  const showRubric = rubricCriteria.length > 0;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0];
    setAttachedFile(next ?? null);
  };

  const clearFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileDropZoneDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleFileDropZoneDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const next = event.dataTransfer.files?.[0];
    if (next) {
      setAttachedFile(next);
    }
  };

  return (
    <Lab2Shell
      topNavigationProps={{
        title: `${level.metadata.lessonName} - ${level.name}`,
        subtitle: "Draft assessment level on Lab2 shell",
        currentLevel: level.metadata.levelPosition,
        totalLevels: level.metadata.totalLevelsInScript,
        completedLevels: [1, 2, 3],
        levelLinks,
        currentLevelPath,
        completedLevelPaths,
      }}
      sidebarProps={{
        activeTab,
        setActiveTab,
        sidebarWidth,
        isSettingsOpen,
        setIsSettingsOpen,
        chatMessages,
        setChatMessages,
        chatInput,
        setChatInput,
        selectedHistoryVersion,
        setSelectedHistoryVersion,
        onSaveVersion: handleSaveVersion,
        onRestoreVersion: handleRestoreVersion,
        showRestoreSuccessAlert,
        setShowRestoreSuccessAlert,
        showSaveSuccessAlert,
        setShowSaveSuccessAlert,
        showHistoryTab: false,
        showContinueButton: false,
      }}
      onResize={(delta) => {
        setSidebarWidth((prev) =>
          Math.max(300, Math.min(600, prev + delta))
        );
      }}
    >
      <main className={styles.workspace}>
        <div className={styles.card}>
          <AssessmentStemSection
            eyebrow="Free response"
            question={level.stem.question}
            description={level.stem.description}
          >
            <div className={styles.inputWrap}>
              <textarea
                className={styles.textarea}
                value={responseText}
                disabled={inputDisabled}
                placeholder={level.question.placeholder}
                onChange={(event) => setResponseText(event.target.value)}
              />
              <div className={styles.hintRow}>
                <p className={styles.hintText}>
                  {allowFileUpload
                    ? `Minimum ${level.question.minCharacters} characters in the text box, or attach a file (or both).`
                    : `Minimum ${level.question.minCharacters} characters`}
                </p>
                <p className={styles.hintText}>
                  <span className={styles.charCountStrong}>
                    {responseText.trim().length}
                  </span>{" "}
                  characters
                </p>
              </div>
              {allowFileUpload ? (
                <div className={styles.fileRow}>
                  <div
                    className={styles.fileDropZone}
                    onDragOver={handleFileDropZoneDragOver}
                    onDrop={handleFileDropZoneDrop}
                  >
                    <input
                      ref={fileInputRef}
                      aria-hidden="true"
                      className={styles.fileInputHidden}
                      tabIndex={-1}
                      type="file"
                      disabled={inputDisabled}
                      onChange={handleFileChange}
                    />
                    <div className={styles.fileDropZoneInner}>
                      <AppButton
                        type="button"
                        variant="secondary"
                        tone="gray"
                        size="s"
                        iconPosition="start"
                        iconName="upload"
                        disabled={inputDisabled}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Attach a file
                      </AppButton>
                    </div>
                  </div>
                  {attachedFile ? (
                    <UploadedFileChip
                      file={attachedFile}
                      disabled={inputDisabled}
                      onRemove={clearFile}
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
          </AssessmentStemSection>

          {revealAnswerEnabled &&
          isTeacherAnswerRevealed &&
          teacherAnswer ? (
            <div
              className={styles.inlineTeacherAnswer}
              aria-label="Teacher answer key"
            >
              <p className={styles.teacherOnlyEyebrow}>Teacher answer key</p>
              <div className={styles.teacherAnswerBody}>
                <p className={styles.exemplarLabel}>Exemplar response</p>
                <p className={styles.exemplar}>{teacherAnswer.exemplar}</p>
                {showRubric ? (
                  <>
                    <p className={styles.listLabel}>Rubric criteria</p>
                    <ul className={styles.list}>
                      {rubricCriteria.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </>
                ) : expectedElements.length > 0 ? (
                  <>
                    <p className={styles.listLabel}>Expected elements</p>
                    <ul className={styles.list}>
                      {expectedElements.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </div>
            </div>
          ) : null}

          <AssessmentBottomRow
            showLeft={revealAnswerEnabled}
            left={
              revealAnswerEnabled ? (
                <AppButton
                  variant="secondary"
                  tone="gray"
                  iconPosition="start"
                  iconName={
                    isTeacherAnswerRevealed ? "eye-slash" : "eye"
                  }
                  size="m"
                  onClick={() =>
                    setIsTeacherAnswerRevealed((current) => !current)
                  }
                >
                  {isTeacherAnswerRevealed ? "Hide answer" : "Reveal answer"}
                </AppButton>
              ) : null
            }
            right={
              <>
                {isSubmitted && (
                  <>
                    <span className={styles.submittedTag} role="status">
                      <FaIcon
                        name="check"
                        size="xs"
                        className={styles.submittedTagIcon}
                      />
                      Submitted
                    </span>
                    <AppButton
                      variant="primary"
                      size="m"
                      tone="purple"
                      onClick={() => navigate(continuePath)}
                    >
                      Continue
                    </AppButton>
                  </>
                )}
                {!isSubmitted && (
                  <AppButton
                    variant="primary"
                    size="m"
                    tone="purple"
                    onClick={() => setIsSubmitted(true)}
                    disabled={
                      !canSubmit ||
                      (revealAnswerEnabled && isTeacherAnswerRevealed)
                    }
                  >
                    Submit response
                  </AppButton>
                )}
              </>
            }
          />
        </div>
      </main>
    </Lab2Shell>
  );
}
