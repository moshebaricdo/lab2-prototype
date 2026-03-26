import { useMemo, useState } from "react";
import { AppButton } from "../../../ui/AppButton";
import { Lab2Shell } from "../../../lab2/Lab2Shell";
import { mockMultiChoiceLevel } from "../../../../data/assessment";
import { initialChatMessages } from "../../../../data/weblab2";
import { useChatState } from "../../../../hooks/useChatState";
import { useLayoutState } from "../../../../hooks/useLayoutState";
import { useVersionHistoryState } from "../../../../hooks/useVersionHistoryState";
import styles from "./MultiChoiceWorkspace.module.scss";

export function MultiChoiceWorkspace() {
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

  const { level } = mockMultiChoiceLevel;
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const isCorrect = useMemo(
    () => selectedAnswerId === level.question.correctAnswerId,
    [level.question.correctAnswerId, selectedAnswerId],
  );

  return (
    <Lab2Shell
      topNavigationProps={{
        title: `${level.metadata.lessonName} - ${level.name}`,
        subtitle: "Draft assessment level on Lab2 shell",
        currentLevel: level.metadata.levelPosition,
        totalLevels: level.metadata.totalLevelsInScript,
        completedLevels: [1, 2],
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
      }}
      onResize={(delta) => {
        setSidebarWidth((prev) =>
          Math.max(300, Math.min(600, prev + delta))
        );
      }}
    >
      <main className={styles.workspace}>
        <div className={styles.card}>
          <p className={styles.eyebrow}>Multiple Choice</p>
          <h1 className={styles.prompt}>{level.question.prompt}</h1>

          <fieldset className={styles.answers}>
            <legend className={styles.answersLegend}>Answer options</legend>
            {level.question.answers.map((answer) => {
              const checked = selectedAnswerId === answer.id;
              return (
                <label
                  key={answer.id}
                  className={[
                    styles.answerOption,
                    checked ? styles.answerOptionChecked : "",
                    isSubmitted ? styles.answerOptionLocked : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <input
                    type="radio"
                    name="multi-choice-answer"
                    className={styles.radio}
                    value={answer.id}
                    checked={checked}
                    disabled={isSubmitted}
                    onChange={() => setSelectedAnswerId(answer.id)}
                  />
                  <span className={styles.answerText}>{answer.text}</span>
                </label>
              );
            })}
          </fieldset>

          {!isSubmitted && (
            <div className={styles.actionRow}>
              <AppButton
                onClick={() => setIsSubmitted(true)}
                disabled={!selectedAnswerId}
              >
                Submit answer
              </AppButton>
            </div>
          )}

          {isSubmitted && (
            <div className={styles.feedbackRow}>
              <p
                className={[
                  styles.feedbackText,
                  isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect,
                ].join(" ")}
              >
                {isCorrect ? "Correct answer." : "Incorrect answer."}
              </p>
              <AppButton
                variant="secondary"
                onClick={() => {
                  setSelectedAnswerId(null);
                  setIsSubmitted(false);
                }}
              >
                Try again
              </AppButton>
            </div>
          )}
        </div>
      </main>
    </Lab2Shell>
  );
}
