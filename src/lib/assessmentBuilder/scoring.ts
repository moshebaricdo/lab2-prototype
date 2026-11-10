import { isBlankAnswerCorrect } from "../../data/assessment/fillInBlank";
import type {
  DomainScoreSummary,
  QuestionItem,
  QuestionResponse,
  ScoringOutcome,
  ScoringResult,
  StandardCategoryScore,
  StandardFramework,
  StandardScoreBreakdown,
  StandardScoreRow,
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

function toPercent(correct: number, graded: number): number {
  return graded === 0 ? 0 : Math.round((correct / graded) * 100);
}

/**
 * Results breakdown by standard. Same rules as the overall tally on the
 * results card: free response and other ungraded items are left out, and a
 * question is correct only when fully correct. Rows sort by standard code
 * (else name) so every student's results list them in the same order, even
 * when questions are shuffled. Untagged questions are tallied separately.
 */
export function scoreByStandard(
  entries: Array<{ question: QuestionItem; response: QuestionResponse }>,
): StandardScoreBreakdown {
  const rows = new Map<string, StandardScoreRow>();
  const categories = new Map<string, StandardCategoryScore>();
  let framework: StandardFramework | undefined;
  let untaggedGraded = 0;
  let untaggedCorrect = 0;
  let hasMultiTagged = false;

  for (const { question, response } of entries) {
    if (question.item.kind === "freeResponse") continue;
    const scored = scoreQuestionResponse(question, response);
    if (scored.outcome === "ungraded") continue;
    const correct = scored.outcome === "correct";
    const tags = question.tags ?? [];
    if (tags.length === 0) {
      untaggedGraded += 1;
      if (correct) untaggedCorrect += 1;
      continue;
    }
    if (tags.length > 1) hasMultiTagged = true;
    const seenCategories = new Set<string>();
    for (const tag of tags) {
      framework ??= tag.framework;
      if (tag.category && !seenCategories.has(tag.category.id)) {
        seenCategories.add(tag.category.id);
        const cat = categories.get(tag.category.id) ?? {
          category: tag.category,
          correct: 0,
          graded: 0,
          percent: 0,
        };
        cat.graded += 1;
        if (correct) cat.correct += 1;
        categories.set(tag.category.id, cat);
      }
      const row = rows.get(tag.id) ?? { tag, correct: 0, graded: 0, percent: 0 };
      row.graded += 1;
      if (correct) row.correct += 1;
      rows.set(tag.id, row);
    }
  }

  return {
    rows: Array.from(rows.values())
      .map((row) => ({
        ...row,
        percent: toPercent(row.correct, row.graded),
      }))
      // Stable across shuffles: outline order by code (AI-901 1.1 → 2.4), else by label.
      .sort((a, b) =>
        a.tag.code && b.tag.code
          ? a.tag.code.localeCompare(b.tag.code, undefined, { numeric: true })
          : a.tag.label.localeCompare(b.tag.label),
      ),
    categories: Array.from(categories.values())
      .map((cat) => ({ ...cat, percent: toPercent(cat.correct, cat.graded) }))
      .sort((a, b) =>
        (a.category.code ?? a.category.label).localeCompare(
          b.category.code ?? b.category.label,
          undefined,
          { numeric: true },
        ),
      ),
    framework,
    untaggedGraded,
    untaggedCorrect,
    hasMultiTagged,
  };
}
