import { useMemo, useState } from "react";
import { AppButton } from "../../../ui/AppButton";
import { Lab2Shell } from "../../../lab2/Lab2Shell";
import { mockMatchLevel } from "../../../../data/assessment";
import { initialChatMessages } from "../../../../data/weblab2";
import { useChatState } from "../../../../hooks/useChatState";
import { useLayoutState } from "../../../../hooks/useLayoutState";
import { useVersionHistoryState } from "../../../../hooks/useVersionHistoryState";
import styles from "./MatchWorkspace.module.scss";

type MatchAssignments = Record<string, string | null>;

function buildInitialAssignments(promptIds: string[]) {
  return promptIds.reduce<MatchAssignments>((acc, promptId) => {
    acc[promptId] = null;
    return acc;
  }, {});
}

export function MatchWorkspace() {
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

  const { level } = mockMatchLevel;
  const promptIds = useMemo(
    () => level.question.prompts.map((prompt) => prompt.id),
    [level.question.prompts],
  );
  const [assignments, setAssignments] = useState<MatchAssignments>(
    buildInitialAssignments(promptIds),
  );
  const [activeTermId, setActiveTermId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const assignTermToPrompt = (promptId: string, termId: string) => {
    setAssignments((previous) => {
      const next = { ...previous };
      for (const currentPromptId of Object.keys(next)) {
        if (next[currentPromptId] === termId) {
          next[currentPromptId] = null;
        }
      }
      next[promptId] = termId;
      return next;
    });
  };

  const allAssigned = useMemo(
    () => level.question.prompts.every((prompt) => Boolean(assignments[prompt.id])),
    [assignments, level.question.prompts],
  );

  const availableTerms = useMemo(
    () =>
      level.question.terms.filter((term) =>
        !Object.values(assignments).includes(term.id),
      ),
    [assignments, level.question.terms],
  );

  const totalCorrect = useMemo(
    () =>
      level.question.prompts.filter(
        (prompt) => assignments[prompt.id] === prompt.correctTermId,
      ).length,
    [assignments, level.question.prompts],
  );
  const isPerfectMatch = totalCorrect === level.question.prompts.length;

  return (
    <Lab2Shell
      topNavigationProps={{
        title: `${level.metadata.lessonName} - ${level.name}`,
        subtitle: "Draft assessment level on Lab2 shell",
        currentLevel: level.metadata.levelPosition,
        totalLevels: level.metadata.totalLevelsInScript,
        completedLevels: [1, 2, 3, 4],
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
          <p className={styles.eyebrow}>Match</p>
          <h1 className={styles.prompt}>{level.question.prompt}</h1>
          <p className={styles.instruction}>
            Drag terms onto definitions, or click a term then click a definition
            to assign it.
          </p>

          <div className={styles.termsWrap}>
            {availableTerms.map((term) => (
              <button
                key={term.id}
                type="button"
                className={[
                  styles.termButton,
                  activeTermId === term.id ? styles.termButtonActive : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                draggable={!isSubmitted}
                disabled={isSubmitted}
                onClick={() =>
                  setActiveTermId((current) =>
                    current === term.id ? null : term.id,
                  )
                }
                onDragStart={(event) => {
                  event.dataTransfer.setData("text/plain", term.id);
                  setActiveTermId(term.id);
                }}
              >
                {term.text}
              </button>
            ))}
          </div>

          <div className={styles.matches}>
            {level.question.prompts.map((prompt) => {
              const assignedTermId = assignments[prompt.id];
              const assignedTerm = level.question.terms.find(
                (term) => term.id === assignedTermId,
              );
              const isCorrect = assignedTermId === prompt.correctTermId;

              return (
                <div key={prompt.id} className={styles.matchRow}>
                  <p className={styles.definition}>{prompt.text}</p>
                  <button
                    type="button"
                    disabled={isSubmitted}
                    className={[
                      styles.dropZone,
                      assignedTerm ? styles.dropZoneFilled : "",
                      activeTermId ? styles.dropZoneSelected : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => {
                      if (!activeTermId || isSubmitted) return;
                      assignTermToPrompt(prompt.id, activeTermId);
                      setActiveTermId(null);
                    }}
                    onDragOver={(event) => {
                      if (!isSubmitted) {
                        event.preventDefault();
                      }
                    }}
                    onDrop={(event) => {
                      if (isSubmitted) return;
                      event.preventDefault();
                      const termId = event.dataTransfer.getData("text/plain");
                      if (termId) {
                        assignTermToPrompt(prompt.id, termId);
                        setActiveTermId(null);
                      }
                    }}
                  >
                    {assignedTerm ? assignedTerm.text : "Drop term here"}
                  </button>
                  <span
                    className={[
                      styles.rowStatus,
                      isSubmitted
                        ? isCorrect
                          ? styles.rowStatusCorrect
                          : styles.rowStatusIncorrect
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {isSubmitted ? (isCorrect ? "Correct" : "Incorrect") : ""}
                  </span>
                </div>
              );
            })}
          </div>

          <div className={styles.actionRow}>
            <AppButton
              onClick={() => setIsSubmitted(true)}
              disabled={!allAssigned || isSubmitted}
            >
              Submit matches
            </AppButton>
            <AppButton
              variant="secondary"
              onClick={() => {
                setAssignments(buildInitialAssignments(promptIds));
                setActiveTermId(null);
                setIsSubmitted(false);
              }}
            >
              Reset
            </AppButton>
          </div>

          {isSubmitted && (
            <div className={styles.feedbackRow}>
              <p
                className={[
                  styles.feedbackText,
                  isPerfectMatch ? styles.feedbackCorrect : styles.feedbackIncorrect,
                ].join(" ")}
              >
                {isPerfectMatch
                  ? "All matches are correct."
                  : `${totalCorrect} of ${level.question.prompts.length} matches are correct.`}
              </p>
              <AppButton
                variant="secondary"
                onClick={() => {
                  setIsSubmitted(false);
                }}
              >
                Edit matches
              </AppButton>
            </div>
          )}
        </div>
      </main>
    </Lab2Shell>
  );
}
