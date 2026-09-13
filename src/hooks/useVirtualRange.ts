import { useCallback, useEffect, useState, type RefObject } from "react";

export interface VirtualRange {
  /** First rendered item index (inclusive). */
  start: number;
  /** Last rendered item index (exclusive). */
  end: number;
  /** Pixel height of the items above `start`. */
  topPad: number;
  /** Pixel height of the items at/after `end`. */
  bottomPad: number;
}

interface UseVirtualRangeOptions {
  scrollRef: RefObject<HTMLElement | null>;
  itemCount: number;
  /** Fixed pitch per item in px (item height + any gap). */
  itemSize: number;
  /** Pixels of non-item content before the first item (e.g. sticky header). */
  leadingOffset?: number;
  overscan?: number;
}

function rangeFor(
  scrollTop: number,
  viewport: number,
  { itemCount, itemSize, leadingOffset = 0, overscan = 6 }: UseVirtualRangeOptions,
): VirtualRange {
  if (itemCount === 0 || itemSize <= 0) {
    return { start: 0, end: 0, topPad: 0, bottomPad: 0 };
  }
  const firstVisible = Math.min(
    itemCount - 1,
    Math.floor(Math.max(0, scrollTop - leadingOffset) / itemSize),
  );
  const visibleCount = Math.ceil(viewport / itemSize) + 1;
  const end = Math.min(itemCount, firstVisible + visibleCount + overscan);
  const start = Math.min(end, Math.max(0, firstVisible - overscan));
  return {
    start,
    end,
    topPad: start * itemSize,
    bottomPad: (itemCount - end) * itemSize,
  };
}

function sameRange(a: VirtualRange, b: VirtualRange) {
  return (
    a.start === b.start &&
    a.end === b.end &&
    a.topPad === b.topPad &&
    a.bottomPad === b.bottomPad
  );
}

/**
 * Fixed-pitch windowing for long lists. Tracks the scroll container's
 * `scrollTop` / `clientHeight` and returns the index window to render plus
 * spacer heights so the scrollbar still reflects the full list.
 *
 * Only re-renders the caller when the *index* window changes, not on every
 * scroll pixel.
 */
export function useVirtualRange(options: UseVirtualRangeOptions) {
  const { scrollRef, itemCount, itemSize, leadingOffset = 0 } = options;
  const [range, setRange] = useState<VirtualRange>(() =>
    rangeFor(0, 0, options),
  );

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const update = () => {
      const next = rangeFor(element.scrollTop, element.clientHeight, options);
      setRange((current) => (sameRange(current, next) ? current : next));
    };

    update();
    element.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => {
      element.removeEventListener("scroll", update);
      observer.disconnect();
    };
    // `options` is rebuilt each render; only its primitives should resubscribe.
  }, [scrollRef, itemCount, itemSize, leadingOffset, options.overscan]);

  /** Scroll just enough for item `index` to be fully visible. */
  const scrollIntoView = useCallback(
    (index: number) => {
      const element = scrollRef.current;
      if (!element) return;
      const itemTop = leadingOffset + index * itemSize;
      const itemBottom = itemTop + itemSize;
      const viewTop = element.scrollTop + leadingOffset;
      const viewBottom = element.scrollTop + element.clientHeight;
      if (itemTop < viewTop) {
        element.scrollTop = itemTop - leadingOffset;
      } else if (itemBottom > viewBottom) {
        element.scrollTop = itemBottom - element.clientHeight;
      }
    },
    [scrollRef, itemSize, leadingOffset],
  );

  return { ...range, scrollIntoView };
}
