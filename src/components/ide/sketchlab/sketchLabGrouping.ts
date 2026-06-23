import type { SketchNode } from "../../../types/sketchLab";
import { getNodeAbsoluteBounds } from "./sketchLabLineGeometry";

const GROUP_PADDING = 8;

export function getGroupMembers(nodes: SketchNode[], groupId: string) {
  return nodes.filter((node) => node.parentId === groupId && node.data.kind !== "group");
}

export function isGroupNode(node: SketchNode | undefined) {
  return node?.data.kind === "group";
}

/** Resolve which group (if any) the current selection should edit. */
export function resolveGroupSelection(nodes: SketchNode[], selected: SketchNode[]) {
  if (!selected.length) return null;

  const selectedGroup = selected.find((node) => node.data.kind === "group");
  if (selectedGroup) {
    return {
      groupId: selectedGroup.id,
      members: getGroupMembers(nodes, selectedGroup.id),
    };
  }

  const parentIds = selected
    .map((node) => node.parentId)
    .filter((parentId): parentId is string => Boolean(parentId));
  if (!parentIds.length) return null;

  const uniqueParents = new Set(parentIds);
  if (uniqueParents.size !== 1) return null;

  const groupId = parentIds[0]!;
  const groupNode = nodes.find((node) => node.id === groupId);
  if (!isGroupNode(groupNode)) return null;

  const members = getGroupMembers(nodes, groupId);
  const selectedIds = new Set(selected.map((node) => node.id));
  const allMembersSelected =
    selected.length === members.length && members.every((member) => selectedIds.has(member.id));

  if (allMembersSelected) {
    return { groupId, members };
  }

  return null;
}

export function computeGroupBounds(nodes: SketchNode[], memberIds: Set<string>) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    if (!memberIds.has(node.id)) continue;
    const bounds = getNodeAbsoluteBounds(node, nodes);
    minX = Math.min(minX, bounds.x);
    minY = Math.min(minY, bounds.y);
    maxX = Math.max(maxX, bounds.x + bounds.width);
    maxY = Math.max(maxY, bounds.y + bounds.height);
  }

  if (!Number.isFinite(minX)) {
    return { x: 0, y: 0, width: 120, height: 72 };
  }

  return {
    x: minX - GROUP_PADDING,
    y: minY - GROUP_PADDING,
    width: Math.max(maxX - minX + GROUP_PADDING * 2, 24),
    height: Math.max(maxY - minY + GROUP_PADDING * 2, 24),
  };
}

/** Ensure parent group nodes appear before their children in the nodes array. */
export function sortNodesParentFirst(nodes: SketchNode[]) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const depthCache = new Map<string, number>();

  const depth = (node: SketchNode): number => {
    const cached = depthCache.get(node.id);
    if (cached !== undefined) return cached;
    if (!node.parentId || !byId.has(node.parentId)) {
      depthCache.set(node.id, 0);
      return 0;
    }
    const value = depth(byId.get(node.parentId)!) + 1;
    depthCache.set(node.id, value);
    return value;
  };

  return [...nodes].sort((left, right) => depth(left) - depth(right));
}
