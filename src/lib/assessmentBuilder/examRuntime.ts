import type {
  AssessmentArtifact,
  PoolDrawRule,
  QuestionItem,
} from "../../types/assessmentBuilder";
import { resolveQuestionRef } from "./adapters";

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let state = seed || 1;
  for (let i = arr.length - 1; i > 0; i -= 1) {
    state = (state * 16807) % 2147483647;
    const j = state % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function drawFromPool(
  rule: PoolDrawRule,
  bankQuestions: Map<string, QuestionItem>,
  usedIds: Set<string>,
  attemptSeed: string,
): QuestionItem[] {
  const pool = Array.from(bankQuestions.values()).filter((question) => {
    if (usedIds.has(question.bankId)) return false;
    if (rule.kinds && !rule.kinds.includes(question.item.kind)) return false;
    if (
      rule.tagIds.length > 0 &&
      !rule.tagIds.some((tagId) => question.tags.some((tag) => tag.id === tagId))
    ) {
      return false;
    }
    return true;
  });

  const shuffled = seededShuffle(pool, hashSeed(`${attemptSeed}:${rule.id}`));
  return shuffled.slice(0, rule.count);
}

/** Reorder answer choices (multiple choice) or answer tiles (matching). */
function shuffleQuestionOptions(question: QuestionItem, seed: number): QuestionItem {
  const { item } = question;
  if (item.kind === "multi") {
    return {
      ...question,
      item: {
        ...item,
        content: {
          ...item.content,
          answers: seededShuffle(item.content.answers, seed),
        },
      },
    };
  }
  if (item.kind === "match") {
    return {
      ...question,
      item: {
        ...item,
        content: {
          ...item.content,
          terms: seededShuffle(item.content.terms, seed),
        },
      },
    };
  }
  return question;
}

/**
 * Questions shuffle within each page, so page membership never changes.
 * Scroll layout and unpaged quizzes are one page.
 */
function shuffleWithinPages(
  artifact: AssessmentArtifact,
  fixed: QuestionItem[],
  seedBase: string,
): QuestionItem[] {
  const sections = artifact.sections ?? [];
  if (artifact.layout === "scroll" || sections.length === 0) {
    return seededShuffle(fixed, hashSeed(`${seedBase}:questions`));
  }
  const result: QuestionItem[] = [];
  let cursor = 0;
  sections.forEach((section, index) => {
    const slice = fixed.slice(cursor, cursor + section.questionRefs.length);
    cursor += section.questionRefs.length;
    result.push(...seededShuffle(slice, hashSeed(`${seedBase}:page-${index}`)));
  });
  result.push(...fixed.slice(cursor));
  return result;
}

export interface ResolveQuestionsOptions {
  /**
   * Authored order and authored options, ignoring shuffle settings.
   * Teacher review uses this for "Original order".
   */
  canonical?: boolean;
}

export function resolveAssessmentQuestions(
  artifact: AssessmentArtifact,
  bankQuestions: Map<string, QuestionItem>,
  attemptSeed = "default",
  options: ResolveQuestionsOptions = {},
): QuestionItem[] {
  const usedIds = new Set<string>();
  const fixed: QuestionItem[] = [];

  for (const ref of artifact.questionRefs) {
    const item = resolveQuestionRef(ref, bankQuestions);
    if (!item) continue;
    fixed.push(item);
    usedIds.add(item.bankId);
  }

  const pooled: QuestionItem[] = [];
  for (const rule of artifact.poolDrawRules ?? []) {
    const drawn = drawFromPool(
      rule,
      bankQuestions,
      usedIds,
      `${artifact.id}:${attemptSeed}`,
    );
    for (const item of drawn) {
      pooled.push(item);
      usedIds.add(item.bankId);
    }
  }

  if (options.canonical) return [...fixed, ...pooled];
  const seedBase = `${artifact.id}:${attemptSeed}`;
  const ordered = [
    ...(artifact.shuffle.shuffleQuestions
      ? shuffleWithinPages(artifact, fixed, seedBase)
      : fixed),
    ...pooled,
  ];
  if (!artifact.shuffle.shuffleOptions) return ordered;
  return ordered.map((question) =>
    shuffleQuestionOptions(
      question,
      hashSeed(`${seedBase}:options:${question.bankId}`),
    ),
  );
}

export function shouldSuppressRevealDuringAttempt(
  artifact: AssessmentArtifact,
): boolean {
  if (artifact.feedback) return !artifact.feedback.showCorrectness;
  if (artifact.purpose === "exam" || artifact.purpose === "exam_simulation") {
    return true;
  }
  return artifact.mode === "exam";
}

export function getDefaultTutorEnabled(artifact: AssessmentArtifact): boolean {
  if (artifact.mode === "exam") return false;
  return artifact.tutor.enabled;
}
