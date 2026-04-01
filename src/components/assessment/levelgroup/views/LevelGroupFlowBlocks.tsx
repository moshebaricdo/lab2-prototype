import {
  useCallback,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  levelGroupFreeToPayload,
  levelGroupMatchToPayload,
  levelGroupMultiToPayload,
  type LevelGroupFlowPayload,
  type LevelGroupQuestionBlock,
} from "../../../../data/assessment/levelGroup";
import { FreeResponseWorkspace } from "../../free-response/views/FreeResponseWorkspace";
import { MatchConnectorWorkspace } from "../../match/views/MatchConnectorWorkspace";
import { MultiChoiceWorkspace } from "../../multi/views/MultiChoiceWorkspace";
import flowStyles from "./LevelGroupFlow.module.scss";

export type MatchAssignments = Record<string, string | null>;

function buildInitialAssignments(promptIds: string[]): MatchAssignments {
  return promptIds.reduce<MatchAssignments>((acc, promptId) => {
    acc[promptId] = null;
    return acc;
  }, {});
}

export interface LevelGroupFlowState {
  selectedMulti: Record<string, string | null>;
  freeText: Record<string, string>;
  matchAssignments: Record<string, MatchAssignments>;
}

export function useLevelGroupFlowState(steps: LevelGroupQuestionBlock[]) {
  const initialMatch = useMemo(() => {
    const acc: Record<string, MatchAssignments> = {};
    for (const step of steps) {
      if (step.kind === "match") {
        acc[step.blockId] = buildInitialAssignments(
          step.question.prompts.map((p) => p.id),
        );
      }
    }
    return acc;
  }, [steps]);

  const [selectedMulti, setSelectedMulti] = useState<
    Record<string, string | null>
  >({});
  const [freeText, setFreeText] = useState<Record<string, string>>({});
  const [matchAssignments, setMatchAssignments] =
    useState<Record<string, MatchAssignments>>(initialMatch);

  const resetFlow = useCallback(() => {
    setSelectedMulti({});
    setFreeText({});
    setMatchAssignments(initialMatch);
  }, [initialMatch]);

  const state: LevelGroupFlowState = {
    selectedMulti,
    freeText,
    matchAssignments,
  };

  return {
    state,
    setSelectedMulti,
    setFreeText,
    setMatchAssignments,
    resetFlow,
  };
}

function isMultiComplete(
  block: Extract<LevelGroupQuestionBlock, { kind: "multi" }>,
  selectedId: string | null | undefined,
): boolean {
  return Boolean(selectedId);
}

function isFreeComplete(
  block: Extract<LevelGroupQuestionBlock, { kind: "freeResponse" }>,
  text: string | undefined,
): boolean {
  return text !== undefined && text.trim().length >= block.question.minCharacters;
}

function isMatchComplete(
  block: Extract<LevelGroupQuestionBlock, { kind: "match" }>,
  assignments: MatchAssignments | undefined,
): boolean {
  if (!assignments) return false;
  return block.question.prompts.every((prompt) =>
    Boolean(assignments[prompt.id]),
  );
}

export function isBlockComplete(
  block: LevelGroupQuestionBlock,
  flow: LevelGroupFlowState,
): boolean {
  if (block.kind === "multi") {
    return isMultiComplete(block, flow.selectedMulti[block.blockId] ?? null);
  }
  if (block.kind === "freeResponse") {
    return isFreeComplete(block, flow.freeText[block.blockId]);
  }
  return isMatchComplete(block, flow.matchAssignments[block.blockId]);
}

export function allBlocksComplete(
  steps: LevelGroupQuestionBlock[],
  flow: LevelGroupFlowState,
): boolean {
  return steps.every((step) => isBlockComplete(step, flow));
}

function sectionScore(
  block: LevelGroupQuestionBlock,
  flow: LevelGroupFlowState,
  isSubmitted: boolean,
  surveyMode?: boolean,
): boolean {
  if (!isSubmitted) return false;
  if (surveyMode) {
    return isBlockComplete(block, flow);
  }
  if (block.kind === "multi") {
    const id = flow.selectedMulti[block.blockId];
    return id === block.question.correctAnswerId;
  }
  if (block.kind === "freeResponse") {
    return isFreeComplete(block, flow.freeText[block.blockId]);
  }
  const assignments = flow.matchAssignments[block.blockId];
  if (!assignments) return false;
  return block.question.prompts.every(
    (prompt) => assignments[prompt.id] === prompt.correctTermId,
  );
}

export function countSectionsMet(
  steps: LevelGroupQuestionBlock[],
  flow: LevelGroupFlowState,
  isSubmitted: boolean,
  surveyMode?: boolean,
): number {
  if (!isSubmitted) return 0;
  return steps.filter((s) => sectionScore(s, flow, true, surveyMode)).length;
}

/** After submit, whether this block’s answers meet expectations (correct / rubric). */
export function blockMeetsExpectations(
  block: LevelGroupQuestionBlock,
  flow: LevelGroupFlowState,
  surveyMode?: boolean,
): boolean {
  return sectionScore(block, flow, true, surveyMode);
}

export type LevelGroupEmbeddedLayout = "default" | "scrollGroup" | "stepped";

export interface LevelGroupEmbeddedBlockProps {
  block: LevelGroupQuestionBlock;
  stepIndex: number;
  totalSteps: number;
  flowLevel: LevelGroupFlowPayload["level"];
  isSubmitted: boolean;
  flow: LevelGroupFlowState;
  setSelectedMulti: Dispatch<
    SetStateAction<Record<string, string | null>>
  >;
  setFreeText: Dispatch<SetStateAction<Record<string, string>>>;
  setMatchAssignments: Dispatch<
    SetStateAction<Record<string, MatchAssignments>>
  >;
  /**
   * `scrollGroup`: one shared card, step counter in stem eyebrow.
   * `stepped`: type-only eyebrow (counter lives in the level-group header).
   */
  layout?: LevelGroupEmbeddedLayout;
  /** Parent-level reveal toggle — shows keys for every block in the group. */
  groupTeacherReveal: boolean;
}

function blockEyebrowLabel(block: LevelGroupQuestionBlock): string {
  if (block.kind === "multi") return "Multiple choice";
  if (block.kind === "freeResponse") return "Free response";
  return "Match";
}

export function LevelGroupEmbeddedBlock({
  block,
  stepIndex,
  totalSteps,
  flowLevel,
  isSubmitted,
  flow,
  setSelectedMulti,
  setFreeText,
  setMatchAssignments,
  layout = "default",
  groupTeacherReveal,
}: LevelGroupEmbeddedBlockProps) {
  const scrollGroup = layout === "scrollGroup";
  const steppedTypeOnly = layout === "stepped";
  const stepEyebrow = `Question ${stepIndex + 1} of ${totalSteps}`;
  const eyebrowDefault = `${stepIndex + 1} / ${totalSteps} · ${blockEyebrowLabel(block)}`;
  const eyebrowWrapper = steppedTypeOnly
    ? blockEyebrowLabel(block)
    : eyebrowDefault;

  const wrapStepped = (inner: ReactNode) =>
    scrollGroup || steppedTypeOnly ? (
      inner
    ) : (
      <div className={flowStyles.embeddedBlock}>
        <p className={flowStyles.blockEyebrow}>{eyebrowWrapper}</p>
        {inner}
      </div>
    );

  const embeddedStepEyebrowForChild =
    scrollGroup ? stepEyebrow : steppedTypeOnly ? blockEyebrowLabel(block) : undefined;

  if (block.kind === "multi") {
    const payload = levelGroupMultiToPayload(block, flowLevel, stepIndex);
    const selected = flow.selectedMulti[block.blockId];
    return wrapStepped(
      <MultiChoiceWorkspace
        embedded
        embeddedInScrollGroup={scrollGroup}
        embeddedInSteppedGroup={steppedTypeOnly}
        embeddedStepEyebrow={embeddedStepEyebrowForChild}
        payload={payload}
        groupSubmitted={isSubmitted}
        groupTeacherReveal={groupTeacherReveal}
        controlledSelectedIds={selected ? [selected] : []}
        onControlledSelectedIdsChange={(ids) =>
          setSelectedMulti((prev) => ({
            ...prev,
            [block.blockId]: ids[0] ?? null,
          }))
        }
      />,
    );
  }

  if (block.kind === "freeResponse") {
    const payload = levelGroupFreeToPayload(block, flowLevel, stepIndex);
    return wrapStepped(
      <FreeResponseWorkspace
        embedded
        embeddedInScrollGroup={scrollGroup}
        embeddedInSteppedGroup={steppedTypeOnly}
        embeddedStepEyebrow={embeddedStepEyebrowForChild}
        payload={payload}
        groupSubmitted={isSubmitted}
        groupTeacherReveal={groupTeacherReveal}
        controlledResponseText={flow.freeText[block.blockId] ?? ""}
        onControlledResponseTextChange={(text) =>
          setFreeText((prev) => ({ ...prev, [block.blockId]: text }))
        }
      />,
    );
  }

  const payload = levelGroupMatchToPayload(block, flowLevel, stepIndex);
  const assignments =
    flow.matchAssignments[block.blockId] ??
    buildInitialAssignments(block.question.prompts.map((p) => p.id));

  return wrapStepped(
    <MatchConnectorWorkspace
      embedded
      embeddedInScrollGroup={scrollGroup}
      embeddedInSteppedGroup={steppedTypeOnly}
      embeddedStepEyebrow={embeddedStepEyebrowForChild}
      payload={payload}
      groupSubmitted={isSubmitted}
      groupTeacherReveal={groupTeacherReveal}
      controlledAssignments={assignments}
      onControlledAssignmentsChange={(next) =>
        setMatchAssignments((prev) => ({ ...prev, [block.blockId]: next }))
      }
    />,
  );
}
