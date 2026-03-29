import { useEffect, useMemo, useState, type CSSProperties } from "react";
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
import {
  AssessmentBottomRow,
  AssessmentStemSection,
  AssessmentSuccessFeedback,
} from "../../shared";
import styles from "./MultiChoiceWorkspace.module.scss";

interface MultiChoiceWorkspaceProps {
  payload?: MultiChoiceLevelPayload;
  levelLinks?: LevelProgressLink[];
  currentLevelPath?: string;
  completedLevelPaths?: string[];
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
    return (
      <pre key={key} className={styles.answerCodeBlock}>
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

export function MultiChoiceWorkspace({
  payload = mockMultiChoiceLevel,
  levelLinks,
  currentLevelPath,
  completedLevelPaths,
}: MultiChoiceWorkspaceProps) {
  const navigate = useNavigate();
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
  const isMultiSelect = level.selectionMode === "multiple";
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hoveredAnswerId, setHoveredAnswerId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isTeacherAnswerRevealed, setIsTeacherAnswerRevealed] = useState(false);
  const [persistedWrongAnswerIds, setPersistedWrongAnswerIds] = useState<
    string[]
  >([]);

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
    if (isMultiSelect) {
      return level.correctAnswerIds ?? [];
    }
    return level.correctAnswerId ? [level.correctAnswerId] : [];
  }, [
    isMultiSelect,
    level.correctAnswerId,
    level.correctAnswerIds,
  ]);

  const displayedIds = isTeacherAnswerRevealed ? correctIds : selectedIds;

  const isCorrect = useMemo(() => {
    if (isTeacherAnswerRevealed) return false;
    if (isMultiSelect) {
      return arraysEqualAsSets(selectedIds, correctIds);
    }
    return selectedIds[0] === level.correctAnswerId;
  }, [
    isTeacherAnswerRevealed,
    isMultiSelect,
    selectedIds,
    correctIds,
    level.correctAnswerId,
  ]);

  const canSubmit = useMemo(() => {
    if (isTeacherAnswerRevealed) return false;
    if (isMultiSelect) {
      const required = level.requiredSelectionCount;
      if (required !== undefined) {
        return selectedIds.length === required;
      }
      return selectedIds.length > 0;
    }
    return Boolean(selectedIds[0]);
  }, [
    isTeacherAnswerRevealed,
    isMultiSelect,
    level.requiredSelectionCount,
    selectedIds,
  ]);

  const toggleMulti = (id: string) => {
    if (isSubmitted || isTeacherAnswerRevealed) return;
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
    !isSubmitted &&
    !isTeacherAnswerRevealed;

  const showInlineFeedback = isSubmitted && !isTeacherAnswerRevealed;
  const showWrongSelectionHighlights =
    showInlineFeedback && !isCorrect;

  const handleSubmitAnswer = () => {
    if (!canSubmit || isTeacherAnswerRevealed) {
      return;
    }
    const correct = isMultiSelect
      ? arraysEqualAsSets(selectedIds, correctIds)
      : selectedIds[0] === level.correctAnswerId;
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

  return (
    <Lab2Shell
      topNavigationProps={{
        title: `${level.metadata.lessonName} - ${level.name}`,
        subtitle: "Draft assessment level on Lab2 shell",
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
            eyebrow={
              isMultiSelect ? "Multiple response" : "Multiple choice"
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
                  isTeacherAnswerRevealed && correctIds.includes(answer.id);
                const selectionCapped =
                  isMultiSelect && atSelectionCap && !checked;
                const isIncorrectSelection =
                  showWrongSelectionHighlights &&
                  selectedIds.includes(answer.id) &&
                  !correctIds.includes(answer.id);
                const isSubmittedCorrectHighlight =
                  showInlineFeedback &&
                  isCorrect &&
                  correctIds.includes(answer.id) &&
                  selectedIds.includes(answer.id);
                const showPersistentWrongMark =
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
                      isSubmitted ? styles.answerOptionLocked : "",
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
                          isSubmitted ||
                          isTeacherAnswerRevealed ||
                          selectionCapped
                        }
                        tabIndex={0}
                        hovered={
                          !isSubmitted &&
                          !isTeacherAnswerRevealed &&
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
                        disabled={isSubmitted || isTeacherAnswerRevealed}
                        tabIndex={0}
                        hovered={
                          !isSubmitted &&
                          !isTeacherAnswerRevealed &&
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

          <AssessmentBottomRow
            left={
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
            }
            right={
              <>
                {showInlineFeedback && isCorrect && (
                  <AssessmentSuccessFeedback />
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
                    disabled={!canSubmit || isTeacherAnswerRevealed}
                  >
                    Submit answer
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
