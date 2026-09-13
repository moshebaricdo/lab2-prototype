import { useCallback, useRef } from "react";

/**
 * CADS `Dropdown menuType="checklist"` ignores `menuWidth` and hugs its
 * content, so a `width="full"` field can open a menu narrower than itself.
 * Until CADS respects the prop, this syncs the portaled menu panel to the
 * trigger's rendered width on open.
 *
 * Usage: wrap the Dropdown in an element that receives `ref`, and pass
 * `onOpenChange` through.
 */
export function useChecklistMenuWidth<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  const onOpenChange = useCallback((open: boolean) => {
    if (!open) return;
    // Two frames: the Popper mounts, then positions/sizes itself.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const trigger = ref.current?.querySelector("button");
        const menus = document.querySelectorAll<HTMLElement>(
          "[data-cads-dropdown-menu]",
        );
        const menu = menus[menus.length - 1];
        if (!trigger || !menu) return;
        const width = `${Math.round(trigger.getBoundingClientRect().width)}px`;
        const popper = menu.parentElement;
        if (popper) {
          popper.style.width = width;
          popper.style.minWidth = width;
        }
        menu.style.width = width;
        menu.style.minWidth = width;
        menu.style.setProperty("--dd-panel-width", width);
        menu.style.setProperty("--dd-panel-min-width", width);
      });
    });
  }, []);

  return { ref, onOpenChange };
}
