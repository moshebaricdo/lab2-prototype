import type { RubricData } from "../../components/lab2/resource-panel";
import type { DevPanelField } from "../../components/lab2/dev";
import { resourcePanelCompactDevField } from "../../components/lab2/dev";
import type { AiChatLabWorkspaceProps } from "../../components/ide/aichatlab/views";

export interface AiChatLabDefaults extends AiChatLabWorkspaceProps {
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
  continueButtonPlacement: "sidebar" | "header";
  surfaceVariant: "edge" | "card";
  resourcePanelCompact: boolean;
}

export const SAMPLE_RUBRIC: RubricData = {
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

export const BASE_DEFAULTS: AiChatLabDefaults = {
  title: "Chat Only Level",
  subtitle: "Saved a few seconds ago",
  instructionsMarkdown: DEFAULT_INSTRUCTIONS,
  showInstructionsTab: true,
  showRubricTab: false,
  showResourcesTab: true,
  showTeacherResourcesTab: false,
  showContinueButton: true,
  continueLabel: "Continue to Level 2",
  continueButtonPlacement: "sidebar",
  surfaceVariant: "card",
  resourcePanelCompact: false,
  showConfigPanel: false,
  showSetupTab: true,
  showRetrievalTab: false,
  showPublishTab: false,
  showModelControl: false,
  showTemperatureControl: true,
  showSystemPromptControl: false,
  showRetrievalSourceControl: false,
  showPublishNameControl: false,
  showPublishIntentControl: false,
  showPublishDescriptionControl: false,
  showPublishLimitationsControl: false,
  showPublishTestingControl: false,
  showPublishExamplePromptsControl: false,
  initialModel: "gpt-4o-mini",
  initialTemperature: 0.7,
  systemPrompt: "You are a friendly assistant who gives concise, useful advice.",
  retrievalSource: "",
  modelName: "Gift Guide Bot",
  modelIntent: "Gift recommendations",
  modelDescription: "Helps classmates brainstorm specific gift ideas.",
  modelLimitations: "May miss personal context and should avoid unsafe suggestions.",
  modelTestingEvaluation:
    "Try several prompts and compare whether the responses stay helpful, safe, and specific.",
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

export const AI_CHAT_LAB_DEV_FIELDS: DevPanelField[] = [
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
  resourcePanelCompactDevField,
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
    group: "Continue button",
  },
  {
    key: "continueButtonPlacement",
    label: "Continue button placement",
    type: "select",
    group: "Continue button",
    visibleWhen: (values) => Boolean(values.showContinueButton),
    options: [
      { label: "Sidebar", value: "sidebar" },
      { label: "Header", value: "header" },
    ],
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
    key: "showModelControl",
    label: "Show model selector",
    type: "boolean",
    group: "Setup controls",
    visibleWhen: (values) => Boolean(values.showConfigPanel && values.showSetupTab),
  },
  {
    key: "initialModel",
    label: "Default model",
    type: "select",
    group: "Setup controls",
    visibleWhen: (values) =>
      Boolean(values.showConfigPanel && values.showSetupTab && values.showModelControl),
    options: [
      { label: "GPT-4o mini", value: "gpt-4o-mini" },
      { label: "Claude Sonnet", value: "claude-sonnet" },
      { label: "Gemini Flash", value: "gemini-flash" },
    ],
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
    label: "Show intended use",
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
    label: "Show limitations and warnings",
    type: "boolean",
    group: "Publish controls",
    visibleWhen: (values) => Boolean(values.showConfigPanel && values.showPublishTab),
  },
  {
    key: "showPublishTestingControl",
    label: "Show testing and evaluation",
    type: "boolean",
    group: "Publish controls",
    visibleWhen: (values) => Boolean(values.showConfigPanel && values.showPublishTab),
  },
  {
    key: "showPublishExamplePromptsControl",
    label: "Show example prompts and topics",
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
