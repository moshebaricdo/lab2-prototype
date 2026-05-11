import { useMemo, useState } from "react";

export function useLayoutState() {
  const [activeTab, setActiveTab] = useState<
    | "instructions"
    | "checklist"
    | "ai-tutor"
    | "history"
    | "classroom"
    | "rubric"
    | "resources"
    | "dev"
  >("ai-tutor");
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
