import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

export type AnnotationTool =
  | "cursor"
  | "comment"
  | "eraser"
  | "rectangle"
  | "arrow"
  | "freeform";

export interface Annotation {
  id: string;
  number: number;
  x: number;
  y: number;
  note: string;
  selector: string;
  dataName?: string;
}

export interface DrawingShape {
  id: string;
  type: "rectangle" | "arrow" | "freeform";
  points: { x: number; y: number }[];
  color: string;
}

let counter = 0;
function nextId(prefix: string) {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}

type UndoAction =
  | { type: "add-pin"; pin: Annotation }
  | { type: "remove-pin"; pin: Annotation }
  | { type: "update-note"; id: string; prevNote: string }
  | { type: "add-shape"; shape: DrawingShape }
  | { type: "remove-shape"; shape: DrawingShape }
  | { type: "clear-all"; pins: Annotation[]; shapes: DrawingShape[] };

const SKIP_IDS = new Set(["root", "app", "__next"]);

/**
 * Build a human-readable selector for the clicked element.
 * Priority: data-name > meaningful id > aria-label > role+text > tag+class > textContent hint.
 */
function resolveSelector(el: Element | null): { selector: string; dataName?: string } {
  if (!el) return { selector: "unknown" };

  let current: Element | null = el;
  while (current && current !== document.body) {
    const dataName = current.getAttribute("data-name");
    if (dataName) {
      return { selector: `[data-name="${dataName}"]`, dataName };
    }
    if (current.id && !SKIP_IDS.has(current.id)) {
      return { selector: `#${current.id}` };
    }
    current = current.parentElement;
  }

  const ariaLabel = el.getAttribute("aria-label");
  if (ariaLabel) {
    return { selector: `[aria-label="${ariaLabel}"]` };
  }

  const role = el.getAttribute("role");
  if (role) {
    const text = el.textContent?.trim().slice(0, 40);
    return { selector: text ? `[role="${role}"] ("${text}")` : `[role="${role}"]` };
  }

  const tag = el.tagName.toLowerCase();
  const cls =
    el.className && typeof el.className === "string"
      ? el.className
          .split(/\s+/)
          .filter((c) => c && !c.includes("_") && c.length < 30)
          .slice(0, 2)
          .join(".")
      : "";
  const clsPart = cls ? `.${cls}` : "";

  const text = el.textContent?.trim().slice(0, 50);
  if (text && text.length > 2) {
    return { selector: `${tag}${clsPart} ("${text}")` };
  }

  if (clsPart) {
    return { selector: `${tag}${clsPart}` };
  }

  const parent = el.parentElement;
  if (parent && parent !== document.body) {
    const parentTag = parent.tagName.toLowerCase();
    const siblings = Array.from(parent.children).filter(
      (c) => c.tagName === el.tagName,
    );
    const idx = siblings.indexOf(el);
    const nthChild = siblings.length > 1 ? `:nth-child(${idx + 1})` : "";
    return { selector: `${parentTag} > ${tag}${nthChild}` };
  }

  return { selector: tag };
}

function describeRegion(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  const x1 = Math.min(pts[0].x, pts[pts.length - 1].x);
  const y1 = Math.min(pts[0].y, pts[pts.length - 1].y);
  const x2 = Math.max(pts[0].x, pts[pts.length - 1].x);
  const y2 = Math.max(pts[0].y, pts[pts.length - 1].y);
  const w = Math.round(x2 - x1);
  const h = Math.round(y2 - y1);
  return `~${w}×${h}px region at (${Math.round(x1)}, ${Math.round(y1)})`;
}

export interface UseAnnotationsResult {
  isActive: boolean;
  setIsActive: (active: boolean) => void;
  activeTool: AnnotationTool;
  setActiveTool: (tool: AnnotationTool) => void;
  annotations: Annotation[];
  shapes: DrawingShape[];
  addPin: (px: number, py: number, element: Element | null) => Annotation;
  updateNote: (id: string, note: string) => void;
  removePin: (id: string) => void;
  addShape: (shape: Omit<DrawingShape, "id">) => DrawingShape;
  removeShape: (id: string) => void;
  clearAll: () => void;
  undo: () => void;
  canUndo: boolean;
  buildPrompt: () => string;
  copyPrompt: () => void;
}

export function useAnnotations(): UseAnnotationsResult {
  const [isActive, setIsActive] = useState(false);
  const [activeTool, setActiveTool] = useState<AnnotationTool>("comment");
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [shapes, setShapes] = useState<DrawingShape[]>([]);
  const undoStack = useRef<UndoAction[]>([]);
  const [undoLen, setUndoLen] = useState(0);
  const location = useLocation();

  const pushUndo = useCallback((action: UndoAction) => {
    undoStack.current.push(action);
    setUndoLen(undoStack.current.length);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement)?.isContentEditable) return;

      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        performUndo();
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "a") {
        e.preventDefault();
        setIsActive((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renumber = (pins: Annotation[]) =>
    pins.map((a, i) => ({ ...a, number: i + 1 }));

  const addPin = useCallback(
    (px: number, py: number, element: Element | null) => {
      const { selector, dataName } = resolveSelector(element);
      const pin: Annotation = {
        id: nextId("pin"),
        number: 0,
        x: px,
        y: py,
        note: "",
        selector,
        dataName,
      };
      setAnnotations((prev) => renumber([...prev, pin]));
      pushUndo({ type: "add-pin", pin });
      return pin;
    },
    [pushUndo],
  );

  const updateNote = useCallback(
    (id: string, note: string) => {
      setAnnotations((prev) => {
        const existing = prev.find((a) => a.id === id);
        if (existing) pushUndo({ type: "update-note", id, prevNote: existing.note });
        return prev.map((a) => (a.id === id ? { ...a, note } : a));
      });
    },
    [pushUndo],
  );

  const removePin = useCallback(
    (id: string) => {
      setAnnotations((prev) => {
        const removed = prev.find((a) => a.id === id);
        if (removed) pushUndo({ type: "remove-pin", pin: removed });
        return renumber(prev.filter((a) => a.id !== id));
      });
    },
    [pushUndo],
  );

  const addShape = useCallback(
    (shape: Omit<DrawingShape, "id">) => {
      const s: DrawingShape = { ...shape, id: nextId("shape") };
      setShapes((prev) => [...prev, s]);
      pushUndo({ type: "add-shape", shape: s });
      return s;
    },
    [pushUndo],
  );

  const removeShape = useCallback(
    (id: string) => {
      setShapes((prev) => {
        const removed = prev.find((s) => s.id === id);
        if (removed) pushUndo({ type: "remove-shape", shape: removed });
        return prev.filter((s) => s.id !== id);
      });
    },
    [pushUndo],
  );

  const clearAll = useCallback(() => {
    setAnnotations((prevPins) => {
      setShapes((prevShapes) => {
        if (prevPins.length > 0 || prevShapes.length > 0) {
          pushUndo({ type: "clear-all", pins: prevPins, shapes: prevShapes });
        }
        return [];
      });
      return [];
    });
  }, [pushUndo]);

  const performUndo = useCallback(() => {
    const action = undoStack.current.pop();
    setUndoLen(undoStack.current.length);
    if (!action) return;

    switch (action.type) {
      case "add-pin":
        setAnnotations((prev) => renumber(prev.filter((a) => a.id !== action.pin.id)));
        break;
      case "remove-pin":
        setAnnotations((prev) => renumber([...prev, action.pin]));
        break;
      case "update-note":
        setAnnotations((prev) =>
          prev.map((a) => (a.id === action.id ? { ...a, note: action.prevNote } : a)),
        );
        break;
      case "add-shape":
        setShapes((prev) => prev.filter((s) => s.id !== action.shape.id));
        break;
      case "remove-shape":
        setShapes((prev) => [...prev, action.shape]);
        break;
      case "clear-all":
        setAnnotations(renumber(action.pins));
        setShapes(action.shapes);
        break;
    }
  }, []);

  const buildPrompt = useCallback(() => {
    const lines: string[] = [];

    lines.push("I have UI feedback for this page. Here is a structured summary of the annotations I've placed on the live prototype. Please make the following changes:\n");

    lines.push(`**Page:** \`${location.pathname}\``);
    lines.push(`**Viewport:** ${window.innerWidth}×${window.innerHeight}`);
    lines.push("");

    if (annotations.length > 0) {
      lines.push("---");
      lines.push("");
      for (const a of annotations) {
        lines.push(`### ${a.number}. Comment on \`${a.selector}\``);
        if (a.note) {
          lines.push(a.note);
        } else {
          lines.push("_(no note — review this element)_");
        }
        lines.push("");
      }
    }

    if (shapes.length > 0) {
      lines.push("---");
      lines.push("");
      lines.push("### Highlighted regions");
      lines.push("");
      for (const s of shapes) {
        const desc = s.type === "freeform"
          ? `Freeform highlight around ${describeRegion([s.points[0], s.points[s.points.length - 1]])}`
          : s.type === "arrow"
            ? `Arrow from (${Math.round(s.points[0].x)}, ${Math.round(s.points[0].y)}) → (${Math.round(s.points[1].x)}, ${Math.round(s.points[1].y)})`
            : `Rectangle: ${describeRegion(s.points)}`;
        lines.push(`- **${s.type}**: ${desc}`);
      }
      lines.push("");
    }

    lines.push("---");
    lines.push("");
    lines.push("Please address each item above. For each change, explain what you're modifying and why.");

    return lines.join("\n");
  }, [annotations, shapes, location.pathname]);

  const copyPrompt = useCallback(() => {
    navigator.clipboard.writeText(buildPrompt());
  }, [buildPrompt]);

  return {
    isActive,
    setIsActive,
    activeTool,
    setActiveTool,
    annotations,
    shapes,
    addPin,
    updateNote,
    removePin,
    addShape,
    removeShape,
    clearAll,
    undo: performUndo,
    canUndo: undoLen > 0,
    buildPrompt,
    copyPrompt,
  };
}
