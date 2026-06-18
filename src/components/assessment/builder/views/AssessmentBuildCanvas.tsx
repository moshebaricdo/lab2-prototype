import { useState } from "react";
import { AppButton } from "../../../ui/AppButton";
import { FaIcon } from "../../../ui/icons/FaIcon";
import type { FaIconName } from "../../../../icons/faProRegularCodepoints";
import { ScrollArea } from "../../../ui/scroll-area";
import {
  questionKindLabel,
  type BlankQuestionKind,
} from "../../../../lib/assessmentBuilder";
import type {
  AssessmentArtifact,
  QuestionItem,
} from "../../../../types/assessmentBuilder";
import styles from "./AssessmentBuildCanvas.module.scss";

interface AssessmentBuildCanvasProps {
  artifact: AssessmentArtifact;
  /** Resolved questions in assessment order (one per question ref). */
  questions: QuestionItem[];
  selectedBankId: string | null;
  graded: boolean;
  onEditQuestion: (bankId: string) => void;
  onCloseQuestion: () => void;
  onRemoveQuestion: (index: number) => void;
  onReorderQuestion: (fromIndex: number, toIndex: number) => void;
  onOpenBank: () => void;
  onAddOneOff: (kind: BlankQuestionKind) => void;
}

interface QuestionKindBadge {
  label: string;
  iconName: FaIconName;
}

interface CreateQuestionTile {
  kind: BlankQuestionKind;
  label: string;
  iconName: FaIconName;
  tone: "green" | "orange" | "purple" | "red" | "blue";
}

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
  switch (question.item.kind) {
    case "multi":
      return { label: "Multiple Choice", iconName: "list" };
    case "freeResponse":
      return { label: "Free Response", iconName: "comment" };
    case "match":
      return { label: "Matching", iconName: "cards" };
    case "dragDrop":
      return { label: "Drag & Drop", iconName: "hand" };
    case "fillInBlank":
      return { label: "Fill in the Blank", iconName: "input-text" };
  }
}

export function AssessmentBuildCanvas({
  artifact,
  questions,
  selectedBankId,
  graded,
  onEditQuestion,
  onCloseQuestion,
  onRemoveQuestion,
  onReorderQuestion,
  onOpenBank,
  onAddOneOff,
}: AssessmentBuildCanvasProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const totalPoints = questions.reduce(
    (sum, question) => sum + (question.points ?? 1),
    0,
  );

  const handleDrop = (target: number) => {
    if (dragIndex != null && dragIndex !== target) {
      onReorderQuestion(dragIndex, target);
    }
    setDragIndex(null);
    setOverIndex(null);
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
          <ul className={styles.list}>
            {questions.map((question, index) => {
              const expanded = selectedBankId === question.bankId;
              const badge = questionKindBadge(question);
              return (
                <li
                  key={`${question.bankId}-${index}`}
                  className={[
                    styles.card,
                    expanded ? styles.cardExpanded : "",
                    overIndex === index && dragIndex !== index
                      ? styles.cardDropTarget
                      : "",
                    dragIndex === index ? styles.cardDragging : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <div
                    className={styles.cardHeader}
                    draggable
                    onDragStart={() => setDragIndex(index)}
                    onDragEnd={() => {
                      setDragIndex(null);
                      setOverIndex(null);
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      if (overIndex !== index) setOverIndex(index);
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      handleDrop(index);
                    }}
                  >
                    <span className={styles.dragHandle} aria-hidden>
                      <FaIcon name="grip" size="s" />
                    </span>
                    <span className={styles.cardIndex}>{index + 1}</span>
                    <p className={styles.cardPrompt}>{questionPrompt(question)}</p>
                    <span className={styles.typeBadge}>
                      <FaIcon name={badge.iconName} size="xs" aria-hidden />
                      {badge.label}
                    </span>
                    <div className={styles.cardActions}>
                      {expanded ? (
                        <AppButton
                          variant="secondary"
                          tone="gray"
                          size="xs"
                          iconName="floppy-disk"
                          aria-label="Save question"
                          onClick={onCloseQuestion}
                        />
                      ) : (
                        <AppButton
                          variant="secondary"
                          tone="gray"
                          size="xs"
                          iconName="pen-to-square"
                          aria-label="Edit question"
                          onClick={() => onEditQuestion(question.bankId)}
                        />
                      )}
                      <AppButton
                        variant="secondary"
                        tone="gray"
                        size="xs"
                        iconName="circle-minus"
                        aria-label="Remove question"
                        className={styles.deleteButton}
                        onClick={() => onRemoveQuestion(index)}
                      />
                    </div>
                  </div>
                  {expanded && (
                    <div className={styles.cardEditor}>
                      <p className={styles.editorHint}>
                        Edit question fields in the Question Editor panel.
                      </p>
                      <p className={styles.editorMeta}>
                        {questionKindLabel(question)}
                        {question.title ? ` · ${question.title}` : ""}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div
          className={styles.addDropZone}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            onOpenBank();
          }}
        >
          <p className={styles.addDropZoneLabel}>
            Add a question from the bank or create a new one:
          </p>
          <button
            type="button"
            className={styles.bankLink}
            onClick={onOpenBank}
          >
            Drop a question from the bank here
          </button>
          <div className={styles.typeGrid}>
            {CREATE_QUESTION_TILES.map((tile) => (
              <button
                key={tile.kind}
                type="button"
                className={styles.typeTile}
                onClick={() => onAddOneOff(tile.kind)}
              >
                <span
                  className={[styles.typeTileIcon, styles[`tone${tile.tone}`]]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <FaIcon name={tile.iconName} size="m" aria-hidden />
                </span>
                <span className={styles.typeTileLabel}>{tile.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
