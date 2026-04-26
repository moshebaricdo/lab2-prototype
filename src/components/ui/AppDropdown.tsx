import * as PopoverPrimitive from "@radix-ui/react-popover";
import {
  type ButtonHTMLAttributes,
  type CSSProperties,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  useMemo,
  useState,
} from "react";
import { AppButton, type ButtonSize } from "./AppButton";
import { AppCheckbox } from "./AppCheckbox";
import { FaIcon, type FaIconSize } from "./icons/FaIcon";
import type { FaIconName } from "../../icons/faProRegularCodepoints";
import { useKeyboardFocusWithin } from "../../hooks/useKeyboardFocusWithin";
import styles from "./AppDropdown.module.scss";

type DropdownSize = ButtonSize;
type DropdownTone = "black" | "gray";
type DropdownAlign = "start" | "center" | "end";
type DropdownSide = "top" | "right" | "bottom" | "left";

interface DropdownIconProps {
  icon?: ReactNode;
  iconName?: FaIconName;
}

export interface AppDropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface AppActionDropdownItem extends DropdownIconProps {
  id: string;
  label: string;
  disabled?: boolean;
  destructive?: boolean;
  onSelect?: () => void;
}

interface DropdownPopoverProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: DropdownAlign;
  side?: DropdownSide;
  sideOffset?: number;
  menuWidth?: number | string;
}

interface AppNativeSelectProps
  extends DropdownIconProps,
    Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "size"> {
  options: AppDropdownOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  size?: DropdownSize;
  tone?: DropdownTone;
  fullWidth?: boolean;
}

interface AppMultiSelectDropdownProps
  extends DropdownIconProps,
    DropdownPopoverProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "size"> {
  options: AppDropdownOption[];
  selectedValues: string[];
  onSelectedValuesChange: (values: string[]) => void;
  label?: ReactNode;
  placeholder?: string;
  size?: DropdownSize;
  tone?: DropdownTone;
  fullWidth?: boolean;
  selectAllLabel?: string;
  clearAllLabel?: string;
  disabled?: boolean;
}

interface AppActionDropdownProps extends DropdownPopoverProps {
  trigger: ReactElement;
  items: AppActionDropdownItem[];
  size?: DropdownSize;
  className?: string;
  contentClassName?: string;
  listLabel?: string;
}

const FIELD_ICON_SIZE: Record<DropdownSize, FaIconSize> = {
  l: "l",
  m: "m",
  s: "s",
  xs: "xs",
};

const SIZE_CLASS: Record<DropdownSize, string> = {
  l: styles.sizeL,
  m: styles.sizeM,
  s: styles.sizeS,
  xs: styles.sizeXs,
};

const MENU_SIZE_CLASS: Record<DropdownSize, string> = {
  l: styles.menuSizeL,
  m: styles.menuSizeM,
  s: styles.menuSizeS,
  xs: styles.menuSizeXs,
};

const TONE_CLASS: Record<DropdownTone, string> = {
  black: styles.toneBlack,
  gray: styles.toneGray,
};

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function resolveIcon(
  { icon, iconName }: DropdownIconProps,
  size: DropdownSize,
) {
  return (
    icon ??
    (iconName ? <FaIcon name={iconName} size={FIELD_ICON_SIZE[size]} /> : null)
  );
}

function useControllableOpen({
  open,
  defaultOpen = false,
  onOpenChange,
}: Pick<DropdownPopoverProps, "open" | "defaultOpen" | "onOpenChange">) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const currentOpen = isControlled ? open : uncontrolledOpen;

  const setOpen = (nextOpen: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  return [currentOpen, setOpen] as const;
}

function getMenuStyle(menuWidth?: number | string): CSSProperties | undefined {
  if (menuWidth === undefined) return undefined;

  return {
    "--app-dropdown-menu-width":
      typeof menuWidth === "number" ? `${menuWidth}px` : menuWidth,
  } as CSSProperties;
}

function handleMenuKeyDown(event: KeyboardEvent<HTMLElement>) {
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;

  const focusableItems = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>(
      "[data-dropdown-focusable='true']:not([disabled])",
    ),
  );
  if (!focusableItems.length) return;

  event.preventDefault();

  const currentIndex = focusableItems.indexOf(
    document.activeElement as HTMLElement,
  );
  const lastIndex = focusableItems.length - 1;
  const nextIndex =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? lastIndex
        : event.key === "ArrowDown"
          ? currentIndex < lastIndex
            ? currentIndex + 1
            : 0
          : currentIndex > 0
            ? currentIndex - 1
            : lastIndex;

  focusableItems[nextIndex]?.focus();
}

function FieldLabel({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <span className={styles.fieldLabel}>
      {icon ? (
        <span className={styles.fieldIcon} aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className={styles.fieldLabelText}>{children}</span>
    </span>
  );
}

export function AppNativeSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  size = "m",
  tone = "gray",
  fullWidth = false,
  disabled,
  className = "",
  icon,
  iconName,
  onFocus,
  onBlur,
  ...props
}: AppNativeSelectProps) {
  const [focused, setFocused] = useState(false);
  const { isKeyboardFocusWithin, focusWithinProps } =
    useKeyboardFocusWithin<HTMLSpanElement>();
  const selectedOption = options.find((option) => option.value === value);
  const fieldIcon = resolveIcon({ icon, iconName }, size);

  return (
    <span
      {...focusWithinProps}
      className={classNames(
        styles.field,
        SIZE_CLASS[size],
        TONE_CLASS[tone],
        fullWidth && styles.fullWidth,
        focused && styles.fieldOpen,
        isKeyboardFocusWithin && styles.keyboardFocused,
        disabled && styles.disabled,
        className,
      )}
    >
      <FieldLabel icon={fieldIcon}>
        {selectedOption?.label ?? placeholder}
      </FieldLabel>
      <select
        {...props}
        className={styles.nativeSelect}
        value={value}
        disabled={disabled}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        onChange={(event) => {
          onValueChange(event.target.value);
          setFocused(false);
        }}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      <FaIcon
        name={focused ? "chevron-up" : "chevron-down"}
        size={FIELD_ICON_SIZE[size]}
        className={styles.chevron}
      />
    </span>
  );
}

export function AppMultiSelectDropdown({
  options,
  selectedValues,
  onSelectedValuesChange,
  label,
  placeholder = "Select...",
  size = "m",
  tone = "gray",
  fullWidth = false,
  selectAllLabel = "Select all",
  clearAllLabel = "Clear all",
  disabled,
  className = "",
  icon,
  iconName,
  open,
  defaultOpen,
  onOpenChange,
  align = "start",
  side = "bottom",
  sideOffset = 4,
  menuWidth,
  ...buttonProps
}: AppMultiSelectDropdownProps) {
  const [currentOpen, setOpen] = useControllableOpen({
    open,
    defaultOpen,
    onOpenChange,
  });
  const selectedSet = useMemo(
    () => new Set(selectedValues),
    [selectedValues],
  );
  const enabledValues = options
    .filter((option) => !option.disabled)
    .map((option) => option.value);
  const checkedCount = enabledValues.filter((value) =>
    selectedSet.has(value),
  ).length;
  const allChecked =
    enabledValues.length > 0 && checkedCount === enabledValues.length;
  const noneChecked = checkedCount === 0;
  const fieldIcon = resolveIcon({ icon, iconName }, size);

  const displayLabel =
    label ??
    (checkedCount === 0
      ? placeholder
      : checkedCount === 1
        ? options.find((option) => selectedSet.has(option.value))?.label
        : `${checkedCount} selected`);

  const setSelection = (nextValues: string[]) => {
    onSelectedValuesChange(Array.from(new Set(nextValues)));
  };

  const toggleValue = (value: string) => {
    if (selectedSet.has(value)) {
      setSelection(selectedValues.filter((selected) => selected !== value));
      return;
    }

    setSelection([...selectedValues, value]);
  };

  const selectAll = () => {
    setSelection([...selectedValues, ...enabledValues]);
  };

  const clearAll = () => {
    const enabledSet = new Set(enabledValues);
    setSelection(selectedValues.filter((value) => !enabledSet.has(value)));
  };

  return (
    <PopoverPrimitive.Root open={currentOpen} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          {...buttonProps}
          type="button"
          className={classNames(
            styles.field,
            SIZE_CLASS[size],
            TONE_CLASS[tone],
            fullWidth && styles.fullWidth,
            currentOpen && styles.fieldOpen,
            disabled && styles.disabled,
            className,
          )}
          disabled={disabled}
          aria-haspopup="menu"
          aria-expanded={currentOpen}
        >
          <FieldLabel icon={fieldIcon}>{displayLabel}</FieldLabel>
          <FaIcon
            name={currentOpen ? "chevron-up" : "chevron-down"}
            size={FIELD_ICON_SIZE[size]}
            className={styles.chevron}
          />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className={styles.content}
          align={align}
          side={side}
          sideOffset={sideOffset}
          style={getMenuStyle(menuWidth)}
          onKeyDown={handleMenuKeyDown}
        >
          <div className={classNames(styles.multiMenu, MENU_SIZE_CLASS[size])} role="menu">
            <div className={styles.scrollList}>
              {options.map((option) => {
                const checked = selectedSet.has(option.value);

                return (
                  <label
                    key={option.value}
                    className={classNames(
                      styles.checkboxItem,
                      checked && styles.checkedItem,
                      option.disabled && styles.itemDisabled,
                    )}
                    data-checked={checked ? "true" : "false"}
                  >
                    <AppCheckbox
                      checkboxSize={size}
                      checked={checked}
                      disabled={option.disabled}
                      data-dropdown-focusable="true"
                      onChange={() => toggleValue(option.value)}
                    />
                    <span className={styles.itemLabel}>{option.label}</span>
                  </label>
                );
              })}
            </div>
            <div className={styles.footerActions}>
              <AppButton
                variant="tertiary"
                tone="black"
                size={size}
                disabled={allChecked || enabledValues.length === 0}
                onClick={selectAll}
              >
                {selectAllLabel}
              </AppButton>
              <AppButton
                variant="tertiary"
                tone="black"
                size={size}
                disabled={noneChecked}
                onClick={clearAll}
              >
                {clearAllLabel}
              </AppButton>
            </div>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export function AppActionDropdown({
  trigger,
  items,
  size = "m",
  className = "",
  contentClassName = "",
  listLabel = "Actions",
  open,
  defaultOpen,
  onOpenChange,
  align = "end",
  side = "bottom",
  sideOffset = 4,
  menuWidth,
}: AppActionDropdownProps) {
  const [currentOpen, setOpen] = useControllableOpen({
    open,
    defaultOpen,
    onOpenChange,
  });

  return (
    <PopoverPrimitive.Root open={currentOpen} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className={classNames(styles.content, contentClassName)}
          align={align}
          side={side}
          sideOffset={sideOffset}
          style={getMenuStyle(menuWidth)}
          onKeyDown={handleMenuKeyDown}
        >
          <div
            className={classNames(styles.actionMenu, MENU_SIZE_CLASS[size], className)}
            role="menu"
            aria-label={listLabel}
          >
            {items.map((item) => {
              const itemIcon = resolveIcon(item, size);

              return (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  className={classNames(
                    styles.actionItem,
                    item.destructive && styles.destructiveItem,
                  )}
                  disabled={item.disabled}
                  data-dropdown-focusable="true"
                  onClick={() => {
                    item.onSelect?.();
                    setOpen(false);
                  }}
                >
                  {itemIcon ? (
                    <span className={styles.itemIcon} aria-hidden="true">
                      {itemIcon}
                    </span>
                  ) : null}
                  <span className={styles.itemLabel}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export type { DropdownSize, DropdownTone };
