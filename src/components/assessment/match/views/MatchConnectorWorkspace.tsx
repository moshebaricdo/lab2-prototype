import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@moshebaricdo/cads-react";
import { FaIcon } from "../../../ui/icons/FaIcon";
import { Lab2Shell } from "../../../lab2/Lab2Shell";
import {
  getMatchCardAccessibilityLabel,
  mockMatchLevel,
  type MatchCardContentAlign,
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
  correctMatchPromptIds,
  keepCorrectMatchAssignments,
} from "../../../../lib/assessmentBuilder";
import {
  AssessmentBottomRow,
  AssessmentLevelShell,
  AssessmentStemSection,
  AssessmentSuccessFeedback,
  assessmentLevelShellVariant,
} from "../../shared";
import stemStyles from "../../shared/AssessmentStemSection.module.scss";
import styles from "./MatchConnectorWorkspace.module.scss";

/* ── Helpers ───────────────────────────────────────────────────── */

type MatchAssignments = Record<string, string | null>;

function buildInitialAssignments(promptIds: string[]) {
  return promptIds.reduce<MatchAssignments>((acc, id) => {
    acc[id] = null;
    return acc;
  }, {});
}

function playFeedbackSound(src: string) {
  const audio = new Audio(src);
  void audio.play().catch(() => {});
}

function buildCurvePath(
  start: { x: number; y: number },
  end: { x: number; y: number },
): string {
  const dx = end.x - start.x;
  const absDx = Math.abs(dx);
  const sign = dx >= 0 ? 1 : -1;
  const cpOffset = Math.max(absDx * 0.45, 30) * sign;
  return `M ${start.x} ${start.y} C ${start.x + cpOffset} ${start.y}, ${end.x - cpOffset} ${end.y}, ${end.x} ${end.y}`;
}

const BRAND_STROKE = "var(--border-selected-primary)";

function renderMatchContentBlock(
  block: MultiChoiceAnswerContentBlock,
  key: string,
) {
  if (block.type === "text") {
    return (
      <p key={key} className={styles.matchCardTextBlock}>
        {block.text}
      </p>
    );
  }
  if (block.type === "code") {
    return (
      <pre key={key} className={styles.matchCardCodeBlock}>
        <code>{block.code}</code>
      </pre>
    );
  }
  return (
    <figure key={key} className={styles.matchCardImageBlock}>
      <img src={block.src} alt={block.alt} loading="lazy" />
      {block.caption ? (
        <figcaption className={styles.matchCardImageCaption}>
          {block.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function renderMatchCardBody(
  text: string | undefined,
  contentBlocks: MultiChoiceAnswerContentBlock[] | undefined,
  variant: "term" | "prompt",
  align: MatchCardContentAlign,
) {
  const blocksAlignClass =
    align === "center"
      ? styles.matchCardBlocksAlignCenter
      : styles.matchCardBlocksAlignStart;

  if (contentBlocks?.length) {
    return (
      <div className={[styles.matchCardBlocks, blocksAlignClass].join(" ")}>
        {contentBlocks.map((block, index) =>
          renderMatchContentBlock(block, `b-${index}`),
        )}
      </div>
    );
  }
  if (text?.trim()) {
    return variant === "term" ? (
      <span
        className={[
          styles.termText,
          align === "start" ? styles.termTextAlignStart : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {text}
      </span>
    ) : (
      <p
        className={[
          styles.promptText,
          align === "center" ? styles.promptTextAlignCenter : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {text}
      </p>
    );
  }
  return null;
}

function MatchConnectorKeyBoard({
  terms,
  prompts,
  columnFlexVars,
  cardAlignment,
}: {
  terms: MatchLevelPayload["level"]["question"]["terms"];
  prompts: MatchLevelPayload["level"]["question"]["prompts"];
  columnFlexVars: CSSProperties;
  cardAlignment: {
    terms: MatchCardContentAlign;
    prompts: MatchCardContentAlign;
  };
}) {
  const boardId = useId();
  const boardRef = useRef<HTMLDivElement | null>(null);
  const promptDotRefs = useRef<Record<string, HTMLElement | null>>({});
  const termDotRefs = useRef<Record<string, HTMLElement | null>>({});
  const [layoutVersion, setLayoutVersion] = useState(0);

  const assignments = useMemo(
    () =>
      prompts.reduce<MatchAssignments>((acc, prompt) => {
        acc[prompt.id] = prompt.correctTermId;
        return acc;
      }, {}),
    [prompts],
  );

  const termToPromptId = useMemo(() => {
    return Object.entries(assignments).reduce<Record<string, string>>(
      (acc, [promptId, termId]) => {
        if (termId) acc[termId] = promptId;
        return acc;
      },
      {},
    );
  }, [assignments]);

  useEffect(() => {
    const onResize = () => setLayoutVersion((value) => value + 1);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const observer = new ResizeObserver(() =>
      setLayoutVersion((value) => value + 1),
    );
    observer.observe(board);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    setLayoutVersion((value) => value + 1);
  }, [assignments]);

  const getNodeCenter = (el: HTMLElement | null) => {
    const board = boardRef.current;
    if (!board || !el) return null;
    const boardRect = board.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    return {
      x: elRect.left - boardRect.left + elRect.width / 2,
      y: elRect.top - boardRect.top + elRect.height / 2,
    };
  };

  const connectorSegments = useMemo(() => {
    return prompts
      .map((prompt) => {
        const termId = assignments[prompt.id];
        if (!termId) return null;
        const start = getNodeCenter(promptDotRefs.current[prompt.id]);
        const end = getNodeCenter(termDotRefs.current[termId]);
        if (!start || !end) return null;
        return {
          id: `${prompt.id}-${termId}`,
          path: buildCurvePath(start, end),
        };
      })
      .filter(Boolean) as Array<{ id: string; path: string }>;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignments, layoutVersion, prompts]);

  return (
    <div
      ref={boardRef}
      id={boardId}
      className={styles.board}
      role="group"
      aria-label="Correct matches"
    >
      <svg className={styles.svgOverlay} aria-hidden="true">
        {connectorSegments.map((seg) => (
          <path
            key={seg.id}
            d={seg.path}
            className={[styles.connectorPath, styles.connectorPathCorrect].join(
              " ",
            )}
          />
        ))}
      </svg>
      <div className={styles.matchColumns} style={columnFlexVars}>
        <div className={styles.termsColumn} role="group" aria-label="Terms">
          {terms.map((term) => (
            <div
              key={term.id}
              className={[
                styles.termCard,
                cardAlignment.terms === "start"
                  ? styles.termCardAlignStart
                  : "",
                styles.cardCorrect,
              ]
                .filter(Boolean)
                .join(" ")}
              aria-label={getMatchCardAccessibilityLabel(term, "Term")}
            >
              {renderMatchCardBody(
                term.text,
                term.contentBlocks,
                "term",
                cardAlignment.terms,
              )}
              <span
                ref={(el) => {
                  termDotRefs.current[term.id] = el;
                }}
                className={[
                  styles.connectorDot,
                  styles.connectorDotRight,
                  styles.connectorDotLocked,
                  styles.connectorDotCorrect,
                ].join(" ")}
                aria-hidden={true}
              />
              {termToPromptId[term.id] ? (
                <span
                  className={[
                    styles.feedbackBadge,
                    styles.feedbackBadgeCorrect,
                  ].join(" ")}
                >
                  <FaIcon name="check" size="s" />
                </span>
              ) : null}
            </div>
          ))}
        </div>
        <div
          className={styles.promptsColumn}
          role="group"
          aria-label="Definitions"
        >
          {prompts.map((prompt) => (
            <div
              key={prompt.id}
              className={[
                styles.promptCard,
                cardAlignment.prompts === "center"
                  ? styles.promptCardAlignCenter
                  : "",
                styles.cardCorrect,
              ]
                .filter(Boolean)
                .join(" ")}
              aria-label={getMatchCardAccessibilityLabel(prompt, "Definition")}
            >
              <span
                ref={(el) => {
                  promptDotRefs.current[prompt.id] = el;
                }}
                className={[
                  styles.connectorDot,
                  styles.connectorDotLeft,
                  styles.connectorDotLocked,
                  styles.connectorDotCorrect,
                ].join(" ")}
                aria-hidden={true}
              />
              {renderMatchCardBody(
                prompt.text,
                prompt.contentBlocks,
                "prompt",
                cardAlignment.prompts,
              )}
              <span
                className={[
                  styles.feedbackBadge,
                  styles.feedbackBadgeCorrect,
                ].join(" ")}
              >
                <FaIcon name="check" size="s" />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Component ─────────────────────────────────────────────────── */

interface MatchConnectorWorkspaceProps {
  payload?: MatchLevelPayload;
  levelLinks?: LevelProgressLink[];
  currentLevelPath?: string;
  completedLevelPaths?: string[];
  embedded?: boolean;
  groupSubmitted?: boolean;
  controlledAssignments?: MatchAssignments;
  onControlledAssignmentsChange?: (next: MatchAssignments) => void;
  embeddedInScrollGroup?: boolean;
  embeddedInSteppedGroup?: boolean;
  embeddedStepEyebrow?: string;
  /** When set in an embedded level group, parent controls reveal for all blocks. */
  groupTeacherReveal?: boolean;
  /**
   * When reveal is active on a locked attempt that is not fully correct, keep
   * the student’s matches and show the key in a second matching set below.
   */
  revealKeyAlongsideSelection?: boolean;
  /** CFU / quiz student card: Figma question-container stem pad. */
  studentQuestionChrome?: boolean;
  /** Prompt ids that stayed correct on Try again — stay matched and marked. */
  persistedCorrectPromptIds?: string[];
  afterBody?: ReactNode;
}

const matchDevFields: DevPanelField[] = [
  resourcePanelCompactDevField,
  { key: "level.stem.question", label: "Question", type: "text", group: "Stem" },
  { key: "level.stem.description", label: "Description (markdown)", type: "textarea", group: "Stem", rows: 5 },
  { key: "level.question.termLabel", label: "Term column label", type: "text", group: "Labels" },
  { key: "level.question.promptLabel", label: "Definition column label", type: "text", group: "Labels" },
  { key: "level.metadata.lessonName", label: "Lesson name", type: "text", group: "Metadata" },
];

export function MatchConnectorWorkspace({
  payload = mockMatchLevel,
  levelLinks,
  currentLevelPath,
  completedLevelPaths,
  embedded = false,
  groupSubmitted = false,
  controlledAssignments,
  onControlledAssignmentsChange,
  embeddedInScrollGroup = false,
  embeddedInSteppedGroup = false,
  embeddedStepEyebrow,
  groupTeacherReveal,
  revealKeyAlongsideSelection = false,
  studentQuestionChrome = false,
  persistedCorrectPromptIds: persistedCorrectPromptIdsProp,
  afterBody,
}: MatchConnectorWorkspaceProps) {
  const navigate = useNavigate();

  const overrideResult = usePropsOverride(
    {
      ...(payload as unknown as Record<string, unknown>),
      resourcePanelCompact: false,
    },
  );
  const resolvedPayload = (
    embedded ? payload : overrideResult.props
  ) as unknown as MatchLevelPayload;
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

  const matchBoardId = useId();

  const promptIdsKey = level.question.prompts.map((p) => p.id).join("\0");
  const promptIds = useMemo(
    () => level.question.prompts.map((p) => p.id),
    [promptIdsKey],
  );

  /* ── State ───────────────────────────────────────────────────── */

  const isEmbeddedControlled = Boolean(
    embedded &&
      controlledAssignments !== undefined &&
      onControlledAssignmentsChange,
  );
  const [internalAssignments, setInternalAssignments] = useState<MatchAssignments>(
    buildInitialAssignments(promptIds),
  );
  const assignments = isEmbeddedControlled
    ? controlledAssignments!
    : internalAssignments;
  const setAssignments = useCallback(
    (updater: SetStateAction<MatchAssignments>) => {
      if (isEmbeddedControlled) {
        const next =
          typeof updater === "function"
            ? updater(controlledAssignments!)
            : updater;
        onControlledAssignmentsChange!(next);
      } else {
        setInternalAssignments(updater);
      }
    },
    [
      isEmbeddedControlled,
      controlledAssignments,
      onControlledAssignmentsChange,
    ],
  );
  const [selectedCard, setSelectedCard] = useState<{
    type: "prompt" | "term";
    id: string;
  } | null>(null);
  const [activeDrag, setActiveDrag] = useState<{
    type: "prompt" | "term";
    id: string;
    startX: number;
    startY: number;
  } | null>(null);
  const [dragPoint, setDragPoint] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [internalKeptCorrectIds, setInternalKeptCorrectIds] = useState<
    string[]
  >([]);
  const persistedCorrectPromptIds =
    persistedCorrectPromptIdsProp ?? internalKeptCorrectIds;
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isTeacherAnswerRevealed, setIsTeacherAnswerRevealed] = useState(false);
  const teacherRevealActive =
    embedded && groupTeacherReveal !== undefined
      ? groupTeacherReveal
      : isTeacherAnswerRevealed;
  const [layoutVersion, setLayoutVersion] = useState(0);

  const [dragHoverTarget, setDragHoverTarget] = useState<{
    type: "prompt" | "term";
    id: string;
  } | null>(null);
  const [a11yStatus, setA11yStatus] = useState("");

  const boardRef = useRef<HTMLDivElement | null>(null);
  /** Focus targets for arrow-key navigation (`term:id` / `prompt:id`). */
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});
  const promptDotRefs = useRef<Record<string, HTMLElement | null>>({});
  const termDotRefs = useRef<Record<string, HTMLElement | null>>({});
  const didDragRef = useRef(false);
  const dragHoverTargetRef = useRef<{
    type: "prompt" | "term";
    id: string;
  } | null>(null);
  const activeDragRef = useRef<typeof activeDrag>(null);
  const dragCleanupRef = useRef<(() => void) | null>(null);

  /* ── Reset on payload change ─────────────────────────────────── */

  useEffect(() => {
    if (!isEmbeddedControlled) {
      setInternalAssignments(buildInitialAssignments(promptIds));
    }
    dragCleanupRef.current?.();
    setSelectedCard(null);
    setIsSubmitted(false);
    setIsTeacherAnswerRevealed(false);
  }, [level.id, promptIdsKey, isEmbeddedControlled]);

  useEffect(() => {
    dragCleanupRef.current?.();
    setSelectedCard(null);
  }, [isSubmitted, teacherRevealActive, embedded, groupSubmitted]);

  useEffect(() => {
    return () => {
      dragCleanupRef.current?.();
    };
  }, []);

  /* Escape clears selection when focus is inside the match board (avoids stealing Escape elsewhere). */
  useEffect(() => {
    if (!selectedCard) return;
    const onDocKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const board = boardRef.current;
      const active = document.activeElement;
      if (!board?.contains(active)) return;
      e.preventDefault();
      setSelectedCard(null);
      setA11yStatus("Selection cleared.");
    };
    document.addEventListener("keydown", onDocKey);
    return () => document.removeEventListener("keydown", onDocKey);
  }, [selectedCard]);

  /* ── Layout tracking ─────────────────────────────────────────── */

  useEffect(() => {
    const onResize = () => setLayoutVersion((v) => v + 1);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const observer = new ResizeObserver(() =>
      setLayoutVersion((v) => v + 1),
    );
    observer.observe(board);
    return () => observer.disconnect();
  }, []);

  /* ── Derived state ───────────────────────────────────────────── */

  const continuePath = useMemo(() => {
    if (!levelLinks?.length || !currentLevelPath) return "/levels";
    const idx = levelLinks.findIndex((l) => l.path === currentLevelPath);
    if (idx === -1) return "/levels";
    return levelLinks[idx + 1]?.path ?? "/levels";
  }, [levelLinks, currentLevelPath]);

  /** Terms left / definitions right — flex-grow weights (set as CSS vars on `.matchColumns`). */
  const columnFlexVars = useMemo(() => {
    const c = level.question.columnFlex;
    const terms = c?.terms ?? 1;
    const prompts = c?.prompts ?? 1;
    return {
      "--match-terms-flex": String(terms),
      "--match-prompts-flex": String(prompts),
    } as CSSProperties;
  }, [level.question.columnFlex]);

  const cardAlignment = useMemo(() => {
    const a = level.question.cardAlignment;
    return {
      terms: a?.terms ?? "center",
      prompts: a?.prompts ?? "start",
    } satisfies { terms: MatchCardContentAlign; prompts: MatchCardContentAlign };
  }, [level.question.cardAlignment]);

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

  const isSubmittedForFeedback = embedded
    ? Boolean(groupSubmitted)
    : isSubmitted;
  /**
   * Figma Matching / Answer and explanation revealed: keep the student’s set
   * and add a Correct Answer set underneath when any pair is wrong.
   */
  const showCorrectAnswerBoard =
    teacherRevealActive &&
    isSubmittedForFeedback &&
    !isPerfectMatch &&
    (revealKeyAlongsideSelection || !embedded);
  const replaceWithKey =
    teacherRevealActive && !showCorrectAnswerBoard && !isPerfectMatch;
  const interactionLocked =
    isSubmittedForFeedback || teacherRevealActive;
  const showInlineFeedback =
    isSubmittedForFeedback && !replaceWithKey;

  const displayAssignments = useMemo(() => {
    if (replaceWithKey) {
      return level.question.prompts.reduce<MatchAssignments>((acc, p) => {
        acc[p.id] = p.correctTermId;
        return acc;
      }, {});
    }
    return assignments;
  }, [replaceWithKey, assignments, level.question.prompts]);

  /** Re-measure connector endpoints after assignments change (refs/layout settle in layout phase). */
  useLayoutEffect(() => {
    setLayoutVersion((v) => v + 1);
  }, [displayAssignments]);

  const promptById = useMemo(
    () =>
      level.question.prompts.reduce<
        Record<string, (typeof level.question.prompts)[number]>
      >((acc, prompt) => {
        acc[prompt.id] = prompt;
        return acc;
      }, {}),
    [level.question.prompts],
  );

  const termToPromptId = useMemo(() => {
    return Object.entries(displayAssignments).reduce<Record<string, string>>(
      (acc, [promptId, termId]) => {
        if (termId) acc[termId] = promptId;
        return acc;
      },
      {},
    );
  }, [displayAssignments]);

  const lockedPromptIds = useMemo(
    () => new Set(persistedCorrectPromptIds),
    [persistedCorrectPromptIds],
  );

  const isCardInteractionLocked = useCallback(
    (type: "prompt" | "term", id: string) => {
      if (type === "prompt") return lockedPromptIds.has(id);
      const promptId = termToPromptId[id];
      return Boolean(promptId && lockedPromptIds.has(promptId));
    },
    [lockedPromptIds, termToPromptId],
  );

  const isCardLockedRef = useRef(isCardInteractionLocked);
  isCardLockedRef.current = isCardInteractionLocked;

  /* ── Geometry helpers ────────────────────────────────────────── */

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

  /* ── SVG segments ────────────────────────────────────────────── */

  const connectorSegments = useMemo(() => {
    return level.question.prompts
      .map((prompt) => {
        const termId = displayAssignments[prompt.id];
        if (!termId) return null;
        const start = getNodeCenter(promptDotRefs.current[prompt.id]);
        const end = getNodeCenter(termDotRefs.current[termId]);
        if (!start || !end) return null;
        const isCorrect = termId === prompt.correctTermId;
        const keptCorrect = lockedPromptIds.has(prompt.id) && isCorrect;
        return {
          id: `${prompt.id}-${termId}`,
          path: buildCurvePath(start, end),
          state: replaceWithKey
            ? ("revealed" as const)
            : showInlineFeedback
              ? isCorrect
                ? ("correct" as const)
                : ("incorrect" as const)
              : keptCorrect
                ? ("correct" as const)
                : ("neutral" as const),
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      path: string;
      state: "neutral" | "correct" | "incorrect" | "revealed";
    }>;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    displayAssignments,
    getNodeCenter,
    replaceWithKey,
    layoutVersion,
    level.question.prompts,
    lockedPromptIds,
    showInlineFeedback,
  ]);

  const draftPathD = useMemo(() => {
    if (!activeDrag || !dragPoint) return null;
    return buildCurvePath(
      { x: activeDrag.startX, y: activeDrag.startY },
      dragPoint,
    );
  }, [activeDrag, dragPoint]);

  const showDraftLine =
    draftPathD &&
    activeDrag &&
    dragPoint &&
    Math.hypot(
      dragPoint.x - activeDrag.startX,
      dragPoint.y - activeDrag.startY,
    ) > 5;

  /* ── Handlers ────────────────────────────────────────────────── */

  const assignTermToPrompt = useCallback(
    (promptId: string, termId: string) => {
      if (lockedPromptIds.has(promptId)) return;
      setAssignments((prev) => {
        const next = { ...prev };
        for (const pid of Object.keys(next)) {
          if (next[pid] === termId) {
            if (lockedPromptIds.has(pid)) return prev;
            next[pid] = null;
          }
        }
        next[promptId] = termId;
        return next;
      });
    },
    [setAssignments, lockedPromptIds],
  );

  const assignTermToPromptRef = useRef(assignTermToPrompt);
  assignTermToPromptRef.current = assignTermToPrompt;

  const resolveDropTarget = useCallback(
    (
      drag: NonNullable<typeof activeDrag>,
      clientX: number,
      clientY: number,
    ): { type: "prompt" | "term"; id: string } | null => {
      const hover = dragHoverTargetRef.current;
      if (hover && hover.type !== drag.type) {
        return hover;
      }

      const el = document.elementFromPoint(clientX, clientY);
      const dotTarget = el?.closest<HTMLElement>("[data-connector-dot='true']");
      const cardTarget = el?.closest<HTMLElement>("[data-match-card='true']");
      const targetType = (dotTarget?.dataset.dotType ??
        cardTarget?.dataset.cardType) as "prompt" | "term" | undefined;
      const targetId = dotTarget?.dataset.dotId ?? cardTarget?.dataset.cardId;
      if (targetType && targetId && targetType !== drag.type) {
        if (isCardLockedRef.current(targetType, targetId)) return null;
        return { type: targetType, id: targetId };
      }
      return null;
    },
    [],
  );

  const selectOrConnect = useCallback(
    (type: "prompt" | "term", id: string) => {
      if (interactionLocked || isCardInteractionLocked(type, id)) return;

      if (!selectedCard) {
        setSelectedCard({ type, id });
        const item =
          type === "term"
            ? level.question.terms.find((t) => t.id === id)
            : level.question.prompts.find((p) => p.id === id);
        const label = item
          ? getMatchCardAccessibilityLabel(
              item,
              type === "term" ? "Term" : "Definition",
            )
          : "";
        setA11yStatus(
          `${label} selected. Use arrow keys or Tab to move to a ${type === "term" ? "definition" : "term"}, then press Enter or Space to connect.`,
        );
        return;
      }

      if (selectedCard.type === type) {
        if (selectedCard.id === id) {
          setSelectedCard(null);
          setA11yStatus("Selection cleared.");
        } else {
          setSelectedCard({ type, id });
          const item =
            type === "term"
              ? level.question.terms.find((t) => t.id === id)
              : level.question.prompts.find((p) => p.id === id);
          const label = item
            ? getMatchCardAccessibilityLabel(
                item,
                type === "term" ? "Term" : "Definition",
              )
            : "";
          setA11yStatus(`${label} selected.`);
        }
        return;
      }

      const promptId = type === "prompt" ? id : selectedCard.id;
      const termId = type === "term" ? id : selectedCard.id;
      assignTermToPrompt(promptId, termId);
      const termItem = level.question.terms.find((t) => t.id === termId);
      const promptItem = level.question.prompts.find((p) => p.id === promptId);
      const termSummary = termItem
        ? getMatchCardAccessibilityLabel(termItem, "Term")
        : "";
      const promptSummary = promptItem
        ? getMatchCardAccessibilityLabel(promptItem, "Definition")
        : "";
      setA11yStatus(`Matched ${termSummary} to ${promptSummary}.`);
      setSelectedCard(null);
    },
    [
      interactionLocked,
      isCardInteractionLocked,
      selectedCard,
      assignTermToPrompt,
      level.question,
    ],
  );

  const handleCardClick = useCallback(
    (type: "prompt" | "term", id: string) => {
      if (interactionLocked || isCardInteractionLocked(type, id)) return;
      if (didDragRef.current) {
        didDragRef.current = false;
        return;
      }
      selectOrConnect(type, id);
    },
    [interactionLocked, isCardInteractionLocked, selectOrConnect],
  );

  const handleCardKeyDown = useCallback(
    (
      event: ReactKeyboardEvent<HTMLDivElement>,
      type: "prompt" | "term",
      id: string,
    ) => {
      if (interactionLocked) return;

      const terms = level.question.terms;
      const prompts = level.question.prompts;

      const focusCard = (t: "prompt" | "term", cardId: string) => {
        const el = cardRefs.current[`${t}:${cardId}`];
        el?.focus();
      };

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (!isCardInteractionLocked(type, id)) {
          selectOrConnect(type, id);
        }
        return;
      }

      if (type === "term") {
        const i = terms.findIndex((t) => t.id === id);
        if (i === -1) return;
        if (event.key === "ArrowDown") {
          event.preventDefault();
          if (i < terms.length - 1) focusCard("term", terms[i + 1].id);
          return;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          if (i > 0) focusCard("term", terms[i - 1].id);
          return;
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          const target = prompts[i];
          if (target) focusCard("prompt", target.id);
          return;
        }
        return;
      }

      if (type === "prompt") {
        const i = prompts.findIndex((p) => p.id === id);
        if (i === -1) return;
        if (event.key === "ArrowDown") {
          event.preventDefault();
          if (i < prompts.length - 1) focusCard("prompt", prompts[i + 1].id);
          return;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          if (i > 0) focusCard("prompt", prompts[i - 1].id);
          return;
        }
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          const target = terms[i];
          if (target) focusCard("term", target.id);
          return;
        }
      }
    },
    [interactionLocked, isCardInteractionLocked, selectOrConnect, level.question],
  );

  /* ── Drag lifecycle (synchronous listener attachment) ────────── */

  const beginDrag = useCallback(
    (
      info: {
        type: "prompt" | "term";
        id: string;
        startX: number;
        startY: number;
      },
      pointerId: number,
    ) => {
      dragCleanupRef.current?.();

      activeDragRef.current = info;
      didDragRef.current = false;
      setActiveDrag(info);
      setDragPoint({ x: info.startX, y: info.startY });

      try {
        boardRef.current?.setPointerCapture(pointerId);
      } catch {
        /* pointerId may already be invalid */
      }

      const onMove = (e: PointerEvent) => {
        didDragRef.current = true;
        const board = boardRef.current;
        if (!board) return;
        const rect = board.getBoundingClientRect();
        setDragPoint({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });

        const el = document.elementFromPoint(e.clientX, e.clientY);
        const card = el?.closest<HTMLElement>("[data-match-card='true']");
        const cardType = card?.dataset.cardType as
          | "prompt"
          | "term"
          | undefined;
        const cardId = card?.dataset.cardId;
        const drag = activeDragRef.current;
        const hoverTarget =
          cardType &&
          cardId &&
          drag &&
          cardType !== drag.type &&
          !isCardLockedRef.current(cardType, cardId)
            ? { type: cardType, id: cardId }
            : null;
        if (
          hoverTarget?.id !== dragHoverTargetRef.current?.id ||
          hoverTarget?.type !== dragHoverTargetRef.current?.type
        ) {
          dragHoverTargetRef.current = hoverTarget;
          setDragHoverTarget(hoverTarget);
        }
      };

      const teardown = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onCancel);
        try {
          boardRef.current?.releasePointerCapture(pointerId);
        } catch {
          /* capture may already be released */
        }
        activeDragRef.current = null;
        dragHoverTargetRef.current = null;
        dragCleanupRef.current = null;
        setDragHoverTarget(null);
        setActiveDrag(null);
        setDragPoint(null);
      };

      const onUp = (e: PointerEvent) => {
        const drag = activeDragRef.current;
        if (drag) {
          try {
            boardRef.current?.releasePointerCapture(pointerId);
          } catch {
            /* capture may already be released */
          }

          const dropTarget = resolveDropTarget(drag, e.clientX, e.clientY);
          if (dropTarget) {
            const promptId =
              drag.type === "prompt" ? drag.id : dropTarget.id;
            const termId = drag.type === "term" ? drag.id : dropTarget.id;
            assignTermToPromptRef.current(promptId, termId);
          }
        }
        teardown();
      };

      const onCancel = () => {
        teardown();
      };

      dragCleanupRef.current = teardown;
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onCancel);
    },
    [resolveDropTarget],
  );

  const handleCardPointerDown = useCallback(
    (
      type: "prompt" | "term",
      id: string,
      event: ReactPointerEvent<HTMLDivElement>,
    ) => {
      if (interactionLocked || isCardInteractionLocked(type, id)) return;
      if ((event.target as HTMLElement).closest("[data-connector-dot]"))
        return;
      event.preventDefault();

      const dotEl =
        type === "prompt"
          ? promptDotRefs.current[id]
          : termDotRefs.current[id];
      const origin = getNodeCenter(dotEl);
      if (!origin) return;

      beginDrag(
        { type, id, startX: origin.x, startY: origin.y },
        event.pointerId,
      );
    },
    [interactionLocked, isCardInteractionLocked, getNodeCenter, beginDrag],
  );

  const handleDotPointerDown = useCallback(
    (
      type: "prompt" | "term",
      id: string,
      event: ReactPointerEvent<HTMLElement>,
    ) => {
      if (interactionLocked || isCardInteractionLocked(type, id)) return;
      event.preventDefault();
      event.stopPropagation();
      const origin = getNodeCenter(event.currentTarget);
      if (!origin) return;
      beginDrag(
        { type, id, startX: origin.x, startY: origin.y },
        event.pointerId,
      );
    },
    [interactionLocked, isCardInteractionLocked, getNodeCenter, beginDrag],
  );

  const handleSubmitMatches = () => {
    if (embedded || !allAssigned || teacherRevealActive) return;
    const perfect = level.question.prompts.every(
      (p) => assignments[p.id] === p.correctTermId,
    );
    playFeedbackSound(perfect ? successSoundUrl : errorSoundUrl);
    setIsSubmitted(true);
  };

  const tryAgain = () => {
    const kept = correctMatchPromptIds(level.question.prompts, assignments);
    setInternalKeptCorrectIds((previous) => [
      ...new Set([...previous, ...kept]),
    ]);
    setAssignments(
      keepCorrectMatchAssignments(level.question.prompts, assignments),
    );
    setIsSubmitted(false);
  };

  const clearAll = () => {
    setAssignments((previous) =>
      Object.fromEntries(
        level.question.prompts.map((prompt) => [
          prompt.id,
          lockedPromptIds.has(prompt.id) ? previous[prompt.id] ?? null : null,
        ]),
      ),
    );
    setSelectedCard(null);
    setA11yStatus(
      lockedPromptIds.size > 0
        ? "Unlocked matches cleared."
        : "All matches cleared.",
    );
  };

  /* ── Render ──────────────────────────────────────────────────── */

  const embeddedFlatInParent =
    embedded && (embeddedInScrollGroup || embeddedInSteppedGroup);

  const stemEyebrow =
    embeddedFlatInParent && embeddedStepEyebrow !== undefined
      ? embeddedStepEyebrow
      : embedded && !embeddedFlatInParent
        ? ""
        : "Match";

  const useStepCounterEyebrowStyle =
    studentQuestionChrome ||
    (embeddedInScrollGroup && !embeddedInSteppedGroup);

  const cardContents = (
    <>
          <AssessmentStemSection
            eyebrow={stemEyebrow}
            layout={studentQuestionChrome ? "questionContainer" : "default"}
            eyebrowClassName={
              useStepCounterEyebrowStyle ? stemStyles.stepCounterEyebrow : undefined
            }
            question={level.stem.question}
            description={level.stem.description}
            afterBody={afterBody}
          >
            <div
              className={styles.visuallyHidden}
              aria-live="polite"
              aria-atomic="true"
            >
              {a11yStatus}
            </div>

            <div className={styles.revealStack}>
            <div
              ref={boardRef}
              id={matchBoardId}
              className={[
                styles.board,
                studentQuestionChrome ? "" : styles.boardStandalone,
              ]
                .filter(Boolean)
                .join(" ")}
              role="group"
              aria-label="Match terms to definitions"
            >
              <svg className={styles.svgOverlay} aria-hidden="true">
                {connectorSegments.map((seg) => (
                  <path
                    key={seg.id}
                    d={seg.path}
                    className={[
                      styles.connectorPath,
                      seg.state === "correct"
                        ? styles.connectorPathCorrect
                        : "",
                      seg.state === "incorrect"
                        ? styles.connectorPathIncorrect
                        : "",
                      seg.state === "revealed"
                        ? styles.connectorPathRevealed
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={
                      seg.state === "neutral"
                        ? { stroke: BRAND_STROKE }
                        : undefined
                    }
                  />
                ))}
                {showDraftLine ? (
                  <path d={draftPathD!} className={styles.draftPath} />
                ) : null}
              </svg>

              <div className={styles.matchColumns} style={columnFlexVars}>
                {/* ── Terms (left) ── */}
                <div
                  className={styles.termsColumn}
                  role="group"
                  aria-label="Terms"
                >
                  {level.question.terms.map((term) => {
                    const connectedPromptId = termToPromptId[term.id];
                    const isConnected = Boolean(connectedPromptId);
                    const isSelected =
                      selectedCard?.type === "term" &&
                      selectedCard.id === term.id;
                    const prompt = connectedPromptId
                      ? promptById[connectedPromptId]
                      : null;
                    const isCorrect =
                      Boolean(prompt) && prompt!.correctTermId === term.id;
                    const pairKeptCorrect =
                      Boolean(connectedPromptId) &&
                      lockedPromptIds.has(connectedPromptId!) &&
                      isCorrect;
                    const showPairCorrect =
                      (showInlineFeedback && isConnected && isCorrect) ||
                      pairKeptCorrect;
                    const cardLocked = interactionLocked || pairKeptCorrect;
                    const isDragHover =
                      !cardLocked &&
                      dragHoverTarget?.type === "term" &&
                      dragHoverTarget.id === term.id;
                    const isDraggingThis =
                      !cardLocked &&
                      activeDrag?.type === "term" &&
                      activeDrag.id === term.id;

                    const cardClasses = [
                      styles.termCard,
                      cardAlignment.terms === "start"
                        ? styles.termCardAlignStart
                        : "",
                      isSelected && !cardLocked
                        ? styles.termCardSelected
                        : "",
                      isConnected &&
                      !showInlineFeedback &&
                      !replaceWithKey &&
                      !pairKeptCorrect
                        ? styles.termCardConnected
                        : "",
                      showPairCorrect ? styles.cardCorrect : "",
                      showInlineFeedback && isConnected && !isCorrect
                        ? styles.cardIncorrect
                        : "",
                      replaceWithKey ? styles.cardRevealed : "",
                      isDraggingThis ? styles.cardPress : "",
                      isDragHover ? styles.cardDragHover : "",
                    ]
                      .filter(Boolean)
                      .join(" ");

                    const dotClasses = [
                      styles.connectorDot,
                      styles.connectorDotRight,
                      cardLocked ? styles.connectorDotLocked : "",
                      isConnected &&
                      !showInlineFeedback &&
                      !replaceWithKey &&
                      !pairKeptCorrect
                        ? styles.connectorDotActive
                        : "",
                      isSelected && !cardLocked
                        ? styles.connectorDotSelected
                        : "",
                      isDragHover ? styles.connectorDotDragHover : "",
                      showPairCorrect ? styles.connectorDotCorrect : "",
                      showInlineFeedback && isConnected && !isCorrect
                        ? styles.connectorDotIncorrect
                        : "",
                      replaceWithKey
                        ? styles.connectorDotRevealed
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <div
                        key={term.id}
                        ref={(el) => {
                          cardRefs.current[`term:${term.id}`] = el;
                        }}
                        className={cardClasses}
                        data-match-card="true"
                        data-card-type="term"
                        data-card-id={term.id}
                        role="button"
                        tabIndex={cardLocked ? -1 : 0}
                        aria-pressed={isSelected}
                        aria-disabled={cardLocked}
                        aria-label={getMatchCardAccessibilityLabel(term, "Term")}
                        onClick={() => handleCardClick("term", term.id)}
                        onKeyDown={(e) => handleCardKeyDown(e, "term", term.id)}
                        onPointerDown={(e) =>
                          handleCardPointerDown("term", term.id, e)
                        }
                      >
                        {renderMatchCardBody(
                          term.text,
                          term.contentBlocks,
                          "term",
                          cardAlignment.terms,
                        )}

                        <span
                          ref={(el) => {
                            termDotRefs.current[term.id] = el;
                          }}
                          className={dotClasses}
                          data-connector-dot="true"
                          data-dot-type="term"
                          data-dot-id={term.id}
                          aria-hidden={true}
                          onPointerDown={(e) =>
                            cardLocked
                              ? undefined
                              : handleDotPointerDown("term", term.id, e)
                          }
                          onClick={(e) => e.stopPropagation()}
                        />

                        {(showInlineFeedback && isConnected) || pairKeptCorrect ? (
                          <span
                            className={[
                              styles.feedbackBadge,
                              isCorrect || pairKeptCorrect
                                ? styles.feedbackBadgeCorrect
                                : styles.feedbackBadgeIncorrect,
                            ].join(" ")}
                          >
                            <FaIcon
                              name={isCorrect ? "check" : "xmark"}
                              size="s"
                            />
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                {/* ── Definitions (prompts, right) ── */}
                <div
                  className={styles.promptsColumn}
                  role="group"
                  aria-label="Definitions"
                >
                  {level.question.prompts.map((prompt) => {
                    const termId = displayAssignments[prompt.id];
                    const isConnected = Boolean(termId);
                    const isSelected =
                      selectedCard?.type === "prompt" &&
                      selectedCard.id === prompt.id;
                    const isCorrect =
                      isConnected && termId === prompt.correctTermId;
                    const pairKeptCorrect =
                      lockedPromptIds.has(prompt.id) && isCorrect;
                    const showPairCorrect =
                      (showInlineFeedback && isConnected && isCorrect) ||
                      pairKeptCorrect;
                    const cardLocked = interactionLocked || pairKeptCorrect;
                    const isDragHover =
                      !cardLocked &&
                      dragHoverTarget?.type === "prompt" &&
                      dragHoverTarget.id === prompt.id;
                    const isDraggingThis =
                      !cardLocked &&
                      activeDrag?.type === "prompt" &&
                      activeDrag.id === prompt.id;

                    const cardClasses = [
                      styles.promptCard,
                      cardAlignment.prompts === "center"
                        ? styles.promptCardAlignCenter
                        : "",
                      isSelected && !cardLocked
                        ? styles.promptCardSelected
                        : "",
                      isConnected &&
                      !showInlineFeedback &&
                      !replaceWithKey &&
                      !pairKeptCorrect
                        ? styles.promptCardConnected
                        : "",
                      showPairCorrect ? styles.cardCorrect : "",
                      showInlineFeedback && isConnected && !isCorrect
                        ? styles.cardIncorrect
                        : "",
                      replaceWithKey ? styles.cardRevealed : "",
                      isDraggingThis ? styles.cardPress : "",
                      isDragHover ? styles.cardDragHover : "",
                    ]
                      .filter(Boolean)
                      .join(" ");

                    const dotClasses = [
                      styles.connectorDot,
                      styles.connectorDotLeft,
                      cardLocked ? styles.connectorDotLocked : "",
                      isConnected &&
                      !showInlineFeedback &&
                      !replaceWithKey &&
                      !pairKeptCorrect
                        ? styles.connectorDotActive
                        : "",
                      isSelected && !cardLocked
                        ? styles.connectorDotSelected
                        : "",
                      isDragHover ? styles.connectorDotDragHover : "",
                      showPairCorrect ? styles.connectorDotCorrect : "",
                      showInlineFeedback && isConnected && !isCorrect
                        ? styles.connectorDotIncorrect
                        : "",
                      replaceWithKey
                        ? styles.connectorDotRevealed
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <div
                        key={prompt.id}
                        ref={(el) => {
                          cardRefs.current[`prompt:${prompt.id}`] = el;
                        }}
                        className={cardClasses}
                        data-match-card="true"
                        data-card-type="prompt"
                        data-card-id={prompt.id}
                        role="button"
                        tabIndex={cardLocked ? -1 : 0}
                        aria-pressed={isSelected}
                        aria-disabled={cardLocked}
                        aria-label={getMatchCardAccessibilityLabel(
                          prompt,
                          "Definition",
                        )}
                        onClick={() => handleCardClick("prompt", prompt.id)}
                        onKeyDown={(e) =>
                          handleCardKeyDown(e, "prompt", prompt.id)
                        }
                        onPointerDown={(e) =>
                          handleCardPointerDown("prompt", prompt.id, e)
                        }
                      >
                        <span
                          ref={(el) => {
                            promptDotRefs.current[prompt.id] = el;
                          }}
                          className={dotClasses}
                          data-connector-dot="true"
                          data-dot-type="prompt"
                          data-dot-id={prompt.id}
                          aria-hidden={true}
                          onPointerDown={(e) =>
                            cardLocked
                              ? undefined
                              : handleDotPointerDown("prompt", prompt.id, e)
                          }
                          onClick={(e) => e.stopPropagation()}
                        />

                        {renderMatchCardBody(
                          prompt.text,
                          prompt.contentBlocks,
                          "prompt",
                          cardAlignment.prompts,
                        )}

                        {(showInlineFeedback && isConnected) || pairKeptCorrect ? (
                          <span
                            className={[
                              styles.feedbackBadge,
                              isCorrect || pairKeptCorrect
                                ? styles.feedbackBadgeCorrect
                                : styles.feedbackBadgeIncorrect,
                            ].join(" ")}
                          >
                            <FaIcon
                              name={isCorrect ? "check" : "xmark"}
                              size="s"
                            />
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            {showCorrectAnswerBoard ? (
              <>
                <p className={styles.correctAnswerLabel}>Correct Answer</p>
                <MatchConnectorKeyBoard
                  terms={level.question.terms}
                  prompts={level.question.prompts}
                  columnFlexVars={columnFlexVars}
                  cardAlignment={cardAlignment}
                />
              </>
            ) : null}
            </div>
          </AssessmentStemSection>

          {!embeddedFlatInParent ? (
            <AssessmentBottomRow
              left={
                embedded ? undefined : (
                  <>
                    <Button
                      variant="outlined" color="secondary"
                      startIconName={isTeacherAnswerRevealed ? "eye-slash" : "eye"}
                      size="medium"
                      onClick={() => {
                        setIsTeacherAnswerRevealed((cur) => !cur);
                      }}
                    >
                      {isTeacherAnswerRevealed ? "Hide answer" : "Reveal answer"}
                    </Button>
                    {!isSubmittedForFeedback && hasAnyAssignment ? (
                      <Button
                        variant="outlined" color="secondary"
                        size="medium"
                        onClick={clearAll}
                      >
                        Clear all
                      </Button>
                    ) : null}
                  </>
                )
              }
              right={
                embedded ? (
                  <>
                    {showInlineFeedback && isPerfectMatch && (
                      <AssessmentSuccessFeedback />
                    )}
                    {showInlineFeedback && !isPerfectMatch && (
                      <p className={styles.partialFeedback}>
                        {totalCorrect} of {level.question.prompts.length}{" "}
                        matches are correct.
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    {showInlineFeedback && isPerfectMatch && (
                      <AssessmentSuccessFeedback />
                    )}
                    {showInlineFeedback && !isPerfectMatch && (
                      <p className={styles.partialFeedback}>
                        {totalCorrect} of {level.question.prompts.length}{" "}
                        matches are correct.
                      </p>
                    )}
                    {isSubmitted && isPerfectMatch && (
                      <Button
                        variant="contained" color="primary"
                        size="medium"
                        onClick={() => navigate(continuePath)}
                      >
                        Continue
                      </Button>
                    )}
                    {isSubmitted && !isPerfectMatch && (
                      <Button
                        variant="contained" color="primary"
                        size="medium"
                        onClick={tryAgain}
                      >
                        Try again
                      </Button>
                    )}
                    {!isSubmitted && (
                      <Button
                        variant="contained" color="primary"
                        size="medium"
                        onClick={handleSubmitMatches}
                        disabled={!allAssigned || teacherRevealActive}
                      >
                        Submit matches
                      </Button>
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

  if (embedded) {
    return mainBody;
  }

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
        showBackpackTab: false,
        showContinueButton: false,
        collapsible: true,
        compact: resourcePanelCompact,
        showInstructionsDrawer: false,
        devPanelFields: matchDevFields,
        devPanelOverrideResult: overrideResult,
      }}
      onResize={(delta) => {
        setSidebarWidth((prev) => Math.max(300, Math.min(600, prev + delta)));
      }}
    >
      {mainBody}
    </Lab2Shell>
  );
}
