import { useEffect, useMemo, useRef, useState } from "react";
import datasetTemplateCsv from "../../data/ailab/dataset-template.csv?raw";
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
  aiLabUploadConfig,
  aiLabUploadInstructions,
  aiLabScaleConfig,
  aiLabScaleInstructions,
  aiLabPretrainedConfig,
  aiLabPretrainedInstructions,
  aiLabSectionInstructions,
  aiLabStudioCatalog,
  aiLabStudioSectionInstructions,
  aiLabTrainYourselfConfig,
} from "../../data/ailab";
import {
  AI_LAB_STUDENT_CHOICE,
  aiLabDevDefaults,
  cardTitleColumnDevOptions,
  clearUploadedSheets,
  combineDatasetCatalog,
  datasetDevOptions,
  featureColumnDevOptions,
  findCatalogDataset,
  labDatasetCatalog,
  labelColumnDevOptions,
  mergeAiLabDevConfig,
  mergeUploadedSheets,
  readActiveDatasetId,
  readUploadedSheets,
  retainUploadedSheets,
  sheetsToDatasets,
  uniqueDevCatalog,
  writeActiveDatasetId,
  writeUploadedSheets,
  type IncomingCsv,
  type MergeUploadedSheetsResult,
  type UploadedSheet,
} from "../../lib/aiLab";
import {
  aiLabGuidedLevelLinks,
  aiLabLevelLinks,
  aiLabP0LevelLinks,
  aiLabScaleLevelLinks,
  aiLabUploadLevelLinks,
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

function aiLabControl<T extends DevPanelField>(field: T): T {
  return { ...field, lockedShare: true };
}

function aiLabDevFields(
  catalog: ReturnType<typeof uniqueDevCatalog>,
  labelDataset: (typeof catalog)[number],
  options: { fixedDecisionTree?: boolean; labelColumnId?: string } = {},
): DevPanelField[] {
  const featureOptions = featureColumnDevOptions(
    labelDataset,
    options.labelColumnId,
  );
  const fields: DevPanelField[] = [
    aiLabControl({
      key: "presetDataset",
      label: "Pre-set dataset",
      description:
        "Lock a catalog dataset so the sheet opens with it. User chooses lets the student pick.",
      type: "select",
      group: "Data",
      options: datasetDevOptions(catalog),
    }),
    aiLabControl({
      key: "presetLabelColumn",
      label: "Label column",
      description:
        "The column users predict (Predict: in the Train rail). Locking Type on Bird / mammal / fish is the curriculum default.",
      type: "select",
      group: "Data",
      options: labelColumnDevOptions(labelDataset),
    }),
    aiLabControl({
      key: "presetFeatures",
      label: "Feature columns",
      description:
        "Columns checked under Using when the sheet opens. Leave this empty and the user chooses.",
      type: "select",
      multiple: true,
      group: "Data",
      options: featureOptions,
      visibleWhen: () => featureOptions.length > 0,
    }),
    aiLabControl({
      key: "cardTitleColumn",
      label: "Card title column",
      description:
        "Use a column's value as the Cards heading (e.g. Animal → Hawk) instead of Row N. The pager still says Row N of N.",
      type: "select",
      group: "Data",
      options: cardTitleColumnDevOptions(labelDataset),
      visibleWhen: (values) => values.workspaceTabs !== "test",
    }),
    aiLabControl({
      key: "workspaceTabs",
      label: "Workspace tabs",
      description:
        "Testing only loads a trained model (Iris Species unless a dataset is pre-set). Data Set only hides Testing and combines with the other flags.",
      type: "select",
      group: "Workspace",
      options: [
        { label: "Data Set and Testing", value: "both" },
        { label: "Data Set only", value: "dataset" },
        { label: "Testing only", value: "test" },
      ],
    }),
    aiLabControl({
      key: "defaultDataView",
      label: "Default dataset view",
      type: "select",
      group: "Workspace",
      options: [
        { label: "Table", value: "table" },
        { label: "Cards", value: "cards" },
      ],
      visibleWhen: (values) => values.workspaceTabs !== "test",
    }),
    aiLabControl({
      key: "hideTrainPanel",
      label: "Hide train panel",
      description:
        "Hide the TRAIN rail on Data Set. When this is on and Testing is available, the level loads a pre-trained model.",
      type: "boolean",
      group: "Workspace",
      visibleWhen: (values) => values.workspaceTabs !== "test",
    }),
  ];

  if (options.fixedDecisionTree) {
    fields.push(
      aiLabControl({
        key: "randomizeTestData",
        label: "Random test rows",
        description:
          "Reserve random rows for testing instead of the last rows. Off keeps the last 10% of the sheet.",
        type: "boolean",
        group: "Data",
      }),
    );
  }

  if (!options.fixedDecisionTree) {
    fields.push(
      aiLabControl({
        key: "algorithmLock",
        label: "Pre-set algorithm",
        description:
          "Lock KNN or Decision Tree. User chooses keeps the setup picker.",
        type: "select",
        group: "Train",
        options: [
          { label: "User chooses", value: "none" },
          { label: "K-Nearest Neighbors", value: "knn" },
          { label: "Decision Tree", value: "decisionTree" },
        ],
      }),
      aiLabControl({
        key: "trainingAnimation",
        label: "Training animation",
        description:
          "What the Train model modal plays for a decision tree. Sort and quiz (default) shows every row as a dot sorted into piles by the tree's questions (Training), then a few rows from the sheet trace down the tree and get guessed (Testing) before the score. Tree growth is the older fallback: the finished tree drawn depth by depth.",
        type: "select",
        group: "Train",
        options: [
          { label: "Sort and quiz (training → testing)", value: "rows" },
          { label: "Tree growth (fallback)", value: "tree" },
        ],
        visibleWhen: (values) =>
          values.workspaceTabs !== "test" &&
          values.algorithmLock !== "knn" &&
          !values.hideTrainPanel,
      }),
      aiLabControl({
        key: "bundleWideSplits",
        label: "Bundle wide tree splits",
        description:
          "When a decision splits 7+ ways, leaves that predict the same label fold into one bundle per outcome (click to open). Off leaves the wide split as-is.",
        type: "boolean",
        group: "Testing",
        visibleWhen: (values) =>
          values.workspaceTabs !== "dataset" && values.algorithmLock !== "knn",
      }),
      aiLabControl({
        key: "treeNodeDetail",
        label: "Tree node details",
        description:
          "What clicking a node on the Testing diagram does. Rows modal (default) keeps nodes compact, counts correct and incorrect rows on each leaf, and opens a modal of the sheet rows that reached the node. Expand in place grows the node into a detail card.",
        type: "select",
        group: "Testing",
        options: [
          { label: "Rows modal", value: "modal" },
          { label: "Expand in place", value: "inline" },
        ],
        visibleWhen: (values) =>
          values.workspaceTabs !== "dataset" && values.algorithmLock !== "knn",
      }),
    );
  }

  fields.push(
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
  );
  return fields;
}

const UPLOADED_DATASETS_DEV_KEY = "uploadedDatasets";

const uploadDatasetsDevField: DevPanelField = {
  key: UPLOADED_DATASETS_DEV_KEY,
  label: "Add a dataset",
  description:
    "Same CSV list as Choose a dataset. Files stay in session storage for this tab. Download the template for the column layout. A few hundred rows each.",
  type: "file",
  accept: ".csv,text/csv",
  multiple: true,
  storage: "session",
  group: "Data",
  lockedShare: true,
  buttonLabel: "Browse",
  maxFiles: 20,
  maxTotalSizeBytes: 1_500_000,
  removable: true,
  dropzone: true,
  template: {
    fileName: "ai-lab-dataset-template.csv",
    content: datasetTemplateCsv,
    label: "Download template",
  },
};

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
  const sessionDatasets = Boolean(config.sessionDatasets);
  const [uploadedSheets, setUploadedSheets] = useState<UploadedSheet[]>(() =>
    config.sessionDatasets ? readUploadedSheets() : [],
  );
  const [studentDatasetId, setStudentDatasetId] = useState<string | undefined>(
    () => (config.sessionDatasets ? readActiveDatasetId() : undefined),
  );
  const uploadedDatasets = useMemo(
    () => sheetsToDatasets(uploadedSheets),
    [uploadedSheets],
  );
  const pickerCatalog = useMemo(
    () => combineDatasetCatalog(aiLabStudioCatalog, uploadedDatasets),
    [uploadedDatasets],
  );
  const catalog = useMemo(
    () =>
      sessionDatasets
        ? pickerCatalog.catalog
        : uniqueDevCatalog(config.dataset, aiLabStudioCatalog),
    [sessionDatasets, pickerCatalog.catalog, config.dataset],
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
    enableSidebarCollapse: sessionDatasets,
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
  const trainingAnimation = String(resolved.trainingAnimation);
  const treeNodeDetail = String(resolved.treeNodeDetail);
  const randomizeTestData = Boolean(resolved.randomizeTestData);
  const presetFeatures = Array.isArray(resolved.presetFeatures)
    ? resolved.presetFeatures.map(String)
    : [];
  const presetMatches = Boolean(findCatalogDataset(catalog, presetDataset));
  const effectivePreset =
    sessionDatasets &&
    !(presetMatches && presetDataset !== AI_LAB_STUDENT_CHOICE)
      ? AI_LAB_STUDENT_CHOICE
      : presetDataset;
  const sessionLocked = sessionDatasets && effectivePreset !== AI_LAB_STUDENT_CHOICE;
  const labCatalog = useMemo(
    () =>
      sessionDatasets
        ? labDatasetCatalog(pickerCatalog, [
            sessionLocked ? effectivePreset : undefined,
            studentDatasetId,
          ])
        : catalog,
    [
      sessionDatasets,
      pickerCatalog,
      sessionLocked,
      effectivePreset,
      studentDatasetId,
      catalog,
    ],
  );
  const activeDataset = sessionDatasets
    ? findCatalogDataset(
        labCatalog,
        sessionLocked ? effectivePreset : studentDatasetId,
      )
    : undefined;
  const labelDataset =
    activeDataset ??
    (sessionDatasets
      ? config.dataset
      : findCatalogDataset(catalog, effectivePreset) ?? config.dataset);
  const datasetRevision =
    uploadedSheets.find((sheet) => sheet.id === activeDataset?.id)?.updatedAt ??
    "";
  const sessionRef = useRef({
    sheets: uploadedSheets,
    sampleIds: new Set(pickerCatalog.samples.map((dataset) => dataset.id)),
  });
  sessionRef.current = {
    sheets: uploadedSheets,
    sampleIds: new Set(pickerCatalog.samples.map((dataset) => dataset.id)),
  };
  useEffect(() => {
    if (!sessionDatasets) return;
    writeActiveDatasetId(studentDatasetId);
  }, [sessionDatasets, studentDatasetId]);
  useEffect(() => {
    if (!sessionDatasets || !studentDatasetId) return;
    if (findCatalogDataset(catalog, studentDatasetId)) return;
    setStudentDatasetId(undefined);
  }, [sessionDatasets, catalog, studentDatasetId]);
  useEffect(() => {
    if (!sessionDatasets) return;
    if (presetDataset === AI_LAB_STUDENT_CHOICE || presetMatches) return;
    overrideResult.resetKey("presetDataset");
  }, [
    sessionDatasets,
    presetDataset,
    presetMatches,
    overrideResult.resetKey,
  ]);
  // Keyed on primitives so the config (and everything `useAiLabState`
  // derives from it) keeps its identity across unrelated page re-renders.
  const levelConfig = useMemo(() => {
    const merged = mergeAiLabDevConfig(
      sessionDatasets
        ? {
            ...config,
            dataset: activeDataset ?? config.dataset,
            availableDatasets: labCatalog,
            datasetRevision,
            emptyDataset: activeDataset ? undefined : config.emptyDataset,
          }
        : config,
      {
        algorithmLock: sessionDatasets ? "decisionTree" : algorithmLock,
        presetDataset: effectivePreset,
        presetLabelColumn,
        presetFeatures,
        cardTitleColumn,
        workspaceTabs,
        hideTrainPanel,
        defaultDataView,
        bundleWideSplits: sessionDatasets ? false : bundleWideSplits,
        trainingAnimation: sessionDatasets ? "rows" : trainingAnimation,
        treeNodeDetail: sessionDatasets ? "modal" : treeNodeDetail,
        randomizeTestData,
      },
      sessionDatasets ? labCatalog : catalog,
    );
    if (!sessionDatasets || sessionLocked) return merged;
    const ready = Boolean(
      activeDataset &&
        activeDataset.rows.length > 0 &&
        activeDataset.columns.length >= 2,
    );
    return {
      ...merged,
      dataset: activeDataset ?? config.dataset,
      availableDatasets: labCatalog,
      lockDataset: false,
      requireDatasetChoice: !ready,
      emptyDataset: ready ? undefined : config.emptyDataset,
    };
  }, [
    sessionDatasets,
    sessionLocked,
    config,
    activeDataset,
    labCatalog,
    catalog,
    datasetRevision,
    algorithmLock,
    effectivePreset,
    presetLabelColumn,
    presetFeatures,
    cardTitleColumn,
    workspaceTabs,
    hideTrainPanel,
    defaultDataView,
    bundleWideSplits,
    trainingAnimation,
    treeNodeDetail,
    randomizeTestData,
  ]);
  const lab = useAiLabState(levelConfig);
  const levelIndex =
    progressLevelIndex ?? currentLevelIndex(currentLevelPath, levelLinks);
  const progressLinks = levelLinks;
  const studioInstructions =
    levelConfig.showModelDetails ||
    levelConfig.showExport ||
    levelConfig.requireDatasetChoice;
  const p0Instructions = config === aiLabP0Config;
  const uploadInstructions = Boolean(config.sessionDatasets);
  const scaleInstructions = config === aiLabScaleConfig;
  const instructions =
    instructionsMarkdown ??
    (uploadInstructions
      ? lab.section === "test"
        ? aiLabUploadInstructions.test
        : aiLabUploadInstructions.dataset
      : p0Instructions
      ? lab.section === "test"
        ? aiLabP0Instructions.test
        : aiLabP0Instructions.dataset
      : scaleInstructions
        ? lab.section === "test"
          ? aiLabScaleInstructions.test
          : aiLabScaleInstructions.dataset
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
  const devPanelFields = useMemo(() => {
    const labelColumnId =
      presetLabelColumn !== AI_LAB_STUDENT_CHOICE ? presetLabelColumn : undefined;
    const fields = aiLabDevFields(catalog, labelDataset, {
      fixedDecisionTree: sessionDatasets,
      labelColumnId,
    });
    return sessionDatasets ? [uploadDatasetsDevField, ...fields] : fields;
  }, [sessionDatasets, catalog, labelDataset, presetLabelColumn]);
  const storeSheets = (next: UploadedSheet[]) => {
    if (next.length === 0) clearUploadedSheets();
    else writeUploadedSheets(next);
    sessionRef.current = { ...sessionRef.current, sheets: next };
    setUploadedSheets(next);
    setStudentDatasetId((active) => {
      if (!active) return active;
      if (next.some((sheet) => sheet.id === active)) return active;
      if (sessionRef.current.sampleIds.has(active)) return active;
      return undefined;
    });
  };

  const commitUploads = (
    files: IncomingCsv[],
    focus: boolean,
  ): MergeUploadedSheetsResult => {
    const current = sessionRef.current.sheets;
    const result = mergeUploadedSheets(current, files);
    if (result.sheets === current) return result;
    try {
      if (result.sheets.length === 0) clearUploadedSheets();
      else writeUploadedSheets(result.sheets);
    } catch (error) {
      return {
        sheets: current,
        error:
          error instanceof Error
            ? error.message
            : "This tab cannot store that file.",
      };
    }
    sessionRef.current = { ...sessionRef.current, sheets: result.sheets };
    setUploadedSheets(result.sheets);
    if (focus && result.focusId) setStudentDatasetId(result.focusId);
    return result;
  };

  const removeUploadById = (datasetId: string) => {
    const next = sessionRef.current.sheets.filter((sheet) => sheet.id !== datasetId);
    if (next.length === sessionRef.current.sheets.length) return;
    storeSheets(next);
  };

  const uploadedDatasetFieldValue = uploadedSheets.length
    ? {
        files: uploadedSheets.map((sheet) => ({
          name: sheet.fileName,
          path: sheet.fileName,
          type: "text/csv",
          size: sheet.csv.length,
          content: sheet.csv,
        })),
        uploadedAt: uploadedSheets[uploadedSheets.length - 1]?.updatedAt,
      }
    : undefined;

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
        devPanelSessionValues: sessionDatasets
          ? { [UPLOADED_DATASETS_DEV_KEY]: uploadedDatasetFieldValue }
          : undefined,
        onDevPanelSessionValueChange: sessionDatasets
          ? (key, value) => {
              if (key !== UPLOADED_DATASETS_DEV_KEY) return;
              const payload = value as {
                files?: { name: string; content: string }[];
                source?: string;
              } | undefined;
              const files = payload?.files ?? [];
              if (payload?.source === "remove") {
                storeSheets(
                  retainUploadedSheets(
                    sessionRef.current.sheets,
                    files.map((file) => file.name),
                  ),
                );
                return;
              }
              if (files.length === 0) return;
              const result = commitUploads(files, !sessionLocked);
              if (result.error) throw new Error(result.error);
            }
          : undefined,
        onDevPanelSessionValueReset: sessionDatasets
          ? (key) => {
              if (key !== UPLOADED_DATASETS_DEV_KEY) return;
              storeSheets([]);
            }
          : undefined,
      }}
      onResize={(delta) => {
        setSidebarWidth((prev) => Math.max(280, Math.min(520, prev + delta)));
      }}
    >
      {workspace === "guided" ? (
        <AiLabGuidedWorkspace
          lab={lab}
          datasetPicker={
            sessionDatasets
              ? {
                  presets: pickerCatalog.samples,
                  uploads: uploadedSheets.flatMap((sheet) => {
                    const dataset = uploadedDatasets.find(
                      (entry) => entry.id === sheet.id,
                    );
                    return dataset
                      ? [{ dataset, fileName: sheet.fileName }]
                      : [];
                  }),
                  template: {
                    fileName: "ai-lab-dataset-template.csv",
                    content: datasetTemplateCsv,
                    label: "Download template",
                  },
                  onUpload: (files) => commitUploads(files, false),
                  onRemoveUpload: removeUploadById,
                  onApply: (datasetId) => setStudentDatasetId(datasetId),
                }
              : undefined
          }
          onReturnToDatasetStart={
            sessionDatasets && !sessionLocked
              ? () => setStudentDatasetId(undefined)
              : undefined
          }
        />
      ) : (
        <AiLabWorkspace lab={lab} />
      )}
    </Lab2Shell>
  );
}

export function AiLabScaleLevelPage() {
  return (
    <AiLabLevelPage
      currentLevelPath="/levels/ailab-scale"
      title="AI Lab: Group a number"
      subtitle="Scale"
      config={aiLabScaleConfig}
      continueLabel="Finish"
      continueTo="/levels"
      levelLinks={aiLabScaleLevelLinks}
    />
  );
}

export function AiLabUploadLevelPage() {
  return (
    <AiLabLevelPage
      currentLevelPath="/levels/ailab-upload"
      title="AI Lab: Train a model"
      subtitle="Your data"
      config={aiLabUploadConfig}
      continueLabel="Finish"
      continueTo="/levels"
      levelLinks={aiLabUploadLevelLinks}
    />
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

