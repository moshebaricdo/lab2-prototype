import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  applyNodeChanges,
  useNodesState,
  type Connection,
  type NodeChange,
  type NodePositionChange,
  type NodeSelectionChange,
} from "@xyflow/react";
import {
  createLineBetweenNodes,
  createLineNodeFromPoints,
  findEndpointSnap,
  lineNodeFromLegacyEdge,
  repositionLineEndpoint,
  syncLineAttachments,
  type SketchLineStyling,
  type SketchPoint,
} from "../components/ide/sketchlab/sketchLabLineGeometry";
import type {
  SketchImageNodeData,
  SketchLegacyEdge,
  SketchLineAttachment,
  SketchLineNodeData,
  SketchNode,
  SketchNodeData,
  SketchNodeKind,
  SketchShapeKind,
  SketchShapeNodeData,
  SketchTextNodeData,
} from "../types/sketchLab";

/** Inline SVG placeholder used when an image node is created with no source. */
const IMAGE_PLACEHOLDER_SRC =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120" viewBox="0 0 160 120"><rect width="160" height="120" fill="#e9eef3"/><path d="M0 96l44-40 30 26 28-34 58 48z" fill="#c7d0da"/><circle cx="116" cy="40" r="14" fill="#c7d0da"/></svg>`,
  );

const DEFAULT_LINE_STYLING: SketchLineStyling = {
  color: "black",
  thickness: "medium",
  style: "solid",
  shape: "straight",
  arrowheads: "end",
};

function makeNodeData(kind: SketchNodeKind, shape?: SketchShapeKind): SketchNodeData {
  if (kind === "shape") {
    return {
      kind: "shape",
      shape: shape ?? "rectangle",
      text: "Text",
      background: "blue",
      border: "blue",
      fontSizeKey: "medium",
      align: "center",
      textColor: "black",
      rotation: 0,
    } satisfies SketchShapeNodeData;
  }
  if (kind === "text") {
    return {
      kind: "text",
      text: "Text",
      fontSizeKey: "medium",
      align: "left",
      color: "black",
      rotation: 0,
    } satisfies SketchTextNodeData;
  }
  if (kind === "line") {
    return {
      kind: "line",
      start: { x: 0, y: 40 },
      end: { x: 180, y: 40 },
      startAttachment: null,
      endAttachment: null,
      ...DEFAULT_LINE_STYLING,
    } satisfies SketchLineNodeData;
  }
  return {
    kind: "image",
    src: IMAGE_PLACEHOLDER_SRC,
    alt: "",
    rotation: 0,
  } satisfies SketchImageNodeData;
}

interface StoredCanvas {
  nodes: SketchNode[];
  edges?: SketchLegacyEdge[];
}

function migrateStoredCanvas(stored: StoredCanvas, fallbackNodes: SketchNode[]): SketchNode[] {
  let nodes = stored.nodes ?? fallbackNodes;
  const legacyEdges = stored.edges ?? [];

  if (!legacyEdges.length) return nodes;

  const migrated = legacyEdges
    .map((edge) => lineNodeFromLegacyEdge(edge, nodes, DEFAULT_LINE_STYLING))
    .filter((node): node is SketchNode => node !== null);

  return [...nodes, ...migrated];
}

function readStored(storageKey?: string, fallbackNodes: SketchNode[] = []): SketchNode[] | null {
  if (!storageKey || typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredCanvas>;
    if (!Array.isArray(parsed.nodes)) return null;
    const nodes = migrateStoredCanvas(
      { nodes: parsed.nodes, edges: parsed.edges },
      fallbackNodes,
    );
    return nodes.map((node) => ({ ...node, selected: false, dragging: false }));
  } catch {
    return null;
  }
}

function highestNumericIdSuffix(nodes: SketchNode[]): number {
  let max = 0;
  for (const item of nodes) {
    const match = /(\d+)$/.exec(item.id);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return max;
}

interface UseSketchLabStateOptions {
  initialNodes: SketchNode[];
  /** @deprecated Legacy edges are migrated into standalone line nodes on load. */
  initialEdges?: SketchLegacyEdge[];
  storageKey?: string;
}

export function useSketchLabState({
  initialNodes,
  initialEdges = [],
  storageKey,
}: UseSketchLabStateOptions) {
  const bootNodes = useMemo(() => {
    const stored = readStored(storageKey, initialNodes);
    if (stored) return stored;
    const migrated = migrateStoredCanvas({ nodes: initialNodes, edges: initialEdges }, initialNodes);
    return migrated.map((node) => ({ ...node, selected: false, dragging: false }));
  }, [initialNodes, initialEdges, storageKey]);

  const [nodes, setNodes] = useNodesState<SketchNode>(bootNodes);

  // Id of the shape whose handles should be revealed as a connection target
  // while a line endpoint is dragged near it. Transient — kept out of `nodes`
  // so it never persists to storage.
  const [connectHintId, setConnectHintId] = useState<string | null>(null);

  // Undo/redo history. `past`/`future` hold full node snapshots; `nodesRef`
  // tracks the live nodes so we can snapshot the pre-change state from event
  // handlers without nesting setState calls.
  const [past, setPast] = useState<SketchNode[][]>([]);
  const [future, setFuture] = useState<SketchNode[][]>([]);
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  // History lives in refs (authoritative, updated synchronously) mirrored into
  // state (for the toolbar's enabled/disabled UI). Refs mean undo/redo are
  // stable callbacks that never read a stale or not-yet-committed stack.
  const pastRef = useRef<SketchNode[][]>([]);
  const futureRef = useRef<SketchNode[][]>([]);
  const draggingRef = useRef(false);

  const HISTORY_LIMIT = 100;
  const recordSnapshot = useCallback((snapshot: SketchNode[]) => {
    pastRef.current = [...pastRef.current, snapshot].slice(-HISTORY_LIMIT);
    futureRef.current = [];
    setPast(pastRef.current);
    setFuture(futureRef.current);
  }, []);

  /** Snapshot the current canvas before a multi-step gesture (e.g. a drag). */
  const beginHistoryStep = useCallback(() => {
    recordSnapshot(nodesRef.current);
  }, [recordSnapshot]);

  const idCounter = useRef(highestNumericIdSuffix(bootNodes));
  const nextId = useCallback((prefix: string) => {
    idCounter.current += 1;
    return `${prefix}-${idCounter.current}`;
  }, []);

  const commitNodes = useCallback(
    (updater: (current: SketchNode[]) => SketchNode[]) => {
      setNodes((current) => syncLineAttachments(updater(current)));
    },
    [setNodes],
  );

  // Discrete edits (add, delete, style changes, …) snapshot first so a single
  // undo reverts the whole action.
  const commitNodesWithHistory = useCallback(
    (updater: (current: SketchNode[]) => SketchNode[]) => {
      recordSnapshot(nodesRef.current);
      commitNodes(updater);
    },
    [commitNodes, recordSnapshot],
  );

  const undo = useCallback(() => {
    const prevStack = pastRef.current;
    if (!prevStack.length) return;
    const previous = prevStack[prevStack.length - 1];
    pastRef.current = prevStack.slice(0, -1);
    futureRef.current = [nodesRef.current, ...futureRef.current].slice(0, HISTORY_LIMIT);
    setPast(pastRef.current);
    setFuture(futureRef.current);
    setNodes(previous);
  }, [setNodes]);

  const redo = useCallback(() => {
    const nextStack = futureRef.current;
    if (!nextStack.length) return;
    const upcoming = nextStack[0];
    futureRef.current = nextStack.slice(1);
    pastRef.current = [...pastRef.current, nodesRef.current].slice(-HISTORY_LIMIT);
    setPast(pastRef.current);
    setFuture(futureRef.current);
    setNodes(upcoming);
  }, [setNodes]);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify({ nodes }));
    } catch (error) {
      console.warn("[useSketchLabState] Unable to persist canvas", error);
    }
  }, [nodes, storageKey]);

  const onNodesChange = useCallback(
    (changes: NodeChange<SketchNode>[]) => {
      // Snapshot once at the start of a drag gesture (not on every tick) so a
      // single undo reverts the whole move.
      const positionChanges = changes.filter(
        (change): change is NodePositionChange => change.type === "position",
      );
      if (positionChanges.some((change) => change.dragging === true) && !draggingRef.current) {
        draggingRef.current = true;
        recordSnapshot(nodesRef.current);
      }
      if (positionChanges.some((change) => change.dragging === false)) {
        draggingRef.current = false;
      }

      // While dragging a whole line, highlight the shape an endpoint is hovering
      // so the user can see they're about to connect (cleared on drag end).
      const draggingPositions = positionChanges.filter((change) => change.dragging === true);
      if (draggingPositions.length) {
        let hintId: string | null = null;
        for (const change of draggingPositions) {
          const node = nodesRef.current.find((item) => item.id === change.id);
          if (!node || node.data.kind !== "line" || !change.position) continue;
          const data = node.data as SketchLineNodeData;
          const startAbs = { x: change.position.x + data.start.x, y: change.position.y + data.start.y };
          const endAbs = { x: change.position.x + data.end.x, y: change.position.y + data.end.y };
          const snap =
            findEndpointSnap(nodesRef.current, startAbs, node.id) ??
            findEndpointSnap(nodesRef.current, endAbs, node.id);
          if (snap) {
            hintId = snap.attachment.nodeId;
            break;
          }
        }
        setConnectHintId(hintId);
      } else if (positionChanges.some((change) => change.dragging === false)) {
        setConnectHintId(null);
      }

      // On release, attach either endpoint that landed over a shape handle.
      const endedLineIds = positionChanges
        .filter((change) => change.dragging === false)
        .map((change) => change.id);

      setNodes((current) => {
        let next = applyNodeChanges(changes, current);

        const draggingLineIds = changes
          .filter(
            (change): change is NodePositionChange =>
              change.type === "position" && change.dragging === true,
          )
          .map((change) => change.id);

        if (draggingLineIds.length) {
          next = next.map((node) => {
            if (!draggingLineIds.includes(node.id) || node.data.kind !== "line") return node;
            const data = node.data as SketchLineNodeData;
            if (!data.startAttachment && !data.endAttachment) return node;
            return {
              ...node,
              data: { ...data, startAttachment: null, endAttachment: null },
            };
          });
        }

        if (endedLineIds.length) {
          next = next.map((node) => {
            if (!endedLineIds.includes(node.id) || node.data.kind !== "line") return node;
            const data = node.data as SketchLineNodeData;
            const startAbs = { x: node.position.x + data.start.x, y: node.position.y + data.start.y };
            const endAbs = { x: node.position.x + data.end.x, y: node.position.y + data.end.y };
            const startSnap = findEndpointSnap(next, startAbs, node.id);
            const endSnap = findEndpointSnap(next, endAbs, node.id);
            if (!startSnap && !endSnap) return node;
            return {
              ...node,
              data: {
                ...data,
                startAttachment: startSnap?.attachment ?? data.startAttachment ?? null,
                endAttachment: endSnap?.attachment ?? data.endAttachment ?? null,
              },
            };
          });
        }

        const selectedLineIds = changes
          .filter(
            (change): change is NodeSelectionChange =>
              change.type === "select" && change.selected === true,
          )
          .map((change) => change.id);

        for (const id of selectedLineIds) {
          const node = next.find((item) => item.id === id);
          if (node?.type === "line") {
            next = [...next.filter((item) => item.id !== id), node];
          }
        }

        return syncLineAttachments(next);
      });
    },
    [setNodes, recordSnapshot, setConnectHintId],
  );

  const selectNode = useCallback(
    (id: string) => {
      setNodes((current) => {
        const target = current.find((node) => node.id === id);
        if (!target) return current;
        // Deselect everything else and lift the target to the front so its
        // line/handles render above neighbors.
        const rest = current
          .filter((node) => node.id !== id)
          .map((node) => (node.selected ? { ...node, selected: false } : node));
        return [...rest, { ...target, selected: true }];
      });
    },
    [setNodes],
  );

  /**
   * Live-update a line endpoint while it is being dragged. Pass an `attachment`
   * to glue the endpoint to a shape handle (the caller supplies the matching
   * absolute position), or `null` to leave it floating freely on the canvas.
   */
  const dragLineEndpoint = useCallback(
    (
      lineId: string,
      endpoint: "start" | "end",
      absPoint: SketchPoint,
      attachment: SketchLineAttachment | null,
    ) => {
      commitNodes((current) =>
        current.map((node) => {
          if (node.id !== lineId || node.data.kind !== "line") return node;
          const moved = repositionLineEndpoint(node, endpoint, absPoint, false);
          const data = moved.data as SketchLineNodeData;
          const attachmentKey = endpoint === "start" ? "startAttachment" : "endAttachment";
          return {
            ...moved,
            selected: true,
            data: { ...data, [attachmentKey]: attachment },
          };
        }),
      );
    },
    [commitNodes],
  );

  const isValidConnection = useCallback((connection: Connection) => {
    const { source, target } = connection;
    if (!source || !target || source === target) return false;

    const sourceNode = nodes.find((node) => node.id === source);
    const targetNode = nodes.find((node) => node.id === target);
    if (!sourceNode || !targetNode) return false;

    // Lines connect to shapes only via their custom endpoint knobs, never
    // through ReactFlow's handle-to-handle connections.
    if (sourceNode.type === "line" || targetNode.type === "line") return false;
    return true;
  }, [nodes]);

  // Dragging a connector out from one shape handle to another spawns a line.
  const onConnect = useCallback(
    (connection: Connection) => {
      const { source, sourceHandle, target, targetHandle } = connection;
      if (!source || !target || !sourceHandle || !targetHandle) return;

      commitNodesWithHistory((current) => {
        const sourceNode = current.find((node) => node.id === source);
        const targetNode = current.find((node) => node.id === target);
        if (!sourceNode || !targetNode) return current;
        if (sourceNode.type === "line" || targetNode.type === "line") return current;

        const newLine = createLineBetweenNodes(
          nextId("line"),
          sourceNode,
          sourceHandle,
          targetNode,
          targetHandle,
          DEFAULT_LINE_STYLING,
        );

        return [...current.map((node) => ({ ...node, selected: false })), newLine];
      });
    },
    [commitNodesWithHistory, nextId],
  );

  const addNode = useCallback(
    (kind: SketchNodeKind, shape?: SketchShapeKind) => {
      const id = nextId(kind);
      const offset = (idCounter.current % 6) * 28;
      // Build lines via the shared geometry helper so their bounds wrap the
      // segment symmetrically (otherwise the selection box looks lopsided).
      const node: SketchNode =
        kind === "line"
          ? createLineNodeFromPoints({
              id,
              startAbs: { x: 320 + offset, y: 300 + offset },
              endAbs: { x: 500 + offset, y: 300 + offset },
              data: DEFAULT_LINE_STYLING,
            })
          : {
              id,
              type: kind,
              position: { x: 320 + offset, y: 260 + offset },
              data: makeNodeData(kind, shape),
              selected: true,
            };
      commitNodesWithHistory((current) => [
        ...current.map((existing) => ({ ...existing, selected: false })),
        node,
      ]);
      return id;
    },
    [commitNodesWithHistory, nextId],
  );

  const addLine = useCallback(() => addNode("line"), [addNode]);

  const addImage = useCallback(
    (src: string) => {
      const id = nextId("image");
      const offset = (idCounter.current % 6) * 28;
      const node: SketchNode = {
        id,
        type: "image",
        position: { x: 320 + offset, y: 260 + offset },
        selected: true,
        data: { kind: "image", src, alt: "", rotation: 0 } satisfies SketchImageNodeData,
      };
      commitNodesWithHistory((current) => [
        ...current.map((existing) => ({ ...existing, selected: false })),
        node,
      ]);
      return id;
    },
    [commitNodesWithHistory, nextId],
  );

  const updateNodeData = useCallback(
    (id: string, partial: Partial<SketchNodeData>) => {
      commitNodesWithHistory((current) =>
        current.map((node) =>
          node.id === id
            ? ({ ...node, data: { ...node.data, ...partial } } as SketchNode)
            : node,
        ),
      );
    },
    [commitNodesWithHistory],
  );

  const duplicateNode = useCallback(
    (id: string) => {
      commitNodesWithHistory((current) => {
        const source = current.find((node) => node.id === id);
        if (!source) return current;
        const clone: SketchNode = {
          ...source,
          id: nextId(source.type ?? "node"),
          position: { x: source.position.x + 32, y: source.position.y + 32 },
          selected: true,
          data: {
            ...source.data,
            ...(source.data.kind === "line"
              ? {
                  startAttachment: null,
                  endAttachment: null,
                }
              : {}),
          },
        };
        return [...current.map((node) => ({ ...node, selected: false })), clone];
      });
    },
    [commitNodesWithHistory, nextId],
  );

  const bringNodeForward = useCallback(
    (id: string) => {
      commitNodesWithHistory((current) => {
        const target = current.find((node) => node.id === id);
        if (!target) return current;
        return [...current.filter((node) => node.id !== id), target];
      });
    },
    [commitNodesWithHistory],
  );

  const sendNodeToBack = useCallback(
    (id: string) => {
      commitNodesWithHistory((current) => {
        const target = current.find((node) => node.id === id);
        if (!target) return current;
        return [target, ...current.filter((node) => node.id !== id)];
      });
    },
    [commitNodesWithHistory],
  );

  const deleteNode = useCallback(
    (id: string) => {
      commitNodesWithHistory((current) =>
        current
          .filter((node) => node.id !== id)
          .map((node) => {
            if (node.data.kind !== "line") return node;
            const data = node.data as SketchLineNodeData;
            const clearsStart = data.startAttachment?.nodeId === id;
            const clearsEnd = data.endAttachment?.nodeId === id;
            if (!clearsStart && !clearsEnd) return node;
            return {
              ...node,
              data: {
                ...data,
                startAttachment: clearsStart ? null : data.startAttachment,
                endAttachment: clearsEnd ? null : data.endAttachment,
              },
            };
          }),
      );
    },
    [commitNodesWithHistory],
  );

  const clearSelection = useCallback(() => {
    setNodes((current) => current.map((node) => ({ ...node, selected: false })));
  }, [setNodes]);

  const resetCanvas = useCallback(() => {
    const migrated = migrateStoredCanvas(
      { nodes: initialNodes, edges: initialEdges },
      initialNodes,
    );
    recordSnapshot(nodesRef.current);
    setNodes(migrated.map((node) => ({ ...node, selected: false })));
    idCounter.current = highestNumericIdSuffix(migrated);
  }, [initialNodes, initialEdges, setNodes, recordSnapshot]);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.selected) ?? null,
    [nodes],
  );

  return {
    nodes,
    onNodesChange,
    onConnect,
    selectNode,
    dragLineEndpoint,
    beginHistoryStep,
    undo,
    redo,
    canUndo,
    canRedo,
    connectHintId,
    setConnectHintId,
    isValidConnection,
    selectedNode,
    addNode,
    addLine,
    addImage,
    updateNodeData,
    duplicateNode,
    bringNodeForward,
    sendNodeToBack,
    deleteNode,
    clearSelection,
    resetCanvas,
  };
}

export type SketchLabState = ReturnType<typeof useSketchLabState>;
