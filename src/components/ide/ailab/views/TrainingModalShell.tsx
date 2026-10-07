import type { ReactNode } from "react";
import { Modal } from "@moshebari/cads-react";
import { FaIcon } from "@moshebari/cads-react/icons";
import { columnById } from "../../../../lib/aiLab";
import type {
  AiLabColumn,
  AiLabDataRow,
  AiLabHoldoutResult,
  AiLabTreeNode,
} from "../../../../types/aiLab";
import { PredictionStatement } from "./PredictionStatement";
import styles from "./TrainingModal.module.scss";

/** Props both training bodies take; sort and quiz adds the sheet rows. */
export interface TrainingBodyProps {
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

export interface TrainingRowWalkProps extends TrainingBodyProps {
  rows: AiLabDataRow[];
  results: AiLabHoldoutResult[];
  /** Column that names a row on the quiz card (`animal` → "Bat"). */
  titleColumn?: string;
}

interface ShellProps
  extends Pick<
    TrainingBodyProps,
    "open" | "onClose" | "onTest" | "columns" | "labelColumn" | "features" | "canTest"
  > {
  /** Playback finished — footer swaps Skip for Back to data / Test model. */
  done: boolean;
  onSkip: () => void;
  /**
   * Narration under the statement. Pass `""` to keep the line's height
   * while there is nothing to say; omit it when the body narrates itself.
   */
  status?: string;
  maxWidth?: number;
  /**
   * Edge-to-edge body between the header and footer dividers: the
   * statement becomes a divided row and `children` fill the rest.
   */
  flush?: boolean;
  /** Defaults to "Training your model". */
  title?: ReactNode;
  /** Render inline on a static scrim instead of a portal (sandbox fixtures). */
  surfaceOnly?: boolean;
  /** Drop the Predict … based on … sentence; the body carries the columns itself. */
  hideStatement?: boolean;
  /**
   * Figma footer: **Back to dataset** and the close button are there the
   * whole time; the primary reads **Skip →**, then **Continue →**.
   */
  persistentBack?: boolean;
  children: ReactNode;
}

/**
 * The CADS Modal chrome both training animations share: fixed title, the
 * statement sentence, a live status line, and the Skip → Back to data /
 * Test model footer.
 */
export function TrainingModalShell({
  open,
  onClose,
  onTest,
  columns,
  labelColumn,
  features,
  canTest,
  done,
  onSkip,
  status,
  maxWidth = 760,
  flush = false,
  title = "Training your model",
  surfaceOnly = false,
  hideStatement = false,
  persistentBack = false,
  children,
}: ShellProps) {
  const arrowLabel = (text: string) => (
    <span className={styles.testLabel}>
      {text}
      <FaIcon name="arrow-right" fontSize="18px" />
    </span>
  );
  const primaryLabel = persistentBack
    ? arrowLabel(done ? "Continue" : "Skip")
    : done && canTest
      ? arrowLabel("Test model")
      : done
        ? "Back to data"
        : "Skip";

  return (
    <Modal
      open={open}
      surfaceOnly={surfaceOnly}
      title={title}
      maxWidth={maxWidth}
      isDismissable={done || persistentBack}
      hasSecondaryAction={done || persistentBack}
      primaryActionLabel={primaryLabel}
      secondaryActionLabel={persistentBack ? "Back to dataset" : "Back to data"}
      onPrimaryAction={done ? (canTest ? onTest : onClose) : onSkip}
      onSecondaryAction={done || persistentBack ? onClose : undefined}
      onClose={done || persistentBack ? onClose : undefined}
    >
      <div className={`${styles.body} ${flush ? styles.bodyFlush : ""}`}>
        {hideStatement ? null : (
          <PredictionStatement
            columns={columns}
            labelColumn={labelColumn}
            features={features}
            size="large"
            fit
            className={flush ? styles.statementRow : undefined}
          />
        )}
        {status !== undefined ? (
          <p className={styles.status} aria-live="polite">
            {status}
          </p>
        ) : null}
        {children}
      </div>
    </Modal>
  );
}

interface ResultsProps {
  right: number;
  total: number;
  /** Fades in when the animation is over; keeps its height while hidden. */
  on: boolean;
  children?: ReactNode;
}

/** Accuracy | Number correct | one-sentence explanation of what was drawn. */
export function TrainingResults({ right, total, on, children }: ResultsProps) {
  const percent = total ? Math.round((right / total) * 100) : 0;
  return (
    <div
      className={`${styles.results} ${on ? styles.resultsOn : ""}`}
      aria-hidden={!on}
    >
      <div className={styles.metric}>
        <span className={styles.metricLabel}>Accuracy</span>
        <span className={styles.metricValue}>{percent}%</span>
      </div>
      <div className={styles.metric}>
        <span className={styles.metricLabel}>Number correct</span>
        <span className={styles.metricValueNeutral}>
          {right}/{total}
        </span>
      </div>
      {children ? <p className={styles.explain}>{children}</p> : null}
    </div>
  );
}

export function listNames(columns: AiLabColumn[], ids: string[]): string {
  const names = ids.map((id) => columnById(columns, id)?.name ?? id);
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}
