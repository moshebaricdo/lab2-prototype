import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Dropdown } from "@moshebaricdo/cads-react";
import { FaIcon } from "../../../ui/icons/FaIcon";
import styles from "./OutlineSectionBlock.module.scss";

function questionCountLabel(count: number): string {
  if (count === 0) return "No questions";
  return count === 1 ? "1 question" : `${count} questions`;
}

interface SectionHeaderContentProps {
  displayTitle: string;
  sectionNumber: number;
  questionCount: number;
  collapsed: boolean;
  onToggleCollapsed?: () => void;
  actions?: React.ReactNode;
}

/** Header row (chevron · number · title · count · overflow). Reused by the drag overlay. */
export function SectionHeaderContent({
  displayTitle,
  sectionNumber,
  questionCount,
  collapsed,
  onToggleCollapsed,
  actions,
}: SectionHeaderContentProps) {
  return (
    <>
      <button
        type="button"
        className={styles.chevron}
        aria-label={collapsed ? "Expand section" : "Collapse section"}
        aria-expanded={!collapsed}
        onClick={onToggleCollapsed}
      >
        <FaIcon name={collapsed ? "chevron-right" : "chevron-down"} size="xs" aria-hidden />
      </button>
      <span className={styles.index}>{sectionNumber}</span>
      <span className={styles.title}>{displayTitle}</span>
      <span className={styles.count}>{questionCountLabel(questionCount)}</span>
      {actions}
    </>
  );
}

interface OutlineSectionBlockProps {
  sectionId: string;
  displayTitle: string;
  /** 1-based page number (drives `page.item` numbering). */
  sectionNumber: number;
  questionCount: number;
  collapsed: boolean;
  isFirst: boolean;
  isLast: boolean;
  /** Section is the active drag source (placeholder styling). */
  isDragSource: boolean;
  /** A dragged question is hovering this section as an append target. */
  isQuestionDropTarget: boolean;
  onToggleCollapsed: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUngroup: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}

/**
 * Sections are pages, not heavy cards: a slim header row plus a left rail
 * grouping the question cards beneath. Expanded sections reorder via the
 * overflow menu; collapsing one turns the header into a draggable row.
 */
export function OutlineSectionBlock({
  sectionId,
  displayTitle,
  sectionNumber,
  questionCount,
  collapsed,
  isFirst,
  isLast,
  isDragSource,
  isQuestionDropTarget,
  onToggleCollapsed,
  onMoveUp,
  onMoveDown,
  onUngroup,
  onDelete,
  children,
}: OutlineSectionBlockProps) {
  const dndId = `sec:${sectionId}`;
  const { attributes, listeners, setNodeRef: setDraggableRef } = useDraggable({
    id: dndId,
    disabled: !collapsed,
  });
  const { setNodeRef: setDroppableRef } = useDroppable({ id: dndId });

  const setHeaderNode = (node: HTMLDivElement | null) => {
    setDraggableRef(node);
    setDroppableRef(node);
  };

  const menu = (
    <div className={styles.menu}>
      <Dropdown
        role="action"
        size="extraSmall"
        menuPlacement="bottomRight"
        buttonVariant="text"
        buttonColor="tertiary"
        iconOnly
        startIconName="ellipsis"
        aria-label={`${displayTitle} options`}
        options={[
          { value: "up", label: "Move up", iconName: "arrow-up", disabled: isFirst },
          { value: "down", label: "Move down", iconName: "arrow-down", disabled: isLast },
          { type: "separator" },
          { value: "ungroup", label: "Ungroup section", iconName: "object-ungroup" },
          { value: "delete", label: "Delete section", iconName: "trash-can", destructive: true },
        ]}
        onAction={(action) => {
          if (action === "up") onMoveUp();
          if (action === "down") onMoveDown();
          if (action === "ungroup") onUngroup();
          if (action === "delete") onDelete();
        }}
      />
    </div>
  );

  return (
    <section
      className={[
        styles.block,
        collapsed ? styles.blockCollapsed : "",
        isDragSource ? styles.blockPlaceholder : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={displayTitle}
    >
      <div
        ref={setHeaderNode}
        className={[
          styles.header,
          collapsed ? styles.headerCollapsed : "",
          isQuestionDropTarget ? styles.headerDropActive : "",
        ]
          .filter(Boolean)
          .join(" ")}
        {...(collapsed ? { ...listeners, ...attributes } : {})}
      >
        <SectionHeaderContent
          displayTitle={displayTitle}
          sectionNumber={sectionNumber}
          questionCount={questionCount}
          collapsed={collapsed}
          onToggleCollapsed={onToggleCollapsed}
          actions={menu}
        />
      </div>
      {!collapsed && <div className={styles.body}>{children}</div>}
    </section>
  );
}
