import { useLayoutEffect, useRef, useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Button, Tabs, Tag, Tooltip } from "@moshebaricdo/cads-react";
import { FaIcon } from "@moshebaricdo/cads-react/icons";
import type { UnitOption } from "../../../../lib/assessmentBuilder";
import { newQuestionHeaderLabel } from "../../../../lib/assessmentBuilder";
import type { QuestionItem } from "../../../../types/assessmentBuilder";
import { QuestionItemEditor } from "./QuestionItemEditor";
import { questionKindMeta } from "./questionKindMeta";
import styles from "./OutlineQuestionCard.module.scss";

export type OutlineRefType = "bank" | "inline";
export type QuestionEditorTab = "question" | "answers" | "usage";

interface QuestionRowContentProps {
  question: QuestionItem;
  showHandle?: boolean;
  actions?: React.ReactNode;
}

/**
 * Collapsed row: type icon (drag handle) · internal name · stem peek ·
 * hover discard · unsaved warning · outlined pencil. Expanded: chevron-up.
 */
export function QuestionRowContent({
  question,
  showHandle = true,
  actions,
}: QuestionRowContentProps) {
  const meta = questionKindMeta(question);
  const icon = <FaIcon name={meta.iconName} size="small" />;
  const name = question.neverSaved
    ? newQuestionHeaderLabel(question)
    : question.title;
  const stem = question.neverSaved
    ? "Not saved yet"
    : question.item.content.prompt.trim();
  return (
    <div className={styles.row}>
      <div className={styles.topRow}>
        {showHandle ? (
          <span className={styles.kindHandle} aria-label={`Reorder ${meta.label}`}>
            {icon}
          </span>
        ) : (
          <span className={styles.kindIcon} aria-label={meta.label}>
            {icon}
          </span>
        )}
        <span className={styles.preview}>
          <span className={styles.name}>{name}</span>
          <span className={styles.stem}>{stem}</span>
        </span>
      </div>
      {actions}
    </div>
  );
}

function UnsavedChangesTag() {
  return (
    <Tooltip title="Unsaved changes" placement="top">
      <span
        className={styles.unsavedWrap}
        role="img"
        aria-label="Unsaved changes"
      >
        <Tag
          size="medium"
          color="warning"
          startIconName="triangle-exclamation"
          label=""
          className={styles.unsavedTag}
        />
      </span>
    </Tooltip>
  );
}

interface OutlineQuestionCardProps {
  question: QuestionItem;
  expanded: boolean;
  isDragSource: boolean;
  dirty: boolean;
  graded: boolean;
  courseOptions: Array<{ value: string; label: string }>;
  domainOptions: Array<{ value: string; label: string; code?: string }>;
  unitOptions: UnitOption[];
  currentQuizTitle: string;
  onExpand: () => void;
  onCollapse: () => void;
  onRequestSave: () => void;
  onDiscard: () => void;
  onCancelEdits: () => void;
  onRemove: () => void;
  onUpdateQuestion: (question: QuestionItem) => void;
  setCardRef: (node: HTMLDivElement | null) => void;
}

export function OutlineQuestionCard({
  question,
  expanded,
  isDragSource,
  dirty,
  graded,
  courseOptions,
  domainOptions,
  unitOptions,
  currentQuizTitle,
  onExpand,
  onCollapse,
  onRequestSave,
  onDiscard,
  onCancelEdits,
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
  const [tab, setTab] = useState<QuestionEditorTab>("question");
  const [suppressHoverReveal, setSuppressHoverReveal] = useState(false);
  const wasExpandedRef = useRef(expanded);

  useLayoutEffect(() => {
    if (wasExpandedRef.current && !expanded) {
      setSuppressHoverReveal(true);
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
    wasExpandedRef.current = expanded;
  }, [expanded]);

  const setNode = (node: HTMLDivElement | null) => {
    setDraggableRef(node);
    setDroppableRef(node);
    setCardRef(node);
  };

  const neverSaved = question.neverSaved === true;

  const stopRowInteraction = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
  };

  const collapsedActions = (
    <div className={styles.actions}>
      {expanded ? null : (
        <span className={styles.hoverAction}>
          <Tooltip title="Remove from quiz" placement="top">
            <Button
              variant="text"
              color="error"
              size="extraSmall"
              iconOnly
              startIconName="trash"
              aria-label={neverSaved ? "Discard question" : "Remove from quiz"}
              onPointerDown={stopRowInteraction}
              onClick={(event) => {
                event.stopPropagation();
                if (neverSaved) onDiscard();
                else onRemove();
              }}
            />
          </Tooltip>
        </span>
      )}
      {dirty && !expanded ? <UnsavedChangesTag /> : null}
      <Button
        variant="outlined"
        color="secondary"
        size="extraSmall"
        iconOnly
        startIconName={expanded ? "chevron-up" : "pencil"}
        aria-label={expanded ? "Collapse question" : "Edit question"}
        aria-expanded={expanded}
        onPointerDown={stopRowInteraction}
        onClick={(event) => {
          event.stopPropagation();
          if (expanded) onCollapse();
          else onExpand();
        }}
      />
    </div>
  );

  return (
    <div
      ref={setNode}
      className={[
        styles.card,
        expanded ? styles.cardExpanded : styles.cardCollapsed,
        isDragSource ? styles.cardPlaceholder : "",
        suppressHoverReveal ? styles.hoverSuppressed : "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...(expanded ? {} : { ...listeners, ...attributes })}
      onPointerLeave={() => setSuppressHoverReveal(false)}
    >
      <div className={styles.headerBar}>
        <QuestionRowContent
          question={question}
          showHandle={!expanded}
          actions={collapsedActions}
        />
      </div>
      {expanded && !isDragSource && (
        <>
          <div className={styles.tabs}>
            <Tabs
              type="primary"
              size="extraSmall"
              aria-label="Question editor"
              value={tab}
              onChange={(value) => setTab(value as QuestionEditorTab)}
              items={[
                { value: "question", label: "Question" },
                { value: "answers", label: "Answers" },
                {
                  value: "usage",
                  label: "Usage",
                  disabled: neverSaved,
                },
              ]}
            />
          </div>
          <div className={styles.editor}>
            <QuestionItemEditor
              question={question}
              graded={graded}
              courseOptions={courseOptions}
              domainOptions={domainOptions}
              unitOptions={unitOptions}
              p0Aligned
              activeTab={tab}
              currentQuizTitle={currentQuizTitle}
              onUpdateQuestion={onUpdateQuestion}
            />
          </div>
          <div className={styles.footer}>
            <div className={styles.provenance}>
              {neverSaved ? null : (
                <Button
                  variant="outlined"
                  color="error"
                  size="extraSmall"
                  onClick={onRemove}
                >
                  Remove from quiz
                </Button>
              )}
            </div>
            <div className={styles.footerActions}>
              {neverSaved ? (
                <>
                  <Button
                    variant="outlined"
                    color="error"
                    size="extraSmall"
                    onClick={onDiscard}
                  >
                    Discard
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    size="extraSmall"
                    startIconName="floppy-disk"
                    onClick={onRequestSave}
                  >
                    Save
                  </Button>
                </>
              ) : dirty ? (
                <>
                  <Button
                    variant="outlined"
                    color="secondary"
                    size="extraSmall"
                    onClick={onCancelEdits}
                  >
                    Discard changes
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    size="extraSmall"
                    startIconName="floppy-disk"
                    onClick={onRequestSave}
                  >
                    Save
                  </Button>
                </>
              ) : (
                <Button
                  variant="outlined"
                  color="secondary"
                  size="extraSmall"
                  onClick={onCollapse}
                >
                  Close
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
