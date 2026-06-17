import { useEffect } from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  ReactFlow,
  SelectionMode,
} from "@xyflow/react";
import type { SketchLabState } from "../../../../hooks/useSketchLabState";
import type { SketchCanvasTool } from "../../../../types/sketchLab";
import { SketchCanvasControls } from "./SketchCanvasControls";
import { sketchNodeTypes } from "./nodes/SketchNodes";
import styles from "./SketchLabWorkspace.module.scss";

interface SketchFlowCanvasProps {
  canvas: SketchLabState;
  canvasTool: SketchCanvasTool;
}

function isTypingTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return (
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.isContentEditable === true
  );
}

export function SketchFlowCanvas({ canvas, canvasTool }: SketchFlowCanvasProps) {
  const { undo, redo, groupSelectedNodes } = canvas;
  const isGrabTool = canvasTool === "grab";

  // Standard undo/redo shortcuts: ⌘/Ctrl+Z, and ⌘/Ctrl+Shift+Z or Ctrl+Y.
  // ⌘/Ctrl+G groups the current multi-selection.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || isTypingTarget(event.target)) return;
      const key = event.key.toLowerCase();
      if (key === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if (key === "y") {
        event.preventDefault();
        redo();
      } else if (key === "g") {
        event.preventDefault();
        groupSelectedNodes();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo, groupSelectedNodes]);

  return (
    <ReactFlow
      className={`${styles.flow} ${isGrabTool ? styles.flowGrab : styles.flowSelect}`}
      nodes={canvas.nodes}
      nodeTypes={sketchNodeTypes}
      onNodesChange={canvas.onNodesChange}
      onConnect={canvas.onConnect}
      onPaneClick={canvas.clearSelection}
      isValidConnection={canvas.isValidConnection}
      connectionMode={ConnectionMode.Loose}
      connectionRadius={28}
      panOnDrag={isGrabTool}
      selectionOnDrag={!isGrabTool}
      selectionMode={SelectionMode.Partial}
      proOptions={{ hideAttribution: true }}
      fitView
      fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
      minZoom={0.2}
      maxZoom={2}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} />
      <SketchCanvasControls
        onUndo={canvas.undo}
        onRedo={canvas.redo}
        canUndo={canvas.canUndo}
        canRedo={canvas.canRedo}
      />
    </ReactFlow>
  );
}
