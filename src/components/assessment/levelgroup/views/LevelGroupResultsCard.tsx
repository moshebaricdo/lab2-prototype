import { FaIcon } from "../../../ui/icons/FaIcon";
import { Button } from "@moshebaricdo/cads-react";
import type { LevelGroupQuestionBlock } from "../../../../data/assessment/levelGroup";
import {
  blockMeetsExpectations,
  type LevelGroupFlowState,
} from "./LevelGroupFlowBlocks";
import styles from "./LevelGroupResultsCard.module.scss";

interface LevelGroupResultsCardProps {
  steps: LevelGroupQuestionBlock[];
  flow: LevelGroupFlowState;
  surveyMode?: boolean;
  assessmentTitle: string;
  onStartOver: () => void;
  /** e.g. "1 of 2" — shown as "1 of 2 attempts". Omit to hide. */
  attemptLabel?: string;
  /** Elapsed time string, e.g. "23:58". Shown as "23:58 mins". Omit to hide. */
  elapsedTime?: string;
  /** Primary action after reviewing results — omit to hide. */
  onContinue?: () => void;
  continueLabel?: string;
}

const RING_RADIUS = 30;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function LevelGroupResultsCard({
  steps,
  flow,
  surveyMode,
  assessmentTitle,
  onStartOver,
  attemptLabel,
  elapsedTime,
  onContinue,
  continueLabel = "Continue",
}: LevelGroupResultsCardProps) {
  const total = steps.length;
  const correct = steps.filter((s) =>
    blockMeetsExpectations(s, flow, surveyMode),
  ).length;
  const pct = total > 0 ? correct / total : 0;

  const fillClass = correct === total
    ? styles.scoreRingFillSuccess
    : pct >= 0.5
      ? styles.scoreRingFillPartial
      : styles.scoreRingFillLow;

  const dashOffset = RING_CIRCUMFERENCE * (1 - pct);

  const hasMeta = Boolean(attemptLabel || elapsedTime);

  return (
    <div className={styles.resultsCard}>
      <div className={styles.layout}>
        <div className={styles.scoreRing}>
          <svg className={styles.scoreRingSvg} viewBox="0 0 72 72">
            <circle
              className={styles.scoreRingBg}
              cx="36"
              cy="36"
              r={RING_RADIUS}
            />
            <circle
              className={[styles.scoreRingFill, fillClass].join(" ")}
              cx="36"
              cy="36"
              r={RING_RADIUS}
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <span className={styles.scoreRingLabel}>
            {surveyMode ? (
              <FaIcon name="check" size="m" />
            ) : (
              `${correct}/${total}`
            )}
          </span>
        </div>

        <div className={styles.scoreBody}>
          <h3 className={styles.scoreHeadline}>{assessmentTitle}</h3>
          {hasMeta && (
            <div className={styles.metaRow}>
              {attemptLabel && (
                <span className={styles.metaItem}>
                  <FaIcon
                    name="circle-question"
                    size="s"
                    className={styles.metaIcon}
                    aria-hidden
                  />
                  <span>{attemptLabel} attempts</span>
                </span>
              )}
              {elapsedTime && (
                <span className={styles.metaItem}>
                  <FaIcon
                    name="clock"
                    size="s"
                    className={styles.metaIcon}
                    aria-hidden
                  />
                  <span>{elapsedTime} mins</span>
                </span>
              )}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <Button
            variant="outlined" color="secondary"
            size="medium"
            startIconName="rotate-right"
            onClick={onStartOver}
          >
            Try again
          </Button>
          {onContinue ? (
            <Button
              variant="contained" color="primary"
              size="medium"
              endIconName="arrow-right"
              onClick={onContinue}
            >
              {continueLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
