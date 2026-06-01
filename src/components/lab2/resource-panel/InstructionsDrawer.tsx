import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleInfo,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import { AppButton } from "../../ui/AppButton";
import type { InstructionPinnedStep } from "../../../types/tutor";
import styles from "./InstructionsDrawer.module.scss";

export type InstructionsDrawerVisualCue = "none" | "inline-link";

export type InstructionsDrawerCollapseAnimation = "none" | "slide";

export type InstructionsDrawerExperiment =
  | "default"
  | "close-on-first-send"
  | "instructions-tab-first-visit"
  | "instructions-tab-notification-halo";

export function isInstructionsTabDrawerExperiment(
  experiment: InstructionsDrawerExperiment,
): boolean {
  return (
    experiment === "instructions-tab-first-visit" ||
    experiment === "instructions-tab-notification-halo"
  );
}

interface InstructionsDrawerProps {
  maxHeight?: number | null;
  onHeightChange?: (height: number) => void;
  onOpenChange?: (isOpen: boolean) => void;
  initialHeightRatio?: number;
  defaultOpen?: boolean;
  openSignal?: number;
  closeSignal?: number;
  collapseAnimation?: InstructionsDrawerCollapseAnimation;
  showTogglePulse?: boolean;
  onTogglePulseComplete?: () => void;
  onSlideCollapseSettled?: () => void;
  visualCue?: InstructionsDrawerVisualCue;
  showLabel?: string;
  hideLabel?: string;
  pinnedStep?: InstructionPinnedStep;
  /** Tutor instruction-delivery layout for the collapsed drawer toggle chrome. */
  tutorDeliveryToggleLayout?: boolean;
  children?: React.ReactNode;
}

const DRAWER_COLLAPSE_MS = 280;

export function InstructionsDrawer({
  maxHeight: propMaxHeight,
  onHeightChange,
  onOpenChange,
  initialHeightRatio = 0.6,
  defaultOpen = true,
  openSignal = 0,
  closeSignal = 0,
  collapseAnimation = "none",
  showTogglePulse = false,
  onTogglePulseComplete,
  onSlideCollapseSettled,
  visualCue = "none",
  showLabel = "Show Instructions",
  hideLabel = "Hide Instructions",
  pinnedStep,
  tutorDeliveryToggleLayout = false,
  children,
}: InstructionsDrawerProps) {
  const minimumContentHeight = 150;
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [height, setHeight] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [isHoveringHandle, setIsHoveringHandle] = useState(false);
  const [contentMaxHeight, setContentMaxHeight] = useState<number | null>(null);
  const [hasUserResized, setHasUserResized] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [isScrolledFromTop, setIsScrolledFromTop] = useState(false);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const previousDefaultOpenRef = useRef(defaultOpen);
  const previousOpenSignalRef = useRef(openSignal);
  const previousCloseSignalRef = useRef(closeSignal);
  const collapseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const assemblyRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const onSlideCollapseSettledRef = useRef(onSlideCollapseSettled);
  const useSlideAssembly = collapseAnimation === "slide";

  useEffect(() => {
    onSlideCollapseSettledRef.current = onSlideCollapseSettled;
  }, [onSlideCollapseSettled]);

  const getUpperLimit = () => {
    const viewportFallback = typeof window !== "undefined" ? window.innerHeight - 200 : 600;
    const containerMax = propMaxHeight || viewportFallback;
    const contentMax = contentMaxHeight || viewportFallback;
    return Math.min(containerMax, contentMax);
  };

  const updateOverflowState = () => {
    if (!scrollRef.current) {
      return;
    }

    const element = scrollRef.current;
    const overflow = element.scrollHeight - element.clientHeight > 1;
    const fromTop = element.scrollTop > 1;
    const atBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 1;
    setHasOverflow(overflow);
    setIsScrolledFromTop(fromTop);
    setIsScrolledToBottom(atBottom);
  };

  const clampHeight = (value: number) => {
    const upperLimit = getUpperLimit();
    const minimumHeight = Math.min(minimumContentHeight, upperLimit);
    return Math.max(minimumHeight, Math.min(value, upperLimit));
  };

  useEffect(() => {
    if (isCollapsing) {
      return;
    }
    onOpenChange?.(isOpen);
  }, [isCollapsing, isOpen, onOpenChange]);

  useEffect(() => {
    if (previousDefaultOpenRef.current === defaultOpen) return;
    previousDefaultOpenRef.current = defaultOpen;
    setIsOpen(defaultOpen);
  }, [defaultOpen]);

  useEffect(() => {
    if (previousOpenSignalRef.current === openSignal) return;
    previousOpenSignalRef.current = openSignal;
    setIsCollapsing(false);
    setIsOpen(true);
  }, [openSignal]);

  const closeDrawer = (animated: boolean) => {
    if (!isOpen && !isCollapsing) {
      return false;
    }

    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }

    const shouldAnimate = animated && collapseAnimation === "slide";
    if (!shouldAnimate) {
      setIsCollapsing(false);
      setIsOpen(false);
      onOpenChange?.(false);
      return true;
    }

    setIsOpen(false);
    setIsCollapsing(true);
    collapseTimeoutRef.current = setTimeout(() => {
      setIsCollapsing(false);
      onOpenChange?.(false);
      onSlideCollapseSettledRef.current?.();
      collapseTimeoutRef.current = null;
    }, DRAWER_COLLAPSE_MS);
    return true;
  };

  useEffect(() => {
    if (previousCloseSignalRef.current === closeSignal) return;
    previousCloseSignalRef.current = closeSignal;
    const didClose = closeDrawer(true);
    if (!didClose) {
      onSlideCollapseSettledRef.current?.();
    }
  }, [closeSignal]);

  useEffect(
    () => () => {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
    },
    [],
  );

  // The root wraps the (optional) panel, the pinned step, and the toggle in all
  // modes, so observing it is the single source of truth for how far the chat
  // stream below must be padded to clear the floating drawer chrome.
  useEffect(() => {
    const element = rootRef.current;
    if (!element || !onHeightChange) {
      return;
    }

    const reportChromeHeight = () => {
      onHeightChange(Math.ceil(element.getBoundingClientRect().height));
    };

    reportChromeHeight();
    const observer = new ResizeObserver(reportChromeHeight);
    observer.observe(element);

    return () => observer.disconnect();
  }, [
    onHeightChange,
    useSlideAssembly,
    isOpen,
    isCollapsing,
    isOpening,
    height,
    pinnedStep,
  ]);

  useLayoutEffect(() => {
    if (!isOpening) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      setIsOpening(false);
    });

    return () => cancelAnimationFrame(frame);
  }, [isOpening]);

  useEffect(() => {
    if (!isOpen || !contentRef.current) {
      return;
    }

    const measure = () => {
      if (!contentRef.current) {
        return;
      }
      const measuredHeight = contentRef.current.scrollHeight + 16;
      setContentMaxHeight(measuredHeight);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(contentRef.current);

    return () => observer.disconnect();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || hasUserResized || initialHeightRatio === undefined) {
      return;
    }

    const viewportFallback = typeof window !== "undefined" ? window.innerHeight - 200 : 600;
    const containerMax = propMaxHeight || viewportFallback;
    const targetHeight = containerMax * initialHeightRatio;
    const nextHeight = clampHeight(targetHeight);

    if (Math.abs(nextHeight - height) > 1) {
      setHeight(nextHeight);
    }
  }, [
    hasUserResized,
    height,
    initialHeightRatio,
    isOpen,
    onHeightChange,
    propMaxHeight,
    contentMaxHeight,
    useSlideAssembly,
  ]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const upperLimit = getUpperLimit();
    if (height > upperLimit) {
      setHeight(upperLimit);
    }
  }, [contentMaxHeight, height, isOpen, onHeightChange, propMaxHeight, useSlideAssembly]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    updateOverflowState();
  }, [height, isOpen, contentMaxHeight]);

  const handleMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
    setIsResizing(true);
    setHasUserResized(true);
    const startY = event.clientY;
    const startHeight = height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const nextHeight = clampHeight(startHeight + deltaY);
      setHeight(nextHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const shouldShowTopFade = hasOverflow && isScrolledFromTop;
  const shouldShowBottomFade = hasOverflow && !isScrolledToBottom;
  const canResize = contentMaxHeight === null || contentMaxHeight > minimumContentHeight;
  const canExpandInline = visualCue === "inline-link" && hasOverflow && height < getUpperLimit() - 1;
  const panelExpanded = isOpen || isCollapsing;
  const panelShellClassName = [
    styles.panelCollapseShell,
    isOpen && !isCollapsing && !isOpening ? styles.panelCollapseShellOpen : "",
    isCollapsing || isOpening ? styles.panelCollapseShellClosing : "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleToggleOpen = () => {
    if (isOpen) {
      closeDrawer(useSlideAssembly);
      return;
    }

    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }

    setIsCollapsing(false);

    if (useSlideAssembly) {
      setIsOpening(true);
      setIsOpen(true);
      return;
    }

    setIsOpening(false);
    setIsOpen(true);
  };

  const drawerPanel = (
    <div className={styles.drawerWrap}>
      <div className={styles.drawerContent} style={{ height: `${height}px` }}>
        <div className={styles.scrollFrame}>
          <div
            ref={scrollRef}
            className={styles.scrollContent}
            onScroll={updateOverflowState}
          >
            <div ref={contentRef}>{children}</div>
          </div>
          {shouldShowTopFade && (
            <div
              className={`${styles.scrollFade} ${styles.scrollFadeTop}`}
              aria-hidden="true"
            />
          )}
          {shouldShowBottomFade && (
            <div
              className={`${styles.scrollFade} ${styles.scrollFadeBottom}`}
              aria-hidden="true"
            />
          )}
        </div>
        {canExpandInline && (
          <div className={styles.inlineExpandWrap}>
            <button
              type="button"
              className={styles.inlineExpandButton}
              onClick={() => {
                setHasUserResized(true);
                setHeight(getUpperLimit());
              }}
            >
              Read more
            </button>
          </div>
        )}

        {canResize && (
          <div
            onMouseDown={handleMouseDown}
            onMouseEnter={() => setIsHoveringHandle(true)}
            onMouseLeave={() => setIsHoveringHandle(false)}
            className={styles.resizeHandle}
          >
            <div
              className={`${styles.resizeBar} ${
                isHoveringHandle || isResizing
                  ? styles.resizeBarActive
                  : styles.resizeBarIdle
              }`}
            />
          </div>
        )}
        <div className={styles.bottomBorder} />
      </div>
    </div>
  );

  const showPinnedStep =
    tutorDeliveryToggleLayout && !isOpen && Boolean(pinnedStep);

  const togglePanelAttached = useSlideAssembly
    ? panelExpanded
    : isOpen || showPinnedStep;

  const pinnedStepSummary = showPinnedStep ? (
    <div className={styles.pinnedStep}>
      <span className={styles.pinnedStepLabel}>{pinnedStep!.positionLabel}</span>
      <span className={styles.pinnedStepSummary}>{pinnedStep!.summary}</span>
    </div>
  ) : null;

  const toggleControl = (
    <div
      className={[
        styles.toggleWrap,
        useSlideAssembly
          ? togglePanelAttached
            ? styles.toggleWrapPanelAttached
            : ""
          : togglePanelAttached
            ? styles.toggleWrapOpen
            : "",
        showTogglePulse ? styles.toggleWrapGlow : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onAnimationEnd={(event) => {
        if (!showTogglePulse || event.currentTarget !== event.target) {
          return;
        }
        if (event.elapsedTime < 100) {
          return;
        }
        onTogglePulseComplete?.();
      }}
    >
      <div
        aria-hidden="true"
        className={[
          styles.toggleBorder,
          togglePanelAttached ? styles.toggleBorderConnected : "",
        ]
          .filter(Boolean)
          .join(" ")}
      />
      <AppButton
        variant="tertiary"
        tone="black"
        size="xs"
        icon={<FontAwesomeIcon icon={faCircleInfo} />}
        onClick={handleToggleOpen}
      >
        {isOpen ? hideLabel : showLabel}{" "}
        <FontAwesomeIcon icon={isOpen ? faChevronUp : faChevronDown} />
      </AppButton>
    </div>
  );

  return (
    <div
      ref={rootRef}
      className={[styles.root, useSlideAssembly ? styles.rootSlideAssembly : ""]
        .filter(Boolean)
        .join(" ")}
    >
      {useSlideAssembly ? (
        <div className={styles.slideAssembly} ref={assemblyRef}>
          {panelExpanded ? (
            <div className={panelShellClassName}>
              <div className={styles.panelCollapseInner}>{drawerPanel}</div>
            </div>
          ) : null}
          {pinnedStepSummary}
          {toggleControl}
        </div>
      ) : (
        <>
          {isOpen ? drawerPanel : null}
          {pinnedStepSummary}
          {toggleControl}
        </>
      )}
    </div>
  );
}
