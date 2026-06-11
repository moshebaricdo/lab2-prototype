import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./WorkspaceHeader.module.scss";

interface WorkspaceHeaderProps {
  left?: ReactNode;
  aiChangesActive: boolean;
}

export function WorkspaceHeader({
  left,
  aiChangesActive,
}: WorkspaceHeaderProps) {
  const [shimmerKey, setShimmerKey] = useState(0);
  const wasActiveRef = useRef(aiChangesActive);

  useEffect(() => {
    if (!wasActiveRef.current && aiChangesActive) {
      setShimmerKey((key) => key + 1);
    }
    wasActiveRef.current = aiChangesActive;
  }, [aiChangesActive]);

  return (
    <div className={`${styles.root} ${aiChangesActive ? styles.rootAi : ""}`}>
      {aiChangesActive ? (
        <div key={shimmerKey} className={styles.shimmer} aria-hidden />
      ) : null}

      <div className={styles.left}>{left}</div>

      <div className={styles.center}>
        <span
          className={`${styles.label} ${aiChangesActive ? styles.hidden : ""}`}
          aria-hidden={aiChangesActive}
        >
          WORKSPACE
        </span>
        <span
          className={`${styles.label} ${styles.labelAi} ${
            aiChangesActive ? "" : styles.hidden
          }`}
          aria-hidden={!aiChangesActive}
          aria-live="polite"
        >
          AI Tutor made changes
        </span>
      </div>
    </div>
  );
}
