import { useCallback, useEffect, useRef, useState } from "react";
import { useBackpack } from "../../../../hooks/BackpackContext";
import { importBackpackItemToSketch } from "../../../../lib/backpack/importBackpackItemToSketch";
import type { BackpackItem } from "../../../../types/backpack";
import { ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { SketchCanvasTool, SketchLegacyEdge, SketchNode } from "../../../../types/sketchLab";
import { useSketchLabState } from "../../../../hooks/useSketchLabState";
import { exportSketchImage, type SketchExportOptions } from "../exportSketchToPng";
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
  onRegisterBackpackImport?: (
    handler: (item: BackpackItem) => true | string,
  ) => void;
}

export function SketchLabWorkspace({
  initialNodes,
  initialEdges = [],
  storageKey,
  onRegisterBackpackImport,
}: SketchLabWorkspaceProps) {
  const canvas = useSketchLabState({ initialNodes, initialEdges, storageKey });
  const { saveFileToBackpack, setShowSaveErrorAlert } = useBackpack();
  const [canvasTool, setCanvasTool] = useState<SketchCanvasTool>("select");
  const canvasWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onRegisterBackpackImport) return;
    onRegisterBackpackImport((item) =>
      importBackpackItemToSketch(item, canvas.addImage),
    );
  }, [canvas.addImage, onRegisterBackpackImport]);

  // Capture the whole sketch, framed to the bounding box of every node so the
  // artifact never depends on the current pan/zoom. Scoped to this workspace's
  // viewport element to avoid colliding with other ReactFlow trees.
  const captureSketch = useCallback(
    (exportOptions: SketchExportOptions) => {
      const viewportEl =
        canvasWrapRef.current?.querySelector<HTMLElement>(".react-flow__viewport") ?? null;
      return exportSketchImage(canvas.nodes, viewportEl, exportOptions);
    },
    [canvas.nodes],
  );

  const handleDownloadLocal = useCallback(async () => {
    if (typeof window === "undefined") return;
    try {
      // Full-resolution PNG for the downloaded file — no storage constraints.
      const result = await captureSketch({ format: "png", pixelRatio: 2 });
      if (!result) return;
      const link = document.createElement("a");
      link.href = result.dataUrl;
      link.download = "sketch.png";
      link.click();
    } catch (error) {
      console.error("[SketchLab] Failed to export sketch as PNG", error);
    }
  }, [captureSketch]);

  const handleSaveToBackpack = useCallback(async () => {
    try {
      // Compact JPEG keeps the backpack within the localStorage quota; the
      // canvas already paints a solid background so transparency isn't lost.
      const result = await captureSketch({
        format: "jpeg",
        pixelRatio: 1,
        maxDimension: 1600,
        quality: 0.82,
      });
      if (!result) {
        setShowSaveErrorAlert(true);
        return;
      }
      saveFileToBackpack(
        {
          name: "sketch.jpg",
          type: "image",
          content: result.dataUrl,
        },
        { sourceLab: "sketch-lab" },
      );
    } catch (error) {
      console.error("[SketchLab] Failed to save sketch to backpack", error);
      setShowSaveErrorAlert(true);
    }
  }, [captureSketch, saveFileToBackpack, setShowSaveErrorAlert]);

  const handleStartOver = useCallback(() => {
    const confirmed =
      typeof window === "undefined" ||
      window.confirm("Start over? This clears the canvas and restores the starting sketch.");
    if (confirmed) canvas.resetCanvas();
  }, [canvas]);

  return (
    <main className={styles.root}>
      <SketchLabHeader
        onDownloadLocal={handleDownloadLocal}
        onSaveToBackpack={handleSaveToBackpack}
        onStartOver={handleStartOver}
      />
      <div className={styles.canvasWrap} ref={canvasWrapRef}>
        <SketchLabActionsProvider
          value={{
            updateNodeData: canvas.updateNodeData,
            selectNode: canvas.selectNode,
            toggleNodeSelection: canvas.toggleNodeSelection,
            resizeNode: canvas.resizeNode,
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
              selection={canvas.selectionContext}
              onUpdateNodeData={canvas.updateNodeData}
              onUpdateGroupMembers={canvas.updateGroupMembers}
              onDuplicate={canvas.duplicateNode}
              onBringForward={canvas.bringNodeForward}
              onSendToBack={canvas.sendNodeToBack}
              onDeleteNode={canvas.deleteNode}
              onGroupSelected={canvas.groupSelectedNodes}
              onUngroup={canvas.ungroupNodes}
              onBringSelectedForward={canvas.bringSelectedForward}
              onSendSelectedToBack={canvas.sendSelectedToBack}
              onDeleteSelected={canvas.deleteSelectedNodes}
              onClose={canvas.clearSelection}
            />
          </ReactFlowProvider>
        </SketchLabActionsProvider>
      </div>
    </main>
  );
}
