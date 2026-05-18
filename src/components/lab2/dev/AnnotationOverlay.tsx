import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AppButton, type FaIconName } from "../../ui/AppButton";
import { AppTextArea } from "../../ui/AppTextField";
import type {
  Annotation,
  AnnotationTool,
  DrawingShape,
  UseAnnotationsResult,
} from "../../../hooks/useAnnotations";
import { useTheme } from "../../../hooks/useTheme";
import { downloadAnnotatedScreenshot } from "../../../utils/captureAnnotatedScreenshot";
import styles from "./AnnotationOverlay.module.scss";

/* ─── Popover for comment pins ─── */

function PinPopover({
  annotation,
  onUpdate,
  onDelete,
  onClose,
}: {
  annotation: Annotation;
  onUpdate: (id: string, note: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [note, setNote] = useState(annotation.note);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, []);

  const handleSave = () => {
    onUpdate(annotation.id, note);
    onClose();
  };

  const popoverWidth = 280;
  const popoverHeight = 220;
  const gap = 20;

  let left = annotation.x + gap;
  let top = annotation.y - popoverHeight / 2;

  if (left + popoverWidth > window.innerWidth - 12) {
    left = annotation.x - popoverWidth - gap;
  }
  top = Math.max(12, Math.min(top, window.innerHeight - popoverHeight - 12));

  return (
    <div
      data-annotation-popover="true"
      className={styles.popover}
      style={{ left, top }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={styles.popoverHeader}>
        <p className={styles.popoverTitle}>Pin {annotation.number}</p>
        <AppButton
          variant="tertiary"
          tone="gray"
          size="xs"
          iconName="trash"
          onClick={() => {
            onDelete(annotation.id);
            onClose();
          }}
          aria-label="Delete pin"
        />
      </div>
      <p className={styles.popoverSelector}>{annotation.selector}</p>
      <AppTextArea
        ref={textareaRef}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSave();
          }
          if (e.key === "Escape") {
            if (!annotation.note && !note.trim()) onDelete(annotation.id);
            onClose();
          }
        }}
        placeholder="Add a note... (Enter to save, Shift+Enter for newline)"
        rows={3}
        size="s"
        tone="gray"
      />
      <div className={styles.popoverActions}>
        <AppButton
          variant="secondary"
          tone="gray"
          size="xs"
          onClick={() => {
            if (!annotation.note && !note.trim()) onDelete(annotation.id);
            onClose();
          }}
        >
          Cancel
        </AppButton>
        <AppButton variant="primary" tone="purple" size="xs" onClick={handleSave}>
          Save
        </AppButton>
      </div>
    </div>
  );
}

/* ─── Floating toolbar ─── */

const TOOL_GROUPS: { tool: AnnotationTool; icon: FaIconName; label: string }[][] = [
  [
    { tool: "cursor", icon: "arrow-pointer", label: "Cursor" },
    { tool: "comment", icon: "comment-dots", label: "Comment" },
    { tool: "eraser", icon: "eraser", label: "Eraser" },
  ],
  [
    { tool: "rectangle", icon: "square", label: "Rectangle" },
    { tool: "arrow", icon: "arrow-up-from-arc", label: "Arrow" },
    { tool: "freeform", icon: "scribble", label: "Freeform" },
  ],
];

function AnnotationToolbar({ state }: { state: UseAnnotationsResult }) {
  const { activeTool, setActiveTool, annotations, shapes, clearAll, copyPrompt } = state;
  const totalItems = annotations.length + shapes.length;
  const [copied, setCopied] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const handleCopy = () => {
    copyPrompt();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleScreenshot = async () => {
    setCapturing(true);
    try {
      await downloadAnnotatedScreenshot(shapes);
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div className={styles.toolbar} data-annotation-toolbar="true">
      {TOOL_GROUPS.map((group, gi) => (
        <div key={gi} className={styles.toolbarGroup}>
          {gi > 0 && <div className={styles.toolbarDivider} />}
          {group.map(({ tool, icon, label }) => (
            <AppButton
              key={tool}
              variant={activeTool === tool ? "primary" : "tertiary"}
              tone={activeTool === tool ? "teal" : "gray"}
              size="xs"
              iconName={icon}
              onClick={() => setActiveTool(tool)}
              aria-label={label}
            />
          ))}
        </div>
      ))}

      <div className={styles.toolbarDivider} />

      <AppButton
        variant={copied ? "primary" : "tertiary"}
        tone={copied ? "teal" : "gray"}
        size="xs"
        iconName={copied ? "check" : "clipboard"}
        onClick={handleCopy}
        disabled={totalItems === 0}
        aria-label="Copy as AI prompt"
      />
      <AppButton
        variant="tertiary"
        tone="gray"
        size="xs"
        iconName="camera"
        onClick={handleScreenshot}
        disabled={capturing}
        aria-label="Screenshot with drawings"
      />
      <AppButton
        variant="tertiary"
        tone="gray"
        size="xs"
        iconName="trash"
        onClick={clearAll}
        disabled={totalItems === 0}
        aria-label="Clear all annotations"
      />

      <div className={styles.toolbarDivider} />

      <AppButton
        variant="tertiary"
        tone="gray"
        size="xs"
        iconName="xmark"
        onClick={() => state.setIsActive(false)}
        aria-label="Exit annotation mode"
      />
    </div>
  );
}

/* ─── SVG drawing layer ─── */

function DrawingLayer({ state }: { state: UseAnnotationsResult }) {
  const { activeTool, shapes, addShape, removeShape } = state;
  const isDrawTool =
    activeTool === "rectangle" || activeTool === "arrow" || activeTool === "freeform";
  const isEraser = activeTool === "eraser";
  const [drawing, setDrawing] = useState(false);
  const pointsRef = useRef<{ x: number; y: number }[]>([]);
  const [livePoints, setLivePoints] = useState<{ x: number; y: number }[]>([]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!isDrawTool) return;
      e.preventDefault();
      e.stopPropagation();
      const svg = e.currentTarget;
      svg.setPointerCapture(e.pointerId);
      const pt = { x: e.clientX, y: e.clientY };
      pointsRef.current = [pt];
      setLivePoints([pt]);
      setDrawing(true);
    },
    [isDrawTool],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!drawing) return;
      const pt = { x: e.clientX, y: e.clientY };
      pointsRef.current.push(pt);
      setLivePoints([...pointsRef.current]);
    },
    [drawing],
  );

  const handlePointerUp = useCallback(() => {
    if (!drawing) return;
    setDrawing(false);
    const pts = pointsRef.current;
    if (pts.length < 2) return;

    addShape({
      type: activeTool as "rectangle" | "arrow" | "freeform",
      points: activeTool === "freeform" ? [...pts] : [pts[0], pts[pts.length - 1]],
      color: "var(--accent)",
    });
    pointsRef.current = [];
    setLivePoints([]);
  }, [drawing, activeTool, addShape]);

  const renderShape = (shape: DrawingShape, isLive = false) => {
    const key = isLive ? "live" : shape.id;
    const pts = shape.points;
    if (pts.length < 2) return null;

    const canDelete = !isLive && isEraser;
    const hoverClass = canDelete ? styles.drawingShapeEraser : (!isLive ? styles.drawingShapeHover : "");

    if (shape.type === "rectangle") {
      const x = Math.min(pts[0].x, pts[pts.length - 1].x);
      const y = Math.min(pts[0].y, pts[pts.length - 1].y);
      const w = Math.abs(pts[pts.length - 1].x - pts[0].x);
      const h = Math.abs(pts[pts.length - 1].y - pts[0].y);
      return (
        <rect
          key={key}
          x={x}
          y={y}
          width={w}
          height={h}
          className={`${styles.drawingShapeRect} ${hoverClass}`}
          onClick={canDelete ? () => removeShape(shape.id) : undefined}
        />
      );
    }

    if (shape.type === "arrow") {
      const start = pts[0];
      const end = pts[pts.length - 1];
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const headLen = 14;
      const p1x = end.x - headLen * Math.cos(angle - Math.PI / 6);
      const p1y = end.y - headLen * Math.sin(angle - Math.PI / 6);
      const p2x = end.x - headLen * Math.cos(angle + Math.PI / 6);
      const p2y = end.y - headLen * Math.sin(angle + Math.PI / 6);
      return (
        <g
          key={key}
          className={hoverClass || undefined}
          onClick={canDelete ? () => removeShape(shape.id) : undefined}
        >
          <line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            className={styles.drawingShape}
          />
          <polygon
            points={`${end.x},${end.y} ${p1x},${p1y} ${p2x},${p2y}`}
            className={styles.drawingArrowHead}
          />
        </g>
      );
    }

    if (shape.type === "freeform") {
      const d = pts.reduce(
        (acc, p, i) => acc + (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`),
        "",
      );
      return (
        <path
          key={key}
          d={d}
          className={`${styles.drawingFreeform} ${hoverClass}`}
          onClick={canDelete ? () => removeShape(shape.id) : undefined}
        />
      );
    }
    return null;
  };

  const liveShape: DrawingShape | null =
    drawing && livePoints.length >= 2
      ? { id: "live", type: activeTool as DrawingShape["type"], points: livePoints, color: "" }
      : null;

  const canvasActive = isDrawTool || (isEraser && shapes.length > 0);

  return (
    <svg
      data-annotation-drawing="true"
      className={`${styles.drawingCanvas} ${canvasActive ? styles.drawingCanvasActive : ""} ${isEraser ? styles.cursorEraser : ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {shapes.map((s) => renderShape(s))}
      {liveShape && renderShape(liveShape, true)}
    </svg>
  );
}

/* ─── Main overlay ─── */

interface AnnotationOverlayProps {
  annotations: UseAnnotationsResult;
}

export function AnnotationOverlay({ annotations: state }: AnnotationOverlayProps) {
  const { theme } = useTheme();
  const { isActive, activeTool, addPin, updateNote, removePin } = state;
  const pins = state.annotations;
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleCommentClick = useCallback(
    (e: React.MouseEvent) => {
      if (activeTool !== "comment") return;

      const appRoot = document.getElementById("root");
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      const element = elements.find(
        (el) => appRoot?.contains(el) && el !== appRoot,
      ) ?? null;

      const pin = addPin(e.clientX, e.clientY, element);
      requestAnimationFrame(() => setEditingId(pin.id));
    },
    [addPin, activeTool],
  );

  useEffect(() => {
    if (!isActive) setEditingId(null);
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editingId) {
          setEditingId(null);
        } else {
          state.setIsActive(false);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isActive, editingId, state]);

  if (!isActive) return null;

  const isCommentMode = activeTool === "comment";
  const isEraserMode = activeTool === "eraser";
  const editingPin = editingId ? pins.find((p) => p.id === editingId) : null;

  return createPortal(
    <div className={theme === "dark" ? "dark" : ""} data-theme={theme}>
      {/* Click-to-comment layer */}
      {isCommentMode && (
        <div
          data-annotation-overlay="true"
          className={`${styles.interactionLayer} ${styles.interactionLayerActive} ${styles.cursorCrosshair}`}
          onMouseDown={handleCommentClick}
        />
      )}

      {/* SVG drawing layer (also active in eraser mode for shape deletion) */}
      <DrawingLayer state={state} />

      {/* Comment pins */}
      {pins.map((pin) => (
        <div
          key={pin.id}
          data-annotation-pin="true"
          className={`${styles.pin} ${isEraserMode ? styles.pinEraser : ""}`}
          style={{ left: pin.x, top: pin.y }}
        >
          <button
            type="button"
            className={`${styles.pinMarker} ${editingId === pin.id ? styles.pinMarkerActive : ""} ${isEraserMode ? styles.pinMarkerEraser : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              if (isEraserMode) {
                removePin(pin.id);
              } else {
                setEditingId(editingId === pin.id ? null : pin.id);
              }
            }}
          >
            {pin.number}
          </button>
        </div>
      ))}

      {/* Popover — top-level sibling */}
      {editingPin && !isEraserMode && (
        <PinPopover
          key={editingPin.id}
          annotation={editingPin}
          onUpdate={updateNote}
          onDelete={removePin}
          onClose={() => setEditingId(null)}
        />
      )}

      {/* Floating toolbar */}
      <AnnotationToolbar state={state} />
    </div>,
    document.body,
  );
}
