import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Dialog, Pagination } from "@moshebari/cads-react";
import { FaIcon } from "@moshebari/cads-react/icons";
import { Lab2Shell } from "../../lab2/Lab2Shell";
import type { AccountMenuConfig } from "../../ui/header/TopNavigation";
import type { LevelProgressLink } from "../../ui/header/LevelProgressBubbles";
import { initialChatMessages } from "../../../data/weblab2";
import { useChatState } from "../../../hooks/useChatState";
import { useLayoutState } from "../../../hooks/useLayoutState";
import { useVersionHistoryState } from "../../../hooks/useVersionHistoryState";
import type {
  AssessmentArtifact,
  QuestionItem,
  QuestionResponse,
} from "../../../types/assessmentBuilder";
import {
  getLevelContinueTarget,
  isBlockComplete,
  LevelGroupEmbeddedBlock,
  multiSelectionIds,
  useLevelGroupFlowState,
  type FlowMultiSelection,
  type LevelGroupFlowState,
  type MatchAssignments,
} from "../levelgroup/views/LevelGroupFlowBlocks";
import {
  answerNotesForQuestion,
  assessmentToFlowPayloadFromQuestions,
  clearQuizAttemptSnapshot,
  correctMatchPromptIds,
  isSectioned,
  keepCorrectMatchAssignments,
  loadQuizAttemptSnapshot,
  resolveAssessmentQuestions,
  resolvedAllowRetries,
  resolvedFeedback,
  resolvedQuizTitle,
  resolvedRequireCorrectToContinue,
  resolvedShowIntro,
  primaryQuizPageLabel,
  questionOutcomeTag,
  quizActionHasArrow,
  quizAttemptChipCopy,
  responseWasSkipped,
  studentIncorrectFooterLayout,
  saveQuizAttemptSnapshot,
  scoreQuestionResponse,
  shouldSuppressRevealDuringAttempt,
  appendStoredQuizAttempt,
  loadStoredQuizAttempts,
} from "../../../lib/assessmentBuilder";
import { submissionVersionsFromAttempts } from "../../../lib/assessmentBuilder/editableQuizViewpoint";
import type { LevelGroupQuestionBlock } from "../../../data/assessment/levelGroup";
import { isEditableQuizDemoId } from "../../../data/assessmentBuilder/editableQuizDemos";
import { QuizPreviewEmptyState } from "../builder/views/QuizPreviewEmptyState";
import {
  AnswerNotesBlock,
  QuestionOutcomeTag,
  QuizAttemptChip,
  StudentQuestionCardFooter,
  StudentResponsesRow,
  ViewpointBanner,
} from "../shared";
import styles from "./QuizAttemptWorkspace.module.scss";

export type QuizViewpoint = "teacher" | "teacherAsStudent" | "studentResponse";

/**
 * One submitted attempt in the attempt history panel.
 * Each row is "Attempt N", newest first.
 * There are no autosaves.
 */
export interface QuizSubmissionVersion {
  id: string;
  label: string;
  createdAt: string;
  /** Clock time shown beside the attempt name. */
  timestampLabel: string;
  response: QuizStudentResponseView;
}

/** Seeded answers for the “viewing a student’s response” demo, keyed by bank id. */
export interface QuizStudentResponseView {
  studentName: string;
  /** false → still working: warning banner, nothing locked in yet. */
  submitted: boolean;
  currentPage?: number;
  /** Submitted review: elapsed time shown on the results band. */
  elapsedSeconds?: number;
  /** Submitted review: which attempt this is. */
  attemptNumber?: number;
  answers: {
    /** Single-select stores one id. Multi-select stores the checked ids. */
    multi: Record<string, string | string[]>;
    freeText: Record<string, string>;
    match: Record<string, Record<string, string | null>>;
  };
}

interface QuizAttemptWorkspaceProps {
  artifact: AssessmentArtifact;
  bankQuestions: Map<string, QuestionItem>;
  levelLinks?: LevelProgressLink[];
  currentLevelPath?: string;
  embedded?: boolean;
  viewpoint?: QuizViewpoint;
  /** Required when viewpoint is `studentResponse`. */
  studentResponse?: QuizStudentResponseView;
  /**
   * Teacher review of one student’s submissions. Each entry is a version.
   * Shown only when more than one submission exists.
   */
  submissionVersions?: QuizSubmissionVersion[];
  /**
   * `submissionVersions` came from this session’s submits.
   * One recorded attempt still opens the panel. The sample list
   * opens it only when more than one row exists.
   */
  submissionHistoryLive?: boolean;
  /** Persist the in-progress attempt and offer the resume intro on return. */
  resumable?: boolean;
  /** Header control on standalone demos, such as Edit. */
  headerActions?: ReactNode;
  /** Replaces the header Username button. Editable quizzes use this to switch viewpoint. */
  accountMenu?: AccountMenuConfig;
  /** Shown when the quiz has no questions and the intro is off. */
  emptyState?: {
    title: string;
    body: string;
    actionLabel: string;
    onAction: () => void;
  };
}

type AttemptPhase = "intro" | "attempt" | "results";
type ConfirmKind =
  | "submit"
  | "submit-from-results"
  | "incomplete"
  | "times-up"
  | null;

function formatTimer(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function formatSubmittedAt(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function attemptOrdinal(n: number): string {
  if (n === 1) return "First attempt";
  if (n === 2) return "Second attempt";
  if (n === 3) return "Third attempt";
  return `Attempt ${n}`;
}

function remainingAttemptsLabel(
  retries: boolean,
  attemptNumber: number,
  maxAttempts?: number,
): string {
  if (!retries || (maxAttempts != null && attemptNumber >= maxAttempts)) {
    return "No attempts remaining";
  }
  if (maxAttempts == null) return "Unlimited attempts";
  const left = maxAttempts - attemptNumber;
  return `${left} attempt${left === 1 ? "" : "s"} remaining`;
}

function responseFromBlock(
  block: LevelGroupQuestionBlock,
  state: LevelGroupFlowState,
): QuestionResponse {
  const bankId = block.question.id;
  if (block.kind === "multi") {
    return {
      bankId,
      multiSelectedIds: multiSelectionIds(state.selectedMulti[block.blockId]),
    };
  }
  if (block.kind === "freeResponse") {
    return { bankId, freeText: state.freeText[block.blockId] ?? "" };
  }
  if (block.kind === "match") {
    return {
      bankId,
      matchAssignments: state.matchAssignments[block.blockId] ?? {},
    };
  }
  return { bankId };
}

/** Graded questions only. Free response does not decide a best attempt. */
function gradedCorrectCount(
  questions: QuestionItem[],
  response: QuizStudentResponseView,
): number | null {
  let graded = 0;
  let correct = 0;
  for (const question of questions) {
    if (question.item.kind === "freeResponse") continue;
    graded += 1;
    const picked = response.answers.multi[question.bankId];
    const scored = scoreQuestionResponse(question, {
      bankId: question.bankId,
      multiSelectedIds:
        question.item.kind === "multi"
          ? picked == null
            ? []
            : Array.isArray(picked)
              ? picked
              : [picked]
          : undefined,
      matchAssignments: response.answers.match[question.bankId],
    });
    if (scored.outcome === "correct") correct += 1;
  }
  return graded === 0 ? null : correct;
}

/**
 * Attempts that scored higher than at least one other submission.
 * A tie across every attempt leaves the badge off.
 */
function bestSubmissionIds(
  questions: QuestionItem[],
  versions: QuizSubmissionVersion[],
): Set<string> {
  const scored = versions.flatMap((version) => {
    const correct = gradedCorrectCount(questions, version.response);
    return correct == null ? [] : [{ id: version.id, correct }];
  });
  if (scored.length < 2) return new Set();
  const top = Math.max(...scored.map((item) => item.correct));
  const winners = scored.filter((item) => item.correct === top);
  if (winners.length === scored.length) return new Set();
  return new Set(winners.map((item) => item.id));
}

function flowStateFromResponse(
  steps: LevelGroupQuestionBlock[],
  questions: QuestionItem[],
  response: QuizStudentResponseView,
) {
  const selectedMulti: Record<string, FlowMultiSelection> = {};
  const freeText: Record<string, string> = {};
  const matchAssignments: Record<string, MatchAssignments> = {};
  steps.forEach((step, index) => {
    const bankId = questions[index]?.bankId;
    if (!bankId) return;
    if (step.kind === "multi") {
      const picked = response.answers.multi[bankId];
      if (picked) selectedMulti[step.blockId] = picked;
    }
    if (step.kind === "freeResponse") {
      freeText[step.blockId] = response.answers.freeText[bankId] ?? "";
    }
    if (step.kind === "match") {
      matchAssignments[step.blockId] = response.answers.match[bankId] ?? {};
    }
  });
  return { selectedMulti, freeText, matchAssignments };
}

function answersFromFlow(
  steps: LevelGroupQuestionBlock[],
  questions: QuestionItem[],
  state: Pick<
    LevelGroupFlowState,
    "selectedMulti" | "freeText" | "matchAssignments"
  >,
): QuizStudentResponseView["answers"] {
  const multi: QuizStudentResponseView["answers"]["multi"] = {};
  const freeText: Record<string, string> = {};
  const match: QuizStudentResponseView["answers"]["match"] = {};
  steps.forEach((step, index) => {
    const bankId = questions[index]?.bankId;
    if (!bankId) return;
    if (step.kind === "multi") {
      const picked = state.selectedMulti[step.blockId];
      if (picked == null || (Array.isArray(picked) && picked.length === 0)) return;
      multi[bankId] = picked;
      return;
    }
    if (step.kind === "freeResponse") {
      const text = state.freeText[step.blockId] ?? "";
      if (text) freeText[bankId] = text;
      return;
    }
    if (step.kind === "match") {
      match[bankId] = state.matchAssignments[step.blockId] ?? {};
    }
  });
  return { multi, freeText, match };
}

export function QuizAttemptWorkspace({
  artifact,
  bankQuestions,
  levelLinks,
  currentLevelPath,
  embedded = false,
  viewpoint,
  studentResponse,
  submissionVersions,
  submissionHistoryLive = false,
  resumable = false,
  headerActions,
  accountMenu,
  emptyState,
}: QuizAttemptWorkspaceProps) {
  const levelName =
    levelLinks?.find((link) => link.path === currentLevelPath)?.name ?? "";
  const quizTitle = resolvedQuizTitle(artifact.title, levelName);
  const navigate = useNavigate();
  const isTeacherViewer = viewpoint === "teacher";
  const isTeacherAsStudent = viewpoint === "teacherAsStudent";
  const isResponseReview =
    viewpoint === "studentResponse" && studentResponse != null;
  const submissionCount = submissionVersions?.length ?? 0;
  const hasSubmissionHistory =
    isResponseReview &&
    studentResponse?.submitted === true &&
    (submissionHistoryLive ? submissionCount >= 1 : submissionCount > 1);
  const trackStudentAttempts =
    isEditableQuizDemoId(artifact.id) &&
    !embedded &&
    !isTeacherViewer &&
    !isResponseReview &&
    resolvedAllowRetries(artifact);
  /** Teacher-viewer and response-review demos have no clock. */
  const timerEnabled = !isTeacherViewer && !isResponseReview;
  const continueTarget = getLevelContinueTarget(levelLinks, currentLevelPath);
  const attemptSeed = useMemo(
    () => String(Date.now()),
    [artifact.id, artifact.updatedAt],
  );
  const resolvedQuestions = useMemo(
    () => resolveAssessmentQuestions(artifact, bankQuestions, attemptSeed),
    [artifact, bankQuestions, attemptSeed],
  );
  const flowPayload = useMemo(
    () => assessmentToFlowPayloadFromQuestions(artifact, resolvedQuestions),
    [artifact, resolvedQuestions],
  );
  const { level } = flowPayload;
  const { steps } = level;
  const feedback = resolvedFeedback(artifact);
  /** Older CFU and standalone levels still lock answers from the last try. */
  const lockRetriedAnswers = !isEditableQuizDemoId(artifact.id);
  const retriesAllowed = resolvedAllowRetries(artifact);
  const requireCorrectToContinue = resolvedRequireCorrectToContinue(artifact);
  const maxAttempts = artifact.attempts?.maxAttempts;
  const suppressReveal = shouldSuppressRevealDuringAttempt(artifact);
  const showIntro = resolvedShowIntro(artifact) && Boolean(artifact.intro);
  const pages = useMemo(() => {
    if (artifact.layout === "scroll" || !isSectioned(artifact)) {
      return [steps.map((_, index) => index)];
    }
    let cursor = 0;
    return (artifact.sections ?? []).map((section) => {
      const count = section.questionRefs.length;
      const indexes = Array.from({ length: count }, (_, offset) => cursor + offset);
      cursor += count;
      return indexes;
    });
  }, [artifact, steps]);

  const [storedAttempts, setStoredAttempts] = useState(() =>
    trackStudentAttempts
      ? loadStoredQuizAttempts(artifact.id, artifact.updatedAt)
      : [],
  );
  const showLiveAttemptHistory =
    trackStudentAttempts && storedAttempts.length > 0;
  const showAttemptHistory = hasSubmissionHistory || showLiveAttemptHistory;
  const layoutState = useLayoutState(
    showAttemptHistory ? "history" : "ai-tutor",
  );
  const chatState = useChatState(initialChatMessages);
  const versionHistory = useVersionHistoryState();
  const {
    state,
    setSelectedMulti,
    setFreeText,
    setMatchAssignments,
    setDragDropParsons,
    setDragDropCategorization,
    setFillInBlankResponses,
    resetFlow,
  } = useLevelGroupFlowState(steps);

  const [phase, setPhase] = useState<AttemptPhase>(() =>
    isResponseReview
      ? studentResponse?.submitted
        ? "results"
        : "attempt"
      : showIntro
        ? "intro"
        : "attempt",
  );
  const [page, setPage] = useState(1);
  const [confirmKind, setConfirmKind] = useState<ConfirmKind>(null);
  const [attemptNumber, setAttemptNumber] = useState(
    studentResponse?.attemptNumber ?? 1,
  );
  const [attemptStartedAt, setAttemptStartedAt] = useState<number | null>(null);
  const [submittedAt, setSubmittedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(
    studentResponse?.elapsedSeconds ?? 0,
  );
  const [selectedSubmissionId, setSelectedSubmissionId] = useState("current");
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(() =>
    timerEnabled && artifact.timing?.timeLimitMinutes
      ? artifact.timing.timeLimitMinutes * 60
      : null,
  );
  /** Saved in-progress attempt (resume demo). Read once on mount. */
  const [resumeSnapshot] = useState(() =>
    resumable ? loadQuizAttemptSnapshot(artifact.id) : null,
  );
  const [cardSubmitted, setCardSubmitted] = useState(false);
  const [questionSubmitCount, setQuestionSubmitCount] = useState(
    () => storedAttempts[0]?.attemptNumber ?? 0,
  );
  const [persistedWrongIds, setPersistedWrongIds] = useState<string[]>([]);
  const [persistedCorrectIds, setPersistedCorrectIds] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const lastAttempt =
    !retriesAllowed ||
    (maxAttempts != null && attemptNumber >= maxAttempts);

  const resetTimer = () => {
    setSecondsRemaining(
      timerEnabled && artifact.timing?.timeLimitMinutes
        ? artifact.timing.timeLimitMinutes * 60
        : null,
    );
  };

  const beginAttempt = (nextAttemptNumber = attemptNumber) => {
    setAttemptNumber(nextAttemptNumber);
    setAttemptStartedAt(Date.now());
    setSubmittedAt(null);
    setElapsedSeconds(0);
    resetTimer();
    setPage(1);
    setConfirmKind(null);
    setCardSubmitted(false);
    setQuestionSubmitCount(0);
    setPersistedWrongIds([]);
    setPersistedCorrectIds([]);
    setPhase("attempt");
  };

  const retryAttempt = () => {
    if (resumable) clearQuizAttemptSnapshot(artifact.id);
    if (trackStudentAttempts) setSelectedSubmissionId("");
    resetFlow();
    const nextAttemptNumber = attemptNumber + 1;
    if (showIntro) {
      setAttemptNumber(nextAttemptNumber);
      setSubmittedAt(null);
      setElapsedSeconds(0);
      resetTimer();
      setPage(1);
      setConfirmKind(null);
      setAttemptStartedAt(null);
      setPhase("intro");
      return;
    }
    beginAttempt(nextAttemptNumber);
  };

  /** Resume demo: restore the saved attempt and land on the saved page. */
  const resumeAttempt = () => {
    if (!resumeSnapshot) {
      beginAttempt(attemptNumber);
      return;
    }
    setSelectedMulti((prev) => ({
      ...prev,
      ...resumeSnapshot.responses.selectedMulti,
    }));
    setFreeText((prev) => ({ ...prev, ...resumeSnapshot.responses.freeText }));
    setMatchAssignments((prev) => ({
      ...prev,
      ...resumeSnapshot.responses.matchAssignments,
    }));
    setAttemptNumber(resumeSnapshot.attemptNumber);
    setAttemptStartedAt(resumeSnapshot.startedAt);
    setSubmittedAt(null);
    setElapsedSeconds(0);
    setSecondsRemaining(resumeSnapshot.secondsRemaining);
    setPage(resumeSnapshot.page);
    setConfirmKind(null);
    setPhase("attempt");
  };

  useEffect(() => {
    setPhase(
      isResponseReview
        ? studentResponse?.submitted
          ? "results"
          : "attempt"
        : showIntro
          ? "intro"
          : "attempt",
    );
    setPage(1);
    setConfirmKind(null);
    const savedNumber = trackStudentAttempts
      ? (loadStoredQuizAttempts(artifact.id, artifact.updatedAt)[0]?.attemptNumber ??
        0)
      : 0;
    setAttemptNumber(
      studentResponse?.attemptNumber ?? (savedNumber > 0 ? savedNumber + 1 : 1),
    );
    setSubmittedAt(null);
    setElapsedSeconds(studentResponse?.elapsedSeconds ?? 0);
    setSelectedSubmissionId(trackStudentAttempts ? "" : "current");
    setAttemptStartedAt(showIntro ? null : Date.now());
    resetTimer();
  }, [
    artifact.id,
    artifact.timing?.timeLimitMinutes,
    showIntro,
    isResponseReview,
    studentResponse?.submitted,
    studentResponse?.attemptNumber,
    studentResponse?.elapsedSeconds,
  ]);

  /** Response review: seed the flow with the student's saved answers. */
  const [reviewHydrated, setReviewHydrated] = useState(false);
  const selectedSubmission = hasSubmissionHistory
    ? (submissionVersions?.find((version) => version.id === selectedSubmissionId) ??
      submissionVersions?.[0] ??
      null)
    : null;
  const liveHistoryVersions = useMemo(
    () =>
      showLiveAttemptHistory
        ? submissionVersionsFromAttempts(storedAttempts)
        : [],
    [showLiveAttemptHistory, storedAttempts],
  );
  const historyForPanel = hasSubmissionHistory
    ? (submissionVersions ?? [])
    : liveHistoryVersions;
  const bestAttemptIds = useMemo(
    () =>
      historyForPanel.length > 0
        ? bestSubmissionIds(resolvedQuestions, historyForPanel)
        : new Set<string>(),
    [historyForPanel, resolvedQuestions],
  );

  useEffect(() => {
    if (!selectedSubmission) return;
    const seeded = flowStateFromResponse(
      steps,
      resolvedQuestions,
      selectedSubmission.response,
    );
    setSelectedMulti(seeded.selectedMulti);
    setFreeText(seeded.freeText);
    setMatchAssignments(seeded.matchAssignments);
    setAttemptNumber(selectedSubmission.response.attemptNumber ?? 1);
    if (selectedSubmission.response.elapsedSeconds != null) {
      setElapsedSeconds(selectedSubmission.response.elapsedSeconds);
    }
    setReviewHydrated(true);
  }, [
    selectedSubmission,
    steps,
    resolvedQuestions,
    setSelectedMulti,
    setFreeText,
    setMatchAssignments,
  ]);

  useEffect(() => {
    if (
      !isResponseReview ||
      !studentResponse ||
      reviewHydrated ||
      hasSubmissionHistory
    ) {
      return;
    }
    const seededMulti: Record<string, FlowMultiSelection> = {};
    const seededText: Record<string, string> = {};
    const seededMatch: Record<string, MatchAssignments> = {};
    steps.forEach((step, index) => {
      const bankId = resolvedQuestions[index]?.bankId;
      if (!bankId) return;
      if (step.kind === "multi" && studentResponse.answers.multi[bankId]) {
        seededMulti[step.blockId] = studentResponse.answers.multi[bankId];
      }
      if (
        step.kind === "freeResponse" &&
        studentResponse.answers.freeText[bankId]
      ) {
        seededText[step.blockId] = studentResponse.answers.freeText[bankId];
      }
      if (step.kind === "match" && studentResponse.answers.match[bankId]) {
        seededMatch[step.blockId] = studentResponse.answers.match[bankId];
      }
    });
    setSelectedMulti((prev) => ({ ...prev, ...seededMulti }));
    setFreeText((prev) => ({ ...prev, ...seededText }));
    setMatchAssignments((prev) => ({ ...prev, ...seededMatch }));
    setPage(studentResponse.currentPage ?? 1);
    if (studentResponse.attemptNumber != null) {
      setAttemptNumber(studentResponse.attemptNumber);
    }
    if (studentResponse.elapsedSeconds != null) {
      setElapsedSeconds(studentResponse.elapsedSeconds);
    }
    setReviewHydrated(true);
  }, [
    isResponseReview,
    studentResponse,
    reviewHydrated,
    hasSubmissionHistory,
    steps,
    resolvedQuestions,
    setSelectedMulti,
    setFreeText,
    setMatchAssignments,
  ]);

  /** Resume demo: write the attempt through to sessionStorage while playing. */
  useEffect(() => {
    if (!resumable || phase !== "attempt") return;
    saveQuizAttemptSnapshot(artifact.id, {
      page,
      secondsRemaining,
      attemptNumber,
      startedAt: attemptStartedAt ?? Date.now(),
      responses: {
        selectedMulti: state.selectedMulti,
        freeText: state.freeText,
        matchAssignments: state.matchAssignments,
      },
    });
  }, [
    resumable,
    phase,
    page,
    secondsRemaining,
    attemptNumber,
    attemptStartedAt,
    state.selectedMulti,
    state.freeText,
    state.matchAssignments,
    artifact.id,
  ]);

  useEffect(() => {
    if (phase === "attempt" && attemptStartedAt == null) {
      setAttemptStartedAt(Date.now());
    }
  }, [phase, attemptStartedAt]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [phase, page]);

  useEffect(() => {
    if (phase !== "attempt" || secondsRemaining == null) return;
    if (secondsRemaining <= 0) {
      if (!embedded) setConfirmKind("times-up");
      return;
    }
    const timer = window.setInterval(() => {
      setSecondsRemaining((prev) => (prev == null ? prev : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase, secondsRemaining]);

  const pageIndexes = pages[page - 1] ?? [];
  const pageCount = pages.length;
  const hasPagination = pageCount > 1 && phase === "attempt";
  const isSingleQuestion = steps.length === 1;
  const isSingleQuestionAttempt = phase === "attempt" && isSingleQuestion;
  const blankCount = steps.filter((step) => !isBlockComplete(step, state)).length;
  const answeredCount = steps.length - blankCount;
  const isLastPage = page >= pageCount;
  const previewLocksSubmit = embedded && isLastPage;
  const hidePrimaryAttemptAction = isTeacherViewer && isLastPage;
  const timeLeft = secondsRemaining != null && secondsRemaining > 0;
  const isSubmitted = phase === "results";
  const lockAnswers = isSubmitted || cardSubmitted;
  const singleQuestion = resolvedQuestions[0];
  const singleBlock = steps[0];
  const singleScoring =
    isSingleQuestion && singleQuestion && singleBlock
      ? scoreQuestionResponse(
          singleQuestion,
          responseFromBlock(singleBlock, state),
        )
      : null;
  const isSingleFr = singleQuestion?.item.kind === "freeResponse";
  const singleIncorrectLayout =
    cardSubmitted &&
    feedback.showCorrectness &&
    !isSingleFr &&
    singleScoring != null &&
    singleScoring.outcome !== "correct"
      ? studentIncorrectFooterLayout({
          retriesAllowed,
          requireCorrect: requireCorrectToContinue,
          lastAttemptSpent:
            maxAttempts != null && questionSubmitCount >= maxAttempts,
        })
      : null;

  /** Resume intro meta: answered count straight from the saved snapshot. */
  const resumeAnsweredCount = useMemo(() => {
    if (!resumeSnapshot) return 0;
    return steps.filter((step) => {
      if (step.kind === "multi") {
        return (
          multiSelectionIds(resumeSnapshot.responses.selectedMulti[step.blockId])
            .length > 0
        );
      }
      if (step.kind === "freeResponse") {
        const text = resumeSnapshot.responses.freeText[step.blockId] ?? "";
        return text.trim().length >= step.question.minCharacters;
      }
      if (step.kind === "match") {
        const assignments =
          resumeSnapshot.responses.matchAssignments[step.blockId];
        return assignments
          ? step.question.prompts.every((prompt) => Boolean(assignments[prompt.id]))
          : false;
      }
      return false;
    }).length;
  }, [resumeSnapshot, steps]);

  const resumeIntroActive =
    phase === "intro" && resumable && resumeSnapshot != null;

  const resultsSummary = useMemo(() => {
    let graded = 0;
    let correct = 0;
    let hasFr = false;
    steps.forEach((block, index) => {
      const question = resolvedQuestions[index];
      if (!question) return;
      if (question.item.kind === "freeResponse") {
        hasFr = true;
        return;
      }
      graded += 1;
      const scored = scoreQuestionResponse(
        question,
        responseFromBlock(block, state),
      );
      if (scored.outcome === "correct") correct += 1;
    });
    const percent = graded === 0 ? 0 : Math.round((correct / graded) * 100);
    return { graded, correct, hasFr, percent };
  }, [steps, resolvedQuestions, state]);

  const finishAttempt = () => {
    if (resumable) clearQuizAttemptSnapshot(artifact.id);
    recordStudentAttempt(attemptNumber);
    if (!trackStudentAttempts) {
      setElapsedSeconds(elapsedSecondsForSubmit());
      setSubmittedAt(Date.now());
    }
    setConfirmKind(null);
    setPhase("results");
  };

  /** Response review: no dialogs — View results goes straight to the summary. */
  const finishReview = () => {
    setConfirmKind(null);
    setPhase("results");
  };

  const requestFinish = () => {
    if (embedded) return;
    if (blankCount > 0) {
      setConfirmKind("incomplete");
      return;
    }
    if (lastAttempt && !timeLeft) {
      finishAttempt();
      return;
    }
    if (lastAttempt && !artifact.timing) {
      finishAttempt();
      return;
    }
    setConfirmKind("submit");
  };

  const handleSingleQuestionRetry = () => {
    const question = singleQuestion;
    const block = singleBlock;
    if (
      lockRetriedAnswers &&
      question?.item.kind === "multi" &&
      block?.kind === "multi"
    ) {
      const selected = state.selectedMulti[block.blockId];
      const selectedIds = multiSelectionIds(selected);
      const correctIds =
        question.item.content.selectionMode === "multiple"
          ? (question.item.content.correctAnswerIds ?? [])
          : question.item.content.correctAnswerId
            ? [question.item.content.correctAnswerId]
            : [];
      const wrongThisAttempt = selectedIds.filter(
        (id) => !correctIds.includes(id),
      );
      const correctThisAttempt = selectedIds.filter((id) =>
        correctIds.includes(id),
      );
      setPersistedWrongIds((previous) => [
        ...new Set([...previous, ...wrongThisAttempt]),
      ]);
      setPersistedCorrectIds((previous) => [
        ...new Set([...previous, ...correctThisAttempt]),
      ]);
      setSelectedMulti((previous) => ({
        ...previous,
        [block.blockId]: Array.isArray(selected)
          ? correctThisAttempt
          : (correctThisAttempt[0] ?? null),
      }));
    }
    if (
      lockRetriedAnswers &&
      question &&
      question.item.kind === "match" &&
      block
    ) {
      const prompts = question.item.content.prompts;
      const current = state.matchAssignments[block.blockId] ?? {};
      setPersistedCorrectIds((previous) => [
        ...new Set([...previous, ...correctMatchPromptIds(prompts, current)]),
      ]);
      setMatchAssignments((previous) => ({
        ...previous,
        [block.blockId]: keepCorrectMatchAssignments(
          prompts,
          previous[block.blockId] ?? current,
        ),
      }));
    }
    setCardSubmitted(false);
    if (trackStudentAttempts) {
      setSelectedSubmissionId("");
      setAttemptStartedAt(Date.now());
    }
  };

  const elapsedSecondsForSubmit = () => {
    const started = attemptStartedAt ?? Date.now();
    if (artifact.timing?.timeLimitMinutes != null && secondsRemaining != null) {
      return Math.max(
        0,
        artifact.timing.timeLimitMinutes * 60 - secondsRemaining,
      );
    }
    return Math.max(0, Math.round((Date.now() - started) / 1000));
  };

  const recordStudentAttempt = (nextAttemptNumber: number) => {
    if (!trackStudentAttempts) return;
    const submittedAt = Date.now();
    const elapsedSeconds = elapsedSecondsForSubmit();
    const next = appendStoredQuizAttempt(artifact.id, artifact.updatedAt, {
      id: `attempt-${submittedAt}`,
      attemptNumber: nextAttemptNumber,
      submittedAt,
      elapsedSeconds,
      answers: answersFromFlow(steps, resolvedQuestions, state),
    });
    setStoredAttempts(next);
    setSelectedSubmissionId("current");
    setElapsedSeconds(elapsedSeconds);
    setSubmittedAt(submittedAt);
    layoutState.setActiveTab("history");
  };

  const handlePrimaryAttemptAction = () => {
    if (page < pageCount) {
      setPage((current) => current + 1);
      return;
    }
    if (isResponseReview) {
      finishReview();
      return;
    }
    if (isSingleQuestion) {
      if (embedded) return;
      const nextAttemptNumber = questionSubmitCount + 1;
      recordStudentAttempt(nextAttemptNumber);
      setQuestionSubmitCount(nextAttemptNumber);
      setCardSubmitted(true);
      return;
    }
    requestFinish();
  };

  const primaryAttemptLabel = isSingleQuestion
    ? "Submit"
    : primaryQuizPageLabel({
        isLastPage: page >= pageCount,
        isResponseReview,
        lastAttempt,
      });
  const primaryAttemptHasArrow = quizActionHasArrow(primaryAttemptLabel);
  const showAttemptChip =
    !isTeacherViewer &&
    !isResponseReview &&
    phase === "attempt";
  const multiQuestionChipLabel = showAttemptChip
    ? quizAttemptChipCopy({
        maxAttempts,
        attemptNumber,
      })
    : null;
  const singleQuestionChipLabel =
    showAttemptChip && isSingleQuestionAttempt
      ? quizAttemptChipCopy({
          maxAttempts,
          attemptNumber: questionSubmitCount + 1,
          lastAttemptSpent:
            (maxAttempts != null && questionSubmitCount >= maxAttempts) ||
            (cardSubmitted &&
              (isSingleFr || singleScoring?.outcome === "correct")),
        })
      : null;

  const onContinue = () => {
    if (embedded) return;
    navigate(continueTarget.path);
  };

  const timerUrgency =
    secondsRemaining == null || artifact.timing?.timeLimitMinutes == null
      ? "low"
      : secondsRemaining / (artifact.timing.timeLimitMinutes * 60) <= 0.15
        ? "high"
        : secondsRemaining / (artifact.timing.timeLimitMinutes * 60) <= 0.4
          ? "medium"
          : "low";

  const singleQuestionTimer =
    isSingleQuestionAttempt && secondsRemaining != null ? (
      <span
        className={[styles.timer, styles[`timer-${timerUrgency}`]].join(" ")}
        aria-live="polite"
      >
        <FaIcon name="clock" size="small" />
        <span className={styles.timerTime}>
          {formatTimer(secondsRemaining)}
        </span>{" "}
        remaining
      </span>
    ) : null;

  const confirmCopy = (() => {
    if (confirmKind === "times-up") {
      return {
        title: "Time’s up",
        description: retriesAllowed
          ? "This attempt was submitted with the answers you had."
          : "Your assessment was submitted with the answers you had. You can’t change them.",
        primary: "View results",
        secondary: retriesAllowed && !lastAttempt ? "Try again" : undefined,
      };
    }
    if (confirmKind === "incomplete") {
      return {
        title: `${blankCount} question${blankCount === 1 ? "" : "s"} unanswered`,
        description: timeLeft
          ? "Unanswered questions are marked not correct. You still have time left, and you can’t change your answers after you submit."
          : "Unanswered questions are marked not correct. You can’t change your answers after you submit.",
        primary: "Keep working",
        secondary: "Submit now",
      };
    }
    if (confirmKind === "submit-from-results") {
      const left =
        maxAttempts == null
          ? "unlimited attempts"
          : `${Math.max(0, maxAttempts - attemptNumber)} attempt${
              maxAttempts - attemptNumber === 1 ? "" : "s"
            }`;
      return {
        title: "Submit this attempt?",
        description: `You still have ${left} remaining. Are you sure you want to submit this attempt?`,
        primary: "Try again",
        secondary: "Submit now",
      };
    }
    if (retriesAllowed && !lastAttempt && timeLeft) {
      return {
        title: "Submit this attempt?",
        description:
          "You still have time left. You can use another attempt after this.",
        primary: "Keep working",
        secondary: "Submit now",
      };
    }
    if (retriesAllowed && !lastAttempt) {
      return {
        title: "Submit this attempt?",
        description: "You can use another attempt after this.",
        primary: "Keep working",
        secondary: "Submit now",
      };
    }
    if (timeLeft) {
      return {
        title: "Submit now?",
        description:
          "You still have time left. You can’t change your answers after you submit.",
        primary: "Keep working",
        secondary: "Submit now",
      };
    }
    return {
      title: "Submit assessment?",
      description: "You can’t change your answers after you submit.",
      primary: "Keep working",
      secondary: "Submit now",
    };
  })();

  const isPracticeResults = retriesAllowed && maxAttempts == null;
  /** Student results with no score: answers stay visible, marks stay off. */
  const answersOnlyResults =
    !isTeacherViewer && !isResponseReview && !feedback.showCorrectness;
  const resultsCardFooter = !isResponseReview ? (
    <footer className={styles.cardFooter}>
      <span className={styles.metaSuccess}>
        <FaIcon name="circle-check" size="small" /> Submitted{" "}
        {submittedAt ? formatSubmittedAt(submittedAt) : ""}
      </span>
      <div className={styles.cardFooterActions}>
        {answersOnlyResults ? (
          <>
            {!lastAttempt ? (
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                onClick={retryAttempt}
              >
                Try again
              </Button>
            ) : null}
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={onContinue}
            >
              Finish level
            </Button>
          </>
        ) : isPracticeResults ? (
          <>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              onClick={retryAttempt}
            >
              Try again
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="small"
              endIconName="arrow-right"
              onClick={onContinue}
            >
              Next level
            </Button>
          </>
        ) : lastAttempt ? (
          <Button
            variant="contained"
            color="primary"
            size="small"
            endIconName="arrow-right"
            onClick={onContinue}
          >
            Next level
          </Button>
        ) : (
          <>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              onClick={() => setConfirmKind("submit-from-results")}
            >
              Submit this attempt
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={retryAttempt}
            >
              Try again
            </Button>
          </>
        )}
      </div>
    </footer>
  ) : null;

  /** Deterministic mock “View student responses” count for teacher cards. */
  const mockResponseCount = (stepIndex: number) => 16 + ((stepIndex * 7) % 17);

  const renderQuestion = (stepIndex: number) => {
    const block = steps[stepIndex];
    if (!block) return null;
    const question = resolvedQuestions[stepIndex];
    const revealDuringResults =
      (isSubmitted || cardSubmitted) &&
      feedback.revealAnswerExplanation &&
      !suppressReveal;
    const response = question ? responseFromBlock(block, state) : null;
    const scored =
      question && response ? scoreQuestionResponse(question, response) : null;
    const outcomeKind =
      question && response && scored
        ? questionOutcomeTag({
            visible:
              !isTeacherViewer && (phase === "results" || cardSubmitted),
            skipped: responseWasSkipped(question, response),
            incorrect:
              scored.outcome !== "correct" && scored.outcome !== "ungraded",
            freeResponse: question.item.kind === "freeResponse",
          })
        : null;
    return (
      <div key={block.blockId} className={styles.cardBody}>
        <LevelGroupEmbeddedBlock
          block={block}
          stepIndex={stepIndex}
          totalSteps={steps.length}
          flowLevel={level}
          isSubmitted={lockAnswers || isResponseReview}
          flow={state}
          setSelectedMulti={setSelectedMulti}
          setFreeText={setFreeText}
          setMatchAssignments={setMatchAssignments}
          setDragDropParsons={setDragDropParsons}
          setDragDropCategorization={setDragDropCategorization}
          setFillInBlankResponses={setFillInBlankResponses}
          layout="scrollGroup"
          studentQuestionChrome
          groupTeacherReveal={isTeacherViewer || revealDuringResults}
          revealKeyAlongsideSelection={isResponseReview || revealDuringResults}
          showCorrectness={
            isTeacherViewer || isResponseReview || feedback.showCorrectness
          }
          persistedWrongAnswerIds={
            lockRetriedAnswers && isSingleQuestion
              ? persistedWrongIds
              : undefined
          }
          persistedCorrectAnswerIds={
            lockRetriedAnswers && isSingleQuestion
              ? persistedCorrectIds
              : undefined
          }
          headerEnd={
            outcomeKind ? <QuestionOutcomeTag kind={outcomeKind} /> : null
          }
          afterBody={
            question &&
            (isTeacherViewer || isResponseReview || revealDuringResults) ? (
              <AnswerNotesBlock
                {...answerNotesForQuestion(question, {
                  includeExplanation: true,
                  includeTeacherNote: isTeacherViewer || isResponseReview,
                })}
              />
            ) : null
          }
        />
        {isTeacherViewer || isTeacherAsStudent ? (
          <footer className={styles.cardFooter}>
            <div className={styles.cardFooterStart}>
              <StudentResponsesRow
                count={
                  isTeacherAsStudent
                    ? 0
                    : Math.min(24, mockResponseCount(stepIndex))
                }
                total={24}
              />
            </div>
          </footer>
        ) : null}
      </div>
    );
  };

  const viewpointBanner = isTeacherViewer ? (
    <ViewpointBanner>
      Viewing as a teacher.
    </ViewpointBanner>
  ) : isTeacherAsStudent ? (
    <ViewpointBanner>
      Viewing as a student — responses aren’t recorded.
    </ViewpointBanner>
  ) : isResponseReview ? (
    studentResponse!.submitted ? (
      <ViewpointBanner>
        You are viewing <strong>{studentResponse!.studentName}’s</strong> work in
        read only mode{selectedSubmission ? (
          <>
            {" — "}
            <strong>{selectedSubmission.label}</strong>.
          </>
        ) : (
          "."
        )}
      </ViewpointBanner>
    ) : (
      <ViewpointBanner variant="warning">
        <strong>{studentResponse!.studentName}</strong> is still working on this level.
      </ViewpointBanner>
    )
  ) : null;

  const introMetaLabel =
    maxAttempts != null
      ? `Attempt ${attemptNumber} of ${maxAttempts}`
      : retriesAllowed
        ? "Unlimited attempts"
        : "1 attempt";

  const remainingLabel = remainingAttemptsLabel(
    retriesAllowed,
    attemptNumber,
    maxAttempts,
  );

  const main = (
    <div className={styles.shell}>
      {viewpointBanner}
      <div
        className={
          steps.length === 0 && phase === "attempt" && emptyState
            ? `${styles.scroll} ${styles.scrollFill}`
            : styles.scroll
        }
        ref={scrollRef}
      >
        {phase === "intro" && artifact.intro ? (
          <article className={styles.summaryCard}>
            <div className={styles.summaryBody}>
              <p className={styles.overline}>
                {resumeIntroActive ? "in progress" : "before you begin"}
              </p>
              <h1 className={styles.title}>
                {artifact.intro.title?.trim() || quizTitle}
              </h1>
              {resumeIntroActive ? (
                <p className={styles.body}>
                  Your answers are saved and the clock keeps running. Pick up
                  right where you left off.
                </p>
              ) : (
                artifact.intro.overviewContent
                  .trim()
                  .split(/\n\n+/)
                  .map((paragraph) => (
                    <p key={paragraph} className={styles.body}>
                      {paragraph}
                    </p>
                  ))
              )}
            </div>
            <footer className={styles.cardFooter}>
              {resumeIntroActive && resumeSnapshot ? (
                <div className={styles.metaRow}>
                  <span>
                    <FaIcon name="circle-question" size="small" />{" "}
                    {resumeAnsweredCount} of {steps.length} answered
                  </span>
                  {resumeSnapshot.secondsRemaining != null ? (
                    <span>
                      <FaIcon name="clock" size="small" />{" "}
                      <span className={styles.timerTime}>
                        {formatTimer(resumeSnapshot.secondsRemaining)}
                      </span>{" "}
                      remaining
                    </span>
                  ) : null}
                  <span>
                    <FaIcon name="bullseye-arrow" size="small" />{" "}
                    {maxAttempts != null
                      ? `Attempt ${resumeSnapshot.attemptNumber} of ${maxAttempts}`
                      : `Attempt ${resumeSnapshot.attemptNumber}`}
                  </span>
                </div>
              ) : (
                <div className={styles.metaRow}>
                  <span>
                    <FaIcon name="circle-question" size="small" /> {steps.length}{" "}
                    questions
                  </span>
                  {!isTeacherViewer &&
                  artifact.timing?.timeLimitMinutes != null ? (
                    <span>
                      <FaIcon name="clock" size="small" />{" "}
                      {artifact.timing.timeLimitMinutes} minutes
                    </span>
                  ) : null}
                  {!isTeacherViewer ? (
                    <span>
                      <FaIcon name="bullseye-arrow" size="small" />{" "}
                      {introMetaLabel}
                    </span>
                  ) : null}
                </div>
              )}
              {resumeIntroActive ? (
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  endIconName="arrow-right"
                  onClick={resumeAttempt}
                >
                  Resume
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  endIconName="arrow-right"
                  onClick={() => beginAttempt(attemptNumber)}
                >
                  {isTeacherViewer ? "View questions" : "Begin"}
                </Button>
              )}
            </footer>
          </article>
        ) : null}

        {phase === "attempt" && steps.length === 0 && emptyState ? (
          <QuizPreviewEmptyState
            title={emptyState.title}
            body={emptyState.body}
            actionLabel={emptyState.actionLabel}
            onBackToBuild={emptyState.onAction}
          />
        ) : phase === "attempt"
          ? pageIndexes.map((stepIndex) => (
              <article
                key={steps[stepIndex]?.blockId}
                className={styles.questionCard}
              >
                {renderQuestion(stepIndex)}
              </article>
            ))
          : null}

        {phase === "results" && (!isResponseReview || reviewHydrated) ? (
          <>
            {answersOnlyResults ? (
              <article className={styles.summaryCard}>
                <div className={styles.summaryBody}>
                  <div className={styles.summaryHeader}>
                    <p className={styles.overline}>submitted</p>
                    <h1 className={styles.title}>{quizTitle}</h1>
                  </div>
                </div>
                <div className={styles.submittedStat}>
                  <p className={styles.statValue}>{attemptNumber}</p>
                  <div className={styles.submittedStatCopy}>
                    <p className={styles.statLabel}>Attempt #{attemptNumber}</p>
                    <p className={styles.statHelper}>{remainingLabel}</p>
                  </div>
                </div>
                {resultsCardFooter}
              </article>
            ) : (
            <article className={styles.summaryCard}>
              <div className={styles.summaryBody}>
                <div className={styles.summaryHeader}>
                  <p className={styles.overline}>
                    {isResponseReview
                      ? `${studentResponse!.studentName}’s results`
                      : "results"}
                  </p>
                  <h1 className={styles.title}>{quizTitle}</h1>
                </div>
              </div>
              <div
                className={[
                  styles.stats,
                  artifact.timing?.timeLimitMinutes == null &&
                  !(isResponseReview && !studentResponse!.submitted)
                    ? styles.statsPair
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className={styles.stat}>
                  <p className={styles.statValue}>{resultsSummary.percent}%</p>
                  <div className={styles.statCopy}>
                    <p className={styles.statLabel}>
                      {resultsSummary.correct} of {resultsSummary.graded} Correct
                    </p>
                    {resultsSummary.hasFr ? (
                      <p className={styles.statHelper}>
                        Not including free response
                      </p>
                    ) : null}
                  </div>
                </div>
                {isResponseReview && !studentResponse!.submitted ? (
                  <div className={styles.stat}>
                    <p className={styles.statValue}>{answeredCount}</p>
                    <div className={styles.statCopy}>
                      <p className={styles.statLabel}>
                        of {steps.length} answered
                      </p>
                      <p className={styles.statHelper}>Not submitted yet</p>
                    </div>
                  </div>
                ) : artifact.timing?.timeLimitMinutes != null ? (
                  <div className={styles.stat}>
                    <p className={styles.statValue}>
                      {formatTimer(elapsedSeconds)}
                    </p>
                    <div className={styles.statCopy}>
                      <p className={styles.statLabel}>Time elapsed</p>
                      <p className={styles.statHelper}>
                        {artifact.timing.timeLimitMinutes} minutes allowed
                      </p>
                    </div>
                  </div>
                ) : null}
                <div className={styles.stat}>
                  <p className={styles.statValue}>{attemptNumber}</p>
                  <div className={styles.statCopy}>
                    <p className={styles.statLabel}>
                      {attemptOrdinal(attemptNumber)}
                    </p>
                    <p className={styles.statHelper}>
                      {isResponseReview
                        ? studentResponse!.submitted
                          ? "Submitted"
                          : "Still working"
                        : remainingLabel}
                    </p>
                  </div>
                </div>
              </div>
              {resultsCardFooter}
            </article>
            )}
            {pages.map((indexes, pageIndex) => (
              <div key={pageIndex} className={styles.pageGroup}>
                {pageCount > 1 ? (
                  <div className={styles.pageDivider}>
                    <span className={styles.pageDividerLine} />
                    <p className={styles.pageDividerLabel}>
                      Page {pageIndex + 1} of {pageCount} · Questions{" "}
                      {indexes[0] + 1}–{indexes[indexes.length - 1] + 1}
                    </p>
                    <span className={styles.pageDividerLine} />
                  </div>
                ) : null}
                {indexes.map((stepIndex) => (
                  <article
                    key={steps[stepIndex]?.blockId}
                    className={styles.questionCard}
                  >
                    {renderQuestion(stepIndex)}
                  </article>
                ))}
              </div>
            ))}
          </>
        ) : null}
      </div>

      {isSingleQuestionAttempt && !isTeacherViewer ? (
        <StudentQuestionCardFooter
          submitLeading={
            singleQuestionChipLabel || singleQuestionTimer ? (
              <>
                {singleQuestionChipLabel ? (
                  <QuizAttemptChip label={singleQuestionChipLabel} />
                ) : null}
                {singleQuestionTimer}
              </>
            ) : undefined
          }
          retry={
            singleIncorrectLayout?.showRetry
              ? {
                  retryVariant: singleIncorrectLayout.retryVariant,
                  retryPlacement: singleIncorrectLayout.retryPlacement,
                  onClick: handleSingleQuestionRetry,
                  disabled: embedded,
                }
              : undefined
          }
          primary={
            isResponseReview
              ? {
                  label: "View results",
                  endIconName: "arrow-right",
                  disabled: embedded,
                  onClick: handlePrimaryAttemptAction,
                }
              : !cardSubmitted
              ? {
                  label: "Submit",
                  disabled: previewLocksSubmit || blankCount > 0,
                  onClick: handlePrimaryAttemptAction,
                }
              : !feedback.showCorrectness ||
                  isSingleFr ||
                  singleScoring?.outcome === "correct" ||
                  Boolean(singleIncorrectLayout?.showNextLevel)
                ? {
                    label: "Next level",
                    endIconName: "arrow-right",
                    disabled: embedded,
                    onClick: onContinue,
                  }
                : undefined
          }
        />
      ) : phase === "attempt" && !isSingleQuestion ? (
        <footer className={styles.footer}>
          <div className={styles.footerLeft}>
            {page > 1 ? (
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                startIconName="arrow-left"
                onClick={() => setPage((current) => current - 1)}
              >
                Back
              </Button>
            ) : null}
          </div>
          <div className={styles.footerCenter}>
            {hasPagination ? (
              <Pagination
                count={pageCount}
                page={page}
                size="small"
                layout="segmented"
                hidePrevButton
                hideNextButton
                showFirstButton={false}
                showLastButton={false}
                onChange={(_event, next) => setPage(next)}
              />
            ) : null}
          </div>
          <div className={styles.footerRight}>
            {multiQuestionChipLabel ? (
              <QuizAttemptChip label={multiQuestionChipLabel} />
            ) : null}
            {secondsRemaining != null ? (
              <span
                className={[styles.timer, styles[`timer-${timerUrgency}`]].join(
                  " ",
                )}
                aria-live="polite"
              >
                <FaIcon name="clock" size="small" />
                <span className={styles.timerTime}>
                  {formatTimer(secondsRemaining)}
                </span>{" "}
                remaining
              </span>
            ) : null}
            {hidePrimaryAttemptAction ? null : (
              <Button
                variant="contained"
                color="primary"
                size="small"
                endIconName={
                  primaryAttemptHasArrow ? "arrow-right" : undefined
                }
                disabled={previewLocksSubmit}
                onClick={handlePrimaryAttemptAction}
              >
                {primaryAttemptLabel}
              </Button>
            )}
          </div>
        </footer>
      ) : null}

      <Dialog
        type="iconTop"
        topIconName="circle-exclamation"
        open={confirmKind != null}
        title={confirmCopy.title}
        description={confirmCopy.description}
        isDismissable={confirmKind !== "times-up"}
        primaryActionLabel={confirmCopy.primary}
        secondaryActionLabel={confirmCopy.secondary}
        hasSecondaryAction={Boolean(confirmCopy.secondary)}
        onPrimaryAction={() => {
          if (confirmKind === "times-up") {
            finishAttempt();
            return;
          }
          if (confirmKind === "submit-from-results") {
            retryAttempt();
            return;
          }
          setConfirmKind(null);
        }}
        onSecondaryAction={() => {
          if (confirmKind === "times-up") {
            retryAttempt();
            return;
          }
          if (confirmKind === "submit-from-results") {
            onContinue();
            return;
          }
          finishAttempt();
        }}
        onClose={() => {
          if (confirmKind === "times-up") return;
          setConfirmKind(null);
        }}
      />
    </div>
  );

  const previewStoredAttempt = (id: string) => {
    setSelectedSubmissionId(id);
    const version = liveHistoryVersions.find((item) => item.id === id);
    if (!version) return;
    const seeded = flowStateFromResponse(
      steps,
      resolvedQuestions,
      version.response,
    );
    setSelectedMulti(seeded.selectedMulti);
    setFreeText(seeded.freeText);
    setMatchAssignments(seeded.matchAssignments);
    setAttemptNumber(version.response.attemptNumber ?? 1);
    if (version.response.elapsedSeconds != null) {
      setElapsedSeconds(version.response.elapsedSeconds);
    }
    setSubmittedAt(new Date(version.createdAt).getTime());
    setCardSubmitted(true);
    if (steps.length !== 1) setPhase("results");
  };

  if (embedded) return main;

  return (
    <Lab2Shell
      topNavigationProps={{
        title: artifact.lessonName,
        subtitle: quizTitle,
        currentLevel: artifact.metadata.levelPosition,
        totalLevels: levelLinks?.length ?? artifact.metadata.totalLevelsInScript,
        levelLinks,
        currentLevelPath,
        trailingActions: headerActions,
        accountMenu,
      }}
      sidebarProps={{
        activeTab: layoutState.activeTab,
        setActiveTab: layoutState.setActiveTab,
        sidebarWidth: layoutState.sidebarWidth,
        isSettingsOpen: layoutState.isSettingsOpen,
        setIsSettingsOpen: layoutState.setIsSettingsOpen,
        chatMessages: chatState.chatMessages,
        setChatMessages: chatState.setChatMessages,
        chatInput: chatState.chatInput,
        setChatInput: chatState.setChatInput,
        selectedHistoryVersion: showAttemptHistory
          ? selectedSubmissionId
          : versionHistory.selectedHistoryVersion,
        setSelectedHistoryVersion: showLiveAttemptHistory
          ? previewStoredAttempt
          : hasSubmissionHistory
            ? setSelectedSubmissionId
            : versionHistory.setSelectedHistoryVersion,
        onSaveVersion: showAttemptHistory
          ? undefined
          : versionHistory.handleSaveVersion,
        onRestoreVersion: showAttemptHistory
          ? undefined
          : versionHistory.handleRestoreVersion,
        showRestoreSuccessAlert: versionHistory.showRestoreSuccessAlert,
        setShowRestoreSuccessAlert: versionHistory.setShowRestoreSuccessAlert,
        showSaveSuccessAlert: versionHistory.showSaveSuccessAlert,
        setShowSaveSuccessAlert: versionHistory.setShowSaveSuccessAlert,
        showHistoryTab: showAttemptHistory,
        historyBrowseOnly: showAttemptHistory,
        historyVersions: showAttemptHistory
          ? historyForPanel.map((version) => ({
              id: version.id,
              label: version.label,
              description: version.timestampLabel,
              createdAt: version.createdAt,
              isBestAttempt: bestAttemptIds.has(version.id),
            }))
          : undefined,
        defaultCollapsed: showAttemptHistory ? false : undefined,
        showAiTutorTab: artifact.tutor.enabled,
        showBackpackTab: false,
        showContinueButton: false,
        collapsible: true,
        showInstructionsDrawer: false,
      }}
      onResize={(delta) => {
        layoutState.setSidebarWidth((prev) =>
          Math.max(300, Math.min(600, prev + delta)),
        );
      }}
    >
      {main}
    </Lab2Shell>
  );
}
