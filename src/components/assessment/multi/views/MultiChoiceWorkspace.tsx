import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type SetStateAction,
} from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
import { AppButton } from "../../../ui/AppButton";
import { AppCheckbox } from "../../../ui/AppCheckbox";
import { AppRadio } from "../../../ui/AppRadio";
import { Lab2Shell } from "../../../lab2/Lab2Shell";
import type { LevelProgressLink } from "../../../ui/header/LevelProgressBubbles";
import {
  mockMultiChoiceLevel,
  type MultiChoiceLevelPayload,
} from "../../../../data/assessment";
import type {
  MultiChoiceAnswer,
  MultiChoiceAnswerContentBlock,
} from "../../../../data/assessment/multi";
import { initialChatMessages } from "../../../../data/weblab2";
import { useChatState } from "../../../../hooks/useChatState";
import { useLayoutState } from "../../../../hooks/useLayoutState";
import { useVersionHistoryState } from "../../../../hooks/useVersionHistoryState";
import errorSoundUrl from "@/assets/audio/error-sound.mp3";
import successSoundUrl from "@/assets/audio/success-sound.mp3";
import type { CodePanelConfig } from "../../../../data/assessment/codePanel";
import type { DevPanelField } from "../../../lab2/dev";
import { resourcePanelCompactDevField } from "../../../lab2/dev";
import { usePropsOverride } from "../../../../hooks/usePropsOverride";
import {
  AssessmentBottomRow,
  AssessmentCodeRefLayout,
  AssessmentLevelShell,
  AssessmentStemSection,
  AssessmentSuccessFeedback,
  assessmentLevelShellVariant,
} from "../../shared";
import stemStyles from "../../shared/AssessmentStemSection.module.scss";
import styles from "./MultiChoiceWorkspace.module.scss";

interface MultiChoiceWorkspaceProps {
  payload?: MultiChoiceLevelPayload;
  codePanel?: CodePanelConfig;
  codePanelEditable?: boolean;
  onCodeContentChange?: (fileIndex: number, content: string) => void;
  levelLinks?: LevelProgressLink[];
  currentLevelPath?: string;
  completedLevelPaths?: string[];
  /** Renders only the assessment card (no Lab2 shell). Used inside level groups. */
  embedded?: boolean;
  /** Parent submitted the whole group — show graded feedback for this block. */
  groupSubmitted?: boolean;
  controlledSelectedIds?: string[];
  onControlledSelectedIdsChange?: (ids: string[]) => void;
  /** Level group scroll: no inner card; counter in stem eyebrow. */
  embeddedInScrollGroup?: boolean;
  /** Level group stepped: same flat surface as scroll; type label in stem eyebrow. */
  embeddedInSteppedGroup?: boolean;
  embeddedStepEyebrow?: string;
  /** When set in an embedded level group, parent controls reveal for all blocks. */
  groupTeacherReveal?: boolean;
}

function arraysEqualAsSets(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}

/** 0 → A, 25 → Z, 26 → AA (Excel-style) for option labels */
function optionReferenceLetter(index: number): string {
  let n = index;
  let result = "";
  while (n >= 0) {
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
}

function renderAnswerContentBlock(
  block: MultiChoiceAnswerContentBlock,
  key: string,
) {
  if (block.type === "text") {
    return (
      <p key={key} className={styles.answerTextBlock}>
        {block.text}
      </p>
    );
  }

  if (block.type === "code") {
    const isSingleLineCode = !block.code.includes("\n");
    return (
      <pre
        key={key}
        className={`${styles.answerCodeBlock} ${isSingleLineCode ? styles.answerCodeBlockSingleLine : ""}`}
      >
        <code>{block.code}</code>
      </pre>
    );
  }

  return (
    <figure key={key} className={styles.answerImageBlock}>
      <img src={block.src} alt={block.alt} loading="lazy" />
      {block.caption ? (
        <figcaption className={styles.answerImageCaption}>
          {block.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function renderAnswerContent(answer: MultiChoiceAnswer) {
  if (answer.contentBlocks?.length) {
    return answer.contentBlocks.map((block, index) =>
      renderAnswerContentBlock(block, `${answer.id}-${index}`),
    );
  }

  return <span className={styles.answerText}>{answer.text ?? ""}</span>;
}

function playFeedbackSound(src: string) {
  const audio = new Audio(src);
  void audio.play().catch(() => {
    /* autoplay / missing file — ignore */
  });
}

const multiChoiceDevFields: DevPanelField[] = [
  resourcePanelCompactDevField,
  { key: "level.stem.question", label: "Question", type: "text", group: "Stem" },
  { key: "level.stem.description", label: "Description (markdown)", type: "textarea", group: "Stem", rows: 5 },
  {
    key: "level.selectionMode",
    label: "Selection mode",
    type: "select",
    group: "Behavior",
    options: [
      { label: "Single select", value: "single" },
      { label: "Multiple select", value: "multiple" },
    ],
  },
  { key: "level.surveyMode", label: "Survey mode (no grading)", type: "boolean", group: "Behavior" },
  {
    key: "level.optionLayout.type",
    label: "Option layout",
    type: "select",
    group: "Layout",
    options: [
      { label: "List", value: "list" },
      { label: "Grid", value: "grid" },
    ],
  },
  {
    key: "level.optionLayout.columns",
    label: "Grid columns",
    type: "select",
    group: "Layout",
    options: [
      { label: "2", value: "2" },
      { label: "3", value: "3" },
      { label: "4", value: "4" },
    ],
    valueType: "number",
  },
  {
    key: "level.metadata.lessonName",
    label: "Lesson name",
    type: "text",
    group: "Metadata",
  },
];

export function MultiChoiceWorkspace({
  payload = mockMultiChoiceLevel,
  codePanel,
  codePanelEditable,
  onCodeContentChange,
  levelLinks,
  currentLevelPath,
  completedLevelPaths,
  embedded = false,
  groupSubmitted = false,
  controlledSelectedIds,
  onControlledSelectedIdsChange,
  embeddedInScrollGroup = false,
  embeddedInSteppedGroup = false,
  embeddedStepEyebrow,
  groupTeacherReveal,
}: MultiChoiceWorkspaceProps) {
  const navigate = useNavigate();

  const overrideResult = usePropsOverride(
    {
      ...(payload as unknown as Record<string, unknown>),
      resourcePanelCompact: false,
    },
  );
  const resolvedPayload = (
    embedded ? payload : overrideResult.props
  ) as unknown as MultiChoiceLevelPayload;
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
  const isSurveyLevel = level.surveyMode === true;
  const isMultiSelect = level.selectionMode === "multiple";
  const isEmbeddedControlled = Boolean(
    embedded &&
      controlledSelectedIds !== undefined &&
      onControlledSelectedIdsChange,
  );
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([]);
  const selectedIds = isEmbeddedControlled
    ? controlledSelectedIds!
    : internalSelectedIds;
  const setSelectedIds = (updater: SetStateAction<string[]>) => {
    if (isEmbeddedControlled) {
      const next =
        typeof updater === "function"
          ? updater(controlledSelectedIds!)
          : updater;
      onControlledSelectedIdsChange!(next);
    } else {
      setInternalSelectedIds(updater);
    }
  };
  const [hoveredAnswerId, setHoveredAnswerId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isTeacherAnswerRevealed, setIsTeacherAnswerRevealed] = useState(false);
  const [persistedWrongAnswerIds, setPersistedWrongAnswerIds] = useState<
    string[]
  >([]);

  const teacherRevealActive =
    embedded && groupTeacherReveal !== undefined
      ? groupTeacherReveal
      : isTeacherAnswerRevealed;

  useEffect(() => {
    setPersistedWrongAnswerIds([]);
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

  const correctIds = useMemo(() => {
    if (isSurveyLevel) {
      return [];
    }
    if (isMultiSelect) {
      return level.correctAnswerIds ?? [];
    }
    return level.correctAnswerId ? [level.correctAnswerId] : [];
  }, [
    isSurveyLevel,
    isMultiSelect,
    level.correctAnswerId,
    level.correctAnswerIds,
  ]);

  const displayedIds = isSurveyLevel
    ? selectedIds
    : teacherRevealActive
      ? correctIds
      : selectedIds;

  const isCorrect = useMemo(() => {
    if (isSurveyLevel) {
      return true;
    }
    if (teacherRevealActive) return false;
    if (isMultiSelect) {
      return arraysEqualAsSets(selectedIds, correctIds);
    }
    return selectedIds[0] === level.correctAnswerId;
  }, [
    isSurveyLevel,
    teacherRevealActive,
    isMultiSelect,
    selectedIds,
    correctIds,
    level.correctAnswerId,
  ]);

  const canSubmit = useMemo(() => {
    if (isSurveyLevel) {
      return !teacherRevealActive;
    }
    if (teacherRevealActive) return false;
    if (isMultiSelect) {
      const required = level.requiredSelectionCount;
      if (required !== undefined) {
        return selectedIds.length === required;
      }
      return selectedIds.length > 0;
    }
    return Boolean(selectedIds[0]);
  }, [
    isSurveyLevel,
    teacherRevealActive,
    isMultiSelect,
    level.requiredSelectionCount,
    selectedIds,
  ]);

  const isAnswerLocked = embedded ? Boolean(groupSubmitted) : isSubmitted;

  const toggleMulti = (id: string) => {
    if (isAnswerLocked || teacherRevealActive) return;
    const max = level.maxSelectionCount;
    setSelectedIds((previous) => {
      if (previous.includes(id)) {
        return previous.filter((value) => value !== id);
      }
      if (max !== undefined && previous.length >= max) {
        return previous;
      }
      return [...previous, id];
    });
  };

  const setSingle = (id: string) => {
    setSelectedIds([id]);
  };

  const atSelectionCap =
    isMultiSelect &&
    level.maxSelectionCount !== undefined &&
    selectedIds.length >= level.maxSelectionCount &&
    !isAnswerLocked &&
    !teacherRevealActive;

  const showInlineFeedback = isAnswerLocked && !teacherRevealActive;
  const showWrongSelectionHighlights =
    showInlineFeedback && !isCorrect;

  const handleSubmitAnswer = () => {
    if (embedded || !canSubmit || teacherRevealActive) {
      return;
    }
    const correct =
      isSurveyLevel ||
      (isMultiSelect
        ? arraysEqualAsSets(selectedIds, correctIds)
        : selectedIds[0] === level.correctAnswerId);
    playFeedbackSound(correct ? successSoundUrl : errorSoundUrl);
    setIsSubmitted(true);
  };

  const resetAfterSubmit = () => {
    if (isCorrect) {
      setPersistedWrongAnswerIds([]);
    } else {
      const wrongThisAttempt = selectedIds.filter(
        (id) => !correctIds.includes(id),
      );
      if (wrongThisAttempt.length > 0) {
        setPersistedWrongAnswerIds((previous) =>
          [...new Set([...previous, ...wrongThisAttempt])],
        );
      }
    }
    setSelectedIds([]);
    setHoveredAnswerId(null);
    setIsSubmitted(false);
  };

  const embeddedFlatInParent =
    embedded && (embeddedInScrollGroup || embeddedInSteppedGroup);

  const stemEyebrow =
    embeddedFlatInParent && embeddedStepEyebrow
      ? embeddedStepEyebrow
      : embedded && !embeddedFlatInParent
        ? ""
        : isSurveyLevel
          ? "Survey"
          : isMultiSelect
            ? "Multiple response"
            : "Multiple choice";

  const useStepCounterEyebrowStyle =
    embeddedInScrollGroup && !embeddedInSteppedGroup;

  const cardContents = (
    <>
          <AssessmentStemSection
            eyebrow={stemEyebrow}
            eyebrowClassName={
              useStepCounterEyebrowStyle ? stemStyles.stepCounterEyebrow : undefined
            }
            question={level.stem.question}
            description={level.stem.description}
          >
            <fieldset
              className={
                level.optionLayout?.type === "grid"
                  ? styles.answersGrid
                  : styles.answers
              }
              style={
                level.optionLayout?.type === "grid"
                  ? ({
                      "--answer-cols": level.optionLayout.columns ?? 2,
                    } as CSSProperties)
                  : undefined
              }
            >
              <legend className={styles.answersLegend}>Answer options</legend>
              {level.answers.map((answer, answerIndex) => {
                const checked = displayedIds.includes(answer.id);
                const isRevealedCorrect =
                  !isSurveyLevel &&
                  teacherRevealActive &&
                  correctIds.includes(answer.id);
                const selectionCapped =
                  isMultiSelect && atSelectionCap && !checked;
                const isIncorrectSelection =
                  !isSurveyLevel &&
                  showWrongSelectionHighlights &&
                  selectedIds.includes(answer.id) &&
                  !correctIds.includes(answer.id);
                const isSubmittedCorrectHighlight =
                  !isSurveyLevel &&
                  showInlineFeedback &&
                  isCorrect &&
                  correctIds.includes(answer.id) &&
                  selectedIds.includes(answer.id);
                const showPersistentWrongMark =
                  !isSurveyLevel &&
                  persistedWrongAnswerIds.includes(answer.id) &&
                  !isIncorrectSelection;
                const showCheckedStyle =
                  checked &&
                  !isIncorrectSelection &&
                  !isSubmittedCorrectHighlight;
                const referenceLetter = optionReferenceLetter(answerIndex);
                return (
                  <label
                    key={answer.id}
                    className={[
                      styles.answerOption,
                      showCheckedStyle ? styles.answerOptionChecked : "",
                      isIncorrectSelection ? styles.answerOptionIncorrect : "",
                      isRevealedCorrect || isSubmittedCorrectHighlight
                        ? styles.answerOptionRevealedCorrect
                        : "",
                      isAnswerLocked ? styles.answerOptionLocked : "",
                      selectionCapped ? styles.answerOptionSelectionCapped : "",
                      isSubmittedCorrectHighlight
                        ? styles.answerOptionCorrectShimmer
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onMouseEnter={() => setHoveredAnswerId(answer.id)}
                    onMouseLeave={() =>
                      setHoveredAnswerId((current) =>
                        current === answer.id ? null : current,
                      )
                    }
                  >
                    {isMultiSelect ? (
                      <AppCheckbox
                        name={`multi-response-${level.id}`}
                        value={answer.id}
                        checked={checked}
                        disabled={
                          isAnswerLocked ||
                          teacherRevealActive ||
                          selectionCapped
                        }
                        tabIndex={0}
                        hovered={
                          !isAnswerLocked &&
                          !teacherRevealActive &&
                          !selectionCapped &&
                          hoveredAnswerId === answer.id
                        }
                        onChange={() => toggleMulti(answer.id)}
                      />
                    ) : (
                      <AppRadio
                        name={`multi-choice-${level.id}`}
                        value={answer.id}
                        checked={checked}
                        disabled={isAnswerLocked || teacherRevealActive}
                        tabIndex={0}
                        hovered={
                          !isAnswerLocked &&
                          !teacherRevealActive &&
                          hoveredAnswerId === answer.id
                        }
                        onChange={() => setSingle(answer.id)}
                      />
                    )}
                    <div className={styles.answerContent}>
                      <span className={styles.answerOptionLetter}>
                        {referenceLetter}.
                      </span>
                      <div className={styles.answerOptionBlocks}>
                        {renderAnswerContent(answer)}
                      </div>
                    </div>
                    {isIncorrectSelection && (
                      <span
                        className={styles.revealedIncorrect}
                        aria-hidden="true"
                      >
                        <FontAwesomeIcon icon={faXmark} />
                      </span>
                    )}
                    {showPersistentWrongMark && (
                      <span
                        className={styles.persistedWrongMark}
                        aria-hidden="true"
                      >
                        <FontAwesomeIcon icon={faXmark} />
                      </span>
                    )}
                    {(isRevealedCorrect || isSubmittedCorrectHighlight) && (
                      <span className={styles.revealedCheck} aria-hidden="true">
                        <FontAwesomeIcon icon={faCheck} />
                      </span>
                    )}
                  </label>
                );
              })}
            </fieldset>
          </AssessmentStemSection>

          {!embeddedFlatInParent ? (
            <AssessmentBottomRow
              left={
                embedded || isSurveyLevel ? undefined : (
                  <AppButton
                    variant="secondary"
                    tone="gray"
                    iconPosition="start"
                    iconName={isTeacherAnswerRevealed ? "eye-slash" : "eye"}
                    size="m"
                    onClick={() => {
                      setHoveredAnswerId(null);
                      setIsTeacherAnswerRevealed((current) => !current);
                    }}
                  >
                    {isTeacherAnswerRevealed ? "Hide answer" : "Reveal answer"}
                  </AppButton>
                )
              }
              right={
                embedded ? (
                  <>
                    {showInlineFeedback && isCorrect && (
                      <AssessmentSuccessFeedback>
                        {isSurveyLevel
                          ? "Thanks for your responses!"
                          : "Nice work!"}
                      </AssessmentSuccessFeedback>
                    )}
                  </>
                ) : (
                  <>
                    {showInlineFeedback && isCorrect && (
                      <AssessmentSuccessFeedback>
                        {isSurveyLevel ? "Thanks for your responses!" : "Nice work!"}
                      </AssessmentSuccessFeedback>
                    )}
                    {isSubmitted && isCorrect && (
                      <AppButton
                        variant="primary"
                        size="m"
                        tone="purple"
                        onClick={() => navigate(continuePath)}
                      >
                        Continue
                      </AppButton>
                    )}
                    {isSubmitted && !isCorrect && (
                      <AppButton
                        variant="primary"
                        tone="purple"
                        size="m"
                        onClick={resetAfterSubmit}
                      >
                        Try again
                      </AppButton>
                    )}
                    {!isSubmitted && (
                      <AppButton
                        variant="primary"
                        size="m"
                        tone="purple"
                        onClick={handleSubmitAnswer}
                        disabled={!canSubmit || teacherRevealActive}
                      >
                        Submit answer
                      </AppButton>
                    )}
                  </>
                )
              }
            />
          ) : null}
    </>
  );

  const shellVariant = assessmentLevelShellVariant(
    embedded,
    embeddedFlatInParent,
  );

  const mainBody = (
    <AssessmentLevelShell variant={shellVariant}>{cardContents}</AssessmentLevelShell>
  );

  if (embedded && codePanel) {
    return (
      <AssessmentCodeRefLayout codePanel={codePanel} embedded>
        {cardContents}
      </AssessmentCodeRefLayout>
    );
  }

  if (embedded) {
    return mainBody;
  }

  const shellContent = codePanel ? (
    <AssessmentCodeRefLayout
      codePanel={codePanel}
      editable={codePanelEditable}
      onContentChange={onCodeContentChange}
    >
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
        completedLevels: [1, 2],
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
        devPanelFields: multiChoiceDevFields,
        devPanelOverrideResult: overrideResult,
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
