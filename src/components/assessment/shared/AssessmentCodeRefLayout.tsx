import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { CodePanelConfig } from "../../../data/assessment/codePanel";
import { CodeReferencePanel } from "./CodeReferencePanel";
import styles from "./AssessmentCodeRefLayout.module.scss";

interface AssessmentCodeRefLayoutProps {
  codePanel: CodePanelConfig;
  /** Optional action buttons for the code panel header (e.g. Run, Copy, Reset). */
  codePanelActions?: ReactNode;
  /** Compact mode for embedding inside another card/workspace. */
  embedded?: boolean;
  /** Keep code panel sticky and capped to viewport height (for long assessment scroll layouts). */
  stickyCodePanel?: boolean;
  /** When true, the code panel is editable instead of read-only. */
  editable?: boolean;
  /** Called when the user edits code. Receives the file index and new content. */
  onContentChange?: (fileIndex: number, content: string) => void;
  children: ReactNode;
}

/**
 * Two-column assessment layout: question card on the left and code panel on
 * the right, with a resizable split between them.
 */
export function AssessmentCodeRefLayout({
  codePanel,
  codePanelActions,
  embedded = false,
  stickyCodePanel = false,
  editable = false,
  onContentChange,
  children,
}: AssessmentCodeRefLayoutProps) {
  const workspaceRef = useRef<HTMLElement>(null);
  const codePanelRef = useRef<HTMLDivElement>(null);
  const assessmentCardRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const [codePanelWidth, setCodePanelWidth] = useState<number | null>(null);
  const [assessmentHeight, setAssessmentHeight] = useState<number | null>(null);
  const [stickyMaxHeight, setStickyMaxHeight] = useState<number | null>(null);
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
        return clampWidth(current - delta);
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

  useEffect(() => {
    const assessmentNode = assessmentCardRef.current;
    if (!assessmentNode) return;

    const syncHeight = () => {
      setAssessmentHeight(assessmentNode.getBoundingClientRect().height);
    };

    syncHeight();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", syncHeight);
      return () => {
        window.removeEventListener("resize", syncHeight);
      };
    }

    const observer = new ResizeObserver(syncHeight);
    observer.observe(assessmentNode);
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!stickyCodePanel) return;
    const workspaceNode = workspaceRef.current;
    if (!workspaceNode) return;

    const syncStickyMaxHeight = () => {
      // workspace has 32px top + 32px bottom padding.
      setStickyMaxHeight(Math.max(240, workspaceNode.clientHeight - 64));
    };

    syncStickyMaxHeight();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", syncStickyMaxHeight);
      return () => {
        window.removeEventListener("resize", syncStickyMaxHeight);
      };
    }

    const observer = new ResizeObserver(syncStickyMaxHeight);
    observer.observe(workspaceNode);
    return () => {
      observer.disconnect();
    };
  }, [stickyCodePanel]);

  const defaultRatio = codePanel.defaultWidthRatio ?? 0.5;
  const resolvedCodeHeight =
    stickyCodePanel && stickyMaxHeight != null
      ? Math.min(assessmentHeight ?? stickyMaxHeight, stickyMaxHeight)
      : assessmentHeight ?? undefined;
  const codeCardStyle =
    codePanelWidth != null
      ? { width: codePanelWidth, flex: "none", height: resolvedCodeHeight }
      : { flex: `${defaultRatio} 1 0%`, height: resolvedCodeHeight };

  return (
    <main
      ref={workspaceRef}
      className={[styles.workspace, embedded ? styles.workspaceEmbedded : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        ref={rowRef}
        className={[styles.splitRow, embedded ? styles.splitRowEmbedded : ""]
          .filter(Boolean)
          .join(" ")}
      >
        <div
          ref={assessmentCardRef}
          className={styles.assessmentCard}
          style={codePanelWidth == null ? { flex: `${1 - defaultRatio} 1 0%` } : { flex: "1 1 0%" }}
        >
          <div className={styles.assessmentScroll}>
            <div className={styles.assessmentBody}>{children}</div>
          </div>
          <div
            className={`${styles.resizeEdge} ${styles.resizeEdgeRight} ${isDragging ? styles.resizeEdgeDragging : ""}`}
            onMouseDown={handleEdgeMouseDown}
          />
        </div>

        <div
          className={`${styles.resizeGap} ${isDragging ? styles.resizeGapDragging : ""}`}
          onMouseDown={handleEdgeMouseDown}
        />

        <div
          ref={codePanelRef}
          className={`${styles.codeCard} ${stickyCodePanel ? styles.codeCardSticky : ""}`}
          style={codeCardStyle}
        >
          <CodeReferencePanel
            files={codePanel.files}
            headerActions={codePanelActions}
            editable={editable}
            onContentChange={onContentChange}
          />
          <div
            className={`${styles.resizeEdge} ${styles.resizeEdgeLeft} ${isDragging ? styles.resizeEdgeDragging : ""}`}
            onMouseDown={handleEdgeMouseDown}
          />
        </div>
      </div>
    </main>
  );
}
