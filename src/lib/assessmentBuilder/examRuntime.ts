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

export function resolveAssessmentQuestions(
  artifact: AssessmentArtifact,
  bankQuestions: Map<string, QuestionItem>,
  attemptSeed = "default",
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

  const combined = [...fixed, ...pooled];
  if (!artifact.shuffle.shuffleQuestions) return combined;
  return seededShuffle(
    combined,
    hashSeed(`${artifact.id}:${attemptSeed}:questions`),
  );
}

export function shouldSuppressRevealDuringAttempt(
  artifact: AssessmentArtifact,
): boolean {
  return artifact.mode === "exam";
}

export function getDefaultTutorEnabled(artifact: AssessmentArtifact): boolean {
  if (artifact.mode === "exam") return false;
  return artifact.tutor.enabled;
}
