import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleInfo,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import { AppButton } from "../../ui/AppButton";
import styles from "./InstructionsDrawer.module.scss";

export type InstructionsDrawerVisualCue = "none" | "inline-link";

interface InstructionsDrawerProps {
  maxHeight?: number | null;
  onHeightChange?: (height: number) => void;
  onOpenChange?: (isOpen: boolean) => void;
  initialHeightRatio?: number;
  defaultOpen?: boolean;
  openSignal?: number;
  visualCue?: InstructionsDrawerVisualCue;
  showLabel?: string;
  hideLabel?: string;
  children?: React.ReactNode;
}

export function InstructionsDrawer({
  maxHeight: propMaxHeight,
  onHeightChange,
  onOpenChange,
  initialHeightRatio = 0.6,
  defaultOpen = true,
  openSignal = 0,
  visualCue = "none",
  showLabel = "Show Instructions",
  hideLabel = "Hide Instructions",
  children,
}: InstructionsDrawerProps) {
  const minimumContentHeight = 150;
  const [isOpen, setIsOpen] = useState(defaultOpen);
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
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  useEffect(() => {
    if (previousDefaultOpenRef.current === defaultOpen) return;
    previousDefaultOpenRef.current = defaultOpen;
    setIsOpen(defaultOpen);
  }, [defaultOpen]);

  useEffect(() => {
    if (previousOpenSignalRef.current === openSignal) return;
    previousOpenSignalRef.current = openSignal;
    setIsOpen(true);
  }, [openSignal]);

  useEffect(() => {
    if (isOpen) {
      onHeightChange?.(height);
    }
  }, [height, isOpen, onHeightChange]);

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
      onHeightChange?.(nextHeight);
    }
  }, [hasUserResized, height, initialHeightRatio, isOpen, onHeightChange, propMaxHeight, contentMaxHeight]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const upperLimit = getUpperLimit();
    if (height > upperLimit) {
      setHeight(upperLimit);
      onHeightChange?.(upperLimit);
    }
  }, [contentMaxHeight, height, isOpen, onHeightChange, propMaxHeight]);

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
      onHeightChange?.(nextHeight);
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

  return (
    <div className={styles.root}>
      {isOpen ? (
        <div className={styles.drawerWrap}>
          <div className={styles.drawerContent} style={{ height: `${height}px` }}>
            <div className={styles.scrollFrame}>
              <div
                ref={scrollRef}
                className={styles.scrollContent}
                onScroll={updateOverflowState}
              >
                <div ref={contentRef}>
                  {children}
                </div>
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
                    const nextHeight = getUpperLimit();
                    setHeight(nextHeight);
                    onHeightChange?.(nextHeight);
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
      ) : null}

      <div className={`${styles.toggleWrap} ${isOpen ? styles.toggleWrapOpen : ""}`}>
        <div aria-hidden="true" className={styles.toggleBorder} />
        <AppButton
          variant="tertiary"
          tone="black"
          size="xs"
          icon={<FontAwesomeIcon icon={faCircleInfo} />}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          {isOpen ? hideLabel : showLabel}{" "}
          <FontAwesomeIcon icon={isOpen ? faChevronUp : faChevronDown} />
        </AppButton>
      </div>
    </div>
  );
}
