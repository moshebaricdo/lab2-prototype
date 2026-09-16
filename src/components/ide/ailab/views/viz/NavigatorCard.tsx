import type { ReactNode } from "react";
import { TraceBar, type TraceStep } from "./TraceBar";
import styles from "./NavigatorCard.module.scss";

interface NavigatorCardProps {
  steps: TraceStep[];
  index: number;
  onIndexChange: (index: number) => void;
  emptyText: string;
  /** Feature leaders / vote tally — sits with the statement in the lede. */
  metrics?: ReactNode;
  /** Extra body below the lede — neighbor list, etc. */
  children?: ReactNode;
  footer?: ReactNode;
}

function clampIndex(index: number, total: number): number {
  return Math.min(Math.max(index, 0), Math.max(total - 1, 0));
}

/**
 * Floating Play + stepper card shared by KNN and the decision tree. The
 * canvas stays full-bleed; this sits on top of it.
 */
export function NavigatorCard({
  steps,
  index,
  onIndexChange,
  emptyText,
  metrics,
  children,
  footer,
}: NavigatorCardProps) {
  const total = steps.length;
  const hasSteps = total > 0;
  const clamped = clampIndex(index, total);
  const current = steps[clamped];

  return (
    <aside className={styles.card} aria-label="Trace navigator">
      <div className={styles.head}>
        <TraceBar
          orientation="toolbar"
          steps={steps}
          index={index}
          onIndexChange={onIndexChange}
          emptyText={emptyText}
        />
      </div>
      <div className={styles.main}>
        <div className={styles.lede}>
          <p className={hasSteps ? styles.statement : styles.empty}>
            {hasSteps ? current?.statement : emptyText}
          </p>
          {metrics}
        </div>
        {children ? <div className={styles.body}>{children}</div> : null}
      </div>
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </aside>
  );
}
