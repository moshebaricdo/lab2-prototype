import type { ActiveLevelShareMode } from "../hooks/useLevelShareMode";

export interface ShareLinkDropdownItem {
  id: string;
  label: string;
  iconName: "lock" | "diagram-project";
  onSelect: () => void;
}

interface ShareLinkActionHandlers {
  onLockedLevel: () => void;
  onFlow: () => void;
}

export function buildShareLinkDropdownItems(
  handlers: ShareLinkActionHandlers,
): ShareLinkDropdownItem[] {
  return [
    {
      id: "locked-level-share",
      label: "Share locked level",
      iconName: "lock",
      onSelect: handlers.onLockedLevel,
    },
    {
      id: "flow-share",
      label: "Flow share link",
      iconName: "diagram-project",
      onSelect: handlers.onFlow,
    },
  ];
}

export type LockedShareCopyMode = Extract<ActiveLevelShareMode, "locked-level">;
