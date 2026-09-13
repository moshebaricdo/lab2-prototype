import type { ReactNode } from "react";
import { FaIcon } from "@moshebaricdo/cads-react/icons";
import styles from "./VizFrame.module.scss";

interface VizFrameProps {
  /** Icon for the algorithm (decorative). */
  iconName: string;
  title: string;
  /** Short factual line after the title: "12 questions · 20 outcomes". */
  meta?: string;
  /** Right-aligned toolbar controls (view switchers). */
  tools?: ReactNode;
  /** The canvas. Owns its own scrolling; the frame gives it the remaining height. */
  children: ReactNode;
  /** Footer strip beneath the canvas (usually `TraceBar`). */
  footer?: ReactNode;
  /** Hide the title toolbar when the parent already owns that chrome. */
  hideToolbar?: boolean;
  /** Accessible name for the whole region. */
  ariaLabel: string;
}

/**
 * Shared chrome around a model visualization: a slim toolbar (what am I
 * looking at + view controls), the canvas, and a footer for stepping
 * through how the model decided. Both algorithms use the same frame so the
 * student learns one set of controls.
 */
export function VizFrame({
  iconName,
  title,
  meta,
  tools,
  children,
  footer,
  hideToolbar = false,
  ariaLabel,
}: VizFrameProps) {
  return (
    <section className={styles.root} aria-label={ariaLabel}>
      {hideToolbar ? null : (
        <div className={styles.toolbar}>
          <div className={styles.lead}>
            <span className={styles.leadIcon} aria-hidden>
              <FaIcon name={iconName} size="small" />
            </span>
            <h3 className={styles.title}>{title}</h3>
            {meta ? <span className={styles.meta}>{meta}</span> : null}
          </div>
          {tools ? <div className={styles.tools}>{tools}</div> : null}
        </div>
      )}
      <div className={styles.body}>{children}</div>
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </section>
  );
}
