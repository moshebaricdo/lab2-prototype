/**
 * In-progress quiz attempt persistence (sessionStorage), used by the
 * resume-in-progress demo route. Keyed by artifact id; response records are
 * keyed by flow block id (see `flowBlockId`).
 */

export interface QuizAttemptSnapshotResponses {
  selectedMulti: Record<string, string | null>;
  freeText: Record<string, string>;
  matchAssignments: Record<string, Record<string, string | null>>;
}

export interface QuizAttemptSnapshot {
  page: number;
  secondsRemaining: number | null;
  attemptNumber: number;
  startedAt: number;
  responses: QuizAttemptSnapshotResponses;
}

const storageKey = (artifactId: string) => `lab2.quiz-attempt.${artifactId}`;

export function loadQuizAttemptSnapshot(
  artifactId: string,
): QuizAttemptSnapshot | null {
  try {
    const raw = window.sessionStorage.getItem(storageKey(artifactId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as QuizAttemptSnapshot;
    if (typeof parsed.page !== "number" || !parsed.responses) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveQuizAttemptSnapshot(
  artifactId: string,
  snapshot: QuizAttemptSnapshot,
): void {
  try {
    window.sessionStorage.setItem(
      storageKey(artifactId),
      JSON.stringify(snapshot),
    );
  } catch {
    /* storage unavailable — resume demo silently degrades */
  }
}

export function clearQuizAttemptSnapshot(artifactId: string): void {
  try {
    window.sessionStorage.removeItem(storageKey(artifactId));
  } catch {
    /* ignore */
  }
}
