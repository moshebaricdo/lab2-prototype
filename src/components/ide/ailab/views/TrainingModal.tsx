import { useEffect, useMemo, useRef, useState } from "react";
import type { AiLabController } from "../../../../hooks/useAiLabState";
import {
  cartRegressionTolerance,
  columnById,
  columnType,
  uniqueValues,
} from "../../../../lib/aiLab";
import {
  TrainingModalShell,
  TrainingResults,
  listNames,
  type TrainingBodyProps,
} from "./TrainingModalShell";
import { FaIcon } from "@moshebari/cads-react/icons";
import { PredictionStatement } from "./PredictionStatement";
import { TABLE_ROW_SHELL, TrainingTableRow } from "./TreeTableRow";
import { TreeGrowth, treeScore, useGrowthLayout } from "./viz/TreeGrowth";
import { prefersReducedMotion } from "./viz/useStepPlayback";
import styles from "./TrainingModal.module.scss";

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
 * The training step for a decision tree. Opens right after Train model;
 * what plays is the level's `trainingAnimation`: sort and quiz (default —
 * `TrainingTableRow`: rows as dots sorted into piles, then a few test rows
 * rise in from the sheet and get guessed) or the tree growing top-down
 * (`tree`, kept as a fallback). Both end on the same score. Replay
 * training reopens it.
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
  if (lab.config.skipTrainingWalk) {
    return <TrainingQuietModal key={key} {...shared} accuracy={model.accuracy} />;
  }
  if (lab.config.trainingAnimation === "tree") {
    const tolerance =
      columnType(columns, model.labelColumn) === "numerical"
        ? cartRegressionTolerance(lab.rows, model.labelColumn)
        : 0;
    return <TreeGrowthBody key={key} {...shared} tolerance={tolerance} />;
  }
  return (
    <TrainingTableRow
      key={key}
      {...shared}
      rows={lab.rows}
      results={model.holdoutResults}
      titleColumn={lab.config.cardTitleColumn}
    />
  );
}

/**
 * Upload level: the same training modal, already finished, with an empty
 * stage where the walk would play. Continue and Back to dataset are immediate.
 */
function TrainingQuietModal({
  open,
  onClose,
  onTest,
  columns,
  labelColumn,
  features,
  canTest,
  accuracy,
}: TrainingBodyProps & { accuracy: number }) {
  const percent = Math.round(accuracy * 100);
  return (
    <TrainingModalShell
      {...TABLE_ROW_SHELL}
      open={open}
      title="Training your model"
      onClose={onClose}
      onTest={onTest}
      columns={columns}
      labelColumn={labelColumn}
      features={features}
      canTest={canTest}
      done
      onSkip={() => {}}
    >
      <div className={styles.quiet}>
        <div className={styles.quietCanvas}>
          <div className={styles.quietCard}>
            <span className={styles.quietIcon} aria-hidden>
              <FaIcon name="empty-set" className={styles.quietGlyph} />
            </span>
            <h2 className={styles.quietTitle}>Model trained and tested</h2>
            <p className={styles.quietText}>
              Your model is ready. This is just a placeholder for the training and testing animation.
            </p>
          </div>
        </div>
        <div className={styles.quietStatement}>
          <PredictionStatement
            columns={columns}
            labelColumn={labelColumn}
            features={features}
            size="large"
            fit
          />
          <span className={styles.quietAccuracy}>{percent}% Accuracy</span>
        </div>
      </div>
    </TrainingModalShell>
  );
}

/**
 * Fallback playback (`trainingAnimation: "tree"`): the finished tree grows
 * top-down one node at a time, then every leaf is marked right / wrong
 * before the score.
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
  tolerance = 0,
}: TrainingBodyProps & { tolerance?: number }) {
  const { order } = useGrowthLayout(tree);
  const total = order.length;
  const score = useMemo(() => treeScore(tree, tolerance), [tolerance, tree]);
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
        tolerance={tolerance}
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
