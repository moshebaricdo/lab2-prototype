import { getTutorApiKey, getTutorCodeModel } from "../../hooks/useTutorApiSettings";
import type { ChatMessage } from "../../types/chat";
import type { FileItem } from "../../types/file";
import type {
  ValidationReviewCardData,
  ValidationReviewItemStatus,
  WebLab2ValidationReviewConfig,
} from "../../types/validationReview";
import { analyzeProject } from "../tutor/context/projectAnalyzer";
import { packTutorContext } from "../tutor/context/contextPacker";
import type { TutorChatMessage } from "../tutor/types";
import {
  buildValidationReviewEvidence,
  createValidationReview,
  type VersionHistoryValidationSummary,
} from "./validationHarness";
import { getAiGoalIndices } from "./validationGoalEvaluators";
import {
  resolveValidationReviewProfile,
} from "./validationReviewProfile";

interface AiReviewResponse {
  items?: Array<{
    label?: string;
    status?: ValidationReviewItemStatus;
    detail?: string;
  }>;
  headline?: string;
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

function normalizeAiEvaluations(
  responseItems: AiReviewResponse["items"],
  aiGoalIndices: number[],
  config: WebLab2ValidationReviewConfig,
) {
  const evaluations: Partial<Record<number, { status: ValidationReviewItemStatus; detail: string }>> = {};

  aiGoalIndices.forEach((goalIndex, responseIndex) => {
    const item = responseItems?.[responseIndex];
    const status = normalizeItemStatus(item?.status);
    const label = config.goalLabels?.[goalIndex]?.trim() || config.goals[goalIndex];
    evaluations[goalIndex] = {
      status,
      detail: status === "pass"
        ? item?.detail?.trim() || "Evidence found."
        : item?.detail?.trim() || "Keep working on this area.",
    };
  });

  return evaluations;
}

export async function createAiWebLab2ValidationReview({
  config,
  instructionsMarkdown,
  currentFileStructure,
  initialFileStructure,
  chatMessages,
  versionHistorySummary,
}: {
  config: WebLab2ValidationReviewConfig;
  instructionsMarkdown?: string;
  currentFileStructure: FileItem[];
  initialFileStructure: FileItem[];
  chatMessages: ChatMessage[];
  versionHistorySummary?: VersionHistoryValidationSummary;
}): Promise<ValidationReviewCardData | null> {
  const apiKey = getTutorApiKey().trim();
  if (!apiKey) return null;

  const aiGoalIndices = getAiGoalIndices(config);
  if (aiGoalIndices.length === 0 && config.goals.filter((goal) => goal.trim()).length === 0) {
    return null;
  }

  const profile = resolveValidationReviewProfile(config, { instructionsMarkdown });
  const evidence = buildValidationReviewEvidence({
    currentFileStructure,
    initialFileStructure,
    chatMessages,
  });
  const effortPolicy = profile.effortPolicy;
  const aiRequirements = aiGoalIndices.map((goalIndex) => config.goals[goalIndex]);
  const aiLabels = aiGoalIndices.map(
    (goalIndex) => config.goalLabels?.[goalIndex]?.trim() || config.goals[goalIndex],
  );

  let aiEvaluationsByGoalIndex: Partial<
    Record<number, { status: ValidationReviewItemStatus; detail: string }>
  > = {};

  if (aiRequirements.length > 0) {
    const analysis = analyzeProject(currentFileStructure);
    const packedContext = packTutorContext(
      analysis,
      aiRequirements.join("\n"),
      18000,
    );
    const messages: TutorChatMessage[] = [
      {
        role: "system",
        content: [
          "You evaluate Web Lab 2 student work against explicit level-builder assessment requirements.",
          "Use ONLY the supplied project files, project map, and recent conversation.",
          "Do not reveal exact fixes, exact code, selectors to change, or step-by-step solutions.",
          "Return JSON only with this shape:",
          "{ \"headline\": string, \"items\": [{ \"label\": string, \"status\": \"pass|warn|missing\", \"detail\": string }] }",
          "Create exactly one item per requirement, in the same order as the requirements array.",
          "Use 'pass' only when there is clear evidence. Use 'warn' when partially addressed. Use 'missing' when not addressed.",
          "Use the supplied effort evidence when judging open-ended refinement work. If the current files match the starter and effortPolicy is required, do not treat starter polish as enough evidence that the student experimented.",
          "Keep details brief, student-safe, and non-spoiler; examples: 'Evidence found.', 'Needs more evidence.', 'Keep working on this area.'",
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({
          reviewMode: profile.reviewMode,
          title: profile.title,
          requirements: aiRequirements,
          requirementLabels: aiLabels,
          effortPolicy,
          effortEvidence: {
            minimumChangedFiles: 1,
            changedFileCount: evidence.changedFileCount,
            changedFileNames: evidence.changedFileNames,
            userTurnCount: evidence.userTurnCount,
            acceptedTutorChanges: evidence.acceptedTutorChanges,
          },
          projectManifest: packedContext.manifest,
          projectMap: packedContext.projectMap,
          files: packedContext.files,
          recentConversation: buildConversationSummary(chatMessages),
          versionHistory: versionHistorySummary,
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
    aiEvaluationsByGoalIndex = normalizeAiEvaluations(
      parsed.items,
      aiGoalIndices,
      config,
    );
  }

  return createValidationReview({
    config,
    instructionsMarkdown,
    currentFileStructure,
    initialFileStructure,
    chatMessages,
    versionHistorySummary,
    aiEvaluationsByGoalIndex,
  });
}
