import { useRef } from "react";
import { Button, Tooltip } from "@moshebaricdo/cads-react";
import type { SketchCanvasTool, SketchShapeKind } from "../../../../types/sketchLab";
import { SKETCH_ICONS, type SketchIconKey } from "../sketchLabIcons";
import styles from "./NodePalette.module.scss";

interface NodePaletteProps {
  canvasTool: SketchCanvasTool;
  onCanvasToolChange: (tool: SketchCanvasTool) => void;
  onAddShape: (shape: SketchShapeKind) => void;
  onAddText: () => void;
  onAddImage: (src: string) => void;
  onAddLine: () => void;
}

const CANVAS_TOOLS: { tool: SketchCanvasTool; icon: SketchIconKey; label: string }[] = [
  { tool: "select", icon: "tool-select", label: "Select" },
  { tool: "grab", icon: "tool-grab", label: "Hand Tool" },
];

const SHAPE_TOOLS: { shape: SketchShapeKind; icon: SketchIconKey; label: string }[] = [
  { shape: "rectangle", icon: "tool-rectangle", label: "Rectangle" },
  { shape: "triangle", icon: "tool-triangle", label: "Triangle" },
  { shape: "circle", icon: "tool-circle", label: "Circle" },
  { shape: "diamond", icon: "tool-diamond", label: "Diamond" },
];

export function NodePalette({
  canvasTool,
  onCanvasToolChange,
  onAddShape,
  onAddText,
  onAddImage,
  onAddLine,
}: NodePaletteProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset so picking the same file again still fires a change event.
    event.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onAddImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={styles.root} role="toolbar" aria-label="Canvas tools" aria-orientation="vertical">
      {CANVAS_TOOLS.map((item) => (
        <Tooltip key={item.tool} title={item.label} placement="right">
          <span>
            <Button
              variant="text"
              color="tertiary"
              size="small"
              iconOnly
              className={canvasTool === item.tool ? styles.toolActive : undefined}
              startIconName={SKETCH_ICONS[item.icon].name}
              aria-label={item.label}
              aria-pressed={canvasTool === item.tool}
              onClick={() => onCanvasToolChange(item.tool)}
            />
          </span>
        </Tooltip>
      ))}
      <div className={styles.divider} role="separator" />
      {SHAPE_TOOLS.map((tool) => (
        <Tooltip key={tool.shape} title={tool.label} placement="right">
          <span>
            <Button
              variant="text"
              color="tertiary"
              size="small"
              iconOnly
              startIconName={SKETCH_ICONS[tool.icon].name}
              aria-label={`Add ${tool.label.toLowerCase()}`}
              onClick={() => onAddShape(tool.shape)}
            />
          </span>
        </Tooltip>
      ))}
      <Tooltip title="Add text" placement="right">
        <span>
          <Button
            variant="text"
            color="tertiary"
            size="small"
            iconOnly
            startIconName={SKETCH_ICONS["tool-text"].name}
            aria-label="Add text"
            onClick={onAddText}
          />
        </span>
      </Tooltip>
      <Tooltip title="Add line" placement="right">
        <span>
          <Button
            variant="text"
            color="tertiary"
            size="small"
            iconOnly
            startIconName={SKETCH_ICONS["tool-line"].name}
            aria-label="Add line"
            onClick={onAddLine}
          />
        </span>
      </Tooltip>
      <Tooltip title="Add image" placement="right">
        <span>
          <Button
            variant="text"
            color="tertiary"
            size="small"
            iconOnly
            startIconName={SKETCH_ICONS["tool-image"].name}
            aria-label="Add image"
            onClick={() => fileInputRef.current?.click()}
          />
        </span>
      </Tooltip>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFileChange}
      />
    </div>
  );
}
