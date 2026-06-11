import { useCallback, useState } from "react";
import { backpackItemToChatAttachment } from "../../lib/backpack/backpackItemToChatAttachment";
import type { BackpackItem } from "../../types/backpack";
import type { ChatAttachment } from "../../types/chat";
import { Lab2Shell } from "../../components/lab2/Lab2Shell";
import { MarkdownInstructions } from "../../components/lab2/resource-panel/MarkdownInstructions";
import { AiChatLabWorkspace } from "../../components/ide/aichatlab/views";
import type { AiChatLabWorkspaceProps } from "../../components/ide/aichatlab/views";
import { useChatState } from "../../hooks/useChatState";
import { useLayoutState } from "../../hooks/useLayoutState";
import { usePropsOverride } from "../../hooks/usePropsOverride";
import { useVersionHistoryState } from "../../hooks/useVersionHistoryState";
import { aiChatLabLevelLinks } from "../levelTypeLinks";
import type { ChatMessage } from "../../types/chat";
import {
  AI_CHAT_LAB_DEV_FIELDS,
  BASE_DEFAULTS,
  SAMPLE_RUBRIC,
  type AiChatLabDefaults,
} from "./aiChatLabPageConfig";

interface AiChatLabLevelPageProps {
  currentLevelPath?: string;
  defaults?: Partial<AiChatLabDefaults>;
  hideProgression?: boolean;
}

function currentLevelIndex(path: string) {
  const index = aiChatLabLevelLinks.findIndex((link) => link.path === path);
  return index >= 0 ? index : 0;
}

function mergeDefaults(defaults?: Partial<AiChatLabDefaults>): AiChatLabDefaults {
  return {
    ...BASE_DEFAULTS,
    ...defaults,
  };
}

function toWorkspaceProps(resolved: AiChatLabDefaults): AiChatLabWorkspaceProps {
  return {
    showConfigPanel: Boolean(resolved.showConfigPanel),
    showSetupTab: Boolean(resolved.showSetupTab),
    showRetrievalTab: Boolean(resolved.showRetrievalTab),
    showPublishTab: Boolean(resolved.showPublishTab),
    showModelControl: Boolean(resolved.showModelControl),
    showTemperatureControl: Boolean(resolved.showTemperatureControl),
    showSystemPromptControl: Boolean(resolved.showSystemPromptControl),
    showRetrievalSourceControl: Boolean(resolved.showRetrievalSourceControl),
    showPublishNameControl: Boolean(resolved.showPublishNameControl),
    showPublishIntentControl: Boolean(resolved.showPublishIntentControl),
    showPublishDescriptionControl: Boolean(resolved.showPublishDescriptionControl),
    showPublishLimitationsControl: Boolean(resolved.showPublishLimitationsControl),
    showPublishTestingControl: Boolean(resolved.showPublishTestingControl),
    showPublishExamplePromptsControl: Boolean(resolved.showPublishExamplePromptsControl),
    initialModel: String(resolved.initialModel),
    initialTemperature: Number(resolved.initialTemperature),
    systemPrompt: String(resolved.systemPrompt),
    retrievalSource: String(resolved.retrievalSource),
    modelName: String(resolved.modelName),
    modelIntent: String(resolved.modelIntent),
    modelDescription: String(resolved.modelDescription),
    modelLimitations: String(resolved.modelLimitations),
    modelTestingEvaluation: String(resolved.modelTestingEvaluation),
    examplePrompts: String(resolved.examplePrompts),
    initialMessages: resolved.initialMessages as ChatMessage[],
    chatPlaceholder: String(resolved.chatPlaceholder),
  };
}

export function AiChatLabLevelPage({
  currentLevelPath = "/levels/aichatlab",
  defaults,
  hideProgression,
}: AiChatLabLevelPageProps = {}) {
  const {
    activeTab,
    setActiveTab,
    isSettingsOpen,
    setIsSettingsOpen,
    sidebarWidth,
    setSidebarWidth,
  } = useLayoutState();
  const sidebarChatState = useChatState([]);
  const versionHistoryState = useVersionHistoryState();
  const overrideResult = usePropsOverride(mergeDefaults(defaults));
  const resolved = overrideResult.props;
  const [isShareModeActive, setIsShareModeActive] = useState(false);
  const levelIndex = currentLevelIndex(currentLevelPath);
  const handleImportBackpackItem = useCallback((item: BackpackItem) => {
    const attachment = backpackItemToChatAttachment(item);
    const detail: { attachment: ChatAttachment; result: true | string } = {
      attachment,
      result: true,
    };
    window.dispatchEvent(
      new CustomEvent("weblab:add-backpack-item-to-chat", { detail }),
    );
    if (detail.result === true) {
      window.dispatchEvent(new CustomEvent("weblab:focus-tutor-input"));
    }
    return detail.result;
  }, []);
  const surfaceVariant = resolved.surfaceVariant === "edge" ? "edge" : "card";
  const continueInHeader = resolved.continueButtonPlacement === "header";
  const showContinueButton = Boolean(resolved.showContinueButton);
  const topNavigationProps = {
    title: String(resolved.title),
    subtitle: String(resolved.subtitle),
    currentLevel: levelIndex + 1,
    totalLevels: aiChatLabLevelLinks.length,
    completedLevels: Array.from({ length: levelIndex }, (_, index) => index + 1),
    levelLinks: aiChatLabLevelLinks,
    currentLevelPath,
    showContinueButton: showContinueButton && continueInHeader,
    continueLabel: String(resolved.continueLabel),
    hideProgression,
  };
  const workspace = (
    <AiChatLabWorkspace
      {...toWorkspaceProps(resolved)}
      isShareModeActive={isShareModeActive}
      onShareModeChange={setIsShareModeActive}
    />
  );

  if (isShareModeActive) {
    return (
      <Lab2Shell
        topNavigationProps={topNavigationProps}
        hideResourcePanel={true}
      >
        {workspace}
      </Lab2Shell>
    );
  }

  return (
    <Lab2Shell
      topNavigationProps={topNavigationProps}
      sidebarProps={{
        activeTab,
        setActiveTab,
        sidebarWidth,
        isSettingsOpen,
        setIsSettingsOpen,
        chatMessages: sidebarChatState.chatMessages,
        setChatMessages: sidebarChatState.setChatMessages,
        chatInput: sidebarChatState.chatInput,
        setChatInput: sidebarChatState.setChatInput,
        selectedHistoryVersion: versionHistoryState.selectedHistoryVersion,
        setSelectedHistoryVersion: versionHistoryState.setSelectedHistoryVersion,
        showRestoreSuccessAlert: versionHistoryState.showRestoreSuccessAlert,
        setShowRestoreSuccessAlert: versionHistoryState.setShowRestoreSuccessAlert,
        showSaveSuccessAlert: versionHistoryState.showSaveSuccessAlert,
        setShowSaveSuccessAlert: versionHistoryState.setShowSaveSuccessAlert,
        showInstructionsTab: Boolean(resolved.showInstructionsTab),
        showAiTutorTab: false,
        showHistoryTab: false,
        showRubricTab: Boolean(resolved.showRubricTab),
        showTeacherResourcesTab: Boolean(resolved.showTeacherResourcesTab),
        showStudentLessonResource: Boolean(resolved.showResourcesTab),
        showDocumentationResource: Boolean(resolved.showResourcesTab),
        showWalkthroughResources: Boolean(resolved.showResourcesTab),
        rubricData: SAMPLE_RUBRIC,
        showContinueButton: showContinueButton && !continueInHeader,
        continueLabel: String(resolved.continueLabel),
        collapsible: surfaceVariant === "card",
        defaultCollapsed: false,
        surfaceVariant,
        compact: Boolean(resolved.resourcePanelCompact),
        instructionsContent: (
          <MarkdownInstructions markdown={String(resolved.instructionsMarkdown)} />
        ),
        devPanelFields: AI_CHAT_LAB_DEV_FIELDS,
        devPanelOverrideResult: overrideResult,
        backpackImportLab: "aichatlab",
        onImportBackpackItem: handleImportBackpackItem,
      }}
      onResize={(delta) => {
        setSidebarWidth((prev) => Math.max(280, Math.min(520, prev + delta)));
      }}
    >
      {workspace}
    </Lab2Shell>
  );
}

export function AiChatLabSetupLevelPage() {
  return (
    <AiChatLabLevelPage
      currentLevelPath="/levels/aichatlab-setup"
      defaults={{
        title: "Setup Only Level",
        continueLabel: "Continue to Level 3",
        showConfigPanel: true,
        showModelControl: true,
        showSystemPromptControl: false,
        initialTemperature: 0.4,
        instructionsMarkdown: [
          "# Step 3: Tune the Model",
          "Use the temperature slider to compare more predictable and more creative responses.",
          "## Do This",
          "1. Ask the AI for three project ideas.",
          "2. Lower the temperature and send the same prompt again.",
          "3. Raise the temperature and compare what changes.",
        ].join("\n\n"),
        initialMessages: [
          {
            role: "assistant",
            content:
              "Hello! Ask me for ideas, then adjust temperature to see how my style changes.",
          },
        ],
      }}
    />
  );
}

export function AiChatLabModelCardLevelPage() {
  return (
    <AiChatLabLevelPage
      currentLevelPath="/levels/aichatlab-model-card"
      defaults={{
        title: "Full Model Config Level",
        continueLabel: "Finish",
        showConfigPanel: true,
        showRetrievalTab: true,
        showPublishTab: true,
        showModelControl: true,
        showSystemPromptControl: true,
        showRetrievalSourceControl: true,
        showPublishNameControl: true,
        showPublishIntentControl: true,
        showPublishDescriptionControl: true,
        showPublishLimitationsControl: true,
        showPublishTestingControl: true,
        showPublishExamplePromptsControl: true,
        showRubricTab: true,
        initialTemperature: 0.7,
        systemPrompt:
          "You are a classroom chatbot. Answer with helpful, age-appropriate explanations and ask a follow-up question when useful.",
        retrievalSource:
          "The class is designing AI helpers for common school tasks. Students should document who the model helps, what it should avoid, and example prompts that show intended use.",
        instructionsMarkdown: [
          "# Step 5: Make your Model Card",
          "Follow the instructions on your activity guide to make your model card, then publish the chatbot.",
          "Use this level for Step 6: User Testing as well.",
        ].join("\n\n"),
        initialMessages: [
          {
            role: "assistant",
            content: "Hello! How can I assist you today?",
          },
        ],
        chatPlaceholder: "This is a message",
      }}
    />
  );
}
