import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { AppButton } from "../../../../ui/AppButton";
import { AppTextField } from "../../../../ui/AppTextField";
import { Tooltip } from "../../../../ui/Tooltip";
import type {
  SketchImageNodeData,
  SketchLineNodeData,
  SketchNode,
  SketchNodeData,
  SketchSelectionContext,
  SketchShapeNodeData,
  SketchTextNodeData,
} from "../../../../../types/sketchLab";
import {
  SKETCH_ARROWHEAD_OPTIONS,
  SKETCH_LINE_SHAPE_OPTIONS,
  SKETCH_LINE_STYLE_OPTIONS,
  SKETCH_THICKNESS_OPTIONS,
} from "../../sketchLabOptions";
import { SketchIcon } from "../../sketchLabIcons";
import {
  ActionsRow,
  AlignmentDropdown,
  ColorDropdown,
  GroupActionsRow,
  MultiSelectGroupButton,
  MultiSelectActionsRow,
  OptionDropdown,
  PropertyRow,
  PropertySection,
  RotationControl,
  SizeDropdown,
} from "./PropertyControls";
import styles from "./PropertyPanel.module.scss";

interface PropertyPanelProps {
  selection: SketchSelectionContext | null;
  onUpdateNodeData: (id: string, partial: Partial<SketchNodeData>) => void;
  onUpdateGroupMembers: (
    groupId: string,
    match: (node: SketchNode) => boolean,
    partial: Partial<SketchNodeData>,
  ) => void;
  onDuplicate: (id: string) => void;
  onBringForward: (id: string) => void;
  onSendToBack: (id: string) => void;
  onDeleteNode: (id: string) => void;
  onGroupSelected: () => void;
  onUngroup: (groupId: string) => void;
  onBringSelectedForward: () => void;
  onSendSelectedToBack: () => void;
  onDeleteSelected: () => void;
  onClose: () => void;
}

export function PropertyPanel(props: PropertyPanelProps) {
  const { selection } = props;
  if (!selection) return null;

  if (selection.mode === "multi") {
    return <MultiSelectPanel nodes={selection.nodes} {...props} />;
  }
  if (selection.mode === "group") {
    return (
      <GroupPanel
        groupId={selection.groupId}
        members={selection.members}
        {...props}
      />
    );
  }

  const { node } = selection;
  const kind = node.data.kind;
  if (kind === "shape") return <ShapePanel node={node} {...props} />;
  if (kind === "text") return <TextPanel node={node} {...props} />;
  if (kind === "line") return <LinePanel node={node} {...props} />;
  return <ImagePanel node={node} {...props} />;
}

function membersByKind(members: SketchNode[], kind: SketchNodeData["kind"]) {
  return members.filter((node) => node.data.kind === kind);
}

/** Drag the floating panel by its header (ignoring the close button). */
function usePanelDrag() {
  const panelRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const onHeaderPointerDown = useCallback((event: ReactPointerEvent) => {
    if ((event.target as HTMLElement).closest("button")) return;
    const panel = panelRef.current;
    const parent = panel?.offsetParent as HTMLElement | null;
    if (!panel || !parent) return;

    const panelRect = panel.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    drag.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - panelRect.left,
      offsetY: event.clientY - panelRect.top,
    };
    setPos({ x: panelRect.left - parentRect.left, y: panelRect.top - parentRect.top });
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }, []);

  const onHeaderPointerMove = useCallback((event: ReactPointerEvent) => {
    if (!drag.current || event.pointerId !== drag.current.pointerId) return;
    const panel = panelRef.current;
    const parent = panel?.offsetParent as HTMLElement | null;
    if (!panel || !parent) return;
    const parentRect = parent.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const gutter = 8;
    const maxX = parent.clientWidth - panelRect.width - gutter;
    const maxY = parent.clientHeight - panelRect.height - gutter;
    const clamp = (value: number, max: number) => Math.min(Math.max(value, gutter), Math.max(gutter, max));
    setPos({
      x: clamp(event.clientX - parentRect.left - drag.current.offsetX, maxX),
      y: clamp(event.clientY - parentRect.top - drag.current.offsetY, maxY),
    });
  }, []);

  const endDrag = useCallback((event: ReactPointerEvent) => {
    if (!drag.current || event.pointerId !== drag.current.pointerId) return;
    event.currentTarget.releasePointerCapture?.(drag.current.pointerId);
    drag.current = null;
  }, []);

  const style = pos ? { left: pos.x, top: pos.y, right: "auto" as const } : undefined;
  return { panelRef, style, onHeaderPointerDown, onHeaderPointerMove, endDrag };
}

function PanelShell({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const { panelRef, style, onHeaderPointerDown, onHeaderPointerMove, endDrag } = usePanelDrag();
  return (
    <div className={styles.panel} ref={panelRef} style={style}>
      <div
        className={styles.header}
        onPointerDown={onHeaderPointerDown}
        onPointerMove={onHeaderPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <span className={styles.headerLabel}>{label}</span>
        <div className={styles.headerActions}>
          <Tooltip content="Close panel" position="left">
            <AppButton
              className={styles.closeButton}
              variant="tertiary"
              tone="gray"
              size="xs"
              icon={<SketchIcon icon="close" size="xs" />}
              aria-label="Close panel"
              onClick={onClose}
            />
          </Tooltip>
        </div>
      </div>
      {children}
    </div>
  );
}

function nodeActions(node: SketchNode, props: PropertyPanelProps) {
  return {
    onDuplicate: () => props.onDuplicate(node.id),
    onBringForward: () => props.onBringForward(node.id),
    onToggleLayer: () => props.onSendToBack(node.id),
    onDelete: () => props.onDeleteNode(node.id),
  };
}

function MultiSelectPanel({
  nodes,
  onGroupSelected,
  onDuplicate,
  onBringSelectedForward,
  onSendSelectedToBack,
  onDeleteSelected,
  onClose,
}: { nodes: SketchNode[] } & PropertyPanelProps) {
  const label = `${nodes.length} items selected`;
  return (
    <PanelShell label={label} onClose={onClose}>
      <PropertySection>
        <MultiSelectGroupButton onGroup={onGroupSelected} />
      </PropertySection>
      <PropertySection title="Actions">
        <MultiSelectActionsRow
          onDuplicate={() => {
            for (const node of nodes) onDuplicate(node.id);
          }}
          onBringForward={onBringSelectedForward}
          onToggleLayer={onSendSelectedToBack}
          onDelete={onDeleteSelected}
        />
      </PropertySection>
    </PanelShell>
  );
}

function GroupPanel({
  groupId,
  members,
  onUpdateGroupMembers,
  onBringForward,
  onSendToBack,
  onDeleteNode,
  onUngroup,
  onDuplicate,
  onClose,
}: {
  groupId: string;
  members: SketchNode[];
} & PropertyPanelProps) {
  const shapes = membersByKind(members, "shape");
  const lines = membersByKind(members, "line");
  const textNodes = membersByKind(members, "text");
  const images = membersByKind(members, "image");
  const typographyTargets = [...textNodes, ...shapes];
  const rotatable = [...shapes, ...textNodes, ...images];

  const updateShapes = (partial: Partial<SketchShapeNodeData>) => {
    onUpdateGroupMembers(groupId, (node) => node.data.kind === "shape", partial);
  };
  const updateLines = (partial: Partial<SketchLineNodeData>) => {
    onUpdateGroupMembers(groupId, (node) => node.data.kind === "line", partial);
  };
  const updateTextNodes = (partial: Partial<SketchTextNodeData>) => {
    onUpdateGroupMembers(
      groupId,
      (node) => node.data.kind === "text" || node.data.kind === "shape",
      partial,
    );
  };
  const updateRotatable = (partial: Partial<SketchNodeData>) => {
    onUpdateGroupMembers(
      groupId,
      (node) =>
        node.data.kind === "shape" ||
        node.data.kind === "text" ||
        node.data.kind === "image",
      partial,
    );
  };

  const firstShape = shapes[0]?.data as SketchShapeNodeData | undefined;
  const firstLine = lines[0]?.data as SketchLineNodeData | undefined;
  const firstText = typographyTargets[0]?.data as
    | SketchTextNodeData
    | SketchShapeNodeData
    | undefined;
  const firstRotatable = rotatable[0]?.data as
    | SketchShapeNodeData
    | SketchTextNodeData
    | SketchImageNodeData
    | undefined;

  const textColor =
    firstText?.kind === "text"
      ? firstText.color
      : firstText?.kind === "shape"
        ? firstText.textColor
        : "black";

  return (
    <PanelShell label="Group" onClose={onClose}>
      {shapes.length ? (
        <PropertySection title="Shapes">
          <PropertyRow label="Background">
            <ColorDropdown
              palette="background"
              value={firstShape?.background ?? "blue"}
              onChange={(background) => updateShapes({ background })}
            />
          </PropertyRow>
          <PropertyRow label="Borders">
            <ColorDropdown
              palette="border"
              value={firstShape?.border ?? "blue"}
              onChange={(border) => updateShapes({ border })}
            />
          </PropertyRow>
        </PropertySection>
      ) : null}

      {lines.length ? (
        <PropertySection title="Lines">
          <PropertyRow label="Color">
            <ColorDropdown
              palette="text"
              value={firstLine?.color ?? "black"}
              onChange={(color) => updateLines({ color })}
            />
          </PropertyRow>
          <PropertyRow label="Thickness">
            <OptionDropdown
              ariaLabel="Thickness"
              categoryIcon="line-weight"
              options={SKETCH_THICKNESS_OPTIONS}
              value={firstLine?.thickness ?? "medium"}
              onChange={(thickness) => updateLines({ thickness })}
            />
          </PropertyRow>
          <PropertyRow label="Style">
            <OptionDropdown
              ariaLabel="Style"
              categoryIcon="line-style"
              options={SKETCH_LINE_STYLE_OPTIONS}
              value={firstLine?.style ?? "solid"}
              onChange={(style) => updateLines({ style })}
            />
          </PropertyRow>
          <PropertyRow label="Shape">
            <OptionDropdown
              ariaLabel="Shape"
              categoryIcon="line-shape"
              options={SKETCH_LINE_SHAPE_OPTIONS}
              value={firstLine?.shape ?? "straight"}
              onChange={(shape) => updateLines({ shape })}
            />
          </PropertyRow>
          <PropertyRow label="Arrowheads">
            <OptionDropdown
              ariaLabel="Arrowheads"
              options={SKETCH_ARROWHEAD_OPTIONS}
              value={firstLine?.arrowheads ?? "none"}
              onChange={(arrowheads) => updateLines({ arrowheads })}
            />
          </PropertyRow>
        </PropertySection>
      ) : null}

      {typographyTargets.length ? (
        <PropertySection title="Text">
          <PropertyRow label="Size">
            <SizeDropdown
              sizeKey={firstText?.fontSizeKey ?? "medium"}
              customFontSize={firstText?.customFontSize}
              onChange={(fontSizeKey, customFontSize) =>
                updateTextNodes({ fontSizeKey, customFontSize })
              }
            />
          </PropertyRow>
          <PropertyRow label="Alignment">
            <AlignmentDropdown
              value={firstText?.align ?? "center"}
              onChange={(align) => updateTextNodes({ align })}
            />
          </PropertyRow>
          <PropertyRow label="Color">
            <ColorDropdown
              palette="text"
              value={textColor}
              onChange={(color) => {
                onUpdateGroupMembers(groupId, (node) => node.data.kind === "text", { color });
                onUpdateGroupMembers(groupId, (node) => node.data.kind === "shape", {
                  textColor: color,
                });
              }}
            />
          </PropertyRow>
        </PropertySection>
      ) : null}

      {rotatable.length ? (
        <PropertySection title="Transform">
          <PropertyRow label="Rotation">
            <RotationControl
              value={firstRotatable?.rotation ?? 0}
              onChange={(rotation) => updateRotatable({ rotation })}
            />
          </PropertyRow>
        </PropertySection>
      ) : null}

      <PropertySection title="Actions">
        <GroupActionsRow
          onDuplicate={() => {
            for (const member of members) onDuplicate(member.id);
          }}
          onBringForward={() => onBringForward(groupId)}
          onUngroup={() => onUngroup(groupId)}
          onToggleLayer={() => onSendToBack(groupId)}
          onDelete={() => onDeleteNode(groupId)}
        />
      </PropertySection>
    </PanelShell>
  );
}

function ShapePanel({ node, ...props }: { node: SketchNode } & PropertyPanelProps) {
  const data = node.data as SketchShapeNodeData;
  const update = (partial: Partial<SketchShapeNodeData>) =>
    props.onUpdateNodeData(node.id, partial);
  return (
    <PanelShell label="Shape" onClose={props.onClose}>
      <PropertySection title="Appearance">
        <PropertyRow label="Background">
          <ColorDropdown
            palette="background"
            value={data.background}
            onChange={(v) => update({ background: v })}
          />
        </PropertyRow>
        <PropertyRow label="Border">
          <ColorDropdown
            palette="border"
            value={data.border}
            onChange={(v) => update({ border: v })}
          />
        </PropertyRow>
        <PropertyRow label="Rotation">
          <RotationControl value={data.rotation} onChange={(rotation) => update({ rotation })} />
        </PropertyRow>
      </PropertySection>
      <PropertySection title="Typography">
        <PropertyRow label="Size">
          <SizeDropdown
            sizeKey={data.fontSizeKey}
            customFontSize={data.customFontSize}
            onChange={(fontSizeKey, customFontSize) =>
              update({ fontSizeKey, customFontSize })
            }
          />
        </PropertyRow>
        <PropertyRow label="Alignment">
          <AlignmentDropdown value={data.align} onChange={(align) => update({ align })} />
        </PropertyRow>
        <PropertyRow label="Color">
          <ColorDropdown
            palette="text"
            value={data.textColor}
            onChange={(v) => update({ textColor: v })}
          />
        </PropertyRow>
      </PropertySection>
      <PropertySection title="Actions">
        <ActionsRow {...nodeActions(node, props)} />
      </PropertySection>
    </PanelShell>
  );
}

function TextPanel({ node, ...props }: { node: SketchNode } & PropertyPanelProps) {
  const data = node.data as SketchTextNodeData;
  const update = (partial: Partial<SketchTextNodeData>) =>
    props.onUpdateNodeData(node.id, partial);
  return (
    <PanelShell label="Text" onClose={props.onClose}>
      <PropertySection title="Appearance">
        <PropertyRow label="Size">
          <SizeDropdown
            sizeKey={data.fontSizeKey}
            customFontSize={data.customFontSize}
            onChange={(fontSizeKey, customFontSize) =>
              update({ fontSizeKey, customFontSize })
            }
          />
        </PropertyRow>
        <PropertyRow label="Alignment">
          <AlignmentDropdown value={data.align} onChange={(align) => update({ align })} />
        </PropertyRow>
        <PropertyRow label="Color">
          <ColorDropdown
            palette="text"
            value={data.color}
            onChange={(v) => update({ color: v })}
          />
        </PropertyRow>
        <PropertyRow label="Rotation">
          <RotationControl value={data.rotation} onChange={(rotation) => update({ rotation })} />
        </PropertyRow>
      </PropertySection>
      <PropertySection title="Actions">
        <ActionsRow {...nodeActions(node, props)} />
      </PropertySection>
    </PanelShell>
  );
}

function ImagePanel({ node, ...props }: { node: SketchNode } & PropertyPanelProps) {
  const data = node.data as SketchImageNodeData;
  const update = (partial: Partial<SketchImageNodeData>) =>
    props.onUpdateNodeData(node.id, partial);
  return (
    <PanelShell label="Image" onClose={props.onClose}>
      <PropertySection title="Appearance">
        <PropertyRow label="Rotation">
          <RotationControl value={data.rotation} onChange={(rotation) => update({ rotation })} />
        </PropertyRow>
      </PropertySection>
      <PropertySection title="Alt Text">
        <AppTextField
          className={styles.altField}
          size="s"
          value={data.alt}
          placeholder="Describe the image"
          onChange={(event) => update({ alt: event.target.value })}
        />
      </PropertySection>
      <PropertySection title="Actions">
        <ActionsRow {...nodeActions(node, props)} />
      </PropertySection>
    </PanelShell>
  );
}

function LinePanel({ node, ...props }: { node: SketchNode } & PropertyPanelProps) {
  const data = node.data as SketchLineNodeData;
  const update = (partial: Partial<SketchLineNodeData>) =>
    props.onUpdateNodeData(node.id, partial);
  return (
    <PanelShell label="Line" onClose={props.onClose}>
      <PropertySection title="Appearance">
        <PropertyRow label="Color">
          <ColorDropdown
            palette="text"
            value={data.color}
            onChange={(v) => update({ color: v })}
          />
        </PropertyRow>
        <PropertyRow label="Thickness">
          <OptionDropdown
            ariaLabel="Thickness"
            categoryIcon="line-weight"
            options={SKETCH_THICKNESS_OPTIONS}
            value={data.thickness}
            onChange={(thickness) => update({ thickness })}
          />
        </PropertyRow>
        <PropertyRow label="Style">
          <OptionDropdown
            ariaLabel="Style"
            categoryIcon="line-style"
            options={SKETCH_LINE_STYLE_OPTIONS}
            value={data.style}
            onChange={(style) => update({ style })}
          />
        </PropertyRow>
        <PropertyRow label="Shape">
          <OptionDropdown
            ariaLabel="Shape"
            categoryIcon="line-shape"
            options={SKETCH_LINE_SHAPE_OPTIONS}
            value={data.shape}
            onChange={(shape) => update({ shape })}
          />
        </PropertyRow>
        <PropertyRow label="Arrowheads">
          <OptionDropdown
            ariaLabel="Arrowheads"
            options={SKETCH_ARROWHEAD_OPTIONS}
            value={data.arrowheads}
            onChange={(arrowheads) => update({ arrowheads })}
          />
        </PropertyRow>
      </PropertySection>
      <PropertySection title="Actions">
        <ActionsRow {...nodeActions(node, props)} />
      </PropertySection>
    </PanelShell>
  );
}
