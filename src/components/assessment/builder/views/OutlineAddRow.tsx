import { forwardRef, useId, type ButtonHTMLAttributes } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Button, Dropdown } from "@moshebari/cads-react";
import { FaIcon } from "@moshebari/cads-react/icons";
import type { FaIconName } from "../../../../icons/faProRegularCodepoints";
import type { BlankQuestionKind } from "../../../../lib/assessmentBuilder";
import quizEmptyState from "../../../../assets/empty-states/quiz-empty-state.svg";
import { FINAL_CREATE_QUESTION_OPTIONS } from "./questionKindMeta";
import styles from "./OutlineAddRow.module.scss";

interface AddRowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  iconName: FaIconName;
  label: string;
  isDropActive?: boolean;
  dashed?: boolean;
}

/**
 * Forwards ref + rest props so it can serve as a CADS `Dropdown` custom
 * trigger (Dropdown clones it with ref, onClick, and ARIA attributes).
 */
const AddRowButton = forwardRef<HTMLButtonElement, AddRowButtonProps>(
  function AddRowButton({ iconName, label, isDropActive, dashed, ...rest }, ref) {
    return (
      <button
        type="button"
        {...rest}
        ref={ref}
        className={[
          styles.addRow,
          isDropActive ? styles.addRowDropActive : "",
          dashed ? styles.addRowDashed : "",
        ]
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

const CREATE_QUESTION_MENU_OPTIONS = FINAL_CREATE_QUESTION_OPTIONS.map((option) => ({
  value: option.kind,
  label: option.label,
  iconName: option.iconName,
}));

interface CreateQuestionDropdownProps {
  label: string;
  variant: "contained" | "text";
  color: "primary" | "secondary";
  menuPlacement?: "bottomLeft" | "bottomRight";
  ariaLabel?: string;
  onCreateQuestion: (kind: BlankQuestionKind) => void;
}

/** P0 create-only menu (MC / FR / Matching). Bank adds stay on the rail. */
function CreateQuestionDropdown({
  label,
  variant,
  color,
  menuPlacement = "bottomLeft",
  ariaLabel,
  onCreateQuestion,
}: CreateQuestionDropdownProps) {
  return (
    <Dropdown
      role="action"
      size="extraSmall"
      menuPlacement={menuPlacement}
      aria-label={ariaLabel ?? label}
      trigger={
        <Button
          variant={variant}
          color={color}
          size="extraSmall"
          startIconName="plus"
          endIconName="chevron-down"
        >
          {label}
        </Button>
      }
      options={CREATE_QUESTION_MENU_OPTIONS}
      onAction={(action) => onCreateQuestion(action as BlankQuestionKind)}
    />
  );
}

interface OutlineEmptyQuizProps {
  onCreateQuestion: (kind: BlankQuestionKind) => void;
  onAddSection: () => void;
}

/**
 * W1.1 dashed illustration when the quiz has no sections and no questions.
 * Create types only; bank adds stay on the rail.
 */
export function OutlineEmptyQuiz({
  onCreateQuestion,
  onAddSection,
}: OutlineEmptyQuizProps) {
  return (
    <div
      className={styles.emptyQuiz}
      role="region"
      aria-label="This quiz is empty. Add a question from the bank, create a new question, or add a section."
    >
      <div className={styles.emptyQuizInner}>
        <div className={styles.emptyQuizMessage}>
          <img
            src={quizEmptyState}
            alt=""
            width={200}
            height={146}
            className={styles.emptyQuizArt}
          />
          <div className={styles.emptyQuizCopy}>
            <h2 className={styles.emptyQuizTitle}>This quiz is empty</h2>
            <p className={styles.emptyQuizBody}>
              Start by adding a question from the bank on the left, creating a
              new question, or adding a section.
            </p>
          </div>
        </div>
        <div className={styles.emptyQuizActions}>
          <CreateQuestionDropdown
            label="Create question"
            variant="contained"
            color="primary"
            ariaLabel="Create question"
            onCreateQuestion={onCreateQuestion}
          />
          <Button
            variant="outlined"
            color="secondary"
            size="extraSmall"
            startIconName="rectangle-history-circle-plus"
            onClick={onAddSection}
          >
            New Section
          </Button>
        </div>
      </div>
    </div>
  );
}

interface OutlineAddQuestionRowProps {
  /** dnd droppable id (`end:<sectionId>` / `end:flat`) — appends on drop. */
  droppableId: string;
  isDropActive: boolean;
  onCreateQuestion: (kind: BlankQuestionKind) => void;
}

/**
 * Dashed "+ Create question" row at the end of a populated section (or
 * flat list). Create types only — bank adds stay on the rail. Doubles as
 * the append drop target for question drags.
 */
export function OutlineAddQuestionRow({
  droppableId,
  isDropActive,
  onCreateQuestion,
}: OutlineAddQuestionRowProps) {
  const { setNodeRef } = useDroppable({ id: droppableId });

  return (
    <div
      ref={setNodeRef}
      className={[
        styles.addQuestionRow,
        isDropActive ? styles.addQuestionRowDropActive : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <CreateQuestionDropdown
        label="Create question"
        variant="text"
        color="secondary"
        ariaLabel="Create question"
        onCreateQuestion={onCreateQuestion}
      />
    </div>
  );
}

interface OutlineEmptySectionSlotProps {
  droppableId: string;
  isDropActive: boolean;
  onCreateQuestion: (kind: BlankQuestionKind) => void;
}

/**
 * Dashed placeholder for an empty section. Create types only; bank adds
 * stay on the rail.
 */
export function OutlineEmptySectionSlot({
  droppableId,
  isDropActive,
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
      aria-label="This section is empty. Add a question from the bank or create a new question."
    >
      <div className={styles.emptySlotCopy}>
        <p className={styles.emptySlotTitle}>This section is empty</p>
        <p className={styles.emptySlotHint}>
          Add a question from the bank or create a new question.
        </p>
      </div>
      <CreateQuestionDropdown
        label="Create question"
        variant="contained"
        color="primary"
        ariaLabel="Create question"
        onCreateQuestion={onCreateQuestion}
      />
    </div>
  );
}

interface OutlineAddSectionGhostProps {
  onClick: () => void;
}

/** End-of-outline ghost header: plus + ADD SECTION, no box. */
export function OutlineAddSectionGhost({ onClick }: OutlineAddSectionGhostProps) {
  return (
    <button type="button" className={styles.sectionGhost} onClick={onClick}>
      <span className={styles.sectionGhostPlus} aria-hidden>
        <FaIcon name="plus" size="extraSmall" />
      </span>
      <span className={styles.sectionGhostLabel}>Add section</span>
    </button>
  );
}

interface OutlineAddSectionRowProps {
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
  /** 12px between intro/sections; 8px between questions. */
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
