import type { QuestionItem } from "../../types/assessmentBuilder";
import { questionKindLabel } from "./blankQuestion";

function randomNumericId(): number {
  return 1000 + Math.floor(Math.random() * 9000);
}

function randomKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `key-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Header copy for a question that has never been saved. */
export function newQuestionHeaderLabel(question: QuestionItem): string {
  const kind = questionKindLabel(question).toLowerCase();
  if (kind.startsWith("mc")) return "New multiple choice question";
  return `New ${kind} question`;
}

export function withSavedIdentity(question: QuestionItem): QuestionItem {
  const now = Date.now();
  return {
    ...question,
    neverSaved: false,
    listedInBank: question.listedInBank !== false,
    numericId: question.numericId ?? randomNumericId(),
    questionKey: question.questionKey ?? randomKey(),
    versionIndex: question.versionIndex ?? 1,
    versionCount: question.versionCount ?? 1,
    lastEditedLabel: "just now",
    updatedAt: now,
  };
}

/** New wording for this quiz; same family key. Other quizzes keep the old row. */
export function forkQuestionItem(question: QuestionItem): QuestionItem {
  const nextIndex = (question.versionIndex ?? 1) + 1;
  const nextCount = Math.max(question.versionCount ?? 1, nextIndex);
  const nextId = randomNumericId();
  return {
    ...withSavedIdentity(question),
    bankId: `q-version-${nowKey()}-${Math.random().toString(36).slice(2, 7)}`,
    numericId: nextId,
    questionKey: question.questionKey ?? randomKey(),
    versionIndex: nextIndex,
    versionCount: nextCount,
    attachedToOtherQuizzes: false,
    usedInPublishedUnit: false,
    neverSaved: false,
    versions: [
      {
        label: `Version ${nextIndex}`,
        id: nextId,
        usedIn: "1 quiz",
        lastEdited: "just now",
        isCurrent: true,
      },
      ...(question.versions ?? []).map((row) => ({ ...row, isCurrent: false })),
    ],
  };
}

function nowKey(): number {
  return Date.now();
}
