import { isBlankAnswerCorrect } from "../../data/assessment/fillInBlank";
import type {
  DomainScoreSummary,
  QuestionItem,
  QuestionResponse,
  ScoringOutcome,
  ScoringResult,
} from "../../types/assessmentBuilder";

function arraysEqualAsSets(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}

function scoreMulti(
  item: Extract<QuestionItem["item"], { kind: "multi" }>,
  response: QuestionResponse,
): ScoringOutcome {
  const { content } = item;
  if (content.surveyMode) return "ungraded";
  const selected = response.multiSelectedIds ?? [];
  if (content.selectionMode === "multiple" && content.correctAnswerIds) {
    if (arraysEqualAsSets(selected, content.correctAnswerIds)) return "correct";
    const correctSet = new Set(content.correctAnswerIds);
    const hasAnyCorrect = selected.some((id) => correctSet.has(id));
    const hasIncorrect = selected.some((id) => !correctSet.has(id));
    if (hasAnyCorrect && !hasIncorrect && selected.length < content.correctAnswerIds.length) {
      return "partial";
    }
    if (hasAnyCorrect && hasIncorrect) return "partial";
    return "incorrect";
  }
  if (content.correctAnswerId && selected[0] === content.correctAnswerId) {
    return "correct";
  }
  return "incorrect";
}

function scoreMatch(
  item: Extract<QuestionItem["item"], { kind: "match" }>,
  response: QuestionResponse,
): ScoringOutcome {
  const assignments = response.matchAssignments ?? {};
  const prompts = item.content.prompts;
  let correct = 0;
  for (const prompt of prompts) {
    if (assignments[prompt.id] === prompt.correctTermId) correct += 1;
  }
  if (correct === prompts.length) return "correct";
  if (correct > 0) return "partial";
  return "incorrect";
}

function scoreFillInBlank(
  item: Extract<QuestionItem["item"], { kind: "fillInBlank" }>,
  response: QuestionResponse,
): ScoringOutcome {
  const answers = response.fillInBlank ?? {};
  let correct = 0;
  for (const blank of item.content.blanks) {
    const value = answers[blank.id] ?? "";
    if (isBlankAnswerCorrect(value, blank)) correct += 1;
  }
  if (correct === item.content.blanks.length) return "correct";
  if (correct > 0) return "partial";
  return "incorrect";
}

function outcomeToPoints(outcome: ScoringOutcome, possible: number): number {
  if (outcome === "correct") return possible;
  if (outcome === "partial") return Math.max(1, Math.floor(possible / 2));
  if (outcome === "ungraded") return possible;
  return 0;
}

export function scoreQuestionResponse(
  item: QuestionItem,
  response: QuestionResponse,
): ScoringResult {
  const pointsPossible = item.points ?? 1;
  let outcome: ScoringOutcome = "incorrect";

  switch (item.item.kind) {
    case "multi":
      outcome = scoreMulti(item.item, response);
      break;
    case "freeResponse":
      outcome = response.freeText && response.freeText.length >= item.item.content.minCharacters
        ? "ungraded"
        : "incorrect";
      break;
    case "match":
      outcome = scoreMatch(item.item, response);
      break;
    case "fillInBlank":
      outcome = scoreFillInBlank(item.item, response);
      break;
    case "dragDrop":
      outcome = "ungraded";
      break;
  }

  return {
    bankId: item.bankId,
    outcome,
    pointsEarned: outcomeToPoints(outcome, pointsPossible),
    pointsPossible,
    domainTags: item.tags,
  };
}

export function aggregateDomainScores(
  results: ScoringResult[],
): DomainScoreSummary[] {
  const map = new Map<string, DomainScoreSummary>();

  for (const result of results) {
    for (const tag of result.domainTags) {
      const existing = map.get(tag.id) ?? {
        domainId: tag.id,
        domainLabel: tag.label,
        earned: 0,
        possible: 0,
      };
      existing.earned += result.pointsEarned;
      existing.possible += result.pointsPossible;
      map.set(tag.id, existing);
    }
  }

  return Array.from(map.values());
}
