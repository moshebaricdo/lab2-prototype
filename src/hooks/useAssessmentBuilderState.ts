import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { AssessmentArtifact, QuestionItem } from "../types/assessmentBuilder";
import {
  getAssessmentDraftSnapshot,
  getBankQuestionMapSnapshot,
  getCourseBankSnapshot,
  upsertAssessmentDraft,
} from "../lib/assessmentBuilder";

function subscribe(callback: () => void) {
  const handler = (event: StorageEvent) => {
    if (
      event.key === "lab2:assessment-drafts" ||
      event.key === "lab2:assessment-bank" ||
      event.key === null
    ) {
      callback();
    }
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

function getArtifactSnapshot(assessmentId: string) {
  return () => getAssessmentDraftSnapshot(assessmentId);
}

function getBankQuestionsSnapshot(assessmentId: string) {
  return () => {
    const courseId =
      getAssessmentDraftSnapshot(assessmentId)?.courseId ?? "aif-cert";
    return getBankQuestionMapSnapshot(courseId);
  };
}

function getCourseBankSnapshotForAssessment(assessmentId: string) {
  return () => {
    const courseId =
      getAssessmentDraftSnapshot(assessmentId)?.courseId ?? "aif-cert";
    return getCourseBankSnapshot(courseId);
  };
}

export function useAssessmentBuilderState(assessmentId: string) {
  const artifact = useSyncExternalStore(
    subscribe,
    getArtifactSnapshot(assessmentId),
    getArtifactSnapshot(assessmentId),
  );

  const bankQuestions = useSyncExternalStore(
    subscribe,
    getBankQuestionsSnapshot(assessmentId),
    getBankQuestionsSnapshot(assessmentId),
  );

  const courseBank = useSyncExternalStore(
    subscribe,
    getCourseBankSnapshotForAssessment(assessmentId),
    getCourseBankSnapshotForAssessment(assessmentId),
  );

  const resolvedQuestions = useMemo(() => {
    if (!artifact) return [];
    return artifact.questionRefs
      .map((ref) =>
        ref.type === "bank"
          ? bankQuestions.get(ref.bankId) ?? null
          : ref.item,
      )
      .filter((item): item is QuestionItem => item != null);
  }, [artifact, bankQuestions]);

  const saveArtifact = useCallback((next: AssessmentArtifact) => {
    upsertAssessmentDraft(next);
  }, []);

  const updateArtifact = useCallback(
    (updater: (current: AssessmentArtifact) => AssessmentArtifact) => {
      if (!artifact) return;
      saveArtifact(updater(artifact));
    },
    [artifact, saveArtifact],
  );

  return {
    artifact,
    bankQuestions,
    courseBank,
    resolvedQuestions,
    saveArtifact,
    updateArtifact,
  };
}
