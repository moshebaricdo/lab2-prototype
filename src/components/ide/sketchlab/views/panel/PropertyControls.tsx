import * as Popover from "@radix-ui/react-popover";
import { useState, type ReactNode } from "react";
import { useTheme } from "../../../../../hooks/useTheme";
import { AppButton } from "../../../../ui/AppButton";
import { FaIcon } from "../../../../ui/icons/FaIcon";
import type { FaIconName } from "../../../../../icons/faProRegularCodepoints";
import { AppSlider } from "../../../../ui/AppSlider";
import { Tooltip } from "../../../../ui/Tooltip";
import dropdownStyles from "../../../../ui/AppDropdown.module.scss";
import type {
  SketchAlign,
  SketchColorValue,
  SketchSizeKey,
} from "../../../../../types/sketchLab";
import { SketchIcon, type SketchIconKey } from "../../sketchLabIcons";
import {
  SKETCH_ALIGN_OPTIONS,
  SKETCH_ROTATION_MAX,
  SKETCH_ROTATION_MIN,
  SKETCH_SIZE_OPTIONS,
  colorLabel,
  customColorHex,
  getPaletteSwatches,
  isCustomColor,
  resolveColor,
  sizeLabel,
  type SketchColorPalette,
} from "../../sketchLabOptions";
import styles from "./PropertyPanel.module.scss";

export function PropertySection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {children}
    </div>
  );
}

export function PropertyRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowControl}>{children}</span>
    </div>
  );
}

interface MenuFieldProps {
  ariaLabel: string;
  leftIcon?: ReactNode;
  value: string;
  menuClassName?: string;
  children: (close: () => void) => ReactNode;
}

/** Dropdown field trigger + popover menu using gray xs dropdown field styles. */
function MenuField({ ariaLabel, leftIcon, value, menuClassName, children }: MenuFieldProps) {
  const [open, setOpen] = useState(false);
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={[
            dropdownStyles.field,
            dropdownStyles.sizeXs,
            dropdownStyles.toneGray,
            open ? dropdownStyles.fieldOpen : "",
            styles.menuField,
          ]
            .filter(Boolean)
            .join(" ")}
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <span className={dropdownStyles.fieldLabel}>
            {leftIcon ? (
              <span className={dropdownStyles.fieldIcon} aria-hidden="true">
                {leftIcon}
              </span>
            ) : null}
            <span className={dropdownStyles.fieldLabelText}>{value}</span>
          </span>
          <FaIcon
            name={open ? "chevron-up" : "chevron-down"}
            size="xs"
            className={dropdownStyles.chevron}
          />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className={dropdownStyles.content}
          align="end"
          side="bottom"
          sideOffset={4}
        >
          <div
            className={[
              dropdownStyles.actionMenu,
              dropdownStyles.menuSizeXs,
              menuClassName,
            ]
              .filter(Boolean)
              .join(" ")}
            role="menu"
          >
            {children(() => setOpen(false))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function isSketchIconKey(icon: SketchIconKey | ReactNode): icon is SketchIconKey {
  return typeof icon === "string";
}

function MenuDivider() {
  return <div className={styles.menuDivider} role="separator" />;
}

function CustomValueRow({
  label = "Custom",
  value,
  placeholder,
  min,
  max,
  onChange,
}: {
  label?: string;
  value: string | number;
  placeholder: string;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className={styles.customInputRow}>
      <span className={styles.customInputLabel}>{label}</span>
      <input
        type="number"
        className={styles.customInput}
        value={value}
        placeholder={placeholder}
        min={min}
        max={max}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (Number.isFinite(next)) onChange(next);
        }}
      />
    </div>
  );
}

function RotationSliderRow({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}) {
  const clamp = (next: number) =>
    Math.max(min, Math.min(max, Math.round(next)));

  return (
    <div className={styles.rotationCustomRow}>
      <AppSlider
        className={styles.rotationSlider}
        value={value}
        min={min}
        max={max}
        step={1}
        size="s"
        showLabel={false}
        showInputValue={false}
        aria-label="Rotation"
        onValueChange={(next) => onChange(clamp(next))}
      />
      <input
        type="number"
        className={styles.rotationValueInput}
        value={value}
        min={min}
        max={max}
        aria-label="Rotation degrees"
        onChange={(event) => {
          const next = Number(event.target.value);
          if (Number.isFinite(next)) onChange(clamp(next));
        }}
      />
    </div>
  );
}

function MenuItem({
  icon,
  label,
  selected,
  onSelect,
}: {
  icon?: SketchIconKey | ReactNode;
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const iconNode =
    icon && isSketchIconKey(icon) ? <SketchIcon icon={icon} size="xs" /> : icon;

  return (
    <button
      type="button"
      role="menuitem"
      className={[
        dropdownStyles.actionItem,
        selected ? dropdownStyles.checkedItem : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-dropdown-focusable="true"
      onClick={onSelect}
    >
      {icon ? (
        <span className={dropdownStyles.itemIcon} aria-hidden="true">
          {iconNode}
        </span>
      ) : null}
      <span className={dropdownStyles.itemLabel}>{label}</span>
      {selected ? (
        <FaIcon name="check" size="xs" className={styles.menuItemCheck} />
      ) : null}
    </button>
  );
}

export function ColorDropdown({
  value,
  palette,
  onChange,
}: {
  value: SketchColorValue;
  palette: SketchColorPalette;
  onChange: (value: SketchColorValue) => void;
}) {
  const { theme } = useTheme();
  const swatches = getPaletteSwatches(palette);
  const swatchValue = resolveColor(value, palette);

  return (
    <MenuField
      ariaLabel="Color"
      value={colorLabel(value, palette, theme)}
      leftIcon={
        <span
          className={styles.swatchDot}
          style={{ background: swatchValue }}
        />
      }
      menuClassName={styles.colorMenu}
    >
      {(close) => (
        <div className={styles.swatchGrid}>
          {swatches.map((swatch) => (
            <button
              key={swatch.key}
              type="button"
              aria-label={swatch.label}
              className={[
                styles.swatchButton,
                value === swatch.key ? styles.swatchButtonSelected : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{ background: `var(${swatch.cssVar})` }}
              onClick={() => {
                onChange(swatch.key);
                close();
              }}
            />
          ))}
          <label
            className={[
              styles.swatchButton,
              styles.swatchCustom,
              isCustomColor(value) ? styles.swatchButtonSelected : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-label="Custom color"
          >
            <SketchIcon icon="prop-color" size="xs" />
            <input
              type="color"
              className={styles.swatchCustomInput}
              value={customColorHex(value)}
              onChange={(event) => onChange(`custom:${event.target.value}`)}
            />
          </label>
        </div>
      )}
    </MenuField>
  );
}

export function SizeDropdown({
  sizeKey,
  customFontSize,
  onChange,
}: {
  sizeKey: SketchSizeKey;
  customFontSize?: number;
  onChange: (sizeKey: SketchSizeKey, customFontSize?: number) => void;
}) {
  return (
    <MenuField
      ariaLabel="Size"
      leftIcon={<SketchIcon icon="prop-size" size="xs" />}
      value={sizeLabel(sizeKey)}
    >
      {(close) => (
        <>
          {SKETCH_SIZE_OPTIONS.filter((option) => option.key !== "custom").map(
            (option) => (
              <MenuItem
                key={option.key}
                label={option.label}
                selected={sizeKey === option.key}
                onSelect={() => {
                  onChange(option.key);
                  close();
                }}
              />
            ),
          )}
          <MenuDivider />
          <CustomValueRow
            value={sizeKey === "custom" ? customFontSize ?? 16 : ""}
            placeholder="px"
            min={8}
            max={96}
            onChange={(next) => {
              if (next > 0) onChange("custom", next);
            }}
          />
        </>
      )}
    </MenuField>
  );
}

const ALIGN_FA_ICON: Record<SketchAlign, FaIconName> = {
  left: "align-left",
  center: "align-center",
  right: "align-right",
};

export function AlignmentDropdown({
  value,
  onChange,
}: {
  value: SketchAlign;
  onChange: (value: SketchAlign) => void;
}) {
  const current = SKETCH_ALIGN_OPTIONS.find((option) => option.key === value);
  return (
    <MenuField
      ariaLabel="Alignment"
      leftIcon={<FaIcon name={ALIGN_FA_ICON[value]} size="xs" />}
      value={current?.label ?? "Center"}
    >
      {(close) =>
        SKETCH_ALIGN_OPTIONS.map((option) => (
          <MenuItem
            key={option.key}
            icon={<FaIcon name={ALIGN_FA_ICON[option.key]} size="xs" />}
            label={option.label}
            selected={value === option.key}
            onSelect={() => {
              onChange(option.key);
              close();
            }}
          />
        ))
      }
    </MenuField>
  );
}

interface IconOption<T extends string> {
  key: T;
  label: string;
  icon: SketchIconKey;
}

export function OptionDropdown<T extends string>({
  ariaLabel,
  categoryIcon,
  options,
  value,
  onChange,
}: {
  ariaLabel: string;
  categoryIcon?: SketchIconKey;
  options: IconOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const current = options.find((option) => option.key === value);
  return (
    <MenuField
      ariaLabel={ariaLabel}
      leftIcon={categoryIcon ? <SketchIcon icon={categoryIcon} size="xs" /> : undefined}
      value={current?.label ?? ""}
    >
      {(close) =>
        options.map((option) => (
          <MenuItem
            key={option.key}
            icon={option.icon}
            label={option.label}
            selected={value === option.key}
            onSelect={() => {
              onChange(option.key);
              close();
            }}
          />
        ))
      }
    </MenuField>
  );
}

export function RotationControl({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const rounded = Math.round(value);

  return (
    <MenuField
      ariaLabel="Rotation"
      leftIcon={<SketchIcon icon="prop-rotation" size="xs" />}
      value={`${rounded}°`}
      menuClassName={styles.rotationMenu}
    >
      {() => (
        <RotationSliderRow
          value={rounded}
          min={SKETCH_ROTATION_MIN}
          max={SKETCH_ROTATION_MAX}
          onChange={onChange}
        />
      )}
    </MenuField>
  );
}

export interface SketchActionHandlers {
  onDuplicate: () => void;
  onBringForward: () => void;
  onToggleLayer: () => void;
  onDelete: () => void;
}

export function ActionsRow({
  onDuplicate,
  onBringForward,
  onToggleLayer,
  onDelete,
}: SketchActionHandlers) {
  return (
    <div className={styles.actions}>
      <Tooltip content="Duplicate" position="top">
        <AppButton
          variant="secondary"
          tone="gray"
          size="xs"
          icon={<SketchIcon icon="action-duplicate" size="xs" />}
          aria-label="Duplicate"
          onClick={onDuplicate}
        />
      </Tooltip>
      <Tooltip content="Send to front" position="top">
        <AppButton
          variant="secondary"
          tone="gray"
          size="xs"
          icon={<SketchIcon icon="action-bring-forward" size="xs" />}
          aria-label="Send to front"
          onClick={onBringForward}
        />
      </Tooltip>
      <Tooltip content="Send to back" position="top">
        <AppButton
          variant="secondary"
          tone="gray"
          size="xs"
          icon={<SketchIcon icon="action-send-back" size="xs" />}
          aria-label="Send to back"
          onClick={onToggleLayer}
        />
      </Tooltip>
      <Tooltip content="Delete" position="top">
        <AppButton
          variant="secondary"
          tone="gray"
          size="xs"
          className={styles.actionDelete}
          icon={<SketchIcon icon="action-delete" size="xs" />}
          aria-label="Delete"
          onClick={onDelete}
        />
      </Tooltip>
    </div>
  );
}
