import { useEffect, useState } from "react";

/**
 * One overflow menu at a time, closed on pointerdown outside it.
 * CADS listens for a bubbling click, and outline controls stop that
 * click, so a page menu and a question menu could stay open together.
 */
export function useSingleOutlineMenu() {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (!openMenuId) return;
    const menuId = openMenuId;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element) || !isEventInsideOutlineMenu(target, menuId)) {
        setOpenMenuId((current) => (current === menuId ? null : current));
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [openMenuId]);

  return (id: string) => ({
    menuId: id,
    menuOpen: openMenuId === id,
    onMenuOpenChange: (open: boolean) => {
      setOpenMenuId((current) => {
        if (open) return id;
        return current === id ? null : current;
      });
    },
  });
}

export function outlineMenuDropdownProps(menu: {
  menuOpen?: boolean;
  onMenuOpenChange?: (open: boolean) => void;
}): { open?: boolean; onOpenChange?: (open: boolean) => void } {
  if (menu.menuOpen === undefined || !menu.onMenuOpenChange) return {};
  return { open: menu.menuOpen, onOpenChange: menu.onMenuOpenChange };
}

function isEventInsideOutlineMenu(target: Element, menuId: string): boolean {
  const root = document.querySelector(
    `[data-outline-menu="${CSS.escape(menuId)}"]`,
  );
  if (root?.contains(target)) return true;
  const panel = target.closest("[data-cads-dropdown-menu]");
  if (!(panel instanceof HTMLElement) || !root) return false;
  const triggerId = panel.getAttribute("aria-labelledby");
  if (!triggerId) return false;
  const trigger = document.getElementById(triggerId);
  return trigger != null && root.contains(trigger);
}
