import type {
  ChatAttachment,
  ChatMessage,
  NewProjectPlanAnswers,
} from "../../../../../types/chat";
import type { FaIconName } from "../../../../../icons/faProRegularCodepoints";

type NewProjectPlanAnswerKey = keyof NewProjectPlanAnswers;

interface NewProjectPlanQuestionField {
  id: NewProjectPlanAnswerKey;
  label: string;
  placeholder: string;
  required?: boolean;
  choices?: Array<{
    label: string;
    value: string;
    iconName: FaIconName;
  }>;
}

export const EMPTY_NEW_PROJECT_PLAN_ANSWERS: NewProjectPlanAnswers = {
  projectIdea: "",
  audience: "",
  coreInteraction: "",
  visualStyle: "",
};

export const NEW_PROJECT_PLAN_QUESTION_FIELDS = [
  {
    id: "projectIdea",
    label: "What is your app, and what should it do?",
    placeholder: "A space quiz that tracks score, a recipe finder that filters meals, a city guide with clickable places...",
    required: true,
  },
  {
    id: "visualStyle",
    label: "What should it look and feel like?",
    placeholder: "Or describe another style...",
    required: true,
    choices: [
      {
        label: "Playful",
        value: "Playful",
        iconName: "party-horn",
      },
      {
        label: "Simple",
        value: "Simple",
        iconName: "sparkles",
      },
      {
        label: "Futuristic",
        value: "Futuristic",
        iconName: "rocket",
      },
      {
        label: "Cozy",
        value: "Cozy",
        iconName: "moon",
      },
      {
        label: "Natural",
        value: "Natural",
        iconName: "leaf",
      },
      {
        label: "Elegant",
        value: "Elegant",
        iconName: "gem",
      },
    ],
  },
] satisfies NewProjectPlanQuestionField[];

export function normalizeNewProjectPlanAnswers(
  answers: NewProjectPlanAnswers,
): NewProjectPlanAnswers {
  return {
    projectIdea: answers.projectIdea.trim(),
    audience: answers.audience.trim(),
    coreInteraction: answers.coreInteraction.trim(),
    visualStyle: answers.visualStyle.trim(),
  };
}

export function createNewProjectPlanQuestionnaireMessage(): ChatMessage {
  return {
    role: "assistant",
    content:
      "Before I create the first plan, answer two quick questions so the plan starts with your idea instead of a blank template.",
    newProjectPlanQuestionnaire: {
      status: "pending",
    },
  };
}

export function buildNewProjectPlanPrompt(
  answers: NewProjectPlanAnswers,
  moodboardAttachments: ChatAttachment[] = [],
) {
  const normalized = normalizeNewProjectPlanAnswers(answers);
  const moodboardNames = moodboardAttachments
    .map((attachment) => attachment.fileName)
    .join(", ");
  const detailLines = [
    `App idea and behavior: ${normalized.projectIdea}`,
    normalized.audience ? `Audience: ${normalized.audience}` : null,
    normalized.coreInteraction
      ? `Core interaction: ${normalized.coreInteraction}`
      : null,
    normalized.visualStyle ? `Visual style or vibe: ${normalized.visualStyle}` : null,
    moodboardNames
      ? `Moodboard image reference(s): ${moodboardNames}. Use the attached image context as the visual direction.`
      : null,
  ].filter(Boolean);

  return [
    "Help me create a plan for a new beginner-friendly web app project.",
    "Use these answers from the new-project questionnaire as the source of truth:",
    "",
    ...detailLines,
    "",
    "Create a practical Markdown project plan before building any app files.",
    "Make reasonable assumptions for missing optional details and include only the most important open questions.",
  ].join("\n");
}
