import { useMemo, useState } from "react";

export type ResourcePanelTab =
  | "instructions"
  | "checklist"
  | "ai-tutor"
  | "history"
  | "classroom"
  | "rubric"
  | "resources"
  | "dev";

export function useLayoutState(initialTab: ResourcePanelTab = "ai-tutor") {
  const [activeTab, setActiveTab] = useState<ResourcePanelTab>(initialTab);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(400);

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
