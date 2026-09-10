import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { Button, Checkbox, Dropdown, Radio, SegmentedButton, Tag, TextInput } from "@moshebaricdo/cads-react";
import {
  QUESTION_DIFFICULTIES,
  QUESTION_DIFFICULTY_LABELS,
  standardLabel,
} from "../../../../lib/assessmentBuilder";
import type {
  DomainTag,
  QuestionDifficulty,
  QuestionItem,
} from "../../../../types/assessmentBuilder";
import { QuestionUsagePanel } from "./QuestionUsagePanel";
import { StandardsTypeaheadField } from "./StandardsTypeahead";
import styles from "./QuestionItemEditor.module.scss";

interface QuestionItemEditorProps {
  question: QuestionItem;
  graded: boolean;
  courseOptions: Array<{ value: string; label: string }>;
  domainOptions: Array<{ value: string; label: string; code?: string }>;
  /** @deprecated Unused in P0; legacy callers may still pass unit options. */
  unitOptions?: Array<{ value: string; label: string }>;
  p0Aligned?: boolean;
  activeTab?: "question" | "answers" | "usage";
  currentQuizTitle?: string;
  onUpdateQuestion: (question: QuestionItem) => void;
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function reorderById<T extends { id: string }>(
  items: T[],
  activeId: string,
  overId: string,
): T[] {
  const from = items.findIndex((item) => item.id === activeId);
  const to = items.findIndex((item) => item.id === overId);
  if (from < 0 || to < 0 || from === to) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

type OptionReorderApi = {
  draggingId: string | null;
  overId: string | null;
  startDrag: (id: string, event: ReactPointerEvent<HTMLElement>) => void;
};

const OptionReorderContext = createContext<OptionReorderApi | null>(null);

function SortableOptionStack({
  onReorder,
  children,
}: {
  onReorder: (activeId: string, overId: string) => void;
  children: ReactNode;
}) {
  const draggingIdRef = useRef<string | null>(null);
  const overIdRef = useRef<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const startDrag = useCallback(
    (id: string, event: ReactPointerEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      draggingIdRef.current = id;
      overIdRef.current = id;
      setDraggingId(id);
      setOverId(id);

      const onMove = (moveEvent: PointerEvent) => {
        const node = document.elementFromPoint(
          moveEvent.clientX,
          moveEvent.clientY,
        );
        const card = node?.closest("[data-option-id]");
        const nextOver =
          card?.getAttribute("data-option-id") ?? draggingIdRef.current;
        if (nextOver !== overIdRef.current) {
          overIdRef.current = nextOver;
          setOverId(nextOver);
        }
      };

      const onUp = () => {
        const active = draggingIdRef.current;
        const over = overIdRef.current;
        if (active && over && active !== over) onReorder(active, over);
        draggingIdRef.current = null;
        overIdRef.current = null;
        setDraggingId(null);
        setOverId(null);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [onReorder],
  );

  return (
    <OptionReorderContext.Provider value={{ draggingId, overId, startDrag }}>
      {children}
    </OptionReorderContext.Provider>
  );
}

function SortableOptionCard({
  id,
  dragLabel,
  children,
}: {
  id: string;
  dragLabel: string;
  children: ReactNode;
}) {
  const reorder = useContext(OptionReorderContext);
  const isDragging = reorder?.draggingId === id;
  const isOver = reorder?.overId === id && !isDragging;

  return (
    <div
      data-option-id={id}
      className={[
        styles.optionCard,
        isDragging ? styles.optionCardDragging : "",
        isOver ? styles.optionCardOver : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={styles.optionCardInner}>
        <span
          className={styles.dragHandle}
          aria-label={dragLabel}
          onPointerDown={(event) => reorder?.startDrag(id, event)}
        >
          <Button
            variant="text"
            color="tertiary"
            size="small"
            iconOnly
            startIconName="grip-dots-vertical"
            tabIndex={-1}
            aria-hidden
          />
        </span>
        {children}
      </div>
    </div>
  );
}

function updateQuestion(
  question: QuestionItem,
  onUpdateQuestion: (question: QuestionItem) => void,
  patch: Partial<QuestionItem>,
) {
  onUpdateQuestion({ ...question, ...patch });
}

function asStringArray(value: string | string[]): string[] {
  return Array.isArray(value) ? value : [value];
}

export function QuestionItemEditor({
  question,
  graded,
  courseOptions,
  domainOptions,
  p0Aligned = false,
  activeTab = "question",
  currentQuizTitle = "",
  onUpdateQuestion,
}: QuestionItemEditorProps) {
  const patch = (next: Partial<QuestionItem>) =>
    updateQuestion(question, onUpdateQuestion, next);

  const difficultyOptions = QUESTION_DIFFICULTIES.map((difficulty) => ({
    value: difficulty,
    label: QUESTION_DIFFICULTY_LABELS[difficulty],
  }));

  const selectedDomainIds = question.tags.map((tag) => tag.id);

  const handleCourseChange = (courseId: string) => {
    patch({ courseId });
  };

  const handleDifficultyChange = (value: string) => {
    patch({ difficulty: value as QuestionDifficulty });
  };

  const handleDomainChange = (domainIds: string[]) => {
    const tags: DomainTag[] = domainIds
      .map((id) => domainOptions.find((option) => option.value === id))
      .filter(
        (option): option is { value: string; label: string; code?: string } =>
          option != null,
      )
      .map((option) => ({
        id: option.value,
        label: option.label,
        code: option.code,
      }));
    patch({ tags });
  };

  const stem = question.item.content;
  const updateStem = (prompt: string, description: string | undefined) => {
    onUpdateQuestion({
      ...question,
      item: {
        ...question.item,
        content: { ...stem, prompt, description },
      } as QuestionItem["item"],
    });
  };

  if (p0Aligned && activeTab === "usage") {
    return (
      <QuestionUsagePanel
        question={question}
        currentQuizTitle={currentQuizTitle}
        onUpdateQuestion={onUpdateQuestion}
      />
    );
  }

  if (p0Aligned && activeTab === "question") {
    return (
      <div className={styles.p0Question}>
        <TextInput
          label="Internal name"
          size="small"
          color="secondary"
          value={question.title}
          onChange={(event) => patch({ title: event.target.value })}
        />
        <TextInput
          label="Question title"
          size="small"
          color="secondary"
          value={stem.prompt}
          onChange={(event) => updateStem(event.target.value, stem.description)}
        />
        <TextInput
          multiline
          label="Description"
          size="small"
          color="secondary"
          value={stem.description ?? ""}
          onChange={(event) =>
            updateStem(stem.prompt, event.target.value || undefined)
          }
        />
        <StandardsTypeaheadField
          options={domainOptions}
          selectedIds={selectedDomainIds}
          onChange={handleDomainChange}
          disabled={domainOptions.length === 0}
        />
      </div>
    );
  }

  if (p0Aligned) {
    return (
      <div className={styles.p0Question}>
        <QuestionContentEditor
          question={question}
          onUpdateQuestion={onUpdateQuestion}
          hideSurveyMode
          includeStem={false}
          showSelectionMode
          showExplanation
        />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.section}>
        <div className={graded ? styles.metaRow : undefined}>
          <TextInput
            label="Bank label"
            helperText="Internal name in the question bank — not the student-facing question."
            size="small"
            color="secondary"
            value={question.title}
            onChange={(event) => patch({ title: event.target.value })}
          />
          {graded && (
            <TextInput
              label="Points"
              size="small"
              color="secondary"
              type="number"
              min={0}
              step={1}
              className={styles.numericField}
              value={String(question.points ?? 1)}
              onChange={(event) => {
                const points = Number.parseInt(event.target.value, 10);
                patch({
                  points: Number.isFinite(points) ? Math.max(0, points) : undefined,
                });
              }}
            />
          )}
        </div>
      </div>

      <QuestionContentEditor
        question={question}
        onUpdateQuestion={onUpdateQuestion}
        hideSurveyMode={p0Aligned}
      />

      <div className={styles.section}>
        <h4 className={styles.sectionHeading}>Question bank metadata</h4>
        <p className={styles.hint}>
          {p0Aligned
            ? "Standards help authors find this question in the bank. Course and unit are not tags — they come from where quizzes using this question are placed."
            : "Used when saving to the shared question bank. Course and domains help authors find and reuse this question."}
        </p>
        {p0Aligned ? (
          <div className={styles.bankMetaField}>
            <span className={styles.bankMetaLabel}>Standards</span>
            <Dropdown
              role="input"
              menuType="checklist"
              options={domainOptions}
              value={selectedDomainIds}
              onChange={(value) => handleDomainChange(asStringArray(value))}
              placeholder="Select standards"
              size="extraSmall"
              color="secondary"
              width="full"
              startIconName="clipboard-list-check"
              disabled={domainOptions.length === 0}
            />
          </div>
        ) : (
          <>
            <div className={styles.bankMetaRow}>
              <div className={styles.bankMetaField}>
                <span className={styles.bankMetaLabel}>Course</span>
                <Dropdown
                  role="input"
                  options={courseOptions}
                  value={question.courseId}
                  onChange={(value) => handleCourseChange(String(value))}
                  size="extraSmall"
                  color="secondary"
                  width="full"
                  menuWidth="trigger"
                  startIconName="book"
                />
              </div>
              <div className={styles.bankMetaField}>
                <span className={styles.bankMetaLabel}>Difficulty</span>
                <Dropdown
                  role="input"
                  options={difficultyOptions}
                  value={question.difficulty ?? "intermediate"}
                  onChange={(value) => handleDifficultyChange(String(value))}
                  size="extraSmall"
                  color="secondary"
                  width="full"
                  startIconName="signal"
                />
              </div>
            </div>
            <div className={styles.bankMetaField}>
              <span className={styles.bankMetaLabel}>Domains</span>
              <Dropdown
                role="input"
                menuType="checklist"
                options={domainOptions}
                value={selectedDomainIds}
                onChange={(value) => handleDomainChange(asStringArray(value))}
                placeholder="Select domains"
                size="extraSmall"
                color="secondary"
                width="full"
                startIconName="tag"
                disabled={domainOptions.length === 0}
              />
            </div>
          </>
        )}
        {question.tags.length > 0 && (
          <div className={styles.tagRow}>
            {question.tags.map((tag) => (
              <Tag
                key={tag.id}
                size="small"
                color={p0Aligned ? "pink" : "neutral"}
                label={p0Aligned ? standardLabel(tag) : tag.label}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface QuestionStemFieldsProps {
  prompt: string;
  description?: string;
  questionLabel?: string;
  onPromptChange: (value: string) => void;
  onDescriptionChange: (value: string | undefined) => void;
}

function QuestionStemFields({
  prompt,
  description,
  questionLabel = "Question",
  onPromptChange,
  onDescriptionChange,
}: QuestionStemFieldsProps) {
  return (
    <>
      <TextInput
        multiline
        label={questionLabel}
        helperText="Main heading shown to students."
        size="small"
        color="secondary"
        value={prompt}
        onChange={(event) => onPromptChange(event.target.value)}
      />
      <TextInput
        multiline
        label="Description"
        helperText="Optional supporting copy shown below the question title."
        size="small"
        color="secondary"
        value={description ?? ""}
        onChange={(event) =>
          onDescriptionChange(event.target.value || undefined)
        }
      />
    </>
  );
}

interface QuestionContentEditorProps {
  question: QuestionItem;
  onUpdateQuestion: (question: QuestionItem) => void;
  hideSurveyMode?: boolean;
  includeStem?: boolean;
  showSelectionMode?: boolean;
  showExplanation?: boolean;
}

function QuestionContentEditor({
  question,
  onUpdateQuestion,
  hideSurveyMode = false,
  includeStem = true,
  showSelectionMode = false,
  showExplanation = false,
}: QuestionContentEditorProps) {
  const p0AnswersLayout = showSelectionMode;
  const explanationEditor = showExplanation ? (
    <ExplanationField question={question} onUpdateQuestion={onUpdateQuestion} />
  ) : null;

  switch (question.item.kind) {
    case "multi":
      return (
        <>
          <MultiChoiceEditor
            question={question}
            onUpdateQuestion={onUpdateQuestion}
            hideSurveyMode={hideSurveyMode}
            includeStem={includeStem}
            showSelectionMode={showSelectionMode}
            p0AnswersLayout={p0AnswersLayout}
          />
          {explanationEditor}
        </>
      );
    case "freeResponse":
      return (
        <>
          <FreeResponseEditor
            question={question}
            onUpdateQuestion={onUpdateQuestion}
            includeStem={includeStem}
            p0AnswersLayout={p0AnswersLayout}
          />
          {explanationEditor}
        </>
      );
    case "match":
      return (
        <>
          <MatchEditor
            question={question}
            onUpdateQuestion={onUpdateQuestion}
            includeStem={includeStem}
            p0AnswersLayout={p0AnswersLayout}
          />
          {explanationEditor}
        </>
      );
    case "dragDrop":
      return question.item.content.mode === "categorization" ? (
        <DragDropCategorizationEditor
          question={question}
          onUpdateQuestion={onUpdateQuestion}
        />
      ) : (
        <DragDropParsonsEditor question={question} onUpdateQuestion={onUpdateQuestion} />
      );
    case "fillInBlank":
      return (
        <FillInBlankEditor question={question} onUpdateQuestion={onUpdateQuestion} />
      );
  }
}

interface KindEditorProps {
  question: QuestionItem;
  onUpdateQuestion: (question: QuestionItem) => void;
  hideSurveyMode?: boolean;
  includeStem?: boolean;
  showSelectionMode?: boolean;
  p0AnswersLayout?: boolean;
}

function ExplanationField({
  question,
  onUpdateQuestion,
}: KindEditorProps) {
  const isFree = question.item.kind === "freeResponse";
  const value =
    question.item.kind === "freeResponse"
      ? question.item.content.teacherAnswer?.exemplar ?? ""
      : question.reveal.explanation ?? "";

  return (
    <div className={styles.bankMetaField}>
      <TextInput
        multiline
        rows={4}
        label={
          isFree
            ? "Exemplar response (teachers only)"
            : "Answer explanation (optional)"
        }
        size="small"
        color="secondary"
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          if (question.item.kind === "freeResponse") {
            onUpdateQuestion({
              ...question,
              item: {
                kind: "freeResponse",
                content: {
                  ...question.item.content,
                  teacherAnswer: {
                    ...question.item.content.teacherAnswer,
                    exemplar: next,
                    rubricCriteria:
                      question.item.content.teacherAnswer?.rubricCriteria ?? [],
                  },
                },
              },
            });
            return;
          }
          onUpdateQuestion({
            ...question,
            reveal: { ...question.reveal, explanation: next },
          });
        }}
      />
    </div>
  );
}

function MultiChoiceEditor({
  question,
  onUpdateQuestion,
  hideSurveyMode = false,
  includeStem = true,
  showSelectionMode = false,
  p0AnswersLayout = false,
}: KindEditorProps) {
  if (question.item.kind !== "multi") return null;
  const content = question.item.content;
  const isMultiple = content.selectionMode === "multiple";

  const updateContent = (
    next: Partial<typeof content>,
  ) => {
    onUpdateQuestion({
      ...question,
      item: { kind: "multi", content: { ...content, ...next } },
    });
  };

  const updateAnswer = (id: string, text: string) => {
    updateContent({
      answers: content.answers.map((answer) =>
        answer.id === id ? { ...answer, text } : answer,
      ),
    });
  };

  const setCorrectSingle = (id: string) => {
    updateContent({ correctAnswerId: id });
  };

  const toggleCorrectMultiple = (id: string, checked: boolean) => {
    const current = new Set(content.correctAnswerIds ?? []);
    if (checked) current.add(id);
    else current.delete(id);
    updateContent({ correctAnswerIds: Array.from(current) });
  };

  const addAnswer = () => {
    const id = createId("opt");
    updateContent({
      answers: [...content.answers, { id, text: "New option" }],
    });
  };

  const removeAnswer = (id: string) => {
    if (content.answers.length <= 2) return;
    const answers = content.answers.filter((answer) => answer.id !== id);
    const next: Partial<typeof content> = { answers };
    if (!isMultiple && content.correctAnswerId === id) {
      next.correctAnswerId = answers[0]?.id;
    }
    if (isMultiple) {
      next.correctAnswerIds = (content.correctAnswerIds ?? []).filter(
        (answerId) => answerId !== id,
      );
    }
    updateContent(next);
  };

  return (
    <div className={p0AnswersLayout ? styles.p0Answers : styles.section}>
      {showSelectionMode ? (
        <div className={`${styles.bankMetaField} ${styles.selectionType}`}>
          <span className={styles.bankMetaLabel}>Selection type:</span>
          <SegmentedButton
            size="small"
            aria-label="Selection type"
            value={isMultiple ? "multiple" : "single"}
            onChange={(value) => {
              if (value === "multiple") {
                updateContent({
                  selectionMode: "multiple",
                  correctAnswerIds:
                    content.correctAnswerIds ??
                    (content.correctAnswerId ? [content.correctAnswerId] : []),
                  correctAnswerId: undefined,
                });
              } else {
                updateContent({
                  selectionMode: "single",
                  correctAnswerId:
                    content.correctAnswerId ??
                    content.correctAnswerIds?.[0] ??
                    content.answers[0]?.id,
                  correctAnswerIds: undefined,
                });
              }
            }}
            options={[
              { value: "single", label: "Single (radio)" },
              { value: "multiple", label: "Multiple (checkbox)" },
            ]}
          />
        </div>
      ) : null}
      {includeStem ? (
        <QuestionStemFields
          prompt={content.prompt}
          description={content.description}
          onPromptChange={(value) => updateContent({ prompt: value })}
          onDescriptionChange={(value) => updateContent({ description: value })}
        />
      ) : null}
      {p0AnswersLayout ? (
        <>
          <div className={styles.bankMetaField}>
            <span className={styles.bankMetaLabel}>Options</span>
            <div className={styles.optionStack}>
              <SortableOptionStack
                onReorder={(activeId, overId) =>
                  updateContent({
                    answers: reorderById(content.answers, activeId, overId),
                  })
                }
              >
                {content.answers.map((answer) => {
                  const isCorrect = isMultiple
                    ? (content.correctAnswerIds ?? []).includes(answer.id)
                    : content.correctAnswerId === answer.id;
                  return (
                    <SortableOptionCard
                      key={answer.id}
                      id={answer.id}
                      dragLabel={`Reorder ${answer.text || "option"}`}
                    >
                      <div className={styles.optionField}>
                        <TextInput
                          size="small"
                          color="secondary"
                          value={answer.text ?? ""}
                          onChange={(event) =>
                            updateAnswer(answer.id, event.target.value)
                          }
                        />
                      </div>
                      <Button
                        variant={isCorrect ? "contained" : "outlined"}
                        color="secondary"
                        size="small"
                        iconOnly
                        startIconName="check"
                        aria-pressed={isCorrect}
                        aria-label={
                          isCorrect
                            ? `Unmark ${answer.text ?? "option"} as correct`
                            : `Mark ${answer.text ?? "option"} as correct`
                        }
                        className={isCorrect ? styles.correctMark : undefined}
                        onClick={() => {
                          if (isMultiple) {
                            toggleCorrectMultiple(answer.id, !isCorrect);
                            return;
                          }
                          if (!isCorrect) setCorrectSingle(answer.id);
                        }}
                      />
                      <Button
                        variant="text"
                        color="error"
                        size="small"
                        iconOnly
                        startIconName="trash"
                        aria-label="Remove option"
                        disabled={content.answers.length <= 2}
                        onClick={() => removeAnswer(answer.id)}
                      />
                    </SortableOptionCard>
                  );
                })}
              </SortableOptionStack>
              <DashedAddRow label="Add option" onClick={addAnswer} />
            </div>
          </div>
        </>
      ) : (
        <>
          <h4 className={styles.sectionHeading}>
            Answer options{isMultiple ? " (select all correct)" : ""}
          </h4>
          <div className={styles.optionList}>
            {content.answers.map((answer) => (
              <div key={answer.id} className={styles.optionRow}>
                <div className={styles.optionControl}>
                  {isMultiple ? (
                    <Checkbox
                      size="small"
                      checked={(content.correctAnswerIds ?? []).includes(answer.id)}
                      onChange={(event) =>
                        toggleCorrectMultiple(answer.id, event.target.checked)
                      }
                      aria-label={`Mark ${answer.text ?? answer.id} as correct`}
                    />
                  ) : (
                    <Radio
                      size="small"
                      name={`correct-${question.bankId}`}
                      checked={content.correctAnswerId === answer.id}
                      onChange={() => setCorrectSingle(answer.id)}
                      aria-label={`Mark ${answer.text ?? answer.id} as correct`}
                    />
                  )}
                </div>
                <div className={styles.optionField}>
                  <TextInput
                    size="small"
                    color="secondary"
                    value={answer.text ?? ""}
                    onChange={(event) => updateAnswer(answer.id, event.target.value)}
                  />
                </div>
                <div className={styles.rowActions}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    size="extraSmall"
                    iconOnly
                    startIconName="circle-minus"
                    aria-label="Remove option"
                    disabled={content.answers.length <= 2}
                    onClick={() => removeAnswer(answer.id)}
                  />
                </div>
              </div>
            ))}
          </div>
          <Button
            variant="outlined"
            color="secondary"
            size="extraSmall"
            startIconName="plus"
            className={styles.addRow}
            onClick={addAnswer}
          >
            Add option
          </Button>
        </>
      )}
      {!isMultiple && !hideSurveyMode && (
        <Checkbox
          size="small"
          checked={content.surveyMode === true}
          onChange={(event) =>
            updateContent({
              surveyMode: event.target.checked,
              ...(event.target.checked ? { correctAnswerId: undefined } : {}),
            })
          }
          label="Survey mode (ungraded)"
        />
      )}
    </div>
  );
}

function FreeResponseEditor({
  question,
  onUpdateQuestion,
  includeStem = true,
  p0AnswersLayout = false,
}: KindEditorProps) {
  if (question.item.kind !== "freeResponse") return null;
  const content = question.item.content;

  const updateContent = (next: Partial<typeof content>) => {
    onUpdateQuestion({
      ...question,
      item: { kind: "freeResponse", content: { ...content, ...next } },
    });
  };

  if (p0AnswersLayout) {
    return (
      <div className={styles.p0Answers}>
        <TextInput
          label="Placeholder (optional)"
          size="small"
          color="secondary"
          value={content.placeholder}
          onChange={(event) => updateContent({ placeholder: event.target.value })}
        />
        <TextInput
          label="Minimum submission length (optional)"
          size="small"
          color="secondary"
          type="number"
          min={0}
          step={1}
          value={content.minCharacters > 0 ? String(content.minCharacters) : ""}
          onChange={(event) => {
            const minCharacters = Number.parseInt(event.target.value, 10);
            updateContent({
              minCharacters: Number.isFinite(minCharacters)
                ? Math.max(0, minCharacters)
                : 0,
            });
          }}
        />
        <Checkbox
          size="small"
          checked={content.allowFileUpload === true}
          onChange={(event) =>
            updateContent({ allowFileUpload: event.target.checked })
          }
          label="Allow file uploads and/or audio recordings as a submission"
        />
      </div>
    );
  }

  return (
    <div className={styles.section}>
      {includeStem ? (
        <QuestionStemFields
          prompt={content.prompt}
          description={content.description}
          onPromptChange={(value) => updateContent({ prompt: value })}
          onDescriptionChange={(value) => updateContent({ description: value })}
        />
      ) : null}
      <div className={styles.compactRow}>
        <TextInput
          label="Placeholder"
          size="small"
          color="secondary"
          value={content.placeholder}
          onChange={(event) => updateContent({ placeholder: event.target.value })}
        />
        <TextInput
          label="Min characters"
          size="small"
          color="secondary"
          type="number"
          min={0}
          step={1}
          className={styles.numericField}
          value={String(content.minCharacters)}
          onChange={(event) => {
            const minCharacters = Number.parseInt(event.target.value, 10);
            updateContent({
              minCharacters: Number.isFinite(minCharacters)
                ? Math.max(0, minCharacters)
                : 0,
            });
          }}
        />
      </div>
    </div>
  );
}

function MatchEditor({
  question,
  onUpdateQuestion,
  includeStem = true,
  p0AnswersLayout = false,
}: KindEditorProps) {
  if (question.item.kind !== "match") return null;
  const content = question.item.content;

  const updateContent = (next: Partial<typeof content>) => {
    onUpdateQuestion({
      ...question,
      item: { kind: "match", content: { ...content, ...next } },
    });
  };

  const updateTerm = (id: string, text: string) => {
    updateContent({
      terms: content.terms.map((term) => (term.id === id ? { ...term, text } : term)),
    });
  };

  const updatePrompt = (
    id: string,
    patch: Partial<(typeof content.prompts)[number]>,
  ) => {
    updateContent({
      prompts: content.prompts.map((prompt) =>
        prompt.id === id ? { ...prompt, ...patch } : prompt,
      ),
    });
  };

  const addTerm = () => {
    const id = createId("term");
    updateContent({
      terms: [...content.terms, { id, text: "New term" }],
    });
  };

  const removeTerm = (id: string) => {
    if (content.terms.length <= 2) return;
    const terms = content.terms.filter((term) => term.id !== id);
    updateContent({
      terms,
      prompts: content.prompts.map((prompt) =>
        prompt.correctTermId === id
          ? { ...prompt, correctTermId: terms[0]?.id ?? prompt.correctTermId }
          : prompt,
      ),
    });
  };

  const addPrompt = () => {
    const id = createId("prompt");
    updateContent({
      prompts: [
        ...content.prompts,
        {
          id,
          text: "New definition",
          correctTermId: content.terms[0]?.id ?? "",
        },
      ],
    });
  };

  const removePrompt = (id: string) => {
    if (content.prompts.length <= 2) return;
    updateContent({
      prompts: content.prompts.filter((prompt) => prompt.id !== id),
    });
  };

  const addPair = () => {
    const termId = createId("term");
    const promptId = createId("prompt");
    updateContent({
      terms: [...content.terms, { id: termId, text: "" }],
      prompts: [
        ...content.prompts,
        { id: promptId, text: "", correctTermId: termId },
      ],
    });
  };

  const removePair = (promptId: string, termId: string) => {
    if (content.prompts.length <= 2) return;
    updateContent({
      prompts: content.prompts.filter((prompt) => prompt.id !== promptId),
      terms: content.terms.filter((term) => term.id !== termId),
    });
  };

  if (p0AnswersLayout) {
    return (
      <div className={styles.p0Answers}>
        <div className={styles.bankMetaField}>
          <span className={styles.bankMetaLabel}>Options</span>
          <div className={styles.optionStack}>
            <SortableOptionStack
              onReorder={(activeId, overId) =>
                updateContent({
                  prompts: reorderById(content.prompts, activeId, overId),
                })
              }
            >
              {content.prompts.map((prompt) => {
                const term =
                  content.terms.find((item) => item.id === prompt.correctTermId) ??
                  content.terms[0];
                return (
                  <SortableOptionCard
                    key={prompt.id}
                    id={prompt.id}
                    dragLabel="Reorder pair"
                  >
                    <div className={styles.pairFields}>
                      <div className={styles.optionField}>
                        <TextInput
                          multiline
                          rows={3}
                          size="small"
                          color="secondary"
                          placeholder="Term"
                          value={term?.text ?? ""}
                          onChange={(event) => {
                            if (!term) return;
                            updateTerm(term.id, event.target.value);
                          }}
                        />
                      </div>
                      <div className={styles.optionField}>
                        <TextInput
                          multiline
                          rows={3}
                          size="small"
                          color="secondary"
                          placeholder="Definition"
                          value={prompt.text}
                          onChange={(event) =>
                            updatePrompt(prompt.id, { text: event.target.value })
                          }
                        />
                      </div>
                    </div>
                    <Button
                      variant="text"
                      color="error"
                      size="small"
                      iconOnly
                      startIconName="trash"
                      aria-label="Remove pair"
                      disabled={content.prompts.length <= 2}
                      onClick={() =>
                        term ? removePair(prompt.id, term.id) : removePrompt(prompt.id)
                      }
                    />
                  </SortableOptionCard>
                );
              })}
            </SortableOptionStack>
            <DashedAddRow label="Add pair" onClick={addPair} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      {includeStem ? (
        <QuestionStemFields
          prompt={content.prompt}
          description={content.description}
          onPromptChange={(value) => updateContent({ prompt: value })}
          onDescriptionChange={(value) => updateContent({ description: value })}
        />
      ) : null}

      <h4 className={styles.sectionHeading}>Terms</h4>
      <div className={styles.optionList}>
        {content.terms.map((term) => (
          <div key={term.id} className={styles.optionRow}>
            <div className={styles.optionField}>
              <TextInput
                size="small"
                color="secondary"
                value={term.text}
                onChange={(event) => updateTerm(term.id, event.target.value)}
              />
            </div>
            <div className={styles.rowActions}>
              <Button
                variant="outlined"
                color="secondary"
                size="extraSmall"
                iconOnly
                startIconName="circle-minus"
                aria-label="Remove term"
                disabled={content.terms.length <= 2}
                onClick={() => removeTerm(term.id)}
              />
            </div>
          </div>
        ))}
      </div>
      <Button
        variant="outlined"
        color="secondary"
        size="extraSmall"
        startIconName="plus"
        className={styles.addRow}
        onClick={addTerm}
      >
        Add term
      </Button>

      <h4 className={styles.sectionHeading}>Definitions</h4>
      <div className={styles.optionList}>
        {content.prompts.map((prompt) => (
          <div key={prompt.id} className={styles.optionRow}>
            <div className={styles.optionField}>
              <TextInput
                size="small"
                color="secondary"
                value={prompt.text}
                onChange={(event) => updatePrompt(prompt.id, { text: event.target.value })}
              />
              <div className={styles.selectField}>
                <span className={styles.selectLabel}>Matches term</span>
                <Dropdown
                  role="input"
                  size="small"
                  color="secondary"
                  width="full"
                  value={prompt.correctTermId}
                  onChange={(value) =>
                    updatePrompt(prompt.id, { correctTermId: String(value) })
                  }
                  options={content.terms.map((term) => ({
                    value: term.id,
                    label: term.text || term.id,
                  }))}
                />
              </div>
            </div>
            <div className={styles.rowActions}>
              <Button
                variant="outlined"
                color="secondary"
                size="extraSmall"
                iconOnly
                startIconName="circle-minus"
                aria-label="Remove definition"
                disabled={content.prompts.length <= 2}
                onClick={() => removePrompt(prompt.id)}
              />
            </div>
          </div>
        ))}
      </div>
      <Button
        variant="outlined"
        color="secondary"
        size="extraSmall"
        startIconName="plus"
        className={styles.addRow}
        onClick={addPrompt}
      >
        Add definition
      </Button>
    </div>
  );
}

function DragDropParsonsEditor({ question, onUpdateQuestion }: KindEditorProps) {
  if (question.item.kind !== "dragDrop") return null;
  const content = question.item.content;

  const updateContent = (next: Partial<typeof content>) => {
    onUpdateQuestion({
      ...question,
      item: { kind: "dragDrop", content: { ...content, ...next } },
    });
  };

  const blocks = content.blocks ?? [];

  const updateBlock = (id: string, text: string) => {
    const nextBlocks = blocks.map((block) =>
      block.id === id ? { ...block, text } : block,
    );
    updateContent({
      blocks: nextBlocks,
      correctOrder: nextBlocks.map((block) => block.id),
    });
  };

  const addBlock = () => {
    const id = createId("block");
    const nextBlocks = [...blocks, { id, text: "New line" }];
    updateContent({
      blocks: nextBlocks,
      correctOrder: nextBlocks.map((block) => block.id),
    });
  };

  const removeBlock = (id: string) => {
    if (blocks.length <= 2) return;
    const nextBlocks = blocks.filter((block) => block.id !== id);
    updateContent({
      blocks: nextBlocks,
      correctOrder: nextBlocks.map((block) => block.id),
    });
  };

  return (
    <div className={styles.section}>
      <QuestionStemFields
        prompt={content.prompt}
        description={content.description}
        onPromptChange={(value) => updateContent({ prompt: value })}
        onDescriptionChange={(value) => updateContent({ description: value })}
      />
      <h4 className={styles.sectionHeading}>Lines (correct order top to bottom)</h4>
      <div className={styles.optionList}>
        {blocks.map((block, index) => (
          <div key={block.id} className={styles.optionRow}>
            <div className={styles.optionControl}>
              <span className={styles.hint}>{index + 1}</span>
            </div>
            <div className={styles.optionField}>
              <TextInput
                size="small"
                color="secondary"
                value={block.text}
                onChange={(event) => updateBlock(block.id, event.target.value)}
              />
            </div>
            <div className={styles.rowActions}>
              <Button
                variant="outlined"
                color="secondary"
                size="extraSmall"
                iconOnly
                startIconName="circle-minus"
                aria-label="Remove line"
                disabled={blocks.length <= 2}
                onClick={() => removeBlock(block.id)}
              />
            </div>
          </div>
        ))}
      </div>
      <Button
        variant="outlined"
        color="secondary"
        size="extraSmall"
        startIconName="plus"
        className={styles.addRow}
        onClick={addBlock}
      >
        Add line
      </Button>
    </div>
  );
}

function DragDropCategorizationEditor({ question, onUpdateQuestion }: KindEditorProps) {
  if (question.item.kind !== "dragDrop") return null;
  const content = question.item.content;
  const buckets = content.buckets ?? [];
  const items = content.items ?? [];

  const updateContent = (next: Partial<typeof content>) => {
    onUpdateQuestion({
      ...question,
      item: { kind: "dragDrop", content: { ...content, ...next } },
    });
  };

  const updateBucket = (id: string, label: string) => {
    updateContent({
      buckets: buckets.map((bucket) =>
        bucket.id === id ? { ...bucket, label } : bucket,
      ),
    });
  };

  const addBucket = () => {
    const id = createId("bucket");
    updateContent({ buckets: [...buckets, { id, label: "New category" }] });
  };

  const removeBucket = (id: string) => {
    if (buckets.length <= 2) return;
    const nextBuckets = buckets.filter((bucket) => bucket.id !== id);
    updateContent({
      buckets: nextBuckets,
      items: items.map((item) => ({
        ...item,
        correctBucketIds: (item.correctBucketIds ?? []).filter(
          (bucketId) => bucketId !== id,
        ),
      })),
    });
  };

  const updateItem = (
    id: string,
    patch: Partial<(typeof items)[number]>,
  ) => {
    updateContent({
      items: items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });
  };

  const addItem = () => {
    const id = createId("item");
    updateContent({
      items: [
        ...items,
        {
          id,
          text: "New item",
          correctBucketIds: buckets[0]?.id ? [buckets[0].id] : [],
        },
      ],
    });
  };

  const removeItem = (id: string) => {
    if (items.length <= 2) return;
    updateContent({ items: items.filter((item) => item.id !== id) });
  };

  return (
    <div className={styles.section}>
      <QuestionStemFields
        prompt={content.prompt}
        description={content.description}
        onPromptChange={(value) => updateContent({ prompt: value })}
        onDescriptionChange={(value) => updateContent({ description: value })}
      />

      <h4 className={styles.sectionHeading}>Categories</h4>
      <div className={styles.optionList}>
        {buckets.map((bucket) => (
          <div key={bucket.id} className={styles.optionRow}>
            <div className={styles.optionField}>
              <TextInput
                size="small"
                color="secondary"
                value={bucket.label}
                onChange={(event) => updateBucket(bucket.id, event.target.value)}
              />
            </div>
            <div className={styles.rowActions}>
              <Button
                variant="outlined"
                color="secondary"
                size="extraSmall"
                iconOnly
                startIconName="circle-minus"
                aria-label="Remove category"
                disabled={buckets.length <= 2}
                onClick={() => removeBucket(bucket.id)}
              />
            </div>
          </div>
        ))}
      </div>
      <Button
        variant="outlined"
        color="secondary"
        size="extraSmall"
        startIconName="plus"
        className={styles.addRow}
        onClick={addBucket}
      >
        Add category
      </Button>

      <h4 className={styles.sectionHeading}>Items</h4>
      <div className={styles.optionList}>
        {items.map((item) => (
          <div key={item.id} className={styles.optionRow}>
            <div className={styles.optionField}>
              <TextInput
                size="small"
                color="secondary"
                value={item.text}
                onChange={(event) => updateItem(item.id, { text: event.target.value })}
              />
              <div className={styles.selectField}>
                <span className={styles.selectLabel}>Correct category</span>
                <Dropdown
                  role="input"
                  size="small"
                  color="secondary"
                  width="full"
                  value={item.correctBucketIds?.[0] ?? ""}
                  onChange={(value) =>
                    updateItem(item.id, { correctBucketIds: [String(value)] })
                  }
                  options={buckets.map((bucket) => ({
                    value: bucket.id,
                    label: bucket.label || bucket.id,
                  }))}
                />
              </div>
            </div>
            <div className={styles.rowActions}>
              <Button
                variant="outlined"
                color="secondary"
                size="extraSmall"
                iconOnly
                startIconName="circle-minus"
                aria-label="Remove item"
                disabled={items.length <= 2}
                onClick={() => removeItem(item.id)}
              />
            </div>
          </div>
        ))}
      </div>
      <Button
        variant="outlined"
        color="secondary"
        size="extraSmall"
        startIconName="plus"
        className={styles.addRow}
        onClick={addItem}
      >
        Add item
      </Button>
    </div>
  );
}

function FillInBlankEditor({ question, onUpdateQuestion }: KindEditorProps) {
  if (question.item.kind !== "fillInBlank") return null;
  const content = question.item.content;

  const updateContent = (next: Partial<typeof content>) => {
    onUpdateQuestion({
      ...question,
      item: { kind: "fillInBlank", content: { ...content, ...next } },
    });
  };

  const updateBlank = (
    id: string,
    patch: Partial<(typeof content.blanks)[number]>,
  ) => {
    updateContent({
      blanks: content.blanks.map((blank) =>
        blank.id === id ? { ...blank, ...patch } : blank,
      ),
    });
  };

  const addBlank = () => {
    const id = createId("blank");
    updateContent({
      blanks: [
        ...content.blanks,
        { id, placeholder: "answer", acceptedAnswers: ["answer"] },
      ],
      segments: [
        ...content.segments,
        { type: "text", text: " " },
        { type: "blank", blankId: id },
      ],
    });
  };

  const removeBlank = (id: string) => {
    if (content.blanks.length <= 1) return;
    updateContent({
      blanks: content.blanks.filter((blank) => blank.id !== id),
      segments: content.segments.filter(
        (segment) => segment.type !== "blank" || segment.blankId !== id,
      ),
    });
  };

  return (
    <div className={styles.section}>
      <QuestionStemFields
        prompt={content.prompt}
        description={content.description}
        onPromptChange={(value) => updateContent({ prompt: value })}
        onDescriptionChange={(value) => updateContent({ description: value })}
      />
      <p className={styles.hint}>
        Edit each blank&apos;s accepted answers (comma-separated). New blanks append to
        the sentence.
      </p>
      <h4 className={styles.sectionHeading}>Blanks</h4>
      <div className={styles.optionList}>
        {content.blanks.map((blank, index) => (
          <div key={blank.id} className={styles.optionRow}>
            <div className={styles.optionField}>
              <TextInput
                label={`Blank ${index + 1} placeholder`}
                size="small"
                color="secondary"
                value={blank.placeholder}
                onChange={(event) =>
                  updateBlank(blank.id, { placeholder: event.target.value })
                }
              />
              <TextInput
                label="Accepted answers"
                size="small"
                color="secondary"
                value={blank.acceptedAnswers.join(", ")}
                onChange={(event) =>
                  updateBlank(blank.id, {
                    acceptedAnswers: event.target.value
                      .split(",")
                      .map((value) => value.trim())
                      .filter(Boolean),
                  })
                }
              />
            </div>
            <div className={styles.rowActions}>
              <Button
                variant="outlined"
                color="secondary"
                size="extraSmall"
                iconOnly
                startIconName="circle-minus"
                aria-label="Remove blank"
                disabled={content.blanks.length <= 1}
                onClick={() => removeBlank(blank.id)}
              />
            </div>
          </div>
        ))}
      </div>
      <Button
        variant="outlined"
        color="secondary"
        size="extraSmall"
        startIconName="plus"
        className={styles.addRow}
        onClick={addBlank}
      >
        Add blank
      </Button>
    </div>
  );
}

function DashedAddRow({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <div className={styles.addOptionRow}>
      <Button
        variant="text"
        color="secondary"
        size="extraSmall"
        startIconName="plus"
        onClick={onClick}
      >
        {label}
      </Button>
    </div>
  );
}
