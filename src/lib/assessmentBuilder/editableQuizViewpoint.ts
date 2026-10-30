import { MOCK_STUDENT_NAME } from "../../data/assessmentBuilder/mockStudentResponses";
import type { QuestionItem } from "../../types/assessmentBuilder";
import type {
  QuizStudentResponseView,
  QuizSubmissionVersion,
} from "../../components/assessment/quiz/QuizAttemptWorkspace";
import type { StoredQuizAttempt } from "./submittedAttempts";

/** Header switch on `/levels/quiz-demo/*`. Omitted from the URL when `student`. */
export type EditableQuizView =
  | "student"
  | "teacher"
  | "submission"
  | "in-progress";

export const EDITABLE_QUIZ_VIEW_PARAM = "view";

const SUBMISSION_FREE_TEXT =
  "I think the important part is what the model learned from the examples it was given, and whether that still holds when the examples are new.";

const EARLIER_FREE_TEXT =
  "The model memorized the training examples, including the noisy ones, and then struggled on new data.";

const FIRST_FREE_TEXT = "It just memorized the examples it was given.";

/** Enough rows to see Current, a dated submission, and Initial. */
const SUBMISSION_HISTORY_CAP = 3;

type SubmissionFidelity = "first" | "earlier" | "latest";

type MultiContent = Extract<QuestionItem["item"], { kind: "multi" }>["content"];
type MatchContent = Extract<QuestionItem["item"], { kind: "match" }>["content"];

export function parseEditableQuizView(value: string | null): EditableQuizView {
  if (value === "teacher" || value === "submission" || value === "in-progress") {
    return value;
  }
  return "student";
}

/**
 * A student attempt for the questions currently on the quiz.
 * One question is answered wrong so the review shows a key against a pick.
 * Longer quizzes alternate so the score is mixed. An in-progress attempt
 * leaves the last question blank when there is more than one.
 */
export function buildEditableQuizSubmission(
  questions: QuestionItem[],
  options?: { submitted?: boolean },
): QuizStudentResponseView {
  const submitted = options?.submitted !== false;
  const multi: QuizStudentResponseView["answers"]["multi"] = {};
  const freeText: Record<string, string> = {};
  const match: QuizStudentResponseView["answers"]["match"] = {};

  questions.forEach((question, index) => {
    const leaveBlank =
      !submitted && questions.length > 1 && index === questions.length - 1;
    if (leaveBlank) return;
    const preferCorrect = questions.length > 1 && index % 2 === 0;
    const item = question.item;
    if (item.kind === "multi") {
      const picked = multiAnswer(item.content, preferCorrect);
      if (picked) multi[question.bankId] = picked;
      return;
    }
    if (item.kind === "freeResponse") {
      freeText[question.bankId] = SUBMISSION_FREE_TEXT;
      return;
    }
    if (item.kind === "match") {
      match[question.bankId] = matchAnswer(item.content, preferCorrect);
    }
  });

  return {
    studentName: MOCK_STUDENT_NAME,
    submitted,
    currentPage: 1,
    ...(submitted
      ? { elapsedSeconds: Math.max(2 * 60 + 18, questions.length * 45) }
      : {}),
    attemptNumber: 1,
    answers: { multi, freeText, match },
  };
}

/**
 * How many submissions a teacher would see for this quiz.
 * One attempt stays a single current version. Multiple or unlimited
 * attempts seed up to three: latest, an earlier try, and the first.
 */
export function editableQuizSubmissionCount(
  retriesAllowed: boolean,
  maxAttempts: number | undefined,
  questionCount: number,
): number {
  if (questionCount === 0 || !retriesAllowed) return 1;
  if (maxAttempts == null) return SUBMISSION_HISTORY_CAP;
  return Math.min(Math.max(maxAttempts, 1), SUBMISSION_HISTORY_CAP);
}

/**
 * Attempt history for one student’s submitted quiz.
 * Every row is "Attempt N", newest first.
 * Each row’s secondary text is the submission time. No autosaves.
 */
export function buildEditableQuizSubmissionHistory(
  questions: QuestionItem[],
  options: { retriesAllowed: boolean; maxAttempts?: number },
): QuizSubmissionVersion[] {
  const count = editableQuizSubmissionCount(
    options.retriesAllowed,
    options.maxAttempts,
    questions.length,
  );
  const latestAt = new Date(2026, 9, 28, 15, 5, 18);
  const earlierAt = new Date(2026, 9, 28, 13, 42, 7);
  const firstAt = new Date(2026, 9, 27, 9, 14, 56);
  const latest = submissionVersion({
    id: "current",
    createdAt: latestAt,
    fidelity: "latest",
    attemptNumber: count,
    questions,
  });
  if (count < 2) return [latest];

  const first = submissionVersion({
    id: "initial",
    createdAt: firstAt,
    fidelity: "first",
    attemptNumber: 1,
    questions,
  });
  if (count === 2) return [latest, first];

  return [
    latest,
    submissionVersion({
      id: "submission-2",
      createdAt: earlierAt,
      fidelity: "earlier",
      attemptNumber: 2,
      questions,
    }),
    first,
  ];
}

function submissionVersion(input: {
  id: string;
  createdAt: Date;
  fidelity: SubmissionFidelity;
  attemptNumber: number;
  questions: QuestionItem[];
}): QuizSubmissionVersion {
  const response =
    input.fidelity === "latest"
      ? {
          ...buildEditableQuizSubmission(input.questions),
          attemptNumber: input.attemptNumber,
        }
      : buildFidelitySubmission(
          input.questions,
          input.fidelity,
          input.attemptNumber,
        );
  return {
    id: input.id,
    label: `Attempt ${input.attemptNumber}`,
    createdAt: input.createdAt.toISOString(),
    timestampLabel: formatAttemptTimestamp(input.createdAt),
    response,
  };
}

function buildFidelitySubmission(
  questions: QuestionItem[],
  fidelity: Exclude<SubmissionFidelity, "latest">,
  attemptNumber: number,
): QuizStudentResponseView {
  const multi: QuizStudentResponseView["answers"]["multi"] = {};
  const freeText: Record<string, string> = {};
  const match: QuizStudentResponseView["answers"]["match"] = {};

  questions.forEach((question, index) => {
    const item = question.item;
    if (item.kind === "multi") {
      const picked = multiAnswerForFidelity(item.content, fidelity, index);
      if (picked) multi[question.bankId] = picked;
      return;
    }
    if (item.kind === "freeResponse") {
      freeText[question.bankId] =
        fidelity === "first" ? FIRST_FREE_TEXT : EARLIER_FREE_TEXT;
      return;
    }
    if (item.kind === "match") {
      match[question.bankId] = matchAnswerForFidelity(item.content, fidelity, index);
    }
  });

  return {
    studentName: MOCK_STUDENT_NAME,
    submitted: true,
    currentPage: 1,
    elapsedSeconds: fidelity === "first" ? 4 * 60 + 12 : 6 * 60 + 5,
    attemptNumber,
    answers: { multi, freeText, match },
  };
}

/**
 * Rows for attempts the student actually submitted in this session.
 * Newest first. Every row is "Attempt N".
 * Replaces the sample history once any real submit exists.
 */
export function submissionVersionsFromAttempts(
  attempts: StoredQuizAttempt[],
): QuizSubmissionVersion[] {
  return attempts.map((attempt, index) => {
    const createdAt = new Date(attempt.submittedAt);
    return {
      id: index === 0 ? "current" : attempt.id,
      label: `Attempt ${attempt.attemptNumber}`,
      createdAt: createdAt.toISOString(),
      timestampLabel: formatAttemptTimestamp(createdAt),
      response: {
        studentName: MOCK_STUDENT_NAME,
        submitted: true,
        elapsedSeconds: attempt.elapsedSeconds,
        attemptNumber: attempt.attemptNumber,
        answers: attempt.answers,
      },
    };
  });
}

function formatAttemptTimestamp(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  })
    .format(date)
    .replace(/ ([AP]M)$/, "$1");
}

function multiAnswer(
  content: Extract<QuestionItem["item"], { kind: "multi" }>["content"],
  preferCorrect: boolean,
): string | string[] | undefined {
  const ids = content.answers.map((answer) => answer.id);
  if (ids.length === 0) return undefined;
  if (content.selectionMode === "multiple") {
    const correct = content.correctAnswerIds ?? [];
    if (preferCorrect && correct.length > 0) return [...correct];
    const wrong = ids.find((id) => !correct.includes(id));
    const right = correct[0];
    if (right && wrong) return [right, wrong];
    if (wrong) return [wrong];
    if (correct.length > 1) return correct.slice(0, -1);
    return correct.length > 0 ? [...correct] : [ids[0]];
  }
  const correctId = content.correctAnswerId;
  const wrong = ids.find((id) => id !== correctId);
  if (preferCorrect) return correctId ?? ids[0];
  return wrong ?? correctId ?? ids[0];
}

function wrongOptionIds(content: MultiContent): string[] {
  const ids = content.answers.map((answer) => answer.id);
  if (content.selectionMode === "multiple") {
    const correct = new Set(content.correctAnswerIds ?? []);
    return ids.filter((id) => !correct.has(id));
  }
  return ids.filter((id) => id !== content.correctAnswerId);
}

function multiAnswerForFidelity(
  content: MultiContent,
  fidelity: Exclude<SubmissionFidelity, "latest">,
  questionIndex: number,
): string | string[] | undefined {
  const ids = content.answers.map((answer) => answer.id);
  if (ids.length === 0) return undefined;
  const wrong = wrongOptionIds(content);
  const fullyCorrect =
    fidelity === "earlier" && questionIndex === 0;
  if (content.selectionMode === "multiple") {
    const correct = content.correctAnswerIds ?? [];
    if (fullyCorrect && correct.length > 0) return [...correct];
    if (fidelity === "first") {
      return wrong.length > 0 ? [...wrong] : ids.slice(0, 1);
    }
    return correct[0] ? [correct[0]] : wrong.slice(0, 1);
  }
  if (fullyCorrect) return content.correctAnswerId ?? ids[0];
  if (fidelity === "first") return wrong[wrong.length - 1] ?? ids[0];
  return wrong[1] ?? wrong[0] ?? ids[0];
}

function matchAnswerForFidelity(
  content: MatchContent,
  fidelity: Exclude<SubmissionFidelity, "latest">,
  questionIndex: number,
): Record<string, string | null> {
  if (fidelity === "earlier" && questionIndex === 0) {
    return correctMatch(content);
  }
  return rotatedMatch(content, fidelity === "earlier" ? 2 : 1);
}

function correctMatch(content: MatchContent): Record<string, string | null> {
  const assignments: Record<string, string | null> = {};
  for (const prompt of content.prompts) {
    assignments[prompt.id] = prompt.correctTermId;
  }
  return assignments;
}

function rotatedMatch(
  content: MatchContent,
  offset: number,
): Record<string, string | null> {
  const termIds = content.terms.map((term) => term.id);
  const assignments: Record<string, string | null> = {};
  for (const prompt of content.prompts) {
    const correctIndex = termIds.indexOf(prompt.correctTermId);
    const nextIndex =
      correctIndex < 0 || termIds.length === 0
        ? 0
        : (correctIndex + offset) % termIds.length;
    assignments[prompt.id] = termIds[nextIndex] ?? null;
  }
  return assignments;
}

function matchAnswer(
  content: Extract<QuestionItem["item"], { kind: "match" }>["content"],
  preferCorrect: boolean,
): Record<string, string | null> {
  const assignments: Record<string, string | null> = {};
  for (const prompt of content.prompts) {
    assignments[prompt.id] = prompt.correctTermId;
  }
  if (!preferCorrect && content.prompts.length >= 2) {
    const previous = content.prompts[content.prompts.length - 2];
    const last = content.prompts[content.prompts.length - 1];
    assignments[previous.id] = last.correctTermId;
    assignments[last.id] = previous.correctTermId;
  }
  return assignments;
}
