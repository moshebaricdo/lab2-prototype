import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
} from "react";
import { Button, Tooltip } from "@moshebari/cads-react";
import styles from "./PanZoom.module.scss";

/**
 * Pan / zoom on top of a stage that already fits itself (the identity view
 * is "fit"). The Testing diagram's controls — wheel zooms about the cursor,
 * drag pans, `+` / `-` / `0` and arrows on the focused frame, a floating
 * zoom card — without its node behavior: nothing inside becomes clickable.
 */
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const BUTTON_STEP = 1.5;
const WHEEL_STEP = 1.18;
const KEY_PAN = 40;
/** Pointer travel before a press becomes a drag. */
const CLICK_SLOP = 4;

interface Viewport {
  zoom: number;
  x: number;
  y: number;
  /** Buttons and keys glide; wheel and drag track the pointer. */
  smooth: boolean;
}

const FIT: Viewport = { zoom: 1, x: 0, y: 0, smooth: true };
const clampZoom = (value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
const isFit = (view: Viewport) =>
  Math.abs(view.zoom - 1) < 0.001 && Math.abs(view.x) < 0.5 && Math.abs(view.y) < 0.5;

export interface PanZoom {
  /** Spread on the element that takes the pointer (the whole canvas). */
  frameProps: {
    ref: RefObject<HTMLDivElement | null>;
    className: string;
    tabIndex?: number;
    role?: "group";
    "aria-label"?: string;
    onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
    onPointerDown?: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerMove?: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerUp?: () => void;
    onPointerCancel?: () => void;
  };
  /** Spread on the wrapper around the stage (transform origin: its top-left). */
  contentProps: {
    ref: RefObject<HTMLDivElement | null>;
    className: string;
    style: CSSProperties;
  };
  enabled: boolean;
  zoom: number;
  atFit: boolean;
  zoomIn: () => void;
  zoomOut: () => void;
  fit: () => void;
}

/** Off, the view sits at fit and the frame ignores the pointer; turning off resets. */
export function usePanZoom(enabled: boolean, label: string): PanZoom {
  const frameRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<Viewport>(FIT);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!enabled) setViewport({ ...FIT, smooth: false });
  }, [enabled]);

  /** A frame point in the content's own (untransformed) coordinates. */
  const anchor = useCallback((clientX?: number, clientY?: number) => {
    const frame = frameRef.current;
    const content = contentRef.current;
    if (!frame || !content) return { x: 0, y: 0 };
    const bounds = frame.getBoundingClientRect();
    let left = 0;
    let top = 0;
    for (
      let node: HTMLElement | null = content;
      node && node !== frame;
      node = node.offsetParent as HTMLElement | null
    ) {
      left += node.offsetLeft;
      top += node.offsetTop;
    }
    const px = clientX === undefined ? bounds.width / 2 : clientX - bounds.left;
    const py = clientY === undefined ? bounds.height / 2 : clientY - bounds.top;
    return { x: px - left, y: py - top };
  }, []);

  const zoomAt = useCallback(
    (factor: number, at?: { clientX: number; clientY: number }) => {
      const point = anchor(at?.clientX, at?.clientY);
      setViewport((current) => {
        const next = clampZoom(current.zoom * factor);
        const ratio = next / current.zoom;
        return {
          zoom: next,
          x: point.x - (point.x - current.x) * ratio,
          y: point.y - (point.y - current.y) * ratio,
          smooth: !at,
        };
      });
    },
    [anchor],
  );
  const fit = useCallback(() => setViewport(FIT), []);
  const panBy = (dx: number, dy: number) =>
    setViewport((current) => ({ ...current, x: current.x + dx, y: current.y + dy, smooth: true }));

  // React's wheel listeners are passive; keeping the page still needs a native one.
  useEffect(() => {
    const element = frameRef.current;
    if (!enabled || !element) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomAt(event.deltaY < 0 ? WHEEL_STEP : 1 / WHEEL_STEP, event);
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [enabled, zoomAt]);

  const drag = useRef<{ x: number; y: number; panX: number; panY: number; moved: boolean } | null>(
    null,
  );
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest("button")) return;
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      panX: viewport.x,
      panY: viewport.y,
      moved: false,
    };
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!start.moved && Math.hypot(dx, dy) < CLICK_SLOP) return;
    if (!start.moved) {
      start.moved = true;
      setDragging(true);
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Synthetic pointers can't be captured; the drag still works over the frame.
      }
    }
    setViewport((current) => ({ ...current, x: start.panX + dx, y: start.panY + dy, smooth: false }));
  };
  const onPointerUp = () => {
    drag.current = null;
    setDragging(false);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    const keys: Record<string, () => void> = {
      "+": () => zoomAt(BUTTON_STEP),
      "=": () => zoomAt(BUTTON_STEP),
      "-": () => zoomAt(1 / BUTTON_STEP),
      _: () => zoomAt(1 / BUTTON_STEP),
      "0": fit,
      ArrowLeft: () => panBy(KEY_PAN, 0),
      ArrowRight: () => panBy(-KEY_PAN, 0),
      ArrowUp: () => panBy(0, KEY_PAN),
      ArrowDown: () => panBy(0, -KEY_PAN),
    };
    const action = keys[event.key];
    if (!action) return;
    event.preventDefault();
    action();
  };

  return {
    frameProps: enabled
      ? {
          ref: frameRef,
          className: [styles.frame, dragging ? styles.frameDragging : ""].filter(Boolean).join(" "),
          tabIndex: 0,
          role: "group",
          "aria-label": `${label}. Plus and minus zoom, arrow keys pan, 0 fits.`,
          onKeyDown,
          onPointerDown,
          onPointerMove,
          onPointerUp,
          onPointerCancel: onPointerUp,
        }
      : { ref: frameRef, className: "" },
    contentProps: {
      ref: contentRef,
      className: [styles.content, viewport.smooth ? styles.contentSmooth : ""]
        .filter(Boolean)
        .join(" "),
      style: isFit(viewport)
        ? {}
        : { transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})` },
    },
    enabled,
    zoom: viewport.zoom,
    atFit: isFit(viewport),
    zoomIn: () => zoomAt(BUTTON_STEP),
    zoomOut: () => zoomAt(1 / BUTTON_STEP),
    fit,
  };
}

/** The Testing canvas's floating zoom card: Zoom in, Zoom out, Fit everything. */
export function PanZoomTools({ panZoom }: { panZoom: PanZoom }) {
  if (!panZoom.enabled) return null;
  return (
    <div className={styles.tools} role="group" aria-label="Zoom">
      <Tooltip title="Zoom in" placement="right">
        <Button
          size="extraSmall"
          variant="text"
          color="tertiary"
          iconOnly
          startIconName="magnifying-glass-plus"
          aria-label="Zoom in"
          disabled={panZoom.zoom >= MAX_ZOOM}
          onClick={panZoom.zoomIn}
        />
      </Tooltip>
      <Tooltip title="Zoom out" placement="right">
        <Button
          size="extraSmall"
          variant="text"
          color="tertiary"
          iconOnly
          startIconName="magnifying-glass-minus"
          aria-label="Zoom out"
          disabled={panZoom.zoom <= MIN_ZOOM}
          onClick={panZoom.zoomOut}
        />
      </Tooltip>
      <Tooltip title="Fit everything" placement="right">
        <Button
          size="extraSmall"
          variant="text"
          color="tertiary"
          iconOnly
          startIconName="expand-wide"
          aria-label="Fit everything"
          disabled={panZoom.atFit}
          onClick={panZoom.fit}
        />
      </Tooltip>
    </div>
  );
}
