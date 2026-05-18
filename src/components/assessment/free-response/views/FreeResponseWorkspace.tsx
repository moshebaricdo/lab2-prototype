import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type SetStateAction,
} from "react";
import { useNavigate } from "react-router-dom";
import { AppButton } from "../../../ui/AppButton";
import { AppTextArea } from "../../../ui/AppTextField";
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
import type { CodePanelConfig } from "../../../../data/assessment/codePanel";
import type { DevPanelField } from "../../../lab2/dev";
import { resourcePanelCompactDevField } from "../../../lab2/dev";
import { usePropsOverride } from "../../../../hooks/usePropsOverride";
import {
  AssessmentBottomRow,
  AssessmentCodeRefLayout,
  AssessmentStemSection,
} from "../../shared";
import { FaIcon } from "@/icons";
import { UploadedFileChip } from "./UploadedFileChip";
import styles from "./FreeResponseWorkspace.module.scss";

interface FreeResponseWorkspaceProps {
  payload?: FreeResponseLevelPayload;
  codePanel?: CodePanelConfig;
  levelLinks?: LevelProgressLink[];
  currentLevelPath?: string;
  completedLevelPaths?: string[];
  embedded?: boolean;
  groupSubmitted?: boolean;
  controlledResponseText?: string;
  onControlledResponseTextChange?: (text: string) => void;
  embeddedInScrollGroup?: boolean;
  embeddedInSteppedGroup?: boolean;
  embeddedStepEyebrow?: string;
  /** When set in an embedded level group, parent controls reveal for all blocks. */
  groupTeacherReveal?: boolean;
  /** Hide the dev panel tab in the sidebar. */
  hideDevPanel?: boolean;
}

const freeResponseDevFields: DevPanelField[] = [
  resourcePanelCompactDevField,
  { key: "level.stem.question", label: "Question", type: "text", group: "Stem" },
  { key: "level.stem.description", label: "Description (markdown)", type: "textarea", group: "Stem", rows: 5 },
  { key: "level.question.placeholder", label: "Placeholder text", type: "text", group: "Input" },
  { key: "level.question.minCharacters", label: "Min characters", type: "number", min: 0, max: 500, group: "Input" },
  { key: "level.revealAnswerEnabled", label: "Reveal answer", type: "boolean", group: "Behavior" },
  { key: "level.allowFileUpload", label: "Allow file upload", type: "boolean", group: "Behavior" },
  { key: "level.metadata.lessonName", label: "Lesson name", type: "text", group: "Metadata" },
];

export function FreeResponseWorkspace({
  payload = mockFreeResponseLevel,
  codePanel,
  levelLinks,
  currentLevelPath,
  completedLevelPaths,
  embedded = false,
  groupSubmitted = false,
  controlledResponseText,
  onControlledResponseTextChange,
  embeddedInScrollGroup = false,
  embeddedInSteppedGroup = false,
  embeddedStepEyebrow,
  groupTeacherReveal,
  hideDevPanel = false,
}: FreeResponseWorkspaceProps = {}) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const overrideResult = usePropsOverride(
    {
      ...(payload as unknown as Record<string, unknown>),
      resourcePanelCompact: false,
    },
  );
  const resolvedPayload = (
    embedded ? payload : overrideResult.props
  ) as unknown as FreeResponseLevelPayload;
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

  const { level } = resolvedPayload;
  const resourcePanelCompact = Boolean(
    (overrideResult.props as { resourcePanelCompact?: unknown }).resourcePanelCompact,
  );
  const revealAnswerEnabled = level.revealAnswerEnabled === true;
  const allowFileUpload = level.allowFileUpload === true;
  const teacherAnswer = level.teacherAnswer;

  const isEmbeddedControlled = Boolean(
    embedded &&
      controlledResponseText !== undefined &&
      onControlledResponseTextChange,
  );
  const [internalResponseText, setInternalResponseText] = useState("");
  const responseText = isEmbeddedControlled
    ? controlledResponseText!
    : internalResponseText;
  const setResponseText = (updater: SetStateAction<string>) => {
    if (isEmbeddedControlled) {
      const next =
        typeof updater === "function"
          ? updater(controlledResponseText!)
          : updater;
      onControlledResponseTextChange!(next);
    } else {
      setInternalResponseText(updater);
    }
  };
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isTeacherAnswerRevealed, setIsTeacherAnswerRevealed] =
    useState(false);

  const teacherRevealActive =
    embedded && groupTeacherReveal !== undefined
      ? groupTeacherReveal
      : isTeacherAnswerRevealed;

  useEffect(() => {
    if (!isEmbeddedControlled) {
      setResponseText("");
    }
    setIsSubmitted(false);
    setAttachedFile(null);
    setIsTeacherAnswerRevealed(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [level.id, isEmbeddedControlled]);

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

  const isAnswerLocked = embedded ? Boolean(groupSubmitted) : isSubmitted;

  const inputDisabled =
    isAnswerLocked || (revealAnswerEnabled && teacherRevealActive);

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

  const embeddedFlatInParent =
    embedded && (embeddedInScrollGroup || embeddedInSteppedGroup);

  const stemEyebrow =
    embeddedFlatInParent && embeddedStepEyebrow
      ? embeddedStepEyebrow
      : embedded && !embeddedFlatInParent
        ? ""
        : "Free response";

  const useStepCounterEyebrowStyle =
    embeddedInScrollGroup && !embeddedInSteppedGroup;

  const cardContents = (
    <>
          <AssessmentStemSection
            eyebrow={stemEyebrow}
            eyebrowClassName={
              useStepCounterEyebrowStyle ? styles.stepCounterEyebrow : undefined
            }
            question={level.stem.question}
            description={level.stem.description}
          >
            <div className={styles.inputWrap}>
              <AppTextArea
                value={responseText}
                disabled={inputDisabled}
                placeholder={level.question.placeholder}
                onChange={(event) => setResponseText(event.target.value)}
                rows={6}
                size="l"
                tone="gray"
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

          {revealAnswerEnabled && teacherRevealActive && teacherAnswer ? (
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

          {!embeddedFlatInParent ? (
            <AssessmentBottomRow
              showLeft={!embedded && revealAnswerEnabled}
              left={
                !embedded && revealAnswerEnabled ? (
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
                embedded ? (
                  isAnswerLocked ? (
                    <span className={styles.submittedTag} role="status">
                      <FaIcon
                        name="check"
                        size="xs"
                        className={styles.submittedTagIcon}
                      />
                      Submitted
                    </span>
                  ) : null
                ) : (
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
                          (revealAnswerEnabled && teacherRevealActive)
                        }
                      >
                        Submit response
                      </AppButton>
                    )}
                  </>
                )
              }
            />
          ) : null}
    </>
  );

  const mainBody = (
    <main
      className={[
        embedded ? styles.workspaceEmbedded : styles.workspace,
        embeddedFlatInParent ? styles.workspaceEmbeddedScrollGroup : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {embeddedFlatInParent ? (
        cardContents
      ) : (
        <div className={styles.card}>{cardContents}</div>
      )}
    </main>
  );

  if (embedded) {
    return mainBody;
  }

  const shellContent = codePanel ? (
    <AssessmentCodeRefLayout codePanel={codePanel}>
      {cardContents}
    </AssessmentCodeRefLayout>
  ) : (
    mainBody
  );

  return (
    <Lab2Shell
      topNavigationProps={{
        title: `${level.metadata.lessonName} - ${level.name}`,
        subtitle: codePanel
          ? "Code reference — split layout"
          : "Draft assessment level on Lab2 shell",
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
        collapsible: true,
        compact: resourcePanelCompact,
        showInstructionsDrawer: false,
        ...(!hideDevPanel && {
          devPanelFields: freeResponseDevFields,
          devPanelOverrideResult: overrideResult,
        }),
      }}
      onResize={(delta) => {
        setSidebarWidth((prev) =>
          Math.max(300, Math.min(600, prev + delta))
        );
      }}
    >
      {shellContent}
    </Lab2Shell>
  );
}
