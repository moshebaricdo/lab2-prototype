import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type DraggableAttributes,
} from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { Button, Dropdown, Tag, Tooltip } from "@moshebaricdo/cads-react";
import { FaIcon } from "../../../ui/icons/FaIcon";
import type { FaIconName } from "../../../../icons/faProRegularCodepoints";
import { ScrollArea } from "../../../ui/scroll-area";
import type {
  BlankQuestionKind,
  UnitOption,
} from "../../../../lib/assessmentBuilder";
import type {
  AssessmentArtifact,
  QuestionItem,
} from "../../../../types/assessmentBuilder";
import { QuestionItemEditor } from "./QuestionItemEditor";
import styles from "./AssessmentBuildCanvas.module.scss";

interface AssessmentBuildCanvasProps {
  artifact: AssessmentArtifact;
  /** Resolved questions in assessment order (one per question ref). */
  questions: QuestionItem[];
  selectedBankId: string | null;
  graded: boolean;
  courseOptions: Array<{ value: string; label: string }>;
  getDomainOptionsForCourse: (courseId: string) => Array<{ value: string; label: string }>;
  getUnitOptionsForCourse?: (courseId: string) => UnitOption[];
  p0Aligned?: boolean;
  isQuestionDirty: boolean;
  onEditQuestion: (bankId: string) => void;
  onSaveForAssessment: () => void;
  onSaveToQuestionBank: () => void;
  onUpdateQuestion: (question: QuestionItem) => void;
  onRemoveQuestion: (index: number) => void;
  onReorderQuestion: (fromIndex: number, toIndex: number) => void;
  onOpenBank: () => void;
  onAddOneOff: (kind: BlankQuestionKind) => void;
}

type QuestionKindTone = "green" | "orange" | "purple" | "red" | "blue";

interface QuestionKindBadge {
  label: string;
  iconName: FaIconName;
  tone: QuestionKindTone;
}

interface CreateQuestionTile {
  kind: BlankQuestionKind;
  label: string;
  iconName: FaIconName;
  tone: QuestionKindTone;
}

const QUESTION_ITEM_KIND_TONES: Record<
  QuestionItem["item"]["kind"],
  QuestionKindTone
> = {
  multi: "orange",
  freeResponse: "green",
  match: "purple",
  dragDrop: "red",
  fillInBlank: "blue",
};

const CREATE_QUESTION_TILES: CreateQuestionTile[] = [
  {
    kind: "freeResponse",
    label: "Free Response",
    iconName: "comment",
    tone: "green",
  },
  {
    kind: "multiSingle",
    label: "Multiple Choice",
    iconName: "list",
    tone: "orange",
  },
  {
    kind: "match",
    label: "Matching",
    iconName: "cards",
    tone: "purple",
  },
  {
    kind: "dragDropParsons",
    label: "Drag & Drop",
    iconName: "hand",
    tone: "red",
  },
  {
    kind: "fillInBlank",
    label: "Fill in the Blank",
    iconName: "input-text",
    tone: "blue",
  },
];

function questionPrompt(question: QuestionItem): string {
  return question.item.content.prompt;
}

function questionKindBadge(question: QuestionItem): QuestionKindBadge {
  const tone = QUESTION_ITEM_KIND_TONES[question.item.kind];
  switch (question.item.kind) {
    case "multi":
      return { label: "Multiple Choice", iconName: "list", tone };
    case "freeResponse":
      return { label: "Free Response", iconName: "comment", tone };
    case "match":
      return { label: "Matching", iconName: "cards", tone };
    case "dragDrop":
      return { label: "Drag & Drop", iconName: "hand", tone };
    case "fillInBlank":
      return { label: "Fill in the Blank", iconName: "input-text", tone };
  }
}

function reorderPreview<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex) return items;
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

interface QuestionCardHeaderProps {
  question: QuestionItem;
  sequenceNumber: number;
  badge: QuestionKindBadge;
  expanded: boolean;
  dragHandleListeners?: SyntheticListenerMap;
  dragHandleAttributes?: DraggableAttributes;
  showActions?: boolean;
  onEditQuestion?: (bankId: string) => void;
  onSaveForAssessment?: () => void;
  onSaveToQuestionBank?: () => void;
  onRemoveQuestion?: () => void;
}

function QuestionCardHeader({
  question,
  sequenceNumber,
  badge,
  expanded,
  dragHandleListeners,
  dragHandleAttributes,
  showActions = true,
  onEditQuestion,
  onSaveForAssessment,
  onSaveToQuestionBank,
  onRemoveQuestion,
}: QuestionCardHeaderProps) {
  return (
    <div className={styles.cardHeader}>
      <Button
        variant="text"
        color="tertiary"
        size="extraSmall"
        iconOnly
        startIconName="grip-vertical"
        aria-label="Reorder question"
        className={styles.dragHandle}
        {...dragHandleListeners}
        {...dragHandleAttributes}
      />
      <span className={styles.cardIndex}>{sequenceNumber}</span>
      <p className={styles.cardPrompt}>{questionPrompt(question)}</p>
      <Tooltip title={badge.label} placement="top">
        <span
          className={[styles.typeBadge, styles[`tone${badge.tone}`]]
            .filter(Boolean)
            .join(" ")}
          aria-label={badge.label}
        >
          <FaIcon name={badge.iconName} size="xs" aria-hidden />
        </span>
      </Tooltip>
      {showActions ? (
        <>
          <span className={styles.cardActionsDivider} aria-hidden />
          <div className={styles.cardActions}>
            {expanded ? (
              <Dropdown
                role="action"
                size="extraSmall"
                menuPlacement="bottomRight"
                buttonVariant="outlined"
                buttonColor="secondary"
                iconOnly
                startIconName="floppy-disk"
                aria-label="Save question"
                options={[
                  {
                    value: "save-assessment",
                    label: "Save for this assessment",
                    iconName: "floppy-disk",
                  },
                  {
                    value: "save-bank",
                    label: "Save to question bank",
                    iconName: "clipboard-question",
                  },
                ]}
                onAction={(actionValue) => {
                  if (actionValue === "save-assessment") onSaveForAssessment?.();
                  if (actionValue === "save-bank") onSaveToQuestionBank?.();
                }}
              />
            ) : (
              <Button
                variant="outlined"
                color="secondary"
                size="extraSmall"
                iconOnly
                startIconName="pen-to-square"
                aria-label="Edit question"
                onClick={() => onEditQuestion?.(question.bankId)}
              />
            )}
            <Button
              variant="text"
              color="tertiary"
              size="extraSmall"
              iconOnly
              startIconName="minus"
              aria-label="Remove question"
              className={styles.deleteButton}
              onClick={onRemoveQuestion}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

interface SortableQuestionCardProps {
  question: QuestionItem;
  displayIndex: number;
  expanded: boolean;
  isPlaceholder: boolean;
  graded: boolean;
  courseOptions: Array<{ value: string; label: string }>;
  domainOptions: Array<{ value: string; label: string }>;
  unitOptions: UnitOption[];
  p0Aligned: boolean;
  onEditQuestion: (bankId: string) => void;
  onSaveForAssessment: () => void;
  onSaveToQuestionBank: () => void;
  onUpdateQuestion: (question: QuestionItem) => void;
  onRemoveQuestion: () => void;
  setCardRef: (node: HTMLLIElement | null) => void;
}

function SortableQuestionCard({
  question,
  displayIndex,
  expanded,
  isPlaceholder,
  graded,
  courseOptions,
  domainOptions,
  unitOptions,
  p0Aligned,
  onEditQuestion,
  onSaveForAssessment,
  onSaveToQuestionBank,
  onUpdateQuestion,
  onRemoveQuestion,
  setCardRef,
}: SortableQuestionCardProps) {
  const badge = questionKindBadge(question);
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: question.bankId,
  });
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: question.bankId,
  });

  const setNode = (node: HTMLLIElement | null) => {
    setNodeRef(node);
    setDroppableRef(node);
    setCardRef(node);
  };

  return (
    <li
      ref={setNode}
      className={[
        styles.card,
        expanded ? styles.cardExpanded : "",
        isPlaceholder ? styles.cardPlaceholder : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <QuestionCardHeader
        question={question}
        sequenceNumber={displayIndex + 1}
        badge={badge}
        expanded={expanded}
        dragHandleListeners={listeners}
        dragHandleAttributes={attributes}
        onEditQuestion={onEditQuestion}
        onSaveForAssessment={onSaveForAssessment}
        onSaveToQuestionBank={onSaveToQuestionBank}
        onRemoveQuestion={onRemoveQuestion}
      />
      {expanded && !isPlaceholder && (
        <div className={styles.cardEditor}>
          <QuestionItemEditor
            question={question}
            graded={graded}
            courseOptions={courseOptions}
            domainOptions={domainOptions}
            unitOptions={unitOptions}
            p0Aligned={p0Aligned}
            onUpdateQuestion={onUpdateQuestion}
          />
        </div>
      )}
    </li>
  );
}

export function AssessmentBuildCanvas({
  artifact,
  questions,
  selectedBankId,
  graded,
  courseOptions,
  getDomainOptionsForCourse,
  getUnitOptionsForCourse,
  p0Aligned = false,
  isQuestionDirty,
  onEditQuestion,
  onSaveForAssessment,
  onSaveToQuestionBank,
  onUpdateQuestion,
  onRemoveQuestion,
  onReorderQuestion,
  onOpenBank,
  onAddOneOff,
}: AssessmentBuildCanvasProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [overlayWidth, setOverlayWidth] = useState<number | null>(null);
  const cardRefs = useRef<Map<string, HTMLLIElement>>(new Map());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  useEffect(() => {
    if (!selectedBankId) return;
    const node = cardRefs.current.get(selectedBankId);
    node?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedBankId]);

  const totalPoints = questions.reduce(
    (sum, question) => sum + (question.points ?? 1),
    0,
  );

  const displayQuestions = useMemo(() => {
    if (activeId == null || dragIndex == null || overIndex == null) {
      return questions;
    }
    if (dragIndex === overIndex) return questions;
    return reorderPreview(questions, dragIndex, overIndex);
  }, [activeId, dragIndex, overIndex, questions]);

  const activeQuestion = useMemo(
    () => questions.find((question) => question.bankId === activeId) ?? null,
    [activeId, questions],
  );

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    const index = questions.findIndex((question) => question.bankId === id);
    if (index === -1) return;

    const card = cardRefs.current.get(id);
    if (card) setOverlayWidth(card.offsetWidth);

    setActiveId(id);
    setDragIndex(index);
    setOverIndex(index);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) return;

    const nextOverIndex = questions.findIndex(
      (question) => question.bankId === over.id,
    );
    if (nextOverIndex === -1 || nextOverIndex === overIndex) return;
    setOverIndex(nextOverIndex);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const fromIndex = questions.findIndex(
        (question) => question.bankId === active.id,
      );
      const toIndex = questions.findIndex(
        (question) => question.bankId === over.id,
      );
      if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
        onReorderQuestion(fromIndex, toIndex);
      }
    }

    setActiveId(null);
    setDragIndex(null);
    setOverIndex(null);
    setOverlayWidth(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setDragIndex(null);
    setOverIndex(null);
    setOverlayWidth(null);
  };

  return (
    <ScrollArea className={styles.root}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <h1 className={styles.title}>{artifact.title}</h1>
          <p className={styles.stats}>
            {questions.length} Question{questions.length === 1 ? "" : "s"}
            {graded && questions.length > 0 && (
              <>
                <span className={styles.statsSep} aria-hidden>
                  •
                </span>
                {totalPoints} Point{totalPoints === 1 ? "" : "s"}
              </>
            )}
          </p>
        </header>

        {questions.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <ul className={styles.list}>
              {displayQuestions.map((question, displayIndex) => {
                const originalIndex = questions.findIndex(
                  (entry) => entry.bankId === question.bankId,
                );
                const expanded = selectedBankId === question.bankId;
                return (
                  <SortableQuestionCard
                    key={question.bankId}
                    question={question}
                    displayIndex={displayIndex}
                    expanded={expanded}
                    isPlaceholder={activeId === question.bankId}
                    graded={graded}
                    courseOptions={courseOptions}
                    domainOptions={getDomainOptionsForCourse(question.courseId)}
                    unitOptions={getUnitOptionsForCourse?.(question.courseId) ?? []}
                    p0Aligned={p0Aligned}
                    onEditQuestion={onEditQuestion}
                    onSaveForAssessment={onSaveForAssessment}
                    onSaveToQuestionBank={onSaveToQuestionBank}
                    onUpdateQuestion={onUpdateQuestion}
                    onRemoveQuestion={() => {
                      if (
                        expanded &&
                        isQuestionDirty &&
                        !window.confirm(
                          "Discard unsaved changes to this question?",
                        )
                      ) {
                        return;
                      }
                      onRemoveQuestion(originalIndex);
                    }}
                    setCardRef={(node) => {
                      if (node) cardRefs.current.set(question.bankId, node);
                      else cardRefs.current.delete(question.bankId);
                    }}
                  />
                );
              })}
            </ul>

            <DragOverlay dropAnimation={null}>
              {activeQuestion ? (
                <div
                  className={styles.dragOverlayCard}
                  style={overlayWidth ? { width: overlayWidth } : undefined}
                >
                  <QuestionCardHeader
                    question={activeQuestion}
                    sequenceNumber={
                      (overIndex ?? dragIndex ?? 0) + 1
                    }
                    badge={questionKindBadge(activeQuestion)}
                    expanded={false}
                    showActions={false}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        <div
          className={[
            styles.addDropZone,
            questions.length === 0 ? styles.addDropZoneEmpty : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            onOpenBank();
          }}
        >
          {questions.length === 0 ? (
            <>
              <div className={styles.bankCallout}>
                <span className={styles.bankCalloutIcon} aria-hidden>
                  <FaIcon name="clipboard-question" size="m" />
                </span>
                <div className={styles.bankCalloutBody}>
                  <div className={styles.bankCalloutHeading}>
                    <h2 className={styles.bankCalloutTitle}>
                      Add from question bank
                    </h2>
                    <Tag size="small" color="brand" label="Recommended" />
                  </div>
                  <p className={styles.bankCalloutText}>
                    Reuse existing questions so updates stay in sync across
                    assessments.
                  </p>
                </div>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  startIconName="clipboard-question"
                  onClick={onOpenBank}
                >
                  Browse question bank
                </Button>
              </div>

              <div className={styles.sectionDivider}>
                <span className={styles.sectionDividerLine} aria-hidden />
                <span className={styles.sectionDividerLabel}>OR</span>
                <span className={styles.sectionDividerLine} aria-hidden />
              </div>

              <div className={styles.createSection}>
                <p className={styles.createSectionLabel}>
                  Create a new question:
                </p>
                <div className={styles.typeGrid}>
                  {CREATE_QUESTION_TILES.map((tile) => (
                    <button
                      key={tile.kind}
                      type="button"
                      className={[
                        styles.typeTile,
                        styles[`tone${tile.tone}`],
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => onAddOneOff(tile.kind)}
                    >
                      <span className={styles.typeTileIcon}>
                        <FaIcon name={tile.iconName} size="m" aria-hidden />
                      </span>
                      <span className={styles.typeTileLabel}>
                        {tile.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <p className={styles.addDropZoneLabel}>
                Add a question from the bank or create a new one:
              </p>
              <div className={styles.typeGrid}>
                {CREATE_QUESTION_TILES.map((tile) => (
                  <button
                    key={tile.kind}
                    type="button"
                    className={[
                      styles.typeTile,
                      styles[`tone${tile.tone}`],
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => onAddOneOff(tile.kind)}
                  >
                    <span className={styles.typeTileIcon}>
                      <FaIcon name={tile.iconName} size="m" aria-hidden />
                    </span>
                    <span className={styles.typeTileLabel}>{tile.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
