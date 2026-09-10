/**
 * Seeded student answers for the teacher "viewing a student's response"
 * demos and the quiz resume-in-progress demo.
 */
import type { AssessmentArtifact } from "../../types/assessmentBuilder";
import {
  flowBlockId,
  type QuizAttemptSnapshot,
} from "../../lib/assessmentBuilder";

export const MOCK_STUDENT_NAME = "Maya Rodriguez";

/** Per-type CFU answers, keyed by the teacher-route type slug. */
export const mockCfuStudentResponses: Record<
  "multi" | "two-correct" | "free-response" | "matching",
  {
    multiSelectedIds?: string[];
    freeText?: string;
    matchAssignments?: Record<string, string | null>;
  }
> = {
  // Wrong pick (key is "a").
  multi: { multiSelectedIds: ["b"] },
  // One right ("a"), one wrong ("b"); key is a + c.
  "two-correct": { multiSelectedIds: ["a", "b"] },
  "free-response": {
    freeText:
      "Overfitting is when the model does great on the training examples but much worse on new ones. I would hold out a test set and compare the scores to catch it.",
  },
  // p1 right, p2/p3 swapped.
  matching: { matchAssignments: { p1: "t1", p2: "t3", p3: "t2" } },
};

/** Answers keyed by bank id — converted to flow block ids inside the quiz workspace. */
export interface MockQuizResponseSeed {
  multi: Record<string, string>;
  freeText: Record<string, string>;
  match: Record<string, Record<string, string | null>>;
}

export interface MockQuizStudentResponse {
  studentName: string;
  /** false → still working: warning banner, nothing locked in yet. */
  submitted: boolean;
  /** Page the student was last on. */
  currentPage: number;
  elapsedSeconds?: number;
  attemptNumber?: number;
  answers: MockQuizResponseSeed;
}

/**
 * Teacher grid row 3: Maya is still working — pages 1–3 answered, Q10
 * answered, Q11/Q12 blank. Mixed correctness on purpose.
 */
export const mockQuizStudentResponse: MockQuizStudentResponse = {
  studentName: MOCK_STUDENT_NAME,
  submitted: false,
  currentPage: 1,
  answers: {
    multi: {
      "q-aif-multi-1": "a",
      "q-aif-multi-features": "a",
      "q-aif-multi-4": "a",
      "q-aif-multi-2": "a",
      "q-aif-code-1": "a",
      "q-aif-multi-3": "a",
      "q-aif-multi-facial": "b",
    },
    freeText: {
      "q-aif-fr-1":
        "Overfitting means the model memorized the training set, so training accuracy looks great while new data does badly. Keeping a held-out validation set and stopping early would reduce it.",
    },
    match: {
      "q-aif-match-1": { p1: "t1", p2: "t3", p3: "t2" },
      "q-aif-match-training": { p1: "t1", p2: "t2", p3: "t3" },
    },
  },
};

/**
 * Teacher grid: Maya submitted the exam. All 12 questions answered; 7 of 10
 * graded items correct (FR excluded) so the results band reads 70%.
 */
export const mockQuizStudentResponseSubmitted: MockQuizStudentResponse = {
  studentName: MOCK_STUDENT_NAME,
  submitted: true,
  currentPage: 1,
  elapsedSeconds: 24 * 60 + 35,
  attemptNumber: 1,
  answers: {
    multi: {
      "q-aif-multi-1": "a",
      "q-aif-multi-features": "a",
      "q-aif-multi-4": "a",
      "q-aif-multi-2": "a",
      "q-aif-code-1": "b",
      "q-aif-multi-3": "a",
      "q-aif-multi-facial": "b",
      "q-aif-multi-tradeoff": "a",
    },
    freeText: {
      "q-aif-fr-1":
        "Overfitting means the model memorized the training set, so training accuracy looks great while new data does badly. Keeping a held-out validation set and stopping early would reduce it.",
      "q-aif-fr-human-loop":
        "A human should review the model’s call when a wrong decision is costly — for example a loan denial or a medical flag — because an automated miss there is hard to undo.",
    },
    match: {
      "q-aif-match-1": { p1: "t1", p2: "t3", p3: "t2" },
      "q-aif-match-training": { p1: "t1", p2: "t2", p3: "t3" },
    },
  },
};

const RESUME_SECONDS_REMAINING = 17 * 60 + 12;

/**
 * First-visit seed for the resume route: pages 1–3 answered, attempt 1,
 * parked on page 4 with 17:12 on the clock.
 */
export function buildResumeAttemptSnapshot(
  artifact: AssessmentArtifact,
): QuizAttemptSnapshot {
  const blockId = (bankId: string) =>
    flowBlockId(
      bankId,
      artifact.questionRefs.findIndex(
        (ref) => ref.type === "bank" && ref.bankId === bankId,
      ),
    );
  const timeLimitSeconds = (artifact.timing?.timeLimitMinutes ?? 45) * 60;
  const elapsedSeconds = timeLimitSeconds - RESUME_SECONDS_REMAINING;
  return {
    page: 4,
    secondsRemaining: RESUME_SECONDS_REMAINING,
    attemptNumber: 1,
    startedAt: Date.now() - elapsedSeconds * 1000,
    responses: {
      selectedMulti: {
        [blockId("q-aif-multi-1")]: "a",
        [blockId("q-aif-multi-features")]: "a",
        [blockId("q-aif-multi-4")]: "b",
        [blockId("q-aif-multi-2")]: "a",
        [blockId("q-aif-code-1")]: "b",
        [blockId("q-aif-multi-3")]: "a",
      },
      freeText: {
        [blockId("q-aif-fr-1")]:
          "Overfitting happens when a model latches onto noise in the training data, so it scores high in training and low on anything new. Using a validation set to stop training early helps.",
      },
      matchAssignments: {
        [blockId("q-aif-match-1")]: { p1: "t1", p2: "t2", p3: "t3" },
        [blockId("q-aif-match-training")]: { p1: "t1", p2: "t3", p3: "t2" },
      },
    },
  };
}
