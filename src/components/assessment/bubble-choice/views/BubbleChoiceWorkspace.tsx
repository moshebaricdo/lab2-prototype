import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppButton } from "../../../ui/AppButton";
import { Lab2Shell } from "../../../lab2/Lab2Shell";
import { mockBubbleChoiceLevel } from "../../../../data/assessment";
import { initialChatMessages } from "../../../../data/weblab2";
import { useChatState } from "../../../../hooks/useChatState";
import { useLayoutState } from "../../../../hooks/useLayoutState";
import { useVersionHistoryState } from "../../../../hooks/useVersionHistoryState";
import styles from "./BubbleChoiceWorkspace.module.scss";

export function BubbleChoiceWorkspace() {
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

  const { level } = mockBubbleChoiceLevel;
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const selectedOption = useMemo(
    () => level.options.find((option) => option.id === selectedOptionId) ?? null,
    [level.options, selectedOptionId],
  );

  return (
    <Lab2Shell
      topNavigationProps={{
        title: `${level.metadata.lessonName} - ${level.name}`,
        subtitle: "Draft bubble choice level on Lab2 shell",
        currentLevel: level.metadata.levelPosition,
        totalLevels: level.metadata.totalLevelsInScript,
        completedLevels: [1, 2, 3, 4, 5, 6],
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
        setSidebarWidth((prev) => Math.max(300, Math.min(600, prev + delta)));
      }}
    >
      <main className={styles.workspace}>
        <div className={styles.card}>
          <p className={styles.eyebrow}>Bubble Choice</p>
          <h1 className={styles.title}>{level.name}</h1>
          <p className={styles.prompt}>{level.prompt}</p>

          <div className={styles.grid}>
            {level.options.map((option) => (
              <button
                key={option.id}
                type="button"
                className={[
                  styles.optionCard,
                  selectedOptionId === option.id ? styles.optionSelected : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setSelectedOptionId(option.id)}
              >
                <p className={styles.optionTitle}>{option.title}</p>
                <p className={styles.optionDescription}>{option.description}</p>
                <p className={styles.optionMeta}>
                  Estimated time: {option.estimatedMinutes} minutes
                </p>
              </button>
            ))}
          </div>

          <div className={styles.footer}>
            <p className={styles.selectionLabel}>
              Selected path:{" "}
              <span className={styles.selectionValue}>
                {selectedOption ? selectedOption.title : "None yet"}
              </span>
            </p>
            <div className={styles.actionRow}>
              <AppButton
                variant="secondary"
                onClick={() => setSelectedOptionId(null)}
                disabled={!selectedOptionId}
              >
                Clear choice
              </AppButton>
              <AppButton
                onClick={() => {
                  if (!selectedOption) return;
                  navigate(selectedOption.levelPath);
                }}
                disabled={!selectedOption}
              >
                Continue to selected level
              </AppButton>
            </div>
          </div>
        </div>
      </main>
    </Lab2Shell>
  );
}
