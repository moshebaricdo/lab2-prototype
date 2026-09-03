import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { FaIcon } from "@moshebaricdo/cads-react/icons";
import { ScrollArea } from "../../../ui/scroll-area";
import {
  isSectioned,
  questionRefId,
  sectionDisplayTitle,
  type OutlineDropTarget,
  type UnitOption,
  type BlankQuestionKind,
} from "../../../../lib/assessmentBuilder";
import type {
  AssessmentArtifact,
  QuestionItem,
} from "../../../../types/assessmentBuilder";
import { OutlineIntroCard } from "./OutlineIntroCard";
import {
  OutlineAddIntroRow,
  OutlineConnector,
  OutlineEmptySectionSlot,
} from "./OutlineAddRow";
import {
  OutlineQuestionCard,
  QuestionRowContent,
  type OutlineRefType,
} from "./OutlineQuestionCard";
import {
  OutlineSectionBlock,
  SectionHeaderContent,
} from "./OutlineSectionBlock";
import styles from "./AssessmentOutlineCanvas.module.scss";

const FLAT_END_ID = "end:flat";

interface OutlineItemView {
  bankId: string;
  question: QuestionItem;
  refType: OutlineRefType;
}

interface OutlineSectionView {
  id: string;
  title?: string;
  displayTitle: string;
  items: OutlineItemView[];
}

type ActiveDrag =
  | { kind: "question"; bankId: string }
  | { kind: "section"; sectionId: string }
  | null;

function insertAt<T>(items: T[], index: number, item: T): T[] {
  const at = Math.max(0, Math.min(items.length, index));
  return [...items.slice(0, at), item, ...items.slice(at)];
}

interface AssessmentOutlineCanvasProps {
  artifact: AssessmentArtifact;
  /** bankId → resolved question, with the in-flight editing draft overlaid. */
  questionsById: Map<string, QuestionItem>;
  selectedBankId: string | null;
  isQuestionDirty: boolean;
  courseOptions: Array<{ value: string; label: string }>;
  getDomainOptionsForCourse: (courseId: string) => Array<{ value: string; label: string }>;
  getUnitOptionsForCourse: (courseId: string) => UnitOption[];
  onExpandQuestion: (bankId: string) => void;
  /** Close the editor without committing (Done when clean / Discard when dirty). */
  onCloseEditor: () => void;
  /** Single-save entry point — the workspace decides direct save vs prompt. */
  onRequestSave: () => void;
  onAddDraftToBank: () => void;
  onUpdateQuestion: (question: QuestionItem) => void;
  onRemoveQuestion: (bankId: string) => void;
  onMoveQuestion: (bankId: string, target: OutlineDropTarget) => void;
  onMoveSection: (sectionId: string, direction: -1 | 1) => void;
  onMoveSectionToIndex: (sectionId: string, index: number) => void;
  onRenameSection: (sectionId: string, title: string) => void;
  onUngroupSection: (sectionId: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onAddIntro: () => void;
  onRemoveIntro: () => void;
  onUpdateIntroContent: (content: string) => void;
  onAddFromBank: (sectionId: string) => void;
  onCreateQuestion: (kind: BlankQuestionKind, sectionId: string) => void;
}

/**
 * Block-based visual outline for the P0 builder: overview header, pinned
 * intro, sections-as-pages, question rows, and tick connectors.
 */
export function AssessmentOutlineCanvas({
  artifact,
  questionsById,
  selectedBankId,
  isQuestionDirty,
  courseOptions,
  getDomainOptionsForCourse,
  getUnitOptionsForCourse,
  onExpandQuestion,
  onCloseEditor,
  onRequestSave,
  onAddDraftToBank,
  onUpdateQuestion,
  onRemoveQuestion,
  onMoveQuestion,
  onMoveSection,
  onMoveSectionToIndex,
  onRenameSection,
  onUngroupSection,
  onDeleteSection,
  onAddIntro,
  onRemoveIntro,
  onUpdateIntroContent,
  onAddFromBank,
  onCreateQuestion,
}: AssessmentOutlineCanvasProps) {
  const sectioned = isSectioned(artifact);

  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [introExpanded, setIntroExpanded] = useState(false);
  const [activeDrag, setActiveDrag] = useState<ActiveDrag>(null);
  const [questionTarget, setQuestionTarget] = useState<OutlineDropTarget | null>(null);
  const [sectionTargetIndex, setSectionTargetIndex] = useState<number | null>(null);
  const [overDroppableId, setOverDroppableId] = useState<string | null>(null);
  const [overlayWidth, setOverlayWidth] = useState<number | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  useEffect(() => {
    if (!selectedBankId) return;
    const node = cardRefs.current.get(selectedBankId);
    node?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedBankId]);

  const baseSections = useMemo<OutlineSectionView[] | null>(() => {
    if (!sectioned) return null;
    return (artifact.sections ?? []).map((section, index) => ({
      id: section.id,
      title: section.title,
      displayTitle: sectionDisplayTitle(section, index),
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

    if (activeDrag?.kind === "section" && sections && sectionTargetIndex != null) {
      const from = sections.findIndex((entry) => entry.id === activeDrag.sectionId);
      if (from !== -1 && from !== sectionTargetIndex) {
        const next = [...sections];
        const [moved] = next.splice(from, 1);
        next.splice(Math.max(0, Math.min(next.length, sectionTargetIndex)), 0, moved);
        sections = next;
      }
    }

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
  }, [activeDrag, baseFlat, baseSections, questionTarget, sectionTargetIndex]);

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
    } else if (id.startsWith("sec:")) {
      const sectionId = id.slice(4);
      setActiveDrag({ kind: "section", sectionId });
      setSectionTargetIndex(
        (baseSections ?? []).findIndex((entry) => entry.id === sectionId),
      );
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

    if (overId.startsWith("sec:")) {
      const overIndex = (baseSections ?? []).findIndex(
        (entry) => entry.id === overId.slice(4),
      );
      if (overIndex !== -1) setSectionTargetIndex(overIndex);
    }
  };

  const resetDrag = () => {
    setActiveDrag(null);
    setQuestionTarget(null);
    setSectionTargetIndex(null);
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
    if (
      activeDrag?.kind === "section" &&
      sectionTargetIndex != null &&
      event.over
    ) {
      onMoveSectionToIndex(activeDrag.sectionId, sectionTargetIndex);
    }
    resetDrag();
  };

  const handleExpand = (bankId: string) => {
    if (
      selectedBankId &&
      selectedBankId !== bankId &&
      isQuestionDirty &&
      !window.confirm("Discard unsaved changes to the open question?")
    ) {
      return;
    }
    onExpandQuestion(bankId);
  };

  const handleRemove = (item: OutlineItemView) => {
    const expanded = selectedBankId === item.bankId;
    if (expanded && isQuestionDirty) {
      if (!window.confirm("Discard unsaved changes and remove this question?")) return;
    } else if (item.refType === "inline") {
      if (
        !window.confirm(
          "Remove this question? One-off questions aren't kept anywhere else.",
        )
      ) {
        return;
      }
    }
    onRemoveQuestion(item.bankId);
  };

  const handleDeleteSection = (section: OutlineSectionView) => {
    if (
      section.items.length > 0 &&
      !window.confirm(
        `Delete ${section.displayTitle} and its ${section.items.length} question${
          section.items.length === 1 ? "" : "s"
        }?`,
      )
    ) {
      return;
    }
    onDeleteSection(section.id);
  };

  const handleRemoveIntro = () => {
    if (
      artifact.intro?.overviewContent.trim() &&
      !window.confirm("Remove the intro screen? Its overview copy will be lost.")
    ) {
      return;
    }
    setIntroExpanded(false);
    onRemoveIntro();
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
      dirty={selectedBankId === item.bankId && isQuestionDirty}
      refType={item.refType}
      graded
      courseOptions={courseOptions}
      domainOptions={getDomainOptionsForCourse(item.question.courseId)}
      unitOptions={getUnitOptionsForCourse(item.question.courseId)}
      onExpand={() => handleExpand(item.bankId)}
      onRequestSave={onRequestSave}
      onDiscard={onCloseEditor}
      onAddToBank={onAddDraftToBank}
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

  const activeQuestion =
    activeDrag?.kind === "question"
      ? questionsById.get(activeDrag.bankId) ?? null
      : null;
  const activeSection =
    activeDrag?.kind === "section"
      ? preview.sections?.find((entry) => entry.id === activeDrag.sectionId) ?? null
      : null;
  const activeSectionNumber = activeSection
    ? (preview.sections?.findIndex((entry) => entry.id === activeSection.id) ?? 0) + 1
    : 0;

  const maxAttempts = artifact.attempts?.maxAttempts;
  const timeLimit = artifact.timing?.timeLimitMinutes;
  const showIntroGhost = artifact.mode === "exam" && !artifact.intro;

  return (
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
                name={maxAttempts == null ? "infinity" : "arrows-rotate"}
                size="small"
              />
              {maxAttempts == null
                ? "Unlimited attempts"
                : `${maxAttempts} attempt${maxAttempts === 1 ? "" : "s"}`}
            </span>
          </div>
        </header>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={resetDrag}
        >
          <div className={styles.outline}>
            {artifact.intro ? (
              <OutlineIntroCard
                overviewContent={artifact.intro.overviewContent}
                timeLimitMinutes={timeLimit}
                maxAttempts={maxAttempts}
                expanded={introExpanded}
                onExpand={() => setIntroExpanded(true)}
                onCollapse={() => setIntroExpanded(false)}
                onUpdateContent={onUpdateIntroContent}
                onRemove={handleRemoveIntro}
              />
            ) : (
              showIntroGhost && (
                <OutlineAddIntroRow
                  onClick={() => {
                    onAddIntro();
                    setIntroExpanded(true);
                  }}
                />
              )
            )}

            {preview.sections
              ? preview.sections.map((section, sectionIndex) => {
                  const collapsed = collapsedIds.has(section.id);
                  const showLeadConnector =
                    Boolean(artifact.intro) ||
                    showIntroGhost ||
                    sectionIndex > 0;
                  return (
                    <div key={section.id}>
                      {showLeadConnector && (
                        <OutlineConnector size="section" />
                      )}
                      <OutlineSectionBlock
                        sectionId={section.id}
                        title={section.title}
                        displayTitle={section.displayTitle}
                        sectionNumber={sectionIndex + 1}
                        collapsed={collapsed}
                        isFirst={sectionIndex === 0}
                        isLast={sectionIndex === preview.sections!.length - 1}
                        isDragSource={
                          activeDrag?.kind === "section" &&
                          activeDrag.sectionId === section.id
                        }
                        isQuestionDropTarget={
                          activeDrag?.kind === "question" &&
                          overDroppableId === `sec:${section.id}`
                        }
                        onToggleCollapsed={() =>
                          toggleSectionCollapsed(section.id)
                        }
                        onRenameTitle={(nextTitle) =>
                          onRenameSection(section.id, nextTitle)
                        }
                        onMoveUp={() => onMoveSection(section.id, -1)}
                        onMoveDown={() => onMoveSection(section.id, 1)}
                        onUngroup={() => onUngroupSection(section.id)}
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
                            onAddFromBank={() => onAddFromBank(section.id)}
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
                          <OutlineConnector
                            size="item"
                            droppableId={`end:${section.id}`}
                            isDropActive={
                              activeDrag?.kind === "question" &&
                              overDroppableId === `end:${section.id}`
                            }
                          />
                        )}
                      </OutlineSectionBlock>
                    </div>
                  );
                })
              : (
                <>
                  {(preview.flat ?? []).map((item, index) => (
                    <div key={item.bankId}>
                      {(index > 0 || artifact.intro || showIntroGhost) && (
                        <OutlineConnector
                          size={index === 0 ? "section" : "item"}
                        />
                      )}
                      {renderQuestionCard(item)}
                    </div>
                  ))}
                  {(preview.flat ?? []).length === 0 && (
                    <p className={styles.emptyHint}>
                      No questions yet — add one from the question bank or
                      create a new one.
                    </p>
                  )}
                  <OutlineConnector
                    size="section"
                    droppableId={FLAT_END_ID}
                    isDropActive={
                      activeDrag?.kind === "question" &&
                      overDroppableId === FLAT_END_ID
                    }
                  />
                </>
              )}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeQuestion ? (
              <div
                className={styles.dragCard}
                style={overlayWidth ? { width: overlayWidth } : undefined}
              >
                <QuestionRowContent question={activeQuestion} />
              </div>
            ) : activeSection ? (
              <div
                className={styles.dragSection}
                style={overlayWidth ? { width: overlayWidth } : undefined}
              >
                <SectionHeaderContent
                  sectionNumber={activeSectionNumber}
                  title={activeSection.title}
                  collapsed
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </ScrollArea>
  );
}
