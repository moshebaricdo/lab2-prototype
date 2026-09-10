import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { FaIcon } from "@moshebaricdo/cads-react/icons";
import { ScrollArea } from "../../../ui/scroll-area";
import {
  isSectioned,
  questionRefId,
  resolvedAllowRetries,
  resolvedShowIntro,
  type OutlineDropTarget,
  type UnitOption,
  type BlankQuestionKind,
} from "../../../../lib/assessmentBuilder";
import type {
  AssessmentArtifact,
  AssessmentIntro,
  QuestionItem,
} from "../../../../types/assessmentBuilder";
import { OutlineIntroCard } from "./OutlineIntroCard";
import {
  OutlineAddQuestionRow,
  OutlineAddSectionGhost,
  OutlineConnector,
  OutlineEmptyQuiz,
  OutlineEmptySectionSlot,
} from "./OutlineAddRow";
import {
  OutlineQuestionCard,
  QuestionRowContent,
  type OutlineRefType,
} from "./OutlineQuestionCard";
import { OutlineSectionBlock } from "./OutlineSectionBlock";
import { SectionDeleteDialog } from "./SectionDeleteDialog";
import styles from "./AssessmentOutlineCanvas.module.scss";

const FLAT_END_ID = "end:flat";
const EXPAND_SCROLL_OFFSET_PX = 52;

/** Prefer question / end slots so section headers don't steal within-section drops. */
const questionFirstCollision: CollisionDetection = (args) => {
  const collisions = closestCenter(args);
  const preferred = collisions.filter((collision) => {
    const id = String(collision.id);
    return id.startsWith("q:") || id.startsWith("end:");
  });
  return preferred.length > 0 ? preferred : collisions;
};

interface OutlineItemView {
  bankId: string;
  question: QuestionItem;
  refType: OutlineRefType;
}

interface OutlineSectionView {
  id: string;
  displayTitle: string;
  items: OutlineItemView[];
}

type ActiveDrag = { kind: "question"; bankId: string } | null;

function insertAt<T>(items: T[], index: number, item: T): T[] {
  const at = Math.max(0, Math.min(items.length, index));
  return [...items.slice(0, at), item, ...items.slice(at)];
}

interface AssessmentOutlineCanvasProps {
  artifact: AssessmentArtifact;
  /** bankId → resolved question, with the in-flight editing draft overlaid. */
  questionsById: Map<string, QuestionItem>;
  selectedBankId: string | null;
  dirtyBankIds: Set<string>;
  courseOptions: Array<{ value: string; label: string }>;
  getDomainOptionsForCourse: (courseId: string) => Array<{ value: string; label: string }>;
  getUnitOptionsForCourse: (courseId: string) => UnitOption[];
  onExpandQuestion: (bankId: string) => void;
  onCollapseQuestion: () => void;
  onRequestSave: () => void;
  onCancelEdits: () => void;
  onDiscardUnsaved: (bankId: string) => void;
  onUpdateQuestion: (question: QuestionItem) => void;
  onRemoveQuestion: (bankId: string) => void;
  onMoveQuestion: (bankId: string, target: OutlineDropTarget) => void;
  onMoveSection: (sectionId: string, direction: -1 | 1) => void;
  onInsertSection: (sectionId: string, position: "above" | "below") => void;
  onDeleteSection: (sectionId: string) => void;
  onUpdateIntro: (patch: Partial<AssessmentIntro>) => void;
  onRemoveIntro: () => void;
  onCreateQuestion: (kind: BlankQuestionKind, sectionId: string | null) => void;
  onAddSection: () => void;
}

/**
 * Block-based visual outline for the P0 builder: overview header, pinned
 * intro, sections-as-pages, question rows, and tick connectors.
 */
export function AssessmentOutlineCanvas({
  artifact,
  questionsById,
  selectedBankId,
  dirtyBankIds,
  courseOptions,
  getDomainOptionsForCourse,
  getUnitOptionsForCourse,
  onExpandQuestion,
  onCollapseQuestion,
  onRequestSave,
  onCancelEdits,
  onDiscardUnsaved,
  onUpdateQuestion,
  onRemoveQuestion,
  onMoveQuestion,
  onMoveSection,
  onInsertSection,
  onDeleteSection,
  onUpdateIntro,
  onRemoveIntro,
  onCreateQuestion,
  onAddSection,
}: AssessmentOutlineCanvasProps) {
  const sectioned = isSectioned(artifact);

  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [introExpanded, setIntroExpanded] = useState(false);
  const [activeDrag, setActiveDrag] = useState<ActiveDrag>(null);
  const [questionTarget, setQuestionTarget] = useState<OutlineDropTarget | null>(null);
  const [overDroppableId, setOverDroppableId] = useState<string | null>(null);
  const [overlayWidth, setOverlayWidth] = useState<number | null>(null);
  const [sectionDelete, setSectionDelete] = useState<{
    id: string;
    displayTitle: string;
    questionCount: number;
  } | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  useEffect(() => {
    if (!selectedBankId) return;
    const bankId = selectedBankId;
    const frame = window.requestAnimationFrame(() => {
      const node = cardRefs.current.get(bankId);
      if (!node) return;
      const viewport = node.closest("[data-slot=\"scroll-area-viewport\"]");
      if (viewport instanceof HTMLElement) {
        const top =
          node.getBoundingClientRect().top -
          viewport.getBoundingClientRect().top +
          viewport.scrollTop -
          EXPAND_SCROLL_OFFSET_PX;
        viewport.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
        return;
      }
      node.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selectedBankId]);

  const baseSections = useMemo<OutlineSectionView[] | null>(() => {
    if (!sectioned) return null;
    return (artifact.sections ?? []).map((section, index) => ({
      id: section.id,
      displayTitle: `Section ${index + 1}`,
      items: section.questionRefs.flatMap((ref) => {
        const question = questionsById.get(questionRefId(ref));
        return question
          ? [{ bankId: question.bankId, question, refType: ref.type }]
          : [];
      }),
    }));
  }, [artifact.sections, questionsById, sectioned]);

  const baseFlat = useMemo<OutlineItemView[] | null>(() => {
    if (sectioned) return null;
    return artifact.questionRefs.flatMap((ref) => {
      const question = questionsById.get(questionRefId(ref));
      return question
        ? [{ bankId: question.bankId, question, refType: ref.type }]
        : [];
    });
  }, [artifact.questionRefs, questionsById, sectioned]);

  /** Live preview of the outline while a drag is in flight. */
  const preview = useMemo(() => {
    let sections = baseSections;
    let flat = baseFlat;

    if (activeDrag?.kind === "question" && questionTarget) {
      if (sections) {
        let active: OutlineItemView | undefined;
        const stripped = sections.map((section) => {
          const found = section.items.find((item) => item.bankId === activeDrag.bankId);
          if (found) active = found;
          return {
            ...section,
            items: section.items.filter((item) => item.bankId !== activeDrag.bankId),
          };
        });
        if (active && questionTarget.sectionId != null) {
          const moved = active;
          sections = stripped.map((section) =>
            section.id === questionTarget.sectionId
              ? { ...section, items: insertAt(section.items, questionTarget.index, moved) }
              : section,
          );
        }
      } else if (flat) {
        const active = flat.find((item) => item.bankId === activeDrag.bankId);
        if (active) {
          const rest = flat.filter((item) => item.bankId !== activeDrag.bankId);
          flat = insertAt(rest, questionTarget.index, active);
        }
      }
    }

    return { sections, flat };
  }, [activeDrag, baseFlat, baseSections, questionTarget]);

  /** Locate a question within the base outline (index within its own list). */
  const findLocation = (bankId: string): OutlineDropTarget | null => {
    if (baseSections) {
      for (const section of baseSections) {
        const index = section.items.findIndex((item) => item.bankId === bankId);
        if (index !== -1) return { sectionId: section.id, index };
      }
      return null;
    }
    const index = (baseFlat ?? []).findIndex((item) => item.bankId === bankId);
    return index === -1 ? null : { sectionId: null, index };
  };

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    setOverlayWidth(event.active.rect.current.initial?.width ?? null);
    if (id.startsWith("q:")) {
      const bankId = id.slice(2);
      setActiveDrag({ kind: "question", bankId });
      setQuestionTarget(findLocation(bankId));
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over || !activeDrag) return;
    const overId = String(over.id);
    setOverDroppableId(overId);

    if (activeDrag.kind === "question") {
      if (overId.startsWith("q:")) {
        const overBankId = overId.slice(2);
        if (overBankId === activeDrag.bankId) return;
        const location = findLocation(overBankId);
        if (!location) return;
        // Insert at the hovered card's original index: dragging up lands
        // before it, dragging down lands after it (same math as splice
        // remove-then-insert reordering).
        setQuestionTarget(location);
      } else if (overId.startsWith("end:")) {
        const raw = overId.slice(4);
        const sectionId = raw === "flat" ? null : raw;
        const list =
          sectionId == null
            ? baseFlat ?? []
            : baseSections?.find((entry) => entry.id === sectionId)?.items ?? [];
        const withoutActive = list.filter(
          (item) => item.bankId !== activeDrag.bankId,
        );
        setQuestionTarget({ sectionId, index: withoutActive.length });
      } else if (overId.startsWith("sec:")) {
        const sectionId = overId.slice(4);
        const list =
          baseSections?.find((entry) => entry.id === sectionId)?.items ?? [];
        const withoutActive = list.filter(
          (item) => item.bankId !== activeDrag.bankId,
        );
        setQuestionTarget({ sectionId, index: withoutActive.length });
      }
      return;
    }
  };

  const resetDrag = () => {
    setActiveDrag(null);
    setQuestionTarget(null);
    setOverDroppableId(null);
    setOverlayWidth(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (activeDrag?.kind === "question" && questionTarget && event.over) {
      const origin = findLocation(activeDrag.bankId);
      if (
        !origin ||
        origin.sectionId !== questionTarget.sectionId ||
        origin.index !== questionTarget.index
      ) {
        onMoveQuestion(activeDrag.bankId, questionTarget);
      }
    }
    resetDrag();
  };

  const handleExpand = (bankId: string) => {
    onExpandQuestion(bankId);
  };

  const handleRemove = (item: OutlineItemView) => {
    onRemoveQuestion(item.bankId);
  };

  const handleDeleteSection = (section: OutlineSectionView) => {
    if (section.items.length === 0) {
      onDeleteSection(section.id);
      return;
    }
    setSectionDelete({
      id: section.id,
      displayTitle: section.displayTitle,
      questionCount: section.items.length,
    });
  };

  const toggleSectionCollapsed = (sectionId: string) => {
    setCollapsedIds((current) => {
      const next = new Set(current);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const renderQuestionCard = (item: OutlineItemView) => (
    <OutlineQuestionCard
      key={item.bankId}
      question={item.question}
      expanded={selectedBankId === item.bankId}
      isDragSource={
        activeDrag?.kind === "question" && activeDrag.bankId === item.bankId
      }
      dirty={dirtyBankIds.has(item.bankId)}
      graded
      courseOptions={courseOptions}
      domainOptions={getDomainOptionsForCourse(item.question.courseId)}
      unitOptions={getUnitOptionsForCourse(item.question.courseId)}
      currentQuizTitle={artifact.title}
      onExpand={() => handleExpand(item.bankId)}
      onCollapse={onCollapseQuestion}
      onRequestSave={onRequestSave}
      onDiscard={() => onDiscardUnsaved(item.bankId)}
      onCancelEdits={onCancelEdits}
      onRemove={() => handleRemove(item)}
      onUpdateQuestion={onUpdateQuestion}
      setCardRef={(node) => {
        if (node) cardRefs.current.set(item.bankId, node);
        else cardRefs.current.delete(item.bankId);
      }}
    />
  );

  const questionCount = sectioned
    ? (baseSections ?? []).reduce((sum, section) => sum + section.items.length, 0)
    : (baseFlat ?? []).length;
  const isEmptyQuiz = !sectioned && questionCount === 0;
  const showAddSectionGhost = !isEmptyQuiz;

  const activeQuestion =
    activeDrag?.kind === "question"
      ? questionsById.get(activeDrag.bankId) ?? null
      : null;

  const retries = resolvedAllowRetries(artifact);
  const maxAttempts = artifact.attempts?.maxAttempts;
  const timeLimit = artifact.timing?.timeLimitMinutes;
  const showIntro = resolvedShowIntro(artifact) && Boolean(artifact.intro);
  const attemptsLabel = !retries
    ? "1 attempt"
    : maxAttempts == null
      ? "Unlimited attempts"
      : `${maxAttempts} attempt${maxAttempts === 1 ? "" : "s"}`;

  return (
    <>
      <ScrollArea className={styles.root}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <h1 className={styles.title}>{artifact.title}</h1>
          <div className={styles.metaRow}>
            <span className={styles.metaItem}>
              <FaIcon name="circle-question" size="small" />
              {questionCount} question{questionCount === 1 ? "" : "s"}
            </span>
            {timeLimit != null && (
              <span className={styles.metaItem}>
                <FaIcon name="clock" size="small" />
                {timeLimit} minutes
              </span>
            )}
            <span className={styles.metaItem}>
              <FaIcon
                name={maxAttempts == null && retries ? "infinity" : "bullseye-arrow"}
                size="small"
              />
              {attemptsLabel}
            </span>
          </div>
        </header>

        <DndContext
          sensors={sensors}
          collisionDetection={questionFirstCollision}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={resetDrag}
        >
          <div className={styles.outline}>
            {showIntro && artifact.intro ? (
              <OutlineIntroCard
                title={artifact.intro.title}
                overviewContent={artifact.intro.overviewContent}
                expanded={introExpanded}
                onExpand={() => setIntroExpanded(true)}
                onCollapse={() => setIntroExpanded(false)}
                onUpdateIntro={onUpdateIntro}
                onRemove={onRemoveIntro}
              />
            ) : null}

            {isEmptyQuiz ? (
              <>
                {showIntro ? <OutlineConnector size="section" /> : null}
                <OutlineEmptyQuiz
                  onCreateQuestion={(kind) => onCreateQuestion(kind, null)}
                  onAddSection={onAddSection}
                />
              </>
            ) : preview.sections
              ? preview.sections.map((section, sectionIndex) => {
                  const collapsed = collapsedIds.has(section.id);
                  const showLeadConnector =
                    showIntro ||
                    sectionIndex > 0;
                  return (
                    <div key={section.id}>
                      {showLeadConnector && (
                        <OutlineConnector size="section" />
                      )}
                      <OutlineSectionBlock
                        sectionId={section.id}
                        displayTitle={section.displayTitle}
                        sectionNumber={sectionIndex + 1}
                        questionCount={section.items.length}
                        collapsed={collapsed}
                        isFirst={sectionIndex === 0}
                        isLast={sectionIndex === preview.sections!.length - 1}
                        isQuestionDropTarget={
                          activeDrag?.kind === "question" &&
                          overDroppableId === `sec:${section.id}`
                        }
                        onToggleCollapsed={() =>
                          toggleSectionCollapsed(section.id)
                        }
                        onMoveUp={() => onMoveSection(section.id, -1)}
                        onMoveDown={() => onMoveSection(section.id, 1)}
                        onAddAbove={() => onInsertSection(section.id, "above")}
                        onAddBelow={() => onInsertSection(section.id, "below")}
                        onDelete={() => handleDeleteSection(section)}
                      >
                        {!collapsed && (
                          <OutlineConnector size="section" />
                        )}
                        {!collapsed && section.items.length === 0 && (
                          <OutlineEmptySectionSlot
                            droppableId={`end:${section.id}`}
                            isDropActive={
                              activeDrag?.kind === "question" &&
                              overDroppableId === `end:${section.id}`
                            }
                            onCreateQuestion={(kind) =>
                              onCreateQuestion(kind, section.id)
                            }
                          />
                        )}
                        {section.items.map((item, itemIndex) => (
                          <div key={item.bankId}>
                            {itemIndex > 0 && (
                              <OutlineConnector size="item" />
                            )}
                            {renderQuestionCard(item)}
                          </div>
                        ))}
                        {!collapsed && section.items.length > 0 && (
                          <>
                            <OutlineConnector size="item" />
                            <OutlineAddQuestionRow
                              droppableId={`end:${section.id}`}
                              isDropActive={
                                activeDrag?.kind === "question" &&
                                overDroppableId === `end:${section.id}`
                              }
                              onCreateQuestion={(kind) =>
                                onCreateQuestion(kind, section.id)
                              }
                            />
                          </>
                        )}
                      </OutlineSectionBlock>
                    </div>
                  );
                })
              : (
                <>
                  {(preview.flat ?? []).map((item, index) => (
                    <div key={item.bankId}>
                      {(index > 0 || showIntro) && (
                        <OutlineConnector
                          size={index === 0 ? "section" : "item"}
                        />
                      )}
                      {renderQuestionCard(item)}
                    </div>
                  ))}
                  {(preview.flat ?? []).length > 0 && (
                    <>
                      <OutlineConnector size="item" />
                      <OutlineAddQuestionRow
                        droppableId={FLAT_END_ID}
                        isDropActive={
                          activeDrag?.kind === "question" &&
                          overDroppableId === FLAT_END_ID
                        }
                        onCreateQuestion={(kind) => onCreateQuestion(kind, null)}
                      />
                    </>
                  )}
                </>
              )}
            {showAddSectionGhost ? (
              <>
                <OutlineConnector size="section" />
                <OutlineAddSectionGhost onClick={onAddSection} />
              </>
            ) : null}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeQuestion ? (
              <div
                className={styles.dragCard}
                style={overlayWidth ? { width: overlayWidth } : undefined}
              >
                <QuestionRowContent question={activeQuestion} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
      </ScrollArea>
      <SectionDeleteDialog
        open={sectionDelete != null}
        displayTitle={sectionDelete?.displayTitle ?? "this section"}
        questionCount={sectionDelete?.questionCount ?? 0}
        onConfirm={() => {
          if (!sectionDelete) return;
          onDeleteSection(sectionDelete.id);
          setSectionDelete(null);
        }}
        onCancel={() => setSectionDelete(null)}
      />
    </>
  );
}
