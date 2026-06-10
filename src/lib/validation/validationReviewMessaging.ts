import { getTutorApiKey, getTutorCodeModel } from "../../hooks/useTutorApiSettings";
import type { ChatMessage } from "../../types/chat";
import type {
  LevelProgressSnapshot,
  ValidationReviewCardData,
} from "../../types/validationReview";
import type { TutorChatMessage } from "../tutor/types";
import { buildLevelProgressSnapshot } from "./levelProgress";

function shortCriterionLabel(label: string) {
  const normalized = label.replace(/\s+/g, " ").trim();
  if (normalized.length <= 90) return normalized;
  return `${normalized.slice(0, 87)}...`;
}

function validationReviewRetryAction(
  review: ValidationReviewCardData,
  progress: LevelProgressSnapshot | undefined,
) {
  const incompleteCount = progress?.incompleteCriteria.length ?? 0;
  const remainingTarget = incompleteCount > 1 ? "the remaining items" : "the next item";
  const nextLabel = progress?.nextIncompleteCriterion?.label;

  if (nextLabel && nextLabel.length <= 70) {
    return `Next up: ${nextLabel}. Check again when that step is ready.`;
  }

  if (nextLabel) {
    return "Next up: use the remaining checklist item in the review card as your next step, then check again when it is ready.";
  }

  if (review.mode === "technical") {
    return `Work through ${remainingTarget}, then check again.`;
  }

  if (review.mode === "open-ended") {
    return `Keep refining ${remainingTarget}, then check again.`;
  }

  return `Revisit ${remainingTarget}, then check again.`;
}

export function buildValidationReviewOfferMessage(
  submittedContent: string,
  review: ValidationReviewCardData,
) {
  const hasMultipleRequirements = (review.requirements?.length ?? 0) > 1;

  if (/\b(works|worked|working|fixed|done|finished|complete|completed)\b/i.test(submittedContent)) {
    return "Great. I can check your work now and let you know whether you're ready to continue.";
  }

  if (/\b(check|review|validate|grade)\b/i.test(submittedContent)) {
    return hasMultipleRequirements
      ? "I can check your progress and show what looks complete and what to work on next."
      : "I can check your work and let you know whether you're ready to continue.";
  }

  return "When you're ready, I can check your work and let you know whether you're ready to continue.";
}

export function buildValidationReviewResultMessage(review: ValidationReviewCardData) {
  const progress = buildLevelProgressSnapshot(review);
  const passedCount = progress?.passedCriteria.length ?? 0;
  const incompleteCount = progress?.incompleteCriteria.length ?? 0;

  if (review.status === "likely_complete") {
    return passedCount > 1
      ? "Nice work, the checklist looks complete. You can continue now."
      : "Nice work, this looks ready to continue.";
  }

  if (passedCount > 0 && incompleteCount > 0) {
    const completedSummary = passedCount > 1
      ? `${passedCount} checklist items look complete`
      : `${shortCriterionLabel(progress?.passedCriteria[0]?.label ?? "one checklist item")} looks complete`;
    return `Nice, ${completedSummary}. ${validationReviewRetryAction(review, progress)}`;
  }

  if (review.status === "needs_work") {
    return `Not quite yet. ${validationReviewRetryAction(review, progress)}`;
  }

  if (review.status === "in_progress") {
    return `You're making progress. ${validationReviewRetryAction(review, progress)}`;
  }

  return "I don't see a project change yet. Make one focused update, then check again.";
}

export function resolveValidationResultMessage(review: ValidationReviewCardData) {
  const custom = review.summaryMessage?.trim();
  return custom || buildValidationReviewResultMessage(review);
}

function buildConversationSummary(chatMessages: ChatMessage[], limit = 6) {
  return chatMessages
    .filter((message) => !message.isAlert)
    .slice(-limit)
    .map((message) => `${message.role}: ${message.content.slice(0, 400)}`)
    .join("\n\n");
}

const VALIDATION_OFFER_SYSTEM_PROMPT = [
  "You write the chat text shown above a Check my work button in a Web Lab coding tutor.",
  "Return JSON only: { \"message\": string }",
  "Voice:",
  "- One or two short, friendly sentences — warm lab partner, not a rubric.",
  "- Acknowledge what the student just said when it helps (they finished, they want a check, they think it works).",
  "- Point them to Check my work; the UI shows the checklist and button separately.",
  "- Do not list assessment criteria, checklist rows, or level goals in your message.",
  "- Vary phrasing naturally; avoid repeating the same opener every time.",
  "- No spoilers, exact fixes, or commanding tone.",
].join("\n");

interface ValidationOfferResponse {
  message?: string;
}

export async function generateValidationOfferMessage({
  studentMessage,
  review,
  chatMessages,
  instructionsMarkdown,
}: {
  studentMessage: string;
  review: ValidationReviewCardData;
  chatMessages: ChatMessage[];
  instructionsMarkdown?: string;
}): Promise<string> {
  const fallback = buildValidationReviewOfferMessage(studentMessage, review);
  const apiKey = getTutorApiKey().trim();
  if (!apiKey) return fallback;

  const messages: TutorChatMessage[] = [
    { role: "system", content: VALIDATION_OFFER_SYSTEM_PROMPT },
    {
      role: "user",
      content: JSON.stringify({
        studentMessage,
        levelTitle: review.title,
        reviewMode: review.mode,
        requirementCount: review.requirements?.length ?? 0,
        instructionsMarkdown: instructionsMarkdown?.trim() || undefined,
        recentConversation: buildConversationSummary(chatMessages),
      }),
    },
  ];

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: getTutorCodeModel(),
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_tokens: 180,
        messages,
      }),
    });

    if (!response.ok) return fallback;

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return fallback;

    const parsed = JSON.parse(content) as ValidationOfferResponse;
    const message = parsed.message?.replace(/\s+/g, " ").trim();
    return message || fallback;
  } catch {
    return fallback;
  }
}

export function shortValidationCriterionLabel(label: string) {
  return shortCriterionLabel(label);
}
