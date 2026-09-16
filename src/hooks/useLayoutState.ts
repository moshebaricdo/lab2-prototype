import { useMemo, useState } from "react";

export type ResourcePanelTab =
  | "instructions"
  | "checklist"
  | "ai-tutor"
  | "history"
  | "backpack"
  | "classroom"
  | "rubric"
  | "resources"
  | "builder-bank"
  | "builder-settings"
  | "dev";

export interface UseLayoutStateOptions {
  sidebarWidth?: number;
}

export function useLayoutState(
  initialTab: ResourcePanelTab = "ai-tutor",
  options: UseLayoutStateOptions = {},
) {
  const [activeTab, setActiveTab] = useState<ResourcePanelTab>(initialTab);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(options.sidebarWidth ?? 400);

  return useMemo(
    () => ({
      activeTab,
      setActiveTab,
      isSettingsOpen,
      setIsSettingsOpen,
      sidebarWidth,
      setSidebarWidth,
    }),
    [activeTab, isSettingsOpen, sidebarWidth],
  );
}
