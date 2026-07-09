import { useMemo, useState, type CSSProperties } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { AppButton } from "../../components/ui/AppButton";
import { Tooltip } from "../../components/ui/Tooltip";
import { FaIcon } from "../../components/ui/icons/FaIcon";
import type { FaIconName } from "../../icons/faProRegularCodepoints";
import type {
  ScratchFlowNode,
  ScratchTextAlign,
  ScratchTextSizing,
} from "../../lib/colorSandbox/scratchLayer";
import {
  contrastRatio,
  familiesByCollection,
  formatContrastRatio,
  isTransparentColor,
  passesWcagAaNormalText,
  rgbHex,
  semanticFamilyLabel,
  semanticHex,
  surfaceColorContrastChecks,
  sortPrimitiveSteps,
  stepIndex,
  type ColorSystem,
  type ContrastCheck,
  type PrimitiveStep,
  type ThemeKey,
} from "./colorSystemData";
import styles from "./ColorSandboxPage.module.scss";

type ScratchPickerTab = "primitive" | "semantic";

interface ScratchPickerPrimitiveGroup {
  id: string;
  label: string;
  steps: Array<PrimitiveStep & { familyName: string }>;
}

interface ScratchPickerSemanticOption {
  id: string;
  label: string;
  hex: string;
}

function ScratchPickerSwatch({ hex }: { hex: string }) {
  return (
    <span
      className={styles.scratchColorPickerSwatch}
      style={{ background: rgbHex(hex) }}
      aria-hidden="true"
    />
  );
}

function ScratchColorPicker({
  value,
  system,
  theme,
  steps,
  placeholder,
  ariaLabel,
  onChange,
}: {
  value: string;
  system: ColorSystem;
  theme: ThemeKey;
  steps: ReturnType<typeof stepIndex>;
  placeholder: string;
  ariaLabel: string;
  onChange: (hex: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<ScratchPickerTab>("primitive");
  const opaque = value.trim().length > 0 ? rgbHex(value) : "";

  const primitiveGroups = useMemo<ScratchPickerPrimitiveGroup[]>(
    () =>
      system.collections.flatMap((collection) =>
        familiesByCollection(system, collection.id)
          .map((family) => ({
            id: family.id,
            label: `${collection.name} / ${family.name}`,
            steps: sortPrimitiveSteps(family.steps)
              .filter((step) => !isTransparentColor(step.hex))
              .map((step) => ({ ...step, familyName: family.name })),
          }))
          .filter((group) => group.steps.length > 0),
      ),
    [system],
  );

  const semanticOptions = useMemo<ScratchPickerSemanticOption[]>(
    () =>
      [...system.semantics]
        .map((token) => {
          const hex = semanticHex(system, token, theme, steps);
          return {
            id: token.id,
            hex,
            label: `${token.surface} / ${semanticFamilyLabel(system, token.familyKey)} / ${token.role}`,
          };
        })
        .filter((option) => !isTransparentColor(option.hex))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [system, steps, theme],
  );

  const selectedLabel = useMemo(() => {
    if (!opaque) return placeholder;
    for (const group of primitiveGroups) {
      const match = group.steps.find((step) => rgbHex(step.hex) === opaque);
      if (match) return `${match.familyName}-${match.step}`;
    }
    const semanticMatch = semanticOptions.find((option) => rgbHex(option.hex) === opaque);
    return semanticMatch?.label ?? opaque;
  }, [opaque, placeholder, primitiveGroups, semanticOptions]);

  const commit = (hex: string) => {
    onChange(rgbHex(hex));
    setOpen(false);
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          className={styles.primitiveSwatchPickerTrigger}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={ariaLabel}
        >
          {opaque ? (
            <span
              className={styles.primitiveSwatchPickerTriggerSwatch}
              style={{ background: opaque }}
              aria-hidden="true"
            />
          ) : (
            <span className={styles.primitiveSwatchPickerTriggerSwatchEmpty} aria-hidden="true" />
          )}
          <span
            className={`${styles.primitiveSwatchPickerTriggerLabel} ${
              opaque ? "" : styles.primitiveSwatchPickerTriggerPlaceholder
            }`}
          >
            {selectedLabel}
          </span>
          <FaIcon
            name={open ? "chevron-up" : "chevron-down"}
            size="xs"
            className={styles.primitiveSwatchPickerTriggerChevron}
          />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className={styles.primitiveSwatchPickerPopover}
          align="start"
          side="bottom"
          sideOffset={4}
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <div className={styles.scratchColorPickerTabs} role="tablist" aria-label="Color source">
            <button
              type="button"
              className={`${styles.scratchColorPickerTab} ${
                tab === "primitive" ? styles.scratchColorPickerTabActive : ""
              }`}
              role="tab"
              aria-selected={tab === "primitive"}
              onClick={() => setTab("primitive")}
            >
              Primitive
            </button>
            <button
              type="button"
              className={`${styles.scratchColorPickerTab} ${
                tab === "semantic" ? styles.scratchColorPickerTabActive : ""
              }`}
              role="tab"
              aria-selected={tab === "semantic"}
              onClick={() => setTab("semantic")}
            >
              Semantic
            </button>
          </div>

          {tab === "primitive" ? (
            <div className={styles.primitiveSwatchPickerScroll}>
              {primitiveGroups.map((group, groupIndex) => (
                <div key={group.id} className={styles.primitiveSwatchPickerFamily}>
                  {groupIndex > 0 ? (
                    <div className={styles.primitiveSwatchPickerDivider} role="presentation" />
                  ) : null}
                  <div
                    className={styles.primitiveSwatchPickerRow}
                    style={
                      {
                        "--swatch-count": group.steps.length,
                      } as CSSProperties
                    }
                  >
                    {group.steps.map((step) => {
                      const hex = rgbHex(step.hex);
                      const isSelected = opaque === hex;
                      return (
                        <button
                          key={step.id}
                          type="button"
                          className={`${styles.primitiveSwatchPickerStep} ${
                            isSelected ? styles.primitiveSwatchPickerStepSelected : ""
                          }`}
                          onClick={() => commit(hex)}
                          title={`${group.label} / ${step.step} · ${hex}`}
                          aria-label={`Use ${group.label} ${step.step}`}
                          aria-pressed={isSelected}
                        >
                          <ScratchPickerSwatch hex={hex} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.scratchColorPickerSemanticList}>
              {semanticOptions.map((option) => {
                const hex = rgbHex(option.hex);
                const isSelected = opaque === hex;
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`${styles.scratchColorPickerSemanticOption} ${
                      isSelected ? styles.scratchColorPickerSemanticOptionSelected : ""
                    }`}
                    onClick={() => commit(hex)}
                    aria-label={`Use ${option.label}`}
                    aria-pressed={isSelected}
                  >
                    <ScratchPickerSwatch hex={hex} />
                    <span className={styles.scratchColorPickerSemanticLabel}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

function FillControl({
  label,
  value,
  system,
  theme,
  steps,
  onChange,
}: {
  label: string;
  value: string;
  system: ColorSystem;
  theme: ThemeKey;
  steps: ReturnType<typeof stepIndex>;
  onChange: (hex: string) => void;
}) {
  return (
    <div className={styles.inspectorFieldStack}>
      <span className={styles.inspectorRowLabel}>{label}</span>
      <ScratchColorPicker
        value={value}
        system={system}
        theme={theme}
        steps={steps}
        placeholder="Choose color"
        ariaLabel={label}
        onChange={onChange}
      />
    </div>
  );
}

function BorderControl({
  label,
  value,
  system,
  theme,
  steps,
  onChange,
  onClear,
}: {
  label: string;
  value: string;
  system: ColorSystem;
  theme: ThemeKey;
  steps: ReturnType<typeof stepIndex>;
  onChange: (hex: string) => void;
  onClear: () => void;
}) {
  const hasBorder = value.trim().length > 0;

  return (
    <div className={styles.inspectorFieldStack}>
      <span className={styles.inspectorRowLabel}>{label}</span>
      <div className={styles.scratchColorFieldRow}>
        <ScratchColorPicker
          value={hasBorder ? value : ""}
          system={system}
          theme={theme}
          steps={steps}
          placeholder="None"
          ariaLabel={label}
          onChange={onChange}
        />
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

const TEXT_ALIGN_OPTIONS: Array<{
  value: ScratchTextAlign;
  icon: FaIconName;
  label: string;
}> = [
  { value: "left", icon: "align-left", label: "Align left" },
  { value: "center", icon: "align-center", label: "Align center" },
  { value: "right", icon: "align-right", label: "Align right" },
];

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
  theme,
  steps,
  onUpdateFill,
  onUpdateBorder,
  onUpdateTextSizing,
  onUpdateTextAlign,
  onDuplicate,
  onBringForward,
  onSendToBack,
  onDelete,
  onClose,
}: {
  nodes: ScratchFlowNode[];
  system: ColorSystem;
  theme: ThemeKey;
  steps: ReturnType<typeof stepIndex>;
  onUpdateFill: (id: string, hex: string) => void;
  onUpdateBorder: (id: string, hex: string) => void;
  onUpdateTextSizing: (id: string, textSizing: ScratchTextSizing) => void;
  onUpdateTextAlign: (id: string, textAlign: ScratchTextAlign) => void;
  onDuplicate: () => void;
  onBringForward: () => void;
  onSendToBack: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
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
  const textNodes = useMemo(
    () => nodes.filter((node) => node.data.kind === "text"),
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
  const textSizingValues = new Set(
    textNodes.map((node) => node.data.textSizing ?? "hug"),
  );
  const textAlignValues = new Set(
    textNodes.map((node) => node.data.textAlign ?? "left"),
  );
  const textSizing =
    textSizingValues.size === 1
      ? (Array.from(textSizingValues)[0] as ScratchTextSizing)
      : null;
  const textAlign =
    textAlignValues.size === 1
      ? (Array.from(textAlignValues)[0] as ScratchTextAlign)
      : null;

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
        {fillGroups.map((group) => (
          <div className={styles.inspectorSection} key={`fill-${group.hex}`}>
            <FillControl
              label={fillGroupLabel(group.nodes, nodes.length)}
              value={group.hex}
              system={system}
              theme={theme}
              steps={steps}
              onChange={(hex) => {
                group.nodes.forEach((node) => onUpdateFill(node.id, hex));
              }}
            />
          </div>
        ))}
        {borderGroups.map((group) => (
          <div className={styles.inspectorSection} key={`border-${group.border || "__none__"}`}>
            <BorderControl
              label={borderGroupLabel(group.nodes, swatchNodes.length)}
              value={group.border}
              system={system}
              theme={theme}
              steps={steps}
              onChange={(hex) => {
                group.nodes.forEach((node) => onUpdateBorder(node.id, hex));
              }}
              onClear={() => {
                group.nodes.forEach((node) => onUpdateBorder(node.id, ""));
              }}
            />
          </div>
        ))}

        {textNodes.length > 0 ? (
          <div className={styles.inspectorSection}>
            <div className={styles.inspectorFieldStack}>
              <span className={styles.inspectorRowLabel}>
                {textNodes.length === nodes.length ? "Text box" : "Text boxes"}
              </span>
              <div className={styles.scratchTextControls}>
                <Tooltip
                  content={
                    textSizing === "fixed"
                      ? "Switch to hug text"
                      : "Switch to fixed size"
                  }
                  position="top"
                >
                  <AppButton
                    variant="secondary"
                    tone="gray"
                    size="xs"
                    iconName={textSizing === "fixed" ? "text-width" : "arrows-left-right"}
                    className={
                      textSizing === "fixed" ? styles.scratchTextControlActive : undefined
                    }
                    aria-label={
                      textSizing === "fixed"
                        ? "Switch text box to hug text"
                        : "Switch text box to fixed size"
                    }
                    aria-pressed={textSizing === "fixed"}
                    onClick={() => {
                      const nextSizing: ScratchTextSizing =
                        textSizing === "fixed" ? "hug" : "fixed";
                      textNodes.forEach((node) => onUpdateTextSizing(node.id, nextSizing));
                    }}
                  />
                </Tooltip>

                <div className={styles.scratchTextControlDivider} role="separator" />

                {TEXT_ALIGN_OPTIONS.map((option) => (
                  <Tooltip key={option.value} content={option.label} position="top">
                    <AppButton
                      variant="secondary"
                      tone="gray"
                      size="xs"
                      iconName={option.icon}
                      className={
                        textAlign === option.value
                          ? styles.scratchTextControlActive
                          : undefined
                      }
                      aria-label={option.label}
                      aria-pressed={textAlign === option.value}
                      onClick={() => {
                        textNodes.forEach((node) =>
                          onUpdateTextAlign(node.id, option.value),
                        );
                      }}
                    />
                  </Tooltip>
                ))}
              </div>
            </div>
          </div>
        ) : null}

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
