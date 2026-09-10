import { useState } from "react";
import { Button, Dialog, Dropdown, TextInput, Toggle, Tooltip } from "@moshebaricdo/cads-react";
import type { AssessmentArtifact, QuizPurpose } from "../../../../types/assessmentBuilder";
import {
  applyQuizPurpose,
  createDefaultQuizIntro,
  purposeSeeds,
  quizPurposeLabel,
  QUIZ_PURPOSE_CARDS,
  QUIZ_PURPOSE_DROPDOWN_OPTIONS,
  settingsDifferFromPurpose,
} from "../../../../lib/assessmentBuilder";
import styles from "./QuizConfigPanel.module.scss";

interface QuizConfigPanelProps {
  artifact: AssessmentArtifact;
  onUpdateArtifact: (
    updater: (current: AssessmentArtifact) => AssessmentArtifact,
  ) => void;
}

function ConfigCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.card}>
      <header className={styles.cardHeader}>{title}</header>
      <div className={styles.cardBody}>{children}</div>
    </section>
  );
}

function CardRow({
  nested,
  children,
}: {
  nested?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        nested ? `${styles.cardRow} ${styles.cardRowNested}` : styles.cardRow
      }
    >
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  helper,
  checked,
  onChange,
}: {
  label: string;
  helper?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className={styles.toggleField}>
      <Toggle
        size="small"
        label={label}
        labelPlacement="left"
        checked={checked}
        onChange={(_event, next) => onChange(next)}
      />
      {helper ? <p className={styles.helper}>{helper}</p> : null}
    </div>
  );
}

export function QuizConfigPanel({
  artifact,
  onUpdateArtifact,
}: QuizConfigPanelProps) {
  const [pendingPurpose, setPendingPurpose] = useState<QuizPurpose | null>(
    null,
  );
  const purpose = artifact.purpose;
  const isDirty = settingsDifferFromPurpose(artifact);
  const retriesOn = artifact.allowMultipleAttempts === true;
  const requireCorrect = artifact.requireCorrectAnswerToContinue === true;
  const showCorrectness = artifact.feedback?.showCorrectness === true;

  const pickPurpose = (next: QuizPurpose) => {
    if (!purpose) {
      onUpdateArtifact((current) => applyQuizPurpose(current, next));
      return;
    }
    if (next === purpose) return;
    if (isDirty) {
      setPendingPurpose(next);
      return;
    }
    onUpdateArtifact((current) => applyQuizPurpose(current, next));
  };

  if (!purpose) {
    return (
      <div className={`${styles.root} ${styles.chooser}`}>
        <div className={styles.chooserHeader}>
          <p className={styles.chooserTitle}>What is this quiz for?</p>
          <p className={styles.chooserSupport}>
            Applies typical settings (you can change these).
          </p>
        </div>
        <div className={styles.optionList}>
          {QUIZ_PURPOSE_CARDS.map((card) => (
            <button
              key={card.value}
              type="button"
              className={styles.optionCard}
              onClick={() => pickPurpose(card.value)}
            >
              <span className={styles.optionTitle}>{card.label}</span>
              <span className={styles.optionSubtitle}>{card.subtitle}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.purposeField}>
        <span className={styles.fieldLabel}>Purpose</span>
        <div className={styles.purposeControl}>
          <div className={styles.purposeDropdown}>
            <Dropdown
              role="input"
              options={QUIZ_PURPOSE_DROPDOWN_OPTIONS}
              value={purpose}
              onChange={(value) => pickPurpose(value as QuizPurpose)}
              size="small"
              color="secondary"
              width="full"
              menuWidth="trigger"
              aria-label="Purpose"
            />
          </div>
          {isDirty ? (
            <Tooltip title="Reset to defaults" placement="top">
              <span className={styles.resetWrap}>
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  iconOnly
                  startIconName="arrow-rotate-left"
                  aria-label="Reset to defaults"
                  onClick={() =>
                    onUpdateArtifact((current) =>
                      applyQuizPurpose(current, purpose),
                    )
                  }
                />
              </span>
            </Tooltip>
          ) : null}
        </div>
        {isDirty ? (
          <p className={styles.helper}>
            You've made changes to the default settings. Quiz will remain tagged
            as your selected purpose.
          </p>
        ) : null}
      </div>

      <ConfigCard title="Content">
        <CardRow>
          <ToggleRow
            label="Show intro screen"
            helper="Edit intro screen contents in the workspace"
            checked={artifact.showIntroScreen === true}
            onChange={(checked) =>
              onUpdateArtifact((current) => ({
                ...current,
                showIntroScreen: checked,
                intro: checked
                  ? (current.intro ?? createDefaultQuizIntro(current))
                  : current.intro,
              }))
            }
          />
        </CardRow>
      </ConfigCard>

      <ConfigCard title="Rules">
        <CardRow>
          <div className={styles.timeLimit}>
            <TextInput
              label="Set time limit"
              helperText="Leave unset for no time limit"
              size="small"
              color="secondary"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              placeholder=""
              className={styles.numericField}
              value={
                artifact.timing?.timeLimitMinutes != null
                  ? String(artifact.timing.timeLimitMinutes)
                  : ""
              }
              onChange={(event) => {
                const minutes = Number.parseInt(event.target.value, 10);
                onUpdateArtifact((current) => ({
                  ...current,
                  timing:
                    Number.isFinite(minutes) && minutes > 0
                      ? { timeLimitMinutes: minutes }
                      : undefined,
                }));
              }}
            />
          </div>
        </CardRow>
        <CardRow nested={retriesOn}>
          <ToggleRow
            label="Allow multiple attempts"
            checked={retriesOn}
            onChange={(checked) =>
              onUpdateArtifact((current) => ({
                ...current,
                allowMultipleAttempts: checked,
                attempts: checked ? current.attempts : undefined,
                requireCorrectAnswerToContinue: checked
                  ? (current.requireCorrectAnswerToContinue ??
                    (current.purpose
                      ? purposeSeeds(current.purpose)
                          .requireCorrectAnswerToContinue
                      : false))
                  : current.requireCorrectAnswerToContinue,
              }))
            }
          />
          {retriesOn ? (
            <div className={styles.conditional}>
              <TextInput
                label="Max attempts"
                helperText="Leave unset for unlimited attempts"
                size="small"
                color="secondary"
                type="number"
                inputMode="numeric"
                min={2}
                step={1}
                placeholder="Unlimited"
                className={styles.numericField}
                value={
                  artifact.attempts?.maxAttempts != null
                    ? String(artifact.attempts.maxAttempts)
                    : ""
                }
                onChange={(event) => {
                  const maxAttempts = Number.parseInt(event.target.value, 10);
                  onUpdateArtifact((current) => ({
                    ...current,
                    attempts:
                      Number.isFinite(maxAttempts) && maxAttempts >= 2
                        ? { maxAttempts }
                        : undefined,
                  }));
                }}
              />
              <ToggleRow
                label="Require a correct answer to continue"
                checked={requireCorrect}
                onChange={(checked) =>
                  onUpdateArtifact((current) => ({
                    ...current,
                    requireCorrectAnswerToContinue: checked,
                  }))
                }
              />
            </div>
          ) : null}
        </CardRow>
      </ConfigCard>

      <ConfigCard title="Feedback">
        <CardRow nested={showCorrectness}>
          <ToggleRow
            label="Show correctness"
            checked={showCorrectness}
            onChange={(checked) =>
              onUpdateArtifact((current) => ({
                ...current,
                feedback: {
                  showCorrectness: checked,
                  revealAnswerExplanation: checked
                    ? (current.feedback?.revealAnswerExplanation ?? false)
                    : false,
                },
              }))
            }
          />
          {showCorrectness ? (
            <div className={styles.conditional}>
              <ToggleRow
                label="Reveal answer and explanation"
                helper="Reveal the correct answer and the explanation."
                checked={artifact.feedback?.revealAnswerExplanation === true}
                onChange={(checked) =>
                  onUpdateArtifact((current) => ({
                    ...current,
                    feedback: {
                      showCorrectness: true,
                      revealAnswerExplanation: checked,
                    },
                  }))
                }
              />
            </div>
          ) : null}
        </CardRow>
      </ConfigCard>

      <ConfigCard title="AI Tutor">
        <CardRow>
          <ToggleRow
            label="Enable AI Tutor"
            helper="Tutor will be enabled after submission."
            checked={artifact.tutor.enabled}
            onChange={(checked) =>
              onUpdateArtifact((current) => ({
                ...current,
                tutor: { ...current.tutor, enabled: checked },
              }))
            }
          />
        </CardRow>
      </ConfigCard>

      <Dialog
        open={pendingPurpose != null}
        title="Apply typical settings?"
        description={
          pendingPurpose
            ? `Switching purpose to ${quizPurposeLabel(pendingPurpose)} can replace the settings that differ from a typical ${quizPurposeLabel(purpose)}.`
            : undefined
        }
        isDismissable
        primaryActionLabel="Apply typical settings"
        secondaryActionLabel="Keep current settings"
        onPrimaryAction={() => {
          if (!pendingPurpose) return;
          onUpdateArtifact((current) => applyQuizPurpose(current, pendingPurpose));
          setPendingPurpose(null);
        }}
        onSecondaryAction={() => {
          if (!pendingPurpose) return;
          onUpdateArtifact((current) => ({
            ...current,
            purpose: pendingPurpose,
            mode: applyQuizPurpose(current, pendingPurpose).mode,
          }));
          setPendingPurpose(null);
        }}
        onClose={() => setPendingPurpose(null)}
      />
    </div>
  );
}
