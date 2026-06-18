import {
  useCallback,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  levelGroupDragDropToPayload,
  levelGroupFillInBlankToPayload,
  levelGroupFreeToPayload,
  levelGroupMatchToPayload,
  levelGroupMultiToPayload,
  type LevelGroupFlowPayload,
  type LevelGroupQuestionBlock,
} from "../../../../data/assessment/levelGroup";
import { isBlankAnswerCorrect } from "../../../../data/assessment/fillInBlank";
import {
  DragDropWorkspace,
  type CategorizationAssignments,
  type ParsonsSolutionState,
} from "../../drag-drop/views/DragDropWorkspace";
import { FillInBlankWorkspace, type FillInBlankResponses } from "../../fill-in-blank/views/FillInBlankWorkspace";
import { FreeResponseWorkspace } from "../../free-response/views/FreeResponseWorkspace";
import { MatchConnectorWorkspace } from "../../match/views/MatchConnectorWorkspace";
import { MultiChoiceWorkspace } from "../../multi/views/MultiChoiceWorkspace";
import type { LevelProgressLink } from "../../../ui/header/LevelProgressBubbles";
import flowStyles from "./LevelGroupFlow.module.scss";

export function getLevelContinueTarget(
  levelLinks: LevelProgressLink[] | undefined,
  currentLevelPath: string | undefined,
): { path: string; label: "Continue" | "Finish" } {
  if (!levelLinks?.length || !currentLevelPath) {
    return { path: "/levels", label: "Finish" };
  }
  const index = levelLinks.findIndex((link) => link.path === currentLevelPath);
  if (index === -1) {
    return { path: "/levels", label: "Finish" };
  }
  const nextPath = levelLinks[index + 1]?.path;
  if (!nextPath) {
    return { path: "/levels", label: "Finish" };
  }
  return { path: nextPath, label: "Continue" };
}

export type MatchAssignments = Record<string, string | null>;

function buildInitialAssignments(promptIds: string[]): MatchAssignments {
  return promptIds.reduce<MatchAssignments>((acc, promptId) => {
    acc[promptId] = null;
    return acc;
  }, {});
}

function buildInitialParsonsSolution(correctOrder: string[]): ParsonsSolutionState {
  return correctOrder.map(() => ({ blockId: null, depth: 0 }));
}

function buildInitialCategorizationAssignments(
  itemIds: string[],
): CategorizationAssignments {
  return itemIds.reduce<CategorizationAssignments>((acc, itemId) => {
    acc[itemId] = null;
    return acc;
  }, {});
}

function buildInitialFillInBlankResponses(
  blankIds: string[],
): FillInBlankResponses {
  return blankIds.reduce<FillInBlankResponses>((acc, blankId) => {
    acc[blankId] = "";
    return acc;
  }, {});
}

export interface LevelGroupFlowState {
  selectedMulti: Record<string, string | null>;
  freeText: Record<string, string>;
  matchAssignments: Record<string, MatchAssignments>;
  dragDropParsons: Record<string, ParsonsSolutionState>;
  dragDropCategorization: Record<string, CategorizationAssignments>;
  fillInBlankResponses: Record<string, FillInBlankResponses>;
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

  const initialDragDropParsons = useMemo(() => {
    const acc: Record<string, ParsonsSolutionState> = {};
    for (const step of steps) {
      if (step.kind === "dragDrop" && step.question.mode === "parsons") {
        acc[step.blockId] = buildInitialParsonsSolution(
          step.question.correctOrder ?? [],
        );
      }
    }
    return acc;
  }, [steps]);

  const initialDragDropCategorization = useMemo(() => {
    const acc: Record<string, CategorizationAssignments> = {};
    for (const step of steps) {
      if (step.kind === "dragDrop" && step.question.mode === "categorization") {
        acc[step.blockId] = buildInitialCategorizationAssignments(
          step.question.items?.map((item) => item.id) ?? [],
        );
      }
    }
    return acc;
  }, [steps]);

  const initialFillInBlank = useMemo(() => {
    const acc: Record<string, FillInBlankResponses> = {};
    for (const step of steps) {
      if (step.kind === "fillInBlank") {
        acc[step.blockId] = buildInitialFillInBlankResponses(
          step.question.blanks.map((blank) => blank.id),
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
  const [dragDropParsons, setDragDropParsons] = useState<
    Record<string, ParsonsSolutionState>
  >(initialDragDropParsons);
  const [dragDropCategorization, setDragDropCategorization] = useState<
    Record<string, CategorizationAssignments>
  >(initialDragDropCategorization);
  const [fillInBlankResponses, setFillInBlankResponses] = useState<
    Record<string, FillInBlankResponses>
  >(initialFillInBlank);

  const resetFlow = useCallback(() => {
    setSelectedMulti({});
    setFreeText({});
    setMatchAssignments(initialMatch);
    setDragDropParsons(initialDragDropParsons);
    setDragDropCategorization(initialDragDropCategorization);
    setFillInBlankResponses(initialFillInBlank);
  }, [
    initialMatch,
    initialDragDropParsons,
    initialDragDropCategorization,
    initialFillInBlank,
  ]);

  const state: LevelGroupFlowState = {
    selectedMulti,
    freeText,
    matchAssignments,
    dragDropParsons,
    dragDropCategorization,
    fillInBlankResponses,
  };

  return {
    state,
    setSelectedMulti,
    setFreeText,
    setMatchAssignments,
    setDragDropParsons,
    setDragDropCategorization,
    setFillInBlankResponses,
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

function isDragDropComplete(
  block: Extract<LevelGroupQuestionBlock, { kind: "dragDrop" }>,
  flow: LevelGroupFlowState,
): boolean {
  if (block.question.mode === "parsons") {
    const solution = flow.dragDropParsons[block.blockId];
    if (!solution) return false;
    return solution.every((line) => Boolean(line.blockId));
  }
  const assignments = flow.dragDropCategorization[block.blockId];
  if (!assignments) return false;
  return (block.question.items ?? []).every((item) =>
    Boolean(assignments[item.id]),
  );
}

function isFillInBlankComplete(
  block: Extract<LevelGroupQuestionBlock, { kind: "fillInBlank" }>,
  responses: FillInBlankResponses | undefined,
): boolean {
  if (!responses) return false;
  return block.question.blanks.every(
    (blank) => responses[blank.id]?.trim().length > 0,
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
  if (block.kind === "match") {
    return isMatchComplete(block, flow.matchAssignments[block.blockId]);
  }
  if (block.kind === "dragDrop") {
    return isDragDropComplete(block, flow);
  }
  return isFillInBlankComplete(
    block,
    flow.fillInBlankResponses[block.blockId],
  );
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
  if (block.kind === "match") {
    const assignments = flow.matchAssignments[block.blockId];
    if (!assignments) return false;
    return block.question.prompts.every(
      (prompt) => assignments[prompt.id] === prompt.correctTermId,
    );
  }
  if (block.kind === "dragDrop") {
    if (block.question.mode === "parsons") {
      const solution = flow.dragDropParsons[block.blockId];
      if (!solution) return false;
      const indents =
        block.question.correctIndents ??
        (block.question.correctOrder ?? []).map(() => 0);
      return (block.question.correctOrder ?? []).every(
        (blockId, index) =>
          solution[index]?.blockId === blockId &&
          solution[index]?.depth === indents[index],
      );
    }
    const assignments = flow.dragDropCategorization[block.blockId];
    if (!assignments) return false;
    return (block.question.items ?? []).every((item) => {
      const bucketId = assignments[item.id];
      return bucketId != null && item.correctBucketIds.includes(bucketId);
    });
  }
  const responses = flow.fillInBlankResponses[block.blockId];
  if (!responses) return false;
  return block.question.blanks.every((blank) =>
    isBlankAnswerCorrect(responses[blank.id] ?? "", blank),
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
  setDragDropParsons: Dispatch<
    SetStateAction<Record<string, ParsonsSolutionState>>
  >;
  setDragDropCategorization: Dispatch<
    SetStateAction<Record<string, CategorizationAssignments>>
  >;
  setFillInBlankResponses: Dispatch<
    SetStateAction<Record<string, FillInBlankResponses>>
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
  if (block.kind === "match") return "Match";
  if (block.kind === "dragDrop") {
    return block.question.mode === "parsons"
      ? "Parsons problem"
      : "Categorization";
  }
  return block.question.blanks.length > 1
    ? "Fill in the blanks"
    : "Fill in the blank";
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
  setDragDropParsons,
  setDragDropCategorization,
  setFillInBlankResponses,
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
        codePanel={block.codePanel}
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

  if (block.kind === "dragDrop") {
    const payload = levelGroupDragDropToPayload(block, flowLevel, stepIndex);
    const parsonsSolution =
      flow.dragDropParsons[block.blockId] ??
      buildInitialParsonsSolution(block.question.correctOrder ?? []);
    const catAssignments =
      flow.dragDropCategorization[block.blockId] ??
      buildInitialCategorizationAssignments(
        block.question.items?.map((item) => item.id) ?? [],
      );

    return wrapStepped(
      <DragDropWorkspace
        embedded
        codePanel={block.codePanel}
        embeddedInScrollGroup={scrollGroup}
        embeddedInSteppedGroup={steppedTypeOnly}
        embeddedStepEyebrow={embeddedStepEyebrowForChild}
        payload={payload}
        groupSubmitted={isSubmitted}
        groupTeacherReveal={groupTeacherReveal}
        controlledParsonsSolution={
          block.question.mode === "parsons" ? parsonsSolution : undefined
        }
        onControlledParsonsSolutionChange={
          block.question.mode === "parsons"
            ? (next) =>
                setDragDropParsons((prev) => ({
                  ...prev,
                  [block.blockId]: next,
                }))
            : undefined
        }
        controlledCategorizationAssignments={
          block.question.mode === "categorization" ? catAssignments : undefined
        }
        onControlledCategorizationAssignmentsChange={
          block.question.mode === "categorization"
            ? (next) =>
                setDragDropCategorization((prev) => ({
                  ...prev,
                  [block.blockId]: next,
                }))
            : undefined
        }
      />,
    );
  }

  if (block.kind === "fillInBlank") {
    const payload = levelGroupFillInBlankToPayload(block, flowLevel, stepIndex);
    const responses =
      flow.fillInBlankResponses[block.blockId] ??
      buildInitialFillInBlankResponses(
        block.question.blanks.map((blank) => blank.id),
      );

    return wrapStepped(
      <FillInBlankWorkspace
        embedded
        codePanel={block.codePanel}
        embeddedInScrollGroup={scrollGroup}
        embeddedInSteppedGroup={steppedTypeOnly}
        embeddedStepEyebrow={embeddedStepEyebrowForChild}
        payload={payload}
        groupSubmitted={isSubmitted}
        groupTeacherReveal={groupTeacherReveal}
        controlledResponses={responses}
        onControlledResponsesChange={(next) =>
          setFillInBlankResponses((prev) => ({
            ...prev,
            [block.blockId]: next,
          }))
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
