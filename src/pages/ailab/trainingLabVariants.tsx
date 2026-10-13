import type { ComponentType, ReactNode } from "react";
import { TrainingRowWalkStage } from "../../components/ide/ailab/views/TrainingRowWalk";
import { TreeRide } from "../../components/ide/ailab/views/TreeRide";
import {
  TABLE_ROW_SHELL,
  TreeTableRow,
  tableRowTitle,
} from "../../components/ide/ailab/views/TreeTableRow";
import type {
  GrowthMode,
  TrainingStageProps,
  TrainingStory,
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
  /** How Training is told (`useTrainingWalk`); defaults to `sort`. */
  story?: TrainingStory;
  /** `grow` only: open on the data table narrowing and scrolling. */
  intro?: boolean;
  /** `grow` only: how the tree takes shape; defaults to `organic`. */
  growth?: GrowthMode;
}

const TABLE_ROW_CHROME = {
  hideStatement: TABLE_ROW_SHELL.hideStatement,
  persistentBack: TABLE_ROW_SHELL.persistentBack,
  maxWidth: TABLE_ROW_SHELL.maxWidth,
  title: tableRowTitle,
} satisfies Partial<TrainingVariant>;

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
    ...TABLE_ROW_CHROME,
  },
  {
    id: "scan",
    name: "Scan for the best question",
    note: "How our trainer really works: each pile tries every column's question (ghost piles + how well it sorts), keeps the best, then splits.",
    Stage: TreeTableRow,
    story: "scan",
    ...TABLE_ROW_CHROME,
  },
  {
    id: "scan-plain",
    name: "Scan (no meter)",
    note: "Scan for the best question without the bar: students judge each try by its piles' colors.",
    Stage: (props) => <TreeTableRow {...props} scanMeter={false} />,
    story: "scan",
    ...TABLE_ROW_CHROME,
  },
  {
    id: "grow",
    name: "Rows grow the tree",
    note: "The first 6 rows drop into a dock over the tree, get scanned, and their label's dot drops into the tree; then the rest pour in, faster each batch. Not how our trainer works; ends on the real tree so Testing matches.",
    Stage: TreeTableRow,
    story: "grow",
    ...TABLE_ROW_CHROME,
  },
  {
    id: "table-to-tree",
    name: "Table to tree",
    note: "Rows grow the tree, opened by the data: the whole table appears, narrows to the chosen columns (label on the right), spins like a lotto wheel while it closes down to one row, and stops on the first training row as the tree appears.",
    Stage: TreeTableRow,
    story: "grow",
    intro: true,
    ...TABLE_ROW_CHROME,
  },
  {
    id: "table-to-tree-paired",
    name: "Table to tree (paired branches)",
    note: "Table to tree, closer to a real split: when a question appears both its branches sprout at once (empty ones at 0), and the first rows are picked to cover both sides early.",
    Stage: TreeTableRow,
    story: "grow",
    intro: true,
    growth: "paired",
    ...TABLE_ROW_CHROME,
  },
  {
    id: "table-to-tree-batch",
    name: "Table to tree (whole table first)",
    note: "How our trainer really builds it: after the table, the whole tree builds from all the rows while the first row waits in the dock; the rows then sort into it.",
    Stage: TreeTableRow,
    story: "grow",
    intro: true,
    growth: "batch",
    ...TABLE_ROW_CHROME,
  },
];
