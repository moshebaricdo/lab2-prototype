import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type SetStateAction,
} from "react";
import { useNavigate } from "react-router-dom";
import { AppButton } from "../../../ui/AppButton";
import { FaIcon } from "../../../icons/FaIcon";
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
import type { DevPanelField } from "../../../dev";
import { usePropsOverride } from "../../../../hooks/usePropsOverride";
import {
  AssessmentBottomRow,
  AssessmentStemSection,
  AssessmentSuccessFeedback,
} from "../../shared";
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

const TEAL_STROKE = "var(--ds-borders-brand-teal-primary)";

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
}

const matchDevFields: DevPanelField[] = [
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
}: MatchConnectorWorkspaceProps) {
  const navigate = useNavigate();

  const overrideResult = usePropsOverride(
    payload as unknown as Record<string, unknown>,
  );
  const resolvedPayload = (
    embedded ? payload : overrideResult.props
  ) as unknown as MatchLevelPayload;
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

  const instructionsId = useId();
  const matchBoardId = useId();

  const promptIds = useMemo(
    () => level.question.prompts.map((p) => p.id),
    [level.question.prompts],
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
  const dragHoverIdRef = useRef<string | null>(null);
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
  }, [level.id, promptIds, isEmbeddedControlled]);

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
    const terms = c?.terms ?? 0.8;
    const prompts = c?.prompts ?? 1.2;
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

  const displayAssignments = useMemo(() => {
    if (teacherRevealActive) {
      return level.question.prompts.reduce<MatchAssignments>((acc, p) => {
        acc[p.id] = p.correctTermId;
        return acc;
      }, {});
    }
    return assignments;
  }, [teacherRevealActive, assignments, level.question.prompts]);

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
  const interactionLocked =
    isSubmittedForFeedback || teacherRevealActive;
  const showInlineFeedback =
    isSubmittedForFeedback && !teacherRevealActive;

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
        return {
          id: `${prompt.id}-${termId}`,
          path: buildCurvePath(start, end),
          state: teacherRevealActive
            ? ("revealed" as const)
            : showInlineFeedback
              ? isCorrect
                ? ("correct" as const)
                : ("incorrect" as const)
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
    teacherRevealActive,
    layoutVersion,
    level.question.prompts,
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
      setAssignments((prev) => {
        const next = { ...prev };
        for (const pid of Object.keys(next)) {
          if (next[pid] === termId) next[pid] = null;
        }
        next[promptId] = termId;
        return next;
      });
    },
    [setAssignments],
  );

  const assignTermToPromptRef = useRef(assignTermToPrompt);
  assignTermToPromptRef.current = assignTermToPrompt;

  const selectOrConnect = useCallback(
    (type: "prompt" | "term", id: string) => {
      if (interactionLocked) return;

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
    [interactionLocked, selectedCard, assignTermToPrompt, level.question],
  );

  const handleCardClick = useCallback(
    (type: "prompt" | "term", id: string) => {
      if (interactionLocked) return;
      if (didDragRef.current) {
        didDragRef.current = false;
        return;
      }
      selectOrConnect(type, id);
    },
    [interactionLocked, selectOrConnect],
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
        selectOrConnect(type, id);
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
    [interactionLocked, selectOrConnect, level.question],
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
        const validTarget =
          cardType && cardId && drag && cardType !== drag.type ? cardId : null;
        if (validTarget !== dragHoverIdRef.current) {
          dragHoverIdRef.current = validTarget;
          setDragHoverTarget(
            validTarget ? { type: cardType!, id: cardId! } : null,
          );
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
        dragHoverIdRef.current = null;
        dragCleanupRef.current = null;
        setDragHoverTarget(null);
        setActiveDrag(null);
        setDragPoint(null);
      };

      const onUp = (e: PointerEvent) => {
        const drag = activeDragRef.current;
        if (drag) {
          const el = document.elementFromPoint(e.clientX, e.clientY);
          const dotTarget = el?.closest<HTMLElement>(
            "[data-connector-dot='true']",
          );
          const cardTarget = el?.closest<HTMLElement>(
            "[data-match-card='true']",
          );
          const target = dotTarget || cardTarget;

          if (target) {
            const targetType = (dotTarget?.dataset.dotType ??
              cardTarget?.dataset.cardType) as "prompt" | "term" | undefined;
            const targetId =
              dotTarget?.dataset.dotId ?? cardTarget?.dataset.cardId;
            if (targetType && targetId && targetType !== drag.type) {
              const promptId =
                drag.type === "prompt" ? drag.id : targetId;
              const termId =
                drag.type === "term" ? drag.id : targetId;
              assignTermToPromptRef.current(promptId, termId);
            }
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
    [],
  );

  const handleCardPointerDown = useCallback(
    (
      type: "prompt" | "term",
      id: string,
      event: ReactPointerEvent<HTMLDivElement>,
    ) => {
      if (interactionLocked) return;
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
    [interactionLocked, getNodeCenter, beginDrag],
  );

  const handleDotPointerDown = useCallback(
    (
      type: "prompt" | "term",
      id: string,
      event: ReactPointerEvent<HTMLElement>,
    ) => {
      if (interactionLocked) return;
      event.preventDefault();
      event.stopPropagation();
      const origin = getNodeCenter(event.currentTarget);
      if (!origin) return;
      beginDrag(
        { type, id, startX: origin.x, startY: origin.y },
        event.pointerId,
      );
    },
    [interactionLocked, getNodeCenter, beginDrag],
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
    setAssignments(buildInitialAssignments(promptIds));
    setIsSubmitted(false);
  };

  const clearAll = () => {
    setAssignments(buildInitialAssignments(promptIds));
    setSelectedCard(null);
    setA11yStatus("All matches cleared.");
  };

  /* ── Render ──────────────────────────────────────────────────── */

  const embeddedFlatInParent =
    embedded && (embeddedInScrollGroup || embeddedInSteppedGroup);

  const stemEyebrow =
    embeddedFlatInParent && embeddedStepEyebrow
      ? embeddedStepEyebrow
      : embedded && !embeddedFlatInParent
        ? ""
        : "Match";

  const useStepCounterEyebrowStyle =
    embeddedInScrollGroup && !embeddedInSteppedGroup;

  const cardContents = (
    <>
          <AssessmentStemSection
            eyebrow={stemEyebrow}
            eyebrowClassName={
              useStepCounterEyebrowStyle ? styles.stepCounterEyebrow : undefined
            }
            question={level.stem.question}
            description={level.stem.description}
          >
            <div className={styles.taskToolbar}>
              <p className={styles.instruction} id={instructionsId}>
                Match each item by clicking, dragging, or using the keyboard.
              </p>
            </div>

            <div
              className={styles.visuallyHidden}
              aria-live="polite"
              aria-atomic="true"
            >
              {a11yStatus}
            </div>

            <div
              ref={boardRef}
              id={matchBoardId}
              className={styles.board}
              role="group"
              aria-label="Match terms to definitions"
              aria-describedby={instructionsId}
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
                        ? { stroke: TEAL_STROKE }
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

                    const cardClasses = [
                      styles.termCard,
                      cardAlignment.terms === "start"
                        ? styles.termCardAlignStart
                        : "",
                      isSelected && !interactionLocked
                        ? styles.termCardSelected
                        : "",
                      isConnected &&
                      !showInlineFeedback &&
                      !teacherRevealActive
                        ? styles.termCardConnected
                        : "",
                      showInlineFeedback && isConnected && isCorrect
                        ? styles.cardCorrect
                        : "",
                      showInlineFeedback && isConnected && !isCorrect
                        ? styles.cardIncorrect
                        : "",
                      teacherRevealActive ? styles.cardRevealed : "",
                    ]
                      .filter(Boolean)
                      .join(" ");

                    const isDragHover =
                      dragHoverTarget?.type === "term" &&
                      dragHoverTarget.id === term.id;

                    const dotClasses = [
                      styles.connectorDot,
                      styles.connectorDotRight,
                      interactionLocked ? styles.connectorDotLocked : "",
                      isConnected &&
                      !showInlineFeedback &&
                      !teacherRevealActive
                        ? styles.connectorDotActive
                        : "",
                      isSelected && !interactionLocked
                        ? styles.connectorDotSelected
                        : "",
                      isDragHover ? styles.connectorDotDragHover : "",
                      showInlineFeedback && isConnected && isCorrect
                        ? styles.connectorDotCorrect
                        : "",
                      showInlineFeedback && isConnected && !isCorrect
                        ? styles.connectorDotIncorrect
                        : "",
                      teacherRevealActive
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
                        tabIndex={interactionLocked ? -1 : 0}
                        aria-pressed={isSelected}
                        aria-disabled={interactionLocked}
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
                            interactionLocked
                              ? undefined
                              : handleDotPointerDown("term", term.id, e)
                          }
                          onClick={(e) => e.stopPropagation()}
                        />

                        {showInlineFeedback && isConnected ? (
                          <span
                            className={[
                              styles.feedbackBadge,
                              isCorrect
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

                    const cardClasses = [
                      styles.promptCard,
                      cardAlignment.prompts === "center"
                        ? styles.promptCardAlignCenter
                        : "",
                      isSelected && !interactionLocked
                        ? styles.promptCardSelected
                        : "",
                      isConnected &&
                      !showInlineFeedback &&
                      !teacherRevealActive
                        ? styles.promptCardConnected
                        : "",
                      showInlineFeedback && isConnected && isCorrect
                        ? styles.cardCorrect
                        : "",
                      showInlineFeedback && isConnected && !isCorrect
                        ? styles.cardIncorrect
                        : "",
                      teacherRevealActive ? styles.cardRevealed : "",
                    ]
                      .filter(Boolean)
                      .join(" ");

                    const isDragHover =
                      dragHoverTarget?.type === "prompt" &&
                      dragHoverTarget.id === prompt.id;

                    const dotClasses = [
                      styles.connectorDot,
                      styles.connectorDotLeft,
                      interactionLocked ? styles.connectorDotLocked : "",
                      isConnected &&
                      !showInlineFeedback &&
                      !teacherRevealActive
                        ? styles.connectorDotActive
                        : "",
                      isSelected && !interactionLocked
                        ? styles.connectorDotSelected
                        : "",
                      isDragHover ? styles.connectorDotDragHover : "",
                      showInlineFeedback && isConnected && isCorrect
                        ? styles.connectorDotCorrect
                        : "",
                      showInlineFeedback && isConnected && !isCorrect
                        ? styles.connectorDotIncorrect
                        : "",
                      teacherRevealActive
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
                        tabIndex={interactionLocked ? -1 : 0}
                        aria-pressed={isSelected}
                        aria-disabled={interactionLocked}
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
                            interactionLocked
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

                        {showInlineFeedback && isConnected ? (
                          <span
                            className={[
                              styles.feedbackBadge,
                              isCorrect
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
          </AssessmentStemSection>

          {!embeddedFlatInParent ? (
            <AssessmentBottomRow
              left={
                embedded ? undefined : (
                  <>
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
                    {!isSubmittedForFeedback && hasAnyAssignment ? (
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
                        disabled={!allAssigned || teacherRevealActive}
                      >
                        Submit matches
                      </AppButton>
                    )}
                  </>
                )
              }
            />
          ) : null}
    </>
  );

  const mainBody = (
    <main
      className={[
        embedded ? styles.workspaceEmbedded : styles.workspace,
        embeddedFlatInParent ? styles.workspaceEmbeddedScrollGroup : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {embeddedFlatInParent ? (
        cardContents
      ) : (
        <div className={styles.card}>{cardContents}</div>
      )}
    </main>
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
        showContinueButton: false,
        collapsible: true,
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
