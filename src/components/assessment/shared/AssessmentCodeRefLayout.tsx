import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { CodePanelConfig } from "../../../data/assessment/codePanel";
import { CodeReferencePanel } from "./CodeReferencePanel";
import styles from "./AssessmentCodeRefLayout.module.scss";

interface AssessmentCodeRefLayoutProps {
  codePanel: CodePanelConfig;
  /** Optional action buttons for the code panel header (e.g. Run, Copy, Reset). */
  codePanelActions?: ReactNode;
  children: ReactNode;
}

/**
 * Two-column assessment layout: a code-reference card on the left and an
 * assessment card on the right, separated by a 16px gap. The right edge
 * of the code card is the resize target — no visible divider line.
 */
export function AssessmentCodeRefLayout({
  codePanel,
  codePanelActions,
  children,
}: AssessmentCodeRefLayoutProps) {
  const codePanelRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const [codePanelWidth, setCodePanelWidth] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);

  const clampWidth = useCallback(
    (width: number) => {
      const rowWidth =
        rowRef.current?.getBoundingClientRect().width ?? 1000;
      const minCode = 260;
      const minAssessment = 300;
      const gap = 16;
      return Math.max(minCode, Math.min(width, rowWidth - minAssessment - gap));
    },
    [],
  );

  const handleEdgeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      startXRef.current = e.clientX;
    },
    [],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startXRef.current;
      startXRef.current = e.clientX;
      setCodePanelWidth((prev) => {
        const current =
          prev ?? codePanelRef.current?.getBoundingClientRect().width ?? 400;
        return clampWidth(current + delta);
      });
    };

    const handleMouseUp = () => setIsDragging(false);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, clampWidth]);

  const defaultRatio = codePanel.defaultWidthRatio ?? 0.5;

  return (
    <main className={styles.workspace}>
      <div ref={rowRef} className={styles.splitRow}>
        <div
          ref={codePanelRef}
          className={styles.codeCard}
          style={
            codePanelWidth != null
              ? { width: codePanelWidth, flex: "none" }
              : { flex: `${defaultRatio} 1 0%` }
          }
        >
          <CodeReferencePanel files={codePanel.files} headerActions={codePanelActions} />
          <div
            className={`${styles.resizeEdge} ${isDragging ? styles.resizeEdgeDragging : ""}`}
            onMouseDown={handleEdgeMouseDown}
          />
        </div>

        <div className={styles.assessmentCard}>
          <div className={styles.assessmentScroll}>
            <div className={styles.assessmentBody}>{children}</div>
          </div>
        </div>
      </div>
    </main>
  );
}
