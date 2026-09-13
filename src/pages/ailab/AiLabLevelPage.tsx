import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Lab2Shell } from "../../components/lab2/Lab2Shell";
import { MarkdownInstructions } from "../../components/lab2/resource-panel/MarkdownInstructions";
import { AiLabGuidedWorkspace, AiLabWorkspace } from "../../components/ide/ailab/views";
import { useAiLabState } from "../../hooks/useAiLabState";
import { useChatState } from "../../hooks/useChatState";
import { useLayoutState } from "../../hooks/useLayoutState";
import { usePropsOverride } from "../../hooks/usePropsOverride";
import { useVersionHistoryState } from "../../hooks/useVersionHistoryState";
import { resourcePanelCompactDevField, type DevPanelField } from "../../components/lab2/dev";
import type { LevelProgressLink } from "../../components/ui/header/LevelProgressBubbles";
import {
  aiLabGuidedConfig,
  aiLabGuidedSectionInstructions,
  aiLabPretrainedConfig,
  aiLabPretrainedInstructions,
  aiLabSectionInstructions,
  aiLabStudioCatalog,
  aiLabStudioSectionInstructions,
  aiLabTrainYourselfConfig,
} from "../../data/ailab";
import { aiLabGuidedLevelLinks, aiLabLevelLinks } from "../levelTypeLinks";
import type { AiLabAlgorithmId, AiLabLevelConfig, AiLabSection } from "../../types/aiLab";

interface AiLabLevelPageProps {
  currentLevelPath?: string;
  title?: string;
  subtitle?: string;
  config?: AiLabLevelConfig;
  continueLabel?: string;
  continueTo?: string;
  workspace?: "classic" | "guided";
  levelLinks?: LevelProgressLink[];
}

const AI_LAB_DEV_FIELDS: DevPanelField[] = [
  {
    key: "algorithmLock",
    label: "Lock algorithm",
    type: "select",
    group: "AI Lab",
    options: [
      { label: "Student chooses", value: "none" },
      { label: "K-Nearest Neighbors", value: "knn" },
      { label: "Decision Tree", value: "decisionTree" },
    ],
  },
  {
    key: "hideDatasetTab",
    label: "Hide Dataset tab",
    type: "boolean",
    group: "AI Lab",
  },
  {
    key: "hideTrainTab",
    label: "Hide Train tab",
    type: "boolean",
    group: "AI Lab",
  },
  {
    key: "studioPreset",
    label: "Studio preset",
    type: "select",
    group: "AI Lab",
    description: "P0 hides dataset choice, the scorecard, and export. Full is the end-state studio.",
    options: [
      { label: "P0 — train and test only", value: "p0" },
      { label: "Full studio", value: "full" },
    ],
  },
  {
    key: "testLayout",
    label: "Testing layout",
    type: "select",
    group: "AI Lab",
    description:
      "Dock keeps the Input → Output footer. Canvas floats the trace toolbar, input card, and prediction card over the visualization.",
    options: [
      { label: "Dock — Input → Output footer", value: "dock" },
      { label: "Canvas — floating cards", value: "canvas" },
    ],
  },
  {
    key: "allowDatasetPicker",
    label: "Allow dataset picker",
    type: "boolean",
    group: "AI Lab",
    visibleWhen: (values) => values.studioPreset === "full",
  },
  {
    key: "showModelDetails",
    label: "Show model scorecard",
    type: "boolean",
    group: "AI Lab",
    visibleWhen: (values) => values.studioPreset === "full",
  },
  {
    key: "showExport",
    label: "Show export / model card",
    type: "boolean",
    group: "AI Lab",
    visibleWhen: (values) => values.studioPreset === "full",
  },
  {
    key: "showInstructionsTab",
    label: "Show instructions tab",
    type: "boolean",
    group: "Resource panel",
  },
  {
    key: "showContinueButton",
    label: "Show continue button",
    type: "boolean",
    group: "Resource panel",
  },
  {
    key: "enableSidebarCollapse",
    label: "Enable sidebar collapse",
    description:
      "Show the rail control that collapses or expands the resource panel.",
    type: "boolean",
    group: "Resource panel",
  },
  {
    key: "collapseSidebarByDefault",
    label: "Collapse sidebar by default",
    description:
      "Start the resource panel collapsed when sidebar collapse is enabled.",
    type: "boolean",
    group: "Resource panel",
    visibleWhen: (values) => Boolean(values.enableSidebarCollapse),
  },
  resourcePanelCompactDevField,
  { key: "title", label: "Level title", type: "text", group: "Header" },
];

function currentLevelIndex(path: string, links: LevelProgressLink[]) {
  const index = links.findIndex((link) => link.path === path);
  return index >= 0 ? index : 0;
}

function mergeConfig(
  base: AiLabLevelConfig,
  resolved: {
    algorithmLock: string;
    hideDatasetTab: boolean;
    hideTrainTab: boolean;
    studioPreset: string;
    allowDatasetPicker: boolean;
    showModelDetails: boolean;
    showExport: boolean;
    testLayout: string;
  },
): AiLabLevelConfig {
  const isFull = resolved.studioPreset === "full";
  const allowPicker = Boolean(resolved.allowDatasetPicker);
  const showExport = isFull && Boolean(resolved.showExport);
  const showModelDetails = isFull
    ? Boolean(resolved.showModelDetails) || showExport
    : Boolean(base.pretrained);

  return {
    ...base,
    algorithmLock:
      resolved.algorithmLock === "knn" ||
      resolved.algorithmLock === "decisionTree"
        ? (resolved.algorithmLock as AiLabAlgorithmId)
        : resolved.algorithmLock === "none"
          ? undefined
          : base.algorithmLock,
    hideDatasetTab: resolved.hideDatasetTab || Boolean(base.hideDatasetTab),
    hideTrainTab: resolved.hideTrainTab || Boolean(base.hideTrainTab),
    lockDataset: isFull ? !allowPicker : true,
    requireDatasetChoice: isFull && allowPicker,
    availableDatasets:
      isFull && allowPicker
        ? base.availableDatasets?.length
          ? base.availableDatasets
          : aiLabStudioCatalog
        : [base.dataset],
    showModelDetails,
    showExport,
    testLayout: resolved.testLayout === "canvas" ? "canvas" : "dock",
  };
}

export function AiLabLevelPage({
  currentLevelPath = "/levels/ailab",
  title = "AI Lab: Train a model",
  subtitle = "Studio",
  config = aiLabTrainYourselfConfig,
  continueLabel = "Continue",
  continueTo = "/levels/ailab-pretrained",
  workspace = "guided",
  levelLinks = aiLabLevelLinks,
}: AiLabLevelPageProps = {}) {
  const navigate = useNavigate();
  const {
    activeTab,
    setActiveTab,
    isSettingsOpen,
    setIsSettingsOpen,
    sidebarWidth,
    setSidebarWidth,
  } = useLayoutState("instructions");
  const { chatMessages, setChatMessages, chatInput, setChatInput } = useChatState([]);
  const versionHistoryState = useVersionHistoryState();
  const overrideResult = usePropsOverride({
    algorithmLock: config.algorithmLock ?? "none",
    hideDatasetTab: Boolean(config.hideDatasetTab),
    hideTrainTab: Boolean(config.hideTrainTab),
    studioPreset:
      !config.lockDataset && config.requireDatasetChoice ? "full" : "p0",
    allowDatasetPicker: true,
    showModelDetails: true,
    showExport: true,
    testLayout: config.testLayout ?? "dock",
    showInstructionsTab: true,
    showContinueButton: true,
    enableSidebarCollapse: false,
    collapseSidebarByDefault: false,
    resourcePanelCompact: false,
    title,
  });
  const resolved = overrideResult.props;
  const algorithmLock = String(resolved.algorithmLock);
  const hideDatasetTab = Boolean(resolved.hideDatasetTab);
  const hideTrainTab = Boolean(resolved.hideTrainTab);
  const studioPreset = String(resolved.studioPreset);
  const allowDatasetPicker = Boolean(resolved.allowDatasetPicker);
  const showModelDetails = Boolean(resolved.showModelDetails);
  const showExport = Boolean(resolved.showExport);
  const testLayout = String(resolved.testLayout);
  // Keyed on primitives so the config (and everything `useAiLabState`
  // derives from it) keeps its identity across unrelated page re-renders.
  const levelConfig = useMemo(
    () =>
      mergeConfig(config, {
        algorithmLock,
        hideDatasetTab,
        hideTrainTab,
        studioPreset,
        allowDatasetPicker,
        showModelDetails,
        showExport,
        testLayout,
      }),
    [
      config,
      algorithmLock,
      hideDatasetTab,
      hideTrainTab,
      studioPreset,
      allowDatasetPicker,
      showModelDetails,
      showExport,
      testLayout,
    ],
  );
  const lab = useAiLabState(levelConfig);
  const levelIndex = currentLevelIndex(currentLevelPath, levelLinks);
  const progressLinks = levelLinks;
  const studioInstructions =
    levelConfig.showModelDetails ||
    levelConfig.showExport ||
    levelConfig.requireDatasetChoice;
  const instructions =
    config.pretrained && lab.section === "test"
      ? aiLabPretrainedInstructions
      : studioInstructions
        ? lab.section === "test"
          ? aiLabStudioSectionInstructions.test
          : aiLabStudioSectionInstructions.dataset
        : workspace === "guided"
          ? lab.section === "test"
            ? aiLabGuidedSectionInstructions.test
            : aiLabGuidedSectionInstructions.dataset
          : aiLabSectionInstructions[lab.section as AiLabSection];

  return (
    <Lab2Shell
      topNavigationProps={{
        title: String(resolved.title),
        subtitle,
        currentLevel: levelIndex + 1,
        totalLevels: progressLinks.length,
        completedLevels: Array.from({ length: levelIndex }, (_, index) => index + 1),
        levelLinks: progressLinks,
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
        showAiTutorTab: false,
        showHistoryTab: false,
        showBackpackTab: false,
        showContinueButton: Boolean(resolved.showContinueButton),
        collapsible: Boolean(resolved.enableSidebarCollapse),
        defaultCollapsed:
          Boolean(resolved.enableSidebarCollapse) &&
          Boolean(resolved.collapseSidebarByDefault),
        compact: Boolean(resolved.resourcePanelCompact),
        continueLabel,
        onContinue: () => navigate(continueTo ?? "/levels"),
        surfaceVariant: "edge",
        instructionsContent: <MarkdownInstructions markdown={instructions} />,
        devPanelFields: AI_LAB_DEV_FIELDS,
        devPanelOverrideResult: overrideResult,
      }}
      onResize={(delta) => {
        setSidebarWidth((prev) => Math.max(280, Math.min(520, prev + delta)));
      }}
    >
      {workspace === "guided" ? (
        <AiLabGuidedWorkspace lab={lab} />
      ) : (
        <AiLabWorkspace lab={lab} />
      )}
    </Lab2Shell>
  );
}

export function AiLabPretrainedLevelPage() {
  return (
    <AiLabLevelPage
      currentLevelPath="/levels/ailab-pretrained"
      title="AI Lab: Audit a model"
      subtitle="Pre-trained decision tree"
      config={aiLabPretrainedConfig}
      continueLabel="Finish"
      continueTo="/levels"
    />
  );
}

export function AiLabGuidedLevelPage() {
  return (
    <AiLabLevelPage
      currentLevelPath="/levels/ailab-guided"
      title="AI Lab: Train a model"
      subtitle="Guided taco-truck studio"
      config={aiLabGuidedConfig}
      continueLabel="Finish"
      continueTo="/levels"
      workspace="guided"
      levelLinks={aiLabGuidedLevelLinks}
    />
  );
}
