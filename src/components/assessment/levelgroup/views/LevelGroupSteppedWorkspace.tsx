import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppButton } from "../../../ui/AppButton";
import { FaIcon } from "../../../ui/icons/FaIcon";
import { AssessmentBottomRow, CodeReferencePanel } from "../../shared";
import { Lab2Shell } from "../../../lab2/Lab2Shell";
import type {
  LevelGroupFlowPayload,
  LevelGroupQuestionBlock,
} from "../../../../data/assessment/levelGroup";
import { initialChatMessages } from "../../../../data/weblab2";
import { useChatState } from "../../../../hooks/useChatState";
import { useLayoutState } from "../../../../hooks/useLayoutState";
import { useVersionHistoryState } from "../../../../hooks/useVersionHistoryState";
import type { LevelProgressLink } from "../../../ui/header/LevelProgressBubbles";
import {
  allBlocksComplete,
  blockMeetsExpectations,
  isBlockComplete,
  LevelGroupEmbeddedBlock,
  getLevelContinueTarget,
  useLevelGroupFlowState,
} from "./LevelGroupFlowBlocks";
import { LevelGroupAssessmentIntro } from "./LevelGroupAssessmentIntro";
import { LevelGroupResultsCard } from "./LevelGroupResultsCard";
import styles from "./LevelGroupWorkspace.module.scss";
import flowStyles from "./LevelGroupFlow.module.scss";

export type LevelGroupSteppedProgressVariant = "headerTrack" | "bottomDots";

interface LevelGroupSteppedWorkspaceProps {
  payload: LevelGroupFlowPayload;
  levelLinks?: LevelProgressLink[];
  currentLevelPath?: string;
  completedLevelPaths?: string[];
  /** `headerTrack`: label + linear bar in the card header. `bottomDots`: no header; dots centered in the footer between Back and Next. */
  progressVariant?: LevelGroupSteppedProgressVariant;
  /** Overrides Lab2 shell subtitle under the title. */
  shellSubtitle?: string;
}

const DEFAULT_SHELL_SUBTITLE =
  "One question at a time — progress stays inside this level (teal header shows script position).";

function formatCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function LevelGroupSteppedWorkspace({
  payload,
  levelLinks,
  currentLevelPath,
  completedLevelPaths,
  progressVariant = "headerTrack",
  shellSubtitle = DEFAULT_SHELL_SUBTITLE,
}: LevelGroupSteppedWorkspaceProps) {
  const navigate = useNavigate();
  const stripCodePanel = (block: LevelGroupQuestionBlock): LevelGroupQuestionBlock =>
    block.codePanel ? { ...block, codePanel: undefined } : block;

  const {
    activeTab,
    setActiveTab,
    isSettingsOpen,
    setIsSettingsOpen,
    sidebarWidth,
    setSidebarWidth,
  } = useLayoutState();
  const { chatMessages, setChatMessages, chatInput, setChatInput } =
    useChatState(initialChatMessages);
  const {
    selectedHistoryVersion,
    setSelectedHistoryVersion,
    showRestoreSuccessAlert,
    setShowRestoreSuccessAlert,
    showSaveSuccessAlert,
    setShowSaveSuccessAlert,
    handleSaveVersion,
    handleRestoreVersion,
  } = useVersionHistoryState();

  const { level } = payload;
  const { steps } = level;
  const total = steps.length;

  const {
    state,
    setSelectedMulti,
    setFreeText,
    setMatchAssignments,
    resetFlow,
  } = useLevelGroupFlowState(steps);

  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [groupTeacherReveal, setGroupTeacherReveal] = useState(false);
  const [assessmentStarted, setAssessmentStarted] = useState(
    () => !payload.level.intro,
  );
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(
    null,
  );

  useEffect(() => {
    setActiveStep(0);
    setAssessmentStarted(!level.intro);
  }, [level.id]);

  const introConfig = level.intro;
  const showIntro = Boolean(introConfig && !assessmentStarted);

  const isBottomDots = progressVariant === "bottomDots";

  /** After Begin: centered track, timer in header, back-only footer (no reveal). */
  const usePostIntroTimedLayout =
    Boolean(introConfig && assessmentStarted) && !isBottomDots;

  useEffect(() => {
    if (!introConfig || !assessmentStarted) {
      setCountdownSeconds(null);
      return;
    }
    if (isSubmitted) {
      return;
    }
    let remaining = introConfig.timeMinutes * 60;
    setCountdownSeconds(remaining);
    const id = window.setInterval(() => {
      remaining -= 1;
      setCountdownSeconds(Math.max(0, remaining));
    }, 1000);
    return () => window.clearInterval(id);
  }, [
    level.id,
    introConfig?.timeMinutes,
    assessmentStarted,
    isSubmitted,
  ]);

  const currentBlock = steps[activeStep];
  const currentBlockCodePanel =
    !showIntro &&
    !isSubmitted &&
    currentBlock?.kind === "multi"
      ? currentBlock.codePanel
      : undefined;
  const hasActiveCodeStep = Boolean(currentBlockCodePanel);
  const currentComplete = currentBlock
    ? isBlockComplete(currentBlock, state)
    : false;
  const canSubmitFinal = allBlocksComplete(steps, state);
  const isLast = activeStep >= total - 1;

  const assessmentHeaderTitle =
    level.metadata.assessmentName ?? level.name;

  const continueTarget = useMemo(
    () => getLevelContinueTarget(levelLinks, currentLevelPath),
    [levelLinks, currentLevelPath],
  );

  const handleContinue = () => {
    navigate(continueTarget.path);
  };

  const progressFillPercent =
    total === 0
      ? 0
      : isSubmitted
        ? 100
        : ((activeStep + 1) / total) * 100;

  const goNext = () => {
    if (activeStep < total - 1) {
      setActiveStep((s) => s + 1);
    }
  };

  const goBack = () => {
    if (activeStep > 0) {
      setActiveStep((s) => s - 1);
    }
  };

  const handleStartOver = () => {
    resetFlow();
    setActiveStep(0);
    setIsSubmitted(false);
    setGroupTeacherReveal(false);
    if (introConfig) {
      setAssessmentStarted(false);
    }
  };

  const backButton = (
    <AppButton
      variant="secondary"
      tone="gray"
      iconPosition="start"
      iconName="arrow-left"
      size="m"
      onClick={goBack}
      disabled={activeStep === 0 || isSubmitted}
    >
      Back
    </AppButton>
  );

  const forwardActions =
    !currentBlock && !isSubmitted ? null : isSubmitted ? null : !isLast ? (
      <AppButton
        variant="primary"
        tone="purple"
        iconPosition="end"
        iconName="arrow-right"
        size="m"
        onClick={goNext}
        disabled={!currentComplete}
      >
        Next
      </AppButton>
    ) : (
      <AppButton
        variant="primary"
        size="m"
        tone="purple"
        onClick={() => setIsSubmitted(true)}
        disabled={!canSubmitFinal}
      >
        Submit
      </AppButton>
    );

  const dotProgress = (
    <div
      className={flowStyles.dotProgress}
      role="progressbar"
      aria-valuenow={isSubmitted ? total : activeStep + 1}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={
        isSubmitted
          ? `All ${total} questions complete`
          : `Question ${activeStep + 1} of ${total}`
      }
    >
      <div className={flowStyles.dotTrack}>
        {steps.map((block, index) => {
          const stepComplete = isBlockComplete(block, state);
          const isViewing = !isSubmitted && index === activeStep;
          const metWhenSubmitted =
            isSubmitted && blockMeetsExpectations(block, state, level.surveyMode);

          const a11yLabel = isSubmitted
            ? `Question ${index + 1}: ${metWhenSubmitted ? "met expectations" : "did not meet expectations"}`
            : `Question ${index + 1}: ${
                isViewing
                  ? stepComplete
                    ? "current step, answered"
                    : "current step, in progress"
                  : stepComplete
                    ? "answered"
                    : "not started"
              }`;

          return (
            <span
              key={block.blockId}
              className={[
                flowStyles.dot,
                isViewing && !stepComplete ? flowStyles.dotViewing : "",
                isSubmitted
                  ? metWhenSubmitted
                    ? flowStyles.dotSubmittedMet
                    : flowStyles.dotSubmittedMiss
                  : stepComplete && isViewing
                    ? flowStyles.dotAnsweredViewing
                    : stepComplete
                      ? flowStyles.dotAnswered
                      : isViewing
                        ? flowStyles.dotInProgress
                        : flowStyles.dotUnanswered,
              ]
                .filter(Boolean)
                .join(" ")}
              aria-hidden
              title={a11yLabel}
            />
          );
        })}
      </div>
    </div>
  );

  return (
    <Lab2Shell
      topNavigationProps={{
        title: `${level.metadata.lessonName} - ${level.name}`,
        subtitle: shellSubtitle,
        currentLevel: level.metadata.levelPosition,
        totalLevels: level.metadata.totalLevelsInScript,
        completedLevels: [1, 2, 3, 4, 5],
        levelLinks,
        currentLevelPath,
        completedLevelPaths,
      }}
      sidebarProps={{
        activeTab,
        setActiveTab,
        sidebarWidth,
        isSettingsOpen,
        setIsSettingsOpen,
        chatMessages,
        setChatMessages,
        chatInput,
        setChatInput,
        selectedHistoryVersion,
        setSelectedHistoryVersion,
        onSaveVersion: handleSaveVersion,
        onRestoreVersion: handleRestoreVersion,
        showRestoreSuccessAlert,
        setShowRestoreSuccessAlert,
        showSaveSuccessAlert,
        setShowSaveSuccessAlert,
        showHistoryTab: false,
        showContinueButton: false,
        collapsible: true,
        showInstructionsDrawer: false,
      }}
      onResize={(delta) => {
        setSidebarWidth((prev) => Math.max(300, Math.min(600, prev + delta)));
      }}
    >
      <main className={styles.workspace}>
        <div
          className={[
            styles.stack,
            hasActiveCodeStep ? styles.stackWithCode : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {isSubmitted && !showIntro && (
            <LevelGroupResultsCard
              steps={steps}
              flow={state}
              surveyMode={level.surveyMode}
              assessmentTitle={assessmentHeaderTitle}
              onStartOver={handleStartOver}
              onContinue={handleContinue}
              continueLabel={continueTarget.label}
              attemptLabel={
                introConfig?.attempts
                  ? `1 of ${introConfig.attempts}`
                  : undefined
              }
              elapsedTime={
                introConfig && countdownSeconds !== null
                  ? formatCountdown(
                      introConfig.timeMinutes * 60 - countdownSeconds,
                    )
                  : undefined
              }
            />
          )}
          <div className={styles.scrollGroupCard}>
            {showIntro && introConfig ? (
              <>
                <LevelGroupAssessmentIntro
                  intro={introConfig}
                  assessmentTitle={assessmentHeaderTitle}
                />
                <AssessmentBottomRow
                  flushTop
                  showLeft={true}
                  left={
                    <div
                      className={styles.introFooterStats}
                      aria-label={`${total} questions, ${introConfig.timeMinutes} minutes allowed`}
                    >
                      <span className={styles.introFooterStat}>
                        <FaIcon
                          name="circle-question"
                          size="s"
                          className={styles.introFooterStatIcon}
                          aria-hidden
                        />
                        <span>{total} questions</span>
                      </span>
                      {introConfig.attempts != null && (
                        <span className={styles.introFooterStat}>
                          <FaIcon
                            name="rotate-right"
                            size="s"
                            className={styles.introFooterStatIcon}
                            aria-hidden
                          />
                          <span>
                            {introConfig.attempts} attempt{introConfig.attempts === 1 ? "" : "s"}
                          </span>
                        </span>
                      )}
                      <span className={styles.introFooterStat}>
                        <FaIcon
                          name="clock"
                          size="s"
                          className={styles.introFooterStatIcon}
                          aria-hidden
                        />
                        <span>{introConfig.timeMinutes} min</span>
                      </span>
                    </div>
                  }
                  right={
                    <AppButton
                      variant="primary"
                      tone="purple"
                      size="m"
                      iconPosition="end"
                      iconName="arrow-right"
                      onClick={() => setAssessmentStarted(true)}
                    >
                      Begin assessment
                    </AppButton>
                  }
                />
              </>
            ) : (
              <>
            {isBottomDots ? (
              <p className={styles.stepStatusSrOnly} aria-live="polite">
                {isSubmitted
                  ? `Review all ${total} questions.`
                  : `Question ${activeStep + 1} of ${total}.`}
              </p>
            ) : null}

            {!isBottomDots && !usePostIntroTimedLayout ? (
              <div
                className={styles.steppedCardHeader}
                aria-live="polite"
                aria-atomic="true"
              >
                <div className={flowStyles.stepProgressRow}>
                  <p className={flowStyles.stepAssessmentName}>
                    {assessmentHeaderTitle}
                  </p>
                  <div
                    className={flowStyles.linearTrack}
                    role="progressbar"
                    aria-valuenow={isSubmitted ? total : activeStep + 1}
                    aria-valuemin={1}
                    aria-valuemax={total}
                    aria-label={
                      isSubmitted
                        ? `All ${total} questions complete`
                        : `Question ${activeStep + 1} of ${total}`
                    }
                  >
                    <div
                      className={flowStyles.linearFill}
                      style={{ width: `${progressFillPercent}%` }}
                    />
                  </div>
                  <p className={flowStyles.stepCounterLabel}>
                    {isSubmitted
                      ? `All ${total} questions`
                      : `Question ${activeStep + 1} of ${total}`}
                  </p>
                </div>
              </div>
            ) : null}

            {isSubmitted
              ? steps.map((block, index) => (
                  <div
                    key={block.blockId}
                    id={`results-q-${block.blockId}`}
                    className={styles.scrollGroupSection}
                  >
                    <LevelGroupEmbeddedBlock
                      block={stripCodePanel(block)}
                      stepIndex={index}
                      totalSteps={total}
                      flowLevel={level}
                      isSubmitted={isSubmitted}
                      flow={state}
                      setSelectedMulti={setSelectedMulti}
                      setFreeText={setFreeText}
                      setMatchAssignments={setMatchAssignments}
                      layout="stepped"
                      groupTeacherReveal={
                        isBottomDots || usePostIntroTimedLayout
                          ? false
                          : groupTeacherReveal
                      }
                    />
                  </div>
                ))
              : currentBlock ? (
                  <div
                    className={
                      isBottomDots || usePostIntroTimedLayout
                        ? styles.steppedCardBodyNoHeader
                        : styles.steppedCardBody
                    }
                  >
                    <LevelGroupEmbeddedBlock
                      block={stripCodePanel(currentBlock)}
                      stepIndex={activeStep}
                      totalSteps={total}
                      flowLevel={level}
                      isSubmitted={isSubmitted}
                      flow={state}
                      setSelectedMulti={setSelectedMulti}
                      setFreeText={setFreeText}
                      setMatchAssignments={setMatchAssignments}
                      layout="stepped"
                      groupTeacherReveal={
                        isBottomDots || usePostIntroTimedLayout
                          ? false
                          : groupTeacherReveal
                      }
                    />
                  </div>
                ) : null}

            {isSubmitted ? (
              <div className={styles.steppedSubmittedFooterRow}>
                <AppButton
                  variant="primary"
                  tone="purple"
                  size="m"
                  iconPosition="end"
                  iconName="arrow-right"
                  onClick={handleContinue}
                >
                  {continueTarget.label}
                </AppButton>
              </div>
            ) : null}

            {isBottomDots ? (
              !isSubmitted ? (
              <div className={styles.steppedFooterThreeCol}>
                <div className={styles.steppedFooterThreeColLeft}>
                  {backButton}
                </div>
                <div className={styles.steppedFooterThreeColCenter}>
                  {dotProgress}
                </div>
                <div className={styles.steppedFooterThreeColRight}>
                  {forwardActions}
                </div>
              </div>
              ) : null
            ) : usePostIntroTimedLayout ? (
              !isSubmitted ? (
              <div
                className={styles.steppedTimedFooterRow}
                aria-live="polite"
                aria-atomic="true"
              >
                <div className={styles.steppedTimedFooterStart}>
                    <AppButton
                      variant="secondary"
                      tone="gray"
                      iconPosition="start"
                      iconName="arrow-left"
                      size="m"
                      onClick={goBack}
                      disabled={activeStep === 0}
                    >
                      Back
                    </AppButton>
                </div>
                <div className={styles.steppedTimedFooterChrome}>
                  <span className={styles.steppedTimedTimer}>
                    <FaIcon
                      name="clock"
                      size="s"
                      className={styles.steppedTimedTimerIcon}
                      aria-hidden
                    />
                    <span className={styles.tabularFigures}>
                      {countdownSeconds !== null
                        ? formatCountdown(countdownSeconds)
                        : "—"}
                    </span>
                  </span>
                  <div className={styles.steppedTimedTrackWrap}>
                    <div
                      className={[
                        flowStyles.linearTrack,
                        flowStyles.linearTrackFixed,
                      ].join(" ")}
                      role="progressbar"
                      aria-valuenow={activeStep + 1}
                      aria-valuemin={1}
                      aria-valuemax={total}
                      aria-label={`Question ${activeStep + 1} of ${total}`}
                    >
                      <div
                        className={flowStyles.linearFill}
                        style={{ width: `${progressFillPercent}%` }}
                      />
                    </div>
                  </div>
                  <span
                    className={[
                      styles.steppedTimedStepLabel,
                      styles.tabularFigures,
                    ].join(" ")}
                  >
                    {`${activeStep + 1} of ${total}`}
                  </span>
                </div>
                <div className={styles.steppedTimedFooterEnd}>
                  {currentBlock ? (
                    <>
                      {!isLast ? (
                        <AppButton
                          variant="primary"
                          tone="purple"
                          iconPosition="end"
                          iconName="arrow-right"
                          size="m"
                          onClick={goNext}
                          disabled={!currentComplete}
                        >
                          Next
                        </AppButton>
                      ) : (
                        <AppButton
                          variant="primary"
                          size="m"
                          tone="purple"
                          onClick={() => setIsSubmitted(true)}
                          disabled={!canSubmitFinal}
                        >
                          Submit
                        </AppButton>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
              ) : null
            ) : (
              !isSubmitted ? (
              <AssessmentBottomRow
                flushTop
                showLeft={true}
                left={
                  <div className={styles.groupFooterLeft}>
                    <AppButton
                      variant="secondary"
                      tone="gray"
                      iconPosition="start"
                      iconName={groupTeacherReveal ? "eye-slash" : "eye"}
                      size="m"
                      onClick={() =>
                        setGroupTeacherReveal((previous) => !previous)
                      }
                    >
                      {groupTeacherReveal ? "Hide answers" : "Reveal answers"}
                    </AppButton>
                  </div>
                }
                right={
                  currentBlock ? (
                    <>
                      <AppButton
                        variant="secondary"
                        tone="gray"
                        iconPosition="start"
                        iconName="arrow-left"
                        size="m"
                        onClick={goBack}
                        disabled={activeStep === 0}
                      >
                        Back
                      </AppButton>
                      {!isLast ? (
                        <AppButton
                          variant="primary"
                          tone="purple"
                          iconPosition="end"
                          iconName="arrow-right"
                          size="m"
                          onClick={goNext}
                          disabled={!currentComplete}
                        >
                          Next
                        </AppButton>
                      ) : (
                        <AppButton
                          variant="primary"
                          size="m"
                          tone="purple"
                          onClick={() => setIsSubmitted(true)}
                          disabled={!canSubmitFinal}
                        >
                          Submit
                        </AppButton>
                      )}
                    </>
                  ) : null
                }
              />
              ) : null
            )}
              </>
            )}
          </div>
          {hasActiveCodeStep ? (
            <aside className={styles.steppedCodeCard}>
              <CodeReferencePanel
                files={currentBlockCodePanel!.files}
                eyebrow="Reference code"
              />
            </aside>
          ) : null}
        </div>
      </main>
    </Lab2Shell>
  );
}
