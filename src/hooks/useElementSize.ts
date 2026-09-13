import { useLayoutEffect, useRef, useState } from "react";

export interface ElementSize {
  width: number;
  height: number;
}

/**
 * Content-box size of a DOM element, kept current with `ResizeObserver`.
 * Returns `{ 0, 0 }` until the first measurement so layouts can skip work
 * before the element has room.
 */
export function useElementSize<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => {
      const next = {
        width: element.clientWidth,
        height: element.clientHeight,
      };
      setSize((current) =>
        current.width === next.width && current.height === next.height
          ? current
          : next,
      );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, size };
}
