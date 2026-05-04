import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { AppButton } from "../../../../ui/AppButton";
import { AppActionDropdown } from "../../../../ui/AppDropdown";
import { Tooltip } from "../../../../ui/Tooltip";
import type { FaIconName } from "../../../../ui/AppButton";
import { FaIcon } from "../../../../ui/icons/FaIcon";
import { PreviewColorPicker } from "./PreviewColorPicker";
import type {
  PreviewDesignElementDescriptor,
  PreviewDesignStylePatch,
  PreviewDesignStyleProperty,
} from "./types";
import styles from "./DesignInspectorPanel.module.scss";

const POPOVER_GAP = 8;
const POPOVER_EDGE_MARGIN = 8;
const POPOVER_ESTIMATED_WIDTH = 248;
const POPOVER_ESTIMATED_HEIGHT = 220;

interface DesignInspectorPanelProps {
  isActive: boolean;
  selectedElement: PreviewDesignElementDescriptor | null;
  style?: CSSProperties;
  popupPlacement?: "above" | "below";
  canEdit: boolean;
  disabledReason?: string;
  onApplyStyle: (styles: PreviewDesignStylePatch) => void;
  onResetStyles: () => void;
  onMorphStateChange?: (isMorphed: boolean) => void;
  onHeightChange?: (height: number) => void;
  onAddToTutor: (element: PreviewDesignElementDescriptor) => void;
  onClearSelection: () => void;
}

interface DesignDropdownOption {
  value: string;
  label: string;
  iconName: FaIconName;
}

const FLEX_DIRECTION_OPTIONS: DesignDropdownOption[] = [
  { value: "row", label: "Row", iconName: "square-arrow-right" },
  { value: "row-reverse", label: "Row reverse", iconName: "square-arrow-left" },
  { value: "column", label: "Column", iconName: "square-arrow-down" },
  { value: "column-reverse", label: "Column reverse", iconName: "square-arrow-up" },
];
const FLEX_WRAP_OPTIONS: DesignDropdownOption[] = [
  { value: "nowrap", label: "No wrap", iconName: "arrows-left-right" },
  { value: "wrap", label: "Wrap", iconName: "arrow-turn-down" },
  { value: "wrap-reverse", label: "Wrap reverse", iconName: "arrows-repeat" },
];
const JUSTIFY_CONTENT_OPTIONS: DesignDropdownOption[] = [
  { value: "flex-start", label: "Start", iconName: "objects-align-left" },
  { value: "center", label: "Center", iconName: "objects-align-center-horizontal" },
  { value: "flex-end", label: "End", iconName: "objects-align-right" },
  { value: "space-between", label: "Between", iconName: "distribute-spacing-horizontal" },
  { value: "space-around", label: "Around", iconName: "arrows-left-right" },
  { value: "space-evenly", label: "Evenly", iconName: "left-right" },
];
const ALIGN_ITEMS_OPTIONS: DesignDropdownOption[] = [
  { value: "stretch", label: "Stretch", iconName: "arrows-up-down" },
  { value: "flex-start", label: "Start", iconName: "objects-align-top" },
  { value: "center", label: "Center", iconName: "objects-align-center-vertical" },
  { value: "flex-end", label: "End", iconName: "objects-align-bottom" },
  { value: "baseline", label: "Baseline", iconName: "grip-lines" },
];
const DISPLAY_OPTIONS: DesignDropdownOption[] = [
  { value: "block", label: "Block", iconName: "square" },
  { value: "flex", label: "Flex", iconName: "objects-column" },
  { value: "grid", label: "Grid", iconName: "grid" },
];
const TEXT_ALIGN_OPTIONS: DesignDropdownOption[] = [
  { value: "left", label: "Left", iconName: "align-left" },
  { value: "center", label: "Center", iconName: "align-center" },
  { value: "right", label: "Right", iconName: "align-right" },
  { value: "justify", label: "Justify", iconName: "align-justify" },
];
const TEXT_TAGS = new Set([
  "a",
  "b",
  "button",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "i",
  "label",
  "li",
  "p",
  "small",
  "span",
  "strong",
]);

type PopupKind =
  | "spacing"
  | "box"
  | "border"
  | "display"
  | null;

type BorderWidthProperty =
  | "borderTopWidth"
  | "borderRightWidth"
  | "borderBottomWidth"
  | "borderLeftWidth";

type PaddingProperty =
  | "paddingTop"
  | "paddingRight"
  | "paddingBottom"
  | "paddingLeft";

type BorderWidthStylePatch = Pick<PreviewDesignStylePatch, BorderWidthProperty>;
type PaddingStylePatch = Pick<PreviewDesignStylePatch, PaddingProperty>;

const BORDER_WIDTH_PROPERTIES: BorderWidthProperty[] = [
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
];

const PADDING_PROPERTIES: PaddingProperty[] = [
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
];

type DragOffset = {
  x: number;
  y: number;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
};

type PopupAnchorRect = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

type PopupPosition = {
  top: number;
  left: number;
};

function elementLabel(element: PreviewDesignElementDescriptor) {
  const base = element.id ? `${element.tagName}#${element.id}` : element.tagName;
  const classSuffix = element.classList.length > 0
    ? `.${element.classList.slice(0, 2).join(".")}`
    : "";
  return `${base}${element.id ? "" : classSuffix}`;
}

function cssColorToHex(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  if (/^#[0-9a-f]{6}$/i.test(value)) return value;
  const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/i);
  if (!match) return fallback;
  if (match[4] != null && Number.parseFloat(match[4]) === 0) return fallback;
  return `#${[match[1], match[2], match[3]]
    .map((part) => Number(part).toString(16).padStart(2, "0"))
    .join("")}`;
}

function isUnsetColor(value: string | undefined) {
  if (!value || value === "transparent") return true;
  return /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0\s*\)/i.test(value);
}

function cssColorOpacity(value: string | undefined) {
  if (!value || value === "transparent") return 100;
  const match = value.match(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*([\d.]+))?/i);
  if (!match?.[1]) return 100;
  const parsedAlpha = Number.parseFloat(match[1]);
  return Number.isFinite(parsedAlpha)
    ? Math.round(Math.min(1, Math.max(0, parsedAlpha)) * 100)
    : 100;
}

function fontSizeNumber(value: string | undefined) {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? String(Math.round(parsed)) : "";
}

function isBold(value: string | undefined) {
  if (!value) return false;
  if (value === "bold") return true;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 600;
}

function normalizedPixelValue(value: string | undefined) {
  return fontSizeNumber(value) || "0";
}

function gridTrackCount(value: string | undefined) {
  const normalizedValue = value?.trim();
  if (!normalizedValue || normalizedValue === "none" || normalizedValue === "auto") return "";
  const repeatMatch = normalizedValue.match(/^repeat\(\s*(\d+)/i);
  if (repeatMatch) return repeatMatch[1];
  return String(normalizedValue.split(/\s+/).filter(Boolean).length);
}

function hasCustomBorderWidths(styles: PreviewDesignElementDescriptor["computedStyles"] | undefined) {
  if (!styles) return false;
  const widths = BORDER_WIDTH_PROPERTIES.map((property) =>
    normalizedPixelValue(styles[property] ?? styles.borderWidth),
  );
  return new Set(widths).size > 1;
}

function hasCustomPadding(styles: PreviewDesignElementDescriptor["computedStyles"] | undefined) {
  if (!styles) return false;
  const values = PADDING_PROPERTIES.map((property) =>
    normalizedPixelValue(styles[property] ?? styles.padding),
  );
  return new Set(values).size > 1;
}

interface ToolbarIconButtonProps {
  iconName: FaIconName;
  label: string;
  className?: string;
  disabled?: boolean;
  pressed?: boolean;
  variant?: "secondary" | "tertiary";
  onClick: (event: ReactMouseEvent<HTMLButtonElement>) => void;
}

function ToolbarIconButton({
  iconName,
  label,
  className = "",
  disabled = false,
  pressed,
  variant = "secondary",
  onClick,
}: ToolbarIconButtonProps) {
  return (
    <Tooltip content={label} position="bottom" disableHoverableContent>
      <AppButton
        variant={variant}
        tone="gray"
        size="xs"
        iconName={iconName}
        disabled={disabled}
        aria-label={label}
        aria-pressed={pressed}
        onClick={onClick}
        className={[pressed ? styles.toolbarButtonActive : "", className].filter(Boolean).join(" ")}
      />
    </Tooltip>
  );
}

export function DesignInspectorPanel({
  isActive,
  selectedElement,
  style,
  popupPlacement = "below",
  canEdit,
  disabledReason,
  onApplyStyle,
  onResetStyles,
  onMorphStateChange,
  onHeightChange,
  onAddToTutor,
  onClearSelection,
}: DesignInspectorPanelProps) {
  const [activePopup, setActivePopup] = useState<PopupKind>(null);
  const [activeColorPicker, setActiveColorPicker] =
    useState<"color" | "backgroundColor" | "borderColor" | null>(null);
  const [popupAnchorRect, setPopupAnchorRect] = useState<PopupAnchorRect | null>(null);
  const [popupAnchorDragOffset, setPopupAnchorDragOffset] = useState<DragOffset>({ x: 0, y: 0 });
  const [popupPosition, setPopupPosition] = useState<PopupPosition | null>(null);
  const [areBorderWidthsLinked, setAreBorderWidthsLinked] = useState(true);
  const [arePaddingValuesLinked, setArePaddingValuesLinked] = useState(true);
  const [dragOffset, setDragOffset] = useState<DragOffset>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [numberDrafts, setNumberDrafts] = useState<Record<string, string>>({});
  const rootRef = useRef<HTMLElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const selectedElementKey = selectedElement?.selector ?? "";

  useEffect(() => {
    setActivePopup(null);
    setActiveColorPicker(null);
    setPopupAnchorRect(null);
    setPopupAnchorDragOffset({ x: 0, y: 0 });
    setPopupPosition(null);
    setAreBorderWidthsLinked(!hasCustomBorderWidths(selectedElement?.computedStyles));
    setArePaddingValuesLinked(!hasCustomPadding(selectedElement?.computedStyles));
    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
    dragStateRef.current = null;
    setNumberDrafts({});
  }, [selectedElementKey]);

  useEffect(() => {
    onMorphStateChange?.(false);
    return () => onMorphStateChange?.(false);
  }, [onMorphStateChange]);

  useLayoutEffect(() => {
    if (!rootRef.current || !onHeightChange) return undefined;

    const updateHeight = () => {
      onHeightChange(rootRef.current?.getBoundingClientRect().height ?? 0);
    };
    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, [activePopup, onHeightChange, selectedElementKey]);

  useLayoutEffect(() => {
    if (!activePopup || !popupAnchorRect) {
      setPopupPosition(null);
      return undefined;
    }

    const updatePosition = () => {
      const popoverRect = popupRef.current?.getBoundingClientRect();
      const popoverWidth = popoverRect?.width ?? POPOVER_ESTIMATED_WIDTH;
      const popoverHeight = popoverRect?.height ?? POPOVER_ESTIMATED_HEIGHT;
      const dragDelta = {
        x: dragOffset.x - popupAnchorDragOffset.x,
        y: dragOffset.y - popupAnchorDragOffset.y,
      };
      const activeAnchorRect = {
        top: popupAnchorRect.top + dragDelta.y,
        right: popupAnchorRect.right + dragDelta.x,
        bottom: popupAnchorRect.bottom + dragDelta.y,
        left: popupAnchorRect.left + dragDelta.x,
      };
      const spaceAbove = activeAnchorRect.top;
      const spaceBelow = window.innerHeight - activeAnchorRect.bottom;
      const shouldPlaceAbove =
        spaceBelow < popoverHeight + POPOVER_GAP && spaceAbove > spaceBelow;
      const unclampedTop = shouldPlaceAbove
        ? activeAnchorRect.top - popoverHeight - POPOVER_GAP
        : activeAnchorRect.bottom + POPOVER_GAP;
      const alignRight =
        activeAnchorRect.left + popoverWidth > window.innerWidth - POPOVER_EDGE_MARGIN &&
        activeAnchorRect.right - popoverWidth >= POPOVER_EDGE_MARGIN;
      const unclampedLeft = alignRight
        ? activeAnchorRect.right - popoverWidth
        : activeAnchorRect.left;
      const maxTop = Math.max(
        POPOVER_EDGE_MARGIN,
        window.innerHeight - popoverHeight - POPOVER_EDGE_MARGIN,
      );
      const maxLeft = Math.max(
        POPOVER_EDGE_MARGIN,
        window.innerWidth - popoverWidth - POPOVER_EDGE_MARGIN,
      );

      setPopupPosition({
        top: Math.min(Math.max(POPOVER_EDGE_MARGIN, unclampedTop), maxTop),
        left: Math.min(Math.max(POPOVER_EDGE_MARGIN, unclampedLeft), maxLeft),
      });
    };

    updatePosition();
    const observer = new ResizeObserver(updatePosition);
    if (popupRef.current) {
      observer.observe(popupRef.current);
    }
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [activePopup, dragOffset, popupAnchorDragOffset, popupAnchorRect]);

  useEffect(() => {
    if (!activePopup) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (activeColorPicker) return;
      const targetElement = target instanceof Element ? target : null;
      if (targetElement?.closest("[data-radix-popper-content-wrapper], [role='menu']")) return;
      if (rootRef.current?.contains(target) || popupRef.current?.contains(target)) return;
      setActivePopup(null);
      setPopupAnchorRect(null);
      setPopupAnchorDragOffset({ x: 0, y: 0 });
      setPopupPosition(null);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [activeColorPicker, activePopup]);

  if (!isActive || !selectedElement) return null;

  const computedStyles = selectedElement?.computedStyles;
  const controlsDisabled = !canEdit;
  const isTextTarget =
    TEXT_TAGS.has(selectedElement.tagName) ||
    (selectedElement.text.length > 0 && selectedElement.childElementCount === 0);
  const activeColor = isTextTarget
    ? computedStyles?.color
    : computedStyles?.backgroundColor;
  const fallbackColor = isTextTarget ? "#111111" : "#ffffff";
  const activeColorHex = cssColorToHex(activeColor, fallbackColor);

  const copySelectedElementId = () => {
    if (!selectedElement.id) return;
    void navigator.clipboard?.writeText(selectedElement.id);
  };

  const apply = (property: PreviewDesignStyleProperty, value: string) => {
    onApplyStyle({ [property]: value });
  };

  const handleDragPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: dragOffset.x,
      offsetY: dragOffset.y,
    };
    setIsDragging(true);
  };

  const handleDragPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    setDragOffset({
      x: dragState.offsetX + event.clientX - dragState.startX,
      y: dragState.offsetY + event.clientY - dragState.startY,
    });
  };

  const handleDragPointerEnd = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragStateRef.current = null;
    setIsDragging(false);
  };

  const renderDragHandle = () => (
    <Tooltip content="Drag toolbar" position="bottom" disableHoverableContent>
      <button
        type="button"
        className={styles.dragHandle}
        aria-label="Drag design toolbar"
        onPointerDown={handleDragPointerDown}
        onPointerMove={handleDragPointerMove}
        onPointerUp={handleDragPointerEnd}
        onPointerCancel={handleDragPointerEnd}
      >
        <FaIcon name="grip-dots-vertical" size="xs" />
      </button>
    </Tooltip>
  );

  const togglePopup = (
    popup: Exclude<PopupKind, null>,
    event: ReactMouseEvent<HTMLButtonElement>,
  ) => {
    setActiveColorPicker(null);
    const rect = event.currentTarget.getBoundingClientRect();
    setActivePopup((current) => {
      if (current === popup) {
        setPopupAnchorRect(null);
        setPopupAnchorDragOffset({ x: 0, y: 0 });
        setPopupPosition(null);
        return null;
      }

      setPopupAnchorRect({
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
      });
      setPopupAnchorDragOffset(dragOffset);
      return popup;
    });
  };

  const renderPopupButton = (
    popup: Exclude<PopupKind, null>,
    iconName: FaIconName,
    label: string,
  ) => (
    <ToolbarIconButton
      iconName={iconName}
      label={label}
      disabled={controlsDisabled}
      pressed={activePopup === popup}
      onClick={(event) => togglePopup(popup, event)}
    />
  );

  const toggleColorPicker = (
    property: "color" | "backgroundColor" | "borderColor",
    options: { closeActivePopup?: boolean } = {},
  ) => {
    if (activeColorPicker === property) {
      setActiveColorPicker(null);
      return;
    }

    if (options.closeActivePopup ?? true) {
      setActivePopup(null);
      setPopupAnchorRect(null);
      setPopupAnchorDragOffset({ x: 0, y: 0 });
      setPopupPosition(null);
    }
    setActiveColorPicker(property);
  };

  const renderColorControl = (
    property: "color" | "backgroundColor" | "borderColor",
    label: string,
    value: string,
    onChange: (value: string) => void,
    options: {
      closeActivePopup?: boolean;
      fullWidth?: boolean;
      isNone?: boolean;
      opacity?: number;
      onNone?: () => void;
    } = {},
  ) => (
    <PreviewColorPicker
      label={label}
      value={value}
      disabled={controlsDisabled}
      isOpen={activeColorPicker === property}
      isNone={options.isNone}
      opacity={options.opacity}
      placement={popupPlacement}
      positionKey={`${dragOffset.x}:${dragOffset.y}`}
      fullWidth={options.fullWidth}
      onChange={onChange}
      onNone={options.onNone}
      onOpenChange={(isOpen) => {
        if (isOpen) {
          toggleColorPicker(property, options);
        } else {
          setActiveColorPicker(null);
        }
      }}
    />
  );

  const renderSelectField = (
    label: string,
    property: PreviewDesignStyleProperty,
    options: DesignDropdownOption[],
  ) => (
    <div className={styles.fieldInline}>
      <span className={styles.fieldLabel}>{label}</span>
      <AppActionDropdown
        size="xs"
        align="start"
        trigger={
          (() => {
            const selectedOption = options.find((option) => option.value === computedStyles?.[property]);
            return (
          <AppButton
            variant="secondary"
            tone="gray"
            size="xs"
            iconName={selectedOption?.iconName}
            disabled={controlsDisabled}
            className={`${styles.compactDropdownTrigger} ${
              selectedOption ? "" : styles.compactDropdownPlaceholder
            }`}
          >
            {selectedOption?.label ?? "Select"}
          </AppButton>
            );
          })()
        }
        items={options.map((option) => ({
          id: option.value,
          label: option.label,
          iconName: option.iconName,
          onSelect: () => apply(property, option.value),
        }))}
      />
    </div>
  );

  const renderDropdownButton = (
    label: string,
    property: PreviewDesignStyleProperty,
    options: DesignDropdownOption[],
    iconName: FaIconName,
  ) => {
    const selectedOption = options.find((option) => option.value === computedStyles?.[property]);

    return (
      <AppActionDropdown
        size="xs"
        align="start"
        trigger={
          <AppButton
            variant="secondary"
            tone="gray"
            size="xs"
            iconName={selectedOption?.iconName ?? iconName}
            disabled={controlsDisabled}
            aria-label={label}
          />
        }
        items={options.map((option) => ({
          id: option.value,
          label: option.label,
          iconName: option.iconName,
          onSelect: () => apply(property, option.value),
        }))}
      />
    );
  };

  const renderDisplayModeToggle = () => {
    const activeDisplay = computedStyles?.display || "block";

    return (
      <div className={styles.displayModeGroup} role="group" aria-label="Display">
        {DISPLAY_OPTIONS.map((option) => (
          <AppButton
            key={option.value}
            variant="tertiary"
            tone="black"
            size="xs"
            iconName={option.iconName}
            disabled={controlsDisabled}
            aria-label={`Set display to ${option.label}`}
            aria-pressed={activeDisplay === option.value}
            className={`${styles.displayModeButton} ${
              activeDisplay === option.value ? styles.displayModeButtonActive : ""
            }`}
            onClick={() => apply("display", option.value)}
          >
            {option.label}
          </AppButton>
        ))}
      </div>
    );
  };

  const renderPrimaryToolbar = () => (
    <div key="primary" className={styles.contentState}>
      {renderDragHandle()}
      <ToolbarIconButton
        iconName="message-code"
        label="Add to Tutor Chat"
        onClick={() => onAddToTutor(selectedElement)}
      />
      {selectedElement.id ? (
        <Tooltip content="Click to copy" position="bottom" disableHoverableContent>
          <button
            type="button"
            className={styles.label}
            aria-label={`Copy ${selectedElement.id} id`}
            onClick={copySelectedElementId}
          >
            {elementLabel(selectedElement)}
          </button>
        </Tooltip>
      ) : null}

      <span className={styles.groupGap} aria-hidden />

      <div className={styles.toolbar}>
        {isTextTarget ? (
          <>
            {renderColorControl("color", "Text color", activeColorHex, (value) => apply("color", value), {
              isNone: isUnsetColor(computedStyles?.color),
              opacity: cssColorOpacity(computedStyles?.color),
              onNone: () => apply("color", "transparent"),
            })}
            {renderInlineNumber("fontSize", computedStyles?.fontSize, "Font size", {
              min: 8,
              max: 96,
              iconName: "text-size",
            })}
            <ToolbarIconButton
              iconName="bold"
              label="Bold"
              disabled={controlsDisabled}
              pressed={isBold(computedStyles?.fontWeight)}
              onClick={() => apply("fontWeight", isBold(computedStyles?.fontWeight) ? "400" : "700")}
            />
            <ToolbarIconButton
              iconName="italic"
              label="Italic"
              disabled={controlsDisabled}
              pressed={computedStyles?.fontStyle === "italic"}
              onClick={() => apply("fontStyle", computedStyles?.fontStyle === "italic" ? "normal" : "italic")}
            />
            <ToolbarIconButton
              iconName="underline"
              label="Underline"
              disabled={controlsDisabled}
              pressed={computedStyles?.textDecoration.includes("underline")}
              onClick={() => {
                const isUnderlined = computedStyles?.textDecoration.includes("underline");
                apply("textDecoration", isUnderlined ? "none" : "underline");
              }}
            />
            {renderDropdownButton("Text alignment", "textAlign", TEXT_ALIGN_OPTIONS, "align-left")}
            <ToolbarIconButton
              iconName="line-height"
              label="Letter spacing and line height"
              disabled={controlsDisabled}
              pressed={activePopup === "spacing"}
              onClick={(event) => togglePopup("spacing", event)}
            />
          </>
        ) : (
          <>
            {renderColorControl(
              "backgroundColor",
              "Background color",
              activeColorHex,
              (value) => apply("backgroundColor", value),
              {
                isNone: isUnsetColor(computedStyles?.backgroundColor),
                opacity: cssColorOpacity(computedStyles?.backgroundColor),
                onNone: () => apply("backgroundColor", "transparent"),
              },
            )}
            {renderPopupButton("border", "border-all", "Border")}
            {renderPopupButton("box", "square-dashed", "Padding")}
            {renderPopupButton("display", "table-layout", "Display options")}
          </>
        )}
      </div>

      <span className={styles.groupGap} aria-hidden />

      <ToolbarIconButton
        iconName="rotate-left"
        label="Reset design styles"
        onClick={onResetStyles}
        variant="tertiary"
      />
      <AppButton
        variant="tertiary"
        tone="gray"
        size="xs"
        iconName="xmark"
        aria-label="Clear selection"
        onClick={onClearSelection}
      />
    </div>
  );

  const renderInlineNumber = (
    property: PreviewDesignStyleProperty,
    value: string | undefined,
    label: string,
    options: {
      min?: number;
      max?: number;
      unit?: string;
      iconName?: FaIconName;
      placeholder?: string;
      emptyValue?: string;
      valueFormatter?: (value: string | undefined) => string;
      onApplyValue?: (value: string) => void;
    } = {},
  ) => {
    const applyNumberValue = (rawValue: string) => {
      const nextValue = `${rawValue}${options.unit ?? "px"}`;
      if (options.onApplyValue) {
        options.onApplyValue(nextValue);
      } else {
        apply(property, nextValue);
      }
    };

    return (
      <label className={styles.inlineNumber} title={label} aria-label={label}>
        {options.iconName ? (
          <span className={styles.inlineNumberIcon} aria-hidden>
            <FaIcon name={options.iconName} size="xs" />
          </span>
        ) : null}
        <input
          type="number"
          min={options.min}
          max={options.max}
          placeholder={options.placeholder}
          value={numberDrafts[property] ?? (options.valueFormatter ? options.valueFormatter(value) : fontSizeNumber(value))}
          disabled={controlsDisabled}
          onChange={(event) => {
            const rawValue = event.target.value;
            setNumberDrafts((current) => ({ ...current, [property]: rawValue }));
            if (rawValue === "" || rawValue === "-") return;
            applyNumberValue(rawValue);
          }}
          onBlur={() => {
            const draftValue = numberDrafts[property];
            if (draftValue === "") {
              if (options.emptyValue != null) {
                apply(property, options.emptyValue);
              } else {
                setNumberDrafts((current) => ({ ...current, [property]: "0" }));
                applyNumberValue("0");
              }
              window.setTimeout(() => {
                setNumberDrafts((current) => {
                  const { [property]: _removed, ...rest } = current;
                  return rest;
                });
              }, 0);
              return;
            }

            setNumberDrafts((current) => {
              const { [property]: _removed, ...rest } = current;
              return rest;
            });
          }}
        />
      </label>
    );
  };

  const renderNumberField = (
    label: string,
    property: PreviewDesignStyleProperty,
    value: string | undefined,
    options: {
      min?: number;
      max?: number;
      unit?: string;
      iconName?: FaIconName;
      placeholder?: string;
      emptyValue?: string;
      valueFormatter?: (value: string | undefined) => string;
      onApplyValue?: (value: string) => void;
    } = {},
  ) => (
    <label className={styles.fieldInline}>
      <span className={styles.fieldLabel}>{label}</span>
      {renderInlineNumber(property, value, label, options)}
    </label>
  );

  const getPaddingValues = () => ({
    paddingTop: computedStyles?.paddingTop ?? computedStyles?.padding ?? "0px",
    paddingRight: computedStyles?.paddingRight ?? computedStyles?.padding ?? "0px",
    paddingBottom: computedStyles?.paddingBottom ?? computedStyles?.padding ?? "0px",
    paddingLeft: computedStyles?.paddingLeft ?? computedStyles?.padding ?? "0px",
  });

  const applyPadding = (patch: Partial<PaddingStylePatch>) => {
    const currentValues = getPaddingValues();
    const nextValues = PADDING_PROPERTIES.reduce(
      (values, property) => ({
        ...values,
        [property]: patch[property] ?? currentValues[property],
      }),
      {} as Record<PaddingProperty, string>,
    );
    onApplyStyle(nextValues);
  };

  const applyPaddingValue = (property: PaddingProperty, value: string) => {
    if (arePaddingValuesLinked) {
      applyPadding(
        PADDING_PROPERTIES.reduce(
          (patch, paddingProperty) => ({ ...patch, [paddingProperty]: value }),
          {} as PaddingStylePatch,
        ),
      );
      return;
    }

    applyPadding({ [property]: value } as PaddingStylePatch);
  };

  const togglePaddingLock = () => {
    setArePaddingValuesLinked((current) => {
      if (current) return false;

      const linkedValue = getPaddingValues().paddingTop;
      applyPadding(
        PADDING_PROPERTIES.reduce(
          (patch, paddingProperty) => ({ ...patch, [paddingProperty]: linkedValue }),
          {} as PaddingStylePatch,
        ),
      );
      return true;
    });
  };

  const getBorderWidths = () => ({
    borderTopWidth: computedStyles?.borderTopWidth ?? computedStyles?.borderWidth ?? "0px",
    borderRightWidth: computedStyles?.borderRightWidth ?? computedStyles?.borderWidth ?? "0px",
    borderBottomWidth: computedStyles?.borderBottomWidth ?? computedStyles?.borderWidth ?? "0px",
    borderLeftWidth: computedStyles?.borderLeftWidth ?? computedStyles?.borderWidth ?? "0px",
  });

  const applyBorder = (
    patch: Partial<
      {
        color: string;
      } & BorderWidthStylePatch
    >,
  ) => {
    const color = patch.color ?? cssColorToHex(computedStyles?.borderColor, "#111111");
    const currentWidths = getBorderWidths();
    const nextWidths = BORDER_WIDTH_PROPERTIES.reduce(
      (widths, property) => ({
        ...widths,
        [property]: patch[property] ?? currentWidths[property],
      }),
      {} as Record<BorderWidthProperty, string>,
    );
    onApplyStyle({
      border: `0 solid ${color}`,
      ...nextWidths,
      borderColor: color,
    });
  };

  const applyBorderWidth = (property: BorderWidthProperty, value: string) => {
    if (areBorderWidthsLinked) {
      applyBorder(
        BORDER_WIDTH_PROPERTIES.reduce(
          (patch, borderProperty) => ({ ...patch, [borderProperty]: value }),
          {} as BorderWidthStylePatch,
        ),
      );
      return;
    }

    applyBorder({ [property]: value } as BorderWidthStylePatch);
  };

  const toggleBorderWidthLock = () => {
    setAreBorderWidthsLinked((current) => {
      if (current) return false;

      const linkedWidth = getBorderWidths().borderTopWidth;
      applyBorder(
        BORDER_WIDTH_PROPERTIES.reduce(
          (patch, borderProperty) => ({ ...patch, [borderProperty]: linkedWidth }),
          {} as BorderWidthStylePatch,
        ),
      );
      return true;
    });
  };

  const renderPaddingGrid = () => (
    <div className={styles.paddingGrid} aria-label="Padding">
      {renderInlineNumber("paddingTop", computedStyles?.paddingTop, "Top padding", {
        min: 0,
        max: 240,
        iconName: "arrow-up",
        onApplyValue: (value) => applyPaddingValue("paddingTop", value),
      })}
      {renderInlineNumber("paddingRight", computedStyles?.paddingRight, "Right padding", {
        min: 0,
        max: 240,
        iconName: "arrow-right",
        onApplyValue: (value) => applyPaddingValue("paddingRight", value),
      })}
      {renderInlineNumber("paddingLeft", computedStyles?.paddingLeft, "Left padding", {
        min: 0,
        max: 240,
        iconName: "arrow-left",
        onApplyValue: (value) => applyPaddingValue("paddingLeft", value),
      })}
      {renderInlineNumber("paddingBottom", computedStyles?.paddingBottom, "Bottom padding", {
        min: 0,
        max: 240,
        iconName: "arrow-down",
        onApplyValue: (value) => applyPaddingValue("paddingBottom", value),
      })}
    </div>
  );

  const renderBorderWidthGrid = () => (
    <div className={styles.paddingGrid} aria-label="Border weight">
      {renderInlineNumber("borderTopWidth", computedStyles?.borderTopWidth, "Top border", {
        min: 0,
        max: 24,
        iconName: "border-top",
        onApplyValue: (value) => applyBorderWidth("borderTopWidth", value),
      })}
      {renderInlineNumber("borderRightWidth", computedStyles?.borderRightWidth, "Right border", {
        min: 0,
        max: 24,
        iconName: "border-right",
        onApplyValue: (value) => applyBorderWidth("borderRightWidth", value),
      })}
      {renderInlineNumber("borderLeftWidth", computedStyles?.borderLeftWidth, "Left border", {
        min: 0,
        max: 24,
        iconName: "border-left",
        onApplyValue: (value) => applyBorderWidth("borderLeftWidth", value),
      })}
      {renderInlineNumber("borderBottomWidth", computedStyles?.borderBottomWidth, "Bottom border", {
        min: 0,
        max: 24,
        iconName: "border-bottom",
        onApplyValue: (value) => applyBorderWidth("borderBottomWidth", value),
      })}
    </div>
  );

  const renderPopupContent = () => {
    if (!activePopup) return null;

    return (
      <div key={activePopup} className={styles.popoverContent}>
        {activePopup === "spacing" ? (
          <div className={styles.inlineFields}>
            {renderNumberField("Letter spacing", "letterSpacing", computedStyles?.letterSpacing, {
              min: -4,
              max: 32,
              iconName: "kerning",
            })}
            {renderNumberField("Line height", "lineHeight", computedStyles?.lineHeight, {
              min: 8,
              max: 96,
              iconName: "line-height",
            })}
          </div>
        ) : null}
        {activePopup === "box" ? (
          <div className={styles.inlineFields}>
            <div className={styles.fieldHeader}>
              <span className={styles.popupTitle}>Padding</span>
              <AppButton
                variant="tertiary"
                tone="gray"
                size="xs"
                iconName={arePaddingValuesLinked ? "lock" : "lock-open"}
                disabled={controlsDisabled}
                className={styles.lockButton}
                aria-label={arePaddingValuesLinked ? "Unlock padding values" : "Lock padding values"}
                aria-pressed={arePaddingValuesLinked}
                onClick={togglePaddingLock}
              />
            </div>
            {renderPaddingGrid()}
          </div>
        ) : null}
        {activePopup === "border" ? (
          <div className={styles.inlineFields}>
            <div className={styles.fieldHeader}>
              <span className={styles.popupTitle}>Weight</span>
              <AppButton
                variant="tertiary"
                tone="gray"
                size="xs"
                iconName={areBorderWidthsLinked ? "lock" : "lock-open"}
                disabled={controlsDisabled}
                className={styles.lockButton}
                aria-label={areBorderWidthsLinked ? "Unlock border widths" : "Lock border widths"}
                aria-pressed={areBorderWidthsLinked}
                onClick={toggleBorderWidthLock}
              />
            </div>
            {renderBorderWidthGrid()}
            <div className={styles.borderDetailRow}>
              <label className={styles.fieldInline}>
                <span className={styles.fieldLabel}>Color</span>
                {renderColorControl(
                  "borderColor",
                  "Border color",
                  cssColorToHex(computedStyles?.borderColor, "#111111"),
                  (value) => applyBorder({ color: value }),
                  {
                    closeActivePopup: false,
                    fullWidth: true,
                    isNone: isUnsetColor(computedStyles?.borderColor),
                    opacity: cssColorOpacity(computedStyles?.borderColor),
                    onNone: () => applyBorder({ color: "transparent" }),
                  },
                )}
              </label>
              {renderNumberField("Radius", "borderRadius", computedStyles?.borderRadius, {
                min: 0,
                max: 96,
                iconName: "border-top-left",
              })}
            </div>
          </div>
        ) : null}
        {activePopup === "display" ? (
          <div className={styles.displayGrid}>
            <div className={styles.displayModeField}>
              <span className={styles.fieldLabel}>Display mode</span>
              {renderDisplayModeToggle()}
            </div>
            {["flex", "inline-flex"].includes(computedStyles?.display || "") ? (
              <>
                {renderSelectField("Direction", "flexDirection", FLEX_DIRECTION_OPTIONS)}
                {renderSelectField("Wrap", "flexWrap", FLEX_WRAP_OPTIONS)}
                {renderSelectField("Justify", "justifyContent", JUSTIFY_CONTENT_OPTIONS)}
                {renderSelectField("Align", "alignItems", ALIGN_ITEMS_OPTIONS)}
              </>
            ) : null}
            {["flex", "inline-flex", "grid"].includes(computedStyles?.display || "") ? (
              <>
                {computedStyles?.display === "grid" ? (
                  <>
                    {renderNumberField("Columns", "gridTemplateColumns", computedStyles?.gridTemplateColumns, {
                      min: 1,
                      max: 12,
                      unit: "",
                      iconName: "table-columns",
                      placeholder: "Auto",
                      emptyValue: "none",
                      valueFormatter: gridTrackCount,
                      onApplyValue: (value) => apply("gridTemplateColumns", `repeat(${value}, minmax(0, 1fr))`),
                    })}
                    {renderNumberField("Rows", "gridTemplateRows", computedStyles?.gridTemplateRows, {
                      min: 1,
                      max: 12,
                      unit: "",
                      iconName: "table-rows",
                      placeholder: "Auto",
                      emptyValue: "none",
                      valueFormatter: gridTrackCount,
                      onApplyValue: (value) => apply("gridTemplateRows", `repeat(${value}, auto)`),
                    })}
                  </>
                ) : null}
                {renderNumberField("Row gap", "rowGap", computedStyles?.rowGap, {
                  min: 0,
                  max: 96,
                  iconName: "arrows-up-down",
                })}
                {renderNumberField("Column gap", "columnGap", computedStyles?.columnGap, {
                  min: 0,
                  max: 96,
                  iconName: "arrows-left-right-to-line",
                })}
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  };

  const panelStyle: CSSProperties = {
    ...style,
    transform: [
      style?.transform,
      dragOffset.x !== 0 || dragOffset.y !== 0
        ? `translate(${dragOffset.x}px, ${dragOffset.y}px)`
        : "",
    ]
      .filter(Boolean)
      .join(" "),
  };
  const anchoredPopoverStyle: CSSProperties | undefined = popupPosition
    ? {
        top: `${popupPosition.top}px`,
        left: `${popupPosition.left}px`,
      }
    : { visibility: "hidden" };
  const anchoredPopover = activePopup
    ? createPortal(
        <div
          ref={popupRef}
          className={styles.anchoredPopover}
          style={anchoredPopoverStyle}
          role="dialog"
          aria-label="Design options"
        >
          {renderPopupContent()}
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <aside
        ref={rootRef}
        className={`${styles.root} ${isDragging ? styles.rootDragging : ""}`}
        style={panelStyle}
        aria-label="Preview design toolbar"
        data-popup-placement={popupPlacement}
      >
        {renderPrimaryToolbar()}

        {disabledReason ? <p className={styles.notice}>{disabledReason}</p> : null}
      </aside>
      {anchoredPopover}
    </>
  );
}
