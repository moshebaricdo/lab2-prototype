import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Button, Tag, Tooltip } from "@moshebaricdo/cads-react";
import { FaIcon } from "@moshebaricdo/cads-react/icons";
import type { UnitOption } from "../../../../lib/assessmentBuilder";
import type { QuestionItem } from "../../../../types/assessmentBuilder";
import { QuestionItemEditor } from "./QuestionItemEditor";
import { questionKindMeta } from "./questionKindMeta";
import styles from "./OutlineQuestionCard.module.scss";

/** Provenance of the outline entry — drives the save affordances. */
export type OutlineRefType = "bank" | "inline";

interface QuestionRowContentProps {
  question: QuestionItem;
  /** Hide the grab affordance (expanded rows, drag overlay still shows it). */
  showHandle?: boolean;
  dragHandleProps?: Record<string, unknown>;
  actions?: React.ReactNode;
}

/**
 * Collapsed row anatomy: type icon (drag handle) · internal name · stem
 * peek · outlined edit · minus. Also rendered inside the drag overlay.
 */
export function QuestionRowContent({
  question,
  showHandle = true,
  dragHandleProps,
  actions,
}: QuestionRowContentProps) {
  const meta = questionKindMeta(question);
  const icon = <FaIcon name={meta.iconName} size="small" />;
  return (
    <div className={styles.row}>
      {showHandle ? (
        <Tooltip title={meta.label} placement="top">
          <button
            type="button"
            className={styles.kindHandle}
            aria-label={`Reorder ${meta.label}`}
            onClick={(event) => event.stopPropagation()}
            {...dragHandleProps}
          >
            {icon}
          </button>
        </Tooltip>
      ) : (
        <span className={styles.kindIcon} aria-label={meta.label}>
          {icon}
        </span>
      )}
      <span className={styles.name}>{question.title}</span>
      <span className={styles.stem}>{question.item.content.prompt.trim()}</span>
      {actions}
    </div>
  );
}

interface OutlineQuestionCardProps {
  question: QuestionItem;
  expanded: boolean;
  /** Card is the active drag source (rendered as placeholder). */
  isDragSource: boolean;
  dirty: boolean;
  refType: OutlineRefType;
  graded: boolean;
  courseOptions: Array<{ value: string; label: string }>;
  domainOptions: Array<{ value: string; label: string }>;
  unitOptions: UnitOption[];
  onExpand: () => void;
  onRequestSave: () => void;
  onDiscard: () => void;
  onAddToBank: () => void;
  onRemove: () => void;
  onUpdateQuestion: (question: QuestionItem) => void;
  setCardRef: (node: HTMLDivElement | null) => void;
}

export function OutlineQuestionCard({
  question,
  expanded,
  isDragSource,
  dirty,
  refType,
  graded,
  courseOptions,
  domainOptions,
  unitOptions,
  onExpand,
  onRequestSave,
  onDiscard,
  onAddToBank,
  onRemove,
  onUpdateQuestion,
  setCardRef,
}: OutlineQuestionCardProps) {
  const dndId = `q:${question.bankId}`;
  const { attributes, listeners, setNodeRef: setDraggableRef } = useDraggable({
    id: dndId,
    disabled: expanded,
  });
  const { setNodeRef: setDroppableRef } = useDroppable({ id: dndId });

  const setNode = (node: HTMLDivElement | null) => {
    setDraggableRef(node);
    setDroppableRef(node);
    setCardRef(node);
  };

  const collapsedActions = (
    <div className={styles.actions}>
      <Tooltip title="Edit question" placement="top">
        <Button
          variant="outlined"
          color="secondary"
          size="extraSmall"
          iconOnly
          startIconName="pencil"
          aria-label="Edit question"
          onClick={(event) => {
            event.stopPropagation();
            onExpand();
          }}
        />
      </Tooltip>
      <Tooltip title="Remove from assessment" placement="top">
        <Button
          variant="text"
          color="tertiary"
          size="extraSmall"
          iconOnly
          startIconName="minus"
          aria-label="Remove question"
          className={styles.removeButton}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
        />
      </Tooltip>
    </div>
  );

  return (
    <div
      ref={setNode}
      className={[
        styles.card,
        expanded ? styles.cardExpanded : "",
        isDragSource ? styles.cardPlaceholder : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className={expanded ? styles.rowShell : styles.rowShellClickable}
        onClick={expanded ? undefined : onExpand}
      >
        <QuestionRowContent
          question={question}
          showHandle={!expanded}
          dragHandleProps={{ ...listeners, ...attributes }}
          actions={collapsedActions}
        />
      </div>
      {expanded && !isDragSource && (
        <>
          <div className={styles.editor}>
            <QuestionItemEditor
              question={question}
              graded={graded}
              courseOptions={courseOptions}
              domainOptions={domainOptions}
              unitOptions={unitOptions}
              p0Aligned
              onUpdateQuestion={onUpdateQuestion}
            />
          </div>
          <div className={styles.footer}>
            <div className={styles.provenance}>
              <Tag
                size="small"
                color="neutral"
                startIconName={
                  refType === "bank" ? "clipboard-question" : "file"
                }
                label={
                  refType === "bank" ? "Shared question" : "This assessment only"
                }
              />
              {refType === "inline" && (
                <Button
                  variant="text"
                  color="secondary"
                  size="extraSmall"
                  startIconName="clipboard-question"
                  onClick={onAddToBank}
                >
                  Add to question bank
                </Button>
              )}
            </div>
            <div className={styles.footerActions}>
              {dirty ? (
                <>
                  <Button
                    variant="text"
                    color="secondary"
                    size="small"
                    onClick={onDiscard}
                  >
                    Discard changes
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={onRequestSave}
                  >
                    Save
                  </Button>
                </>
              ) : (
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  onClick={onRequestSave}
                >
                  Done
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
