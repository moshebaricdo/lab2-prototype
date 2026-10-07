import type { ComponentType, ReactNode } from "react";
import { TrainingRowWalkStage } from "../../components/ide/ailab/views/TrainingRowWalk";
import { TreeRide } from "../../components/ide/ailab/views/TreeRide";
import {
  TABLE_ROW_SHELL,
  TreeTableRow,
  tableRowTitle,
} from "../../components/ide/ailab/views/TreeTableRow";
import type {
  TrainingStageProps,
  WalkState,
} from "../../components/ide/ailab/views/trainingWalk";

/**
 * One way to draw the sort-and-quiz walk. Every variant plays the same
 * beats from the same clock, so selected variants stay in lockstep.
 *
 * To add one: build a stage component under
 * `components/ide/ailab/views/` that renders from `TrainingStageProps`
 * (any `state`, no timers of its own), then append it here.
 */
export interface TrainingVariant {
  id: string;
  name: string;
  /** What this variant is trying, one line. */
  note: string;
  Stage: ComponentType<TrainingStageProps>;
  /** Modal title for a state; defaults to "Training your model". */
  title?: (state: WalkState) => ReactNode;
  /** Drop the Predict … based on … row under the modal header. */
  hideStatement?: boolean;
  /** Back to dataset always shown; Skip → / Continue → (see `TrainingModalShell`). */
  persistentBack?: boolean;
  /** Modal width; defaults to 880. */
  maxWidth?: number;
}

export const TRAINING_VARIANTS: TrainingVariant[] = [
  {
    id: "baseline",
    name: "Baseline",
    note: "The first sort-and-quiz layout — narrated left panel + tree (the lab now plays Row from the table)",
    Stage: TrainingRowWalkStage,
  },
  {
    id: "ride",
    name: "Row rides the tree",
    note: "No sidebar. Each answer flies off the row card onto the branch it took.",
    Stage: (props) => <TreeRide {...props} mode="lift" />,
  },
  {
    id: "highlight",
    name: "Highlight the match",
    note: "No sidebar. The cell being read and the branch it matches light up together.",
    Stage: (props) => <TreeRide {...props} mode="highlight" />,
  },
  {
    id: "table",
    name: "Row from the table",
    note: "Canonical — what the lab plays. Test rows rise in from the sheet under the tree; the guess fills the blank label cell.",
    Stage: TreeTableRow,
    hideStatement: TABLE_ROW_SHELL.hideStatement,
    persistentBack: TABLE_ROW_SHELL.persistentBack,
    maxWidth: TABLE_ROW_SHELL.maxWidth,
    title: tableRowTitle,
  },
];
