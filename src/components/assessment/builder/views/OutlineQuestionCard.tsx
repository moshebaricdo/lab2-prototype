import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Button, Tag, Tooltip } from "@moshebaricdo/cads-react";
import { FaIcon } from "../../../ui/icons/FaIcon";
import type { UnitOption } from "../../../../lib/assessmentBuilder";
import type { QuestionItem } from "../../../../types/assessmentBuilder";
import { QuestionItemEditor } from "./QuestionItemEditor";
import { questionKindMeta } from "./questionKindMeta";
import styles from "./OutlineQuestionCard.module.scss";

/** Provenance of the outline entry — drives the save affordances. */
export type OutlineRefType = "bank" | "inline";

interface QuestionRowContentProps {
  question: QuestionItem;
  outlineNumber: string;
  /** Hide the grab affordance (intro-style pinned rows, drag overlay). */
  showHandle?: boolean;
  dragHandleProps?: Record<string, unknown>;
  actions?: React.ReactNode;
}

/**
 * Collapsed row anatomy (locked spec): grab · index · type icon · internal
 * name · stem peek · actions. Also rendered inside the drag overlay.
 */
export function QuestionRowContent({
  question,
  outlineNumber,
  showHandle = true,
  dragHandleProps,
  actions,
}: QuestionRowContentProps) {
  const meta = questionKindMeta(question);
  return (
    <div className={styles.row}>
      {showHandle ? (
        <button
          type="button"
          className={styles.handle}
          aria-label="Reorder question"
          onClick={(event) => event.stopPropagation()}
          {...dragHandleProps}
        >
          <FaIcon name="grip-dots-vertical" size="s" aria-hidden />
        </button>
      ) : (
        <span className={styles.handleSpacer} aria-hidden />
      )}
      <span className={styles.index}>{outlineNumber}</span>
      <Tooltip title={meta.label} placement="top">
        <span className={styles.kindIcon} aria-label={meta.label}>
          <FaIcon name={meta.iconName} size="s" aria-hidden />
        </span>
      </Tooltip>
      <span className={styles.name}>{question.title}</span>
      <span className={styles.stem}>{question.item.content.prompt.trim()}</span>
      {actions}
    </div>
  );
}

interface OutlineQuestionCardProps {
  question: QuestionItem;
  outlineNumber: string;
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
  outlineNumber,
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
          variant="text"
          color="tertiary"
          size="extraSmall"
          iconOnly
          startIconName="pen-to-square"
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
          startIconName="trash-can"
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
          outlineNumber={outlineNumber}
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
