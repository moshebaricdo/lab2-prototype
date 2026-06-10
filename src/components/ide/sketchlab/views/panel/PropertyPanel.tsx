import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { AppButton } from "../../../../ui/AppButton";
import { AppTextField } from "../../../../ui/AppTextField";
import { Tooltip } from "../../../../ui/Tooltip";
import type {
  SketchImageNodeData,
  SketchLineNodeData,
  SketchNode,
  SketchNodeData,
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
  OptionDropdown,
  PropertyRow,
  PropertySection,
  RotationControl,
  SizeDropdown,
} from "./PropertyControls";
import styles from "./PropertyPanel.module.scss";

interface PropertyPanelProps {
  selectedNode: SketchNode | null;
  onUpdateNodeData: (id: string, partial: Partial<SketchNodeData>) => void;
  onDuplicate: (id: string) => void;
  onBringForward: (id: string) => void;
  onSendToBack: (id: string) => void;
  onDeleteNode: (id: string) => void;
  onClose: () => void;
}

export function PropertyPanel(props: PropertyPanelProps) {
  const { selectedNode } = props;
  if (!selectedNode) return null;

  const kind = selectedNode.data.kind;
  if (kind === "shape") return <ShapePanel node={selectedNode} {...props} />;
  if (kind === "text") return <TextPanel node={selectedNode} {...props} />;
  if (kind === "line") return <LinePanel node={selectedNode} {...props} />;
  return <ImagePanel node={selectedNode} {...props} />;
}

/** Drag the floating panel by its header (ignoring the close button). */
function usePanelDrag() {
  const panelRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const onHeaderPointerDown = useCallback((event: ReactPointerEvent) => {
    // Let the close button (the only button in the header) work normally.
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
    // Pin to the current spot so right-anchoring releases cleanly before drag.
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
    // Keep the panel fully inside the canvas with an 8px gutter on every side.
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
