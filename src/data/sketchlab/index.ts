import type { ChatMessage } from "../../types/chat";
import type { SketchLegacyEdge, SketchNode } from "../../types/sketchLab";

/**
 * Default Sketch Lab project — a minimal starter so the canvas opens with a
 * shape, a text label, and a standalone connecting line (rather than an empty grid).
 */
export const sketchLabStarterNodes: SketchNode[] = [
  {
    id: "shape-1",
    type: "shape",
    position: { x: 220, y: 200 },
    data: {
      kind: "shape",
      shape: "rectangle",
      text: "Start here",
      background: "pink",
      border: "red",
      fontSizeKey: "medium",
      align: "center",
      textColor: "black",
      rotation: 0,
    },
  },
  {
    id: "text-1",
    type: "text",
    position: { x: 560, y: 150 },
    data: {
      kind: "text",
      text: "Sketch your idea",
      fontSizeKey: "large",
      align: "left",
      color: "black",
      rotation: 0,
    },
  },
  {
    id: "line-1",
    type: "line",
    position: { x: 332, y: 188 },
    width: 244,
    height: 88,
    data: {
      kind: "line",
      start: { x: 8, y: 72 },
      end: { x: 236, y: 8 },
      startAttachment: { nodeId: "shape-1", handleId: "right" },
      endAttachment: { nodeId: "text-1", handleId: "left" },
      color: "black",
      thickness: "medium",
      style: "solid",
      shape: "straight",
      arrowheads: "end",
    },
  },
];

/** @deprecated Legacy starter edges — migrated to standalone line nodes. */
export const sketchLabStarterEdges: SketchLegacyEdge[] = [];

export const sketchLabInstructionsMarkdown = [
  "# Sketch your plan",
  "Use the whiteboard to map out your idea before you build it.",
  "## Do This",
  "1. Add a shape from the toolbar on the left of the canvas.",
  "2. Double-click a shape to label it.",
  "3. Add a line, then drag from a handle to connect it to another shape.",
  "4. Select any element to style it in the panel on the right.",
].join("\n\n");

export const sketchLabInitialChatMessages: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "Hi! I can help you plan your sketch. Tell me what you're trying to diagram and I'll suggest shapes and connections.",
  },
];
