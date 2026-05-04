import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Lab2Shell } from "../components/lab2/Lab2Shell";
import {
  Workspace,
  CreateFileModal,
  NameInputModal,
} from "../components/ide/weblab2/views";
import {
  DefaultProjectPreview,
  fileStructure,
  initialChatMessages,
  defaultMockTutorConfig,
} from "../data/weblab2";
import type { ChatMessage, FileChange } from "../types/chat";
import { useChatState } from "../hooks/useChatState";
import { useFileWorkspaceState } from "../hooks/useFileWorkspaceState";
import { useLayoutState } from "../hooks/useLayoutState";
import { useVersionHistoryState } from "../hooks/useVersionHistoryState";
import {
  buildPreviewSrcDoc,
  getPreviewHtmlFiles,
} from "../components/ide/weblab2/views/buildPreviewSrcDoc";
import { applyPreviewDesignEdit } from "../components/ide/weblab2/views/previewDesignEdits";
import { usePropsOverride } from "../hooks/usePropsOverride";
import type { DevPanelField, DevPanelUploadedFile } from "../components/lab2/dev";
import { globalEditorDevFields } from "../components/lab2/dev";
import {
  EDITOR_READ_ONLY_STORAGE_KEY,
  setEditorReadOnlyOverride,
} from "../hooks/useEditorReadOnly";
import { useLevelShareMode } from "../hooks/useLevelShareMode";
import { webLab2LevelLinks } from "./levelTypeLinks";
import type { InstructionsDrawerVisualCue } from "../components/lab2/resource-panel/InstructionsDrawer";
import { MarkdownInstructions } from "../components/lab2/resource-panel/MarkdownInstructions";
import type {
  RubricData,
  RubricSubmissionStatus,
} from "../components/lab2/resource-panel/views/RubricPanel";
import { tutorClient } from "../lib/tutor/tutorClient";
import { PROJECT_PLAN_FILE } from "../lib/tutor/planningRunner";
import {
  decodeStarterSharePayload,
  encodeStarterSharePayload,
  STARTER_SHARE_PARAM,
  starterSharePayloadToUpload,
} from "../lib/starterShare";
import type { FileItem, FileKind } from "../types/file";
import type {
  AiTutorInputExperiment,
  MockTutorConfig,
  TutorContextFile,
  TutorMode,
  TutorRequestMode,
} from "../types/tutor";
import type { ViewMode } from "../types/ui";
import type { WebLabPreviewConfig } from "../components/ide/weblab2/views/PreviewPanel";
import type {
  PreviewDesignApplyRequest,
  PreviewDesignElementDescriptor,
} from "../components/ide/weblab2/views/PreviewPanel";

const INSTRUCTIONS_MARKDOWN_DEV_KEY = "instructionsMarkdown";
const STARTER_CODE_UPLOAD_DEV_KEY = "starterCodeUpload";
const FIXED_SAVED_SUBTITLE = "Saved a few seconds ago";
const STARTER_PROJECT_TUTOR_PROMPT =
  "Help me start a new web project. Suggest a simple HTML, CSS, and JavaScript starter structure and create the first files for me.";
const STARTER_UPLOAD_ACCEPT = ".html,.htm,.css,.js,.json,.txt,.md";
const STARTER_UPLOAD_MAX_FILES = 32;
const STARTER_UPLOAD_MAX_TOTAL_SIZE_BYTES = 500_000;
const OPEN_TUTOR_PANEL_EVENT = "weblab:open-tutor-panel";
const TUTOR_PANEL_READY_EVENT = "weblab:tutor-panel-ready";
const FOCUS_TUTOR_INPUT_EVENT = "weblab:focus-tutor-input";
const NON_ROOT_WRAPPER_FOLDERS = new Set(["Plans"]);

type VersionHistoryMode = "mock" | "functional";
type RubricDevStatus = RubricSubmissionStatus | "not-graded";

interface StarterCodeUploadValue {
  files?: DevPanelUploadedFile[];
  uploadedAt?: string;
}

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

const DEFAULT_RUBRIC_DATA: RubricData = {
  name: "Project rubric",
  feedback: null,
  categories: DEFAULT_RUBRIC_CATEGORIES,
  selectedCategoryId: null,
};

function resolveViewMode(value: unknown): ViewMode {
  return value === "preview" || value === "split" ? value : "code";
}

function resolveVersionHistoryMode(value: unknown): VersionHistoryMode {
  return value === "functional" ? "functional" : "mock";
}

function resolveRubricDevStatus(value: unknown): RubricDevStatus {
  if (value === "complete" || value === "needs-revisions") return value;
  return "not-graded";
}

function normalizeRubricData(data: RubricData | RubricData[] | undefined): RubricData[] {
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
}

function getInitialRubricStatus(rubric: RubricData): RubricDevStatus {
  return rubric.selectedCategoryId
    ? rubric.submissionStatus ?? "complete"
    : "not-graded";
}

function getInitialRubricCategoryId(rubric: RubricData) {
  return rubric.selectedCategoryId ?? rubric.categories[0]?.id ?? "";
}

function getRubricCategoryOptions(rubrics: RubricData[]) {
  const categories = rubrics[0]?.categories ?? DEFAULT_RUBRIC_CATEGORIES;
  return categories.map((category) => ({
    label: category.label,
    value: category.id,
  }));
}

function buildRubricsDevFields(rubricCategoryOptions: { label: string; value: string }[]): DevPanelField[] {
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

const webLab2ResourcesTabDevFields: DevPanelField[] = [
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
    accept: STARTER_UPLOAD_ACCEPT,
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

const webLab2BaseDevFields: DevPanelField[] = [
  ...webLab2ChromeDevFields,
  ...webLab2ResourcePanelDevFields,
  ...webLab2TutorDevFields,
  ...webLab2WorkspaceDevFields,
  ...webLab2VersionHistoryDevFields,
  ...globalEditorDevFields,
];

function flattenTutorContextFiles(files: FileItem[], parentPath = ""): TutorContextFile[] {
  return files.flatMap((item) => {
    const path = parentPath ? `${parentPath}/${item.name}` : item.name;
    if (item.children) {
      return flattenTutorContextFiles(item.children, path);
    }
    if (item.proposedStatus === "deleted") return [];
    if (item.type === "image") return [];
    return [{
      fileName: item.name,
      path,
      type: item.type,
      content: item.proposedStatus ? item.proposedContent ?? "" : item.content ?? "",
    }];
  });
}

function findFileByNameInTree(tree: FileItem[], name: string): FileItem | null {
  for (const item of tree) {
    if (item.name === name && item.type !== "folder") return item;
    if (item.children) {
      const found = findFileByNameInTree(item.children, name);
      if (found) return found;
    }
  }
  return null;
}

function normalizeFileLookupPath(path: string) {
  return path.replace(/\\/g, "/").replace(/^\/+/, "").replace(/^\.\//, "");
}

function pathBasename(path: string) {
  const normalized = normalizeFileLookupPath(path);
  return normalized.split("/").filter(Boolean).at(-1) ?? normalized;
}

function findFileEntryInTree(
  tree: FileItem[],
  fileName: string,
  parentPath = "",
  rootName = tree.length === 1 &&
    tree[0].type === "folder" &&
    !NON_ROOT_WRAPPER_FOLDERS.has(tree[0].name)
    ? tree[0].name
    : "",
): { file: FileItem; path: string } | null {
  const normalizedFileName = normalizeFileLookupPath(fileName);
  const fileBaseName = pathBasename(normalizedFileName);

  for (const item of tree) {
    const itemPath = parentPath ? `${parentPath}/${item.name}` : item.name;
    const rootlessPath = rootName && itemPath.startsWith(`${rootName}/`)
      ? itemPath.slice(rootName.length + 1)
      : itemPath;

    if (item.type !== "folder") {
      if (
        item.name === normalizedFileName ||
        item.name === fileBaseName ||
        itemPath === normalizedFileName ||
        rootlessPath === normalizedFileName
      ) {
        return { file: item, path: rootlessPath };
      }
    }

    if (item.children) {
      const found = findFileEntryInTree(
        item.children,
        normalizedFileName,
        itemPath,
        rootName,
      );
      if (found) return found;
    }
  }

  return null;
}

function findPreviewHtmlFileForChange(
  previewHtmlFiles: ReturnType<typeof getPreviewHtmlFiles>,
  fileName: string,
) {
  const normalizedFileName = normalizeFileLookupPath(fileName);
  const fileBaseName = pathBasename(normalizedFileName);

  return previewHtmlFiles.find((file) =>
    file.path === normalizedFileName ||
    file.name === normalizedFileName ||
    file.name === fileBaseName ||
    pathBasename(file.path) === fileBaseName
  ) ?? null;
}

function mapFilesToTree(files: FileItem[], tree: FileItem[]) {
  return files.map((file) => findFileByNameInTree(tree, file.name) ?? file);
}

function applyRubricDevSettings(
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

function inferStarterFileKind(fileName: string): FileKind {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension === "html" || extension === "htm") return "html";
  if (extension === "css") return "css";
  if (extension === "txt" || extension === "md") return "text";
  return "file";
}

function normalizeStarterPath(path: string) {
  return path.replace(/\\/g, "/").split("/").filter(Boolean);
}

function stripSharedRootFolder(paths: string[][]) {
  if (paths.length === 0) return paths;
  const firstSegment = paths[0][0];
  if (!firstSegment) return paths;
  const hasSharedRoot = paths.every((path) => path.length > 1 && path[0] === firstSegment);
  return hasSharedRoot ? paths.map((path) => path.slice(1)) : paths;
}

function sortFileItems(items: FileItem[]): FileItem[] {
  return [...items]
    .map((item) => item.children ? { ...item, children: sortFileItems(item.children) } : item)
    .sort((a, b) => {
      if (a.type === "folder" && b.type !== "folder") return -1;
      if (a.type !== "folder" && b.type === "folder") return 1;
      return a.name.localeCompare(b.name);
    });
}

function buildFileTreeFromUploadedStarter(files: DevPanelUploadedFile[]): FileItem[] {
  const root: FileItem = { name: "My Project", type: "folder", children: [] };
  const normalizedPaths = stripSharedRootFolder(files.map((file) => normalizeStarterPath(file.path)));

  files.forEach((file, index) => {
    const pathParts = normalizedPaths[index] ?? [file.name];
    const fileName = pathParts.at(-1) ?? file.name;
    let currentChildren = root.children ?? [];
    root.children = currentChildren;

    for (const folderName of pathParts.slice(0, -1)) {
      let folder = currentChildren.find(
        (item) => item.type === "folder" && item.name === folderName,
      );
      if (!folder) {
        folder = { name: folderName, type: "folder", children: [] };
        currentChildren.push(folder);
      }
      folder.children ??= [];
      currentChildren = folder.children;
    }

    currentChildren.push({
      name: fileName,
      type: inferStarterFileKind(fileName),
      content: file.content,
    });
  });

  return [{ ...root, children: sortFileItems(root.children ?? []) }];
}

async function readStarterUploadedFiles(fileList: FileList): Promise<DevPanelUploadedFile[]> {
  const files = Array.from(fileList);
  if (files.length > STARTER_UPLOAD_MAX_FILES) {
    throw new Error(`Upload up to ${STARTER_UPLOAD_MAX_FILES} files.`);
  }

  const totalBytes = files.reduce((total, file) => total + file.size, 0);
  if (totalBytes > STARTER_UPLOAD_MAX_TOTAL_SIZE_BYTES) {
    throw new Error("Uploaded files are too large.");
  }

  return Promise.all(files.map(async (file) => ({
    name: file.name,
    path: (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name,
    type: file.type,
    size: file.size,
    content: await file.text(),
  })));
}

function findFirstOpenableFile(tree: FileItem[]): FileItem | null {
  const flatFiles: FileItem[] = [];
  const visit = (items: FileItem[]) => {
    for (const item of items) {
      if (item.children) {
        visit(item.children);
      } else {
        flatFiles.push(item);
      }
    }
  };
  visit(tree);
  return (
    flatFiles.find((file) => file.name.toLowerCase() === "index.html") ??
    flatFiles.find((file) => file.type === "html") ??
    flatFiles[0] ??
    null
  );
}

function hasProjectFiles(tree: FileItem[]): boolean {
  return tree.some((item) => item.type === "folder"
    ? hasProjectFiles(item.children ?? [])
    : true);
}

function hasNonPlanProjectFiles(tree: FileItem[], parentPath = ""): boolean {
  return tree.some((item) => {
    const path = parentPath ? `${parentPath}/${item.name}` : item.name;
    if (item.type === "folder") {
      return hasNonPlanProjectFiles(item.children ?? [], path);
    }
    return !isPlanFilePath(path);
  });
}

function isPlanOnlyTutorChange(changes: { fileName: string; status: string }[]) {
  return changes.length === 1 &&
    changes[0].fileName === PROJECT_PLAN_FILE &&
    changes[0].status !== "deleted";
}

function isPlanFilePath(path: string | undefined) {
  if (!path) return false;
  const parts = normalizeFileLookupPath(path).split("/").filter(Boolean);
  return parts.length >= 2 &&
    parts.at(-2) === "Plans" &&
    parts.at(-1)?.toLowerCase().endsWith(".md");
}

function hasCompletedPlanStatus(file: FileItem | null | undefined) {
  const content = file?.proposedContent ?? file?.content ?? "";
  return /\bStatus:\s*Completed\b/i.test(content);
}

function hasAcceptedCompletedPlanStatus(file: FileItem | null | undefined) {
  return /\bStatus:\s*Completed\b/i.test(file?.content ?? "");
}

function formatSavedSubtitle(createdAt: string | undefined, now: number) {
  if (!createdAt) return FIXED_SAVED_SUBTITLE;
  const savedTime = new Date(createdAt).getTime();
  if (!Number.isFinite(savedTime)) return FIXED_SAVED_SUBTITLE;
  const elapsedSeconds = Math.max(
    0,
    Math.floor((now - savedTime) / 1000),
  );

  if (elapsedSeconds < 60) return "Saved a few seconds ago";
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) {
    return `Saved ${elapsedMinutes} minute${elapsedMinutes === 1 ? "" : "s"} ago`;
  }
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  return `Saved ${elapsedHours} hour${elapsedHours === 1 ? "" : "s"} ago`;
}

interface WebLab2LevelPageProps {
  currentLevelPath?: string;
  instructionsDrawerInitialHeightRatio?: number;
  instructionsDrawerVisualCue?: InstructionsDrawerVisualCue;
  autoSeedTutorConversation?: boolean;
  aiTutorInputExperiment?: AiTutorInputExperiment;
  showRubricTab?: boolean;
  rubricData?: RubricData | RubricData[];
  tutorMode?: TutorMode;
  /** Custom file structure to replace the default mock data. */
  fileStructureOverride?: import("../types/file").FileItem[];
  /** Custom preview content rendered instead of the default mock website. */
  previewContent?: React.ReactNode | ((aiActive: boolean) => React.ReactNode);
  /** Hide the instructions drawer in the AI tutor panel. Default true. */
  showInstructionsDrawer?: boolean;
  /** When true, show the sidebar collapse/expand control. */
  enableSidebarCollapse?: boolean;
  /** When true, the sidebar starts collapsed if sidebar collapse is enabled. */
  collapseSidebarByDefault?: boolean;
  /** Optional markdown content to pre-seed the instructions drawer editor. */
  instructionsMarkdown?: string;
  /** Where to render the Continue button: "sidebar" (bottom bar) or "header" (next to bubbles). */
  continueButtonPlacement?: "sidebar" | "header";
  /** When true, show the tutor composer model dropdown. */
  showTutorModelSelector?: boolean;
  /** Workspace view selected when the level first loads. */
  initialViewMode?: ViewMode;
  /** When true, the file manager starts collapsed in code/split views. */
  collapseFileManagerByDefault?: boolean;
  /** When true, render preview from project file contents instead of custom React previewContent. */
  useFilePreview?: boolean;
  /** When true, file preview exposes design selection and style editing tools. */
  enableDesignMode?: boolean;
  /** Use static mock history or live file snapshots. Functional history requires file preview. */
  versionHistoryMode?: VersionHistoryMode;
  /** When true, hide placeholder file-manager entries with no starter/proposed content. */
  showOnlyFilesWithContent?: boolean;
  /** When true, show the Resources tab card for associated student lesson materials. */
  showStudentLessonResource?: boolean;
  /** When true, show the Resources tab card for lab documentation. */
  showDocumentationResource?: boolean;
  /** When true, show the Resources tab card for level walkthroughs. */
  showWalkthroughResources?: boolean;
}

export function WebLab2LevelPage({
  currentLevelPath = "/levels/weblab2",
  instructionsDrawerInitialHeightRatio,
  instructionsDrawerVisualCue = "none",
  autoSeedTutorConversation = false,
  aiTutorInputExperiment = "default",
  showRubricTab = false,
  rubricData,
  tutorMode,
  fileStructureOverride,
  previewContent,
  showInstructionsDrawer,
  enableSidebarCollapse = false,
  collapseSidebarByDefault = false,
  instructionsMarkdown = "",
  continueButtonPlacement = "sidebar",
  showTutorModelSelector = false,
  initialViewMode = "code",
  collapseFileManagerByDefault = false,
  useFilePreview = false,
  enableDesignMode = true,
  versionHistoryMode,
  showOnlyFilesWithContent = false,
  showStudentLessonResource = false,
  showDocumentationResource = true,
  showWalkthroughResources = false,
}: WebLab2LevelPageProps = {}) {
  const shareMode = useLevelShareMode();
  const [searchParams] = useSearchParams();
  const starterShareParam = searchParams.get(STARTER_SHARE_PARAM);
  const starterSharePayload = useMemo(
    () => decodeStarterSharePayload(starterShareParam),
    [starterShareParam],
  );
  const routeTutorMode: TutorMode =
    tutorMode ?? { kind: "mock", config: defaultMockTutorConfig };
  const initialMockTutorConfig =
    routeTutorMode.kind === "mock" ? routeTutorMode.config : undefined;
  const baseRubrics = useMemo(
    () => normalizeRubricData(rubricData),
    [rubricData],
  );
  const editableRubrics = useMemo(
    () => baseRubrics.length > 0 ? baseRubrics : [DEFAULT_RUBRIC_DATA],
    [baseRubrics],
  );
  const firstEditableRubric = editableRubrics[0] ?? DEFAULT_RUBRIC_DATA;
  const defaults = {
    instructionsDrawerInitialHeightRatio:
      instructionsDrawerInitialHeightRatio ?? 0.6,
    showInstructionsDrawer: showInstructionsDrawer ?? true,
    enableSidebarCollapse,
    collapseSidebarByDefault,
    [INSTRUCTIONS_MARKDOWN_DEV_KEY]: instructionsMarkdown,
    instructionsDrawerVisualCue,
    autoSeedTutorConversation,
    additionalTutorPrompt: "",
    showTutorModelSelector,
    tutorModeKind: routeTutorMode.kind,
    continueButtonPlacement,
    initialViewMode,
    collapseFileManagerByDefault,
    useFilePreview,
    enableDesignMode,
    [EDITOR_READ_ONLY_STORAGE_KEY]: false,
    versionHistoryMode:
      versionHistoryMode ?? (routeTutorMode.kind === "functional" ? "functional" : "mock"),
    showRubricTab,
    showStudentLessonResource,
    showDocumentationResource,
    showWalkthroughResources,
    rubricName: firstEditableRubric.name,
    rubricTeacherFeedback: firstEditableRubric.feedback ?? "",
    rubricStatus: getInitialRubricStatus(firstEditableRubric),
    rubricSelectedCategoryId: getInitialRubricCategoryId(firstEditableRubric),
    title: "Web Lab 2: Intro Project",
  };
  const overrideResult = usePropsOverride(defaults);
  const resolved = overrideResult.props;
  const resolvedInitialViewMode = resolveViewMode(resolved.initialViewMode);
  const initialFileStructure = fileStructureOverride ?? fileStructure;
  const shouldCollapseEmptyFileManager =
    !hasProjectFiles(initialFileStructure);
  const resolvedCollapseFileManagerByDefault = Boolean(
    resolved.collapseFileManagerByDefault || shouldCollapseEmptyFileManager,
  );
  const resolvedUseFilePreview = Boolean(resolved.useFilePreview);
  const resolvedEnableDesignMode = Boolean(resolved.enableDesignMode);
  const resolvedEditorReadOnlyOverride = Boolean(resolved[EDITOR_READ_ONLY_STORAGE_KEY]);
  const resolvedAdditionalTutorPrompt = String(resolved.additionalTutorPrompt ?? "");
  const resolvedEnableSidebarCollapse = Boolean(resolved.enableSidebarCollapse);
  const resolvedCollapseSidebarByDefault = Boolean(resolved.collapseSidebarByDefault);
  const resolvedShowTutorModelSelector = Boolean(resolved.showTutorModelSelector);
  const resolvedVersionHistoryMode = resolveVersionHistoryMode(
    resolved.versionHistoryMode,
  );
  const resolvedRubricStatus = resolveRubricDevStatus(resolved.rubricStatus);
  const useFunctionalVersionHistory =
    resolvedUseFilePreview && resolvedVersionHistoryMode === "functional";
  const rubricCategoryOptions = useMemo(
    () => getRubricCategoryOptions(editableRubrics),
    [editableRubrics],
  );
  const webLab2DevFields = useMemo(
    () => [
      ...webLab2BaseDevFields,
      ...buildRubricsDevFields(rubricCategoryOptions),
      ...webLab2ResourcesTabDevFields,
    ],
    [rubricCategoryOptions],
  );
  const {
    activeTab,
    setActiveTab,
    isSettingsOpen,
    setIsSettingsOpen,
    sidebarWidth,
    setSidebarWidth,
  } = useLayoutState();
  const {
    fileStructureState,
    openFolders,
    selectedFile,
    openFiles,
    viewMode,
    isFileManagerCollapsed,
    isCreateFileModalOpen,
    setSelectedFile,
    setOpenFiles,
    setViewMode,
    setIsFileManagerCollapsed,
    setIsCreateFileModalOpen,
    toggleFolder,
    openFile,
    closeFile,
    handleReorderFiles,
    handleCreateFile,
    handleCreateFolder,
    handleCreatePlan,
    addFileToProject,
    renameFile,
    deleteFile,
    moveFileTreeItem,
    updateFileContent,
    replaceFileStructure,
    beginAiProposal,
    acceptAiProposal,
    rejectAiProposal,
  } = useFileWorkspaceState(
    initialFileStructure,
    {
      storageKey: `weblab2:file-structure:${currentLevelPath}`,
      initialViewMode: resolvedInitialViewMode,
      initialFileManagerCollapsed: resolvedCollapseFileManagerByDefault,
    },
  );
  const lastResolvedInitialViewModeRef = useRef(resolvedInitialViewMode);
  const lastResolvedFileManagerCollapsedRef = useRef(
    resolvedCollapseFileManagerByDefault,
  );
  const appliedStarterShareParamRef = useRef<string | null>(null);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [isCreatePlanModalOpen, setIsCreatePlanModalOpen] = useState(false);
  const [previewPath, setPreviewPath] = useState("index.html");
  const [renameTarget, setRenameTarget] = useState<{
    file: FileItem;
    path: string;
  } | null>(null);
  const [starterCodeUpload, setStarterCodeUpload] =
    useState<StarterCodeUploadValue | null>(null);
  const { chatMessages, setChatMessages, chatInput, setChatInput } =
    useChatState(
      initialMockTutorConfig?.initialMessages ?? initialChatMessages,
      initialMockTutorConfig?.initialInput,
    );
  useEffect(() => {
    if (lastResolvedInitialViewModeRef.current === resolvedInitialViewMode) return;
    lastResolvedInitialViewModeRef.current = resolvedInitialViewMode;
    setViewMode(resolvedInitialViewMode);
  }, [resolvedInitialViewMode, setViewMode]);
  useEffect(() => {
    if (
      lastResolvedFileManagerCollapsedRef.current ===
      resolvedCollapseFileManagerByDefault
    ) {
      return;
    }
    lastResolvedFileManagerCollapsedRef.current =
      resolvedCollapseFileManagerByDefault;
    setIsFileManagerCollapsed(resolvedCollapseFileManagerByDefault);
  }, [resolvedCollapseFileManagerByDefault, setIsFileManagerCollapsed]);
  const getCurrentFileStructure = useCallback(
    () => fileStructureState ?? fileStructureOverride ?? fileStructure,
    [fileStructureOverride, fileStructureState],
  );
  const resolvedTutorModeKind =
    resolved.tutorModeKind === "functional" ? "functional" : "mock";
  const {
    versions: historyVersions,
    selectedHistoryFileStructure,
    selectedHistoryVersionLabel,
    selectedHistoryVersion,
    setSelectedHistoryVersion,
    showRestoreSuccessAlert,
    setShowRestoreSuccessAlert,
    showSaveSuccessAlert,
    setShowSaveSuccessAlert,
    handleSaveVersion,
    handleSaveAiVersion,
    handleRestoreVersion,
    handleReturnToCurrentVersion,
    latestSavedAt,
    showNewProjectHistoryEmptyState,
  } = useVersionHistoryState(
    useFunctionalVersionHistory
      ? {
          getFileStructure: getCurrentFileStructure,
          onRestoreFileStructure: replaceFileStructure,
          storageKey: `weblab2:version-history:${currentLevelPath}`,
        }
      : undefined,
  );
  useEffect(() => {
    setSelectedHistoryVersion("current");
  }, [setSelectedHistoryVersion, useFunctionalVersionHistory]);
  const [subtitleNow, setSubtitleNow] = useState(() => Date.now());
  const [isTutorRequestRunning, setIsTutorRequestRunning] = useState(false);
  const [tutorRequestMode, setTutorRequestMode] =
    useState<TutorRequestMode>("auto");
  const [buildingPlanPath, setBuildingPlanPath] = useState<string | null>(null);
  const [builtPlanPaths, setBuiltPlanPaths] = useState<Set<string>>(() => new Set());
  const buildFromPlanRequestRef = useRef(false);
  useEffect(() => {
    if (!useFunctionalVersionHistory) return undefined;
    setSubtitleNow(Date.now());
    const intervalId = window.setInterval(() => setSubtitleNow(Date.now()), 15_000);
    return () => window.clearInterval(intervalId);
  }, [latestSavedAt, useFunctionalVersionHistory]);
  useEffect(() => {
    setEditorReadOnlyOverride(resolvedEditorReadOnlyOverride);
  }, [resolvedEditorReadOnlyOverride]);

  const aiChangedFiles = useMemo(() => {
    const pending = chatMessages.find(
      (m) => m.codeChangeStatus === "pending" && m.fileChanges,
    );
    if (!pending?.fileChanges) return undefined;
    const map: Record<string, "new" | "modified" | "deleted"> = {};
    for (const fc of pending.fileChanges) {
      map[fc.fileName] = fc.status;
      map[pathBasename(fc.fileName)] = fc.status;
    }
    return map;
  }, [chatMessages]);

  const hasAcceptedChanges = chatMessages.some(
    (m) => m.codeChangeStatus === "accepted" && m.fileChanges,
  );
  const hasPendingAiChanges = !!aiChangedFiles && Object.keys(aiChangedFiles).length > 0;
  const isAiActive = hasPendingAiChanges || hasAcceptedChanges;
  const currentFileStructure = fileStructureState ?? fileStructureOverride ?? fileStructure;
  const showWorkspaceNewProjectEmptyState =
    !useFunctionalVersionHistory || showNewProjectHistoryEmptyState;
  const isViewingHistoryVersion =
    useFunctionalVersionHistory &&
    selectedHistoryVersion !== "current" &&
    Boolean(selectedHistoryFileStructure);
  const visibleFileStructure = isViewingHistoryVersion && selectedHistoryFileStructure
    ? selectedHistoryFileStructure
    : currentFileStructure;
  const visibleSelectedFile = selectedFile
    ? findFileByNameInTree(visibleFileStructure, selectedFile.name) ?? selectedFile
    : selectedFile;
  const visibleOpenFiles = mapFilesToTree(openFiles, visibleFileStructure);
  const visibleHasPendingAiChanges = isViewingHistoryVersion ? false : hasPendingAiChanges;
  const selectedPlanEntry = visibleSelectedFile
    ? findFileEntryInTree(visibleFileStructure, visibleSelectedFile.name)
    : null;
  const isSelectedPlanFile =
    isPlanFilePath(selectedPlanEntry?.path) ||
    selectedPlanEntry?.path === pathBasename(PROJECT_PLAN_FILE) ||
    visibleSelectedFile?.name === pathBasename(PROJECT_PLAN_FILE);
  const selectedPlanPath = isSelectedPlanFile
    ? selectedPlanEntry?.path ?? PROJECT_PLAN_FILE
    : PROJECT_PLAN_FILE;
  const selectedPlanFileName = pathBasename(selectedPlanPath);
  const isSelectedPlanCompleted =
    builtPlanPaths.has(selectedPlanPath) ||
    hasAcceptedCompletedPlanStatus(selectedPlanEntry?.file);
  const isSelectedPlanBuiltOrPending =
    isSelectedPlanCompleted ||
    hasCompletedPlanStatus(selectedPlanEntry?.file);
  const isSelectedPlanBuilding = buildingPlanPath === selectedPlanPath;
  const planStatusText =
    isSelectedPlanBuiltOrPending && !isSelectedPlanCompleted && hasPendingAiChanges
      ? "Built, awaiting user review."
      : undefined;
  const showPlanActionBar =
    !isViewingHistoryVersion &&
    isSelectedPlanFile;
  const resolvedPreviewContent = typeof previewContent === "function"
    ? previewContent(isAiActive)
    : previewContent ?? <DefaultProjectPreview />;
  const previewHtmlFiles = useMemo(
    () => getPreviewHtmlFiles(visibleFileStructure, visibleHasPendingAiChanges),
    [visibleFileStructure, visibleHasPendingAiChanges],
  );
  useEffect(() => {
    if (!resolvedUseFilePreview || previewHtmlFiles.length === 0) return;
    if (previewHtmlFiles.some((file) => file.path === previewPath)) return;

    const fallbackFile =
      previewHtmlFiles.find((file) => file.path === "index.html") ?? previewHtmlFiles[0];
    setPreviewPath(fallbackFile.path);
  }, [previewHtmlFiles, previewPath, resolvedUseFilePreview]);
  const previewSrcDoc = resolvedUseFilePreview
    ? buildPreviewSrcDoc(
        visibleFileStructure,
        visibleHasPendingAiChanges,
        previewPath,
      )
    : undefined;
  const handleOpenFileChangeInEditor = useCallback((change: FileChange) => {
    if (change.status === "deleted") return;
    const target = findFileEntryInTree(visibleFileStructure, change.fileName);
    if (!target) return;

    setViewMode("split");
    openFile(target.file);
  }, [openFile, setViewMode, visibleFileStructure]);
  const handleOpenFileChangeInPreview = useCallback((change: FileChange) => {
    if (change.status === "deleted" || !resolvedUseFilePreview) return;

    setViewMode("split");
    const target = findPreviewHtmlFileForChange(previewHtmlFiles, change.fileName);
    if (target) {
      setPreviewPath(target.path);
    }
  }, [previewHtmlFiles, resolvedUseFilePreview, setViewMode]);
  const designModeDisabledReason = !resolvedEnableDesignMode
    ? "Design mode is disabled for this level."
    : isViewingHistoryVersion
      ? "Return to the current version before editing preview styles."
      : isTutorRequestRunning
        ? "Wait for AI Tutor to finish generating before editing preview styles."
        : hasPendingAiChanges
          ? "Accept or reject the pending AI changes before editing preview styles."
          : undefined;
  const designEditDisabledReason = designModeDisabledReason;
  const handleApplyPreviewDesignEdit = useCallback((request: PreviewDesignApplyRequest) => {
    if (!resolvedEnableDesignMode || isViewingHistoryVersion || isTutorRequestRunning || hasPendingAiChanges) return;
    const result = applyPreviewDesignEdit(currentFileStructure, previewPath, request);
    if (result.ok) {
      replaceFileStructure(result.fileStructure);
    } else {
      const error = "error" in result ? result.error : "Unknown preview design edit error.";
      console.warn("[PreviewDesign] Unable to apply design edit", error);
    }
  }, [
    currentFileStructure,
    hasPendingAiChanges,
    isTutorRequestRunning,
    isViewingHistoryVersion,
    previewPath,
    replaceFileStructure,
    resolvedEnableDesignMode,
  ]);
  const handleAddPreviewElementToTutor = useCallback((element: PreviewDesignElementDescriptor) => {
    setActiveTab("ai-tutor");
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("weblab:add-preview-element-to-tutor", {
        detail: {
          previewPath,
          ...element,
        },
      }));
    }, 0);
  }, [previewPath, setActiveTab]);
  const previewConfig: WebLabPreviewConfig = resolvedUseFilePreview
    ? {
        kind: "file",
        srcDoc: previewSrcDoc,
        path: previewPath,
        htmlFiles: previewHtmlFiles,
        onPathChange: setPreviewPath,
        showDesignTools: resolvedEnableDesignMode,
        canEditDesign: !designEditDisabledReason,
        designModeDisabled: Boolean(designModeDisabledReason),
        designDisabledReason: designEditDisabledReason,
        onApplyDesignEdit: handleApplyPreviewDesignEdit,
        onAddPreviewElementToTutor: handleAddPreviewElementToTutor,
      }
    : {
        kind: "react",
        content: resolvedPreviewContent,
      };
  const availableTutorContextFiles = useMemo(
    () => flattenTutorContextFiles(currentFileStructure),
    [currentFileStructure],
  );

  const handleTutorSubmit = useCallback(async (
    message: string,
    conversation: ChatMessage[],
    requestMode: TutorRequestMode = "auto",
  ) => {
    const wasEmptyOrPlanOnlyProject = !hasNonPlanProjectFiles(
      fileStructureState ?? fileStructureOverride ?? fileStructure,
    );
    const result = await tutorClient({
      message,
      conversation,
      files: fileStructureState ?? fileStructureOverride ?? fileStructure,
      additionalSystemPrompt: resolvedAdditionalTutorPrompt,
      requestMode,
    });

    if (result.changes.length > 0) {
      const isPlanOnlyChange = isPlanOnlyTutorChange(result.changes);
      const shouldSwitchToPreviewAfterPlanBuild =
        buildFromPlanRequestRef.current && !isPlanOnlyChange && resolvedUseFilePreview;
      buildFromPlanRequestRef.current = false;
      setIsFileManagerCollapsed(false);
      beginAiProposal(result.changes);
      if (isPlanOnlyChange) {
        setViewMode("code");
        openFile({
          name: pathBasename(PROJECT_PLAN_FILE),
          type: "text",
          content: "",
          proposedContent: result.changes[0].content ?? "",
          proposedStatus: result.changes[0].status,
        });
      } else if (shouldSwitchToPreviewAfterPlanBuild || (wasEmptyOrPlanOnlyProject && resolvedUseFilePreview)) {
        setViewMode("preview");
      }
    } else {
      buildFromPlanRequestRef.current = false;
    }

    return {
      role: "assistant",
      content: result.message,
      fileChanges: result.changes.length > 0
        ? result.changes.map(({ fileName, status, linesAdded, linesRemoved }) => ({
            fileName,
            status,
            linesAdded,
            linesRemoved,
          }))
        : undefined,
      aiSaveTitle: result.changes.length > 0 ? result.saveTitle : undefined,
      codeChangeStatus: result.changes.length > 0 ? "pending" : undefined,
    } satisfies ChatMessage;
  }, [
    beginAiProposal,
    fileStructureOverride,
    fileStructureState,
    openFile,
    resolvedAdditionalTutorPrompt,
    resolvedUseFilePreview,
    setIsFileManagerCollapsed,
    setViewMode,
  ]);

  const handleBuildCurrentPlan = useCallback(() => {
    if (isTutorRequestRunning || hasPendingAiChanges) return;
    const buildPrompt =
      `Build the project described in ${selectedPlanPath}. Update the plan status and check off the completed items as part of the proposal.`;
    const userMessage: ChatMessage = {
      role: "user",
      content: buildPrompt,
    };
    const nextMessages = [...chatMessages, userMessage];
    buildFromPlanRequestRef.current = true;
    setBuildingPlanPath(selectedPlanPath);
    setActiveTab("ai-tutor");
    window.dispatchEvent(new CustomEvent(OPEN_TUTOR_PANEL_EVENT));
    setTutorRequestMode("auto");
    setChatMessages(nextMessages);
    setIsTutorRequestRunning(true);
    void handleTutorSubmit(buildPrompt, nextMessages, "build")
      .then((assistantMessage) => {
        if (!assistantMessage) return;
        setChatMessages([...nextMessages, assistantMessage]);
      })
      .catch((error) => {
        console.error("[WebLab2LevelPage] Build plan request failed", error);
        buildFromPlanRequestRef.current = false;
        setChatMessages([
          ...nextMessages,
          {
            role: "assistant",
            content: "I had trouble starting the build from your plan. Try again in a moment.",
          },
        ]);
      })
      .finally(() => {
        setBuildingPlanPath(null);
        setIsTutorRequestRunning(false);
      });
  }, [
    chatMessages,
    handleTutorSubmit,
    hasPendingAiChanges,
    isTutorRequestRunning,
    selectedPlanPath,
    setActiveTab,
    setChatMessages,
  ]);

  const handleAcceptAiChanges = useCallback((saveTitle?: string) => {
    const acceptedFileStructure = acceptAiProposal();
    const acceptedPlan = findFileEntryInTree(acceptedFileStructure, selectedPlanPath);
    if (hasAcceptedCompletedPlanStatus(acceptedPlan?.file)) {
      setBuiltPlanPaths((current) => {
        const next = new Set(current);
        next.add(acceptedPlan?.path ?? selectedPlanPath);
        return next;
      });
    }
    handleSaveAiVersion(acceptedFileStructure, saveTitle);
  }, [acceptAiProposal, handleSaveAiVersion, selectedPlanPath]);

  const handleBannerAiChangeAction = useCallback((action: "accepted" | "rejected") => {
    const pendingMessage = chatMessages.find(
      (message) => message.codeChangeStatus === "pending" && message.fileChanges,
    );
    if (!pendingMessage) return;

    if (action === "accepted") {
      handleAcceptAiChanges(pendingMessage.aiSaveTitle);
    } else {
      rejectAiProposal();
    }

    setChatMessages((current) => {
      const pendingIndex = current.findIndex(
        (message) => message.codeChangeStatus === "pending" && message.fileChanges,
      );
      if (pendingIndex === -1) return current;

      const updated = current.map((message, index) => {
        if (index !== pendingIndex) return message;
        return { ...message, codeChangeStatus: action };
      });
      const alertMessage: ChatMessage = {
        role: "assistant",
        content:
          action === "accepted"
            ? "You accepted this suggestion."
            : "You dismissed this suggestion.",
        isAlert: true,
        alertVariant: action === "accepted" ? "accepted" : "rejected",
      };
      return [...updated, alertMessage];
    });
  }, [chatMessages, handleAcceptAiChanges, rejectAiProposal, setChatMessages]);

  const handleAddFileToTutor = useCallback((file: FileItem, path: string) => {
    setActiveTab("ai-tutor");
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("weblab:add-project-file-to-tutor", {
        detail: {
          name: file.name,
          path,
        },
      }));
    }, 0);
  }, [setActiveTab]);
  const handleStartWithTutor = useCallback((
    prompt = STARTER_PROJECT_TUTOR_PROMPT,
    requestMode: TutorRequestMode = "auto",
  ) => {
    setActiveTab("ai-tutor");
    setTutorRequestMode(requestMode);
    setChatInput(prompt);
    const focusTutorInput = () => {
      window.dispatchEvent(new CustomEvent(FOCUS_TUTOR_INPUT_EVENT));
    };
    window.addEventListener(TUTOR_PANEL_READY_EVENT, focusTutorInput, {
      once: true,
    });
    window.dispatchEvent(new CustomEvent(OPEN_TUTOR_PANEL_EVENT));
  }, [setActiveTab, setChatInput]);

  const handleStarterCodeUpload = useCallback((value: StarterCodeUploadValue | null | undefined) => {
    const uploadedFiles = value?.files ?? [];
    if (uploadedFiles.length === 0) return;
    const uploadValue = value ?? {
      files: uploadedFiles,
      uploadedAt: new Date().toISOString(),
    };

    try {
      const nextTree = buildFileTreeFromUploadedStarter(uploadedFiles);
      const firstFile = findFirstOpenableFile(nextTree);
      setStarterCodeUpload(uploadValue);
      replaceFileStructure(nextTree);
      setSelectedFile(firstFile);
      setOpenFiles(firstFile ? [firstFile] : []);
      if (firstFile?.type === "html") {
        setPreviewPath(firstFile.name);
      }
    } catch (error) {
      console.error("[WebLab2LevelPage] Unable to apply starter upload", error);
    }
  }, [replaceFileStructure, setOpenFiles, setSelectedFile]);
  const handleStarterFileUpload = useCallback(async (files: FileList) => {
    try {
      const uploadedFiles = await readStarterUploadedFiles(files);
      handleStarterCodeUpload({
        files: uploadedFiles,
        uploadedAt: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      console.error("[WebLab2LevelPage] Starter file read failed", error);
      return error instanceof Error
        ? error.message
        : "Unable to read those files. Try uploading text files only.";
    }
  }, [handleStarterCodeUpload]);
  useEffect(() => {
    if (!starterShareParam || !starterSharePayload) return;
    if (appliedStarterShareParamRef.current === starterShareParam) return;

    appliedStarterShareParamRef.current = starterShareParam;
    handleStarterCodeUpload(starterSharePayloadToUpload(starterSharePayload));
  }, [handleStarterCodeUpload, starterShareParam, starterSharePayload]);
  const handleStarterCodeReset = useCallback(() => {
    const defaultTree = fileStructureOverride ?? fileStructure;
    const firstFile = findFirstOpenableFile(defaultTree);
    setStarterCodeUpload(null);
    replaceFileStructure(defaultTree);
    setSelectedFile(firstFile);
    setOpenFiles(firstFile ? [firstFile] : []);
    setPreviewPath("index.html");
  }, [fileStructureOverride, replaceFileStructure, setOpenFiles, setSelectedFile]);
  const getDevPanelShareParams = useCallback((): Record<string, string> | null => {
    const starterShareResult = encodeStarterSharePayload(starterCodeUpload);
    if ("reason" in starterShareResult) {
      window.alert(starterShareResult.reason);
      return null;
    }

    return starterShareResult.encoded
      ? { [STARTER_SHARE_PARAM]: starterShareResult.encoded }
      : {};
  }, [starterCodeUpload]);

  const resolvedVisualCue = resolved.instructionsDrawerVisualCue as InstructionsDrawerVisualCue;
  const resolvedInstructionsMarkdown = String(resolved[INSTRUCTIONS_MARKDOWN_DEV_KEY] ?? "");
  const resolvedInstructionsContent = resolvedInstructionsMarkdown.trim()
    ? <MarkdownInstructions markdown={resolvedInstructionsMarkdown} />
    : undefined;
  const continueInHeader = resolved.continueButtonPlacement === "header";
  const topNavigationSubtitle = useFunctionalVersionHistory
    ? formatSavedSubtitle(latestSavedAt, subtitleNow)
    : FIXED_SAVED_SUBTITLE;
  const resolvedRubrics = useMemo(
    () => applyRubricDevSettings(editableRubrics, {
      name: String(resolved.rubricName ?? ""),
      feedback: String(resolved.rubricTeacherFeedback ?? ""),
      status: resolvedRubricStatus,
      selectedCategoryId: String(resolved.rubricSelectedCategoryId ?? ""),
    }),
    [
      editableRubrics,
      resolved.rubricName,
      resolved.rubricSelectedCategoryId,
      resolved.rubricTeacherFeedback,
      resolvedRubricStatus,
    ],
  );
  const resolvedShowRubricTab = Boolean(resolved.showRubricTab);
  const resolvedShowStudentLessonResource = Boolean(
    resolved.showStudentLessonResource,
  );
  const resolvedShowDocumentationResource = Boolean(
    resolved.showDocumentationResource,
  );
  const resolvedShowWalkthroughResources = Boolean(
    resolved.showWalkthroughResources,
  );
  const resolvedMockTutorConfig: MockTutorConfig | undefined =
    resolvedTutorModeKind === "mock"
      ? {
          ...defaultMockTutorConfig,
          ...(routeTutorMode.kind === "mock" ? routeTutorMode.config : undefined),
          seedOnMount:
            Boolean(resolved.autoSeedTutorConversation) ||
            Boolean(routeTutorMode.kind === "mock" && routeTutorMode.config?.seedOnMount),
        }
      : undefined;

  return (
    <>
      <Lab2Shell
        shareModeConfig={{ mode: shareMode }}
        topNavigationProps={{
          title: resolved.title as string,
          subtitle: topNavigationSubtitle,
          currentLevel: 9,
          totalLevels: 10,
          completedLevels: [1, 2, 3],
          levelLinks: webLab2LevelLinks,
          currentLevelPath,
          showContinueButton: continueInHeader,
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
          selectedHistoryVersion,
          setSelectedHistoryVersion,
          historyVersions,
          showNewProjectHistoryEmptyState,
          onSaveVersion: handleSaveVersion,
          onRestoreVersion: handleRestoreVersion,
          showRestoreSuccessAlert,
          setShowRestoreSuccessAlert,
          showSaveSuccessAlert,
          setShowSaveSuccessAlert,
          collapsible: resolvedEnableSidebarCollapse,
          defaultCollapsed: resolvedEnableSidebarCollapse && resolvedCollapseSidebarByDefault,
          instructionsDrawerInitialHeightRatio:
            resolved.instructionsDrawerInitialHeightRatio as number,
          showInstructionsDrawer: Boolean(resolved.showInstructionsDrawer),
          instructionsDrawerVisualCue: resolvedVisualCue,
          instructionsContent: resolvedInstructionsContent,
          aiTutorInputExperiment,
          mockTutorConfig: resolvedMockTutorConfig,
          onAddFileToProject: addFileToProject,
          availableTutorContextFiles,
          onTutorSubmit: resolvedTutorModeKind === "functional" ? handleTutorSubmit : undefined,
          onAcceptAiChanges: resolvedTutorModeKind === "functional" ? handleAcceptAiChanges : undefined,
          onRejectAiChanges: resolvedTutorModeKind === "functional" ? rejectAiProposal : undefined,
          isTutorRequestRunning,
          onTutorRequestRunningChange: setIsTutorRequestRunning,
          onOpenFileChangeInEditor: handleOpenFileChangeInEditor,
          onOpenFileChangeInPreview: resolvedUseFilePreview
            ? handleOpenFileChangeInPreview
            : undefined,
          showTutorModelSelector: resolvedShowTutorModelSelector,
          tutorRequestMode,
          setTutorRequestMode,
          hasPendingAiChanges,
          showRubricTab: resolvedShowRubricTab,
          showStudentLessonResource: resolvedShowStudentLessonResource,
          showDocumentationResource: resolvedShowDocumentationResource,
          showWalkthroughResources: resolvedShowWalkthroughResources,
          rubricData: resolvedRubrics,
          showContinueButton: !continueInHeader,
          devPanelFields: webLab2DevFields,
          devPanelOverrideResult: overrideResult,
          devPanelSessionValues: {
            [STARTER_CODE_UPLOAD_DEV_KEY]: starterCodeUpload,
          },
          devPanelHasShareParams: Boolean(starterCodeUpload?.files?.length),
          devPanelShareParams: getDevPanelShareParams,
          onDevPanelSessionValueChange: (key, value) => {
            if (key === STARTER_CODE_UPLOAD_DEV_KEY) {
              handleStarterCodeUpload(value as StarterCodeUploadValue);
            }
          },
          onDevPanelSessionValueReset: (key) => {
            if (key === STARTER_CODE_UPLOAD_DEV_KEY) {
              handleStarterCodeReset();
            }
          },
        }}
        onResize={(delta) => {
          setSidebarWidth((prev) =>
            Math.max(300, Math.min(600, prev + delta))
          );
        }}
      >
        <Workspace
          viewMode={viewMode}
          setViewMode={setViewMode}
          fileStructure={visibleFileStructure}
          selectedFile={visibleSelectedFile}
          setSelectedFile={setSelectedFile}
          openFiles={visibleOpenFiles}
          openFolders={openFolders}
          toggleFolder={toggleFolder}
          openFile={openFile}
          closeFile={closeFile}
          handleReorderFiles={handleReorderFiles}
          isFileManagerCollapsed={isFileManagerCollapsed}
          setIsFileManagerCollapsed={setIsFileManagerCollapsed}
          setIsCreateFileModalOpen={setIsCreateFileModalOpen}
          setIsCreateFolderModalOpen={setIsCreateFolderModalOpen}
          setIsCreatePlanModalOpen={setIsCreatePlanModalOpen}
          enableFileDragToTutor
          showOnlyFilesWithContent={showOnlyFilesWithContent}
          onRequestRenameFile={(file, path) => setRenameTarget({ file, path })}
          onAddFileToTutor={handleAddFileToTutor}
          onStartWithTutor={handleStartWithTutor}
          onUploadStarterFiles={handleStarterFileUpload}
          starterUploadAccept={STARTER_UPLOAD_ACCEPT}
          showNewProjectEmptyState={showWorkspaceNewProjectEmptyState}
          onDeleteFile={(_file, path) => {
            deleteFile(path);
          }}
          onMoveFileTreeItem={moveFileTreeItem}
          preview={previewConfig}
          selectedHistoryVersion={selectedHistoryVersion}
          selectedHistoryVersionLabel={selectedHistoryVersionLabel}
          onReturnToCurrentVersion={handleReturnToCurrentVersion}
          aiChangedFiles={isViewingHistoryVersion ? undefined : aiChangedFiles}
          onAcceptAiChanges={() => handleBannerAiChangeAction("accepted")}
          onRejectAiChanges={() => handleBannerAiChangeAction("rejected")}
          builtPlanPaths={builtPlanPaths}
          onFileContentChange={isViewingHistoryVersion ? undefined : updateFileContent}
          showPlanActionBar={showPlanActionBar}
          planFileName={selectedPlanFileName}
          isPlanBuilt={isSelectedPlanCompleted}
          planStatusText={planStatusText}
          onBuildPlan={handleBuildCurrentPlan}
          showBuildPlan={!isSelectedPlanBuiltOrPending}
          buildPlanDisabled={isTutorRequestRunning || hasPendingAiChanges}
          buildPlanRunning={isSelectedPlanBuilding}
        />
      </Lab2Shell>

      <CreateFileModal
        isOpen={isCreateFileModalOpen}
        onClose={() => setIsCreateFileModalOpen(false)}
        onCreate={handleCreateFile}
      />
      <NameInputModal
        isOpen={isCreateFolderModalOpen}
        title="Create a new folder"
        description="Give your new folder a name."
        fieldLabel="Folder name"
        placeholder="Enter folder name"
        confirmLabel="Create folder"
        onClose={() => setIsCreateFolderModalOpen(false)}
        onSubmit={handleCreateFolder}
      />
      <NameInputModal
        isOpen={isCreatePlanModalOpen}
        title="Create a new plan"
        description="Plan files live in the Plans section and are saved as Markdown."
        fieldLabel="Plan name"
        placeholder="PROJECT_PLAN.md"
        confirmLabel="Create plan"
        onClose={() => setIsCreatePlanModalOpen(false)}
        onSubmit={handleCreatePlan}
      />
      <NameInputModal
        isOpen={renameTarget !== null}
        title="Rename file"
        description="Choose a new name for this file."
        fieldLabel="File name"
        placeholder="Enter file name"
        confirmLabel="Rename file"
        initialValue={renameTarget?.file.name}
        onClose={() => setRenameTarget(null)}
        onSubmit={(value) => {
          if (!renameTarget) return "No file selected.";
          return renameFile(renameTarget.path, value);
        }}
      />
    </>
  );
}
