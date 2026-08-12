import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@moshebaricdo/cads-react";
import { FaIcon } from "../../../ui/icons/FaIcon";
import { Lab2Shell } from "../../../lab2/Lab2Shell";
import {
  buildInitialParsonsSolution,
  getDragDropItemLabel,
  getParsonsCorrectIndents,
  isParsonsSolutionComplete,
  isParsonsSolutionCorrect,
  mockDragDropParsonsLevel,
  parsonsNestingEnabled,
  type DragDropCategorizationQuestion,
  type DragDropItem,
  type DragDropLevelPayload,
  type DragDropParsonsQuestion,
  type ParsonsSolutionLine,
  type ParsonsSolutionState,
} from "../../../../data/assessment";
import type { MultiChoiceAnswerContentBlock } from "../../../../data/assessment/multi";
import type { CodePanelConfig } from "../../../../data/assessment/codePanel";
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
  AssessmentCodeRefLayout,
  AssessmentLevelShell,
  AssessmentStemSection,
  AssessmentSuccessFeedback,
  assessmentLevelShellVariant,
} from "../../shared";
import stemStyles from "../../shared/AssessmentStemSection.module.scss";
import styles from "./DragDropWorkspace.module.scss";

const PARSONS_BANK_ID = "parsons-bank";
const CAT_BANK_ID = "categorization-bank";
const BANK_SECTION_LABEL = "Option bank";
const PARSONS_INDENT_PX = 24;

function blockDragId(blockId: string) {
  return `block-${blockId}`;
}

function itemDragId(itemId: string) {
  return `item-${itemId}`;
}

function parsonsSlotId(index: number) {
  return `slot-${index}`;
}

function parseParsonsSlotIndex(id: string | null) {
  if (!id?.startsWith("slot-")) return null;
  const index = Number(id.slice("slot-".length));
  return Number.isFinite(index) && index >= 0 ? index : null;
}

function parsonsLineIndentPx(depth: number) {
  return depth * PARSONS_INDENT_PX;
}

function maxParsonsDepthAtIndex(
  solution: ParsonsSolutionState,
  slotIndex: number,
): number {
  if (slotIndex <= 0) return 0;
  return (solution[slotIndex - 1]?.depth ?? 0) + 1;
}

/**
 * Depth reflects where the dragged card *visually sits*: its current left edge
 * relative to the slot's left edge, snapped to indent steps. Aligning the card
 * to the slot's left = top level; nudging it right one indent-width = one level
 * deeper. This lets a single drag both position and nest, and the projected
 * depth can be previewed live before drop.
 */
function computeParsonsDepthFromRects(
  slotIndex: number,
  activeLeft: number | undefined,
  slotLeft: number | undefined,
  solution: ParsonsSolutionState,
): number {
  if (slotIndex <= 0) return 0;
  const maxDepth = maxParsonsDepthAtIndex(solution, slotIndex);
  if (activeLeft == null || slotLeft == null) return 0;
  const steps = Math.round((activeLeft - slotLeft) / PARSONS_INDENT_PX);
  return Math.max(0, Math.min(steps, maxDepth));
}

function bucketDropId(bucketId: string) {
  return `bucket-${bucketId}`;
}

function parseBlockId(id: string | null) {
  if (!id?.startsWith("block-")) return null;
  return id.slice("block-".length);
}

function parseItemId(id: string | null) {
  if (!id?.startsWith("item-")) return null;
  return id.slice("item-".length);
}

function parseBucketId(id: string | null) {
  if (!id?.startsWith("bucket-")) return null;
  return id.slice("bucket-".length);
}

function findParsonsSourceIndex(
  solution: ParsonsSolutionState,
  blockId: string,
): number {
  return solution.findIndex((line) => line.blockId === blockId);
}

function shuffleIds(ids: string[]): string[] {
  const next = [...ids];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function playFeedbackSound(src: string) {
  const audio = new Audio(src);
  void audio.play().catch(() => {});
}

function renderContentBlock(
  block: MultiChoiceAnswerContentBlock,
  key: string,
) {
  if (block.type === "text") {
    return (
      <p key={key} className={styles.blockText}>
        {block.text}
      </p>
    );
  }
  if (block.type === "code") {
    return (
      <pre key={key} className={styles.codeBlock}>
        <code>{block.code}</code>
      </pre>
    );
  }
  return (
    <figure key={key} className={styles.imageBlock}>
      <img src={block.src} alt={block.alt} loading="lazy" />
      {block.caption ? (
        <figcaption className={styles.imageCaption}>{block.caption}</figcaption>
      ) : null}
    </figure>
  );
}

function renderItemBody(item: DragDropItem) {
  if (item.contentBlocks?.length) {
    return item.contentBlocks.map((block, index) =>
      renderContentBlock(block, `${item.id}-${index}`),
    );
  }
  return <span className={styles.blockText}>{item.text ?? ""}</span>;
}

function BlockCardContent({ item }: { item: DragDropItem }) {
  return (
    <>
      <span className={styles.blockHandle} aria-hidden="true">
        <FaIcon name="grip-vertical" size="xs" />
      </span>
      <div className={styles.blockCardBody}>{renderItemBody(item)}</div>
    </>
  );
}

function DraggableBlockCard({
  dragId,
  item,
  disabled,
  tone = "default",
  placement = "bank",
  selected = false,
  focusable = true,
  onSelect,
  onRemove,
  kbCol,
  kbRow,
}: {
  dragId: string;
  item: DragDropItem;
  disabled: boolean;
  tone?: "default" | "correct" | "incorrect" | "revealed";
  placement?: "bank" | "slot" | "bucket";
  selected?: boolean;
  focusable?: boolean;
  onSelect?: () => void;
  onRemove?: () => void;
  kbCol?: string;
  kbRow?: number;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: dragId, disabled });

  const style: CSSProperties | undefined =
    isDragging && transform
      ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
      : undefined;

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={[
        styles.blockCard,
        placement === "slot" ? styles.blockCardInSlot : "",
        placement === "bucket" ? styles.blockCardInBucket : "",
        selected ? styles.blockCardSelected : "",
        tone === "correct" ? styles.blockCardCorrect : "",
        tone === "incorrect" ? styles.blockCardIncorrect : "",
        tone === "revealed" ? styles.blockCardRevealed : "",
        isDragging ? styles.blockCardDragging : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
      disabled={disabled}
      aria-label={getDragDropItemLabel(item)}
      aria-pressed={selected || undefined}
      onClick={(event) => {
        if (disabled) return;
        if (placement === "slot") event.stopPropagation();
        onSelect?.();
      }}
      onKeyDown={(event) => {
        if (disabled) return;
        if ((event.key === "Backspace" || event.key === "Delete") && onRemove) {
          event.preventDefault();
          onRemove();
        }
      }}
      {...attributes}
      {...listeners}
      tabIndex={disabled || !focusable ? -1 : 0}
      data-kb-col={kbCol}
      data-kb-row={kbRow}
    >
      <BlockCardContent item={item} />
    </button>
  );
}

function DroppableZone({
  id,
  disabled,
  className,
  overClassName,
  children,
  focusable = false,
  ariaLabel,
  onActivate,
  onRemove,
  kbCol,
  kbRow,
  style,
}: {
  id: string;
  disabled: boolean;
  className: string;
  overClassName?: string;
  children: ReactNode;
  focusable?: boolean;
  ariaLabel?: string;
  onActivate?: () => void;
  onRemove?: () => void;
  kbCol?: string;
  kbRow?: number;
  style?: CSSProperties;
}) {
  const { isOver, setNodeRef } = useDroppable({ id, disabled });
  const interactive = focusable && !disabled;
  return (
    <div
      ref={setNodeRef}
      className={[className, isOver && overClassName ? overClassName : ""]
        .filter(Boolean)
        .join(" ")}
      style={style}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? ariaLabel : undefined}
      data-kb-col={interactive ? kbCol : undefined}
      data-kb-row={interactive ? kbRow : undefined}
      onClick={interactive ? onActivate : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onActivate?.();
              } else if (
                (event.key === "Backspace" || event.key === "Delete") &&
                onRemove
              ) {
                event.preventDefault();
                onRemove();
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}

/** Bank drop target — shows a single-card dashed slot only while a non-bank item is over the bank. */
function BankDroppableZone({
  id,
  disabled,
  className,
  wrapLayout = false,
  isEmpty,
  showReturnSlot,
  returnSlotItem,
  children,
}: {
  id: string;
  disabled: boolean;
  className: string;
  wrapLayout?: boolean;
  isEmpty: boolean;
  /** When false (e.g. dragging out of the bank), suppress the return slot. */
  showReturnSlot: boolean;
  /** When set (categorization), size the slot to match the card being returned. */
  returnSlotItem?: DragDropItem | null;
  children: ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id, disabled });
  const showSlot = isOver && showReturnSlot;
  const mirrorSlot = Boolean(showSlot && wrapLayout && returnSlotItem);

  return (
    <div
      ref={setNodeRef}
      className={[
        className,
        isEmpty && !showSlot ? styles.bankListEmpty : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
      {showSlot ? (
        mirrorSlot && returnSlotItem ? (
          <div
            className={[
              styles.bankReturnSlotMirror,
              styles.blockCard,
              styles.blockCardInBucket,
            ]
              .filter(Boolean)
              .join(" ")}
            aria-hidden="true"
          >
            <BlockCardContent item={returnSlotItem} />
          </div>
        ) : (
          <div
            className={[
              styles.bankReturnSlot,
              wrapLayout ? styles.bankReturnSlotWrap : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-hidden="true"
          />
        )
      ) : isEmpty ? (
        <div className={styles.bankEmptyState} aria-hidden="true" />
      ) : null}
    </div>
  );
}

export type { ParsonsSolutionLine, ParsonsSolutionState } from "../../../../data/assessment";
export type CategorizationAssignments = Record<string, string | null>;

interface DragDropWorkspaceProps {
  payload?: DragDropLevelPayload;
  codePanel?: CodePanelConfig;
  levelLinks?: LevelProgressLink[];
  currentLevelPath?: string;
  completedLevelPaths?: string[];
  embedded?: boolean;
  groupSubmitted?: boolean;
  controlledParsonsSolution?: ParsonsSolutionState;
  onControlledParsonsSolutionChange?: (next: ParsonsSolutionState) => void;
  controlledCategorizationAssignments?: CategorizationAssignments;
  onControlledCategorizationAssignmentsChange?: (
    next: CategorizationAssignments,
  ) => void;
  embeddedInScrollGroup?: boolean;
  embeddedInSteppedGroup?: boolean;
  embeddedStepEyebrow?: string;
  groupTeacherReveal?: boolean;
}

const dragDropDevFields: DevPanelField[] = [
  resourcePanelCompactDevField,
  { key: "level.stem.question", label: "Question", type: "text", group: "Stem" },
  {
    key: "level.stem.description",
    label: "Description (markdown)",
    type: "textarea",
    group: "Stem",
    rows: 5,
  },
  {
    key: "level.metadata.lessonName",
    label: "Lesson name",
    type: "text",
    group: "Metadata",
  },
];

function buildInitialParsonsBank(
  question: DragDropParsonsQuestion,
): string[] {
  return shuffleIds(question.blocks.map((block) => block.id));
}

function buildInitialCategorizationAssignments(
  question: DragDropCategorizationQuestion,
): CategorizationAssignments {
  return question.items.reduce<CategorizationAssignments>((acc, item) => {
    acc[item.id] = null;
    return acc;
  }, {});
}

function isCategorizationComplete(
  question: DragDropCategorizationQuestion,
  assignments: CategorizationAssignments,
): boolean {
  return question.items.every((item) => Boolean(assignments[item.id]));
}

function isCategorizationCorrect(
  question: DragDropCategorizationQuestion,
  assignments: CategorizationAssignments,
): boolean {
  return question.items.every((item) => {
    const bucketId = assignments[item.id];
    return bucketId != null && item.correctBucketIds.includes(bucketId);
  });
}

export function DragDropWorkspace({
  payload = mockDragDropParsonsLevel,
  codePanel,
  levelLinks,
  currentLevelPath,
  completedLevelPaths,
  embedded = false,
  groupSubmitted = false,
  controlledParsonsSolution,
  onControlledParsonsSolutionChange,
  controlledCategorizationAssignments,
  onControlledCategorizationAssignmentsChange,
  embeddedInScrollGroup = false,
  embeddedInSteppedGroup = false,
  embeddedStepEyebrow,
  groupTeacherReveal,
}: DragDropWorkspaceProps) {
  const navigate = useNavigate();
  const overrideResult = usePropsOverride(
    {
      ...(payload as unknown as Record<string, unknown>),
      resourcePanelCompact: false,
    },
  );
  const resolvedPayload = (
    embedded ? payload : overrideResult.props
  ) as unknown as DragDropLevelPayload;
  const { level } = resolvedPayload;
  const question = level.question;
  const isParsons = question.mode === "parsons";
  const parsonsQuestion = isParsons ? question : null;
  const categorizationQuestion = !isParsons ? question : null;

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

  const resourcePanelCompact = Boolean(
    (overrideResult.props as { resourcePanelCompact?: unknown })
      .resourcePanelCompact,
  );

  const isParsonsControlled = Boolean(
    embedded &&
      parsonsQuestion &&
      controlledParsonsSolution !== undefined &&
      onControlledParsonsSolutionChange,
  );
  const isCatControlled = Boolean(
    embedded &&
      categorizationQuestion &&
      controlledCategorizationAssignments !== undefined &&
      onControlledCategorizationAssignmentsChange,
  );

  const [internalParsonsSolution, setInternalParsonsSolution] =
    useState<ParsonsSolutionState>(() =>
      parsonsQuestion
        ? buildInitialParsonsSolution(parsonsQuestion)
        : [],
    );
  const [internalParsonsBank, setInternalParsonsBank] = useState<string[]>(() =>
    parsonsQuestion ? buildInitialParsonsBank(parsonsQuestion) : [],
  );
  const [internalCatAssignments, setInternalCatAssignments] =
    useState<CategorizationAssignments>(() =>
      categorizationQuestion
        ? buildInitialCategorizationAssignments(categorizationQuestion)
        : {},
    );

  const parsonsSolution = isParsonsControlled
    ? controlledParsonsSolution!
    : internalParsonsSolution;
  const setParsonsSolution = (updater: SetStateAction<ParsonsSolutionState>) => {
    if (isParsonsControlled) {
      const next =
        typeof updater === "function"
          ? updater(controlledParsonsSolution!)
          : updater;
      onControlledParsonsSolutionChange!(next);
    } else {
      setInternalParsonsSolution(updater);
    }
  };

  const catAssignments = isCatControlled
    ? controlledCategorizationAssignments!
    : internalCatAssignments;
  const setCatAssignments = (
    updater: SetStateAction<CategorizationAssignments>,
  ) => {
    if (isCatControlled) {
      const next =
        typeof updater === "function"
          ? updater(controlledCategorizationAssignments!)
          : updater;
      onControlledCategorizationAssignmentsChange!(next);
    } else {
      setInternalCatAssignments(updater);
    }
  };

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isTeacherAnswerRevealed, setIsTeacherAnswerRevealed] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [parsonsHoverSlot, setParsonsHoverSlot] = useState<{
    index: number;
    depth: number;
  } | null>(null);
  const [parsonsSrMessage, setParsonsSrMessage] = useState("");
  const parsonsGridRef = useRef<HTMLDivElement>(null);

  const teacherRevealActive =
    embedded && groupTeacherReveal !== undefined
      ? groupTeacherReveal
      : isTeacherAnswerRevealed;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  useEffect(() => {
    if (!isParsonsControlled && parsonsQuestion) {
      setInternalParsonsSolution(buildInitialParsonsSolution(parsonsQuestion));
      setInternalParsonsBank(buildInitialParsonsBank(parsonsQuestion));
    }
    if (!isCatControlled && categorizationQuestion) {
      setInternalCatAssignments(
        buildInitialCategorizationAssignments(categorizationQuestion),
      );
    }
    setIsSubmitted(false);
    setIsTeacherAnswerRevealed(false);
    setActiveDragId(null);
    setSelectedBlockId(null);
    setSelectedTargetId(null);
    setParsonsHoverSlot(null);
    setParsonsSrMessage("");
  }, [
    level.id,
    isParsonsControlled,
    isCatControlled,
    parsonsQuestion,
    categorizationQuestion,
  ]);

  const continuePath = useMemo(() => {
    if (!levelLinks?.length || !currentLevelPath) return "/levels";
    const index = levelLinks.findIndex((link) => link.path === currentLevelPath);
    if (index === -1) return "/levels";
    return levelLinks[index + 1]?.path ?? "/levels";
  }, [levelLinks, currentLevelPath]);

  const blockById = useMemo(() => {
    const items =
      parsonsQuestion?.blocks ?? categorizationQuestion?.items ?? [];
    return new Map(items.map((item) => [item.id, item]));
  }, [parsonsQuestion, categorizationQuestion]);

  const displayParsonsSolution = useMemo((): ParsonsSolutionState => {
    if (teacherRevealActive && parsonsQuestion) {
      const indents = getParsonsCorrectIndents(parsonsQuestion);
      return parsonsQuestion.correctOrder.map((blockId, index) => ({
        blockId,
        depth: indents[index] ?? 0,
      }));
    }
    return parsonsSolution;
  }, [teacherRevealActive, parsonsQuestion, parsonsSolution]);

  const parsonsNesting = parsonsQuestion
    ? parsonsNestingEnabled(parsonsQuestion)
    : false;

  const displayParsonsBankIds = useMemo(() => {
    if (!parsonsQuestion) return [];
    const inSolution = new Set(
      displayParsonsSolution
        .map((line) => line.blockId)
        .filter(Boolean) as string[],
    );
    const allIds = parsonsQuestion.blocks.map((block) => block.id);
    if (teacherRevealActive) {
      return allIds.filter((id) => !inSolution.has(id));
    }
    if (isParsonsControlled) {
      return allIds.filter((id) => !inSolution.has(id));
    }
    return internalParsonsBank.filter((id) => !inSolution.has(id));
  }, [
    parsonsQuestion,
    displayParsonsSolution,
    internalParsonsBank,
    isParsonsControlled,
    teacherRevealActive,
  ]);

  const displayCatAssignments = useMemo(() => {
    if (teacherRevealActive && categorizationQuestion) {
      return categorizationQuestion.items.reduce<CategorizationAssignments>(
        (acc, item) => {
          acc[item.id] = item.correctBucketIds[0] ?? null;
          return acc;
        },
        {},
      );
    }
    return catAssignments;
  }, [teacherRevealActive, categorizationQuestion, catAssignments]);

  const displayCategorizationBankIds = useMemo(() => {
    if (!categorizationQuestion) return [];
    return categorizationQuestion.items
      .filter((item) => !displayCatAssignments[item.id])
      .map((item) => item.id);
  }, [categorizationQuestion, displayCatAssignments]);

  const canSubmit = parsonsQuestion
    ? isParsonsSolutionComplete(parsonsSolution)
    : categorizationQuestion
      ? isCategorizationComplete(categorizationQuestion, catAssignments)
      : false;

  const isCorrect = parsonsQuestion
    ? isParsonsSolutionCorrect(parsonsQuestion, parsonsSolution)
    : categorizationQuestion
      ? isCategorizationCorrect(categorizationQuestion, catAssignments)
      : false;

  const isSubmittedForFeedback = embedded ? Boolean(groupSubmitted) : isSubmitted;
  const interactionLocked =
    isSubmittedForFeedback || teacherRevealActive;

  const hasAnyAssignment = useMemo(() => {
    if (parsonsQuestion) {
      return parsonsSolution.some((line) => Boolean(line.blockId));
    }
    if (categorizationQuestion) {
      return categorizationQuestion.items.some(
        (item) => Boolean(catAssignments[item.id]),
      );
    }
    return false;
  }, [parsonsQuestion, parsonsSolution, categorizationQuestion, catAssignments]);

  /** While dragging out of the bank, the pointer is still over the bank drop zone — suppress its over highlight. */
  const isDraggingFromBank = useMemo(() => {
    if (!activeDragId) return false;
    const blockId = parseBlockId(activeDragId);
    const itemId = parseItemId(activeDragId);
    const id = blockId ?? itemId;
    if (!id) return false;
    if (parsonsQuestion) {
      return displayParsonsBankIds.includes(id);
    }
    if (categorizationQuestion) {
      return displayCategorizationBankIds.includes(id);
    }
    return false;
  }, [
    activeDragId,
    parsonsQuestion,
    categorizationQuestion,
    displayParsonsBankIds,
    displayCategorizationBankIds,
  ]);

  const bankReturnSlotItem = useMemo(() => {
    if (!activeDragId || isDraggingFromBank) return null;
    const id = parseBlockId(activeDragId) ?? parseItemId(activeDragId);
    if (!id) return null;
    return blockById.get(id) ?? null;
  }, [activeDragId, isDraggingFromBank, blockById]);

  const clearAll = () => {
    if (parsonsQuestion) {
      setParsonsSolution(buildInitialParsonsSolution(parsonsQuestion));
      if (!isParsonsControlled) {
        setInternalParsonsBank(buildInitialParsonsBank(parsonsQuestion));
      }
    }
    if (categorizationQuestion) {
      setCatAssignments(
        buildInitialCategorizationAssignments(categorizationQuestion),
      );
    }
  };

  const resetAfterSubmit = () => {
    if (parsonsQuestion) {
      setParsonsSolution(buildInitialParsonsSolution(parsonsQuestion));
      if (!isParsonsControlled) {
        setInternalParsonsBank(buildInitialParsonsBank(parsonsQuestion));
      }
    }
    if (categorizationQuestion) {
      setCatAssignments(
        buildInitialCategorizationAssignments(categorizationQuestion),
      );
    }
    setIsSubmitted(false);
  };

  const handleSubmit = () => {
    if (!canSubmit || teacherRevealActive) return;
    setIsSubmitted(true);
    playFeedbackSound(isCorrect ? successSoundUrl : errorSoundUrl);
  };

  const moveBlockToSlot = (
    blockId: string,
    slotIndex: number,
    depth: number,
    sourceSlotIndex: number | null,
  ) => {
    if (!parsonsQuestion || interactionLocked) return;
    const finalDepth = slotIndex === 0 ? 0 : depth;
    setParsonsSolution((prev) => {
      const next = prev.map((line) => ({ ...line }));
      const displaced = { ...next[slotIndex] };
      next[slotIndex] = { blockId, depth: finalDepth };
      if (sourceSlotIndex != null && sourceSlotIndex !== slotIndex) {
        next[sourceSlotIndex] = displaced;
      } else if (sourceSlotIndex == null && displaced.blockId) {
        if (!isParsonsControlled) {
          setInternalParsonsBank((bank) =>
            bank.includes(displaced.blockId!)
              ? bank
              : [...bank, displaced.blockId!],
          );
        }
      }
      if (!isParsonsControlled && sourceSlotIndex == null) {
        setInternalParsonsBank((bank) => bank.filter((id) => id !== blockId));
      }
      return next;
    });
  };

  const moveBlockToBank = (blockId: string, sourceSlotIndex: number | null) => {
    if (!parsonsQuestion || interactionLocked) return;
    setParsonsSolution((prev) => {
      const next = prev.map((line) => ({ ...line }));
      if (sourceSlotIndex != null) {
        next[sourceSlotIndex] = { blockId: null, depth: 0 };
      }
      return next;
    });
    if (!isParsonsControlled) {
      setInternalParsonsBank((bank) =>
        bank.includes(blockId) ? bank : [...bank, blockId],
      );
    }
  };

  /** Keyboard indent/outdent for a placed Parsons line (a11y). Returns the new depth, or null if no change. */
  const adjustParsonsDepth = (slotIndex: number, delta: number): number | null => {
    if (!parsonsQuestion || interactionLocked || !parsonsNesting) return null;
    const line = parsonsSolution[slotIndex];
    if (!line?.blockId) return null;
    const maxDepth = maxParsonsDepthAtIndex(parsonsSolution, slotIndex);
    const nextDepth = Math.max(0, Math.min(line.depth + delta, maxDepth));
    if (nextDepth === line.depth) return null;
    setParsonsSolution((prev) => {
      const next = prev.map((entry) => ({ ...entry }));
      if (next[slotIndex]?.blockId) next[slotIndex].depth = nextDepth;
      return next;
    });
    return nextDepth;
  };

  const handleParsonsDragOver = (event: DragOverEvent) => {
    if (!parsonsNesting) return;
    const overId = event.over ? String(event.over.id) : null;
    const slotIndex = parseParsonsSlotIndex(overId);
    if (slotIndex == null) {
      setParsonsHoverSlot(null);
      return;
    }
    const depth = computeParsonsDepthFromRects(
      slotIndex,
      event.active.rect.current.translated?.left,
      event.over?.rect.left,
      parsonsSolution,
    );
    setParsonsHoverSlot({ index: slotIndex, depth });
  };

  const handleParsonsDragEnd = (event: DragEndEvent) => {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    const blockId = parseBlockId(activeId);
    if (!blockId) {
      setActiveDragId(null);
      setParsonsHoverSlot(null);
      return;
    }

    const sourceSlotIndex = findParsonsSourceIndex(parsonsSolution, blockId);

    if (!overId || overId === PARSONS_BANK_ID || parseBlockId(overId)) {
      moveBlockToBank(blockId, sourceSlotIndex >= 0 ? sourceSlotIndex : null);
      setActiveDragId(null);
      setParsonsHoverSlot(null);
      return;
    }

    const slotIndex = parseParsonsSlotIndex(overId);
    if (slotIndex == null) {
      setActiveDragId(null);
      setParsonsHoverSlot(null);
      return;
    }

    const depth =
      parsonsNesting && slotIndex > 0
        ? computeParsonsDepthFromRects(
            slotIndex,
            event.active.rect.current.translated?.left,
            event.over?.rect.left,
            parsonsSolution,
          )
        : 0;
    moveBlockToSlot(
      blockId,
      slotIndex,
      depth,
      sourceSlotIndex >= 0 ? sourceSlotIndex : null,
    );
    setActiveDragId(null);
    setParsonsHoverSlot(null);
  };

  const assignItemToBucket = (
    itemId: string,
    bucketId: string | null,
  ) => {
    if (!categorizationQuestion || interactionLocked) return;
    setCatAssignments((prev) => ({ ...prev, [itemId]: bucketId }));
  };

  const handleCategorizationDragEnd = (event: DragEndEvent) => {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    const itemId = parseItemId(activeId);
    if (!itemId) {
      setActiveDragId(null);
      return;
    }

    if (!overId || overId === CAT_BANK_ID || parseItemId(overId)) {
      assignItemToBucket(itemId, null);
      setActiveDragId(null);
      return;
    }

    const bucketId = parseBucketId(overId);
    if (!bucketId) {
      setActiveDragId(null);
      return;
    }

    assignItemToBucket(itemId, bucketId);
    setActiveDragId(null);
  };

  const clearSelection = () => {
    setSelectedBlockId(null);
    setSelectedTargetId(null);
  };

  // Pointer drags restore focus to the moved card on drop, which leaves a
  // stray focus ring. Keyboard interaction never routes through dnd-kit, so it
  // is safe to drop focus here after a pointer drag completes.
  const blurAfterPointerDrag = () => {
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
  };

  const placeBlockInTarget = (blockId: string, targetId: string) => {
    if (interactionLocked) return;
    if (parsonsQuestion) {
      const slotIndex = parseParsonsSlotIndex(targetId);
      if (slotIndex == null) return;
      const sourceSlotIndex = findParsonsSourceIndex(parsonsSolution, blockId);
      moveBlockToSlot(
        blockId,
        slotIndex,
        0,
        sourceSlotIndex >= 0 ? sourceSlotIndex : null,
      );
      return;
    }
    if (categorizationQuestion) {
      const bucketId = parseBucketId(targetId);
      if (!bucketId) return;
      assignItemToBucket(blockId, bucketId);
    }
  };

  const removeBlockToBank = (blockId: string) => {
    if (interactionLocked) return;
    if (parsonsQuestion) {
      const sourceSlotIndex = findParsonsSourceIndex(parsonsSolution, blockId);
      moveBlockToBank(blockId, sourceSlotIndex >= 0 ? sourceSlotIndex : null);
      return;
    }
    if (categorizationQuestion) {
      assignItemToBucket(blockId, null);
    }
  };

  const handleSelectBlock = (blockId: string) => {
    if (interactionLocked) return;
    if (selectedTargetId) {
      placeBlockInTarget(blockId, selectedTargetId);
      clearSelection();
      return;
    }
    setSelectedTargetId(null);
    setSelectedBlockId((current) => (current === blockId ? null : blockId));
  };

  const handleSelectTarget = (targetId: string) => {
    if (interactionLocked) return;
    if (selectedBlockId) {
      placeBlockInTarget(selectedBlockId, targetId);
      clearSelection();
      return;
    }
    setSelectedBlockId(null);
    setSelectedTargetId((current) => (current === targetId ? null : targetId));
  };

  const announceParsonsDepth = (slotIndex: number, depth: number) => {
    const item = parsonsSolution[slotIndex]?.blockId
      ? blockById.get(parsonsSolution[slotIndex].blockId!)
      : null;
    const label = item ? getDragDropItemLabel(item) : "Block";
    setParsonsSrMessage(
      depth === 0
        ? `${label} moved to top level, line ${slotIndex + 1}.`
        : `${label} indented to level ${depth}, line ${slotIndex + 1}.`,
    );
  };

  const handleParsonsGridKeyDown = (event: ReactKeyboardEvent) => {
    if (interactionLocked) return;
    if (event.key === "Escape") {
      event.preventDefault();
      clearSelection();
      return;
    }

    const target = event.target as HTMLElement;
    const col = target.dataset.kbCol;
    const row = Number.parseInt(target.dataset.kbRow ?? "", 10);
    if (!col || Number.isNaN(row)) return;

    // Indent / outdent a placed line. Shift+Arrow keeps plain arrows free for
    // roving between columns, and works on a focused filled slot.
    if (
      parsonsNesting &&
      col === "slot" &&
      event.shiftKey &&
      (event.key === "ArrowRight" || event.key === "ArrowLeft")
    ) {
      if (parsonsSolution[row]?.blockId) {
        event.preventDefault();
        const nextDepth = adjustParsonsDepth(
          row,
          event.key === "ArrowRight" ? 1 : -1,
        );
        if (nextDepth != null) announceParsonsDepth(row, nextDepth);
        return;
      }
    }

    if (
      !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
    ) {
      return;
    }
    event.preventDefault();

    let targetCol = col;
    let targetRow = row;
    switch (event.key) {
      case "ArrowUp":
        targetRow = row - 1;
        break;
      case "ArrowDown":
        targetRow = row + 1;
        break;
      case "ArrowLeft":
        targetCol = "bank";
        break;
      case "ArrowRight":
        targetCol = "slot";
        break;
    }

    const grid = parsonsGridRef.current;
    if (!grid) return;
    const items = Array.from(
      grid.querySelectorAll<HTMLElement>(`[data-kb-col="${targetCol}"]`),
    );
    if (items.length === 0) return;
    const clampedRow = Math.max(0, Math.min(targetRow, items.length - 1));
    items[clampedRow]?.focus();
  };

  const getParsonsSlotTone = (
    slotIndex: number,
  ): "default" | "correct" | "incorrect" | "revealed" => {
    if (teacherRevealActive) return "revealed";
    if (!isSubmittedForFeedback || !parsonsQuestion) return "default";
    const line = parsonsSolution[slotIndex];
    const expectedId = parsonsQuestion.correctOrder[slotIndex];
    const expectedDepth = getParsonsCorrectIndents(parsonsQuestion)[slotIndex];
    if (!line?.blockId || !expectedId) return "incorrect";
    return line.blockId === expectedId && line.depth === expectedDepth
      ? "correct"
      : "incorrect";
  };

  const getCatItemTone = (
    itemId: string,
  ): "default" | "correct" | "incorrect" | "revealed" => {
    if (teacherRevealActive) return "revealed";
    if (!isSubmittedForFeedback) return "default";
    const item = categorizationQuestion?.items.find((entry) => entry.id === itemId);
    const bucketId = catAssignments[itemId];
    if (!item || !bucketId) return "incorrect";
    return item.correctBucketIds.includes(bucketId) ? "correct" : "incorrect";
  };

  const eyebrow =
    embeddedInScrollGroup || embeddedInSteppedGroup
      ? (embeddedStepEyebrow ?? (isParsons ? "Parsons problem" : "Categorization"))
      : isParsons
        ? "Parsons problem"
        : "Categorization";

  const embeddedFlatInParent =
    embedded && (embeddedInScrollGroup || embeddedInSteppedGroup);

  const cardContents = (
    <>
      <AssessmentStemSection
          eyebrow={eyebrow}
          eyebrowClassName={
            embeddedInScrollGroup ? stemStyles.stepCounterEyebrow : undefined
          }
          question={level.stem.question}
          description={level.stem.description}
        >
          <DndContext
            sensors={sensors}
            onDragStart={(event: DragStartEvent) => {
              clearSelection();
              setActiveDragId(String(event.active.id));
              blurAfterPointerDrag();
            }}
            onDragOver={(event) => {
              if (isParsons) handleParsonsDragOver(event);
            }}
            onDragEnd={(event) => {
              if (isParsons) {
                handleParsonsDragEnd(event);
              } else {
                handleCategorizationDragEnd(event);
              }
              blurAfterPointerDrag();
            }}
            onDragCancel={() => {
              setActiveDragId(null);
              setParsonsHoverSlot(null);
              blurAfterPointerDrag();
            }}
          >
            {parsonsQuestion ? (
              <div
                ref={parsonsGridRef}
                className={styles.parsonsLayout}
                role="group"
                aria-label="Arrange code blocks into the solution"
                onKeyDown={handleParsonsGridKeyDown}
              >
                <div className={styles.solutionColumn}>
                  <p className={styles.sectionLabel}>
                    {parsonsQuestion.solutionLabel ?? "Your solution"}
                  </p>
                  <span
                    className={styles.srOnly}
                    role="status"
                    aria-live="polite"
                  >
                    {parsonsSrMessage}
                  </span>
                  <div className={styles.solutionSlots}>
                    {displayParsonsSolution.map((line, slotIndex) => {
                      const tone = getParsonsSlotTone(slotIndex);
                      const item = line.blockId
                        ? blockById.get(line.blockId)
                        : null;
                      const slotId = parsonsSlotId(slotIndex);
                      const isHoverTarget =
                        parsonsNesting &&
                        parsonsHoverSlot?.index === slotIndex &&
                        !line.blockId;
                      const contentDepth = line.blockId
                        ? line.depth
                        : isHoverTarget
                          ? parsonsHoverSlot!.depth
                          : 0;

                      return (
                        <DroppableZone
                          key={slotId}
                          id={slotId}
                          disabled={interactionLocked}
                          focusable
                          ariaLabel={`Solution position ${slotIndex + 1}${
                            item
                              ? `, indent level ${line.depth}, contains ${getDragDropItemLabel(item)}${
                                  parsonsNesting && slotIndex > 0
                                    ? ". Press Shift plus Left or Right arrow to change indent."
                                    : ""
                                }`
                              : ", empty"
                          }`}
                          onActivate={() => handleSelectTarget(slotId)}
                          onRemove={
                            item ? () => removeBlockToBank(item.id) : undefined
                          }
                          kbCol="slot"
                          kbRow={slotIndex}
                          className={[
                            styles.slot,
                            line.blockId ? styles.slotFilled : "",
                            selectedTargetId === slotId
                              ? styles.slotSelected
                              : "",
                            tone === "correct" ? styles.slotCorrect : "",
                            tone === "incorrect" ? styles.slotIncorrect : "",
                            tone === "revealed" ? styles.slotRevealed : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          overClassName={
                            parsonsNesting ? undefined : styles.slotOver
                          }
                        >
                          <div
                            className={[
                              styles.parsonsSlotContent,
                              isHoverTarget
                                ? styles.parsonsSlotDepthPreview
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            style={{
                              marginLeft: parsonsLineIndentPx(contentDepth),
                            }}
                          >
                            {item ? (
                              <DraggableBlockCard
                                dragId={blockDragId(item.id)}
                                item={item}
                                disabled={interactionLocked}
                                tone={tone}
                                placement="slot"
                                focusable={false}
                                selected={selectedBlockId === item.id}
                                onSelect={() => handleSelectBlock(item.id)}
                              />
                            ) : isHoverTarget && parsonsNesting ? (
                              <span
                                className={styles.parsonsDepthBadge}
                                aria-hidden="true"
                              >
                                {parsonsHoverSlot!.depth === 0
                                  ? "Top level"
                                  : `Indent ${parsonsHoverSlot!.depth}`}
                              </span>
                            ) : (
                              <span
                                className={styles.slotEmptyLabel}
                                aria-hidden="true"
                              >
                                <FaIcon name="circle-question" size="l" />
                              </span>
                            )}
                          </div>
                        </DroppableZone>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.bankColumn}>
                  <p className={styles.sectionLabel}>{BANK_SECTION_LABEL}</p>
                  <BankDroppableZone
                    id={PARSONS_BANK_ID}
                    disabled={interactionLocked}
                    className={styles.bankList}
                    isEmpty={displayParsonsBankIds.length === 0}
                    showReturnSlot={!isDraggingFromBank}
                  >
                    {displayParsonsBankIds.map((id, bankIndex) => {
                      const item = blockById.get(id);
                      if (!item) return null;
                      return (
                        <DraggableBlockCard
                          key={id}
                          dragId={blockDragId(id)}
                          item={item}
                          disabled={interactionLocked}
                          selected={selectedBlockId === id}
                          onSelect={() => handleSelectBlock(id)}
                          kbCol="bank"
                          kbRow={bankIndex}
                        />
                      );
                    })}
                  </BankDroppableZone>
                </div>
              </div>
            ) : null}

            {categorizationQuestion ? (
              <div
                className={styles.categorizationLayout}
                role="group"
                aria-label="Sort items into buckets"
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    clearSelection();
                  }
                }}
              >
                <div className={styles.bucketsGrid}>
                  {categorizationQuestion.buckets.map((bucket) => {
                    const dropId = bucketDropId(bucket.id);
                    const bucketItemIds = categorizationQuestion.items
                      .filter((item) => displayCatAssignments[item.id] === bucket.id)
                      .map((item) => item.id);
                    return (
                      <div key={bucket.id} className={styles.bucketCard}>
                        <div className={styles.bucketHeader}>
                          <h3 className={styles.bucketTitle}>{bucket.label}</h3>
                          {bucket.description ? (
                            <p className={styles.bucketDescription}>
                              {bucket.description}
                            </p>
                          ) : null}
                        </div>
                        <DroppableZone
                          id={dropId}
                          disabled={interactionLocked}
                          focusable
                          ariaLabel={`${bucket.label} bucket`}
                          onActivate={() => handleSelectTarget(dropId)}
                          className={[
                            styles.bucketDropzone,
                            selectedTargetId === dropId
                              ? styles.bucketDropzoneSelected
                              : "",
                            bucketItemIds.length === 0
                              ? styles.bucketDropzoneEmpty
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          overClassName={styles.bucketDropzoneOver}
                        >
                          {bucketItemIds.length > 0 ? (
                            <div className={styles.bucketItems}>
                              {bucketItemIds.map((itemId) => {
                                const item = blockById.get(itemId);
                                if (!item) return null;
                                return (
                                  <DraggableBlockCard
                                    key={itemId}
                                    dragId={itemDragId(itemId)}
                                    item={item}
                                    disabled={interactionLocked}
                                    tone={getCatItemTone(itemId)}
                                    placement="bucket"
                                    selected={selectedBlockId === itemId}
                                    onSelect={() => handleSelectBlock(itemId)}
                                    onRemove={() => removeBlockToBank(itemId)}
                                  />
                                );
                              })}
                            </div>
                          ) : (
                            <span className={styles.bucketEmptyIcon} aria-hidden="true">
                              <FaIcon name="circle-question" size="l" />
                            </span>
                          )}
                        </DroppableZone>
                      </div>
                    );
                  })}
                </div>

                <div className={styles.bankColumn}>
                  <p className={styles.sectionLabel}>{BANK_SECTION_LABEL}</p>
                  <BankDroppableZone
                    id={CAT_BANK_ID}
                    disabled={interactionLocked}
                    className={[styles.bankList, styles.bankListWrap]
                      .filter(Boolean)
                      .join(" ")}
                    wrapLayout
                    isEmpty={displayCategorizationBankIds.length === 0}
                    showReturnSlot={!isDraggingFromBank}
                    returnSlotItem={bankReturnSlotItem}
                  >
                    {displayCategorizationBankIds.map((itemId) => {
                      const item = blockById.get(itemId);
                      if (!item) return null;
                      return (
                        <DraggableBlockCard
                          key={itemId}
                          dragId={itemDragId(itemId)}
                          item={item}
                          disabled={interactionLocked}
                          selected={selectedBlockId === itemId}
                          onSelect={() => handleSelectBlock(itemId)}
                        />
                      );
                    })}
                  </BankDroppableZone>
                </div>
              </div>
            ) : null}

            <DragOverlay dropAnimation={null}>
              {activeDragId ? (() => {
                const blockId = parseBlockId(activeDragId);
                const itemId = parseItemId(activeDragId);
                const item = blockById.get(blockId ?? itemId ?? "");
                if (!item) return null;
                return (
                  <div
                    className={[
                      styles.dragOverlayCard,
                      categorizationQuestion
                        ? styles.dragOverlayCardChip
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <BlockCardContent item={item} />
                  </div>
                );
              })() : null}
            </DragOverlay>
          </DndContext>
        </AssessmentStemSection>

      {!embeddedFlatInParent ? (
        <AssessmentBottomRow
          left={
            embedded ? undefined : (
              <>
                <Button
                  variant="outlined" color="secondary"
                  size="medium"
                  startIconName={teacherRevealActive ? "eye-slash" : "eye"}
                  onClick={() => setIsTeacherAnswerRevealed((prev) => !prev)}
                >
                  {teacherRevealActive ? "Hide answer" : "Reveal answer"}
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
          showLeft={!embedded}
          right={
            <>
              {isSubmittedForFeedback && isCorrect ? (
                <AssessmentSuccessFeedback />
              ) : null}
              {isSubmittedForFeedback && isCorrect ? (
                <Button
                  variant="contained" color="primary"
                  size="medium"
                  onClick={() => navigate(continuePath)}
                >
                  Continue
                </Button>
              ) : null}
              {isSubmittedForFeedback && !isCorrect ? (
                <Button
                  variant="contained" color="primary"
                  size="medium"
                  onClick={resetAfterSubmit}
                >
                  Try again
                </Button>
              ) : null}
              {!isSubmittedForFeedback ? (
                <Button
                  variant="contained" color="primary"
                  size="medium"
                  onClick={handleSubmit}
                  disabled={!canSubmit || teacherRevealActive}
                >
                  Submit answer
                </Button>
              ) : null}
            </>
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

  if (embedded && codePanel) {
    return (
      <AssessmentCodeRefLayout codePanel={codePanel} embedded>
        {cardContents}
      </AssessmentCodeRefLayout>
    );
  }

  if (embedded) {
    return mainBody;
  }

  const shellContent = codePanel ? (
    <AssessmentCodeRefLayout codePanel={codePanel}>{cardContents}</AssessmentCodeRefLayout>
  ) : (
    mainBody
  );

  return (
    <Lab2Shell
      topNavigationProps={{
        title: `${level.metadata.lessonName} - ${level.name}`,
        subtitle: codePanel
          ? "Code reference — split layout"
          : "Draft assessment level on Lab2 shell",
        currentLevel: level.metadata.levelPosition,
        totalLevels: level.metadata.totalLevelsInScript,
        completedLevels: [1, 2],
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
        devPanelFields: dragDropDevFields,
        devPanelOverrideResult: overrideResult,
      }}
      onResize={(delta) => {
        setSidebarWidth((prev) => Math.max(300, Math.min(600, prev + delta)));
      }}
    >
      {shellContent}
    </Lab2Shell>
  );
}
