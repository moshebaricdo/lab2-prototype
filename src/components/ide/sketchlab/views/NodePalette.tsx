import { useRef } from "react";
import { AppButton } from "../../../ui/AppButton";
import { Tooltip } from "../../../ui/Tooltip";
import type { SketchCanvasTool, SketchShapeKind } from "../../../../types/sketchLab";
import { SketchIcon, type SketchIconKey } from "../sketchLabIcons";
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
  { tool: "grab", icon: "tool-grab", label: "Grab" },
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
        <Tooltip key={item.tool} content={item.label} position="right">
          <AppButton
            variant="tertiary"
            tone="black"
            size="s"
            className={canvasTool === item.tool ? styles.toolActive : undefined}
            icon={<SketchIcon icon={item.icon} size="s" />}
            aria-label={item.label}
            aria-pressed={canvasTool === item.tool}
            onClick={() => onCanvasToolChange(item.tool)}
          />
        </Tooltip>
      ))}
      <div className={styles.divider} role="separator" />
      {SHAPE_TOOLS.map((tool) => (
        <Tooltip key={tool.shape} content={tool.label} position="right">
          <AppButton
            variant="tertiary"
            tone="black"
            size="s"
            icon={<SketchIcon icon={tool.icon} size="s" />}
            aria-label={`Add ${tool.label.toLowerCase()}`}
            onClick={() => onAddShape(tool.shape)}
          />
        </Tooltip>
      ))}
      <Tooltip content="Add text" position="right">
        <AppButton
          variant="tertiary"
          tone="black"
          size="s"
          icon={<SketchIcon icon="tool-text" size="s" />}
          aria-label="Add text"
          onClick={onAddText}
        />
      </Tooltip>
      <Tooltip content="Add line" position="right">
        <AppButton
          variant="tertiary"
          tone="black"
          size="s"
          icon={<SketchIcon icon="tool-line" size="s" />}
          aria-label="Add line"
          onClick={onAddLine}
        />
      </Tooltip>
      <Tooltip content="Add image" position="right">
        <AppButton
          variant="tertiary"
          tone="black"
          size="s"
          icon={<SketchIcon icon="tool-image" size="s" />}
          aria-label="Add image"
          onClick={() => fileInputRef.current?.click()}
        />
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
