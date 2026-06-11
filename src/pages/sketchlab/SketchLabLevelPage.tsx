import { useCallback, useRef } from "react";
import { Lab2Shell } from "../../components/lab2/Lab2Shell";
import { MarkdownInstructions } from "../../components/lab2/resource-panel/MarkdownInstructions";
import { SketchLabWorkspace } from "../../components/ide/sketchlab/views";
import { useChatState } from "../../hooks/useChatState";
import { useLayoutState } from "../../hooks/useLayoutState";
import { usePropsOverride } from "../../hooks/usePropsOverride";
import { useVersionHistoryState } from "../../hooks/useVersionHistoryState";
import type { DevPanelField } from "../../components/lab2/dev";
import {
  sketchLabInitialChatMessages,
  sketchLabInstructionsMarkdown,
  sketchLabStarterEdges,
  sketchLabStarterNodes,
} from "../../data/sketchlab";
import type { BackpackItem } from "../../types/backpack";
import type { SketchLegacyEdge, SketchNode } from "../../types/sketchLab";
import { sketchLabLevelLinks } from "../levelTypeLinks";

interface SketchLabLevelPageProps {
  currentLevelPath?: string;
  title?: string;
  subtitle?: string;
  initialNodes?: SketchNode[];
  initialEdges?: SketchLegacyEdge[];
  instructionsMarkdown?: string;
}

const sketchLabDevFields: DevPanelField[] = [
  { key: "showInstructionsTab", label: "Show instructions tab", type: "boolean", group: "Resource panel" },
  { key: "showAiTutorTab", label: "Show AI tutor tab", type: "boolean", group: "Resource panel" },
  { key: "showContinueButton", label: "Show continue button", type: "boolean", group: "Resource panel" },
  { key: "continueLabel", label: "Continue label", type: "text", group: "Resource panel" },
  { key: "title", label: "Level title", type: "text", group: "Header" },
  { key: "subtitle", label: "Subtitle", type: "text", group: "Header" },
];

function currentLevelIndex(path: string) {
  const index = sketchLabLevelLinks.findIndex((link) => link.path === path);
  return index >= 0 ? index : 0;
}

export function SketchLabLevelPage({
  currentLevelPath = "/levels/sketchlab",
  title = "Sketch Lab: Plan Your Project",
  subtitle = "Saved a few seconds ago",
  initialNodes = sketchLabStarterNodes,
  initialEdges = sketchLabStarterEdges,
  instructionsMarkdown = sketchLabInstructionsMarkdown,
}: SketchLabLevelPageProps = {}) {
  const {
    activeTab,
    setActiveTab,
    isSettingsOpen,
    setIsSettingsOpen,
    sidebarWidth,
    setSidebarWidth,
  } = useLayoutState();
  const { chatMessages, setChatMessages, chatInput, setChatInput } = useChatState(
    sketchLabInitialChatMessages,
    "",
    { storageKey: `sketchlab:${currentLevelPath}:chat` },
  );
  const versionHistoryState = useVersionHistoryState();
  const backpackImportRef = useRef<(item: BackpackItem) => true | string>(() =>
    "Sketch canvas is not ready yet.",
  );
  const handleImportBackpackItem = useCallback(
    (item: BackpackItem) => backpackImportRef.current(item),
    [],
  );

  const overrideResult = usePropsOverride({
    showInstructionsTab: true,
    showAiTutorTab: true,
    showContinueButton: true,
    continueLabel: "Continue",
    title,
    subtitle,
  });
  const resolved = overrideResult.props;
  const levelIndex = currentLevelIndex(currentLevelPath);

  return (
    <Lab2Shell
      topNavigationProps={{
        title: String(resolved.title),
        subtitle: String(resolved.subtitle),
        currentLevel: levelIndex + 1,
        totalLevels: sketchLabLevelLinks.length,
        completedLevels: Array.from({ length: levelIndex }, (_, index) => index + 1),
        levelLinks: sketchLabLevelLinks,
        currentLevelPath,
      }}
      sidebarProps={{
        activeTab,
        setActiveTab,
        sidebarWidth,
        isSettingsOpen,
        setIsSettingsOpen,
        chatMessages,
        setChatMessages,
        chatInput,
        setChatInput,
        selectedHistoryVersion: versionHistoryState.selectedHistoryVersion,
        setSelectedHistoryVersion: versionHistoryState.setSelectedHistoryVersion,
        showRestoreSuccessAlert: versionHistoryState.showRestoreSuccessAlert,
        setShowRestoreSuccessAlert: versionHistoryState.setShowRestoreSuccessAlert,
        showSaveSuccessAlert: versionHistoryState.showSaveSuccessAlert,
        setShowSaveSuccessAlert: versionHistoryState.setShowSaveSuccessAlert,
        showInstructionsTab: Boolean(resolved.showInstructionsTab),
        showAiTutorTab: Boolean(resolved.showAiTutorTab),
        showHistoryTab: false,
        showContinueButton: Boolean(resolved.showContinueButton),
        continueLabel: String(resolved.continueLabel),
        surfaceVariant: "edge",
        instructionsContent: <MarkdownInstructions markdown={instructionsMarkdown} />,
        aiTutorComposerPlaceholder: "Ask for sketching help...",
        aiTutorEmptyStateTitle: "Ask the Sketch Tutor",
        aiTutorEmptyStateText:
          "Describe what you want to diagram and the tutor can suggest shapes and connections.",
        devPanelFields: sketchLabDevFields,
        devPanelOverrideResult: overrideResult,
        backpackImportLab: "sketch-lab",
        onImportBackpackItem: handleImportBackpackItem,
      }}
      onResize={(delta) => {
        setSidebarWidth((prev) => Math.max(300, Math.min(600, prev + delta)));
      }}
    >
      <SketchLabWorkspace
        initialNodes={initialNodes}
        initialEdges={initialEdges}
        storageKey={`sketchlab:${currentLevelPath}:canvas`}
        onRegisterBackpackImport={(handler) => {
          backpackImportRef.current = handler;
        }}
      />
    </Lab2Shell>
  );
}

export function SketchLabBlankProjectLevelPage() {
  return (
    <SketchLabLevelPage
      currentLevelPath="/levels/sketchlab-blank"
      title="Sketch Lab: Blank Canvas"
      initialNodes={[]}
      initialEdges={[]}
      instructionsMarkdown={[
        "# Blank canvas",
        "Start from an empty whiteboard. Add shapes, text, and images from the toolbar, then connect them with lines.",
      ].join("\n\n")}
    />
  );
}
