import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@moshebaricdo/cads-react";
import { FaIcon } from "../../../ui/icons/FaIcon";
import { Lab2Shell } from "../../../lab2/Lab2Shell";
import type { AssessmentArtifact } from "../../../../types/assessmentBuilder";
import type { QuestionItem } from "../../../../types/assessmentBuilder";
import {
  aggregateDomainScores,
  assessmentToFlowPayloadFromQuestions,
  resolveAssessmentQuestions,
  scoreQuestionResponse,
  shouldSuppressRevealDuringAttempt,
} from "../../../../lib/assessmentBuilder";
import { initialChatMessages } from "../../../../data/weblab2";
import { useChatState } from "../../../../hooks/useChatState";
import { useLayoutState } from "../../../../hooks/useLayoutState";
import { useVersionHistoryState } from "../../../../hooks/useVersionHistoryState";
import type { LevelProgressLink } from "../../../ui/header/LevelProgressBubbles";
import {
  allBlocksComplete,
  getLevelContinueTarget,
  LevelGroupEmbeddedBlock,
  useLevelGroupFlowState,
} from "../../levelgroup/views/LevelGroupFlowBlocks";
import { LevelGroupAssessmentIntro } from "../../levelgroup/views/LevelGroupAssessmentIntro";
import { LevelGroupResultsCard } from "../../levelgroup/views/LevelGroupResultsCard";
import { AssessmentBottomRow } from "../../shared";
import levelGroupStyles from "../../levelgroup/views/LevelGroupWorkspace.module.scss";
import styles from "./AssessmentArtifactWorkspace.module.scss";

interface AssessmentArtifactWorkspaceProps {
  artifact: AssessmentArtifact;
  bankQuestions: Map<string, QuestionItem>;
  levelLinks?: LevelProgressLink[];
  currentLevelPath?: string;
  shellSubtitle?: string;
  stepped?: boolean;
  /** When true, renders flow content only (no Lab2 shell). Used inside the builder preview. */
  embedded?: boolean;
}

export function AssessmentArtifactWorkspace({
  artifact,
  bankQuestions,
  levelLinks,
  currentLevelPath,
  shellSubtitle = "Canonical assessment artifact preview",
  stepped = false,
  embedded = false,
}: AssessmentArtifactWorkspaceProps) {
  const navigate = useNavigate();
  const attemptSeed = useMemo(() => String(Date.now()), [artifact.id, artifact.updatedAt]);
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
  const surveyMode = level.surveyMode === true;
  const suppressReveal = shouldSuppressRevealDuringAttempt(artifact);

  const layoutState = useLayoutState();
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

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [groupTeacherReveal, setGroupTeacherReveal] = useState(false);
  const [assessmentStarted, setAssessmentStarted] = useState(() => !level.intro);
  const [currentStep, setCurrentStep] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(() => {
    if (artifact.mode !== "exam" || !artifact.timing?.timeLimitMinutes) return null;
    return artifact.timing.timeLimitMinutes * 60;
  });

  useEffect(() => {
    setAssessmentStarted(!level.intro);
    setIsSubmitted(false);
    setGroupTeacherReveal(false);
    setCurrentStep(0);
    if (artifact.mode === "exam" && artifact.timing?.timeLimitMinutes) {
      setSecondsRemaining(artifact.timing.timeLimitMinutes * 60);
    } else {
      setSecondsRemaining(null);
    }
  }, [level.id, level.intro, artifact.mode, artifact.timing?.timeLimitMinutes]);

  useEffect(() => {
    if (!assessmentStarted || isSubmitted || secondsRemaining == null) return;
    if (secondsRemaining <= 0) {
      setIsSubmitted(true);
      return;
    }
    const timer = window.setInterval(() => {
      setSecondsRemaining((prev) => (prev == null ? prev : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [assessmentStarted, isSubmitted, secondsRemaining]);

  const introConfig = level.intro;
  const showIntro = Boolean(introConfig && !assessmentStarted);
  const canSubmit = allBlocksComplete(steps, state);
  const continueTarget = getLevelContinueTarget(levelLinks, currentLevelPath);
  const timerLabel =
    secondsRemaining != null
      ? `${Math.floor(secondsRemaining / 60)}:${String(secondsRemaining % 60).padStart(2, "0")}`
      : null;

  const domainSummary = useMemo(() => {
    if (!isSubmitted) return [];
    const results = resolvedQuestions.map((question) => {
      const blockId = steps.find((step) =>
        step.kind === "multi"
          ? step.question.id === question.bankId
          : step.blockId.includes(question.bankId),
      )?.blockId;
      if (!blockId) {
        return scoreQuestionResponse(question, { bankId: question.bankId });
      }
      const response = {
        bankId: question.bankId,
        multiSelectedIds: state.selectedMulti[blockId]
          ? [state.selectedMulti[blockId]!]
          : [],
        freeText: state.freeText[blockId],
        matchAssignments: state.matchAssignments[blockId],
        fillInBlank: state.fillInBlankResponses[blockId],
      };
      return scoreQuestionResponse(question, response);
    });
    return aggregateDomainScores(results);
  }, [isSubmitted, resolvedQuestions, state, steps]);

  const renderBlock = (block: (typeof steps)[number], index: number) => (
    <LevelGroupEmbeddedBlock
      key={block.blockId}
      block={block}
      stepIndex={index}
      totalSteps={steps.length}
      flowLevel={level}
      isSubmitted={isSubmitted}
      flow={state}
      setSelectedMulti={setSelectedMulti}
      setFreeText={setFreeText}
      setMatchAssignments={setMatchAssignments}
      setDragDropParsons={setDragDropParsons}
      setDragDropCategorization={setDragDropCategorization}
      setFillInBlankResponses={setFillInBlankResponses}
      layout={stepped ? "stepped" : "scrollGroup"}
      groupTeacherReveal={suppressReveal ? false : surveyMode ? false : groupTeacherReveal}
    />
  );

  const steppedBlock = steps[currentStep];

  const mainContent = (
    <main className={levelGroupStyles.workspace}>
      <div className={levelGroupStyles.stack}>
        {assessmentStarted && timerLabel && !isSubmitted && (
          <div className={styles.timerBar} aria-live="polite">
            <span className={levelGroupStyles.steppedTimedTimer}>
              <FaIcon
                name="clock"
                size="s"
                className={levelGroupStyles.steppedTimedTimerIcon}
                aria-hidden
              />
              <span className={levelGroupStyles.tabularFigures}>{timerLabel}</span>
            </span>
          </div>
        )}
        {isSubmitted && domainSummary.length > 0 && (
          <section className={styles.domainSummaryCard}>
            <h3 className={styles.domainSummaryTitle}>Score by domain</h3>
            {domainSummary.map((row) => (
              <div key={row.domainId} className={styles.domainSummaryRow}>
                <span>{row.domainLabel}</span>
                <span>
                  {row.earned}/{row.possible}
                </span>
              </div>
            ))}
          </section>
        )}
        {isSubmitted && !showIntro && (
          <LevelGroupResultsCard
            steps={steps}
            flow={state}
            surveyMode={surveyMode}
            assessmentTitle={level.metadata.assessmentName ?? level.name}
            onStartOver={() => {
              resetFlow();
              setIsSubmitted(false);
              setGroupTeacherReveal(false);
              setCurrentStep(0);
              if (introConfig) setAssessmentStarted(false);
            }}
            onContinue={() => navigate(continueTarget.path)}
            continueLabel={continueTarget.label}
          />
        )}
        <div className={levelGroupStyles.scrollGroupCard}>
          {showIntro && introConfig ? (
            <>
              <LevelGroupAssessmentIntro
                intro={introConfig}
                assessmentTitle={level.metadata.assessmentName ?? level.name}
              />
              <AssessmentBottomRow
                flushTop
                showLeft
                left={
                  <div
                    className={levelGroupStyles.introFooterStats}
                    aria-label={`${steps.length} questions`}
                  >
                    <span className={levelGroupStyles.introFooterStat}>
                      <FaIcon name="circle-question" size="s" />
                      <span>{steps.length} questions</span>
                    </span>
                  </div>
                }
                right={
                  <Button
                    variant="contained" color="primary"
                    size="medium"
                    endIconName="arrow-right"
                    onClick={() => setAssessmentStarted(true)}
                  >
                    Begin
                  </Button>
                }
              />
            </>
          ) : stepped && steppedBlock ? (
            <>
              {renderBlock(steppedBlock, currentStep)}
              <AssessmentBottomRow
                flushTop
                showLeft={!surveyMode && !suppressReveal}
                left={
                  !surveyMode && !suppressReveal ? (
                    <Button
                      variant="outlined" color="secondary"
                      startIconName={groupTeacherReveal ? "eye-slash" : "eye"}
                      size="medium"
                      onClick={() => setGroupTeacherReveal((v) => !v)}
                    >
                      {groupTeacherReveal ? "Hide answers" : "Reveal answers"}
                    </Button>
                  ) : null
                }
                right={
                  currentStep < steps.length - 1 ? (
                    <Button
                      variant="contained" color="primary"
                      size="medium"
                      onClick={() => setCurrentStep((v) => v + 1)}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      variant="contained" color="primary"
                      size="medium"
                      disabled={!canSubmit}
                      onClick={() => setIsSubmitted(true)}
                    >
                      Submit
                    </Button>
                  )
                }
              />
            </>
          ) : (
            <>
              {steps.map((block, index) => (
                <div key={block.blockId} className={levelGroupStyles.scrollGroupSection}>
                  {renderBlock(block, index)}
                </div>
              ))}
              {!isSubmitted && (
                <AssessmentBottomRow
                  flushTop
                  showLeft={!surveyMode && !suppressReveal}
                  left={
                    !surveyMode && !suppressReveal ? (
                      <Button
                        variant="outlined" color="secondary"
                        startIconName={groupTeacherReveal ? "eye-slash" : "eye"}
                        size="medium"
                        onClick={() => setGroupTeacherReveal((v) => !v)}
                      >
                        {groupTeacherReveal ? "Hide answers" : "Reveal answers"}
                      </Button>
                    ) : null
                  }
                  right={
                    <Button
                      variant="contained" color="primary"
                      size="medium"
                      disabled={!canSubmit}
                      onClick={() => setIsSubmitted(true)}
                    >
                      {surveyMode ? "Submit responses" : "Submit"}
                    </Button>
                  }
                />
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );

  if (embedded) {
    return mainContent;
  }

  return (
    <Lab2Shell
      topNavigationProps={{
        title: `${artifact.lessonName} - ${artifact.title}`,
        subtitle: shellSubtitle,
        currentLevel: artifact.metadata.levelPosition,
        totalLevels: artifact.metadata.totalLevelsInScript,
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
        showAiTutorTab: artifact.tutor.enabled,
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
      {mainContent}
    </Lab2Shell>
  );
}
