import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AppButton } from "../../../ui/AppButton";
import { FaIcon } from "../../../icons/FaIcon";
import { Lab2Shell } from "../../../lab2/Lab2Shell";
import {
  mockMatchDefinitionBankLevel,
  type MatchLevelPayload,
} from "../../../../data/assessment";
import { initialChatMessages } from "../../../../data/weblab2";
import { useChatState } from "../../../../hooks/useChatState";
import { useLayoutState } from "../../../../hooks/useLayoutState";
import { useVersionHistoryState } from "../../../../hooks/useVersionHistoryState";
import type { LevelProgressLink } from "../../../ui/header/LevelProgressBubbles";
import errorSoundUrl from "@/assets/audio/error-sound.mp3";
import successSoundUrl from "@/assets/audio/success-sound.mp3";
import {
  AssessmentBottomRow,
  AssessmentStemSection,
  AssessmentSuccessFeedback,
} from "../../shared";
import styles from "./MatchDefinitionBankWorkspace.module.scss";

type MatchAssignments = Record<string, string | null>;

function buildInitialAssignments(termIds: string[]) {
  return termIds.reduce<MatchAssignments>((acc, termId) => {
    acc[termId] = null;
    return acc;
  }, {});
}

function playFeedbackSound(src: string) {
  const audio = new Audio(src);
  void audio.play().catch(() => {});
}

interface MatchDefinitionBankWorkspaceProps {
  payload?: MatchLevelPayload;
  levelLinks?: LevelProgressLink[];
  currentLevelPath?: string;
  completedLevelPaths?: string[];
}

function promptDragId(promptId: string) {
  return `prompt-${promptId}`;
}

function slotDropId(termId: string) {
  return `slot-${termId}`;
}

const PROMPT_BANK_DROP_ID = "prompt-bank";

function parsePromptId(id: string | null) {
  if (!id || !id.startsWith("prompt-")) return null;
  return id.slice("prompt-".length);
}

function parseSlotTermId(id: string | null) {
  if (!id || !id.startsWith("slot-")) return null;
  return id.slice("slot-".length);
}

function DraggablePromptCard({
  promptId,
  text,
  disabled,
  compact = false,
  onSelect,
  tone = "default",
}: {
  promptId: string;
  text: string;
  disabled: boolean;
  compact?: boolean;
  onSelect?: () => void;
  tone?: "default" | "correct" | "incorrect";
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: promptDragId(promptId),
      disabled,
    });

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={[
        styles.promptCard,
        compact ? styles.promptCardCompact : "",
        tone === "correct" ? styles.promptCardCorrect : "",
        tone === "incorrect" ? styles.promptCardIncorrect : "",
        isDragging ? styles.promptCardDragging : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
          : undefined
      }
      onClick={() => {
        if (disabled) return;
        onSelect?.();
      }}
      {...attributes}
      {...listeners}
    >
      <span className={styles.promptHandle}>
        <FaIcon name="grip-vertical" size="xs" />
      </span>
      <span className={styles.promptText}>{text}</span>
    </button>
  );
}

function DroppableSlotCard({
  termId,
  interactionLocked,
  className,
  onClick,
  children,
}: {
  termId: string;
  interactionLocked: boolean;
  className: string;
  onClick: () => void;
  children: ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: slotDropId(termId),
    disabled: interactionLocked,
  });

  return (
    <div
      ref={setNodeRef}
      role="button"
      tabIndex={interactionLocked ? -1 : 0}
      aria-disabled={interactionLocked}
      className={[
        className,
        interactionLocked ? styles.slotCardLocked : "",
        isOver ? styles.slotCardOver : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
      onKeyDown={(event) => {
        if (interactionLocked) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
    >
      {children}
    </div>
  );
}

function PromptBankDropzone({
  interactionLocked,
  children,
}: {
  interactionLocked: boolean;
  children: ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: PROMPT_BANK_DROP_ID,
    disabled: interactionLocked,
  });

  return (
    <div
      ref={setNodeRef}
      className={[
        styles.promptsColumn,
        isOver ? styles.promptsColumnOver : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

export function MatchDefinitionBankWorkspace({
  payload = mockMatchDefinitionBankLevel,
  levelLinks,
  currentLevelPath,
  completedLevelPaths,
}: MatchDefinitionBankWorkspaceProps = {}) {
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
  const termIds = useMemo(
    () => level.question.terms.map((term) => term.id),
    [level.question.terms],
  );
  const [assignments, setAssignments] = useState<MatchAssignments>(
    buildInitialAssignments(termIds),
  );
  const [activePromptId, setActivePromptId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isTeacherAnswerRevealed, setIsTeacherAnswerRevealed] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

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

  const promptById = useMemo(
    () =>
      level.question.prompts.reduce<Record<string, (typeof level.question.prompts)[number]>>(
        (acc, prompt) => {
          acc[prompt.id] = prompt;
          return acc;
        },
        {},
      ),
    [level.question.prompts],
  );

  const displayAssignments = useMemo(() => {
    if (isTeacherAnswerRevealed) {
      return level.question.terms.reduce<MatchAssignments>((acc, term) => {
        const prompt = level.question.prompts.find(
          (item) => item.correctTermId === term.id,
        );
        acc[term.id] = prompt?.id ?? null;
        return acc;
      }, {});
    }
    return assignments;
  }, [assignments, isTeacherAnswerRevealed, level.question.prompts, level.question.terms]);

  const allAssigned = level.question.terms.every(
    (term) => Boolean(assignments[term.id]),
  );

  const totalCorrect = level.question.terms.filter((term) => {
    const promptId = assignments[term.id];
    if (!promptId) return false;
    return promptById[promptId]?.correctTermId === term.id;
  }).length;

  const isPerfectMatch = totalCorrect === level.question.terms.length;
  const interactionLocked = isSubmitted || isTeacherAnswerRevealed;
  const showInlineFeedback = isSubmitted && !isTeacherAnswerRevealed;

  const correctPromptIdForTerm = useMemo(() => {
    const map: Record<string, string | undefined> = {};
    for (const term of level.question.terms) {
      const prompt = level.question.prompts.find(
        (p) => p.correctTermId === term.id,
      );
      map[term.id] = prompt?.id;
    }
    return map;
  }, [level.question.prompts, level.question.terms]);

  const getRowFeedback = (termId: string): "correct" | "incorrect" | null => {
    // Only after submit — not during teacher reveal (reveal shows the key regardless of user work).
    if (!showInlineFeedback) return null;
    const correctPromptId = correctPromptIdForTerm[termId];
    const userPromptId = assignments[termId];
    if (!correctPromptId) return null;
    if (!userPromptId) return "incorrect";
    return userPromptId === correctPromptId ? "correct" : "incorrect";
  };

  const assignPromptToTerm = (termId: string, promptId: string) => {
    setAssignments((previous) => {
      const next = { ...previous };
      for (const currentTermId of Object.keys(next)) {
        if (next[currentTermId] === promptId) {
          next[currentTermId] = null;
        }
      }
      next[termId] = promptId;
      return next;
    });
  };

  const promptToTermId = Object.entries(displayAssignments).reduce<
    Record<string, string>
  >((acc, [termId, promptId]) => {
    if (promptId) {
      acc[promptId] = termId;
    }
    return acc;
  }, {});

  const assignedPromptIds = new Set(
    Object.values(displayAssignments).filter(Boolean) as string[],
  );
  const availablePrompts = level.question.prompts.filter(
    (prompt) => !assignedPromptIds.has(prompt.id),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const promptId = parsePromptId(String(event.active.id));
    setActivePromptId(promptId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const draggedPromptId = parsePromptId(String(event.active.id));
    const overId = event.over ? String(event.over.id) : null;
    const droppedTermId = parseSlotTermId(overId);

    if (!draggedPromptId) {
      setActivePromptId(null);
      return;
    }

    if (interactionLocked) {
      setActivePromptId(null);
      return;
    }

    const sourceTermId =
      Object.entries(assignments).find(([, promptId]) => promptId === draggedPromptId)?.[0] ??
      null;

    if (overId === PROMPT_BANK_DROP_ID || Boolean(parsePromptId(overId))) {
      if (sourceTermId) {
        setAssignments((previous) => ({
          ...previous,
          [sourceTermId]: null,
        }));
      }
      setActivePromptId(null);
      return;
    }

    if (!droppedTermId) {
      setActivePromptId(null);
      return;
    }

    setAssignments((previous) => {
      const next = { ...previous };
      const existingPromptInTarget = next[droppedTermId];

      if (sourceTermId && sourceTermId !== droppedTermId) {
        // Slot -> slot: swap when target occupied, move when empty.
        next[sourceTermId] = existingPromptInTarget ?? null;
        next[droppedTermId] = draggedPromptId;
        return next;
      }

      if (sourceTermId && sourceTermId === droppedTermId) {
        return next;
      }

      // Bank -> slot: replace target; previous target prompt returns to bank.
      for (const currentTermId of Object.keys(next)) {
        if (next[currentTermId] === draggedPromptId) {
          next[currentTermId] = null;
        }
      }
      next[droppedTermId] = draggedPromptId;
      return next;
    });
    setActivePromptId(null);
  };

  return (
    <Lab2Shell
      topNavigationProps={{
        title: `${level.metadata.lessonName} - ${level.name}`,
        subtitle: "Draft assessment level on Lab2 shell",
        currentLevel: level.metadata.levelPosition,
        totalLevels: level.metadata.totalLevelsInScript,
        completedLevels: [1, 2, 3, 4],
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
        setSidebarWidth((prev) => Math.max(300, Math.min(600, prev + delta)));
      }}
    >
      <main className={styles.workspace}>
        <div className={styles.card}>
          <AssessmentStemSection
            eyebrow="Match"
            question={level.stem.question}
            description={level.stem.description}
          >
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={() => setActivePromptId(null)}
            >
              <div className={styles.matchGrid}>
                <div className={styles.termsColumn}>
                  {level.question.terms.map((term) => {
                    const assignedPromptId = displayAssignments[term.id];
                    const rowFeedback = getRowFeedback(term.id);
                    return (
                      <div
                        key={term.id}
                        className={[
                          styles.termCard,
                          assignedPromptId && rowFeedback === null
                            ? styles.termCardMatched
                            : "",
                          rowFeedback === "correct" ? styles.termCardCorrect : "",
                          rowFeedback === "incorrect"
                            ? styles.termCardIncorrect
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {term.text}
                      </div>
                    );
                  })}
                </div>

                <div className={styles.slotsColumn}>
                  {level.question.terms.map((term) => {
                    const assignedPromptId = displayAssignments[term.id];
                    const assignedPrompt = assignedPromptId
                      ? promptById[assignedPromptId]
                      : null;
                    const rowFeedback = getRowFeedback(term.id);

                    return (
                      <DroppableSlotCard
                        key={term.id}
                        termId={term.id}
                        interactionLocked={interactionLocked}
                        className={[
                          styles.slotCard,
                          assignedPrompt ? styles.slotCardFilled : "",
                          assignedPrompt && rowFeedback === null
                            ? styles.slotCardMatched
                            : "",
                          rowFeedback === "correct" ? styles.slotCardCorrect : "",
                          rowFeedback === "incorrect"
                            ? styles.slotCardIncorrect
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        onClick={() => {
                          if (!activePromptId || interactionLocked) return;
                          assignPromptToTerm(term.id, activePromptId);
                          setActivePromptId(null);
                        }}
                      >
                        {assignedPrompt ? (
                          <DraggablePromptCard
                            promptId={assignedPrompt.id}
                            text={assignedPrompt.text}
                            disabled={interactionLocked}
                            compact
                            tone={
                              rowFeedback === "correct"
                                ? "correct"
                                : rowFeedback === "incorrect"
                                  ? "incorrect"
                                  : "default"
                            }
                            onSelect={() =>
                              setActivePromptId((current) =>
                                current === assignedPrompt.id
                                  ? null
                                  : assignedPrompt.id,
                              )
                            }
                          />
                        ) : (
                          <span className={styles.slotPlaceholder}>
                            <FaIcon name="circle-question" size="l" />
                          </span>
                        )}
                      </DroppableSlotCard>
                    );
                  })}
                </div>

                <PromptBankDropzone interactionLocked={interactionLocked}>
                  {availablePrompts.map((prompt) => (
                    <DraggablePromptCard
                      key={prompt.id}
                      promptId={prompt.id}
                      text={prompt.text}
                      disabled={interactionLocked}
                      onSelect={() =>
                        setActivePromptId((current) =>
                          current === prompt.id ? null : prompt.id,
                        )
                      }
                    />
                  ))}
                </PromptBankDropzone>
              </div>

              <DragOverlay>
                {activePromptId ? (
                  <div className={styles.dragOverlayCard}>
                    <span className={styles.promptHandle}>
                      <FaIcon name="grip-vertical" size="xs" />
                    </span>
                    <span className={styles.promptText}>
                      {promptById[activePromptId]?.text ?? ""}
                    </span>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </AssessmentStemSection>

          <AssessmentBottomRow
            left={
              <AppButton
                variant="secondary"
                tone="gray"
                iconPosition="start"
                iconName={isTeacherAnswerRevealed ? "eye-slash" : "eye"}
                size="m"
                onClick={() =>
                  setIsTeacherAnswerRevealed((current) => !current)
                }
              >
                {isTeacherAnswerRevealed ? "Hide answer" : "Reveal answer"}
              </AppButton>
            }
            right={
              <>
                {showInlineFeedback && isPerfectMatch ? (
                  <AssessmentSuccessFeedback />
                ) : null}
                {showInlineFeedback && !isPerfectMatch ? (
                  <p className={styles.partialFeedback}>
                    {totalCorrect} of {level.question.terms.length} matches are
                    correct.
                  </p>
                ) : null}
                {isSubmitted && isPerfectMatch ? (
                  <AppButton
                    variant="primary"
                    size="m"
                    tone="purple"
                    onClick={() => navigate(continuePath)}
                  >
                    Continue
                  </AppButton>
                ) : null}
                {isSubmitted && !isPerfectMatch ? (
                  <AppButton
                    variant="primary"
                    tone="purple"
                    size="m"
                    onClick={() => {
                      setAssignments(buildInitialAssignments(termIds));
                      setActivePromptId(null);
                      setIsSubmitted(false);
                    }}
                  >
                    Try again
                  </AppButton>
                ) : null}
                {!isSubmitted ? (
                  <AppButton
                    variant="primary"
                    size="m"
                    tone="purple"
                    onClick={() => {
                      if (!allAssigned || isTeacherAnswerRevealed) return;
                      const perfect = level.question.terms.every((term) => {
                        const promptId = assignments[term.id];
                        return promptId
                          ? promptById[promptId]?.correctTermId === term.id
                          : false;
                      });
                      playFeedbackSound(
                        perfect ? successSoundUrl : errorSoundUrl,
                      );
                      setIsSubmitted(true);
                    }}
                    disabled={!allAssigned || isTeacherAnswerRevealed}
                  >
                    Submit
                  </AppButton>
                ) : null}
              </>
            }
          />
        </div>
      </main>
    </Lab2Shell>
  );
}
