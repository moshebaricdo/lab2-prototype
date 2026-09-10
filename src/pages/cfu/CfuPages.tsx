import { CfuQuestionWorkspace } from "../../components/assessment/cfu/CfuQuestionWorkspace";
import type { CfuSeedResponse } from "../../components/assessment/cfu/CfuQuestionWorkspace";
import {
  mockFreeResponseBankQuestion,
  mockMatchBankQuestion,
  mockMultiBankQuestion,
  mockTwoCorrectBankQuestion,
} from "../../data/assessmentBuilder/mockBank";
import type { QuestionItem } from "../../types/assessmentBuilder";
import {
  cfuLevelLinks,
  cfuTeacherAsStudentTypeLinks,
  cfuTeacherResponseTypeLinks,
  cfuTeacherTypeLinks,
} from "../levelTypeLinks";
import type { LevelProgressLink } from "../../components/ui/header/LevelProgressBubbles";

type CfuType = "multi" | "checkboxes" | "free-response" | "matching";

const CFU_QUESTIONS: Record<CfuType, QuestionItem> = {
  multi: mockMultiBankQuestion,
  checkboxes: mockTwoCorrectBankQuestion,
  "free-response": mockFreeResponseBankQuestion,
  matching: mockMatchBankQuestion,
};

const CFU_RESPONSE_SEEDS: Record<CfuType, CfuSeedResponse> = {
  multi: { multiSelectedIds: ["b"] },
  checkboxes: { multiSelectedIds: ["a", "b"] },
  "free-response": {
    freeText:
      "Overfitting is when a model memorizes the training set and then does poorly on new examples. Regularization can help.",
  },
  matching: {
    matchAssignments: { p1: "t1", p2: "t3", p3: "t2" },
  },
};

function StudentCfuPage({
  question,
  path,
  allowRetry,
  requireCorrectAnswer,
  revealAnswer,
  maxAttempts,
  seedResponse,
  seedSubmitted,
  initialSubmitCount,
  seedRetryAttempt,
}: {
  question: QuestionItem;
  path: string;
  allowRetry?: boolean;
  requireCorrectAnswer?: boolean;
  revealAnswer?: boolean;
  maxAttempts?: number;
  seedResponse?: CfuSeedResponse;
  seedSubmitted?: boolean;
  initialSubmitCount?: number;
  seedRetryAttempt?: CfuSeedResponse;
}) {
  return (
    <CfuQuestionWorkspace
      question={question}
      levelLinks={cfuLevelLinks}
      currentLevelPath={path}
      allowRetry={allowRetry}
      requireCorrectAnswer={requireCorrectAnswer}
      revealAnswer={revealAnswer}
      maxAttempts={maxAttempts}
      seedResponse={seedResponse}
      seedSubmitted={seedSubmitted}
      initialSubmitCount={initialSubmitCount}
      seedRetryAttempt={seedRetryAttempt}
    />
  );
}

function CappedCfuPage({
  question,
  path,
  seedResponse,
}: {
  question: QuestionItem;
  path: string;
  seedResponse?: CfuSeedResponse;
}) {
  return (
    <StudentCfuPage
      question={question}
      path={path}
      allowRetry
      maxAttempts={3}
      seedResponse={seedResponse}
      seedSubmitted={Boolean(seedResponse)}
      initialSubmitCount={seedResponse ? 1 : 0}
    />
  );
}

function TeacherCfuPage({
  type,
  path,
  levelLinks,
  viewpoint,
}: {
  type: CfuType;
  path: string;
  levelLinks: LevelProgressLink[];
  viewpoint: "teacher" | "teacherAsStudent" | "studentResponse";
}) {
  const isCheckboxes = type === "checkboxes";
  return (
    <CfuQuestionWorkspace
      question={CFU_QUESTIONS[type]}
      levelLinks={levelLinks}
      currentLevelPath={path}
      viewpoint={viewpoint}
      allowRetry={viewpoint === "teacherAsStudent" && isCheckboxes}
      seedResponse={
        viewpoint === "studentResponse" ? CFU_RESPONSE_SEEDS[type] : undefined
      }
    />
  );
}

export function CfuMultiPage() {
  return (
    <StudentCfuPage
      question={mockMultiBankQuestion}
      path="/levels/cfu-multi"
    />
  );
}

export function CfuMultiRetryPage() {
  return (
    <StudentCfuPage
      question={mockMultiBankQuestion}
      path="/levels/cfu-multi-retry"
      allowRetry
    />
  );
}

export function CfuMultiContinuePage() {
  return (
    <StudentCfuPage
      question={mockMultiBankQuestion}
      path="/levels/cfu-multi-continue"
      allowRetry
      requireCorrectAnswer={false}
    />
  );
}

export function CfuMultiRevealPage() {
  return (
    <StudentCfuPage
      question={mockMultiBankQuestion}
      path="/levels/cfu-multi-reveal"
      revealAnswer
    />
  );
}

export function CfuMultiCappedPage() {
  return (
    <CappedCfuPage
      question={mockMultiBankQuestion}
      path="/levels/cfu-multi-capped"
      seedResponse={CFU_RESPONSE_SEEDS.multi}
    />
  );
}

export function CfuMultiCheckboxesPage() {
  return (
    <StudentCfuPage
      question={mockTwoCorrectBankQuestion}
      path="/levels/cfu-multi-checkboxes"
      allowRetry
    />
  );
}

export function CfuMultiCheckboxesContinuePage() {
  return (
    <StudentCfuPage
      question={mockTwoCorrectBankQuestion}
      path="/levels/cfu-multi-checkboxes-continue"
      allowRetry
      requireCorrectAnswer={false}
    />
  );
}

export function CfuMultiCheckboxesNoRetryPage() {
  return (
    <StudentCfuPage
      question={mockTwoCorrectBankQuestion}
      path="/levels/cfu-multi-checkboxes-no-retry"
    />
  );
}

export function CfuMultiCheckboxesRevealPage() {
  return (
    <StudentCfuPage
      question={mockTwoCorrectBankQuestion}
      path="/levels/cfu-multi-checkboxes-reveal"
      revealAnswer
    />
  );
}

export function CfuMultiCheckboxesCappedPage() {
  return (
    <CappedCfuPage
      question={mockTwoCorrectBankQuestion}
      path="/levels/cfu-multi-checkboxes-capped"
      seedResponse={CFU_RESPONSE_SEEDS.checkboxes}
    />
  );
}

export function CfuFreeResponsePage() {
  return (
    <StudentCfuPage
      question={mockFreeResponseBankQuestion}
      path="/levels/cfu-free-response"
    />
  );
}

export function CfuFreeResponseRevealPage() {
  return (
    <StudentCfuPage
      question={mockFreeResponseBankQuestion}
      path="/levels/cfu-free-response-reveal"
      revealAnswer
    />
  );
}

export function CfuFreeResponseCappedPage() {
  return (
    <CappedCfuPage
      question={mockFreeResponseBankQuestion}
      path="/levels/cfu-free-response-capped"
    />
  );
}

export function CfuMatchingPage() {
  return (
    <StudentCfuPage
      question={mockMatchBankQuestion}
      path="/levels/cfu-matching"
    />
  );
}

export function CfuMatchingRetryPage() {
  return (
    <StudentCfuPage
      question={mockMatchBankQuestion}
      path="/levels/cfu-matching-retry"
      allowRetry
    />
  );
}

/** Must-correct matching on the next attempt: correct pairs stay locked. */
export function CfuMatchingReattemptPage() {
  return (
    <StudentCfuPage
      question={mockMatchBankQuestion}
      path="/levels/cfu-matching-reattempt"
      allowRetry
      seedRetryAttempt={{
        matchAssignments: { p1: "t1", p2: "t2", p3: null },
      }}
    />
  );
}

export function CfuMatchingContinuePage() {
  return (
    <StudentCfuPage
      question={mockMatchBankQuestion}
      path="/levels/cfu-matching-continue"
      allowRetry
      requireCorrectAnswer={false}
    />
  );
}

export function CfuMatchingRevealPage() {
  return (
    <StudentCfuPage
      question={mockMatchBankQuestion}
      path="/levels/cfu-matching-reveal"
      revealAnswer
    />
  );
}

export function CfuMatchingCappedPage() {
  return (
    <CappedCfuPage
      question={mockMatchBankQuestion}
      path="/levels/cfu-matching-capped"
      seedResponse={CFU_RESPONSE_SEEDS.matching}
    />
  );
}

export function CfuTeacherPage() {
  return (
    <TeacherCfuPage
      type="multi"
      path="/levels/cfu-teacher"
      levelLinks={cfuTeacherTypeLinks}
      viewpoint="teacher"
    />
  );
}

export function CfuTeacherCheckboxesPage() {
  return (
    <TeacherCfuPage
      type="checkboxes"
      path="/levels/cfu-teacher-checkboxes"
      levelLinks={cfuTeacherTypeLinks}
      viewpoint="teacher"
    />
  );
}

export function CfuTeacherFreeResponsePage() {
  return (
    <TeacherCfuPage
      type="free-response"
      path="/levels/cfu-teacher-free-response"
      levelLinks={cfuTeacherTypeLinks}
      viewpoint="teacher"
    />
  );
}

export function CfuTeacherMatchingPage() {
  return (
    <TeacherCfuPage
      type="matching"
      path="/levels/cfu-teacher-matching"
      levelLinks={cfuTeacherTypeLinks}
      viewpoint="teacher"
    />
  );
}

export function CfuTeacherAsStudentPage() {
  return (
    <TeacherCfuPage
      type="multi"
      path="/levels/cfu-teacher-as-student"
      levelLinks={cfuTeacherAsStudentTypeLinks}
      viewpoint="teacherAsStudent"
    />
  );
}

export function CfuTeacherAsStudentCheckboxesPage() {
  return (
    <TeacherCfuPage
      type="checkboxes"
      path="/levels/cfu-teacher-as-student-checkboxes"
      levelLinks={cfuTeacherAsStudentTypeLinks}
      viewpoint="teacherAsStudent"
    />
  );
}

export function CfuTeacherAsStudentFreeResponsePage() {
  return (
    <TeacherCfuPage
      type="free-response"
      path="/levels/cfu-teacher-as-student-free-response"
      levelLinks={cfuTeacherAsStudentTypeLinks}
      viewpoint="teacherAsStudent"
    />
  );
}

export function CfuTeacherAsStudentMatchingPage() {
  return (
    <TeacherCfuPage
      type="matching"
      path="/levels/cfu-teacher-as-student-matching"
      levelLinks={cfuTeacherAsStudentTypeLinks}
      viewpoint="teacherAsStudent"
    />
  );
}

export function CfuTeacherResponsePage() {
  return (
    <TeacherCfuPage
      type="multi"
      path="/levels/cfu-teacher-response"
      levelLinks={cfuTeacherResponseTypeLinks}
      viewpoint="studentResponse"
    />
  );
}

export function CfuTeacherResponseCheckboxesPage() {
  return (
    <TeacherCfuPage
      type="checkboxes"
      path="/levels/cfu-teacher-response-checkboxes"
      levelLinks={cfuTeacherResponseTypeLinks}
      viewpoint="studentResponse"
    />
  );
}

export function CfuTeacherResponseFreeResponsePage() {
  return (
    <TeacherCfuPage
      type="free-response"
      path="/levels/cfu-teacher-response-free-response"
      levelLinks={cfuTeacherResponseTypeLinks}
      viewpoint="studentResponse"
    />
  );
}

export function CfuTeacherResponseMatchingPage() {
  return (
    <TeacherCfuPage
      type="matching"
      path="/levels/cfu-teacher-response-matching"
      levelLinks={cfuTeacherResponseTypeLinks}
      viewpoint="studentResponse"
    />
  );
}
