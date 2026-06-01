import type { ActiveLevelShareMode } from "../hooks/useLevelShareMode";

export interface ShareLinkDropdownItem {
  id: string;
  label: string;
  iconName: "lock" | "diagram-project";
  onSelect: () => void;
}

interface ShareLinkActionHandlers {
  onLockedLevel: () => void;
  onLockedProgression: () => void;
  onFlow: () => void;
}

export function buildShareLinkDropdownItems(
  options: { showLockedProgression: boolean },
  handlers: ShareLinkActionHandlers,
): ShareLinkDropdownItem[] {
  const items: ShareLinkDropdownItem[] = [
    {
      id: "locked-level-share",
      label: "Share locked level",
      iconName: "lock",
      onSelect: handlers.onLockedLevel,
    },
  ];

  if (options.showLockedProgression) {
    items.push({
      id: "locked-progression-share",
      label: "Share locked progression",
      iconName: "lock",
      onSelect: handlers.onLockedProgression,
    });
  }

  items.push({
    id: "flow-share",
    label: "Flow share link",
    iconName: "diagram-project",
    onSelect: handlers.onFlow,
  });

  return items;
}

export type LockedShareCopyMode = Extract<
  ActiveLevelShareMode,
  "locked-level" | "locked-progression"
>;
