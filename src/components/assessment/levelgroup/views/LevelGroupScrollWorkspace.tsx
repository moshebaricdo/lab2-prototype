import { useEffect, useState } from "react";
import { AppButton } from "../../../ui/AppButton";
import { FaIcon } from "../../../icons/FaIcon";
import { AssessmentBottomRow, AssessmentCodeRefLayout } from "../../shared";
import { Lab2Shell } from "../../../lab2/Lab2Shell";
import type { CodePanelConfig } from "../../../../data/assessment/codePanel";
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
  codePanel?: CodePanelConfig;
  levelLinks?: LevelProgressLink[];
  currentLevelPath?: string;
  completedLevelPaths?: string[];
  /** Overrides Lab2 shell subtitle under the title. */
  shellSubtitle?: string;
  /**
   * When true, the assessment card fills the main viewport height, only the question
   * area scrolls, and the bottom row (reveal / submit) stays pinned to the bottom of the card.
   */
  stickyFooter?: boolean;
}

const DEFAULT_SHELL_SUBTITLE =
  "All questions on one page — scroll to review, submit once.";

const STICKY_FOOTER_SHELL_SUBTITLE =
  "All questions in one card — scroll inside; footer stays visible.";

export function LevelGroupScrollWorkspace({
  payload,
  codePanel,
  levelLinks,
  currentLevelPath,
  completedLevelPaths,
  shellSubtitle,
  stickyFooter = false,
}: LevelGroupScrollWorkspaceProps) {
  const resolvedShellSubtitle =
    shellSubtitle ??
    (stickyFooter ? STICKY_FOOTER_SHELL_SUBTITLE : DEFAULT_SHELL_SUBTITLE);
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

  const scrollGroupSections = steps.map((block, index) => (
    <div key={block.blockId} className={styles.scrollGroupSection}>
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
  ));

  const scrollGroupCardContent = (
    <>
      {showIntro && introConfig ? (
        <>
          {stickyFooter ? (
            <div className={styles.scrollGroupCardBody}>
              <LevelGroupAssessmentIntro
                intro={introConfig}
                assessmentTitle={assessmentHeaderTitle}
              />
            </div>
          ) : (
            <LevelGroupAssessmentIntro
              intro={introConfig}
              assessmentTitle={assessmentHeaderTitle}
            />
          )}
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
          {stickyFooter ? (
            <div className={styles.scrollGroupCardBody}>
              {scrollGroupSections}
            </div>
          ) : (
            scrollGroupSections
          )}

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
                    {groupTeacherReveal ? "Hide answers" : "Reveal answers"}
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
    </>
  );

  const mainArea = (
    <main
      className={[
        styles.workspace,
        stickyFooter ? styles.workspaceSticky : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className={[
          styles.stack,
          stickyFooter ? styles.stackSticky : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div
          className={[
            styles.scrollGroupCard,
            stickyFooter ? styles.scrollGroupCardSticky : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {scrollGroupCardContent}
        </div>
      </div>
    </main>
  );

  const shellContent = codePanel ? (
    <AssessmentCodeRefLayout codePanel={codePanel}>
      {scrollGroupCardContent}
    </AssessmentCodeRefLayout>
  ) : (
    mainArea
  );

  return (
    <Lab2Shell
      topNavigationProps={{
        title: `${level.metadata.lessonName} - ${level.name}`,
        subtitle: codePanel
          ? "Code reference — split layout"
          : resolvedShellSubtitle,
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
      {shellContent}
    </Lab2Shell>
  );
}
