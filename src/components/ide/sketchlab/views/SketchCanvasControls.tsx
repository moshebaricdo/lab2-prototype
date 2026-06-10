import { Panel, useReactFlow } from "@xyflow/react";
import { AppButton } from "../../../ui/AppButton";
import styles from "./SketchCanvasControls.module.scss";

interface SketchCanvasControlsProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function SketchCanvasControls({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: SketchCanvasControlsProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <Panel position="bottom-right" className={styles.root}>
      <AppButton
        variant="tertiary"
        tone="gray"
        size="xs"
        iconName="arrow-rotate-left"
        aria-label="Undo"
        disabled={!canUndo}
        onClick={onUndo}
      />
      <AppButton
        variant="tertiary"
        tone="gray"
        size="xs"
        iconName="arrow-rotate-right"
        aria-label="Redo"
        disabled={!canRedo}
        onClick={onRedo}
      />
      <div className={styles.divider} role="separator" />
      <AppButton
        variant="tertiary"
        tone="gray"
        size="xs"
        iconName="magnifying-glass-plus"
        aria-label="Zoom in"
        onClick={() => zoomIn()}
      />
      <AppButton
        variant="tertiary"
        tone="gray"
        size="xs"
        iconName="magnifying-glass-minus"
        aria-label="Zoom out"
        onClick={() => zoomOut()}
      />
      <AppButton
        variant="tertiary"
        tone="gray"
        size="xs"
        iconName="up-right-and-down-left-from-center"
        aria-label="Fit view"
        onClick={() => fitView({ padding: 0.3, maxZoom: 1 })}
      />
    </Panel>
  );
}
