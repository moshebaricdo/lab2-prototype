/**
 * Submitted quiz attempts for the editable-quiz prototype.
 * Session-scoped, keyed by artifact id. A quiz edit (new `updatedAt`)
 * drops the log so old answers are not graded against new questions.
 */

export interface StoredQuizAttemptAnswers {
  multi: Record<string, string | string[]>;
  freeText: Record<string, string>;
  match: Record<string, Record<string, string | null>>;
}

export interface StoredQuizAttempt {
  id: string;
  attemptNumber: number;
  submittedAt: number;
  elapsedSeconds: number;
  answers: StoredQuizAttemptAnswers;
}

interface StoredQuizAttemptLog {
  updatedAt: number;
  /** Newest first. */
  attempts: StoredQuizAttempt[];
}

const storageKey = (artifactId: string) => `lab2.quiz-submissions.${artifactId}`;

function isAttempt(value: unknown): value is StoredQuizAttempt {
  if (!value || typeof value !== "object") return false;
  const attempt = value as StoredQuizAttempt;
  return (
    typeof attempt.id === "string" &&
    typeof attempt.attemptNumber === "number" &&
    typeof attempt.submittedAt === "number" &&
    typeof attempt.elapsedSeconds === "number" &&
    attempt.answers != null &&
    typeof attempt.answers === "object"
  );
}

export function loadStoredQuizAttempts(
  artifactId: string,
  updatedAt: number,
): StoredQuizAttempt[] {
  try {
    const raw = window.sessionStorage.getItem(storageKey(artifactId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredQuizAttemptLog;
    if (parsed.updatedAt !== updatedAt || !Array.isArray(parsed.attempts)) {
      return [];
    }
    return parsed.attempts.filter(isAttempt);
  } catch {
    return [];
  }
}

export function appendStoredQuizAttempt(
  artifactId: string,
  updatedAt: number,
  attempt: StoredQuizAttempt,
): StoredQuizAttempt[] {
  const existing = loadStoredQuizAttempts(artifactId, updatedAt);
  const attempts = [attempt, ...existing];
  try {
    const log: StoredQuizAttemptLog = { updatedAt, attempts };
    window.sessionStorage.setItem(storageKey(artifactId), JSON.stringify(log));
  } catch {
    /* storage unavailable — the in-memory list still updates */
  }
  return attempts;
}
