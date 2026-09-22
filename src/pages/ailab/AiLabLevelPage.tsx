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
  aiLabP0Config,
  aiLabP0Instructions,
  aiLabPretrainedConfig,
  aiLabPretrainedInstructions,
  aiLabSectionInstructions,
  aiLabStudioCatalog,
  aiLabStudioSectionInstructions,
  aiLabTrainYourselfConfig,
} from "../../data/ailab";
import {
  aiLabDevDefaults,
  cardTitleColumnDevOptions,
  datasetDevOptions,
  findCatalogDataset,
  labelColumnDevOptions,
  mergeAiLabDevConfig,
  uniqueDevCatalog,
} from "../../lib/aiLab";
import {
  aiLabGuidedLevelLinks,
  aiLabLevelLinks,
  aiLabP0LevelLinks,
} from "../levelTypeLinks";
import type { AiLabLevelConfig, AiLabSection } from "../../types/aiLab";

interface AiLabLevelPageProps {
  currentLevelPath?: string;
  title?: string;
  subtitle?: string;
  config?: AiLabLevelConfig;
  continueLabel?: string;
  continueTo?: string;
  workspace?: "classic" | "guided";
  levelLinks?: LevelProgressLink[];
  /** When set, replaces the computed section instructions. */
  instructionsMarkdown?: string;
  /** Continue is the only door; header bubbles stay display-only. */
  disableProgressionLinks?: boolean;
  /** Override path-based step index (single-route progressions). */
  progressLevelIndex?: number;
  /** When set, Continue calls this instead of navigating to `continueTo`. */
  onContinue?: () => void;
  /** Single-route progressions: jump to a step by bubble index. */
  onProgressLevelSelect?: (index: number) => void;
  /** Initial resource panel width in px (default 400). */
  resourcePanelWidth?: number;
}

function aiLabDevFields(
  catalog: ReturnType<typeof uniqueDevCatalog>,
  labelDataset: (typeof catalog)[number],
): DevPanelField[] {
  return [
    {
      key: "algorithmLock",
      label: "Pre-set algorithm",
      description:
        "Lock KNN or Decision Tree so the student does not choose. Student chooses keeps the setup picker.",
      type: "select",
      group: "AI Lab",
      options: [
        { label: "Student chooses", value: "none" },
        { label: "K-Nearest Neighbors", value: "knn" },
        { label: "Decision Tree", value: "decisionTree" },
      ],
    },
    {
      key: "presetDataset",
      label: "Pre-set dataset",
      description:
        "Lock a catalog dataset so the sheet opens with it. Student chooses keeps the setup picker.",
      type: "select",
      group: "AI Lab",
      options: datasetDevOptions(catalog),
    },
    {
      key: "presetLabelColumn",
      label: "Label column",
      description:
        "The column students predict (Predict: in the Train rail). Locking Type on Bird / mammal / fish is the curriculum default.",
      type: "select",
      group: "AI Lab",
      options: labelColumnDevOptions(labelDataset),
    },
    {
      key: "cardTitleColumn",
      label: "Card title column",
      description:
        "Use a column's value as the Cards heading (e.g. Animal → Hawk) instead of Row N. The pager still says Row N of N.",
      type: "select",
      group: "AI Lab",
      options: cardTitleColumnDevOptions(labelDataset),
      visibleWhen: (values) => values.workspaceTabs !== "test",
    },
    {
      key: "workspaceTabs",
      label: "Workspace tabs",
      description:
        "Testing only loads a trained model (Iris Species unless a dataset is pre-set). Data Set only hides Testing and combines with the other flags.",
      type: "select",
      group: "AI Lab",
      options: [
        { label: "Data Set and Testing", value: "both" },
        { label: "Data Set only", value: "dataset" },
        { label: "Testing only", value: "test" },
      ],
    },
    {
      key: "hideTrainPanel",
      label: "Hide train panel",
      description:
        "Hide the TRAIN rail on Data Set. When this is on and Testing is available, the level loads a pre-trained model.",
      type: "boolean",
      group: "AI Lab",
      visibleWhen: (values) => values.workspaceTabs !== "test",
    },
    {
      key: "defaultDataView",
      label: "Default dataset view",
      type: "select",
      group: "AI Lab",
      options: [
        { label: "Table", value: "table" },
        { label: "Cards", value: "cards" },
      ],
      visibleWhen: (values) => values.workspaceTabs !== "test",
    },
    {
      key: "bundleWideSplits",
      label: "Bundle wide tree splits",
      description:
        "When a decision splits 7+ ways, leaves that predict the same label fold into one bundle per outcome (click to open). Off leaves the wide split as-is.",
      type: "boolean",
      group: "AI Lab",
      visibleWhen: (values) =>
        values.workspaceTabs !== "dataset" && values.algorithmLock !== "knn",
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
}

function currentLevelIndex(path: string, links: LevelProgressLink[]) {
  const index = links.findIndex((link) => link.path === path);
  return index >= 0 ? index : 0;
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
  instructionsMarkdown,
  disableProgressionLinks = false,
  progressLevelIndex,
  onContinue,
  onProgressLevelSelect,
  resourcePanelWidth,
}: AiLabLevelPageProps = {}) {
  const navigate = useNavigate();
  const catalog = useMemo(
    () => uniqueDevCatalog(config.dataset, aiLabStudioCatalog),
    [config.dataset],
  );
  const {
    activeTab,
    setActiveTab,
    isSettingsOpen,
    setIsSettingsOpen,
    sidebarWidth,
    setSidebarWidth,
  } = useLayoutState("instructions", { sidebarWidth: resourcePanelWidth });
  const { chatMessages, setChatMessages, chatInput, setChatInput } = useChatState([]);
  const versionHistoryState = useVersionHistoryState();
  const defaults = aiLabDevDefaults(config);
  const overrideResult = usePropsOverride({
    ...defaults,
    showInstructionsTab: true,
    showContinueButton: true,
    enableSidebarCollapse: false,
    collapseSidebarByDefault: false,
    resourcePanelCompact: false,
    title,
  });
  const resolved = overrideResult.props;
  const algorithmLock = String(resolved.algorithmLock);
  const presetDataset = String(resolved.presetDataset);
  const presetLabelColumn = String(resolved.presetLabelColumn);
  const cardTitleColumn = String(resolved.cardTitleColumn);
  const workspaceTabs = String(resolved.workspaceTabs);
  const hideTrainPanel = Boolean(resolved.hideTrainPanel);
  const defaultDataView = String(resolved.defaultDataView);
  const bundleWideSplits = Boolean(resolved.bundleWideSplits);
  const labelDataset =
    findCatalogDataset(catalog, presetDataset) ?? config.dataset;
  // Keyed on primitives so the config (and everything `useAiLabState`
  // derives from it) keeps its identity across unrelated page re-renders.
  const levelConfig = useMemo(
    () =>
      mergeAiLabDevConfig(
        config,
        {
          algorithmLock,
          presetDataset,
          presetLabelColumn,
          cardTitleColumn,
          workspaceTabs,
          hideTrainPanel,
          defaultDataView,
          bundleWideSplits,
        },
        catalog,
      ),
    [
      config,
      catalog,
      algorithmLock,
      presetDataset,
      presetLabelColumn,
      cardTitleColumn,
      workspaceTabs,
      hideTrainPanel,
      defaultDataView,
      bundleWideSplits,
    ],
  );
  const lab = useAiLabState(levelConfig);
  const levelIndex =
    progressLevelIndex ?? currentLevelIndex(currentLevelPath, levelLinks);
  const progressLinks = levelLinks;
  const studioInstructions =
    levelConfig.showModelDetails ||
    levelConfig.showExport ||
    levelConfig.requireDatasetChoice;
  const p0Instructions = config === aiLabP0Config;
  const instructions =
    instructionsMarkdown ??
    (p0Instructions
      ? lab.section === "test"
        ? aiLabP0Instructions.test
        : aiLabP0Instructions.dataset
      : config.pretrained && lab.section === "test"
        ? aiLabPretrainedInstructions
        : studioInstructions
          ? lab.section === "test"
            ? aiLabStudioSectionInstructions.test
            : aiLabStudioSectionInstructions.dataset
          : workspace === "guided"
            ? lab.section === "test"
              ? aiLabGuidedSectionInstructions.test
              : aiLabGuidedSectionInstructions.dataset
            : aiLabSectionInstructions[lab.section as AiLabSection]);
  const devPanelFields = useMemo(
    () => aiLabDevFields(catalog, labelDataset),
    [catalog, labelDataset],
  );

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
        disableProgressionLinks,
        onProgressLevelSelect,
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
        onContinue: onContinue ?? (() => navigate(continueTo ?? "/levels")),
        surfaceVariant: "edge",
        instructionsContent: <MarkdownInstructions markdown={instructions} />,
        devPanelFields,
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

export function AiLabP0LevelPage() {
  return (
    <AiLabLevelPage
      currentLevelPath="/levels/ailab-p0"
      title="AI Lab: Train a model"
      subtitle="P0"
      config={aiLabP0Config}
      continueLabel="Finish"
      continueTo="/levels"
      levelLinks={aiLabP0LevelLinks}
    />
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

