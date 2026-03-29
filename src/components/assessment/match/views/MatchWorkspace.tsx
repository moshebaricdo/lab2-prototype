import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { AppButton } from "../../../ui/AppButton";
import { FaIcon } from "../../../icons/FaIcon";
import { Lab2Shell } from "../../../lab2/Lab2Shell";
import {
  mockMatchLevel,
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
import styles from "./MatchWorkspace.module.scss";

/* ── Accent palette (cycled per definition index) ─────────────── */

const ACCENT_PALETTE: { bg: string; border: string }[] = [
  {
    bg: "var(--ds-background-brand-teal-extra-light)",
    border: "var(--ds-borders-brand-teal-primary)",
  },
  {
    bg: "var(--ds-background-brand-purple-extra-light)",
    border: "var(--ds-borders-brand-purple-primary)",
  },
  {
    bg: "var(--ds-background-info-extra-light)",
    border: "var(--ds-borders-info-primary)",
  },
  {
    bg: "var(--ds-background-accent-orange-light)",
    border: "var(--ds-background-accent-orange-primary)",
  },
  {
    bg: "var(--ds-background-accent-strawberry-light)",
    border: "var(--ds-background-accent-strawberry-primary)",
  },
  {
    bg: "var(--ds-background-brand-aqua-extra-light)",
    border: "var(--ds-borders-brand-aqua-primary)",
  },
];

function accentForIndex(index: number): { bg: string; border: string } {
  return ACCENT_PALETTE[index % ACCENT_PALETTE.length];
}

function accentVars(index: number): CSSProperties {
  const a = accentForIndex(index);
  return {
    "--match-accent-bg": a.bg,
    "--match-accent-border": a.border,
  } as CSSProperties;
}

/* ── Helpers ───────────────────────────────────────────────────── */

type MatchAssignments = Record<string, string | null>;

function buildInitialAssignments(promptIds: string[]) {
  return promptIds.reduce<MatchAssignments>((acc, promptId) => {
    acc[promptId] = null;
    return acc;
  }, {});
}

function playFeedbackSound(src: string) {
  const audio = new Audio(src);
  void audio.play().catch(() => {});
}

/* ── Component ─────────────────────────────────────────────────── */

interface MatchWorkspaceProps {
  payload?: MatchLevelPayload;
  levelLinks?: LevelProgressLink[];
  currentLevelPath?: string;
  completedLevelPaths?: string[];
}

export function MatchWorkspace({
  payload = mockMatchLevel,
  levelLinks,
  currentLevelPath,
  completedLevelPaths,
}: MatchWorkspaceProps = {}) {
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

  const promptIds = useMemo(
    () => level.question.prompts.map((p) => p.id),
    [level.question.prompts],
  );

  const [assignments, setAssignments] = useState<MatchAssignments>(
    buildInitialAssignments(promptIds),
  );
  const [activeDrag, setActiveDrag] = useState<{
    type: "prompt" | "term";
    id: string;
    startX: number;
    startY: number;
  } | null>(null);
  const [dragPoint, setDragPoint] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isTeacherAnswerRevealed, setIsTeacherAnswerRevealed] = useState(false);
  const [layoutVersion, setLayoutVersion] = useState(0);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const promptNodeRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const termNodeRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    setAssignments(buildInitialAssignments(promptIds));
    setActiveDrag(null);
    setDragPoint(null);
    setIsSubmitted(false);
    setIsTeacherAnswerRevealed(false);
  }, [level.id, promptIds]);

  useEffect(() => {
    setActiveDrag(null);
    setDragPoint(null);
  }, [isSubmitted, isTeacherAnswerRevealed]);

  useEffect(() => {
    const handleResize = () => {
      setLayoutVersion((v) => v + 1);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const observer = new ResizeObserver(() => {
      setLayoutVersion((v) => v + 1);
    });
    observer.observe(board);
    return () => {
      observer.disconnect();
    };
  }, []);

  /* ── Derived state ─────────────────────────────────────────── */

  const continuePath = useMemo(() => {
    if (!levelLinks?.length || !currentLevelPath) return "/levels";
    const idx = levelLinks.findIndex((l) => l.path === currentLevelPath);
    if (idx === -1) return "/levels";
    return levelLinks[idx + 1]?.path ?? "/levels";
  }, [levelLinks, currentLevelPath]);

  const displayAssignments = useMemo(() => {
    if (isTeacherAnswerRevealed) {
      return level.question.prompts.reduce<MatchAssignments>((acc, p) => {
        acc[p.id] = p.correctTermId;
        return acc;
      }, {});
    }
    return assignments;
  }, [isTeacherAnswerRevealed, assignments, level.question.prompts]);

  const allAssigned = useMemo(
    () => level.question.prompts.every((p) => Boolean(assignments[p.id])),
    [assignments, level.question.prompts],
  );

  const hasAnyAssignment = useMemo(
    () => Object.values(assignments).some(Boolean),
    [assignments],
  );

  const totalCorrect = useMemo(
    () =>
      level.question.prompts.filter(
        (p) => assignments[p.id] === p.correctTermId,
      ).length,
    [assignments, level.question.prompts],
  );
  const isPerfectMatch = totalCorrect === level.question.prompts.length;

  const interactionLocked = isSubmitted || isTeacherAnswerRevealed;
  const showInlineFeedback = isSubmitted && !isTeacherAnswerRevealed;

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

  const termToPromptId = useMemo(() => {
    return Object.entries(displayAssignments).reduce<Record<string, string>>(
      (acc, [promptId, termId]) => {
        if (termId) {
          acc[termId] = promptId;
        }
        return acc;
      },
      {},
    );
  }, [displayAssignments]);

  const rowCount = Math.max(
    level.question.prompts.length,
    level.question.terms.length,
  );

  const getNodeCenter = useCallback((el: HTMLElement | null) => {
    const board = boardRef.current;
    if (!board || !el) return null;
    const boardRect = board.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    return {
      x: elRect.left - boardRect.left + elRect.width / 2,
      y: elRect.top - boardRect.top + elRect.height / 2,
    };
  }, []);

  const connectorSegments = useMemo(() => {
    return level.question.prompts
      .map((prompt) => {
        const termId = displayAssignments[prompt.id];
        if (!termId) return null;
        const start = getNodeCenter(promptNodeRefs.current[prompt.id]);
        const end = getNodeCenter(termNodeRefs.current[termId]);
        if (!start || !end) return null;
        const isCorrect = termId === prompt.correctTermId;
        return {
          id: `${prompt.id}-${termId}`,
          x1: start.x,
          y1: start.y,
          x2: end.x,
          y2: end.y,
          state: isTeacherAnswerRevealed
            ? "revealed"
            : showInlineFeedback
              ? isCorrect
                ? "correct"
                : "incorrect"
              : "neutral",
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      state: "neutral" | "correct" | "incorrect" | "revealed";
    }>;
  }, [
    displayAssignments,
    getNodeCenter,
    isTeacherAnswerRevealed,
    layoutVersion,
    level.question.prompts,
    showInlineFeedback,
  ]);

  /* ── Handlers ──────────────────────────────────────────────── */

  const assignTermToPrompt = useCallback((promptId: string, termId: string) => {
    setAssignments((prev) => {
      const next = { ...prev };
      for (const pid of Object.keys(next)) {
        if (next[pid] === termId) next[pid] = null;
      }
      next[promptId] = termId;
      return next;
    });
  }, []);

  const unassignFromPrompt = (promptId: string) => {
    setAssignments((prev) => ({ ...prev, [promptId]: null }));
  };

  const handleSubmitMatches = () => {
    if (!allAssigned || isTeacherAnswerRevealed) return;
    const perfect = level.question.prompts.every(
      (p) => assignments[p.id] === p.correctTermId,
    );
    playFeedbackSound(perfect ? successSoundUrl : errorSoundUrl);
    setIsSubmitted(true);
  };

  const tryAgain = () => {
    setAssignments(buildInitialAssignments(promptIds));
    setIsSubmitted(false);
  };

  const clearAll = () => {
    setAssignments(buildInitialAssignments(promptIds));
  };

  const startConnectorDrag = (
    type: "prompt" | "term",
    id: string,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    if (interactionLocked) return;
    event.preventDefault();
    const origin = getNodeCenter(event.currentTarget);
    if (!origin) return;
    setActiveDrag({ type, id, startX: origin.x, startY: origin.y });
    setDragPoint(origin);
  };

  useEffect(() => {
    if (!activeDrag) return;

    const handleMove = (event: PointerEvent) => {
      const board = boardRef.current;
      if (!board) return;
      const rect = board.getBoundingClientRect();
      setDragPoint({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    };

    const handleUp = (event: PointerEvent) => {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-connector-node='true']",
      );

      if (target && !interactionLocked) {
        const targetType = target.dataset.connectorType as
          | "prompt"
          | "term"
          | undefined;
        const targetId = target.dataset.connectorId;
        if (targetType && targetId && targetType !== activeDrag.type) {
          const promptId = activeDrag.type === "prompt" ? activeDrag.id : targetId;
          const termId = activeDrag.type === "term" ? activeDrag.id : targetId;
          assignTermToPrompt(promptId, termId);
        }
      }

      setActiveDrag(null);
      setDragPoint(null);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [activeDrag, assignTermToPrompt, interactionLocked]);

  /* ── Render ────────────────────────────────────────────────── */

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
            <div className={styles.taskToolbar}>
              <p className={styles.instruction}>
                Drag from a node on either side to create a connector.
              </p>
              {!interactionLocked && hasAnyAssignment ? (
                <AppButton
                  variant="secondary"
                  tone="gray"
                  size="m"
                  onClick={clearAll}
                >
                  Clear all
                </AppButton>
              ) : null}
            </div>

            <div ref={boardRef} className={styles.board}>
              <svg className={styles.connectorCanvas} aria-hidden="true">
                {connectorSegments.map((segment) => (
                  <line
                    key={segment.id}
                    x1={segment.x1}
                    y1={segment.y1}
                    x2={segment.x2}
                    y2={segment.y2}
                    className={[
                      styles.connectorLine,
                      segment.state === "correct" ? styles.connectorLineCorrect : "",
                      segment.state === "incorrect"
                        ? styles.connectorLineIncorrect
                        : "",
                      segment.state === "revealed"
                        ? styles.connectorLineRevealed
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  />
                ))}
                {activeDrag && dragPoint ? (
                  <line
                    x1={activeDrag.startX}
                    y1={activeDrag.startY}
                    x2={dragPoint.x}
                    y2={dragPoint.y}
                    className={styles.connectorLineDraft}
                  />
                ) : null}
              </svg>

              <div className={styles.matchArea}>
                <div className={styles.definitionsColumn}>
                  <p className={styles.columnLabel}>Definitions</p>
                  <div
                    className={styles.columnCards}
                    style={{ "--row-count": rowCount } as CSSProperties}
                  >
                    {level.question.prompts.map((prompt) => {
                      const assignedTermId = displayAssignments[prompt.id];
                      const assignedTerm = assignedTermId
                        ? level.question.terms.find((t) => t.id === assignedTermId)
                        : null;
                      const isCorrect =
                        Boolean(assignedTermId) &&
                        assignedTermId === prompt.correctTermId;

                      return (
                        <div
                          key={prompt.id}
                          className={[
                            styles.definitionCard,
                            assignedTerm &&
                            !showInlineFeedback &&
                            !isTeacherAnswerRevealed
                              ? styles.definitionCardMatched
                              : "",
                            showInlineFeedback && isCorrect
                              ? styles.definitionCardCorrect
                              : "",
                            showInlineFeedback && assignedTerm && !isCorrect
                              ? styles.definitionCardIncorrect
                              : "",
                            isTeacherAnswerRevealed
                              ? styles.definitionCardRevealed
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          <div className={styles.definitionHeader}>
                            <p className={styles.definitionText}>{prompt.text}</p>
                            <button
                              ref={(el) => {
                                promptNodeRefs.current[prompt.id] = el;
                              }}
                              type="button"
                              className={[
                                styles.connectorNode,
                                styles.connectorNodePrompt,
                              ].join(" ")}
                              data-connector-node="true"
                              data-connector-type="prompt"
                              data-connector-id={prompt.id}
                              disabled={interactionLocked}
                              aria-label={`Definition connector for: ${prompt.text}`}
                              onPointerDown={(event) =>
                                startConnectorDrag("prompt", prompt.id, event)
                              }
                            />
                          </div>

                          {assignedTerm ? (
                            <div
                              className={[
                                styles.answerPill,
                                showInlineFeedback && isCorrect
                                  ? styles.answerPillCorrect
                                  : "",
                                showInlineFeedback && !isCorrect
                                  ? styles.answerPillIncorrect
                                  : "",
                                isTeacherAnswerRevealed
                                  ? styles.answerPillRevealed
                                  : "",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                            >
                              <span className={styles.answerPillText}>
                                {assignedTerm.text}
                              </span>
                              {showInlineFeedback ? (
                                <span
                                  className={[
                                    styles.rowStatusBadge,
                                    isCorrect
                                      ? styles.rowStatusBadgeCorrect
                                      : styles.rowStatusBadgeIncorrect,
                                  ].join(" ")}
                                >
                                  <FaIcon
                                    name={isCorrect ? "check" : "xmark"}
                                    size="xs"
                                  />
                                  {isCorrect ? "Correct" : "Incorrect"}
                                </span>
                              ) : null}
                              {!interactionLocked ? (
                                <button
                                  type="button"
                                  className={styles.answerPillRemove}
                                  aria-label={`Remove ${assignedTerm.text}`}
                                  onClick={() => {
                                    unassignFromPrompt(prompt.id);
                                  }}
                                >
                                  <FaIcon name="xmark" size="xs" />
                                </button>
                              ) : null}
                            </div>
                          ) : (
                            <div className={styles.answerSlot}>Connect a term</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.termsColumn}>
                  <p className={styles.columnLabel}>Terms</p>
                  <div
                    className={styles.columnCards}
                    style={{ "--row-count": rowCount } as CSSProperties}
                  >
                    {level.question.terms.map((term) => {
                      const connectedPromptId = termToPromptId[term.id];
                      const isConnected = Boolean(connectedPromptId);
                      const prompt = connectedPromptId
                        ? promptById[connectedPromptId]
                        : null;
                      const isCorrect =
                        Boolean(prompt) && prompt.correctTermId === term.id;

                      return (
                        <div
                          key={term.id}
                          style={
                            connectedPromptId
                              ? accentVars(
                                  level.question.prompts.findIndex(
                                    (currentPrompt) =>
                                      currentPrompt.id === connectedPromptId,
                                  ),
                                )
                              : undefined
                          }
                          className={[
                            styles.termCard,
                            isConnected &&
                            !showInlineFeedback &&
                            !isTeacherAnswerRevealed
                              ? styles.termCardConnected
                              : "",
                            showInlineFeedback && isConnected && isCorrect
                              ? styles.termCardCorrect
                              : "",
                            showInlineFeedback && isConnected && !isCorrect
                              ? styles.termCardIncorrect
                              : "",
                            isTeacherAnswerRevealed
                              ? styles.termCardRevealed
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          <button
                            ref={(el) => {
                              termNodeRefs.current[term.id] = el;
                            }}
                            type="button"
                            className={[
                              styles.connectorNode,
                              styles.connectorNodeTerm,
                            ].join(" ")}
                            data-connector-node="true"
                            data-connector-type="term"
                            data-connector-id={term.id}
                            disabled={interactionLocked}
                            aria-label={`Term connector for: ${term.text}`}
                            onPointerDown={(event) =>
                              startConnectorDrag("term", term.id, event)
                            }
                          />
                          <span className={styles.termText}>{term.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
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
                  setIsTeacherAnswerRevealed((cur) => !cur);
                }}
              >
                {isTeacherAnswerRevealed ? "Hide answer" : "Reveal answer"}
              </AppButton>
            }
            right={
              <>
                {showInlineFeedback && isPerfectMatch && (
                  <AssessmentSuccessFeedback />
                )}
                {showInlineFeedback && !isPerfectMatch && (
                  <p className={styles.partialFeedback}>
                    {totalCorrect} of {level.question.prompts.length} matches
                    are correct.
                  </p>
                )}
                {isSubmitted && isPerfectMatch && (
                  <AppButton
                    variant="primary"
                    size="m"
                    tone="purple"
                    onClick={() => navigate(continuePath)}
                  >
                    Continue
                  </AppButton>
                )}
                {isSubmitted && !isPerfectMatch && (
                  <AppButton
                    variant="primary"
                    tone="purple"
                    size="m"
                    onClick={tryAgain}
                  >
                    Try again
                  </AppButton>
                )}
                {!isSubmitted && (
                  <AppButton
                    variant="primary"
                    size="m"
                    tone="purple"
                    onClick={handleSubmitMatches}
                    disabled={!allAssigned || isTeacherAnswerRevealed}
                  >
                    Submit matches
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
