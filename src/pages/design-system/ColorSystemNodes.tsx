import { type CSSProperties, type ReactNode } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cssColor, isTransparentColor, isUnsetPrimitiveHex, readableTextOn } from "./colorSystemData";
import styles from "./ColorSystemNodes.module.scss";

function ColorSwatch({
  hex,
  className,
  children,
}: {
  hex: string;
  className: string;
  children?: ReactNode;
}) {
  const unset = isUnsetPrimitiveHex(hex);
  const transparent = !unset && isTransparentColor(hex);
  return (
    <span
      className={`${className} ${unset || transparent ? styles.colorSwatchAlpha : ""}`}
      style={
        unset || transparent
          ? undefined
          : { background: cssColor(hex), color: readableTextOn(hex) }
      }
    >
      {transparent ? (
        <span className={styles.colorSwatchFill} style={{ background: cssColor(hex) }} />
      ) : null}
      {children ? (
        <span
          className={styles.colorSwatchLabel}
          style={unset || transparent ? { color: readableTextOn(hex) } : undefined}
        >
          {children}
        </span>
      ) : null}
    </span>
  );
}

export type FamilyDropKind = "primitiveCollection" | "semanticCollection" | "semanticSubGroup";

export interface CollectionNodeData {
  collectionId: string;
  name: string;
  familyCount: number;
  selected: boolean;
  dropId: string;
  dropKind: FamilyDropKind;
  onSelect: (collectionId: string) => void;
  [key: string]: unknown;
}

export interface PrimitiveNodeSwatch {
  id: string;
  step: string;
  hex: string;
}

export interface PrimitiveNodeData {
  familyId: string;
  collectionId: string;
  name: string;
  collectionName: string;
  color: string;
  swatches: PrimitiveNodeSwatch[];
  selectedStepId: string | null;
  familySelected: boolean;
  dragId: string;
  onSelectStep: (stepId: string) => void;
  onSelectFamily: (familyId: string) => void;
  [key: string]: unknown;
}

export interface SemanticNodeChip {
  id: string;
  surface: string;
  role: string;
  hex: string;
  mapped: boolean;
  /** True when the token has a rationale comment for the current theme. */
  hasComment: boolean;
  dragId: string;
}

export interface SemanticNodeData {
  familyKey: string;
  surface: string;
  subGroupId: string;
  label: string;
  color: string;
  chips: SemanticNodeChip[];
  selectedRole: string | null;
  familySelected: boolean;
  dragId: string;
  onSelect: (id: string) => void;
  onSelectFamily: (familyKey: string, surface: string) => void;
  [key: string]: unknown;
}

export interface SemanticSubGroupNodeData {
  subGroupId: string;
  surface: string;
  name: string;
  familyCount: number;
  selected: boolean;
  dropId: string;
  onSelect: (surface: string, subGroupId: string) => void;
  [key: string]: unknown;
}

export function CollectionHeaderNode({ data, selected }: NodeProps) {
  const nodeData = data as CollectionNodeData;
  const { setNodeRef, isOver } = useDroppable({
    id: nodeData.dropId,
    data: {
      kind: nodeData.dropKind,
      collectionId: nodeData.collectionId,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`${styles.collectionCard} ${
        selected || nodeData.selected ? styles.collectionCardActive : ""
      } ${isOver ? styles.dropTargetActive : ""}`}
    >
      <div
        className={`nopan ${styles.collectionCardHeader}`}
        onClick={() => nodeData.onSelect(nodeData.collectionId)}
      >
        <span className={styles.collectionName}>{nodeData.name}</span>
        <span className={styles.collectionMeta}>
          {nodeData.familyCount} {nodeData.familyCount === 1 ? "family" : "families"}
        </span>
      </div>
    </div>
  );
}

export function SemanticSubGroupNode({ data, selected }: NodeProps) {
  const nodeData = data as SemanticSubGroupNodeData;
  const { setNodeRef, isOver } = useDroppable({
    id: nodeData.dropId,
    data: {
      kind: "semanticSubGroup" as const,
      surface: nodeData.surface,
      subGroupId: nodeData.subGroupId,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`${styles.subGroupCard} ${
        selected || nodeData.selected ? styles.subGroupCardActive : ""
      } ${isOver ? styles.dropTargetActive : ""}`}
    >
      <div
        className={`nopan ${styles.subGroupCardHeader}`}
        onClick={() => nodeData.onSelect(nodeData.surface, nodeData.subGroupId)}
      >
        <span className={styles.subGroupName}>{nodeData.name}</span>
        <span className={styles.subGroupMeta}>
          {nodeData.familyCount} {nodeData.familyCount === 1 ? "family" : "families"}
        </span>
      </div>
    </div>
  );
}

export function PrimitiveFamilyNode({ data, selected }: NodeProps) {
  const nodeData = data as PrimitiveNodeData;
  const dragData = {
    kind: "primitiveFamily" as const,
    familyId: nodeData.familyId,
    collectionId: nodeData.collectionId,
  };
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: nodeData.dragId,
    data: dragData,
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: nodeData.dragId,
    data: dragData,
  });
  const setNodeRef = (node: HTMLDivElement | null) => {
    setDragRef(node);
    setDropRef(node);
  };

  return (
    <div
      ref={setNodeRef}
      className={`${styles.node} ${styles.primitiveNode} ${
        selected || nodeData.familySelected ? styles.nodeActive : ""
      } ${isDragging ? styles.nodeDragging : ""} ${isOver ? styles.dropTargetActive : ""}`}
      style={{
        "--family-color": nodeData.color,
        "--swatch-count": nodeData.swatches.length,
      } as CSSProperties}
    >
      <button
        type="button"
        className={`nopan ${styles.nodeHeader}`}
        onClick={() => nodeData.onSelectFamily(nodeData.familyId)}
        aria-label={`Drag or select ${nodeData.name} family`}
        {...attributes}
        {...listeners}
      >
        <span className={styles.familyDot} style={{ background: nodeData.color }} />
        <span className={styles.nodeTitle}>{nodeData.name}</span>
        <span className={styles.nodeCount}>{nodeData.swatches.length}</span>
      </button>

      <div className={styles.swatchGrid}>
        {nodeData.swatches.map((swatch) => {
          const isSelected = nodeData.selectedStepId === swatch.id;
          const unset = isUnsetPrimitiveHex(swatch.hex);
          const hexLabel = unset ? "Unset" : swatch.hex;
          return (
            <button
              key={swatch.id}
              type="button"
              className={`${styles.swatch} ${isSelected ? styles.swatchSelected : ""}`}
              onClick={() => nodeData.onSelectStep(swatch.id)}
              title={`${nodeData.name}-${swatch.step} · ${hexLabel}`}
            >
              <ColorSwatch hex={swatch.hex} className={styles.swatchChip}>
                {swatch.step}
              </ColorSwatch>
              <span className={styles.swatchHex}>{hexLabel}</span>
              <Handle
                id={swatch.id}
                type="source"
                position={Position.Bottom}
                className={styles.connectorHandle}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SemanticChip({
  chip,
  surface,
  familyKey,
  isSelected,
  onSelect,
}: {
  chip: SemanticNodeChip;
  surface: string;
  familyKey: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const dragData = {
    kind: "semanticChip" as const,
    surface,
    familyKey,
    role: chip.role,
  };
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: chip.dragId,
    data: dragData,
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: chip.dragId,
    data: dragData,
  });
  const setNodeRef = (node: HTMLButtonElement | null) => {
    setDragRef(node);
    setDropRef(node);
  };

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={`nopan ${styles.chip} ${isSelected ? styles.chipSelected : ""} ${
        chip.mapped ? "" : styles.chipUnmapped
      } ${isDragging ? styles.chipDragging : ""} ${isOver ? styles.chipDropTarget : ""}`}
      onClick={() => onSelect(chip.id)}
      title={`${chip.id} · drag to reorder`}
      aria-label={`Drag or select ${chip.role} token`}
      {...attributes}
      {...listeners}
    >
      <ColorSwatch hex={chip.hex} className={styles.chipSwatch} />
      <span className={styles.chipLabel}>{chip.role}</span>
      {chip.hasComment ? (
        <span className={styles.chipCommentDot} title="Has a rationale comment" />
      ) : null}
      <Handle
        id={chip.role}
        type="target"
        position={Position.Top}
        className={styles.connectorHandle}
      />
    </button>
  );
}

export function SemanticFamilyNode({ data, selected }: NodeProps) {
  const nodeData = data as SemanticNodeData;
  const dragData = {
    kind: "semanticFamily" as const,
    familyKey: nodeData.familyKey,
    surface: nodeData.surface,
    subGroupId: nodeData.subGroupId,
  };
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: nodeData.dragId,
    data: dragData,
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: nodeData.dragId,
    data: dragData,
  });
  const setNodeRef = (node: HTMLDivElement | null) => {
    setDragRef(node);
    setDropRef(node);
  };

  return (
    <div
      ref={setNodeRef}
      className={`${styles.node} ${styles.semanticNode} ${
        selected || nodeData.familySelected ? styles.nodeActive : ""
      } ${isDragging ? styles.nodeDragging : ""} ${isOver ? styles.dropTargetActive : ""}`}
      style={{ "--family-color": nodeData.color } as CSSProperties}
    >
      <button
        type="button"
        className={`nopan ${styles.nodeHeader}`}
        onClick={() => nodeData.onSelectFamily(nodeData.familyKey, nodeData.surface)}
        aria-label={`Drag or select ${nodeData.label} family`}
        {...attributes}
        {...listeners}
      >
        <span className={styles.familyDot} style={{ background: nodeData.color }} />
        <span className={styles.nodeTitle}>{nodeData.label}</span>
        <span className={styles.nodeCount}>{nodeData.chips.length}</span>
      </button>

      <div className={styles.surfaceGroup}>
        <div className={styles.chipRow}>
          {nodeData.chips.map((chip) => (
            <SemanticChip
              key={chip.id}
              chip={chip}
              surface={nodeData.surface}
              familyKey={nodeData.familyKey}
              isSelected={nodeData.selectedRole === chip.role}
              onSelect={nodeData.onSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export const colorSystemNodeTypes = {
  collectionHeader: CollectionHeaderNode,
  semanticSubGroup: SemanticSubGroupNode,
  primitiveFamily: PrimitiveFamilyNode,
  semanticFamily: SemanticFamilyNode,
};
