import { useCallback, useSyncExternalStore } from "react";
import type { QuestionItem } from "../types/assessmentBuilder";
import {
  deleteBankQuestion,
  getCourseBank,
  upsertBankQuestion,
} from "../lib/assessmentBuilder/bankStorage";

function subscribe(callback: () => void) {
  const handler = (event: StorageEvent) => {
    if (event.key === "lab2:assessment-bank" || event.key === null) callback();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

export function useQuestionBank(courseId: string) {
  const bank = useSyncExternalStore(
    subscribe,
    () => getCourseBank(courseId),
    () => getCourseBank(courseId),
  );

  const saveQuestion = useCallback(
    (question: QuestionItem) => upsertBankQuestion(courseId, question),
    [courseId],
  );

  const removeQuestion = useCallback(
    (bankId: string) => deleteBankQuestion(courseId, bankId),
    [courseId],
  );

  return {
    bank,
    questions: bank?.questions ?? [],
    domains: bank?.domains ?? [],
    saveQuestion,
    removeQuestion,
  };
}
