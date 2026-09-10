import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lab2Shell } from "../../lab2/Lab2Shell";
import type { LevelProgressLink } from "../../ui/header/LevelProgressBubbles";
import { initialChatMessages } from "../../../data/weblab2";
import { useChatState } from "../../../hooks/useChatState";
import { useLayoutState } from "../../../hooks/useLayoutState";
import { useVersionHistoryState } from "../../../hooks/useVersionHistoryState";
import type { QuestionItem, QuestionResponse } from "../../../types/assessmentBuilder";
import {
  answerNotesForQuestion,
  correctMatchPromptIds,
  keepCorrectMatchAssignments,
  questionItemToPreviewPayload,
  quizAttemptChipCopy,
  scoreQuestionResponse,
  studentIncorrectFooterLayout,
} from "../../../lib/assessmentBuilder";
import { mockP0ExamAssessment } from "../../../data/assessmentBuilder/mockAssessments";
import { getLevelContinueTarget } from "../levelgroup/views/LevelGroupFlowBlocks";
import { FreeResponseWorkspace } from "../free-response/views/FreeResponseWorkspace";
import { MatchConnectorWorkspace } from "../match/views/MatchConnectorWorkspace";
import { MultiChoiceWorkspace } from "../multi/views/MultiChoiceWorkspace";
import {
  AnswerNotesBlock,
  ResponseResultTag,
  QuizAttemptChip,
  StudentQuestionCardFooter,
  StudentResponsesRow,
  ViewpointBanner,
} from "../shared";
import styles from "./CfuQuestionWorkspace.module.scss";

export type CfuViewpoint = "teacher" | "teacherAsStudent" | "studentResponse";

/** Pre-filled answers for the “viewing a student’s response” demo. */
export interface CfuSeedResponse {
  multiSelectedIds?: string[];
  freeText?: string;
  matchAssignments?: Record<string, string | null>;
}

interface CfuQuestionWorkspaceProps {
  question: QuestionItem;
  levelLinks?: LevelProgressLink[];
  currentLevelPath?: string;
  /** Incorrect submits may offer Try again; wrong picks stay marked next attempt. */
  allowRetry?: boolean;
  /**
   * Withhold Next level until the answer is correct (legacy CfU).
   * Only applies when `allowRetry` is on. Ignored after the last attempt.
   */
  requireCorrectAnswer?: boolean;
  /** When set, the last spent attempt shows Next level even if gated. */
  maxAttempts?: number;
  /** After submit, mark the key alongside the pick and show the explanation. */
  revealAnswer?: boolean;
  viewpoint?: CfuViewpoint;
  /** studentResponse viewpoint: whose answers are shown. */
  studentName?: string;
  /** studentResponse viewpoint, or a seeded student demo. */
  seedResponse?: CfuSeedResponse;
  /** Student demo: open already submitted (Figma S9). */
  seedSubmitted?: boolean;
  /** Student demo: how many submits have already been spent. */
  initialSubmitCount?: number;
  /**
   * Student demo: start on the next attempt with prior correct matches
   * already locked (Figma S7 matching).
   */
  seedRetryAttempt?: CfuSeedResponse;
  /** teacher viewpoint: mock “View student responses” count. */
  responseCount?: number;
}

export function CfuQuestionWorkspace({
  question,
  levelLinks,
  currentLevelPath,
  allowRetry = false,
  requireCorrectAnswer = true,
  maxAttempts,
  revealAnswer = false,
  viewpoint,
  studentName = "Maya Rodriguez",
  seedResponse,
  seedSubmitted = false,
  initialSubmitCount = 0,
  seedRetryAttempt,
  responseCount = 24,
}: CfuQuestionWorkspaceProps) {
  const navigate = useNavigate();
  const layoutState = useLayoutState();
  const chatState = useChatState(initialChatMessages);
  const versionHistory = useVersionHistoryState();
  const continueTarget = getLevelContinueTarget(levelLinks, currentLevelPath);
  const preview = useMemo(
    () => questionItemToPreviewPayload(question, mockP0ExamAssessment),
    [question],
  );

  const isTeacher = viewpoint === "teacher";
  const isTeacherAsStudent = viewpoint === "teacherAsStudent";
  const isStudentResponse = viewpoint === "studentResponse";

  const useSeededStudentWork = isStudentResponse || seedSubmitted;

  const [selectedIds, setSelectedIds] = useState<string[]>(
    () => (useSeededStudentWork ? seedResponse?.multiSelectedIds ?? [] : []),
  );
  const [freeText, setFreeText] = useState(
    () => (useSeededStudentWork ? seedResponse?.freeText ?? "" : ""),
  );
  const [matchAssignments, setMatchAssignments] = useState<
    Record<string, string | null>
  >(() =>
    question.item.kind === "match"
      ? Object.fromEntries(
          question.item.content.prompts.map((prompt) => [
            prompt.id,
            useSeededStudentWork
              ? seedResponse?.matchAssignments?.[prompt.id] ?? null
              : seedRetryAttempt?.matchAssignments?.[prompt.id] ?? null,
          ]),
        )
      : {},
  );
  const [submitted, setSubmitted] = useState(
    isStudentResponse || seedSubmitted,
  );
  const [submitCount, setSubmitCount] = useState(initialSubmitCount);
  const [persistedWrongIds, setPersistedWrongIds] = useState<string[]>([]);
  const [persistedCorrectIds, setPersistedCorrectIds] = useState<string[]>(
    () =>
      question.item.kind === "match" && seedRetryAttempt?.matchAssignments
        ? correctMatchPromptIds(
            question.item.content.prompts,
            seedRetryAttempt.matchAssignments,
          )
        : [],
  );

  const multiCorrectIds =
    question.item.kind === "multi"
      ? question.item.content.selectionMode === "multiple"
        ? (question.item.content.correctAnswerIds ?? [])
        : question.item.content.correctAnswerId
          ? [question.item.content.correctAnswerId]
          : []
      : [];

  const response: QuestionResponse = {
    bankId: question.bankId,
    multiSelectedIds: selectedIds,
    freeText,
    matchAssignments,
  };
  const scoring = scoreQuestionResponse(question, response);
  const isFr = question.item.kind === "freeResponse";
  const showCorrectness = !isFr;
  const isValid = (() => {
    if (question.item.kind === "multi") {
      const required =
        question.item.content.requiredSelectionCount ??
        (question.item.content.selectionMode === "multiple"
          ? (question.item.content.correctAnswerIds?.length ?? 1)
          : 1);
      return selectedIds.length >= required;
    }
    if (question.item.kind === "freeResponse") {
      return freeText.trim().length >= question.item.content.minCharacters;
    }
    if (question.item.kind === "match") {
      return question.item.content.prompts.every(
        (prompt) => Boolean(matchAssignments[prompt.id]),
      );
    }
    return false;
  })();

  const handleSubmit = () => {
    if (!isValid) return;
    setSubmitCount((count) => count + 1);
    setSubmitted(true);
  };

  const handleRetry = () => {
    if (question.item.kind === "multi") {
      const wrongThisAttempt = selectedIds.filter(
        (id) => !multiCorrectIds.includes(id),
      );
      const correctThisAttempt = selectedIds.filter((id) =>
        multiCorrectIds.includes(id),
      );
      if (wrongThisAttempt.length > 0) {
        setPersistedWrongIds((previous) => [
          ...new Set([...previous, ...wrongThisAttempt]),
        ]);
      }
      if (correctThisAttempt.length > 0) {
        setPersistedCorrectIds((previous) => [
          ...new Set([...previous, ...correctThisAttempt]),
        ]);
      }
      setSelectedIds(correctThisAttempt);
    }
    if (question.item.kind === "match") {
      const prompts = question.item.content.prompts;
      setPersistedCorrectIds((previous) => [
        ...new Set([
          ...previous,
          ...correctMatchPromptIds(prompts, matchAssignments),
        ]),
      ]);
      setMatchAssignments(keepCorrectMatchAssignments(prompts, matchAssignments));
    }
    setSubmitted(false);
  };

  const resultTag =
    submitted && showCorrectness && !isTeacher && !isStudentResponse ? (
      <ResponseResultTag
        status={scoring.outcome === "correct" ? "correct" : "incorrect"}
      />
    ) : null;

  const incorrectLayout =
    submitted &&
    showCorrectness &&
    !isTeacher &&
    !isStudentResponse &&
    scoring.outcome !== "correct"
      ? studentIncorrectFooterLayout({
          retriesAllowed: allowRetry,
          requireCorrect: requireCorrectAnswer,
          lastAttemptSpent:
            maxAttempts != null && submitCount >= maxAttempts,
        })
      : null;

  /** Key marks + explanation: teacher view, student-response review, or reveal after submit. */
  const revealActive =
    isTeacher || isStudentResponse || (revealAnswer && submitted);
  /** Keep the student's work visible next to the key (multi marks; match second set). */
  const keyAlongsideSelection =
    isStudentResponse || (revealAnswer && submitted && !isTeacher);

  const showNotes = isTeacher || isStudentResponse || (revealAnswer && submitted);
  const notesBlock = showNotes ? (
    <AnswerNotesBlock
      {...answerNotesForQuestion(question, {
        includeExplanation: revealActive,
        includeTeacherNote: isTeacher || isStudentResponse,
      })}
    />
  ) : null;

  const teacherActions =
    isTeacher || isTeacherAsStudent || isStudentResponse ? (
      <StudentResponsesRow count={isTeacherAsStudent ? 0 : responseCount} />
    ) : null;

  const banner = isTeacher ? (
    <ViewpointBanner>
      Viewing as a teacher — students don’t see the answer key, explanation, or
      teacher note.
    </ViewpointBanner>
  ) : isTeacherAsStudent ? (
    <ViewpointBanner>
      Viewing as a student — responses aren’t recorded.
    </ViewpointBanner>
  ) : isStudentResponse ? (
    <ViewpointBanner>
      You are viewing <strong>{studentName}’s</strong> work in read only mode.
    </ViewpointBanner>
  ) : null;

  /** Teacher view stays unlocked here; `groupTeacherReveal` already disables input. */
  const workspaceLocked = submitted;

  const showNextLevel =
    !isStudentResponse &&
    (isTeacher ||
      (submitted &&
        (isFr ||
          scoring.outcome === "correct" ||
          Boolean(incorrectLayout?.showNextLevel))));

  const lastAttemptSpent =
    maxAttempts != null && submitCount >= maxAttempts;
  const attemptChipLabel =
    isTeacher || isTeacherAsStudent || isStudentResponse
      ? null
      : quizAttemptChipCopy({
          maxAttempts,
          attemptNumber: submitCount + 1,
          lastAttemptSpent:
            lastAttemptSpent ||
            (submitted && (isFr || scoring.outcome === "correct")),
        });

  const footer = (
    <StudentQuestionCardFooter
      leftExtra={teacherActions}
      resultTag={resultTag}
      submitLeading={
        attemptChipLabel ? (
          <QuizAttemptChip label={attemptChipLabel} />
        ) : undefined
      }
      retry={
        incorrectLayout?.showRetry
          ? {
              retryVariant: incorrectLayout.retryVariant,
              retryPlacement: incorrectLayout.retryPlacement,
              onClick: handleRetry,
            }
          : undefined
      }
      primary={
        isStudentResponse
          ? { label: "Submit", disabled: true }
          : !submitted && !isTeacher
            ? {
                label: "Submit",
                disabled: !isValid,
                onClick: handleSubmit,
              }
            : showNextLevel
              ? {
                  label: "Next level",
                  endIconName: "arrow-right",
                  onClick: () => navigate(continueTarget.path),
                }
              : undefined
      }
    />
  );

  return (
    <Lab2Shell
      topNavigationProps={{
        title: "Check for understanding",
        subtitle: question.title,
        currentLevel: 1,
        totalLevels: levelLinks?.length ?? 1,
        levelLinks,
        currentLevelPath,
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
        selectedHistoryVersion: versionHistory.selectedHistoryVersion,
        setSelectedHistoryVersion: versionHistory.setSelectedHistoryVersion,
        onSaveVersion: versionHistory.handleSaveVersion,
        onRestoreVersion: versionHistory.handleRestoreVersion,
        showRestoreSuccessAlert: versionHistory.showRestoreSuccessAlert,
        setShowRestoreSuccessAlert: versionHistory.setShowRestoreSuccessAlert,
        showSaveSuccessAlert: versionHistory.showSaveSuccessAlert,
        setShowSaveSuccessAlert: versionHistory.setShowSaveSuccessAlert,
        showHistoryTab: false,
        showAiTutorTab: false,
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
      <div className={styles.page}>
        {banner}
        <div className={styles.scroll}>
          <div className={styles.stack}>
          <article className={styles.card}>
            {preview?.kind === "multi" ? (
              <MultiChoiceWorkspace
                embedded
                embeddedInSteppedGroup
                embeddedStepEyebrow=""
                studentQuestionChrome
                payload={preview.payload}
                groupSubmitted={workspaceLocked}
                groupTeacherReveal={revealActive}
                revealKeyAlongsideSelection={keyAlongsideSelection}
                persistedWrongAnswerIds={persistedWrongIds}
                persistedCorrectAnswerIds={persistedCorrectIds}
                afterBody={notesBlock}
                controlledSelectedIds={selectedIds}
                onControlledSelectedIdsChange={setSelectedIds}
              />
            ) : null}
            {preview?.kind === "freeResponse" ? (
              <FreeResponseWorkspace
                embedded
                embeddedInSteppedGroup
                embeddedStepEyebrow=""
                studentQuestionChrome
                payload={preview.payload}
                groupSubmitted={workspaceLocked}
                groupTeacherReveal={revealActive}
                afterBody={notesBlock}
                controlledResponseText={freeText}
                onControlledResponseTextChange={setFreeText}
              />
            ) : null}
            {preview?.kind === "match" ? (
              <MatchConnectorWorkspace
                embedded
                embeddedInSteppedGroup
                embeddedStepEyebrow=""
                studentQuestionChrome
                payload={preview.payload}
                groupSubmitted={workspaceLocked}
                groupTeacherReveal={revealActive}
                revealKeyAlongsideSelection={keyAlongsideSelection}
                afterBody={notesBlock}
                persistedCorrectPromptIds={persistedCorrectIds}
                controlledAssignments={matchAssignments}
                onControlledAssignmentsChange={setMatchAssignments}
              />
            ) : null}

            {footer}
          </article>
          </div>
        </div>
      </div>
    </Lab2Shell>
  );
}
