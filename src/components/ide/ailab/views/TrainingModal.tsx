import { useEffect, useMemo, useState } from "react";
import { Modal } from "@moshebari/cads-react";
import { FaIcon } from "@moshebari/cads-react/icons";
import type { AiLabController } from "../../../../hooks/useAiLabState";
import { columnById, uniqueValues } from "../../../../lib/aiLab";
import type { AiLabColumn, AiLabTreeNode } from "../../../../types/aiLab";
import { PredictionStatement } from "./PredictionStatement";
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
 * The training step for a decision tree. Opens right after Train model:
 * a fixed "Training your model" title, the statement above the tree, the
 * tree growing top-down from the rows, each leaf marked with how many
 * rows it gets right, then the score. Replay training reopens it.
 */
export function TrainingModal({ lab, open, onClose, onTest }: TrainingModalProps) {
  const model = lab.model;
  const tree = model?.tree;
  const columns = lab.config.dataset.columns;
  if (!tree || !model) return null;
  return (
    <TrainingModalBody
      key={`${model.labelColumn}|${model.selectedFeatures.join(",")}|${lab.rows.length}`}
      open={open}
      onClose={onClose}
      onTest={onTest}
      tree={tree}
      columns={columns}
      labelColumn={model.labelColumn}
      features={model.selectedFeatures}
      labels={uniqueValues(lab.rows, model.labelColumn)}
      rowNoun={lab.config.dataset.story?.rowNoun ?? "row"}
      canTest={!lab.config.hideTestTab && lab.canVisit("test")}
    />
  );
}

interface BodyProps {
  open: boolean;
  onClose: () => void;
  onTest: () => void;
  tree: AiLabTreeNode;
  columns: AiLabColumn[];
  labelColumn: string;
  features: string[];
  labels: string[];
  rowNoun: string;
  canTest: boolean;
}

function TrainingModalBody({
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
}: BodyProps) {
  const { order } = useGrowthLayout(tree);
  const total = order.length;
  const score = useMemo(() => treeScore(tree), [tree]);
  const [revealed, setRevealed] = useState(0);
  const [phase, setPhase] = useState<Phase>("growing");
  const [instant, setInstant] = useState(false);

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
    return () => clearTimeout(timer);
  }, [open, total]);

  const skip = () => {
    setInstant(true);
    setRevealed(total);
    setPhase("done");
  };

  const labelName = columnById(columns, labelColumn)?.name ?? labelColumn;
  const plural = `${score.total} ${rowNoun}${score.total === 1 ? "" : "s"}`;
  const percent = score.total ? Math.round((score.right / score.total) * 100) : 0;
  const status =
    phase === "growing"
      ? `Sorting ${plural} into groups by asking questions about ${listNames(columns, features)}…`
      : phase === "checking"
        ? `Checking each group's guess against the real ${labelName}…`
        : undefined;
  const done = phase === "done";
  const primaryLabel =
    done && canTest ? (
      <span className={styles.testLabel}>
        Test model
        <FaIcon name="arrow-right" fontSize="18px" />
      </span>
    ) : done ? (
      "Back to data"
    ) : (
      "Skip"
    );

  return (
    <Modal
      open={open}
      title="Training your model"
      maxWidth={760}
      isDismissable={done}
      hasSecondaryAction={done}
      primaryActionLabel={primaryLabel}
      secondaryActionLabel="Back to data"
      onPrimaryAction={done ? (canTest ? onTest : onClose) : skip}
      onSecondaryAction={done ? onClose : undefined}
      onClose={done ? onClose : undefined}
    >
      <div className={styles.body}>
        <PredictionStatement
          columns={columns}
          labelColumn={labelColumn}
          features={features}
          size="large"
        />
        {status ? (
          <p className={styles.status} aria-live="polite">
            {status}
          </p>
        ) : null}
        <TreeGrowth
          root={tree}
          columns={columns}
          labels={labels}
          revealedCount={revealed}
          showVerdicts={phase !== "growing"}
          instant={instant}
        />
        <div
          className={`${styles.results} ${done ? styles.resultsOn : ""}`}
          aria-hidden={!done}
        >
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Accuracy</span>
            <span className={styles.metricValue}>{percent}%</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Number correct</span>
            <span className={styles.metricValueNeutral}>
              {score.right}/{score.total}
            </span>
          </div>
          <p className={styles.explain}>
            Each box is a group of {rowNoun}s that answered the questions the
            same way. The colored bar is the mix of real {labelName} values in
            the group; the model guesses the biggest slice, so the rest are
            marked wrong.
          </p>
        </div>
      </div>
    </Modal>
  );
}

function listNames(columns: AiLabColumn[], ids: string[]): string {
  const names = ids.map((id) => columnById(columns, id)?.name ?? id);
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}
