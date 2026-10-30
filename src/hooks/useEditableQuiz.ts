import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { useSearchParams } from "react-router-dom";
import {
  isEditableQuizDemoId,
  type EditableQuizDemoId,
} from "../data/assessmentBuilder/editableQuizDemos";
import { getBankQuestionMapSnapshot } from "../lib/assessmentBuilder/bankStorage";
import {
  commitEditableQuiz,
  EDITABLE_QUIZ_PARAM,
  editableQuizMatchesSeed,
  editableQuizResetInProgress,
  ensureEditableQuiz,
  getEditableQuizSnapshot,
  searchWithEditableQuiz,
  subscribeEditableQuiz,
} from "../lib/assessmentBuilder/editableQuizSession";
import type { AssessmentArtifact, QuestionItem } from "../types/assessmentBuilder";

const EMPTY_BANK = new Map<string, QuestionItem>();

function subscribeBank(listener: () => void) {
  const handler = (event: StorageEvent) => {
    if (event.key === "lab2:assessment-bank" || event.key === null) listener();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

/**
 * Student quiz and its builder share one artifact: session storage for this
 * tab, and the encoded `o` query param so the address bar is a share link.
 */
export function useEditableQuiz(demoId: string | null) {
  const id = demoId && isEditableQuizDemoId(demoId) ? demoId : null;
  const [searchParams, setSearchParams] = useSearchParams();
  const encoded = searchParams.get(EDITABLE_QUIZ_PARAM);

  if (id) ensureEditableQuiz(id, encoded);

  const artifact = useSyncExternalStore(
    subscribeEditableQuiz,
    () => (id ? getEditableQuizSnapshot(id) : null),
    () => (id ? getEditableQuizSnapshot(id) : null),
  );
  const courseId = artifact?.courseId ?? "aif-cert";
  const bankQuestions = useSyncExternalStore(
    subscribeBank,
    () => (id ? getBankQuestionMapSnapshot(courseId) : EMPTY_BANK),
    () => EMPTY_BANK,
  );

  useEffect(() => {
    if (!id || !artifact || editableQuizResetInProgress()) return;
    const desired = searchWithEditableQuiz(searchParams, artifact);
    if (desired.get(EDITABLE_QUIZ_PARAM) === encoded) return;
    setSearchParams(desired, { replace: true });
  }, [id, artifact, encoded, searchParams, setSearchParams]);

  const updateArtifact = useCallback(
    (updater: (current: AssessmentArtifact) => AssessmentArtifact) => {
      if (!id) return undefined;
      return commitEditableQuiz(id, updater);
    },
    [id],
  );

  const resolvedQuestions = useMemo(() => {
    if (!artifact) return [];
    return artifact.questionRefs
      .map((ref) =>
        ref.type === "bank" ? bankQuestions.get(ref.bankId) ?? null : ref.item,
      )
      .filter((item): item is QuestionItem => item != null);
  }, [artifact, bankQuestions]);

  return {
    artifact,
    bankQuestions,
    resolvedQuestions,
    updateArtifact,
    matchesSeed: artifact ? editableQuizMatchesSeed(artifact) : true,
  };
}
