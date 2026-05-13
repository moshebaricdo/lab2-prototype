import type { DevPanelField } from "../../components/lab2/dev";
import { globalEditorDevFields } from "../../components/lab2/dev";
import type {
  RubricData,
  RubricSubmissionStatus,
} from "../../components/lab2/resource-panel/views/RubricPanel";
import type { ViewMode } from "../../types/ui";
import {
  STARTER_CODE_UPLOAD_ACCEPT,
  STARTER_UPLOAD_MAX_FILES,
  STARTER_UPLOAD_MAX_TOTAL_SIZE_BYTES,
} from "../../components/ide/weblab2/webLab2Uploads";

export const INSTRUCTIONS_MARKDOWN_DEV_KEY = "instructionsMarkdown";
export const STARTER_CODE_UPLOAD_DEV_KEY = "starterCodeUpload";

export type VersionHistoryMode = "mock" | "functional";
export type RubricDevStatus = RubricSubmissionStatus | "not-graded";

const DEFAULT_RUBRIC_CATEGORIES = [
  {
    id: "extensive",
    label: "Extensive Evidence",
    description:
      "All stated requirements are fully met; layout and styling are intentional, consistent, and accessible. Code is organized and easy to follow.",
  },
  {
    id: "convincing",
    label: "Convincing Evidence",
    description:
      "Most requirements are met with minor gaps; design is mostly consistent. Small issues do not block understanding.",
  },
  {
    id: "limited",
    label: "Limited Evidence",
    description:
      "Some requirements are partially addressed; several gaps remain or the page is hard to use on common screen sizes.",
  },
  {
    id: "none",
    label: "No Evidence",
    description:
      "The submission does not show meaningful progress toward the stated requirements.",
  },
];

export const DEFAULT_RUBRIC_DATA: RubricData = {
  name: "Project rubric",
  feedback: null,
  categories: DEFAULT_RUBRIC_CATEGORIES,
  selectedCategoryId: null,
};

export function resolveViewMode(value: unknown): ViewMode {
  return value === "preview" || value === "split" ? value : "code";
}

export function resolveVersionHistoryMode(value: unknown): VersionHistoryMode {
  return value === "functional" ? "functional" : "mock";
}

export function resolveRubricDevStatus(value: unknown): RubricDevStatus {
  if (value === "complete" || value === "needs-revisions") return value;
  return "not-graded";
}

export function normalizeRubricData(data: RubricData | RubricData[] | undefined): RubricData[] {
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
}

export function getInitialRubricStatus(rubric: RubricData): RubricDevStatus {
  return rubric.selectedCategoryId
    ? rubric.submissionStatus ?? "complete"
    : "not-graded";
}

export function getInitialRubricCategoryId(rubric: RubricData) {
  return rubric.selectedCategoryId ?? rubric.categories[0]?.id ?? "";
}

export function getRubricCategoryOptions(rubrics: RubricData[]) {
  const categories = rubrics[0]?.categories ?? DEFAULT_RUBRIC_CATEGORIES;
  return categories.map((category) => ({
    label: category.label,
    value: category.id,
  }));
}

export function buildRubricsDevFields(
  rubricCategoryOptions: { label: string; value: string }[],
): DevPanelField[] {
  return [
    {
      key: "showRubricTab",
      label: "Show rubric panel",
      description: "Toggle the Rubric tab in the resource panel.",
      type: "boolean",
      group: "Rubrics",
    },
    {
      key: "rubricTeacherFeedback",
      label: "Teacher feedback",
      description: "Feedback text shown at the top of the rubric panel.",
      type: "textarea",
      rows: 5,
      group: "Rubrics",
      visibleWhen: (values) => Boolean(values.showRubricTab),
    },
    {
      key: "rubricName",
      label: "Rubric name",
      description: "Title shown at the top of the rubric panel.",
      type: "text",
      group: "Rubrics",
      visibleWhen: (values) => Boolean(values.showRubricTab),
    },
    {
      key: "rubricStatus",
      label: "Mark status",
      description: "Controls the rubric status pill and whether a level is selected.",
      type: "select",
      options: [
        { label: "Complete", value: "complete" },
        { label: "Needs work", value: "needs-revisions" },
        { label: "Not graded", value: "not-graded" },
      ],
      group: "Rubrics",
      visibleWhen: (values) => Boolean(values.showRubricTab),
    },
    {
      key: "rubricSelectedCategoryId",
      label: "Checked rubric level",
      description: "Rubric level marked by the teacher.",
      type: "select",
      options: rubricCategoryOptions,
      group: "Rubrics",
      visibleWhen: (values) =>
        Boolean(values.showRubricTab) && values.rubricStatus !== "not-graded",
    },
  ];
}

const webLab2ChromeDevFields: DevPanelField[] = [
  {
    key: "title",
    label: "Level title",
    description: "Primary text in the top navigation.",
    type: "text",
    group: "Level chrome",
  },
  {
    key: "continueButtonPlacement",
    label: "Continue button",
    description: "Move the Continue action between the header and sidebar footer.",
    type: "select",
    options: [
      { label: "Sidebar", value: "sidebar" },
      { label: "Header", value: "header" },
    ],
    group: "Level chrome",
  },
];

const webLab2ResourcePanelDevFields: DevPanelField[] = [
  {
    key: "showInstructionsDrawer",
    label: "Show instructions drawer",
    description: "Toggle the collapsible instructions affordance in AI Tutor.",
    type: "boolean",
    group: "Resource panel",
  },
  {
    key: "enableSidebarCollapse",
    label: "Enable sidebar collapse",
    description: "Show the rail control that collapses or expands the resource panel.",
    type: "boolean",
    group: "Resource panel",
  },
  {
    key: "collapseSidebarByDefault",
    label: "Collapse sidebar by default",
    description: "Start the resource panel collapsed when sidebar collapse is enabled.",
    type: "boolean",
    group: "Resource panel",
    visibleWhen: (values) => Boolean(values.enableSidebarCollapse),
  },
  {
    key: INSTRUCTIONS_MARKDOWN_DEV_KEY,
    label: "Instructions markdown",
    description: "Markdown rendered inside the instructions drawer and share links.",
    type: "textarea",
    rows: 8,
    group: "Resource panel",
    visibleWhen: (values) => Boolean(values.showInstructionsDrawer),
  },
  {
    key: "instructionsDrawerInitialHeightRatio",
    label: "Drawer height ratio",
    description: "Starting height for the AI Tutor instructions drawer.",
    type: "slider",
    min: 0.2,
    max: 0.8,
    step: 0.05,
    group: "Resource panel",
  },
];

export const webLab2ResourcesTabDevFields: DevPanelField[] = [
  {
    key: "showStudentLessonResource",
    label: "Show student lesson resources",
    description: "Toggle the Resources tab card for associated student lesson materials.",
    type: "boolean",
    group: "Resources tab",
  },
  {
    key: "showDocumentationResource",
    label: "Show documentation",
    description: "Toggle the Resources tab card for lab documentation.",
    type: "boolean",
    group: "Resources tab",
  },
  {
    key: "showWalkthroughResources",
    label: "Show walkthroughs",
    description: "Toggle the Resources tab card listing available level walkthroughs.",
    type: "boolean",
    group: "Resources tab",
  },
];

const webLab2TutorDevFields: DevPanelField[] = [
  {
    key: "tutorModeKind",
    label: "AI tutor mode",
    description: "Switch between scripted mock responses and the functional tutor harness.",
    type: "select",
    options: [
      { label: "Mock", value: "mock" },
      { label: "Functional", value: "functional" },
    ],
    group: "AI Tutor",
  },
  {
    key: "showTutorModelSelector",
    label: "Show mode selector",
    description: "Toggle the tutor composer Auto, Build, Plan, and Help dropdown.",
    type: "boolean",
    group: "AI Tutor",
  },
  {
    key: "autoSeedTutorConversation",
    label: "Auto-seed tutor chat",
    description: "Start the mock tutor with its configured conversation seed.",
    type: "boolean",
    group: "AI Tutor",
    visibleWhen: (values) => values.tutorModeKind !== "functional",
  },
  {
    key: "additionalTutorPrompt",
    label: "Additional system prompt",
    description: "Prompt addendum for functional tutor calls. This setting is encoded in share links.",
    type: "textarea",
    rows: 6,
    group: "AI Tutor",
  },
];

const webLab2WorkspaceDevFields: DevPanelField[] = [
  {
    key: "initialViewMode",
    label: "Default workspace view",
    description: "Choose which workspace view opens first.",
    type: "select",
    options: [
      { label: "Code", value: "code" },
      { label: "Preview", value: "preview" },
      { label: "Split", value: "split" },
    ],
    group: "Workspace",
  },
  {
    key: "collapseFileManagerByDefault",
    label: "Collapse file manager on load",
    description: "Start the code view with the file manager collapsed.",
    type: "boolean",
    group: "Workspace",
  },
  {
    key: "useFilePreview",
    label: "Use file preview",
    description: "Render the preview iframe from the current project files.",
    type: "boolean",
    group: "Workspace",
  },
  {
    key: "enableDesignMode",
    label: "Enable design mode",
    description: "Allow selecting preview elements and editing supported styles.",
    type: "boolean",
    group: "Workspace",
    visibleWhen: (values) => Boolean(values.useFilePreview),
  },
  {
    key: STARTER_CODE_UPLOAD_DEV_KEY,
    label: "Upload starter code",
    description:
      "Upload text starter files. Save/share links embed small uploads directly in the URL.",
    type: "file",
    accept: STARTER_CODE_UPLOAD_ACCEPT,
    multiple: true,
    maxFiles: STARTER_UPLOAD_MAX_FILES,
    maxTotalSizeBytes: STARTER_UPLOAD_MAX_TOTAL_SIZE_BYTES,
    buttonLabel: "Upload starter files",
    group: "Workspace",
    storage: "session",
  },
];

const webLab2VersionHistoryDevFields: DevPanelField[] = [
  {
    key: "versionHistoryMode",
    label: "Version history mode",
    description: "Switch between the static mock timeline and live file snapshots.",
    type: "select",
    options: [
      { label: "Mock", value: "mock" },
      { label: "Functional", value: "functional" },
    ],
    group: "Version history",
    visibleWhen: (values) => Boolean(values.useFilePreview),
  },
];

export const webLab2BaseDevFields: DevPanelField[] = [
  ...webLab2ChromeDevFields,
  ...webLab2ResourcePanelDevFields,
  ...webLab2TutorDevFields,
  ...webLab2WorkspaceDevFields,
  ...webLab2VersionHistoryDevFields,
  ...globalEditorDevFields,
];

export function applyRubricDevSettings(
  rubrics: RubricData[],
  options: {
    name: string;
    feedback: string;
    status: RubricDevStatus;
    selectedCategoryId: string;
  },
): RubricData[] {
  return rubrics.map((rubric) => {
    const { submissionStatus: _submissionStatus, ...rubricRest } = rubric;
    const selectedCategoryId =
      options.status === "not-graded"
        ? null
        : rubric.categories.some((category) => category.id === options.selectedCategoryId)
          ? options.selectedCategoryId
          : rubric.categories[0]?.id ?? null;

    return {
      ...rubricRest,
      name: options.name.trim() ? options.name : rubric.name,
      feedback: options.feedback.trim() ? options.feedback : null,
      selectedCategoryId,
      ...(options.status === "not-graded"
        ? {}
        : { submissionStatus: options.status }),
    };
  });
}
