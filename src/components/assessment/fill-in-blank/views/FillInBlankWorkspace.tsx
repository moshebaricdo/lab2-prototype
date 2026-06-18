import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type SetStateAction,
} from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
import { AppButton } from "../../../ui/AppButton";
import { Lab2Shell } from "../../../lab2/Lab2Shell";
import {
  isBlankAnswerCorrect,
  mockFillInBlankLevel,
  type FillInBlankDefinition,
  type FillInBlankLevelPayload,
} from "../../../../data/assessment";
import type { CodePanelConfig } from "../../../../data/assessment/codePanel";
import { initialChatMessages } from "../../../../data/weblab2";
import { useChatState } from "../../../../hooks/useChatState";
import { useLayoutState } from "../../../../hooks/useLayoutState";
import { useVersionHistoryState } from "../../../../hooks/useVersionHistoryState";
import type { LevelProgressLink } from "../../../ui/header/LevelProgressBubbles";
import errorSoundUrl from "@/assets/audio/error-sound.mp3";
import successSoundUrl from "@/assets/audio/success-sound.mp3";
import type { DevPanelField } from "../../../lab2/dev";
import { resourcePanelCompactDevField } from "../../../lab2/dev";
import { usePropsOverride } from "../../../../hooks/usePropsOverride";
import {
  AssessmentBottomRow,
  AssessmentCodeRefLayout,
  AssessmentLevelShell,
  AssessmentStemSection,
  AssessmentSuccessFeedback,
  assessmentLevelShellVariant,
} from "../../shared";
import stemStyles from "../../shared/AssessmentStemSection.module.scss";
import styles from "./FillInBlankWorkspace.module.scss";

export type FillInBlankResponses = Record<string, string>;

interface FillInBlankWorkspaceProps {
  payload?: FillInBlankLevelPayload;
  codePanel?: CodePanelConfig;
  levelLinks?: LevelProgressLink[];
  currentLevelPath?: string;
  completedLevelPaths?: string[];
  embedded?: boolean;
  groupSubmitted?: boolean;
  controlledResponses?: FillInBlankResponses;
  onControlledResponsesChange?: (next: FillInBlankResponses) => void;
  embeddedInScrollGroup?: boolean;
  embeddedInSteppedGroup?: boolean;
  embeddedStepEyebrow?: string;
  groupTeacherReveal?: boolean;
}

function playFeedbackSound(src: string) {
  const audio = new Audio(src);
  void audio.play().catch(() => {});
}

function buildInitialResponses(blanks: FillInBlankDefinition[]): FillInBlankResponses {
  return blanks.reduce<FillInBlankResponses>((acc, blank) => {
    acc[blank.id] = "";
    return acc;
  }, {});
}

function allBlanksFilled(
  blanks: FillInBlankDefinition[],
  responses: FillInBlankResponses,
): boolean {
  return blanks.every((blank) => responses[blank.id]?.trim().length > 0);
}

function allBlanksCorrect(
  blanks: FillInBlankDefinition[],
  responses: FillInBlankResponses,
): boolean {
  return blanks.every((blank) =>
    isBlankAnswerCorrect(responses[blank.id] ?? "", blank),
  );
}

/** Character width for mad-libs underline fields — grows with typed/revealed content. */
function blankFieldSize(blank: FillInBlankDefinition, value: string): number {
  const lengths = [
    value.length,
    blank.placeholder?.length ?? 0,
    ...blank.acceptedAnswers.map((answer) => answer.length),
    4,
  ];
  return Math.min(Math.max(...lengths) + 1, 28);
}

const fillInBlankDevFields: DevPanelField[] = [
  resourcePanelCompactDevField,
  { key: "level.stem.question", label: "Question", type: "text", group: "Stem" },
  {
    key: "level.stem.description",
    label: "Description (markdown)",
    type: "textarea",
    group: "Stem",
    rows: 5,
  },
  {
    key: "level.revealAnswerEnabled",
    label: "Reveal answer",
    type: "boolean",
    group: "Behavior",
  },
  {
    key: "level.metadata.lessonName",
    label: "Lesson name",
    type: "text",
    group: "Metadata",
  },
];

export function FillInBlankWorkspace({
  payload = mockFillInBlankLevel,
  codePanel,
  levelLinks,
  currentLevelPath,
  completedLevelPaths,
  embedded = false,
  groupSubmitted = false,
  controlledResponses,
  onControlledResponsesChange,
  embeddedInScrollGroup = false,
  embeddedInSteppedGroup = false,
  embeddedStepEyebrow,
  groupTeacherReveal,
}: FillInBlankWorkspaceProps) {
  const navigate = useNavigate();
  const overrideResult = usePropsOverride(
    {
      ...(payload as unknown as Record<string, unknown>),
      resourcePanelCompact: false,
    },
  );
  const resolvedPayload = (
    embedded ? payload : overrideResult.props
  ) as unknown as FillInBlankLevelPayload;
  const { level } = resolvedPayload;
  const { blanks, segments } = level.question;
  const revealAnswerEnabled = level.question.revealAnswerEnabled === true;

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

  const resourcePanelCompact = Boolean(
    (overrideResult.props as { resourcePanelCompact?: unknown })
      .resourcePanelCompact,
  );

  const isControlled = Boolean(
    embedded &&
      controlledResponses !== undefined &&
      onControlledResponsesChange,
  );

  const [internalResponses, setInternalResponses] = useState<FillInBlankResponses>(
    () => buildInitialResponses(blanks),
  );
  const responses = isControlled ? controlledResponses! : internalResponses;
  const setResponses = (updater: SetStateAction<FillInBlankResponses>) => {
    if (isControlled) {
      const next =
        typeof updater === "function" ? updater(controlledResponses!) : updater;
      onControlledResponsesChange!(next);
    } else {
      setInternalResponses(updater);
    }
  };

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isTeacherAnswerRevealed, setIsTeacherAnswerRevealed] = useState(false);

  const teacherRevealActive =
    embedded && groupTeacherReveal !== undefined
      ? groupTeacherReveal
      : isTeacherAnswerRevealed;

  useEffect(() => {
    if (!isControlled) {
      setInternalResponses(buildInitialResponses(blanks));
    }
    setIsSubmitted(false);
    setIsTeacherAnswerRevealed(false);
  }, [level.id, blanks, isControlled]);

  const continuePath = useMemo(() => {
    if (!levelLinks?.length || !currentLevelPath) return "/levels";
    const index = levelLinks.findIndex((link) => link.path === currentLevelPath);
    if (index === -1) return "/levels";
    return levelLinks[index + 1]?.path ?? "/levels";
  }, [levelLinks, currentLevelPath]);

  const blankById = useMemo(
    () => new Map(blanks.map((blank) => [blank.id, blank])),
    [blanks],
  );

  const canSubmit = allBlanksFilled(blanks, responses);
  const isCorrect = allBlanksCorrect(blanks, responses);
  const isSubmittedForFeedback = embedded ? Boolean(groupSubmitted) : isSubmitted;
  const inputLocked = isSubmittedForFeedback || teacherRevealActive;

  const resetAfterSubmit = () => {
    setResponses(buildInitialResponses(blanks));
    setIsSubmitted(false);
  };

  const handleSubmit = () => {
    if (!canSubmit || teacherRevealActive) return;
    setIsSubmitted(true);
    playFeedbackSound(isCorrect ? successSoundUrl : errorSoundUrl);
  };

  const handleBlankChange = (blankId: string, event: ChangeEvent<HTMLInputElement>) => {
    if (inputLocked) return;
    const value = event.target.value;
    setResponses((prev) => ({ ...prev, [blankId]: value }));
  };

  const getBlankTone = (
    blank: FillInBlankDefinition,
  ): "default" | "correct" | "incorrect" | "revealed" => {
    if (teacherRevealActive) return "revealed";
    if (!isSubmittedForFeedback) return "default";
    return isBlankAnswerCorrect(responses[blank.id] ?? "", blank)
      ? "correct"
      : "incorrect";
  };

  const revealedValue = (blank: FillInBlankDefinition) =>
    blank.acceptedAnswers[0] ?? "";

  const eyebrow =
    embeddedInScrollGroup || embeddedInSteppedGroup
      ? (embeddedStepEyebrow ?? "Fill in the blank")
      : blanks.length > 1
        ? "Fill in the blanks"
        : "Fill in the blank";

  const embeddedFlatInParent =
    embedded && (embeddedInScrollGroup || embeddedInSteppedGroup);

  const cardContents = (
    <>
      <AssessmentStemSection
          eyebrow={eyebrow}
          eyebrowClassName={
            embeddedInScrollGroup ? stemStyles.stepCounterEyebrow : undefined
          }
          question={level.stem.question}
          description={level.stem.description}
        >
          <p
            className={[
              styles.passage,
              blanks.length > 1 ? styles.passageMultiBlank : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-label="Passage with blanks"
          >
            {segments.map((segment, index) => {
              if (segment.type === "text") {
                return (
                  <span key={`text-${index}`} className={styles.passageText}>
                    {segment.text}
                  </span>
                );
              }

              const blank = blankById.get(segment.blankId);
              if (!blank) return null;
              const tone = getBlankTone(blank);
              const value = teacherRevealActive
                ? revealedValue(blank)
                : (responses[blank.id] ?? "");

              return (
                <span key={segment.blankId} className={styles.blankWrap}>
                  <input
                    type="text"
                    className={[
                      styles.blankInput,
                      tone === "correct" ? styles.blankInputCorrect : "",
                      tone === "incorrect" ? styles.blankInputIncorrect : "",
                      tone === "revealed" ? styles.blankInputRevealed : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    value={value}
                    size={blankFieldSize(blank, value)}
                    placeholder={blank.placeholder ?? ""}
                    aria-label={`Blank ${segment.blankId}`}
                    disabled={inputLocked}
                    onChange={(event) => handleBlankChange(blank.id, event)}
                  />
                  {isSubmittedForFeedback && !teacherRevealActive ? (
                    <span
                      className={[
                        styles.feedbackIcon,
                        tone === "correct"
                          ? styles.feedbackCorrect
                          : styles.feedbackIncorrect,
                      ].join(" ")}
                      aria-hidden
                    >
                      <FontAwesomeIcon
                        icon={tone === "correct" ? faCheck : faXmark}
                      />
                    </span>
                  ) : null}
                </span>
              );
            })}
          </p>
        </AssessmentStemSection>

      {!embeddedFlatInParent ? (
        <AssessmentBottomRow
          showLeft={revealAnswerEnabled}
          left={
            revealAnswerEnabled ? (
              <AppButton
                variant="secondary"
                size="m"
                tone="gray"
                iconPosition="start"
                iconName={teacherRevealActive ? "eye-slash" : "eye"}
                onClick={() => setIsTeacherAnswerRevealed((prev) => !prev)}
              >
                {teacherRevealActive ? "Hide answer" : "Reveal answer"}
              </AppButton>
            ) : null
          }
          right={
            <>
              {isSubmittedForFeedback && isCorrect ? (
                <AssessmentSuccessFeedback />
              ) : null}
              {isSubmittedForFeedback && isCorrect ? (
                <AppButton
                  variant="primary"
                  size="m"
                  tone="purple"
                  onClick={() => navigate(continuePath)}
                >
                  Continue
                </AppButton>
              ) : null}
              {isSubmittedForFeedback && !isCorrect ? (
                <AppButton
                  variant="primary"
                  tone="purple"
                  size="m"
                  onClick={resetAfterSubmit}
                >
                  Try again
                </AppButton>
              ) : null}
              {!isSubmittedForFeedback ? (
                <AppButton
                  variant="primary"
                  size="m"
                  tone="purple"
                  onClick={handleSubmit}
                  disabled={!canSubmit || teacherRevealActive}
                >
                  Submit answer
                </AppButton>
              ) : null}
            </>
          }
        />
      ) : null}
    </>
  );

  const shellVariant = assessmentLevelShellVariant(
    embedded,
    embeddedFlatInParent,
  );

  const mainBody = (
    <AssessmentLevelShell variant={shellVariant}>{cardContents}</AssessmentLevelShell>
  );

  if (embedded && codePanel) {
    return (
      <AssessmentCodeRefLayout codePanel={codePanel} embedded>
        {cardContents}
      </AssessmentCodeRefLayout>
    );
  }

  if (embedded) {
    return mainBody;
  }

  const shellContent = codePanel ? (
    <AssessmentCodeRefLayout codePanel={codePanel}>{cardContents}</AssessmentCodeRefLayout>
  ) : (
    mainBody
  );

  return (
    <Lab2Shell
      topNavigationProps={{
        title: `${level.metadata.lessonName} - ${level.name}`,
        subtitle: codePanel
          ? "Code reference — split layout"
          : "Draft assessment level on Lab2 shell",
        currentLevel: level.metadata.levelPosition,
        totalLevels: level.metadata.totalLevelsInScript,
        completedLevels: [1, 2],
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
        compact: resourcePanelCompact,
        showInstructionsDrawer: false,
        devPanelFields: fillInBlankDevFields,
        devPanelOverrideResult: overrideResult,
      }}
      onResize={(delta) => {
        setSidebarWidth((prev) => Math.max(300, Math.min(600, prev + delta)));
      }}
    >
      {shellContent}
    </Lab2Shell>
  );
}
