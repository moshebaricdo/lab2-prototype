import { createContext, useContext } from "react";
import type {
  SketchLineAttachment,
  SketchNodeData,
} from "../../../../types/sketchLab";
import type { SketchPoint } from "../sketchLabLineGeometry";

interface SketchLabActions {
  updateNodeData: (id: string, partial: Partial<SketchNodeData>) => void;
  selectNode: (id: string) => void;
  dragLineEndpoint: (
    lineId: string,
    endpoint: "start" | "end",
    absPoint: SketchPoint,
    attachment: SketchLineAttachment | null,
  ) => void;
  /** Snapshot the canvas for undo before a multi-step gesture (endpoint drag). */
  beginHistoryStep: () => void;
  /** Shape id whose handles are revealed as a live connection target, or null. */
  connectHintId: string | null;
  setConnectHintId: (id: string | null) => void;
}

const SketchLabActionsContext = createContext<SketchLabActions | null>(null);

export const SketchLabActionsProvider = SketchLabActionsContext.Provider;

/** Lets custom nodes write back into the workspace's controlled canvas state. */
export function useSketchLabActions(): SketchLabActions {
  const context = useContext(SketchLabActionsContext);
  if (!context) {
    throw new Error("useSketchLabActions must be used within SketchLabActionsProvider");
  }
  return context;
}
