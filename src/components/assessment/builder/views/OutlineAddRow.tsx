import { forwardRef, useId, type ButtonHTMLAttributes } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Button, Dropdown } from "@moshebaricdo/cads-react";
import { FaIcon } from "@moshebaricdo/cads-react/icons";
import type { FaIconName } from "../../../../icons/faProRegularCodepoints";
import type { BlankQuestionKind } from "../../../../lib/assessmentBuilder";
import { CREATE_QUESTION_OPTIONS } from "./questionKindMeta";
import styles from "./OutlineAddRow.module.scss";

interface AddRowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  iconName: FaIconName;
  label: string;
  isDropActive?: boolean;
}

/**
 * Forwards ref + rest props so it can serve as a CADS `Dropdown` custom
 * trigger (Dropdown clones it with ref, onClick, and ARIA attributes).
 */
const AddRowButton = forwardRef<HTMLButtonElement, AddRowButtonProps>(
  function AddRowButton({ iconName, label, isDropActive, ...rest }, ref) {
    return (
      <button
        type="button"
        {...rest}
        ref={ref}
        className={[styles.addRow, isDropActive ? styles.addRowDropActive : ""]
          .filter(Boolean)
          .join(" ")}
      >
        <span className={styles.gutter} aria-hidden />
        <span className={styles.icon}>
          <FaIcon name={iconName} size="small" />
        </span>
        <span className={styles.label}>{label}</span>
      </button>
    );
  },
);

interface OutlineAddQuestionRowProps {
  /** dnd droppable id (`end:<sectionId>` / `end:flat`) — appends on drop. */
  droppableId: string;
  isDropActive: boolean;
  onAddFromBank: () => void;
  onCreateQuestion: (kind: BlankQuestionKind) => void;
}

/**
 * Ghost "+ Add question" row: one per section (or flat-list end). Opens the
 * compact add popover — question bank first, then the five one-off types.
 * Doubles as the append drop target for question drags.
 */
export function OutlineAddQuestionRow({
  droppableId,
  isDropActive,
  onAddFromBank,
  onCreateQuestion,
}: OutlineAddQuestionRowProps) {
  const { setNodeRef } = useDroppable({ id: droppableId });

  return (
    <div ref={setNodeRef}>
      <Dropdown
        role="action"
        size="small"
        menuPlacement="bottomLeft"
        className={styles.dropdownHost}
        aria-label="Add question"
        trigger={
          <AddRowButton
            iconName="plus"
            label="Add question"
            isDropActive={isDropActive}
          />
        }
        options={[
          { type: "group", label: "Add from" },
          {
            value: "bank",
            label: "Question bank…",
            iconName: "clipboard-question",
          },
          { type: "group", label: "Create new" },
          ...CREATE_QUESTION_OPTIONS.map((option) => ({
            value: option.kind,
            label: option.label,
            iconName: option.iconName,
          })),
        ]}
        onAction={(action) => {
          if (action === "bank") {
            onAddFromBank();
            return;
          }
          onCreateQuestion(action as BlankQuestionKind);
        }}
      />
    </div>
  );
}

interface OutlineEmptySectionSlotProps {
  droppableId: string;
  isDropActive: boolean;
  onAddFromBank: () => void;
  onCreateQuestion: (kind: BlankQuestionKind) => void;
}

/**
 * Dashed, unfilled placeholder for an empty section in a populated outline.
 * Bank is the called-out path (opens the rail, scoped to this section);
 * Create new is the five P0 one-off types.
 */
export function OutlineEmptySectionSlot({
  droppableId,
  isDropActive,
  onAddFromBank,
  onCreateQuestion,
}: OutlineEmptySectionSlotProps) {
  const { setNodeRef } = useDroppable({ id: droppableId });

  return (
    <div
      ref={setNodeRef}
      className={[styles.emptySlot, isDropActive ? styles.emptySlotDropActive : ""]
        .filter(Boolean)
        .join(" ")}
      role="region"
      aria-label="Empty section. Add a question from the bank or create a new one."
    >
      <p className={styles.emptyCopy}>This section is empty</p>
      <div className={styles.emptyActions}>
        <Button
          variant="text"
          color="primary"
          size="extraSmall"
          startIconName="clipboard-question"
          onClick={onAddFromBank}
        >
          Add from question bank
        </Button>
        <Dropdown
          role="action"
          size="extraSmall"
          menuPlacement="bottomRight"
          buttonVariant="text"
          buttonColor="secondary"
          startIconName="plus"
          label="Create new"
          aria-label="Create a new question"
          options={CREATE_QUESTION_OPTIONS.map((option) => ({
            value: option.kind,
            label: option.label,
            iconName: option.iconName,
          }))}
          onAction={(action) => onCreateQuestion(action as BlankQuestionKind)}
        />
      </div>
    </div>
  );
}

interface OutlineAddSectionRowProps {
  /** First add on a flat outline wraps existing questions into Section 1. */
  wrapsExisting: boolean;
  onClick: () => void;
}

export function OutlineAddSectionRow({
  wrapsExisting,
  onClick,
}: OutlineAddSectionRowProps) {
  return (
    <AddRowButton
      iconName="rectangle-history"
      label={wrapsExisting ? "Group questions into a section" : "Add section"}
      onClick={onClick}
    />
  );
}

interface OutlineAddIntroRowProps {
  onClick: () => void;
}

interface OutlineConnectorProps {
  /** 16px between intro/sections; 8px between questions. */
  size: "section" | "item";
  droppableId?: string;
  isDropActive?: boolean;
}

/**
 * Vertical tick between outline blocks (Figma divider). Optional dnd
 * droppable for append-to-end targets once ghost add rows are gone.
 */
export function OutlineConnector({
  size,
  droppableId,
  isDropActive = false,
}: OutlineConnectorProps) {
  const fallbackId = useId();
  const { setNodeRef } = useDroppable({
    id: droppableId ?? fallbackId,
    disabled: !droppableId,
  });

  return (
    <div
      ref={droppableId ? setNodeRef : undefined}
      className={[
        styles.connector,
        size === "section" ? styles.connectorSection : styles.connectorItem,
        isDropActive ? styles.connectorDropActive : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden={!droppableId}
    >
      <span className={styles.tick} />
    </div>
  );
}

export function OutlineAddIntroRow({ onClick }: OutlineAddIntroRowProps) {
  return (
    <AddRowButton
      iconName="presentation-screen"
      label="Add intro screen"
      onClick={onClick}
    />
  );
}
