import { getTutorApiKey, getTutorCodeModel } from "../../hooks/useTutorApiSettings";
import type { ChatMessage } from "../../types/chat";
import type { FileItem } from "../../types/file";
import type {
  ValidationReviewCardData,
  ValidationReviewItem,
  ValidationReviewItemStatus,
  WebLab2ValidationReviewConfig,
} from "../../types/validationReview";
import { analyzeProject } from "../tutor/projectAnalyzer";
import { packTutorContext } from "../tutor/contextPacker";
import type { TutorChatMessage } from "../tutor/types";
import {
  buildValidationEffortItem,
  buildValidationReviewEvidence,
  getValidationReviewSummaryStatus,
  resolveValidationEffortPolicy,
} from "./weblab2Review";

interface AiReviewResponse {
  status?: ValidationReviewCardData["status"];
  confidence?: ValidationReviewCardData["confidence"];
  items?: Array<{
    label?: string;
    status?: ValidationReviewItemStatus;
    detail?: string;
  }>;
  headline?: string;
}

function normalizeStatus(value: unknown): ValidationReviewCardData["status"] {
  if (
    value === "not_started" ||
    value === "in_progress" ||
    value === "needs_work" ||
    value === "likely_complete"
  ) {
    return value;
  }
  return "in_progress";
}

function normalizeConfidence(value: unknown): ValidationReviewCardData["confidence"] {
  if (value === "low" || value === "medium" || value === "high") return value;
  return "medium";
}

function normalizeItemStatus(value: unknown): ValidationReviewItemStatus {
  if (value === "pass" || value === "warn" || value === "missing") return value;
  return "warn";
}

function buildConversationSummary(chatMessages: ChatMessage[]) {
  return chatMessages
    .filter((message) => !message.isAlert)
    .slice(-8)
    .map((message) => `${message.role}: ${message.content.slice(0, 600)}`)
    .join("\n\n");
}

function normalizeItems(
  responseItems: AiReviewResponse["items"],
  requirements: string[],
  labels?: string[],
): ValidationReviewItem[] {
  return requirements.map((requirement, index) => {
    const item = responseItems?.[index];
    const status = normalizeItemStatus(item?.status);
    return {
      id: `ai-requirement-${index}`,
      label: labels?.[index]?.trim() || item?.label?.trim() || requirement,
      status,
      detail: status === "pass"
        ? item?.detail?.trim() || "Evidence found."
        : "Keep working",
    };
  });
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

export async function createAiWebLab2ValidationReview({
  config,
  currentFileStructure,
  initialFileStructure,
  chatMessages,
}: {
  config: WebLab2ValidationReviewConfig;
  currentFileStructure: FileItem[];
  initialFileStructure: FileItem[];
  chatMessages: ChatMessage[];
}): Promise<ValidationReviewCardData | null> {
  const apiKey = getTutorApiKey().trim();
  if (!apiKey) return null;

  const requirements = config.goals.filter((goal) => goal.trim());
  if (requirements.length === 0) return null;

  const analysis = analyzeProject(currentFileStructure);
  const evidence = buildValidationReviewEvidence({
    currentFileStructure,
    initialFileStructure,
    chatMessages,
  });
  const effortItem = buildValidationEffortItem(config, evidence);
  const effortPolicy = resolveValidationEffortPolicy(config);
  const packedContext = packTutorContext(
    analysis,
    requirements.join("\n"),
    18000,
  );
  const messages: TutorChatMessage[] = [
    {
      role: "system",
      content: [
        "You evaluate Web Lab 2 student work against explicit level-builder requirements.",
        "Use ONLY the supplied project files, project map, and recent conversation.",
        "Do not reveal exact fixes, exact code, selectors to change, or step-by-step solutions.",
        "Return JSON only with this shape:",
        "{ \"status\": \"not_started|in_progress|needs_work|likely_complete\", \"confidence\": \"low|medium|high\", \"headline\": string, \"items\": [{ \"label\": string, \"status\": \"pass|warn|missing\", \"detail\": string }] }",
        "Create exactly one item per requirement, in the same order.",
        "Use 'pass' only when there is clear evidence. Use 'warn' when partially addressed. Use 'missing' when not addressed.",
        "Use the supplied effort evidence when judging open-ended refinement work. If the current files match the starter and effortPolicy is required, do not treat starter polish as enough evidence that the student experimented.",
        "Keep details brief, student-safe, and non-spoiler; examples: 'Evidence found.', 'Needs more evidence.', 'Keep working on this area.'",
      ].join("\n"),
    },
    {
      role: "user",
      content: JSON.stringify({
        reviewMode: config.mode,
        title: config.title,
        requirements,
        effortPolicy,
        effortEvidence: {
          minimumChangedFiles: config.minimumChangedFiles ?? 1,
          changedFileCount: evidence.changedFileCount,
          changedFileNames: evidence.changedFileNames,
          userTurnCount: evidence.userTurnCount,
          acceptedTutorChanges: evidence.acceptedTutorChanges,
        },
        projectManifest: packedContext.manifest,
        projectMap: packedContext.projectMap,
        files: packedContext.files,
        recentConversation: buildConversationSummary(chatMessages),
      }),
    },
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: getTutorCodeModel(),
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 1200,
      messages,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`AI validation review failed with ${response.status}: ${body}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("AI validation review returned an empty response.");
  }

  const parsed = JSON.parse(content) as AiReviewResponse;
  const items = mergeEffortIntoOpenEndedRequirements(
    config,
    normalizeItems(parsed.items, requirements, config.goalLabels),
    effortItem,
  );
  const summary = getValidationReviewSummaryStatus(items);
  const missingEffortItem = effortItem?.status === "missing" ? effortItem : null;

  return {
    kind: "summary",
    title: config.title,
    mode: config.mode,
    status: normalizeStatus(missingEffortItem ? "needs_work" : summary.status ?? parsed.status),
    confidence: normalizeConfidence(missingEffortItem ? "medium" : summary.confidence ?? parsed.confidence),
    items,
    requirements,
    requirementLabels: config.goalLabels,
    nextStep: missingEffortItem?.detail ?? parsed.headline?.trim(),
    followUpPreference: config.followUpPreference,
  };
}
