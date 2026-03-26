import { useMemo, useState } from "react";
import { AppButton } from "../../../ui/AppButton";
import { Lab2Shell } from "../../../lab2/Lab2Shell";
import { mockLevelGroup } from "../../../../data/assessment";
import { initialChatMessages } from "../../../../data/weblab2";
import { useChatState } from "../../../../hooks/useChatState";
import { useLayoutState } from "../../../../hooks/useLayoutState";
import { useVersionHistoryState } from "../../../../hooks/useVersionHistoryState";
import styles from "./LevelGroupWorkspace.module.scss";

type MatchAssignments = Record<string, string | null>;

function buildInitialAssignments(promptIds: string[]) {
  return promptIds.reduce<MatchAssignments>((acc, promptId) => {
    acc[promptId] = null;
    return acc;
  }, {});
}

export function LevelGroupWorkspace() {
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

  const { level } = mockLevelGroup;
  const matchPromptIds = useMemo(
    () => level.questions.match.prompts.map((prompt) => prompt.id),
    [level.questions.match.prompts],
  );

  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [freeResponseText, setFreeResponseText] = useState("");
  const [matchAssignments, setMatchAssignments] = useState<MatchAssignments>(
    buildInitialAssignments(matchPromptIds),
  );
  const [activeTermId, setActiveTermId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const assignTermToPrompt = (promptId: string, termId: string) => {
    setMatchAssignments((previous) => {
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

  const isMultiCorrect = selectedAnswerId === level.questions.multi.correctAnswerId;
  const isFreeResponseComplete =
    freeResponseText.trim().length >= level.questions.freeResponse.minCharacters;
  const isMatchComplete = level.questions.match.prompts.every((prompt) =>
    Boolean(matchAssignments[prompt.id]),
  );
  const canSubmit =
    Boolean(selectedAnswerId) && isFreeResponseComplete && isMatchComplete;

  const totalMatchCorrect = useMemo(
    () =>
      level.questions.match.prompts.filter(
        (prompt) => matchAssignments[prompt.id] === prompt.correctTermId,
      ).length,
    [level.questions.match.prompts, matchAssignments],
  );

  const totalCorrectSections = [
    isMultiCorrect,
    isFreeResponseComplete,
    totalMatchCorrect === level.questions.match.prompts.length,
  ].filter(Boolean).length;

  const availableMatchTerms = useMemo(
    () =>
      level.questions.match.terms.filter(
        (term) => !Object.values(matchAssignments).includes(term.id),
      ),
    [level.questions.match.terms, matchAssignments],
  );

  return (
    <Lab2Shell
      topNavigationProps={{
        title: `${level.metadata.lessonName} - ${level.name}`,
        subtitle: "Draft assessment levelgroup on Lab2 shell",
        currentLevel: level.metadata.levelPosition,
        totalLevels: level.metadata.totalLevelsInScript,
        completedLevels: [1, 2, 3, 4, 5],
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
        <div className={styles.stack}>
          <section className={styles.section}>
            <p className={styles.eyebrow}>Levelgroup: Multiple Choice</p>
            <h1 className={styles.sectionTitle}>{level.questions.multi.prompt}</h1>
            <fieldset className={styles.optionList}>
              <legend className={styles.srLegend}>Multi-choice answers</legend>
              {level.questions.multi.answers.map((answer) => {
                const checked = selectedAnswerId === answer.id;
                return (
                  <label
                    key={answer.id}
                    className={[
                      styles.optionLabel,
                      checked ? styles.optionLabelSelected : "",
                      isSubmitted ? styles.optionLabelLocked : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <input
                      type="radio"
                      name="levelgroup-multi"
                      className={styles.radio}
                      value={answer.id}
                      checked={checked}
                      disabled={isSubmitted}
                      onChange={() => setSelectedAnswerId(answer.id)}
                    />
                    <span>{answer.text}</span>
                  </label>
                );
              })}
            </fieldset>
          </section>

          <section className={styles.section}>
            <p className={styles.eyebrow}>Levelgroup: Free Response</p>
            <h2 className={styles.sectionTitle}>{level.questions.freeResponse.prompt}</h2>
            <textarea
              className={styles.textarea}
              value={freeResponseText}
              disabled={isSubmitted}
              placeholder={level.questions.freeResponse.placeholder}
              onChange={(event) => setFreeResponseText(event.target.value)}
            />
            <p className={styles.hint}>
              Minimum {level.questions.freeResponse.minCharacters} characters
            </p>
          </section>

          <section className={styles.section}>
            <p className={styles.eyebrow}>Levelgroup: Match</p>
            <h2 className={styles.sectionTitle}>{level.questions.match.prompt}</h2>
            <div className={styles.termBank}>
              {availableMatchTerms.map((term) => (
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

            <div className={styles.matchRows}>
              {level.questions.match.prompts.map((prompt) => {
                const assignedTermId = matchAssignments[prompt.id];
                const assignedTerm = level.questions.match.terms.find(
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
                        styles.status,
                        isSubmitted
                          ? isCorrect
                            ? styles.statusCorrect
                            : styles.statusIncorrect
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
          </section>

          <section className={styles.footer}>
            <p className={styles.footerText}>
              {isSubmitted
                ? `${totalCorrectSections} of 3 sections met expectations.`
                : "Complete all three sections, then submit once."}
            </p>
            <div className={styles.footerActions}>
              <AppButton
                onClick={() => setIsSubmitted(true)}
                disabled={!canSubmit || isSubmitted}
              >
                Submit levelgroup
              </AppButton>
              <AppButton
                variant="secondary"
                onClick={() => {
                  setSelectedAnswerId(null);
                  setFreeResponseText("");
                  setMatchAssignments(buildInitialAssignments(matchPromptIds));
                  setActiveTermId(null);
                  setIsSubmitted(false);
                }}
              >
                Reset all
              </AppButton>
            </div>
          </section>
        </div>
      </main>
    </Lab2Shell>
  );
}
