import { Lab2Shell } from "../../components/lab2/Lab2Shell";
import { MarkdownInstructions } from "../../components/lab2/resource-panel/MarkdownInstructions";
import type { RubricData } from "../../components/lab2/resource-panel";
import { AiChatLabWorkspace } from "../../components/ide/aichatlab/views";
import type { AiChatLabWorkspaceProps } from "../../components/ide/aichatlab/views";
import type { DevPanelField } from "../../components/lab2/dev";
import { useChatState } from "../../hooks/useChatState";
import { useLayoutState } from "../../hooks/useLayoutState";
import { usePropsOverride } from "../../hooks/usePropsOverride";
import { useVersionHistoryState } from "../../hooks/useVersionHistoryState";
import { aiChatLabLevelLinks } from "../levelTypeLinks";
import type { ChatMessage } from "../../types/chat";

interface AiChatLabDefaults extends AiChatLabWorkspaceProps {
  [key: string]: unknown;
  title: string;
  subtitle: string;
  instructionsMarkdown: string;
  showInstructionsTab: boolean;
  showRubricTab: boolean;
  showResourcesTab: boolean;
  showTeacherResourcesTab: boolean;
  showContinueButton: boolean;
  continueLabel: string;
  surfaceVariant: "edge" | "card";
}

interface AiChatLabLevelPageProps {
  currentLevelPath?: string;
  defaults?: Partial<AiChatLabDefaults>;
}

const SAMPLE_RUBRIC: RubricData = {
  name: "Prompting and model tuning",
  feedback: null,
  selectedCategoryId: null,
  categories: [
    {
      id: "prompt",
      label: "Clear prompt or goal",
      description: "The prompt gives the AI enough context to respond usefully.",
    },
    {
      id: "compare",
      label: "Compares model behavior",
      description: "The student observes how settings change the AI's output.",
    },
    {
      id: "reflect",
      label: "Explains tradeoffs",
      description: "The reflection names benefits and limitations of the chosen setup.",
    },
  ],
};

const DEFAULT_INSTRUCTIONS = [
  "# Gift Recommendations Part 2",
  "Use AI Chat to get gift recommendations for a friend.",
  "## Do This",
  "1. Try the provided prompt first.",
  "2. Read the AI Chat response.",
  "3. Change the prompt to make it about someone you know.",
  "4. Send again and compare the responses.",
  "## Try it out",
  "Notice which details make the response more specific and helpful.",
].join("\n\n");

const BASE_DEFAULTS: AiChatLabDefaults = {
  title: "AI Chat Lab: Prompting Practice",
  subtitle: "Saved a few seconds ago",
  instructionsMarkdown: DEFAULT_INSTRUCTIONS,
  showInstructionsTab: true,
  showRubricTab: false,
  showResourcesTab: true,
  showTeacherResourcesTab: false,
  showContinueButton: true,
  continueLabel: "Continue to Level 4",
  surfaceVariant: "card",
  showConfigPanel: false,
  showSetupTab: true,
  showRetrievalTab: false,
  showPublishTab: false,
  showTemperatureControl: true,
  showSystemPromptControl: false,
  showRetrievalSourceControl: false,
  showPublishNameControl: false,
  showPublishIntentControl: false,
  showPublishDescriptionControl: false,
  showPublishLimitationsControl: false,
  showPublishExamplePromptsControl: false,
  initialTemperature: 0.7,
  systemPrompt: "You are a friendly assistant who gives concise, useful advice.",
  retrievalSource: "",
  modelName: "Gift Guide Bot",
  modelIntent: "Gift recommendations",
  modelDescription: "Helps classmates brainstorm specific gift ideas.",
  modelLimitations: "May miss personal context and should avoid unsafe suggestions.",
  examplePrompts: "Give me 3 gift ideas under $30 for a friend who likes soccer.",
  initialMessages: [
    {
      role: "assistant",
      content:
        "I'm here to help with gift recommendations! Provide a prompt or describe the occasion, and I'll suggest some great gifts.",
    },
  ],
  chatPlaceholder: "Add a chat message...",
};

const AI_CHAT_LAB_DEV_FIELDS: DevPanelField[] = [
  {
    key: "showConfigPanel",
    label: "Show config column",
    type: "boolean",
    group: "Layout",
  },
  {
    key: "surfaceVariant",
    label: "Resource panel surface",
    type: "select",
    group: "Layout",
    options: [
      { label: "Edge-to-edge", value: "edge" },
      { label: "Card", value: "card" },
    ],
  },
  {
    key: "showInstructionsTab",
    label: "Show instructions tab",
    type: "boolean",
    group: "Resource panel",
  },
  {
    key: "showResourcesTab",
    label: "Show resources tab",
    type: "boolean",
    group: "Resource panel",
  },
  {
    key: "showRubricTab",
    label: "Show rubric tab",
    type: "boolean",
    group: "Resource panel",
  },
  {
    key: "showTeacherResourcesTab",
    label: "Show teacher resources tab",
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
    key: "showSetupTab",
    label: "Show setup tab",
    type: "boolean",
    group: "Config tabs",
    visibleWhen: (values) => Boolean(values.showConfigPanel),
  },
  {
    key: "showRetrievalTab",
    label: "Show retrieval tab",
    type: "boolean",
    group: "Config tabs",
    visibleWhen: (values) => Boolean(values.showConfigPanel),
  },
  {
    key: "showPublishTab",
    label: "Show publish tab",
    type: "boolean",
    group: "Config tabs",
    visibleWhen: (values) => Boolean(values.showConfigPanel),
  },
  {
    key: "showTemperatureControl",
    label: "Show temperature",
    type: "boolean",
    group: "Setup controls",
    visibleWhen: (values) => Boolean(values.showConfigPanel && values.showSetupTab),
  },
  {
    key: "initialTemperature",
    label: "Default temperature",
    type: "slider",
    min: 0,
    max: 1,
    step: 0.1,
    group: "Setup controls",
    visibleWhen: (values) =>
      Boolean(values.showConfigPanel && values.showSetupTab && values.showTemperatureControl),
  },
  {
    key: "showSystemPromptControl",
    label: "Show system prompt",
    type: "boolean",
    group: "Setup controls",
    visibleWhen: (values) => Boolean(values.showConfigPanel && values.showSetupTab),
  },
  {
    key: "systemPrompt",
    label: "System prompt",
    type: "textarea",
    rows: 5,
    group: "Setup controls",
    visibleWhen: (values) =>
      Boolean(values.showConfigPanel && values.showSetupTab && values.showSystemPromptControl),
  },
  {
    key: "showRetrievalSourceControl",
    label: "Show retrieval notes",
    type: "boolean",
    group: "Retrieval controls",
    visibleWhen: (values) => Boolean(values.showConfigPanel && values.showRetrievalTab),
  },
  {
    key: "retrievalSource",
    label: "Retrieval notes",
    type: "textarea",
    rows: 5,
    group: "Retrieval controls",
    visibleWhen: (values) =>
      Boolean(
        values.showConfigPanel &&
          values.showRetrievalTab &&
          values.showRetrievalSourceControl,
      ),
  },
  {
    key: "showPublishNameControl",
    label: "Show model name",
    type: "boolean",
    group: "Publish controls",
    visibleWhen: (values) => Boolean(values.showConfigPanel && values.showPublishTab),
  },
  {
    key: "showPublishIntentControl",
    label: "Show intent",
    type: "boolean",
    group: "Publish controls",
    visibleWhen: (values) => Boolean(values.showConfigPanel && values.showPublishTab),
  },
  {
    key: "showPublishDescriptionControl",
    label: "Show description",
    type: "boolean",
    group: "Publish controls",
    visibleWhen: (values) => Boolean(values.showConfigPanel && values.showPublishTab),
  },
  {
    key: "showPublishLimitationsControl",
    label: "Show limitations",
    type: "boolean",
    group: "Publish controls",
    visibleWhen: (values) => Boolean(values.showConfigPanel && values.showPublishTab),
  },
  {
    key: "showPublishExamplePromptsControl",
    label: "Show example prompts",
    type: "boolean",
    group: "Publish controls",
    visibleWhen: (values) => Boolean(values.showConfigPanel && values.showPublishTab),
  },
  {
    key: "instructionsMarkdown",
    label: "Instructions markdown",
    type: "textarea",
    rows: 8,
    group: "Content",
  },
  {
    key: "chatPlaceholder",
    label: "Chat placeholder",
    type: "text",
    group: "Content",
  },
  {
    key: "title",
    label: "Level title",
    type: "text",
    group: "Header",
  },
  {
    key: "subtitle",
    label: "Subtitle",
    type: "text",
    group: "Header",
  },
];

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
    showTemperatureControl: Boolean(resolved.showTemperatureControl),
    showSystemPromptControl: Boolean(resolved.showSystemPromptControl),
    showRetrievalSourceControl: Boolean(resolved.showRetrievalSourceControl),
    showPublishNameControl: Boolean(resolved.showPublishNameControl),
    showPublishIntentControl: Boolean(resolved.showPublishIntentControl),
    showPublishDescriptionControl: Boolean(resolved.showPublishDescriptionControl),
    showPublishLimitationsControl: Boolean(resolved.showPublishLimitationsControl),
    showPublishExamplePromptsControl: Boolean(resolved.showPublishExamplePromptsControl),
    initialTemperature: Number(resolved.initialTemperature),
    systemPrompt: String(resolved.systemPrompt),
    retrievalSource: String(resolved.retrievalSource),
    modelName: String(resolved.modelName),
    modelIntent: String(resolved.modelIntent),
    modelDescription: String(resolved.modelDescription),
    modelLimitations: String(resolved.modelLimitations),
    examplePrompts: String(resolved.examplePrompts),
    initialMessages: resolved.initialMessages as ChatMessage[],
    chatPlaceholder: String(resolved.chatPlaceholder),
  };
}

export function AiChatLabLevelPage({
  currentLevelPath = "/levels/aichatlab",
  defaults,
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
  const levelIndex = currentLevelIndex(currentLevelPath);

  return (
    <Lab2Shell
      topNavigationProps={{
        title: String(resolved.title),
        subtitle: String(resolved.subtitle),
        currentLevel: levelIndex + 1,
        totalLevels: aiChatLabLevelLinks.length,
        completedLevels: Array.from({ length: levelIndex }, (_, index) => index + 1),
        levelLinks: aiChatLabLevelLinks,
        currentLevelPath,
      }}
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
        showContinueButton: Boolean(resolved.showContinueButton),
        continueLabel: String(resolved.continueLabel),
        surfaceVariant: resolved.surfaceVariant === "edge" ? "edge" : "card",
        instructionsContent: (
          <MarkdownInstructions markdown={String(resolved.instructionsMarkdown)} />
        ),
        devPanelFields: AI_CHAT_LAB_DEV_FIELDS,
        devPanelOverrideResult: overrideResult,
      }}
      onResize={(delta) => {
        setSidebarWidth((prev) => Math.max(280, Math.min(520, prev + delta)));
      }}
    >
      <AiChatLabWorkspace {...toWorkspaceProps(resolved)} />
    </Lab2Shell>
  );
}

export function AiChatLabSetupLevelPage() {
  return (
    <AiChatLabLevelPage
      currentLevelPath="/levels/aichatlab-setup"
      defaults={{
        title: "AI Chat Lab: Model Setup",
        showConfigPanel: true,
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
        title: "AI Chat Lab: Model Card",
        showConfigPanel: true,
        showRetrievalTab: true,
        showPublishTab: true,
        showSystemPromptControl: true,
        showRetrievalSourceControl: true,
        showPublishNameControl: true,
        showPublishIntentControl: true,
        showPublishDescriptionControl: true,
        showPublishLimitationsControl: true,
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
