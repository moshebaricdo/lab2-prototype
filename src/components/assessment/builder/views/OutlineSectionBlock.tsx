import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Button, Dropdown, Tooltip } from "@moshebari/cads-react";
import { FaIcon } from "@moshebari/cads-react/icons";
import styles from "./OutlineSectionBlock.module.scss";

/**
 * How a collapsed page renders. The builder ships `card`: a full-width
 * header bar in both states, a tinted well for open questions, and a
 * deck under a closed page that has questions. The other styles stay
 * for `/experiments/quiz-page-collapse`.
 */
export type CollapsedPageStyle =
  | "pill"
  | "closed"
  | "summary"
  | "deck"
  | "deckAnchored"
  | "card";

export type PagePillAlign = "center" | "start";

const PageMenuTrigger = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement>
>(function PageMenuTrigger({ className, ...props }, ref) {
  return (
    <button
      type="button"
      {...props}
      ref={ref}
      className={[styles.menuHit, className].filter(Boolean).join(" ")}
    >
      <FaIcon name="ellipsis-vertical" size="extraSmall" />
    </button>
  );
});

interface OutlineSectionBlockProps {
  sectionId: string;
  displayTitle: string;
  sectionNumber: number;
  questionCount: number;
  /** Question names, shown in the collapsed peek for `closed` / `summary` / `deck`. */
  questionTitles?: string[];
  collapsed: boolean;
  collapsedStyle?: CollapsedPageStyle;
  /** Where the header pill sits on the frame's top edge. */
  pillAlign?: PagePillAlign;
  isFirst: boolean;
  isLast: boolean;
  isQuestionDropTarget: boolean;
  onToggleCollapsed: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAddAbove: () => void;
  onAddBelow: () => void;
  onDelete: () => void;
  children: ReactNode;
}

export function OutlineSectionBlock({
  sectionId,
  displayTitle,
  sectionNumber,
  questionCount,
  questionTitles = [],
  collapsed,
  collapsedStyle = "card",
  pillAlign = "center",
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
  const countLabel = `${questionCount} question${questionCount === 1 ? "" : "s"}`;
  const peek = questionTitles.length > 0 ? questionTitles.join(", ") : "No questions yet";

  const menuOptions = [
    { value: "above", label: "Add page above", iconName: "arrow-up-to-line" },
    { value: "below", label: "Add page below", iconName: "arrow-down-to-line" },
    { type: "separator" },
    { value: "up", label: "Move page up", iconName: "arrow-up", disabled: isFirst },
    { value: "down", label: "Move page down", iconName: "arrow-down", disabled: isLast },
    { type: "separator" },
    { value: "delete", label: "Delete page", iconName: "trash-can", destructive: true },
  ] as const;

  const handleAction = (action: string) => {
    if (action === "above") onAddAbove();
    if (action === "below") onAddBelow();
    if (action === "up") onMoveUp();
    if (action === "down") onMoveDown();
    if (action === "delete") onDelete();
  };

  const collapseLabel = collapsed ? "Expand page" : "Collapse page";
  const collapseIcon = collapsed ? "arrows-from-line" : "arrows-to-line";

  if (collapsedStyle === "card") {
    return (
      <section className={styles.block} aria-label={displayTitle}>
        <div
          className={[
            styles.card,
            collapsed && questionCount > 0 ? styles.cardDeck : "",
            isQuestionDropTarget ? styles.cardDropActive : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div
            ref={setDroppableRef}
            className={[styles.cardHeader, collapsed ? "" : styles.cardHeaderOpen]
              .filter(Boolean)
              .join(" ")}
          >
            <button
              type="button"
              className={styles.cardHit}
              tabIndex={-1}
              aria-hidden
              onClick={onToggleCollapsed}
            >
              <span className={styles.summaryTitle}>Page {sectionNumber}</span>
              <span className={styles.dot} aria-hidden />
              <span className={styles.summaryCount}>{countLabel}</span>
            </button>
            <div className={styles.cardMenu}>
              <Dropdown
                role="action"
                size="extraSmall"
                menuPlacement="bottomRight"
                buttonVariant="text"
                buttonColor="tertiary"
                iconOnly
                startIconName="ellipsis"
                aria-label={`${displayTitle} options`}
                options={[...menuOptions]}
                onAction={handleAction}
              />
              <Button
                variant="outlined"
                color="secondary"
                size="extraSmall"
                iconOnly
                startIconName={collapsed ? "chevron-down" : "chevron-up"}
                aria-label={collapseLabel}
                aria-expanded={!collapsed}
                onClick={onToggleCollapsed}
              />
            </div>
          </div>
          {!collapsed && <div className={styles.cardBody}>{children}</div>}
        </div>
      </section>
    );
  }

  if (collapsed && (collapsedStyle === "summary" || collapsedStyle === "deck")) {
    return (
      <section className={styles.block} aria-label={displayTitle}>
        <div
          ref={setDroppableRef}
          className={[
            styles.summary,
            collapsedStyle === "deck" && questionCount > 0 ? styles.summaryDeck : "",
            isQuestionDropTarget ? styles.summaryDropActive : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <Tooltip title="Expand" placement="left">
            <button
              type="button"
              className={styles.summaryHit}
              aria-label={collapseLabel}
              aria-expanded={false}
              onClick={onToggleCollapsed}
            >
              <span className={styles.summaryIcon} aria-hidden>
                <FaIcon name={collapseIcon} size="extraSmall" />
              </span>
              <span className={styles.summaryTitle}>Page {sectionNumber}</span>
              <span className={styles.dot} aria-hidden />
              <span className={styles.summaryCount}>{countLabel}</span>
              <span className={styles.summaryPeek}>{peek}</span>
            </button>
          </Tooltip>
          <Dropdown
            role="action"
            size="extraSmall"
            menuPlacement="bottomRight"
            buttonVariant="text"
            buttonColor="secondary"
            iconOnly
            startIconName="ellipsis-vertical"
            aria-label={`${displayTitle} options`}
            options={[...menuOptions]}
            onAction={handleAction}
          />
        </div>
      </section>
    );
  }

  const anchoredDeck = collapsed && collapsedStyle === "deckAnchored";
  const keepFrame = !collapsed || collapsedStyle === "closed" || anchoredDeck;

  return (
    <section className={styles.block} aria-label={displayTitle}>
      <div
        className={[
          styles.frame,
          keepFrame ? "" : styles.frameCollapsed,
          anchoredDeck ? styles.frameDeck : "",
          anchoredDeck && questionCount > 0 ? styles.frameDeckStacked : "",
          isQuestionDropTarget ? styles.frameDropActive : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div
          ref={setDroppableRef}
          className={[
            styles.header,
            pillAlign === "start" ? styles.headerStart : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className={styles.pill}>
            <Tooltip
              title={collapsed ? "Expand" : "Collapse"}
              placement="left"
            >
              <button
                type="button"
                className={styles.collapseHit}
                aria-label={collapseLabel}
                aria-expanded={!collapsed}
                onClick={onToggleCollapsed}
              >
                <span className={styles.collapseIcon} aria-hidden>
                  <FaIcon name={collapseIcon} size="extraSmall" />
                </span>
                <span className={styles.identity}>
                  <span className={styles.title}>Page {sectionNumber}</span>
                  <span className={styles.dot} aria-hidden />
                  <span className={styles.count}>{countLabel}</span>
                </span>
              </button>
            </Tooltip>
            <div className={styles.menu}>
              <Dropdown
                role="action"
                size="extraSmall"
                menuPlacement="bottomRight"
                aria-label={`${displayTitle} options`}
                trigger={<PageMenuTrigger />}
                options={[...menuOptions]}
                onAction={handleAction}
              />
            </div>
          </div>
        </div>
        {!collapsed && <div className={styles.body}>{children}</div>}
        {collapsed && (collapsedStyle === "closed" || anchoredDeck) && (
          <button
            type="button"
            className={[
              styles.closedPeek,
              pillAlign === "start" ? styles.closedPeekStart : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={onToggleCollapsed}
            tabIndex={-1}
            aria-hidden
          >
            {peek}
          </button>
        )}
      </div>
    </section>
  );
}
