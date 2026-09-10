export interface MatchPromptKey {
  id: string;
  correctTermId: string;
}

/** Keep only pairs that were already correct; clear the rest for the next attempt. */
export function keepCorrectMatchAssignments(
  prompts: MatchPromptKey[],
  assignments: Record<string, string | null>,
): Record<string, string | null> {
  return Object.fromEntries(
    prompts.map((prompt) => [
      prompt.id,
      assignments[prompt.id] === prompt.correctTermId
        ? prompt.correctTermId
        : null,
    ]),
  );
}

export function correctMatchPromptIds(
  prompts: MatchPromptKey[],
  assignments: Record<string, string | null>,
): string[] {
  return prompts
    .filter((prompt) => assignments[prompt.id] === prompt.correctTermId)
    .map((prompt) => prompt.id);
}
