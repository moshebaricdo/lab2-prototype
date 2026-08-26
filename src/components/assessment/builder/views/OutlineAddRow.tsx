import { useDroppable } from "@dnd-kit/core";
import { Dropdown } from "@moshebaricdo/cads-react";
import { FaIcon } from "../../../ui/icons/FaIcon";
import type { FaIconName } from "../../../../icons/faProRegularCodepoints";
import type { BlankQuestionKind } from "../../../../lib/assessmentBuilder";
import { CREATE_QUESTION_OPTIONS } from "./questionKindMeta";
import styles from "./OutlineAddRow.module.scss";

interface AddRowButtonProps {
  iconName: FaIconName;
  label: string;
  isDropActive?: boolean;
  onClick?: () => void;
}

function AddRowButton({ iconName, label, isDropActive, onClick }: AddRowButtonProps) {
  return (
    <button
      type="button"
      className={[styles.addRow, isDropActive ? styles.addRowDropActive : ""]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
    >
      <span className={styles.gutter} aria-hidden />
      <span className={styles.icon}>
        <FaIcon name={iconName} size="s" aria-hidden />
      </span>
      <span className={styles.label}>{label}</span>
    </button>
  );
}

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

export function OutlineAddIntroRow({ onClick }: OutlineAddIntroRowProps) {
  return (
    <AddRowButton
      iconName="presentation-screen"
      label="Add intro screen"
      onClick={onClick}
    />
  );
}
