import type { ReactNode } from "react";
import styles from "./PanelHeader.module.scss";

interface PanelHeaderProps {
  label: string;
  left?: ReactNode;
  right?: ReactNode;
  /** Render a top border instead of bottom (e.g. console divider). */
  borderTop?: boolean;
  className?: string;
}

export function PanelHeader({
  label,
  left,
  right,
  borderTop = false,
  className = "",
}: PanelHeaderProps) {
  return (
    <div
      className={[
        styles.root,
        borderTop ? styles.borderTop : styles.borderBottom,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {left ?? <div />}
      <label className={styles.label}>{label}</label>
      {right ?? <div />}
    </div>
  );
}
