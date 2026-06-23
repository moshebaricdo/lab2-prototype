import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import type {
  SketchImageNodeData,
  SketchLineNodeData,
  SketchNode,
  SketchShapeKind,
  SketchShapeNodeData,
  SketchTextNodeData,
} from "../../../../../types/sketchLab";
import { buildLinePath, findEndpointSnap } from "../../sketchLabLineGeometry";
import {
  resolveColor,
  resolveDashArray,
  resolveFontSize,
  resolveStrokeWidth,
} from "../../sketchLabOptions";
import { useSketchLabActions } from "../SketchLabActionsContext";
import styles from "./SketchNodes.module.scss";

const HANDLE_SIDES = [
  { id: "top", position: Position.Top },
  { id: "right", position: Position.Right },
  { id: "bottom", position: Position.Bottom },
  { id: "left", position: Position.Left },
] as const;

const VECTOR_SHAPE_VIEWBOX = { width: 120, height: 96 } as const;

const VECTOR_POLYGON: Record<"triangle" | "diamond", string> = {
  triangle: "60,2 118,94 2,94",
  diamond: "60,2 118,48 60,94 2,48",
};

/** Four source handles (Loose connection mode lets them receive edges too). */
function NodeHandles() {
  return (
    <>
      {HANDLE_SIDES.map((side) => (
        <Handle
          key={side.id}
          id={side.id}
          type="source"
          position={side.position}
          className={styles.handle}
        />
      ))}
    </>
  );
}

/**
 * Realtime drag of a line's start/end knob. The endpoint follows the pointer
 * frame-by-frame and live-snaps to the nearest shape handle it passes over;
 * dropping on empty canvas leaves the end floating (detached).
 */
interface EndpointDrag {
  onPointerDown: (endpoint: "start" | "end") => (event: ReactPointerEvent) => void;
  onPointerMove: (event: ReactPointerEvent) => void;
  endDrag: (event: ReactPointerEvent) => void;
  draggingEndpoint: "start" | "end" | null;
  snapped: boolean;
}

function useEndpointDrag(lineId: string): EndpointDrag {
  const { screenToFlowPosition, getNodes } = useReactFlow<SketchNode>();
  const { dragLineEndpoint, selectNode, setConnectHintId, beginHistoryStep } =
    useSketchLabActions();
  const active = useRef<{ endpoint: "start" | "end"; pointerId: number } | null>(null);
  const [draggingEndpoint, setDraggingEndpoint] = useState<"start" | "end" | null>(null);
  const [snapped, setSnapped] = useState(false);

  const onPointerMove = useCallback(
    (event: ReactPointerEvent) => {
      if (!active.current || event.pointerId !== active.current.pointerId) return;
      const abs = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const snap = findEndpointSnap(getNodes(), abs, lineId);
      setSnapped(Boolean(snap));
      // Reveal the candidate shape's handles so the connection target is clear.
      setConnectHintId(snap ? snap.attachment.nodeId : null);
      dragLineEndpoint(
        lineId,
        active.current.endpoint,
        snap ? snap.position : abs,
        snap?.attachment ?? null,
      );
    },
    [dragLineEndpoint, getNodes, lineId, screenToFlowPosition, setConnectHintId],
  );

  const endDrag = useCallback(
    (event: ReactPointerEvent) => {
      if (!active.current || event.pointerId !== active.current.pointerId) return;
      event.currentTarget.releasePointerCapture?.(active.current.pointerId);
      active.current = null;
      setDraggingEndpoint(null);
      setSnapped(false);
      setConnectHintId(null);
    },
    [setConnectHintId],
  );

  const onPointerDown = useCallback(
    (endpoint: "start" | "end") => (event: ReactPointerEvent) => {
      // Claim the gesture so ReactFlow neither drags the whole node nor starts
      // one of its own handle connections.
      event.stopPropagation();
      event.preventDefault();
      beginHistoryStep();
      selectNode(lineId);
      active.current = { endpoint, pointerId: event.pointerId };
      setDraggingEndpoint(endpoint);
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    [beginHistoryStep, lineId, selectNode],
  );

  return { onPointerDown, onPointerMove, endDrag, draggingEndpoint, snapped };
}

function LineEndpointKnobs({
  drag,
  start,
  end,
}: {
  drag: EndpointDrag;
  start: SketchLineNodeData["start"];
  end: SketchLineNodeData["end"];
}) {
  const { onPointerDown, onPointerMove, endDrag, draggingEndpoint, snapped } = drag;

  const knob = (endpoint: "start" | "end", point: SketchLineNodeData["start"]) => {
    const isActive = draggingEndpoint === endpoint;
    return (
      <div
        className={`${styles.endpointKnob} nodrag ${isActive ? styles.endpointKnobActive : ""} ${
          isActive && snapped ? styles.endpointKnobSnapped : ""
        }`}
        style={{ left: point.x, top: point.y }}
        onPointerDown={onPointerDown(endpoint)}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />
    );
  };

  return (
    <>
      {knob("start", start)}
      {knob("end", end)}
    </>
  );
}

function ShapeSurface({
  shape,
  background,
  border,
  children,
}: {
  shape: SketchShapeKind;
  background: string;
  border: string;
  children: ReactNode;
}) {
  if (shape === "triangle" || shape === "diamond") {
    return (
      <div className={styles.vectorShapeWrap}>
        <svg
          className={styles.vectorShape}
          viewBox={`0 0 ${VECTOR_SHAPE_VIEWBOX.width} ${VECTOR_SHAPE_VIEWBOX.height}`}
          aria-hidden
        >
          <polygon
            points={VECTOR_POLYGON[shape]}
            fill={background}
            stroke={border}
            strokeWidth="2"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className={styles.vectorShapeContent}>{children}</div>
      </div>
    );
  }

  const shapeClass = {
    rectangle: "",
    circle: styles.shapeCircle,
    triangle: "",
    diamond: "",
  }[shape];

  return (
    <div
      className={`${styles.shapeSurface} ${shapeClass}`}
      style={{ background, borderColor: border }}
    >
      {children}
    </div>
  );
}

/** Inline text editor shared by shape and text nodes (double-click to edit). */
function useInlineEditor(id: string, value: string, editing: boolean) {
  const { updateNodeData } = useSketchLabActions();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (editing) {
      setDraft(value);
      requestAnimationFrame(() => {
        ref.current?.focus();
        ref.current?.select();
      });
    }
  }, [editing, value]);

  const commit = () => updateNodeData(id, { text: draft });
  return { ref, draft, setDraft, commit };
}

export function ShapeNode({ id, data, selected }: NodeProps<SketchNode>) {
  const shape = data as SketchShapeNodeData;
  const [editing, setEditing] = useState(false);
  const { ref, draft, setDraft, commit } = useInlineEditor(id, shape.text, editing);
  const { connectHintId } = useSketchLabActions();

  const fontSize = resolveFontSize(shape.fontSizeKey, shape.customFontSize);
  const background = resolveColor(shape.background, "background");
  const border = resolveColor(shape.border, "border");

  return (
    <div
      className={`${styles.node} ${selected ? styles.selected : ""} ${
        connectHintId === id ? styles.connectHint : ""
      } ${shape.handlesHidden ? styles.handlesHidden : ""}`}
      style={{ transform: `rotate(${shape.rotation}deg)` }}
      onDoubleClick={() => setEditing(true)}
    >
      {selected ? (
        <div
          className={`${styles.selectionRing} ${
            shape.shape === "circle" ? styles.selectionRingCircle : ""
          } ${shape.shape === "triangle" || shape.shape === "diamond" ? styles.selectionRingVector : ""}`}
        />
      ) : null}
      <ShapeSurface shape={shape.shape} background={background} border={border}>
        {editing ? (
          <textarea
            ref={ref}
            className={styles.editor}
            value={draft}
            rows={1}
            style={{
              fontSize,
              color: resolveColor(shape.textColor, "text"),
              textAlign: shape.align,
            }}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => {
              commit();
              setEditing(false);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                commit();
                setEditing(false);
              }
              if (event.key === "Escape") setEditing(false);
            }}
          />
        ) : (
          <span
            className={styles.label}
            style={{
              fontSize,
              color: resolveColor(shape.textColor, "text"),
              textAlign: shape.align,
            }}
          >
            {shape.text}
          </span>
        )}
      </ShapeSurface>
      <NodeHandles />
    </div>
  );
}

export function TextNode({ id, data, selected }: NodeProps<SketchNode>) {
  const text = data as SketchTextNodeData;
  const [editing, setEditing] = useState(false);
  const { ref, draft, setDraft, commit } = useInlineEditor(id, text.text, editing);
  const { connectHintId } = useSketchLabActions();
  const fontSize = resolveFontSize(text.fontSizeKey, text.customFontSize);

  return (
    <div
      className={`${styles.node} ${styles.textNode} ${selected ? styles.selected : ""} ${
        connectHintId === id ? styles.connectHint : ""
      } ${text.handlesHidden ? styles.handlesHidden : ""}`}
      style={{ transform: `rotate(${text.rotation}deg)` }}
      onDoubleClick={() => setEditing(true)}
    >
      {selected ? <div className={styles.selectionRing} /> : null}
      {editing ? (
        <textarea
          ref={ref}
          className={styles.editor}
          value={draft}
          rows={1}
          style={{
            fontSize,
            color: resolveColor(text.color, "text"),
            textAlign: text.align,
          }}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => {
            commit();
            setEditing(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              commit();
              setEditing(false);
            }
            if (event.key === "Escape") setEditing(false);
          }}
        />
      ) : (
        <span
          className={styles.textLabel}
          style={{
            fontSize,
            color: resolveColor(text.color, "text"),
            textAlign: text.align,
          }}
        >
          {text.text}
        </span>
      )}
      <NodeHandles />
    </div>
  );
}

export function ImageNode({ id, data, selected }: NodeProps<SketchNode>) {
  const image = data as SketchImageNodeData;
  const { connectHintId } = useSketchLabActions();
  return (
    <div
      className={`${styles.node} ${styles.imageNode} ${selected ? styles.selected : ""} ${
        connectHintId === id ? styles.connectHint : ""
      } ${image.handlesHidden ? styles.handlesHidden : ""}`}
      style={{ transform: `rotate(${image.rotation}deg)` }}
    >
      {selected ? <div className={styles.selectionRing} /> : null}
      <img className={styles.image} src={image.src} alt={image.alt} draggable={false} />
      <NodeHandles />
    </div>
  );
}

export function LineNode({ id, data, selected }: NodeProps<SketchNode>) {
  const line = data as SketchLineNodeData;
  const stroke = resolveColor(line.color, "text");
  const strokeWidth = resolveStrokeWidth(line.thickness);
  const dashArray = resolveDashArray(line.style, strokeWidth);
  const showStart = line.arrowheads === "start" || line.arrowheads === "both";
  const showEnd = line.arrowheads === "end" || line.arrowheads === "both";
  // Visible stroke stops at the arrowhead base; hit area spans the full segment.
  const path = buildLinePath(line.start, line.end, line.shape, {
    strokeWidth,
    trimStart: showStart,
    trimEnd: showEnd,
  });
  const hitPath = buildLinePath(line.start, line.end, line.shape);
  const hitWidth = Math.max(strokeWidth + 14, 20);
  const startMarkerId = `sketch-line-start-${id}`;
  const endMarkerId = `sketch-line-end-${id}`;
  const drag = useEndpointDrag(id);

  return (
    <div
      className={`${styles.lineNode} ${selected ? styles.selected : ""} ${
        line.handlesHidden ? styles.handlesHidden : ""
      }`}
    >
      {/* Hide the bounding-box focus ring while dragging an endpoint — it
          balloons across the canvas and distracts from the line itself. */}
      {selected && !drag.draggingEndpoint ? (
        <div className={`${styles.selectionRing} ${styles.selectionRingLine}`} />
      ) : null}
      <svg className={styles.lineSvg} width="100%" height="100%" aria-hidden>
        <defs>
          {/* Both arrowheads share a right-pointing spear (tip at x=4, slightly
              longer than wide). `markerUnits="strokeWidth"` scales them with the
              line so they never look stubby or oversized; `refX` pins the TIP to
              the endpoint (on the shape edge); `auto-start-reverse` flips the
              start arrow so the pair point in opposing directions. */}
          {showStart ? (
            <marker
              id={startMarkerId}
              markerWidth="5"
              markerHeight="4"
              refX="0"
              refY="2"
              orient="auto-start-reverse"
              markerUnits="strokeWidth"
            >
              <path d="M0,0.5 L4,2 L0,3.5 z" fill={stroke} />
            </marker>
          ) : null}
          {showEnd ? (
            <marker
              id={endMarkerId}
              markerWidth="5"
              markerHeight="4"
              refX="0"
              refY="2"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0.5 L4,2 L0,3.5 z" fill={stroke} />
            </marker>
          ) : null}
        </defs>
        {/* Wide transparent stroke: the only grab target for moving the line,
            so transparent areas of the bounding box click through to shapes. */}
        <path
          className={styles.lineHitPath}
          d={hitPath}
          fill="none"
          stroke="transparent"
          strokeWidth={hitWidth}
          strokeLinecap="round"
        />
        <path
          className={styles.linePath}
          d={path}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dashArray}
          markerStart={showStart ? `url(#${startMarkerId})` : undefined}
          markerEnd={showEnd ? `url(#${endMarkerId})` : undefined}
        />
      </svg>
      <LineEndpointKnobs drag={drag} start={line.start} end={line.end} />
    </div>
  );
}

export function GroupNode({ selected }: NodeProps<SketchNode>) {
  return (
    <div className={`${styles.groupNode} ${selected ? styles.selected : ""}`}>
      <svg className={styles.groupOutline} aria-hidden="true">
        <rect className={styles.groupOutlineHover} />
        <rect className={styles.groupOutlineSelected} />
      </svg>
    </div>
  );
}

export const sketchNodeTypes = {
  shape: ShapeNode,
  text: TextNode,
  image: ImageNode,
  line: LineNode,
  group: GroupNode,
};
