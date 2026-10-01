import { useEffect, useMemo, useRef, useState } from "react";
import type { AiLabController } from "../../../../hooks/useAiLabState";
import { columnById, uniqueValues } from "../../../../lib/aiLab";
import {
  TrainingModalShell,
  TrainingResults,
  listNames,
  type TrainingBodyProps,
} from "./TrainingModalShell";
import { TrainingRowWalk } from "./TrainingRowWalk";
import { TreeGrowth, treeScore, useGrowthLayout } from "./viz/TreeGrowth";
import { prefersReducedMotion } from "./viz/useStepPlayback";

/** Time each node takes to land while the tree grows. */
const NODE_MS = 650;
/** Pause between the last node and the leaf verdicts, and before results. */
const SETTLE_MS = 700;

type Phase = "growing" | "checking" | "done";

interface TrainingModalProps {
  lab: AiLabController;
  open: boolean;
  /** Back to data. */
  onClose: () => void;
  /** Test model →. */
  onTest: () => void;
}

/**
 * The training step for a decision tree. Opens right after Train model
 * with a fixed "Training your model" title and the statement above the
 * stage. What plays underneath is the level's `trainingAnimation`: the
 * tree growing top-down (default) or sort-and-quiz (rows as dots sorted
 * into piles, then a few rows guessed with the label hidden). Both end on
 * the same score. Replay training reopens it.
 */
export function TrainingModal({ lab, open, onClose, onTest }: TrainingModalProps) {
  const model = lab.model;
  const tree = model?.tree;
  const columns = lab.config.dataset.columns;
  if (!tree || !model) return null;
  const shared: TrainingBodyProps = {
    open,
    onClose,
    onTest,
    tree,
    columns,
    labelColumn: model.labelColumn,
    features: model.selectedFeatures,
    labels: uniqueValues(lab.rows, model.labelColumn),
    rowNoun: lab.config.dataset.story?.rowNoun ?? "row",
    canTest: !lab.config.hideTestTab && lab.canVisit("test"),
  };
  const key = `${model.labelColumn}|${model.selectedFeatures.join(",")}|${lab.rows.length}`;
  if (lab.config.trainingAnimation === "rows") {
    return (
      <TrainingRowWalk
        key={key}
        {...shared}
        rows={lab.rows}
        results={model.holdoutResults}
        titleColumn={lab.config.cardTitleColumn}
      />
    );
  }
  return <TreeGrowthBody key={key} {...shared} />;
}

/**
 * Default playback: the finished tree grows top-down one node at a time,
 * then every leaf is marked right / wrong before the score.
 */
function TreeGrowthBody({
  open,
  onClose,
  onTest,
  tree,
  columns,
  labelColumn,
  features,
  labels,
  rowNoun,
  canTest,
}: TrainingBodyProps) {
  const { order } = useGrowthLayout(tree);
  const total = order.length;
  const score = useMemo(() => treeScore(tree), [tree]);
  const [revealed, setRevealed] = useState(0);
  const [phase, setPhase] = useState<Phase>("growing");
  const [instant, setInstant] = useState(false);
  const stopRef = useRef<() => void>(() => {});

  // Every open starts a fresh walk; reduced motion lands on the result.
  useEffect(() => {
    if (!open) return;
    if (prefersReducedMotion()) {
      setInstant(true);
      setRevealed(total);
      setPhase("done");
      return;
    }
    setInstant(false);
    setRevealed(0);
    setPhase("growing");
    let count = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      count += 1;
      setRevealed(count);
      if (count < total) {
        timer = setTimeout(tick, NODE_MS);
        return;
      }
      timer = setTimeout(() => {
        setPhase("checking");
        timer = setTimeout(() => setPhase("done"), SETTLE_MS);
      }, SETTLE_MS);
    };
    timer = setTimeout(tick, NODE_MS);
    const stop = () => clearTimeout(timer);
    stopRef.current = stop;
    return stop;
  }, [open, total]);

  const skip = () => {
    stopRef.current();
    setInstant(true);
    setRevealed(total);
    setPhase("done");
  };

  const labelName = columnById(columns, labelColumn)?.name ?? labelColumn;
  const plural = `${score.total} ${rowNoun}${score.total === 1 ? "" : "s"}`;
  const status =
    phase === "growing"
      ? `Sorting ${plural} into groups by asking questions about ${listNames(columns, features)}…`
      : phase === "checking"
        ? `Checking each group's guess against the real ${labelName}…`
        : "";
  const done = phase === "done";

  return (
    <TrainingModalShell
      open={open}
      onClose={onClose}
      onTest={onTest}
      columns={columns}
      labelColumn={labelColumn}
      features={features}
      canTest={canTest}
      done={done}
      onSkip={skip}
      status={status}
    >
      <TreeGrowth
        root={tree}
        columns={columns}
        labels={labels}
        revealedCount={revealed}
        showVerdicts={phase !== "growing"}
        instant={instant}
      />
      <TrainingResults right={score.right} total={score.total} on={done}>
        Each box is a group of {rowNoun}s that answered the questions the same
        way. The colored bar is the mix of real {labelName} values in the
        group; the model guesses the biggest slice, so the rest are marked
        wrong.
      </TrainingResults>
    </TrainingModalShell>
  );
}
