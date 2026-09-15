import { useDroppable } from "@dnd-kit/core";
import { Dropdown, Tooltip } from "@moshebari/cads-react";
import { FaIcon } from "@moshebari/cads-react/icons";
import styles from "./OutlineSectionBlock.module.scss";

interface SectionHeaderContentProps {
  sectionNumber: number;
  questionCount: number;
  collapsed: boolean;
  onToggleCollapsed?: () => void;
  actions?: React.ReactNode;
}

/** Header row (collapse · Section N · count · kebab). */
export function SectionHeaderContent({
  sectionNumber,
  questionCount,
  collapsed,
  onToggleCollapsed,
  actions,
}: SectionHeaderContentProps) {
  const countLabel = `${questionCount} question${questionCount === 1 ? "" : "s"}`;

  return (
    <>
      <Tooltip
        title={collapsed ? "Expand" : "Collapse"}
        placement="left"
      >
        <button
          type="button"
          className={styles.collapseHit}
          aria-label={collapsed ? "Expand section" : "Collapse section"}
          aria-expanded={!collapsed}
          onClick={onToggleCollapsed}
        >
          <span className={styles.collapse} aria-hidden>
            <FaIcon
              name={collapsed ? "arrows-from-line" : "arrows-to-line"}
              size="extraSmall"
            />
          </span>
          <span className={styles.overline}>Section {sectionNumber}</span>
          <span className={styles.dot} aria-hidden />
          <span className={styles.count}>{countLabel}</span>
        </button>
      </Tooltip>
      <span className={styles.headerSpacer} />
      {actions}
    </>
  );
}

interface OutlineSectionBlockProps {
  sectionId: string;
  displayTitle: string;
  sectionNumber: number;
  questionCount: number;
  collapsed: boolean;
  isFirst: boolean;
  isLast: boolean;
  isQuestionDropTarget: boolean;
  onToggleCollapsed: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAddAbove: () => void;
  onAddBelow: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}

export function OutlineSectionBlock({
  sectionId,
  displayTitle,
  sectionNumber,
  questionCount,
  collapsed,
  isFirst,
  isLast,
  isQuestionDropTarget,
  onToggleCollapsed,
  onMoveUp,
  onMoveDown,
  onAddAbove,
  onAddBelow,
  onDelete,
  children,
}: OutlineSectionBlockProps) {
  const { setNodeRef: setDroppableRef } = useDroppable({ id: `sec:${sectionId}` });

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
          { value: "above", label: "Add section above", iconName: "arrow-up-to-line" },
          { value: "below", label: "Add section below", iconName: "arrow-down-to-line" },
          { type: "separator" },
          { value: "up", label: "Move section up", iconName: "arrow-up", disabled: isFirst },
          { value: "down", label: "Move section down", iconName: "arrow-down", disabled: isLast },
          { type: "separator" },
          { value: "delete", label: "Delete section", iconName: "trash-can", destructive: true },
        ]}
        onAction={(action) => {
          if (action === "above") onAddAbove();
          if (action === "below") onAddBelow();
          if (action === "up") onMoveUp();
          if (action === "down") onMoveDown();
          if (action === "delete") onDelete();
        }}
      />
    </div>
  );

  return (
    <section className={styles.block} aria-label={displayTitle}>
      <div
        ref={setDroppableRef}
        className={[
          styles.header,
          isQuestionDropTarget ? styles.headerDropActive : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <SectionHeaderContent
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
