import { Panel, useReactFlow } from "@xyflow/react";
import { Button } from "@moshebaricdo/cads-react";
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
      <Button
        variant="text"
        color="tertiary"
        size="extraSmall"
        iconOnly
        startIconName="arrow-rotate-left"
        aria-label="Undo"
        disabled={!canUndo}
        onClick={onUndo}
      />
      <Button
        variant="text"
        color="tertiary"
        size="extraSmall"
        iconOnly
        startIconName="arrow-rotate-right"
        aria-label="Redo"
        disabled={!canRedo}
        onClick={onRedo}
      />
      <div className={styles.divider} role="separator" />
      <Button
        variant="text"
        color="tertiary"
        size="extraSmall"
        iconOnly
        startIconName="magnifying-glass-plus"
        aria-label="Zoom in"
        onClick={() => zoomIn()}
      />
      <Button
        variant="text"
        color="tertiary"
        size="extraSmall"
        iconOnly
        startIconName="magnifying-glass-minus"
        aria-label="Zoom out"
        onClick={() => zoomOut()}
      />
      <Button
        variant="text"
        color="tertiary"
        size="extraSmall"
        iconOnly
        startIconName="up-right-and-down-left-from-center"
        aria-label="Fit view"
        onClick={() => fitView({ padding: 0.3, maxZoom: 1 })}
      />
    </Panel>
  );
}
