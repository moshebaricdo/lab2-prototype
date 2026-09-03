import { useEffect, useRef, useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Button, Dropdown } from "@moshebaricdo/cads-react";
import { FaIcon } from "@moshebaricdo/cads-react/icons";
import styles from "./OutlineSectionBlock.module.scss";

interface SectionHeaderContentProps {
  sectionNumber: number;
  title?: string;
  collapsed: boolean;
  onToggleCollapsed?: () => void;
  onRenameTitle?: (title: string) => void;
  actions?: React.ReactNode;
}

/** Header row (collapse · Section N · title · pencil · overflow). Reused by the drag overlay. */
export function SectionHeaderContent({
  sectionNumber,
  title,
  collapsed,
  onToggleCollapsed,
  onRenameTitle,
  actions,
}: SectionHeaderContentProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(title ?? "");
  }, [title]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    onRenameTitle?.(draft);
  };

  return (
    <>
      <button
        type="button"
        className={styles.collapse}
        aria-label={collapsed ? "Expand section" : "Collapse section"}
        aria-expanded={!collapsed}
        onClick={onToggleCollapsed}
      >
        <FaIcon name="arrows-to-line" size="extraSmall" />
      </button>
      <span className={styles.overline}>Section {sectionNumber}</span>
      {editing && onRenameTitle ? (
        <input
          ref={inputRef}
          className={styles.titleInput}
          value={draft}
          aria-label="Section title"
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              setDraft(title ?? "");
              setEditing(false);
            }
          }}
        />
      ) : (
        <span className={styles.subtitle}>
          {title?.trim() || (onRenameTitle ? "Add title" : "")}
        </span>
      )}
      {onRenameTitle && !editing ? (
        <Button
          variant="text"
          color="tertiary"
          size="extraSmall"
          iconOnly
          startIconName="pencil"
          aria-label="Rename section"
          onClick={(event) => {
            event.stopPropagation();
            setEditing(true);
          }}
        />
      ) : null}
      <span className={styles.headerSpacer} />
      {actions}
    </>
  );
}

interface OutlineSectionBlockProps {
  sectionId: string;
  title?: string;
  displayTitle: string;
  sectionNumber: number;
  collapsed: boolean;
  isFirst: boolean;
  isLast: boolean;
  isDragSource: boolean;
  isQuestionDropTarget: boolean;
  onToggleCollapsed: () => void;
  onRenameTitle: (title: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUngroup: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}

/**
 * Section header + nested question cards. Collapse turns the header into a
 * draggable row; expanded sections reorder via the overflow menu.
 */
export function OutlineSectionBlock({
  sectionId,
  title,
  displayTitle,
  sectionNumber,
  collapsed,
  isFirst,
  isLast,
  isDragSource,
  isQuestionDropTarget,
  onToggleCollapsed,
  onRenameTitle,
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
        startIconName="ellipsis-vertical"
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
          sectionNumber={sectionNumber}
          title={title}
          collapsed={collapsed}
          onToggleCollapsed={onToggleCollapsed}
          onRenameTitle={onRenameTitle}
          actions={menu}
        />
      </div>
      {!collapsed && <div className={styles.body}>{children}</div>}
    </section>
  );
}
