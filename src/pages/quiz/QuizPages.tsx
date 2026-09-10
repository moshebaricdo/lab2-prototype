import { QuizAttemptWorkspace } from "../../components/assessment/quiz/QuizAttemptWorkspace";
import {
  mockP0ExamAssessment,
  mockQuizExamFinalAssessment,
  mockQuizExamResumeAssessment,
  mockQuizExamRetriesAssessment,
  mockQuizPracticeAssessment,
} from "../../data/assessmentBuilder/mockAssessments";
import {
  mockQuizStudentResponse,
  mockQuizStudentResponseSubmitted,
} from "../../data/assessmentBuilder/mockStudentResponses";
import {
  flowBlockId,
  getBankQuestionMap,
  loadQuizAttemptSnapshot,
  saveQuizAttemptSnapshot,
} from "../../lib/assessmentBuilder";
import { quizTakingLevelLinks, quizTeacherLevelLinks } from "../levelTypeLinks";

const bankQuestions = () => getBankQuestionMap("aif-cert");

/** Seed an in-progress attempt so the resume route opens on the in-progress intro. */
function ensureQuizExamResumeSnapshot(artifactId: string) {
  if (loadQuizAttemptSnapshot(artifactId)) return;
  saveQuizAttemptSnapshot(artifactId, {
    page: 4,
    secondsRemaining: 22 * 60 + 14,
    attemptNumber: 1,
    startedAt: Date.now() - 18 * 60 * 1000,
    responses: {
      selectedMulti: {
        [flowBlockId("q-aif-multi-1", 0)]: "a",
        [flowBlockId("q-aif-multi-features", 2)]: "a",
        [flowBlockId("q-aif-multi-4", 3)]: "b",
        [flowBlockId("q-aif-multi-2", 4)]: "a",
        [flowBlockId("q-aif-code-1", 6)]: "a",
        [flowBlockId("q-aif-multi-3", 8)]: "a",
      },
      freeText: {
        [flowBlockId("q-aif-fr-1", 5)]:
          "Overfitting is when a model memorizes training examples and then fails on new data. A validation set can help catch it.",
      },
      matchAssignments: {
        [flowBlockId("q-aif-match-1", 1)]: {
          p1: "t1",
          p2: "t2",
          p3: "t3",
        },
        [flowBlockId("q-aif-match-training", 7)]: {
          p1: "t1",
          p2: "t2",
          p3: null,
        },
      },
    },
  });
}

export function QuizPracticePage() {
  return (
    <QuizAttemptWorkspace
      artifact={mockQuizPracticeAssessment}
      bankQuestions={bankQuestions()}
      levelLinks={quizTakingLevelLinks}
      currentLevelPath="/levels/quiz-practice"
    />
  );
}

export function QuizExamRetriesPage() {
  return (
    <QuizAttemptWorkspace
      artifact={mockQuizExamRetriesAssessment}
      bankQuestions={bankQuestions()}
      levelLinks={quizTakingLevelLinks}
      currentLevelPath="/levels/quiz-exam-retries"
    />
  );
}

export function QuizExamFinalPage() {
  return (
    <QuizAttemptWorkspace
      artifact={mockQuizExamFinalAssessment}
      bankQuestions={bankQuestions()}
      levelLinks={quizTakingLevelLinks}
      currentLevelPath="/levels/quiz-exam-final"
    />
  );
}

export function QuizExamPage() {
  return (
    <QuizAttemptWorkspace
      artifact={mockP0ExamAssessment}
      bankQuestions={bankQuestions()}
      levelLinks={quizTakingLevelLinks}
      currentLevelPath="/levels/quiz-exam"
    />
  );
}

export function QuizExamResumePage() {
  ensureQuizExamResumeSnapshot(mockQuizExamResumeAssessment.id);
  return (
    <QuizAttemptWorkspace
      artifact={mockQuizExamResumeAssessment}
      bankQuestions={bankQuestions()}
      levelLinks={quizTakingLevelLinks}
      currentLevelPath="/levels/quiz-exam-resume"
      resumable
    />
  );
}

export function QuizTeacherPage() {
  return (
    <QuizAttemptWorkspace
      artifact={mockP0ExamAssessment}
      bankQuestions={bankQuestions()}
      levelLinks={quizTeacherLevelLinks}
      currentLevelPath="/levels/quiz-teacher"
      viewpoint="teacher"
    />
  );
}

export function QuizTeacherAsStudentPage() {
  return (
    <QuizAttemptWorkspace
      artifact={mockP0ExamAssessment}
      bankQuestions={bankQuestions()}
      levelLinks={quizTeacherLevelLinks}
      currentLevelPath="/levels/quiz-teacher-as-student"
      viewpoint="teacherAsStudent"
    />
  );
}

export function QuizTeacherResponsePage() {
  return (
    <QuizAttemptWorkspace
      artifact={mockP0ExamAssessment}
      bankQuestions={bankQuestions()}
      levelLinks={quizTeacherLevelLinks}
      currentLevelPath="/levels/quiz-teacher-response"
      viewpoint="studentResponse"
      studentResponse={mockQuizStudentResponse}
    />
  );
}

export function QuizTeacherResponseSubmittedPage() {
  return (
    <QuizAttemptWorkspace
      artifact={mockP0ExamAssessment}
      bankQuestions={bankQuestions()}
      levelLinks={quizTeacherLevelLinks}
      currentLevelPath="/levels/quiz-teacher-response-submitted"
      viewpoint="studentResponse"
      studentResponse={mockQuizStudentResponseSubmitted}
    />
  );
}
