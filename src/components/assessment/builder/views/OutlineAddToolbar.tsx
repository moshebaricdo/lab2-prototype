import { Button, Dropdown } from "@moshebaricdo/cads-react";
import type { BlankQuestionKind } from "../../../../lib/assessmentBuilder";
import { CREATE_QUESTION_OPTIONS } from "./questionKindMeta";
import styles from "./OutlineAddToolbar.module.scss";

const TOOLBAR_PRIMARY: Array<{
  kind: BlankQuestionKind;
  label: string;
  iconName: (typeof CREATE_QUESTION_OPTIONS)[number]["iconName"];
}> = [
  { kind: "multiSingle", label: "Multiple Choice", iconName: "list-check" },
  { kind: "freeResponse", label: "Free Response", iconName: "pen-field" },
  { kind: "match", label: "Matching", iconName: "diagram-next" },
];

const TOOLBAR_PRIMARY_KINDS = new Set(TOOLBAR_PRIMARY.map((entry) => entry.kind));

interface OutlineAddToolbarProps {
  onAddSection: () => void;
  onCreateQuestion: (kind: BlankQuestionKind) => void;
  onAddFromBank: () => void;
}

/**
 * Floating add bar at the bottom of the P0 workspace (Figma Lab 2 Frame).
 * Primary types sit as text buttons; remaining P0 types + bank live in More.
 */
export function OutlineAddToolbar({
  onAddSection,
  onCreateQuestion,
  onAddFromBank,
}: OutlineAddToolbarProps) {
  return (
    <div className={styles.bar} role="toolbar" aria-label="Add to assessment">
      <div className={styles.sectionAction}>
        <Button
          variant="text"
          color="secondary"
          size="small"
          startIconName="square-dashed-circle-plus"
          onClick={onAddSection}
        >
          New section
        </Button>
      </div>
      <div className={styles.typeActions}>
        {TOOLBAR_PRIMARY.map((option) => (
          <Button
            key={option.kind}
            variant="text"
            color="secondary"
            size="small"
            startIconName={option.iconName}
            onClick={() => onCreateQuestion(option.kind)}
          >
            {option.label}
          </Button>
        ))}
        <Dropdown
          role="action"
          size="small"
          menuPlacement="topRight"
          buttonVariant="text"
          buttonColor="secondary"
          iconOnly
          startIconName="ellipsis"
          aria-label="More question types"
          options={[
            ...CREATE_QUESTION_OPTIONS.filter(
              (option) => !TOOLBAR_PRIMARY_KINDS.has(option.kind),
            ).map((option) => ({
              value: option.kind,
              label: option.label,
              iconName: option.iconName,
            })),
            { type: "separator" as const },
            {
              value: "bank",
              label: "Question bank…",
              iconName: "clipboard-question" as const,
            },
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
    </div>
  );
}
