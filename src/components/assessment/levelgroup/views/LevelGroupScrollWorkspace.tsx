import { useEffect, useState } from "react";
import { AppButton } from "../../../ui/AppButton";
import { FaIcon } from "../../../icons/FaIcon";
import { AssessmentBottomRow } from "../../shared";
import { Lab2Shell } from "../../../lab2/Lab2Shell";
import type { LevelGroupFlowPayload } from "../../../../data/assessment/levelGroup";
import { initialChatMessages } from "../../../../data/weblab2";
import { useChatState } from "../../../../hooks/useChatState";
import { useLayoutState } from "../../../../hooks/useLayoutState";
import { useVersionHistoryState } from "../../../../hooks/useVersionHistoryState";
import type { LevelProgressLink } from "../../../ui/header/LevelProgressBubbles";
import {
  allBlocksComplete,
  countSectionsMet,
  LevelGroupEmbeddedBlock,
  useLevelGroupFlowState,
} from "./LevelGroupFlowBlocks";
import { LevelGroupAssessmentIntro } from "./LevelGroupAssessmentIntro";
import styles from "./LevelGroupWorkspace.module.scss";

interface LevelGroupScrollWorkspaceProps {
  payload: LevelGroupFlowPayload;
  levelLinks?: LevelProgressLink[];
  currentLevelPath?: string;
  completedLevelPaths?: string[];
  /** Overrides Lab2 shell subtitle under the title. */
  shellSubtitle?: string;
}

const DEFAULT_SHELL_SUBTITLE =
  "All questions on one page — scroll to review, submit once.";

export function LevelGroupScrollWorkspace({
  payload,
  levelLinks,
  currentLevelPath,
  completedLevelPaths,
  shellSubtitle = DEFAULT_SHELL_SUBTITLE,
}: LevelGroupScrollWorkspaceProps) {
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
  const surveyMode = level.surveyMode === true;

  const {
    state,
    setSelectedMulti,
    setFreeText,
    setMatchAssignments,
    resetFlow,
  } = useLevelGroupFlowState(steps);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [groupTeacherReveal, setGroupTeacherReveal] = useState(false);
  const [assessmentStarted, setAssessmentStarted] = useState(
    () => !payload.level.intro,
  );

  useEffect(() => {
    setAssessmentStarted(!level.intro);
    setIsSubmitted(false);
    setGroupTeacherReveal(false);
  }, [level.id]);

  const introConfig = level.intro;
  const showIntro = Boolean(introConfig && !assessmentStarted);

  const canSubmit = allBlocksComplete(steps, state);
  const metCount = countSectionsMet(steps, state, isSubmitted, surveyMode);

  const assessmentHeaderTitle =
    level.metadata.assessmentName ?? level.name;

  const handleStartOver = () => {
    resetFlow();
    setIsSubmitted(false);
    setGroupTeacherReveal(false);
    if (introConfig) {
      setAssessmentStarted(false);
    }
  };

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
      }}
      onResize={(delta) => {
        setSidebarWidth((prev) => Math.max(300, Math.min(600, prev + delta)));
      }}
    >
      <main className={styles.workspace}>
        <div className={styles.stack}>
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
                      aria-label={`${steps.length} questions, ${introConfig.timeMinutes} minutes allowed`}
                    >
                      <span className={styles.introFooterStat}>
                        <FaIcon
                          name="circle-question"
                          size="s"
                          className={styles.introFooterStatIcon}
                          aria-hidden
                        />
                        <span>{steps.length} questions</span>
                      </span>
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
                      {surveyMode ? "Begin survey" : "Begin assessment"}
                    </AppButton>
                  }
                />
              </>
            ) : (
              <>
                {steps.map((block, index) => (
                  <div
                    key={block.blockId}
                    className={styles.scrollGroupSection}
                  >
                    <LevelGroupEmbeddedBlock
                      block={block}
                      stepIndex={index}
                      totalSteps={steps.length}
                      flowLevel={level}
                      isSubmitted={isSubmitted}
                      flow={state}
                      setSelectedMulti={setSelectedMulti}
                      setFreeText={setFreeText}
                      setMatchAssignments={setMatchAssignments}
                      layout="scrollGroup"
                      groupTeacherReveal={surveyMode ? false : groupTeacherReveal}
                    />
                  </div>
                ))}

                <AssessmentBottomRow
                  flushTop
                  showLeft={surveyMode ? isSubmitted : true}
                  left={
                    surveyMode ? (
                      isSubmitted ? (
                        <p className={styles.groupFooterSummary}>
                          Thank you for your feedback.
                        </p>
                      ) : null
                    ) : (
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
                          {groupTeacherReveal ? "Hide answer" : "Reveal answer"}
                        </AppButton>
                        {isSubmitted ? (
                          <p className={styles.groupFooterSummary}>
                            {`${metCount} of ${steps.length} questions met expectations.`}
                          </p>
                        ) : null}
                      </div>
                    )
                  }
                  right={
                    isSubmitted ? (
                      <AppButton variant="secondary" onClick={handleStartOver}>
                        Start over
                      </AppButton>
                    ) : (
                      <AppButton
                        variant="primary"
                        size="m"
                        tone="purple"
                        onClick={() => setIsSubmitted(true)}
                        disabled={!canSubmit}
                      >
                        {surveyMode ? "Submit responses" : "Submit"}
                      </AppButton>
                    )
                  }
                />
              </>
            )}
          </div>
        </div>
      </main>
    </Lab2Shell>
  );
}
