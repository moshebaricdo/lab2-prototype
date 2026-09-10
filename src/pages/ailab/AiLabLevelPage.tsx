import { useNavigate } from "react-router-dom";
import { Lab2Shell } from "../../components/lab2/Lab2Shell";
import { MarkdownInstructions } from "../../components/lab2/resource-panel/MarkdownInstructions";
import { AiLabGuidedWorkspace, AiLabWorkspace } from "../../components/ide/ailab/views";
import { useAiLabState } from "../../hooks/useAiLabState";
import { useChatState } from "../../hooks/useChatState";
import { useLayoutState } from "../../hooks/useLayoutState";
import { usePropsOverride } from "../../hooks/usePropsOverride";
import { useVersionHistoryState } from "../../hooks/useVersionHistoryState";
import type { DevPanelField } from "../../components/lab2/dev";
import type { LevelProgressLink } from "../../components/ui/header/LevelProgressBubbles";
import {
  aiLabGuidedConfig,
  aiLabGuidedSectionInstructions,
  aiLabPretrainedConfig,
  aiLabPretrainedInstructions,
  aiLabSectionInstructions,
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
  { key: "title", label: "Level title", type: "text", group: "Header" },
];

function currentLevelIndex(path: string, links: LevelProgressLink[]) {
  const index = links.findIndex((link) => link.path === path);
  return index >= 0 ? index : 0;
}

function mergeConfig(
  base: AiLabLevelConfig,
  algorithmLock: string,
  hideDatasetTab: boolean,
  hideTrainTab: boolean,
): AiLabLevelConfig {
  return {
    ...base,
    algorithmLock:
      algorithmLock === "knn" || algorithmLock === "decisionTree"
        ? (algorithmLock as AiLabAlgorithmId)
        : algorithmLock === "none"
          ? undefined
          : base.algorithmLock,
    hideDatasetTab: hideDatasetTab || Boolean(base.hideDatasetTab),
    hideTrainTab: hideTrainTab || Boolean(base.hideTrainTab),
  };
}

export function AiLabLevelPage({
  currentLevelPath = "/levels/ailab",
  title = "AI Lab: Train a model",
  subtitle = "Taco truck orders",
  config = aiLabTrainYourselfConfig,
  continueLabel = "Continue",
  continueTo = "/levels/ailab-pretrained",
  workspace = "classic",
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
    showInstructionsTab: true,
    showContinueButton: true,
    title,
  });
  const resolved = overrideResult.props;
  const levelConfig = mergeConfig(
    config,
    String(resolved.algorithmLock),
    Boolean(resolved.hideDatasetTab),
    Boolean(resolved.hideTrainTab),
  );
  const lab = useAiLabState(levelConfig);
  const levelIndex = currentLevelIndex(currentLevelPath, levelLinks);
  const progressLinks = levelLinks;
  const instructions =
    workspace === "guided"
      ? lab.section === "test"
        ? aiLabGuidedSectionInstructions.test
        : lab.trainingSetupOpen
          ? aiLabGuidedSectionInstructions.train
          : aiLabGuidedSectionInstructions.dataset
      : config.pretrained && lab.section === "test"
        ? aiLabPretrainedInstructions
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
