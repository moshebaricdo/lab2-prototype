import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { AppButton } from "../../../ui/AppButton";
import { FaIcon } from "../../../ui/icons/FaIcon";
import { Lab2Shell } from "../../../lab2/Lab2Shell";
import {
  getMatchCardAccessibilityLabel,
  mockMatchSwipeCardsLevel,
  type MatchLevelPayload,
  type MultiChoiceAnswerContentBlock,
} from "../../../../data/assessment";
import { initialChatMessages } from "../../../../data/weblab2";
import { useChatState } from "../../../../hooks/useChatState";
import { useLayoutState } from "../../../../hooks/useLayoutState";
import { useVersionHistoryState } from "../../../../hooks/useVersionHistoryState";
import type { LevelProgressLink } from "../../../ui/header/LevelProgressBubbles";
import errorSoundUrl from "@/assets/audio/error-sound.mp3";
import successSoundUrl from "@/assets/audio/success-sound.mp3";
import type { DevPanelField } from "../../../lab2/dev";
import { resourcePanelCompactDevField } from "../../../lab2/dev";
import { usePropsOverride } from "../../../../hooks/usePropsOverride";
import {
  AssessmentBottomRow,
  AssessmentLevelShell,
  AssessmentStemSection,
  AssessmentSuccessFeedback,
} from "../../shared";
import styles from "./MatchSwipeWorkspace.module.scss";

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

function nextIndex(current: number, total: number) {
  if (total <= 0) return 0;
  return (current + 1 + total) % total;
}

function prevIndex(current: number, total: number) {
  if (total <= 0) return 0;
  return (current - 1 + total) % total;
}

function getSwipeDirection(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): "left" | "right" | null {
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  if (Math.abs(deltaX) < 36) return null;
  if (Math.abs(deltaX) < Math.abs(deltaY)) return null;
  return deltaX > 0 ? "right" : "left";
}

function isCodeSnippet(block: MultiChoiceAnswerContentBlock) {
  return block.type === "code" && block.language !== "text";
}

function renderMatchContentBlock(
  block: MultiChoiceAnswerContentBlock,
  key: string,
) {
  if (block.type === "text") {
    return (
      <p key={key} className={styles.cardText}>
        {block.text}
      </p>
    );
  }
  if (block.type === "code") {
    if (isCodeSnippet(block)) {
      const lines = block.code.split("\n");
      return (
        <div key={key} className={styles.cardCodeNumbered}>
          <div className={styles.lineNumbers} aria-hidden="true">
            {lines.map((_, i) => (
              <span key={i}>{i + 1}</span>
            ))}
          </div>
          <pre className={styles.cardCode}>
            <code>{block.code}</code>
          </pre>
        </div>
      );
    }
    return (
      <p key={key} className={styles.cardText}>
        {block.code}
      </p>
    );
  }
  return (
    <figure key={key} className={styles.cardImageWrap}>
      <img src={block.src} alt={block.alt} loading="lazy" className={styles.cardImage} />
      {block.caption ? <figcaption className={styles.cardCaption}>{block.caption}</figcaption> : null}
    </figure>
  );
}

function renderCardBody(
  text: string | undefined,
  contentBlocks: MultiChoiceAnswerContentBlock[] | undefined,
) {
  if (contentBlocks?.length) {
    return (
      <div className={styles.cardBlocks}>
        {contentBlocks.map((block, index) =>
          renderMatchContentBlock(block, `block-${index}`),
        )}
      </div>
    );
  }
  if (!text?.trim()) return null;
  return <p className={styles.cardText}>{text}</p>;
}

function getCompactCardText(
  text: string | undefined,
  contentBlocks: MultiChoiceAnswerContentBlock[] | undefined,
) {
  const plain = text?.trim();
  if (plain) return plain;
  if (!contentBlocks?.length) return "No content";
  const firstBlock = contentBlocks[0];
  if (firstBlock.type === "text") return firstBlock.text.trim();
  if (firstBlock.type === "code") return firstBlock.code.trim().slice(0, 120);
  return firstBlock.alt?.trim() || firstBlock.caption?.trim() || "Image card";
}

function hasCodeSnippetBlock(
  contentBlocks: MultiChoiceAnswerContentBlock[] | undefined,
) {
  return contentBlocks?.some((b) => isCodeSnippet(b)) ?? false;
}

interface MatchSwipeWorkspaceProps {
  payload?: MatchLevelPayload;
  levelLinks?: LevelProgressLink[];
  currentLevelPath?: string;
  completedLevelPaths?: string[];
}

const matchSwipeDevFields: DevPanelField[] = [
  resourcePanelCompactDevField,
  { key: "level.stem.question", label: "Question", type: "text", group: "Stem" },
  { key: "level.stem.description", label: "Description (markdown)", type: "textarea", group: "Stem", rows: 5 },
  { key: "level.question.termLabel", label: "Term label", type: "text", group: "Labels" },
  { key: "level.question.promptLabel", label: "Definition label", type: "text", group: "Labels" },
  { key: "level.metadata.lessonName", label: "Lesson name", type: "text", group: "Metadata" },
];

export function MatchSwipeWorkspace({
  payload = mockMatchSwipeCardsLevel,
  levelLinks,
  currentLevelPath,
  completedLevelPaths,
}: MatchSwipeWorkspaceProps = {}) {
  const navigate = useNavigate();

  const overrideResult = usePropsOverride(
    {
      ...(payload as unknown as Record<string, unknown>),
      resourcePanelCompact: false,
    },
  );
  const resolvedPayload = overrideResult.props as unknown as MatchLevelPayload;
  const resourcePanelCompact = Boolean(
    (overrideResult.props as { resourcePanelCompact?: unknown }).resourcePanelCompact,
  );
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

  const terms = level.question.terms;
  const prompts = level.question.prompts;
  const termLabel = level.question.termLabel ?? "Term";
  const promptLabel = level.question.promptLabel ?? "Definition";
  const termIds = useMemo(() => terms.map((term) => term.id), [terms]);
  const promptById = useMemo(
    () =>
      prompts.reduce<Record<string, (typeof prompts)[number]>>((acc, prompt) => {
        acc[prompt.id] = prompt;
        return acc;
      }, {}),
    [prompts],
  );

  const [assignments, setAssignments] = useState<MatchAssignments>(
    buildInitialAssignments(termIds),
  );
  const [termIndex, setTermIndex] = useState(0);
  const [promptIndex, setPromptIndex] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isTeacherAnswerRevealed, setIsTeacherAnswerRevealed] = useState(false);
  const [a11yStatus, setA11yStatus] = useState("");
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const termTouchStartRef = useRef<{ x: number; y: number } | null>(null);
  const promptTouchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setAssignments(buildInitialAssignments(termIds));
    setTermIndex(0);
    setPromptIndex(0);
    setIsSubmitted(false);
    setIsTeacherAnswerRevealed(false);
    setA11yStatus("");
    setIsSummaryOpen(false);
  }, [level.id, termIds]);

  const continuePath = useMemo(() => {
    if (!levelLinks?.length || !currentLevelPath) return "/levels";
    const index = levelLinks.findIndex((link) => link.path === currentLevelPath);
    if (index === -1) return "/levels";
    return levelLinks[index + 1]?.path ?? "/levels";
  }, [levelLinks, currentLevelPath]);

  const displayAssignments = useMemo(() => {
    if (isTeacherAnswerRevealed) {
      return terms.reduce<MatchAssignments>((acc, term) => {
        const prompt = prompts.find((item) => item.correctTermId === term.id);
        acc[term.id] = prompt?.id ?? null;
        return acc;
      }, {});
    }
    return assignments;
  }, [assignments, isTeacherAnswerRevealed, prompts, terms]);

  const allAssigned = terms.every((term) => Boolean(assignments[term.id]));
  const hasAnyAssignment = Object.values(assignments).some(Boolean);
  const totalCorrect = terms.filter((term) => {
    const promptId = assignments[term.id];
    if (!promptId) return false;
    return promptById[promptId]?.correctTermId === term.id;
  }).length;
  const isPerfectMatch = totalCorrect === terms.length;
  const interactionLocked = isSubmitted || isTeacherAnswerRevealed;
  const showInlineFeedback = isSubmitted && !isTeacherAnswerRevealed;

  const currentTerm = terms[termIndex] ?? null;
  const currentPrompt = prompts[promptIndex] ?? null;
  const currentlyMatchedPromptId = currentTerm
    ? displayAssignments[currentTerm.id]
    : null;
  const promptCurrentlyAssignedToTermId =
    currentPrompt
      ? Object.entries(displayAssignments).find(
          ([, promptId]) => promptId === currentPrompt.id,
        )?.[0] ?? null
      : null;

  const matchedCount = terms.filter((term) => Boolean(displayAssignments[term.id])).length;

  const currentPairIsLinked =
    currentTerm &&
    currentPrompt &&
    displayAssignments[currentTerm.id] === currentPrompt.id;

  const unmatchCurrentPair = () => {
    if (interactionLocked || !currentTerm || !currentPrompt) return;
    if (!currentPairIsLinked) return;
    setAssignments((previous) => ({
      ...previous,
      [currentTerm.id]: null,
    }));
    setA11yStatus(
      `Unmatched ${getMatchCardAccessibilityLabel(currentTerm, "Term")} from ${getMatchCardAccessibilityLabel(
        currentPrompt,
        "Definition",
      )}.`,
    );
  };

  const promptToTermId = useMemo(() => {
    return Object.entries(displayAssignments).reduce<Record<string, string>>(
      (acc, [termId, promptId]) => {
        if (promptId) acc[promptId] = termId;
        return acc;
      },
      {},
    );
  }, [displayAssignments]);

  const assignCurrentPair = () => {
    if (interactionLocked || !currentTerm || !currentPrompt) return;
    setAssignments((previous) => {
      const next = { ...previous };
      for (const termId of Object.keys(next)) {
        if (next[termId] === currentPrompt.id) {
          next[termId] = null;
        }
      }
      next[currentTerm.id] = currentPrompt.id;
      return next;
    });
    setA11yStatus(
      `Matched ${getMatchCardAccessibilityLabel(currentTerm, "Term")} to ${getMatchCardAccessibilityLabel(
        currentPrompt,
        "Definition",
      )}.`,
    );
  };

  const handleDeckTouchStart = (
    event: ReactTouchEvent<HTMLElement>,
    deck: "term" | "prompt",
  ) => {
    const touch = event.changedTouches[0];
    if (!touch) return;
    const point = { x: touch.clientX, y: touch.clientY };
    if (deck === "term") {
      termTouchStartRef.current = point;
    } else {
      promptTouchStartRef.current = point;
    }
  };

  const handleDeckTouchEnd = (
    event: ReactTouchEvent<HTMLElement>,
    deck: "term" | "prompt",
  ) => {
    if (interactionLocked) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const start =
      deck === "term" ? termTouchStartRef.current : promptTouchStartRef.current;
    if (!start) return;
    const direction = getSwipeDirection(
      start.x,
      start.y,
      touch.clientX,
      touch.clientY,
    );
    if (!direction) return;
    if (deck === "term") {
      setTermIndex((current) =>
        direction === "left"
          ? nextIndex(current, terms.length)
          : prevIndex(current, terms.length),
      );
      return;
    }
    setPromptIndex((current) =>
      direction === "left"
        ? nextIndex(current, prompts.length)
        : prevIndex(current, prompts.length),
    );
  };

  const clearAll = () => {
    setAssignments(buildInitialAssignments(termIds));
    setIsSubmitted(false);
    setA11yStatus("All matches cleared.");
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
        collapsible: true,
        compact: resourcePanelCompact,
        showInstructionsDrawer: false,
        devPanelFields: matchSwipeDevFields,
        devPanelOverrideResult: overrideResult,
      }}
      onResize={(delta) => {
        setSidebarWidth((prev) => Math.max(300, Math.min(600, prev + delta)));
      }}
    >
      <AssessmentLevelShell>
        <AssessmentStemSection
            eyebrow="Match"
            question={level.stem.question}
            description={level.stem.description}
          >
            <div className={styles.visuallyHidden} aria-live="polite" aria-atomic="true">
              {a11yStatus}
            </div>

            <div
              className={styles.swipeBoard}
              role="group"
              aria-label="Swipe match cards"
            >
              <section className={styles.deck}>
                <div className={styles.deckHeader}>
                  <AppButton
                    size="s"
                    tone="gray"
                    variant="secondary"
                    iconName="arrow-left"
                    aria-label="Previous term"
                    onClick={() => setTermIndex((current) => prevIndex(current, terms.length))}
                    disabled={interactionLocked}
                  />
                  <div className={styles.deckTitleGroup}>
                    <h3 className={styles.deckTitle}>{termLabel}</h3>
                    <p className={styles.deckCounter}>
                      {termIndex + 1} / {terms.length}
                      {currentlyMatchedPromptId ? (
                        <span className={styles.deckStatus}>
                          &middot; Matched to {promptLabel.toLowerCase()} {prompts.findIndex((p) => p.id === currentlyMatchedPromptId) + 1}
                        </span>
                      ) : (
                        <span className={styles.deckStatusMuted}>&middot; Unmatched</span>
                      )}
                    </p>
                  </div>
                  <AppButton
                    size="s"
                    tone="gray"
                    variant="secondary"
                    iconName="arrow-right"
                    aria-label="Next term"
                    iconPosition="end"
                    onClick={() => setTermIndex((current) => nextIndex(current, terms.length))}
                    disabled={interactionLocked}
                  />
                </div>
                <div
                  className={[
                    styles.deckCardStack,
                    currentlyMatchedPromptId ? styles.deckCardMatched : "",
                  ].filter(Boolean).join(" ")}
                  onTouchStart={(event) => handleDeckTouchStart(event, "term")}
                  onTouchEnd={(event) => handleDeckTouchEnd(event, "term")}
                >
                  {terms.map((term, i) => (
                    <div
                      key={term.id}
                      className={[
                        styles.deckCard,
                        i === termIndex ? styles.deckCardActive : styles.deckCardHidden,
                      ].join(" ")}
                    >
                      {renderCardBody(term.text, term.contentBlocks)}
                    </div>
                  ))}
                </div>
              </section>

              <section className={styles.deck}>
                <div className={styles.deckHeader}>
                  <AppButton
                    size="s"
                    tone="gray"
                    variant="secondary"
                    iconName="arrow-left"
                    aria-label="Previous definition"
                    onClick={() => setPromptIndex((current) => prevIndex(current, prompts.length))}
                    disabled={interactionLocked}
                  />
                  <div className={styles.deckTitleGroup}>
                    <h3 className={styles.deckTitle}>{promptLabel}</h3>
                    <p className={styles.deckCounter}>
                      {promptIndex + 1} / {prompts.length}
                      {promptCurrentlyAssignedToTermId ? (
                        <span className={styles.deckStatus}>
                          &middot; Matched to {termLabel.toLowerCase()} {terms.findIndex((t) => t.id === promptCurrentlyAssignedToTermId) + 1}
                        </span>
                      ) : (
                        <span className={styles.deckStatusMuted}>&middot; Unmatched</span>
                      )}
                    </p>
                  </div>
                  <AppButton
                    size="s"
                    tone="gray"
                    variant="secondary"
                    iconName="arrow-right"
                    aria-label="Next definition"
                    iconPosition="end"
                    onClick={() => setPromptIndex((current) => nextIndex(current, prompts.length))}
                    disabled={interactionLocked}
                  />
                </div>
                <div
                  className={[
                    styles.deckCardStack,
                    promptCurrentlyAssignedToTermId ? styles.deckCardMatched : "",
                  ].filter(Boolean).join(" ")}
                  onTouchStart={(event) => handleDeckTouchStart(event, "prompt")}
                  onTouchEnd={(event) => handleDeckTouchEnd(event, "prompt")}
                >
                  {prompts.map((prompt, i) => (
                    <div
                      key={prompt.id}
                      className={[
                        styles.deckCard,
                        i === promptIndex ? styles.deckCardActive : styles.deckCardHidden,
                      ].join(" ")}
                    >
                      {renderCardBody(prompt.text, prompt.contentBlocks)}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className={styles.connectorZone}>
              <svg
                className={styles.connectorSvg}
                viewBox="0 0 1012 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M 253 0 L 253 36 Q 253 50, 267 50 L 380 50"
                  fill="none"
                  stroke="var(--ds-border-neutral-primary)"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M 759 0 L 759 36 Q 759 50, 745 50 L 600 50"
                  fill="none"
                  stroke="var(--ds-border-neutral-primary)"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className={styles.connectorBtnWrap}>
                <div className={styles.connectorBtnContent}>
                  {currentPairIsLinked && !interactionLocked ? (
                    <AppButton
                      size="m"
                      tone="gray"
                      variant="secondary"
                      iconName="link-slash"
                      iconPosition="start"
                      onClick={unmatchCurrentPair}
                    >
                      Unmatch this pair
                    </AppButton>
                  ) : (
                    <AppButton
                      size="m"
                      tone="purple"
                      variant="primary"
                      iconName="link"
                      iconPosition="start"
                      onClick={assignCurrentPair}
                      disabled={interactionLocked || !currentTerm || !currentPrompt}
                    >
                      Match current pair
                    </AppButton>
                  )}
                </div>
                <p className={styles.connectorProgress}>
                  {matchedCount} / {terms.length} pairs matched
                </p>
              </div>
            </div>

            <section className={styles.summarySection}>
              <div
                className={styles.summaryToggle}
              >
                <span className={styles.summaryToggleTitle}>Full match list</span>
                <div className={styles.summaryToggleRight}>
                  <button
                    type="button"
                    className={styles.summaryToggleMetaButton}
                    aria-expanded={isSummaryOpen}
                    onClick={() => setIsSummaryOpen((current) => !current)}
                  >
                    {isSummaryOpen ? "Hide all terms and definitions" : "Show all terms and definitions"}
                  </button>
                  <AppButton
                    variant="secondary"
                    tone="gray"
                    size="xs"
                    iconName={isSummaryOpen ? "chevron-up" : "chevron-down"}
                    aria-label={isSummaryOpen ? "Collapse full match list" : "Expand full match list"}
                    onClick={() => setIsSummaryOpen((current) => !current)}
                  />
                </div>
              </div>
              {isSummaryOpen ? (
                <div
                  className={[
                    styles.summaryGridWrap,
                    isSummaryOpen ? styles.summaryGridWrapOpen : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <div className={styles.summaryGrid}>
                  <section className={styles.summaryColumn}>
                    <h4 className={styles.summaryHeading}>{termLabel}s</h4>
                    <ul className={styles.summaryCards}>
                      {terms.map((term, index) => {
                        const promptId = displayAssignments[term.id];
                        const prompt = promptId ? promptById[promptId] : null;
                        const isCorrect = Boolean(prompt && prompt.correctTermId === term.id);
                        const termPreview = getCompactCardText(term.text, term.contentBlocks);
                        const termIsCode = hasCodeSnippetBlock(term.contentBlocks);
                        const promptPreview = prompt
                          ? getCompactCardText(prompt.text, prompt.contentBlocks)
                          : "Unmatched";
                        const promptIsCode = prompt ? hasCodeSnippetBlock(prompt.contentBlocks) : false;
                        const promptNumber = prompt
                          ? prompts.findIndex((p) => p.id === prompt.id) + 1
                          : null;
                        return (
                          <li
                            key={term.id}
                            className={[
                              styles.summaryCard,
                              prompt ? styles.summaryCardMatched : "",
                              showInlineFeedback && prompt
                                ? isCorrect
                                  ? styles.summaryCardCorrect
                                  : styles.summaryCardIncorrect
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            {termIsCode ? (
                              <div className={styles.summaryCodeRow}>
                                <span className={styles.summaryLabel}>{index + 1}.</span>
                                <pre className={styles.summaryCodeBlock}><code>{termPreview}</code></pre>
                              </div>
                            ) : (
                              <span className={styles.summaryPrimary}>
                                {index + 1}: {termPreview}
                              </span>
                            )}
                            {promptIsCode ? (
                              <div className={styles.summaryCodeRow}>
                                <span className={styles.summaryLabel}>{promptNumber ? `${promptNumber}.` : ""}</span>
                                <pre className={styles.summaryCodeBlock}><code>{prompt ? promptPreview : "Unmatched"}</code></pre>
                              </div>
                            ) : (
                              <span className={styles.summarySecondary}>
                                {prompt && promptNumber ? `${promptNumber}: ${promptPreview}` : "Unmatched"}
                              </span>
                            )}
                            {showInlineFeedback && prompt ? (
                              <span
                                className={
                                  isCorrect
                                    ? styles.summaryStateCorrect
                                    : styles.summaryStateIncorrect
                                }
                              >
                                <FaIcon name={isCorrect ? "check" : "xmark"} size="xs" />
                              </span>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  </section>

                  <section className={styles.summaryColumn}>
                    <h4 className={styles.summaryHeading}>{promptLabel}s</h4>
                    <ul className={styles.summaryCards}>
                      {prompts.map((prompt, index) => {
                        const assignedTermId = promptToTermId[prompt.id];
                        const isCorrect = assignedTermId === prompt.correctTermId;
                        const promptPreview = getCompactCardText(
                          prompt.text,
                          prompt.contentBlocks,
                        );
                        const promptIsCode = hasCodeSnippetBlock(prompt.contentBlocks);
                        const assignedTerm = assignedTermId
                          ? terms.find((term) => term.id === assignedTermId)
                          : null;
                        const termPreview = assignedTerm
                          ? getCompactCardText(
                              assignedTerm.text,
                              assignedTerm.contentBlocks,
                            )
                          : "Unmatched";
                        const termIsCode = assignedTerm ? hasCodeSnippetBlock(assignedTerm.contentBlocks) : false;
                        const termNumber = assignedTerm
                          ? terms.findIndex((term) => term.id === assignedTerm.id) + 1
                          : null;
                        return (
                          <li
                            key={prompt.id}
                            className={[
                              styles.summaryCard,
                              assignedTermId ? styles.summaryCardMatched : "",
                              showInlineFeedback && assignedTermId
                                ? isCorrect
                                  ? styles.summaryCardCorrect
                                  : styles.summaryCardIncorrect
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            {promptIsCode ? (
                              <div className={styles.summaryCodeRow}>
                                <span className={styles.summaryLabel}>{index + 1}.</span>
                                <pre className={styles.summaryCodeBlock}><code>{promptPreview}</code></pre>
                              </div>
                            ) : (
                              <span className={styles.summaryPrimary}>
                                {index + 1}: {promptPreview}
                              </span>
                            )}
                            {termIsCode ? (
                              <div className={styles.summaryCodeRow}>
                                <span className={styles.summaryLabel}>{termNumber ? `${termNumber}.` : ""}</span>
                                <pre className={styles.summaryCodeBlock}><code>{assignedTerm ? termPreview : "Unmatched"}</code></pre>
                              </div>
                            ) : (
                              <span className={styles.summarySecondary}>
                                {assignedTermId && termNumber ? `${termNumber}: ${termPreview}` : "Unmatched"}
                              </span>
                            )}
                            {showInlineFeedback && assignedTermId ? (
                              <span
                                className={
                                  isCorrect
                                    ? styles.summaryStateCorrect
                                    : styles.summaryStateIncorrect
                                }
                              >
                                <FaIcon name={isCorrect ? "check" : "xmark"} size="xs" />
                              </span>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                  </div>
                </div>
              ) : null}
            </section>
          </AssessmentStemSection>

          <AssessmentBottomRow
            left={
              <>
                <AppButton
                  variant="secondary"
                  tone="gray"
                  iconPosition="start"
                  iconName={isTeacherAnswerRevealed ? "eye-slash" : "eye"}
                  size="m"
                  onClick={() => {
                    setIsTeacherAnswerRevealed((current) => {
                      if (!current) setIsSummaryOpen(true);
                      return !current;
                    });
                  }}
                >
                  {isTeacherAnswerRevealed ? "Hide answer" : "Reveal answer"}
                </AppButton>
                {!isSubmitted && hasAnyAssignment ? (
                  <AppButton
                    variant="secondary"
                    tone="gray"
                    size="m"
                    onClick={clearAll}
                  >
                    Clear all
                  </AppButton>
                ) : null}
              </>
            }
            right={
              <>
                {showInlineFeedback && isPerfectMatch ? <AssessmentSuccessFeedback /> : null}
                {showInlineFeedback && !isPerfectMatch ? (
                  <p className={styles.partialFeedback}>
                    {totalCorrect} of {terms.length} matches are correct.
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
                      const perfect = terms.every((term) => {
                        const promptId = assignments[term.id];
                        return promptId ? promptById[promptId]?.correctTermId === term.id : false;
                      });
                      playFeedbackSound(perfect ? successSoundUrl : errorSoundUrl);
                      setIsSubmitted(true);
                      setIsSummaryOpen(true);
                    }}
                    disabled={!allAssigned || isTeacherAnswerRevealed}
                  >
                    Submit
                  </AppButton>
                ) : null}
              </>
            }
          />
      </AssessmentLevelShell>
    </Lab2Shell>
  );
}
