import { useMemo, useState } from "react";
import { AppButton } from "../../../ui/AppButton";
import { Lab2Shell } from "../../../lab2/Lab2Shell";
import { mockFreeResponseLevel } from "../../../../data/assessment";
import { initialChatMessages } from "../../../../data/weblab2";
import { useChatState } from "../../../../hooks/useChatState";
import { useLayoutState } from "../../../../hooks/useLayoutState";
import { useVersionHistoryState } from "../../../../hooks/useVersionHistoryState";
import styles from "./FreeResponseWorkspace.module.scss";

export function FreeResponseWorkspace() {
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

  const { level } = mockFreeResponseLevel;
  const [responseText, setResponseText] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const meetsMinimumLength = useMemo(
    () => responseText.trim().length >= level.question.minCharacters,
    [level.question.minCharacters, responseText],
  );

  return (
    <Lab2Shell
      topNavigationProps={{
        title: `${level.metadata.lessonName} - ${level.name}`,
        subtitle: "Draft assessment level on Lab2 shell",
        currentLevel: level.metadata.levelPosition,
        totalLevels: level.metadata.totalLevelsInScript,
        completedLevels: [1, 2, 3],
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
          <p className={styles.eyebrow}>Free Response</p>
          <h1 className={styles.prompt}>{level.question.prompt}</h1>

          <div className={styles.inputWrap}>
            <textarea
              className={styles.textarea}
              value={responseText}
              disabled={isSubmitted}
              placeholder={level.question.placeholder}
              onChange={(event) => setResponseText(event.target.value)}
            />
            <div className={styles.hintRow}>
              <p className={styles.hintText}>
                Minimum {level.question.minCharacters} characters
              </p>
              <p className={styles.hintText}>
                <span className={styles.charCountStrong}>
                  {responseText.trim().length}
                </span>{" "}
                characters
              </p>
            </div>
          </div>

          {!isSubmitted && (
            <div className={styles.actionRow}>
              <AppButton
                onClick={() => setIsSubmitted(true)}
                disabled={!meetsMinimumLength}
              >
                Submit response
              </AppButton>
            </div>
          )}

          {isSubmitted && (
            <div className={styles.feedbackRow}>
              <p className={styles.feedbackText}>
                Response captured locally. You can edit and resubmit.
              </p>
              <AppButton
                variant="secondary"
                onClick={() => setIsSubmitted(false)}
              >
                Edit response
              </AppButton>
            </div>
          )}
        </div>
      </main>
    </Lab2Shell>
  );
}
