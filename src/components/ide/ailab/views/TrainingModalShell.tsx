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
  children,
}: ShellProps) {
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
      maxWidth={maxWidth}
      isDismissable={done}
      hasSecondaryAction={done}
      primaryActionLabel={primaryLabel}
      secondaryActionLabel="Back to data"
      onPrimaryAction={done ? (canTest ? onTest : onClose) : onSkip}
      onSecondaryAction={done ? onClose : undefined}
      onClose={done ? onClose : undefined}
    >
      <div className={`${styles.body} ${flush ? styles.bodyFlush : ""}`}>
        <PredictionStatement
          columns={columns}
          labelColumn={labelColumn}
          features={features}
          size="large"
          className={flush ? styles.statementRow : undefined}
        />
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
