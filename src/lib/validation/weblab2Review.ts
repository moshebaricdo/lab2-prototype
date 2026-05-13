import type { ChatMessage } from "../../types/chat";
import type { FileItem } from "../../types/file";
import type {
  ValidationReviewCardData,
  ValidationReviewCheck,
  ValidationReviewConfidence,
  ValidationReviewItem,
  ValidationReviewStatus,
  WebLab2ValidationReviewConfig,
} from "../../types/validationReview";

interface SourceFile {
  path: string;
  name: string;
  content: string;
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

function getChangedFiles(currentFiles: SourceFile[], initialFiles: SourceFile[]) {
  const initialContentByPath = new Map(
    initialFiles.map((file) => [fileKey(file), file.content]),
  );

  return currentFiles.filter((file) =>
    initialContentByPath.get(fileKey(file)) !== file.content,
  );
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

function buildEvidence({
  changedFiles,
  chatMessages,
  hasHtml,
  hasCss,
  hasJs,
}: {
  changedFiles: SourceFile[];
  chatMessages: ChatMessage[];
  hasHtml: boolean;
  hasCss: boolean;
  hasJs: boolean;
}) {
  const userTurns = chatMessages.filter((message) => message.role === "user").length;
  const acceptedTutorChanges = chatMessages.some(
    (message) => message.codeChangeStatus === "accepted",
  );
  const evidence = [];

  if (changedFiles.length > 0) {
    evidence.push(`${changedFiles.length} project file${changedFiles.length === 1 ? "" : "s"} changed.`);
  } else {
    evidence.push("No project file changes detected yet.");
  }

  const fileTypes = [
    hasHtml ? "HTML" : null,
    hasCss ? "CSS" : null,
    hasJs ? "JavaScript" : null,
  ].filter(Boolean);
  if (fileTypes.length > 0) {
    evidence.push(`Project includes ${fileTypes.join(", ")}.`);
  }

  if (userTurns > 0) {
    evidence.push(`${userTurns} Tutor turn${userTurns === 1 ? "" : "s"} from the student.`);
  }

  if (acceptedTutorChanges) {
    evidence.push("At least one Tutor proposal was accepted.");
  }

  return evidence;
}

function getSummaryStatus(
  items: ValidationReviewItem[],
  changedFileCount: number,
  minimumChangedFiles: number,
): {
  status: ValidationReviewStatus;
  confidence: ValidationReviewConfidence;
} {
  const missingCount = items.filter((item) => item.status === "missing").length;
  const hasEnoughChanges = changedFileCount >= minimumChangedFiles;

  if (items.length > 0 && missingCount === 0 && hasEnoughChanges) {
    return { status: "likely_complete", confidence: "high" };
  }

  if (missingCount > 0 && changedFileCount > 0) {
    return { status: "needs_work", confidence: "medium" };
  }

  if (changedFileCount > 0 || items.some((item) => item.status === "pass")) {
    return { status: "in_progress", confidence: "medium" };
  }

  return { status: "not_started", confidence: "low" };
}

function getNextStep(status: ValidationReviewStatus) {
  if (status === "likely_complete") {
    return "Test the project in Preview one more time, then continue when it behaves the way you expect.";
  }
  if (status === "needs_work") {
    return "Use the missing items above as your next checklist, then run Check My Work again.";
  }
  if (status === "in_progress") {
    return "Keep iterating. Make one focused change, test it, and ask Tutor to review again.";
  }
  return "Start by editing the project or asking Tutor for help, then come back for a review.";
}

export function createWebLab2ValidationReview({
  config,
  currentFileStructure,
  initialFileStructure,
  chatMessages,
}: {
  config: WebLab2ValidationReviewConfig;
  currentFileStructure: FileItem[];
  initialFileStructure: FileItem[];
  chatMessages: ChatMessage[];
}): ValidationReviewCardData {
  const currentFiles = flattenFiles(currentFileStructure);
  const initialFiles = flattenFiles(initialFileStructure);
  const changedFiles = getChangedFiles(currentFiles, initialFiles);
  const checks = config.checks ?? [];
  const minimumChangedFiles = config.minimumChangedFiles ?? (config.mode === "technical" ? 1 : 2);
  const hasHtml = currentFiles.some((file) => file.name.endsWith(".html"));
  const hasCss = currentFiles.some((file) => file.name.endsWith(".css"));
  const hasJs = currentFiles.some((file) => file.name.endsWith(".js"));
  const items: ValidationReviewItem[] = [
    ...checks.map((check) => evaluateCheck(check, currentFiles)),
  ];

  if (config.mode !== "technical") {
    items.push({
      id: "workspace-progress",
      label: "Meaningful project iteration",
      status: changedFiles.length >= minimumChangedFiles ? "pass" : "warn",
      detail: changedFiles.length >= minimumChangedFiles
        ? "There is evidence of changes across the project."
        : "Make a few visible edits so the review has stronger evidence of effort.",
    });
  }

  const { status, confidence } = getSummaryStatus(
    items,
    changedFiles.length,
    minimumChangedFiles,
  );

  return {
    kind: "summary",
    title: config.title,
    mode: config.mode,
    status,
    confidence,
    items,
    evidence: buildEvidence({
      changedFiles,
      chatMessages,
      hasHtml,
      hasCss,
      hasJs,
    }),
    nextStep: getNextStep(status),
  };
}

export function createValidationReviewOffer(
  config: WebLab2ValidationReviewConfig,
): ValidationReviewCardData {
  return {
    kind: "offer",
    title: "Ready for a review?",
    mode: config.mode,
    nextStep:
      "I can run a quick check using this level's goals and the current project files.",
  };
}
