import { useEffect, useMemo, useState } from "react";
import { AppButton } from "../../components/ui/AppButton";
import { Tooltip } from "../../components/ui/Tooltip";
import { FaIcon } from "../../components/ui/icons/FaIcon";
import type { ScratchFlowNode } from "../../lib/colorSandbox/scratchLayer";
import {
  contrastRatio,
  formatContrastRatio,
  isTransparentColor,
  normalizeHex,
  passesWcagAaNormalText,
  rgbHex,
  surfaceColorContrastChecks,
  type ColorSystem,
  type ContrastCheck,
} from "./colorSystemData";
import styles from "./ColorSandboxPage.module.scss";

interface PaletteSwatch {
  hex: string;
  label: string;
}

const SCRATCH_DEFAULT_BORDER = "#D0D5DD";

function ScratchHexField({
  value,
  onCommit,
  ariaLabel,
}: {
  value: string;
  onCommit: (hex: string) => void;
  ariaLabel: string;
}) {
  const opaque = rgbHex(value);
  const [draft, setDraft] = useState(opaque);
  useEffect(() => setDraft(opaque), [opaque]);

  return (
    <input
      className={styles.hexInput}
      value={draft}
      spellCheck={false}
      maxLength={7}
      aria-label={ariaLabel}
      onChange={(event) => {
        const next = event.target.value.toUpperCase().replace(/[^#0-9A-F]/g, "");
        setDraft(next.length > 7 ? next.slice(0, 7) : next);
      }}
      onBlur={() => {
        const next = normalizeHex(draft);
        if (next) {
          const rgb = rgbHex(next);
          if (rgb !== opaque) onCommit(rgb);
          setDraft(rgb);
          return;
        }
        setDraft(opaque);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
    />
  );
}

function FillControl({
  label,
  value,
  palette,
  onChange,
}: {
  label: string;
  value: string;
  palette?: PaletteSwatch[];
  onChange: (hex: string) => void;
}) {
  const opaque = rgbHex(value);
  const commitOpaque = (hex: string) => onChange(rgbHex(hex));

  return (
    <div className={styles.inspectorRow}>
      <span className={styles.inspectorRowLabel}>{label}</span>
      <div className={styles.inspectorInlineField}>
        <input
          type="color"
          className={styles.colorInput}
          value={opaque}
          aria-label={label}
          onChange={(event) => commitOpaque(event.target.value)}
        />
        <ScratchHexField value={opaque} onCommit={commitOpaque} ariaLabel={label} />
      </div>
      {palette && palette.length > 0 ? (
        <div className={styles.scratchPalette}>
          {palette.map((swatch) => (
            <button
              key={`${swatch.label}-${swatch.hex}`}
              type="button"
              className={styles.scratchPaletteSwatch}
              style={{ background: swatch.hex }}
              title={`${swatch.label} (${swatch.hex})`}
              aria-label={`${swatch.label} ${swatch.hex}`}
              onClick={() => commitOpaque(swatch.hex)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function BorderControl({
  label,
  value,
  palette,
  onChange,
  onClear,
}: {
  label: string;
  value: string;
  palette?: PaletteSwatch[];
  onChange: (hex: string) => void;
  onClear: () => void;
}) {
  const hasBorder = value.trim().length > 0;
  const opaque = hasBorder ? rgbHex(value) : SCRATCH_DEFAULT_BORDER;
  const commitOpaque = (hex: string) => onChange(rgbHex(hex));

  return (
    <div className={styles.inspectorRow}>
      <span className={styles.inspectorRowLabel}>{label}</span>
      <div className={styles.inspectorInlineField}>
        <input
          type="color"
          className={styles.colorInput}
          value={opaque}
          aria-label={label}
          onChange={(event) => commitOpaque(event.target.value)}
        />
        {hasBorder ? (
          <ScratchHexField
            value={opaque}
            onCommit={commitOpaque}
            ariaLabel={`${label} hex value`}
          />
        ) : (
          <span className={styles.inspectorMeta}>None</span>
        )}
        {hasBorder ? (
          <Tooltip content="Remove border" position="top">
            <AppButton
              variant="tertiary"
              tone="gray"
              size="xs"
              iconName="xmark"
              aria-label="Remove border"
              onClick={onClear}
            />
          </Tooltip>
        ) : null}
      </div>
      {palette && palette.length > 0 ? (
        <div className={styles.scratchPalette}>
          {palette.map((swatch) => (
            <button
              key={`${swatch.label}-${swatch.hex}`}
              type="button"
              className={styles.scratchPaletteSwatch}
              style={{ background: swatch.hex }}
              title={`${swatch.label} (${swatch.hex})`}
              aria-label={`${swatch.label} ${swatch.hex}`}
              onClick={() => commitOpaque(swatch.hex)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ContrastRows({ checks }: { checks: ContrastCheck[] }) {
  return (
    <div className={styles.inspectorA11yRows}>
      {checks.map((check) => (
        <div key={check.label} className={styles.inspectorA11yRow}>
          <span className={styles.inspectorA11yLabel}>{check.label}</span>
          <span className={styles.inspectorA11yResult}>
            <span className={styles.inspectorA11yBadge}>AA</span>
            <FaIcon
              name={check.passesAA ? "circle-check" : "circle-xmark"}
              size="xs"
              className={
                check.passesAA ? styles.inspectorA11yPass : styles.inspectorA11yFail
              }
              title={check.passesAA ? "Passes WCAG AA" : "Fails WCAG AA"}
            />
            <span className={styles.inspectorA11yRatio}>
              {formatContrastRatio(check.ratio)}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

const KIND_LABEL: Record<string, string> = {
  swatch: "Swatch",
  text: "Text",
};

function fillLabel(kind: string): string {
  return kind === "text" ? "Text color" : "Fill";
}

function fillGroupLabel(nodes: ScratchFlowNode[], totalSelected: number): string {
  if (totalSelected === 1) return fillLabel(nodes[0].data.kind);
  if (nodes.length > 1) return `${nodes.length} selected with this color`;
  return nodes[0].data.kind === "text" ? "Text color" : "Swatch fill";
}

function borderGroupLabel(nodes: ScratchFlowNode[], totalSwatches: number): string {
  if (totalSwatches === 1) return "Border";
  if (nodes.length > 1) {
    const hasBorder = (nodes[0].data.border ?? "").trim().length > 0;
    return hasBorder
      ? `${nodes.length} selected with this border`
      : `${nodes.length} selected with no border`;
  }
  return "Border";
}

export function ColorScratchToolbar({
  nodes,
  system,
  onUpdateFill,
  onUpdateBorder,
  onDuplicate,
  onBringForward,
  onSendToBack,
  onDelete,
  onClose,
}: {
  nodes: ScratchFlowNode[];
  system: ColorSystem;
  onUpdateFill: (id: string, hex: string) => void;
  onUpdateBorder: (id: string, hex: string) => void;
  onDuplicate: () => void;
  onBringForward: () => void;
  onSendToBack: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const palette = useMemo<PaletteSwatch[]>(
    () =>
      system.families.flatMap((family) =>
        family.steps
          .filter((step) => !isTransparentColor(step.hex))
          .map((step) => ({
            hex: rgbHex(step.hex),
            label: `${family.name}-${step.step}`,
          })),
      ),
    [system],
  );

  const fillGroups = useMemo(() => {
    const groups = new Map<
      string,
      {
        hex: string;
        nodes: ScratchFlowNode[];
      }
    >();

    for (const node of nodes) {
      const hex = rgbHex(node.data.fill);
      const group = groups.get(hex);
      if (group) {
        group.nodes.push(node);
      } else {
        groups.set(hex, { hex, nodes: [node] });
      }
    }

    return Array.from(groups.values());
  }, [nodes]);

  const swatchNodes = useMemo(
    () => nodes.filter((node) => node.data.kind === "swatch"),
    [nodes],
  );

  const borderGroups = useMemo(() => {
    const groups = new Map<
      string,
      {
        border: string;
        nodes: ScratchFlowNode[];
      }
    >();

    for (const node of swatchNodes) {
      const rawBorder = node.data.border ?? "";
      const border = rawBorder.trim().length > 0 ? rgbHex(rawBorder) : "";
      const group = groups.get(border);
      if (group) {
        group.nodes.push(node);
      } else {
        groups.set(border, { border, nodes: [node] });
      }
    }

    return Array.from(groups.values());
  }, [swatchNodes]);

  if (nodes.length === 0) return null;

  const isMulti = nodes.length >= 2;
  const canShowA11y = nodes.length <= 2;
  const label = isMulti
    ? `${nodes.length} selected`
    : KIND_LABEL[nodes[0].data.kind] ?? "Element";

  const a11y = (() => {
    if (isMulti) {
      const [a, b] = nodes;
      const ratio = contrastRatio(a.data.fill, b.data.fill);
      return {
        title: "Contrast",
        content: (
          <ContrastRows
            checks={[
              {
                label: "Between fills",
                ratio,
                passesAA: passesWcagAaNormalText(ratio),
              },
            ]}
          />
        ),
      };
    }
    const node = nodes[0];
    if (node.data.kind === "swatch") {
      return {
        title: "Accessibility",
        content: (
          <>
            <ContrastRows checks={surfaceColorContrastChecks(node.data.fill, system)} />
            <p className={styles.inspectorMeta}>
              Shift-click a second element to compare their contrast.
            </p>
          </>
        ),
      };
    }
    return {
      title: "Accessibility",
      content: (
        <p className={styles.inspectorMeta}>
          Shift-click a second element to compare their contrast.
        </p>
      ),
    };
  })();

  return (
    <div className={styles.inspector}>
      <div className={styles.inspectorHeader}>
        <span className={styles.inspectorHeaderLabel}>{label}</span>
        <AppButton
          className={styles.inspectorCloseButton}
          variant="tertiary"
          tone="gray"
          size="xs"
          iconName="xmark"
          onClick={onClose}
          aria-label="Close panel"
        />
      </div>

      <div className={styles.scratchInspectorBody}>
        <div className={styles.inspectorSection}>
          {fillGroups.map((group, index) => (
            <FillControl
              key={group.hex}
              label={fillGroupLabel(group.nodes, nodes.length)}
              value={group.hex}
              palette={!isMulti && index === 0 ? palette : undefined}
              onChange={(hex) => {
                group.nodes.forEach((node) => onUpdateFill(node.id, hex));
              }}
            />
          ))}
          {borderGroups.map((group, index) => (
            <BorderControl
              key={group.border || "__none__"}
              label={borderGroupLabel(group.nodes, swatchNodes.length)}
              value={group.border}
              palette={
                swatchNodes.length === 1 && nodes.length === 1 && index === 0
                  ? palette
                  : undefined
              }
              onChange={(hex) => {
                group.nodes.forEach((node) => onUpdateBorder(node.id, hex));
              }}
              onClear={() => {
                group.nodes.forEach((node) => onUpdateBorder(node.id, ""));
              }}
            />
          ))}
        </div>

        {canShowA11y ? (
          <div className={styles.inspectorSection}>
            <div className={styles.inspectorA11y}>
              <span className={styles.inspectorRowLabel}>{a11y.title}</span>
              {a11y.content}
            </div>
          </div>
        ) : null}
      </div>

      <div className={`${styles.inspectorSection} ${styles.inspectorSectionActions}`}>
        <div className={styles.inspectorActions}>
          <Tooltip content="Duplicate" position="top">
            <AppButton
              variant="secondary"
              tone="gray"
              size="xs"
              iconName="clone"
              onClick={onDuplicate}
              aria-label="Duplicate"
            />
          </Tooltip>
          <Tooltip content="Bring to front" position="top">
            <AppButton
              variant="secondary"
              tone="gray"
              size="xs"
              iconName="bring-front"
              onClick={onBringForward}
              aria-label="Bring to front"
            />
          </Tooltip>
          <Tooltip content="Send to back" position="top">
            <AppButton
              variant="secondary"
              tone="gray"
              size="xs"
              iconName="send-back"
              onClick={onSendToBack}
              aria-label="Send to back"
            />
          </Tooltip>
          <Tooltip content="Delete" position="top">
            <AppButton
              className={styles.inspectorActionDelete}
              variant="tertiary"
              tone="gray"
              size="xs"
              iconName="trash"
              onClick={onDelete}
              aria-label="Delete"
            />
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
