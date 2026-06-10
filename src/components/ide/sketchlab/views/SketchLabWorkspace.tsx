import { useCallback, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { SketchCanvasTool, SketchLegacyEdge, SketchNode } from "../../../../types/sketchLab";
import { useSketchLabState } from "../../../../hooks/useSketchLabState";
import { SketchLabActionsProvider } from "./SketchLabActionsContext";
import "../sketchLabPalette.scss";
import { SketchFlowCanvas } from "./SketchFlowCanvas";
import { SketchLabHeader } from "./SketchLabHeader";
import { NodePalette } from "./NodePalette";
import { PropertyPanel } from "./panel/PropertyPanel";
import styles from "./SketchLabWorkspace.module.scss";

export interface SketchLabWorkspaceProps {
  initialNodes: SketchNode[];
  /** @deprecated Legacy edges are migrated into standalone line nodes on load. */
  initialEdges?: SketchLegacyEdge[];
  storageKey?: string;
}

export function SketchLabWorkspace({
  initialNodes,
  initialEdges = [],
  storageKey,
}: SketchLabWorkspaceProps) {
  const canvas = useSketchLabState({ initialNodes, initialEdges, storageKey });
  const [canvasTool, setCanvasTool] = useState<SketchCanvasTool>("grab");

  const handleDownload = useCallback(() => {
    if (typeof window === "undefined") return;
    const payload = JSON.stringify({ nodes: canvas.nodes }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sketch.json";
    link.click();
    URL.revokeObjectURL(url);
  }, [canvas.nodes]);

  const handleStartOver = useCallback(() => {
    const confirmed =
      typeof window === "undefined" ||
      window.confirm("Start over? This clears the canvas and restores the starting sketch.");
    if (confirmed) canvas.resetCanvas();
  }, [canvas]);

  return (
    <main className={styles.root}>
      <SketchLabHeader onDownload={handleDownload} onStartOver={handleStartOver} />
      <div className={styles.canvasWrap}>
        <SketchLabActionsProvider
          value={{
            updateNodeData: canvas.updateNodeData,
            selectNode: canvas.selectNode,
            dragLineEndpoint: canvas.dragLineEndpoint,
            beginHistoryStep: canvas.beginHistoryStep,
            connectHintId: canvas.connectHintId,
            setConnectHintId: canvas.setConnectHintId,
          }}
        >
          <ReactFlowProvider>
            <SketchFlowCanvas canvas={canvas} canvasTool={canvasTool} />
            <NodePalette
              canvasTool={canvasTool}
              onCanvasToolChange={setCanvasTool}
              onAddShape={(shape) => canvas.addNode("shape", shape)}
              onAddText={() => canvas.addNode("text")}
              onAddImage={canvas.addImage}
              onAddLine={canvas.addLine}
            />
            <PropertyPanel
              selectedNode={canvas.selectedNode}
              onUpdateNodeData={canvas.updateNodeData}
              onDuplicate={canvas.duplicateNode}
              onBringForward={canvas.bringNodeForward}
              onSendToBack={canvas.sendNodeToBack}
              onDeleteNode={canvas.deleteNode}
              onClose={canvas.clearSelection}
            />
          </ReactFlowProvider>
        </SketchLabActionsProvider>
      </div>
    </main>
  );
}
