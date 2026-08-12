import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Button, TextInput } from "@moshebaricdo/cads-react";
import { FileChip } from "../../../../ui/FileChip";
import {
  getFileChipIconProps,
  fileExtensionLabelFromName,
} from "../../../../ui/fileChipMeta";
import { FaIcon } from "../../../../ui/icons/FaIcon";
import type {
  ChatAttachment,
  NewProjectPlanAnswers,
  NewProjectPlanQuestionnaireData,
} from "../../../../../types/chat";
import {
  buildUniqueUploadPath,
  buildUnreadableUploadAttachment,
  buildUploadedAttachment,
} from "./attachmentUtils";
import {
  EMPTY_NEW_PROJECT_PLAN_ANSWERS,
  NEW_PROJECT_PLAN_QUESTION_FIELDS,
  normalizeNewProjectPlanAnswers,
} from "./newProjectPlanQuestionnaire";
import styles from "./NewProjectPlanQuestionnaireCard.module.scss";

interface NewProjectPlanQuestionnaireCardProps {
  questionnaire: NewProjectPlanQuestionnaireData;
  disabled?: boolean;
  onSubmit: (
    answers: NewProjectPlanAnswers,
    moodboardAttachments: ChatAttachment[],
  ) => void;
}

export function NewProjectPlanQuestionnaireCard({
  questionnaire,
  disabled = false,
  onSubmit,
}: NewProjectPlanQuestionnaireCardProps) {
  const fieldIdPrefix = useId();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const firstChoiceRef = useRef<HTMLButtonElement | null>(null);
  const moodboardInputRef = useRef<HTMLInputElement | null>(null);
  const [answers, setAnswers] = useState<NewProjectPlanAnswers>(
    questionnaire.answers ?? EMPTY_NEW_PROJECT_PLAN_ANSWERS,
  );
  const [moodboardAttachments, setMoodboardAttachments] = useState<ChatAttachment[]>(
    questionnaire.moodboardAttachments ?? [],
  );
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const normalizedAnswers = normalizeNewProjectPlanAnswers(answers);
  const isAnswered = questionnaire.status === "answered";
  const activeQuestion = NEW_PROJECT_PLAN_QUESTION_FIELDS[activeQuestionIndex];
  const isFirstQuestion = activeQuestionIndex === 0;
  const isLastQuestion =
    activeQuestionIndex === NEW_PROJECT_PLAN_QUESTION_FIELDS.length - 1;
  const currentAnswer = activeQuestion ? answers[activeQuestion.id] : "";
  const selectedChoice = activeQuestion?.choices?.find(
    (choice) => choice.value === currentAnswer,
  );
  const customChoiceValue =
    activeQuestion?.choices && currentAnswer && !selectedChoice
      ? currentAnswer
      : "";
  const hasMoodboard = moodboardAttachments.length > 0;
  const isFieldAnswered = (field: typeof NEW_PROJECT_PLAN_QUESTION_FIELDS[number]) =>
    Boolean(answers[field.id].trim()) || (field.id === "visualStyle" && hasMoodboard);
  const currentQuestionAnswered =
    !activeQuestion?.required || isFieldAnswered(activeQuestion);
  const requiredQuestionsAnswered = NEW_PROJECT_PLAN_QUESTION_FIELDS.every(
    (field) => !field.required || isFieldAnswered(field),
  );
  const canSubmit = !disabled && !isAnswered && requiredQuestionsAnswered;
  const canContinue = !disabled && !isAnswered && currentQuestionAnswered;

  useEffect(() => {
    setAnswers(questionnaire.answers ?? EMPTY_NEW_PROJECT_PLAN_ANSWERS);
    setMoodboardAttachments(questionnaire.moodboardAttachments ?? []);
    setActiveQuestionIndex(0);
  }, [questionnaire.answers, questionnaire.moodboardAttachments]);

  useEffect(() => {
    if (isAnswered || disabled) return;
    if (activeQuestion?.choices) {
      firstChoiceRef.current?.focus();
    } else {
      textareaRef.current?.focus();
    }
  }, [activeQuestion, activeQuestionIndex, disabled, isAnswered]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeQuestion || !canContinue) return;
    if (!isLastQuestion) {
      setActiveQuestionIndex((current) => current + 1);
      return;
    }
    if (canSubmit) {
      onSubmit(normalizedAnswers, moodboardAttachments);
    }
  };

  const handleMoodboardUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    if (!files.length) return;

    const existingPaths = new Set(moodboardAttachments.map((attachment) => attachment.path));
    const nextAttachments: ChatAttachment[] = [];

    for (const file of files) {
      const path = buildUniqueUploadPath(file.name, existingPaths);
      existingPaths.add(path);
      try {
        nextAttachments.push(await buildUploadedAttachment(file, path));
      } catch {
        nextAttachments.push(buildUnreadableUploadAttachment(file, path));
      }
    }

    setMoodboardAttachments((current) => [...current, ...nextAttachments]);
  };

  const handleRemoveMoodboardAttachment = (attachmentPath: string) => {
    setMoodboardAttachments((current) =>
      current.filter((attachment) => attachment.path !== attachmentPath),
    );
  };

  return (
    <div className={`${styles.card} ${isAnswered ? styles.cardAnswered : ""}`}>
      <div className={styles.header}>Create a plan</div>

      {isAnswered ? (
        <dl className={styles.summaryList}>
          {NEW_PROJECT_PLAN_QUESTION_FIELDS.map((field) => {
            const value =
              normalizedAnswers[field.id] ||
              (field.id === "visualStyle" && hasMoodboard
                ? "See uploaded moodboard"
                : "");
            if (!value && !field.required) return null;
            return (
              <div key={field.id} className={styles.summaryRow}>
                <dt>{field.label}</dt>
                <dd>{value || "Not specified"}</dd>
              </div>
            );
          })}
        </dl>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit}>
          {activeQuestion ? (
            <>
              <div className={styles.field}>
                <label className={styles.label} htmlFor={`${fieldIdPrefix}-${activeQuestion.id}`}>
                  <span>{activeQuestion.label}</span>
                  {!activeQuestion.required ? (
                    <span className={styles.optionalLabel}>Optional</span>
                  ) : null}
                </label>
                {activeQuestion.choices ? (
                  <>
                    <div className={styles.choiceGrid}>
                      {activeQuestion.choices.map((choice, index) => {
                        const isSelected = choice.value === currentAnswer;
                        return (
                          <button
                            key={choice.value}
                            ref={index === 0 ? firstChoiceRef : undefined}
                            type="button"
                            className={`${styles.choiceButton} ${
                              isSelected ? styles.choiceButtonSelected : ""
                            }`}
                            aria-pressed={isSelected}
                            disabled={disabled}
                            onClick={() => {
                              setAnswers((current) => ({
                                ...current,
                                [activeQuestion.id]: choice.value,
                              }));
                            }}
                          >
                            <FaIcon
                              name={choice.iconName}
                              size="xs"
                              className={styles.choiceIcon}
                            />
                            <span>{choice.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <TextInput
                      ref={(node) => {
                        textareaRef.current = node?.querySelector("textarea") ?? null;
                      }}
                      key={activeQuestion.id}
                      id={`${fieldIdPrefix}-${activeQuestion.id}`}
                      value={customChoiceValue}
                      placeholder={activeQuestion.placeholder}
                      rows={2}
                      disabled={disabled}
                      size="small"
                      color="secondary"
                      multiline
                      onFocus={() => {
                        if (selectedChoice) {
                          setAnswers((current) => ({
                            ...current,
                            [activeQuestion.id]: "",
                          }));
                        }
                      }}
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        setAnswers((current) => ({
                          ...current,
                          [activeQuestion.id]: value,
                        }));
                      }}
                    />
                    <div className={styles.moodboardUpload}>
                      <input
                        ref={moodboardInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className={styles.moodboardInput}
                        onChange={handleMoodboardUpload}
                        disabled={disabled}
                        aria-label="Upload moodboard images"
                      />
                      <div className={styles.moodboardPromptRow}>
                        <span className={styles.moodboardPrompt}>
                          Have a moodboard or style reference?
                        </span>
                        <Button
                          variant="outlined"
                          color="secondary"
                          size="extraSmall"
                          iconOnly
                          startIconName="upload"
                          onClick={() => moodboardInputRef.current?.click()}
                          disabled={disabled}
                          aria-label="Upload moodboard or style reference"
                        />
                      </div>
                      {moodboardAttachments.length > 0 ? (
                        <div className={styles.moodboardList}>
                          {moodboardAttachments.map((attachment) => (
                            <FileChip
                              key={attachment.path}
                              fileName={attachment.fileName}
                              nameTitle={attachment.path}
                              extensionLabel={fileExtensionLabelFromName(attachment.fileName)}
                              iconName={getFileChipIconProps(attachment.fileName).iconName}
                              iconFamily={getFileChipIconProps(attachment.fileName).iconFamily}
                              imageSrc={attachment.imageSrc}
                              mode="remove"
                              onRemove={() => handleRemoveMoodboardAttachment(attachment.path)}
                              disabled={disabled}
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <TextInput
                    ref={(node) => {
                      textareaRef.current = node?.querySelector("textarea") ?? null;
                    }}
                    key={activeQuestion.id}
                    id={`${fieldIdPrefix}-${activeQuestion.id}`}
                    value={answers[activeQuestion.id]}
                    placeholder={activeQuestion.placeholder}
                    rows={3}
                    disabled={disabled}
                    size="small"
                    color="secondary"
                    multiline
                    onChange={(event) => {
                      const value = event.currentTarget.value;
                      setAnswers((current) => ({
                        ...current,
                        [activeQuestion.id]: value,
                      }));
                    }}
                  />
                )}
              </div>
            </>
          ) : null}
          <div className={styles.footer}>
            <span className={styles.counter}>
              {activeQuestionIndex + 1} of {NEW_PROJECT_PLAN_QUESTION_FIELDS.length}
            </span>
            <div className={styles.actions}>
              <Button
                variant="outlined"
                color="secondary"
                size="extraSmall"
                iconOnly
                startIconName="arrow-left"
                disabled={disabled || isFirstQuestion}
                onClick={() => setActiveQuestionIndex((current) => Math.max(0, current - 1))}
                aria-label="Previous question"
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="extraSmall"
                iconOnly
                startIconName="arrow-right"
                disabled={isLastQuestion ? !canSubmit : !canContinue}
                aria-label={isLastQuestion ? "Create plan" : "Next question"}
              />
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
