import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { HexColorPicker } from "react-colorful";
import { Tooltip } from "../../../../ui/Tooltip";
import { FaIcon } from "../../../../ui/icons/FaIcon";
import styles from "./PreviewColorPicker.module.scss";

const COLOR_COMMIT_DELAY_MS = 90;
const POPOVER_GAP = 8;
const POPOVER_EDGE_MARGIN = 8;
const POPOVER_ESTIMATED_WIDTH = 184;
const POPOVER_ESTIMATED_HEIGHT = 216;
const PRESET_SWATCHES = [
  { id: "none", label: "No fill", value: "transparent" },
  // Intentional hex: these values are written into student CSS / HexColorPicker, not app chrome.
  { id: "black", label: "Black", value: "#111111" },
  { id: "white", label: "White", value: "#ffffff" },
  { id: "red", label: "Red", value: "#e5484d" },
  { id: "orange", label: "Orange", value: "#f97316" },
  { id: "yellow", label: "Yellow", value: "#facc15" },
  { id: "green", label: "Green", value: "#22c55e" },
  { id: "teal", label: "Teal", value: "#0093a4" },
  { id: "blue", label: "Blue", value: "#3b82f6" },
  { id: "purple", label: "Purple", value: "#9657c7" },
  { id: "pink", label: "Pink", value: "#ec4899" },
  { id: "gray", label: "Gray", value: "#69788a" },
];

interface PreviewColorPickerProps {
  label: string;
  value: string;
  disabled?: boolean;
  isOpen: boolean;
  isNone?: boolean;
  opacity?: number;
  placement?: "above" | "below";
  positionKey?: string;
  fullWidth?: boolean;
  onChange: (value: string) => void;
  onNone?: () => void;
  onOpenChange: (isOpen: boolean) => void;
}

interface PopoverPosition {
  top: number;
  left: number;
  placement: "above" | "below";
}

export function PreviewColorPicker({
  label,
  value,
  disabled = false,
  isOpen,
  isNone = false,
  opacity = 100,
  placement = "below",
  positionKey,
  fullWidth = false,
  onChange,
  onNone,
  onOpenChange,
}: PreviewColorPickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const pendingValueRef = useRef<string | null>(null);
  const commitTimeoutRef = useRef<number | null>(null);
  const [draftValue, setDraftValue] = useState<string | null>(null);
  const [pickerValue, setPickerValue] = useState(value);
  const [localIsNone, setLocalIsNone] = useState(isNone);
  const [opacityValue, setOpacityValue] = useState(opacity);
  const [opacityDraft, setOpacityDraft] = useState<string | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<PopoverPosition | null>(null);
  const displayValue = draftValue ?? pickerValue;
  const displayOpacity = opacityDraft ?? String(Math.round(opacityValue));

  const cssColorValue = (hexValue: string, nextOpacity = opacityValue) => {
    const clampedOpacity = Math.min(100, Math.max(0, nextOpacity));
    if (clampedOpacity >= 100) return hexValue;
    const red = Number.parseInt(hexValue.slice(1, 3), 16);
    const green = Number.parseInt(hexValue.slice(3, 5), 16);
    const blue = Number.parseInt(hexValue.slice(5, 7), 16);
    return `rgba(${red}, ${green}, ${blue}, ${Number((clampedOpacity / 100).toFixed(2))})`;
  };

  const clearScheduledCommit = () => {
    if (commitTimeoutRef.current == null) return;
    window.clearTimeout(commitTimeoutRef.current);
    commitTimeoutRef.current = null;
  };

  const flushPendingValue = () => {
    const pendingValue = pendingValueRef.current;
    if (!pendingValue) return;
    clearScheduledCommit();
    pendingValueRef.current = null;
    onChange(pendingValue);
  };

  const scheduleChange = (nextValue: string) => {
    setLocalIsNone(false);
    pendingValueRef.current = nextValue;
    clearScheduledCommit();
    commitTimeoutRef.current = window.setTimeout(() => {
      flushPendingValue();
    }, COLOR_COMMIT_DELAY_MS);
  };

  useEffect(() => {
    setDraftValue(null);
    setPickerValue(value);
    setLocalIsNone(isNone);
    setOpacityValue(opacity);
    setOpacityDraft(null);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && pendingValueRef.current) return;
    setPickerValue(value);
    setLocalIsNone(isNone);
    setOpacityValue(opacity);
  }, [isNone, isOpen, opacity, value]);

  useEffect(() => () => clearScheduledCommit(), []);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      flushPendingValue();
      onOpenChange(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen, onOpenChange]);

  useLayoutEffect(() => {
    if (!isOpen) {
      setPopoverPosition(null);
      return undefined;
    }

    const updatePosition = () => {
      const rootRect = rootRef.current?.getBoundingClientRect();
      if (!rootRect) return;

      const popoverRect = popoverRef.current?.getBoundingClientRect();
      const popoverWidth = popoverRect?.width ?? POPOVER_ESTIMATED_WIDTH;
      const popoverHeight = popoverRect?.height ?? POPOVER_ESTIMATED_HEIGHT;
      const spaceAbove = rootRect.top;
      const spaceBelow = window.innerHeight - rootRect.bottom;
      let resolvedPlacement = placement;

      if (placement === "below" && spaceBelow < popoverHeight + POPOVER_GAP && spaceAbove > spaceBelow) {
        resolvedPlacement = "above";
      } else if (placement === "above" && spaceAbove < popoverHeight + POPOVER_GAP && spaceBelow > spaceAbove) {
        resolvedPlacement = "below";
      }

      const unclampedTop = resolvedPlacement === "below"
        ? rootRect.bottom + POPOVER_GAP
        : rootRect.top - popoverHeight - POPOVER_GAP;
      const maxTop = Math.max(POPOVER_EDGE_MARGIN, window.innerHeight - popoverHeight - POPOVER_EDGE_MARGIN);
      const maxLeft = Math.max(POPOVER_EDGE_MARGIN, window.innerWidth - popoverWidth - POPOVER_EDGE_MARGIN);

      setPopoverPosition({
        placement: resolvedPlacement,
        top: Math.min(Math.max(POPOVER_EDGE_MARGIN, unclampedTop), maxTop),
        left: Math.min(Math.max(POPOVER_EDGE_MARGIN, rootRect.left), maxLeft),
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, placement, positionKey]);

  const popoverStyle: CSSProperties | undefined = popoverPosition
    ? {
        top: `${popoverPosition.top}px`,
        left: `${popoverPosition.left}px`,
      }
    : undefined;

  const popover = isOpen ? (
    <div
      ref={popoverRef}
      className={styles.popover}
      style={popoverStyle}
      data-placement={popoverPosition?.placement ?? placement}
      role="dialog"
      aria-label={label}
      onPointerUpCapture={flushPendingValue}
      onPointerCancelCapture={flushPendingValue}
    >
      <HexColorPicker
        color={pickerValue}
        onChange={(nextValue) => {
          setDraftValue(null);
          setPickerValue(nextValue);
          scheduleChange(cssColorValue(nextValue));
        }}
      />
      <div className={styles.swatchGrid} aria-label="Preset colors">
        {PRESET_SWATCHES.map((swatch) => {
          const isNoFill = swatch.id === "none";
          const isSelected = isNoFill
            ? localIsNone
            : !localIsNone && pickerValue.toLowerCase() === swatch.value;

          return (
            <button
              key={swatch.id}
              type="button"
              className={`${styles.presetSwatch} ${isNoFill ? styles.presetSwatchNone : ""} ${
                isSelected ? styles.presetSwatchSelected : ""
              }`}
              style={isNoFill ? undefined : { background: swatch.value }}
              disabled={disabled}
              aria-label={swatch.label}
              aria-pressed={isSelected}
              onClick={() => {
                clearScheduledCommit();
                pendingValueRef.current = null;
                setDraftValue(null);

                if (isNoFill) {
                  setLocalIsNone(true);
                  setOpacityValue(100);
                  setOpacityDraft(null);
                  onNone?.();
                  return;
                }

                setLocalIsNone(false);
                setPickerValue(swatch.value);
                setOpacityValue(100);
                setOpacityDraft(null);
                onChange(swatch.value);
              }}
            />
          );
        })}
      </div>
      <div className={styles.valueRow}>
        <label className={styles.hexField}>
          <span className={styles.label}>Hex</span>
          <input
            type="text"
            value={displayValue}
            disabled={disabled}
            onChange={(event) => {
              const nextValue = event.target.value;
              if (!/^#[0-9a-f]{0,6}$/i.test(nextValue)) return;
              setDraftValue(nextValue);
              if (/^#[0-9a-f]{6}$/i.test(nextValue)) {
                setPickerValue(nextValue);
                scheduleChange(cssColorValue(nextValue));
              }
            }}
            onBlur={(event) => {
              if (/^#[0-9a-f]{6}$/i.test(event.target.value)) {
                flushPendingValue();
                return;
              }
              setDraftValue(null);
            }}
          />
        </label>
        <label className={styles.optionField}>
          <span className={styles.label}>Opacity</span>
          <span className={styles.opacityInput}>
            <FaIcon name="circle-half" size="xs" />
            <input
              type="number"
              min={0}
              max={100}
              value={displayOpacity}
              disabled={disabled}
              onChange={(event) => {
                const rawValue = event.target.value;
                setOpacityDraft(rawValue);
                if (rawValue === "" || rawValue === "-") return;
                const nextOpacity = Math.min(100, Math.max(0, Number.parseInt(rawValue, 10)));
                if (!Number.isFinite(nextOpacity)) return;
                setOpacityValue(nextOpacity);
                scheduleChange(cssColorValue(pickerValue, nextOpacity));
              }}
              onBlur={() => {
                if (opacityDraft === "") {
                  setOpacityValue(0);
                  scheduleChange(cssColorValue(pickerValue, 0));
                }
                setOpacityDraft(null);
                flushPendingValue();
              }}
            />
          </span>
        </label>
      </div>
    </div>
  ) : null;

  return (
    <Tooltip content={label} position="bottom" disableHoverableContent>
      <div
        ref={rootRef}
        className={`${styles.root} ${fullWidth ? styles.rootFullWidth : ""}`}
      >
        <button
          type="button"
          className={`${styles.swatch} ${localIsNone ? styles.swatchNone : ""}`}
          style={{ background: value }}
          aria-label={label}
          aria-expanded={isOpen}
          disabled={disabled}
          onClick={() => {
            if (isOpen) {
              flushPendingValue();
            }
            onOpenChange(!isOpen);
          }}
        />
        {popover ? createPortal(popover, document.body) : null}
      </div>
    </Tooltip>
  );
}
