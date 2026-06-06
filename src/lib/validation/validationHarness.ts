import type { ChatMessage } from "../../types/chat";
import type { FileItem } from "../../types/file";
import type {
  ValidationEffortPolicy,
  ValidationReviewCardData,
  ValidationReviewConfidence,
  ValidationReviewItem,
  ValidationReviewItemStatus,
  ValidationReviewStatus,
  WebLab2ValidationReviewConfig,
} from "../../types/validationReview";
import {
  assessmentNeedsVersionHistorySnapshots,
  resolveGoalEvaluators,
  type GoalEvaluatorKind,
} from "./validationGoalEvaluators";
import {
  resolveValidationReviewProfile,
  type ValidationReviewProfile,
} from "./validationReviewProfile";

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

export interface AiGoalEvaluation {
  status: ValidationReviewItemStatus;
  detail: string;
}

const MINIMUM_CHANGED_FILES = 1;

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

function getChangedFiles(currentFiles: SourceFile[], initialFiles: SourceFile[]) {
  const initialContentByPath = new Map(
    initialFiles.map((file) => [fileKey(file), file.content]),
  );

  return currentFiles.filter((file) =>
    initialContentByPath.get(fileKey(file)) !== file.content,
  );
}

function hasEnoughIterationEvidence(evidence: ValidationReviewEvidence) {
  return evidence.changedFileCount >= MINIMUM_CHANGED_FILES || evidence.acceptedTutorChanges;
}

function effortMissingDetail() {
  return "The starter already has some polish, but I do not see your own refinement yet. Try adjusting one hover, focus, spacing, or brand detail, then check again.";
}

function applyEffortGateToAiGoal(
  item: ValidationReviewItem,
  profile: Pick<ValidationReviewProfile, "effortPolicy">,
  evidence: ValidationReviewEvidence,
): ValidationReviewItem {
  if (profile.effortPolicy !== "required") return item;
  if (hasEnoughIterationEvidence(evidence)) return item;

  if (item.status === "pass") {
    return {
      ...item,
      status: "missing",
      detail: effortMissingDetail(),
    };
  }

  return {
    ...item,
    status: "missing",
    detail: effortMissingDetail(),
  };
}

function buildNoKeyAiGoalItem(
  goalIndex: number,
  label: string,
  profile: Pick<ValidationReviewProfile, "effortPolicy">,
  evidence: ValidationReviewEvidence,
): ValidationReviewItem {
  if (profile.effortPolicy === "required" && !hasEnoughIterationEvidence(evidence)) {
    return {
      id: `requirement-${goalIndex}`,
      label,
      status: "missing",
      detail: effortMissingDetail(),
    };
  }

  return {
    id: `requirement-${goalIndex}`,
    label,
    status: "warn",
    detail: "Add a Tutor API key in Lab Settings to evaluate this requirement.",
  };
}

function evaluateVersionHistorySaveGoal(
  goalIndex: number,
  label: string,
  summary: VersionHistoryValidationSummary | undefined,
): ValidationReviewItem {
  const savedWithDescription = (summary?.manualSavesWithDescription ?? 0) >= 1;

  return {
    id: `requirement-${goalIndex}`,
    label,
    status: savedWithDescription ? "pass" : "missing",
    detail: savedWithDescription
      ? "A manual version with a description was saved in Version History."
      : "Save your work in Version History with a short description of what you changed.",
  };
}

function evaluateVersionHistoryRevertGoal(
  goalIndex: number,
  label: string,
  summary: VersionHistoryValidationSummary | undefined,
  evidence: ValidationReviewEvidence,
): ValidationReviewItem {
  const savedWithDescription = (summary?.manualSavesWithDescription ?? 0) >= 1;
  const hasProjectActivity =
    evidence.userTurnCount >= 1 ||
    evidence.acceptedTutorChanges ||
    evidence.changedFileCount > 0;
  const revertedAsRequired = Boolean(
    summary?.revertedToDescribedManualSave &&
    savedWithDescription &&
    hasProjectActivity,
  );

  return {
    id: `requirement-${goalIndex}`,
    label,
    status: revertedAsRequired ? "pass" : "missing",
    detail: revertedAsRequired
      ? "Your current project matches a version you saved with a description."
      : "When prompted, restore the version you saved with a description.",
  };
}

function evaluateDeterministicGoal(
  kind: Extract<GoalEvaluatorKind, "version-history-save" | "version-history-revert">,
  goalIndex: number,
  label: string,
  summary: VersionHistoryValidationSummary | undefined,
  evidence: ValidationReviewEvidence,
): ValidationReviewItem {
  if (kind === "version-history-save") {
    return evaluateVersionHistorySaveGoal(goalIndex, label, summary);
  }
  return evaluateVersionHistoryRevertGoal(goalIndex, label, summary, evidence);
}

export function buildChecklistItems({
  config,
  profile,
  evidence,
  versionHistorySummary,
  aiEvaluationsByGoalIndex = {},
}: {
  config: WebLab2ValidationReviewConfig;
  profile: Pick<ValidationReviewProfile, "effortPolicy">;
  evidence: ValidationReviewEvidence;
  versionHistorySummary?: VersionHistoryValidationSummary;
  aiEvaluationsByGoalIndex?: Partial<Record<number, AiGoalEvaluation>>;
}): ValidationReviewItem[] {
  return resolveGoalEvaluators(config).map(({ goalIndex, kind }) => {
    const label = config.goalLabels?.[goalIndex]?.trim() || config.goals[goalIndex]?.trim() || `Requirement ${goalIndex + 1}`;

    if (kind !== "ai") {
      return evaluateDeterministicGoal(
        kind,
        goalIndex,
        label,
        versionHistorySummary,
        evidence,
      );
    }

    const aiEvaluation = aiEvaluationsByGoalIndex[goalIndex];
    const baseItem = aiEvaluation
      ? {
          id: `requirement-${goalIndex}`,
          label,
          status: aiEvaluation.status,
          detail: aiEvaluation.detail,
        }
      : buildNoKeyAiGoalItem(goalIndex, label, profile, evidence);

    return applyEffortGateToAiGoal(baseItem, profile, evidence);
  });
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

function buildEvidenceSummary({
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

  if (missingCount > 0) {
    return { status: "needs_work", confidence: "medium" };
  }

  return { status: "not_started", confidence: "low" };
}

function getNextStep(status: ValidationReviewStatus, items: ValidationReviewItem[]) {
  if (status === "likely_complete") {
    return "Test the project in Preview one more time, then continue when it behaves the way you expect.";
  }

  const nextIncomplete = items.find((item) => item.status !== "pass");
  if (nextIncomplete) {
    return `Next up: ${nextIncomplete.label}. Check again when that step is ready.`;
  }

  if (status === "needs_work") {
    return "Keep going on the remaining checklist items, then run Check My Work again.";
  }

  if (status === "in_progress") {
    return "Keep iterating. Make one focused change, test it, and ask Tutor to review again.";
  }

  return "Start with one small project change, then check again when you have something to review.";
}

export function createValidationReview({
  config,
  instructionsMarkdown,
  currentFileStructure,
  initialFileStructure,
  chatMessages,
  versionHistorySummary,
  aiEvaluationsByGoalIndex,
}: {
  config: WebLab2ValidationReviewConfig;
  instructionsMarkdown?: string;
  currentFileStructure: FileItem[];
  initialFileStructure: FileItem[];
  chatMessages: ChatMessage[];
  versionHistorySummary?: VersionHistoryValidationSummary;
  aiEvaluationsByGoalIndex?: Partial<Record<number, AiGoalEvaluation>>;
}): ValidationReviewCardData {
  const profile = resolveValidationReviewProfile(config, { instructionsMarkdown });
  const evidence = buildValidationReviewEvidence({
    currentFileStructure,
    initialFileStructure,
    chatMessages,
  });
  const items = buildChecklistItems({
    config,
    profile,
    evidence,
    versionHistorySummary,
    aiEvaluationsByGoalIndex,
  });
  const summary = getValidationReviewSummaryStatus(items);

  return {
    kind: "summary",
    title: profile.title,
    mode: profile.reviewMode,
    status: summary.status,
    confidence: summary.confidence,
    items,
    requirements: config.goals,
    requirementLabels: config.goalLabels,
    evidence: buildEvidenceSummary({ evidence }),
    nextStep: getNextStep(summary.status, items),
  };
}

export function createValidationReviewOffer(
  config: WebLab2ValidationReviewConfig,
  instructionsMarkdown?: string,
): ValidationReviewCardData {
  const profile = resolveValidationReviewProfile(config, { instructionsMarkdown });
  return {
    kind: "offer",
    title: profile.title,
    mode: profile.reviewMode,
    requirements: config.goals,
    requirementLabels: config.goalLabels,
    nextStep:
      "I can check your work when you're ready and let you know whether you're ready to continue.",
  };
}

export { assessmentNeedsVersionHistorySnapshots };
