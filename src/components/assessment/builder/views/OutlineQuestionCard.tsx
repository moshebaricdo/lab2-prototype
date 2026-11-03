import { useLayoutEffect, useRef, useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Button, Dropdown, Tabs } from "@moshebari/cads-react";
import type { DropdownOption } from "@moshebari/cads-react";
import { FaIcon } from "@moshebari/cads-react/icons";
import type { UnitOption } from "../../../../lib/assessmentBuilder";
import { newQuestionHeaderLabel } from "../../../../lib/assessmentBuilder";
import type { QuestionItem } from "../../../../types/assessmentBuilder";
import { QuestionItemEditor } from "./QuestionItemEditor";
import { outlineMenuDropdownProps } from "./outlineMenu";
import { questionKindMeta } from "./questionKindMeta";
import { OutlineUnsavedTag } from "./OutlineUnsavedTag";
import styles from "./OutlineQuestionCard.module.scss";

export type OutlineRefType = "bank" | "inline";
export type QuestionEditorTab = "question" | "answers" | "usage";

export interface QuestionPageOption {
  sectionId: string;
  label: string;
  /** True when this is the question's current page. */
  current?: boolean;
}

interface QuestionRowContentProps {
  question: QuestionItem;
  showHandle?: boolean;
  /** Drag overlay: grip stays visible and actions stay hidden. */
  forceGrip?: boolean;
  actions?: React.ReactNode;
}

/**
 * Collapsed row: type icon · internal name · stem peek · unsaved warning ·
 * overflow · outlined pencil. Hover and drag swap the type icon
 * for a grip. Expanded: type icon and chevron-up.
 */
export function QuestionRowContent({
  question,
  showHandle = true,
  forceGrip = false,
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
          <span
            className={[
              styles.kindSlot,
              forceGrip ? styles.kindSlotGrip : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-label={`Reorder ${meta.label}`}
          >
            <span className={styles.kindType}>{icon}</span>
            <span className={styles.kindGrip} aria-hidden="true">
              <FaIcon name="grip-vertical" size="small" />
            </span>
          </span>
        ) : (
          <span className={styles.kindIcon} aria-label={meta.label}>
            {icon}
          </span>
        )}
        <span className={styles.preview}>
          <span className={styles.name}>{name}</span>
          {stem ? <span className={styles.dot} aria-hidden /> : null}
          <span className={styles.stem}>{stem}</span>
        </span>
      </div>
      {actions}
    </div>
  );
}

interface OutlineQuestionCardProps {
  question: QuestionItem;
  expanded: boolean;
  isDragSource: boolean;
  dirty: boolean;
  graded: boolean;
  /** First in its page (or flat list) — disables Move up. */
  isFirst: boolean;
  /** Last in its page (or flat list) — disables Move down. */
  isLast: boolean;
  /** Other pages for Move to page. Empty / single-page → section omitted. */
  pageOptions?: QuestionPageOption[];
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
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveToPage: (sectionId: string) => void;
  /** Exclusive outline overflow. Omitted when the card is rendered alone. */
  menuId?: string;
  menuOpen?: boolean;
  onMenuOpenChange?: (open: boolean) => void;
  onUpdateQuestion: (question: QuestionItem) => void;
  setCardRef: (node: HTMLDivElement | null) => void;
  /** Nested in a page: item radius. At the root (no pages): page radius, to match intro. */
  inPage?: boolean;
}

export function OutlineQuestionCard({
  question,
  expanded,
  isDragSource,
  dirty,
  graded,
  isFirst,
  isLast,
  pageOptions = [],
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
  onMoveUp,
  onMoveDown,
  onMoveToPage,
  menuId,
  menuOpen,
  onMenuOpenChange,
  onUpdateQuestion,
  setCardRef,
  inPage = false,
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
  const removeLabel = neverSaved ? "Discard" : "Remove from quiz";
  const headerLabel = neverSaved
    ? newQuestionHeaderLabel(question)
    : question.title;
  const otherPages = pageOptions.filter((page) => page.current !== true);

  const menuOptions: DropdownOption[] = [
    {
      value: "up",
      label: "Move question up",
      iconName: "arrow-up",
      disabled: isFirst,
    },
    {
      value: "down",
      label: "Move question down",
      iconName: "arrow-down",
      disabled: isLast,
    },
    ...(otherPages.length > 0
      ? ([
          { type: "separator" },
          { type: "group", label: "Move to page" },
          ...otherPages.map((page) => ({
            value: `to:${page.sectionId}`,
            label: page.label,
          })),
        ] as DropdownOption[])
      : []),
    { type: "separator" },
    {
      value: "remove",
      label: removeLabel,
      iconName: "trash-can",
      destructive: true,
    },
  ];

  const handleMenuAction = (action: string) => {
    if (action === "up") onMoveUp();
    if (action === "down") onMoveDown();
    if (action === "remove") {
      if (neverSaved) onDiscard();
      else onRemove();
      return;
    }
    if (action.startsWith("to:")) onMoveToPage(action.slice(3));
  };

  // Stop the drag handle from seeing the press. Leave `click` alone so it
  // reaches the document — CADS menus close on click-away, and stopping
  // the click here left every other overflow menu open.
  const stopDrag = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
  };

  const collapsedActions = (
    <div className={styles.actions}>
      {dirty && !expanded ? <OutlineUnsavedTag title="Unsaved changes" /> : null}
      <span
        className={styles.menuWrap}
        data-outline-menu={menuId}
        onPointerDown={stopDrag}
      >
        <Dropdown
          role="action"
          size="extraSmall"
          menuPlacement="bottomRight"
          buttonVariant="text"
          buttonColor="tertiary"
          iconOnly
          startIconName="ellipsis"
          aria-label={`${headerLabel || "Question"} options`}
          options={menuOptions}
          onAction={handleMenuAction}
          {...outlineMenuDropdownProps({ menuOpen, onMenuOpenChange })}
        />
      </span>
      <Button
        variant="outlined"
        color="secondary"
        size="extraSmall"
        iconOnly
        startIconName={expanded ? "chevron-up" : "pencil"}
        aria-label={expanded ? "Collapse question" : "Edit question"}
        aria-expanded={expanded}
        onPointerDown={stopDrag}
        onClick={() => {
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
        inPage ? styles.cardInPage : "",
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
