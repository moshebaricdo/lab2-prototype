import type { ChatMessage } from "../../types/chat";
import type { FileItem } from "../../types/file";
import type {
  ValidationEffortPolicy,
  ValidationReviewCardData,
  ValidationReviewCheck,
  ValidationReviewConfidence,
  ValidationReviewItem,
  ValidationReviewItemStatus,
  ValidationReviewStatus,
  WebLab2ValidationReviewConfig,
} from "../../types/validationReview";

interface SourceFile {
  path: string;
  name: string;
  content: string;
}

export interface ValidationReviewEvidence {
  changedFileCount: number;
  changedFileNames: string[];
  userTurnCount: number;
  acceptedTutorChanges: boolean;
  hasHtml: boolean;
  hasCss: boolean;
  hasJs: boolean;
}

export interface VersionHistoryValidationSummary {
  manualSavesWithDescription: number;
  revertedToDescribedManualSave: boolean;
}

function flattenFiles(items: FileItem[] = [], parentPath = ""): SourceFile[] {
  return items.flatMap((item) => {
    const itemPath = parentPath ? `${parentPath}/${item.name}` : item.name;
    if (item.type === "folder") {
      return flattenFiles(item.children ?? [], itemPath);
    }

    return [{
      path: itemPath,
      name: item.name,
      content: item.content ?? "",
    }];
  });
}

function fileKey(file: SourceFile) {
  return file.path.toLowerCase();
}

function findSourceFile(files: SourceFile[], targetFile?: string) {
  if (!targetFile) return null;
  const normalized = targetFile.toLowerCase();
  return files.find((file) =>
    file.path.toLowerCase() === normalized ||
    file.name.toLowerCase() === normalized ||
    file.path.toLowerCase().endsWith(`/${normalized}`)
  ) ?? null;
}

function serializeFileTreeForComparison(tree: FileItem[]) {
  return JSON.stringify(
    tree.map((item) => ({
      name: item.name,
      type: item.type,
      content: item.content,
      children: item.children,
    })),
  );
}

export function buildVersionHistoryValidationSummary(
  snapshots: Array<{
    kind: string;
    description?: string;
    fileStructure: FileItem[];
  }>,
  currentFileStructure: FileItem[],
): VersionHistoryValidationSummary {
  const manualSnapshots = snapshots.filter((snapshot) => snapshot.kind === "manual");
  const describedManualSnapshots = manualSnapshots.filter((snapshot) =>
    snapshot.description?.trim(),
  );
  const currentSignature = serializeFileTreeForComparison(currentFileStructure);
  const revertedToDescribedManualSave = describedManualSnapshots.some(
    (snapshot) =>
      serializeFileTreeForComparison(snapshot.fileStructure) === currentSignature,
  );

  return {
    manualSavesWithDescription: describedManualSnapshots.length,
    revertedToDescribedManualSave,
  };
}

export function buildVersionHistoryReviewItems(
  summary: VersionHistoryValidationSummary,
  evidence: ValidationReviewEvidence,
): ValidationReviewItem[] {
  const savedWithDescription = summary.manualSavesWithDescription >= 1;
  const hasProjectActivity =
    evidence.userTurnCount >= 1 ||
    evidence.acceptedTutorChanges ||
    evidence.changedFileCount > 0;
  const revertedAsRequired =
    summary.revertedToDescribedManualSave &&
    savedWithDescription &&
    hasProjectActivity;

  return [
    {
      id: "save-with-description",
      label: "Save with a comment",
      status: savedWithDescription ? "pass" : "missing",
      detail: savedWithDescription
        ? "A manual version with a description was saved in Version History."
        : "Save your work in Version History with a short description of what you changed.",
    },
    {
      id: "revert-to-described-save",
      label: "Revert as needed",
      status: revertedAsRequired ? "pass" : "missing",
      detail: revertedAsRequired
        ? "Your current project matches a version you saved with a description."
        : "When prompted, restore the version you saved with a description.",
    },
  ];
}

function appendVersionHistoryItems(
  items: ValidationReviewItem[],
  summary: VersionHistoryValidationSummary | undefined,
  evidence: ValidationReviewEvidence,
) {
  if (!summary) return items;
  return [...items, ...buildVersionHistoryReviewItems(summary, evidence)];
}

function getChangedFiles(currentFiles: SourceFile[], initialFiles: SourceFile[]) {
  const initialContentByPath = new Map(
    initialFiles.map((file) => [fileKey(file), file.content]),
  );

  return currentFiles.filter((file) =>
    initialContentByPath.get(fileKey(file)) !== file.content,
  );
}

export function resolveValidationEffortPolicy(
  config: WebLab2ValidationReviewConfig,
): ValidationEffortPolicy {
  if (config.effortPolicy) return config.effortPolicy;
  return config.mode === "technical" ? "none" : "advisory";
}

export function getValidationMinimumChangedFiles(
  config: WebLab2ValidationReviewConfig,
) {
  return config.minimumChangedFiles ?? 1;
}

function evaluateCheck(
  check: ValidationReviewCheck,
  files: SourceFile[],
): ValidationReviewItem {
  const target = findSourceFile(files, check.targetFile);
  const source = target?.content ?? files.map((file) => file.content).join("\n\n");
  let passed = false;

  if (check.matcher.type === "includes") {
    passed = source.includes(check.matcher.value);
  } else {
    try {
      passed = new RegExp(check.matcher.value, check.matcher.flags).test(source);
    } catch {
      passed = false;
    }
  }

  return {
    id: check.id,
    label: check.label,
    status: passed ? "pass" : "missing",
    detail: passed ? check.passDetail : check.failDetail,
  };
}

function applyGoalLabels(
  items: ValidationReviewItem[],
  labels: string[] | undefined,
) {
  if (!labels || labels.length === 0) return items;
  return items.map((item, index) => ({
    ...item,
    label: labels[index]?.trim() || item.label,
  }));
}

export function buildValidationReviewEvidence({
  currentFileStructure,
  initialFileStructure,
  chatMessages,
}: {
  currentFileStructure: FileItem[];
  initialFileStructure: FileItem[];
  chatMessages: ChatMessage[];
}): ValidationReviewEvidence {
  const currentFiles = flattenFiles(currentFileStructure);
  const initialFiles = flattenFiles(initialFileStructure);
  const changedFiles = getChangedFiles(currentFiles, initialFiles);
  const userTurnCount = chatMessages.filter((message) => message.role === "user").length;
  const acceptedTutorChanges = chatMessages.some(
    (message) => message.codeChangeStatus === "accepted",
  );

  return {
    changedFileCount: changedFiles.length,
    changedFileNames: changedFiles.map((file) => file.path),
    userTurnCount,
    acceptedTutorChanges,
    hasHtml: currentFiles.some((file) => file.name.endsWith(".html")),
    hasCss: currentFiles.some((file) => file.name.endsWith(".css")),
    hasJs: currentFiles.some((file) => file.name.endsWith(".js")),
  };
}

function buildEvidence({
  evidence,
}: {
  evidence: ValidationReviewEvidence;
}) {
  const summary = [];

  if (evidence.changedFileCount > 0) {
    summary.push(`${evidence.changedFileCount} project file${evidence.changedFileCount === 1 ? "" : "s"} changed.`);
  } else {
    summary.push("No project file changes detected yet.");
  }

  const fileTypes = [
    evidence.hasHtml ? "HTML" : null,
    evidence.hasCss ? "CSS" : null,
    evidence.hasJs ? "JavaScript" : null,
  ].filter(Boolean);
  if (fileTypes.length > 0) {
    summary.push(`Project includes ${fileTypes.join(", ")}.`);
  }

  if (evidence.userTurnCount > 0) {
    summary.push(`${evidence.userTurnCount} Tutor turn${evidence.userTurnCount === 1 ? "" : "s"} from the student.`);
  }

  if (evidence.acceptedTutorChanges) {
    summary.push("At least one Tutor proposal was accepted.");
  }

  return summary;
}

export function buildValidationEffortItem(
  config: WebLab2ValidationReviewConfig,
  evidence: ValidationReviewEvidence,
): ValidationReviewItem | null {
  const policy = resolveValidationEffortPolicy(config);
  if (policy === "none") return null;

  const minimumChangedFiles = getValidationMinimumChangedFiles(config);
  const hasEnoughIteration =
    evidence.changedFileCount >= minimumChangedFiles || evidence.acceptedTutorChanges;
  const changedFileSummary = evidence.changedFileNames.length > 0
    ? `Changed files: ${evidence.changedFileNames.join(", ")}.`
    : "No project file changes detected yet.";

  if (hasEnoughIteration) {
    return {
      id: "workspace-progress",
      label: "Meaningful project iteration",
      status: "pass",
      detail: `${changedFileSummary} There is evidence of intentional project refinement.`,
    };
  }

  return {
    id: "workspace-progress",
    label: "Meaningful project iteration",
    status: policy === "required" ? "missing" : "warn",
    detail:
      "The starter already has some polish, but I do not see your own refinement yet. Try adjusting one hover, focus, spacing, or brand detail, then check again.",
  };
}

export function getValidationReviewSummaryStatus(
  items: ValidationReviewItem[],
): {
  status: ValidationReviewStatus;
  confidence: ValidationReviewConfidence;
} {
  const missingCount = items.filter((item) => item.status === "missing").length;
  const warnCount = items.filter((item) => item.status === "warn").length;
  const passCount = items.filter((item) => item.status === "pass").length;

  if (items.length > 0 && missingCount === 0 && warnCount === 0 && passCount === items.length) {
    return { status: "likely_complete", confidence: "high" };
  }

  if (missingCount > 0 && passCount > 0) {
    return { status: "needs_work", confidence: "medium" };
  }

  if (passCount > 0 || warnCount > 0) {
    return { status: "in_progress", confidence: "medium" };
  }

  return { status: "not_started", confidence: "low" };
}

function mergeEffortIntoOpenEndedRequirements(
  config: WebLab2ValidationReviewConfig,
  items: ValidationReviewItem[],
  effortItem: ValidationReviewItem | null,
) {
  if (!effortItem) return items;
  if (config.mode !== "open-ended" || items.length !== 1) {
    return [...items, effortItem];
  }

  const [item] = items;
  const status: ValidationReviewItemStatus = item.status === "missing" || effortItem.status === "missing"
    ? "missing"
    : item.status === "warn" || effortItem.status === "warn"
      ? "warn"
      : "pass";
  const detail = status === "pass"
    ? `${item.detail} ${effortItem.detail}`
    : effortItem.status === "missing"
      ? effortItem.detail
      : item.detail;

  return [{
    ...item,
    status,
    detail,
  }];
}

function getNextStep(status: ValidationReviewStatus) {
  if (status === "likely_complete") {
    return "Test the project in Preview one more time, then continue when it behaves the way you expect.";
  }
  if (status === "needs_work") {
    return "Keep going with one focused refinement, then run Check My Work again. Try improving a hover, focus, spacing, or brand detail so the page shows your own polish.";
  }
  if (status === "in_progress") {
    return "Keep iterating. Make one focused change, test it, and ask Tutor to review again.";
  }
  return "Start with one small style refinement. You can ask Tutor to make a hover, focus, spacing, or color update, then check again when you have a change to review.";
}

export function createWebLab2ValidationReview({
  config,
  currentFileStructure,
  initialFileStructure,
  chatMessages,
  versionHistorySummary,
}: {
  config: WebLab2ValidationReviewConfig;
  currentFileStructure: FileItem[];
  initialFileStructure: FileItem[];
  chatMessages: ChatMessage[];
  versionHistorySummary?: VersionHistoryValidationSummary;
}): ValidationReviewCardData {
  const currentFiles = flattenFiles(currentFileStructure);
  const checks = config.checks ?? [];
  const evidence = buildValidationReviewEvidence({
    currentFileStructure,
    initialFileStructure,
    chatMessages,
  });
  const effortItem = buildValidationEffortItem(config, evidence);
  const items = appendVersionHistoryItems(
    mergeEffortIntoOpenEndedRequirements(
      config,
      applyGoalLabels(
        checks.map((check) => evaluateCheck(check, currentFiles)),
        config.goalLabels,
      ),
      effortItem,
    ),
    versionHistorySummary,
    evidence,
  );

  const summary = getValidationReviewSummaryStatus(items);
  const missingRequiredEffort = effortItem?.status === "missing";
  const status: ValidationReviewStatus = missingRequiredEffort ? "needs_work" : summary.status;
  const confidence: ValidationReviewConfidence = missingRequiredEffort ? "medium" : summary.confidence;

  return {
    kind: "summary",
    title: config.title,
    mode: config.mode,
    status,
    confidence,
    items,
    requirements: config.goals,
    requirementLabels: config.goalLabels,
    evidence: buildEvidence({ evidence }),
    nextStep: getNextStep(status),
    followUpPreference: config.followUpPreference,
  };
}

export function createValidationReviewOffer(
  config: WebLab2ValidationReviewConfig,
): ValidationReviewCardData {
  return {
    kind: "offer",
    title: config.title,
    mode: config.mode,
    requirements: config.goals,
    requirementLabels: config.goalLabels,
    followUpPreference: config.followUpPreference,
    nextStep:
      "I can check your work when you're ready and let you know whether you're ready to continue.",
  };
}
