import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button, Dropdown, Modal, Tabs, Tag } from "@moshebari/cads-react";
import { FaIcon } from "@moshebari/cads-react/icons";
import type {
  AssessmentArtifact,
  AssessmentSection,
  MatchQuestionContent,
  MultiChoiceQuestionContent,
  QuestionItem,
} from "../../../../types/assessmentBuilder";
import { standardLabel } from "../../../../lib/assessmentBuilder";
import {
  BANK_ADD_NEW_SECTION,
  bankSectionMenuOptions,
  type BankAddSectionId,
} from "./bankAddMenu";
import { questionKindMeta } from "./questionKindMeta";
import { QuestionUsagePanel } from "./QuestionUsagePanel";
import styles from "./QuestionBankPreviewModal.module.scss";

interface QuestionBankPreviewModalProps {
  question: QuestionItem | null;
  artifact: AssessmentArtifact;
  inAssessment: boolean;
  sections: AssessmentSection[];
  onAdd: (sectionId?: BankAddSectionId) => void;
  onClose: () => void;
}

type PreviewTab = "preview" | "details" | "usage";

/** 0 → A, 25 → Z, 26 → AA */
function optionReferenceLetter(index: number): string {
  let n = index;
  let result = "";
  while (n >= 0) {
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
}

function studentStem(question: QuestionItem): {
  heading: string;
  body?: string;
} {
  const prompt = question.item.content.prompt.trim();
  const description = question.item.content.description?.trim();
  return {
    heading: prompt,
    body: description && description.length > 0 ? description : undefined,
  };
}

function correctMultiIds(content: MultiChoiceQuestionContent): Set<string> {
  if (content.selectionMode === "multiple") {
    return new Set(content.correctAnswerIds ?? []);
  }
  return new Set(content.correctAnswerId ? [content.correctAnswerId] : []);
}

function matchPairs(content: MatchQuestionContent) {
  return content.terms.map((term) => {
    const prompt = content.prompts.find(
      (entry) => entry.correctTermId === term.id,
    );
    return { term: term.text, definition: prompt?.text ?? "" };
  });
}

export function QuestionBankPreviewModal({
  question,
  artifact,
  inAssessment,
  sections,
  onAdd,
  onClose,
}: QuestionBankPreviewModalProps) {
  const [tab, setTab] = useState<PreviewTab>("preview");

  useEffect(() => {
    setTab("preview");
  }, [question?.bankId]);

  const meta = question ? questionKindMeta(question) : null;
  const showSectionMenu = sections.length > 1 && !inAssessment;

  return (
    <Modal
      open={question != null}
      title={question?.title ?? "Question"}
      maxWidth={800}
      className={styles.previewModal}
      hasSecondaryAction={false}
      primaryActionLabel="Back to all results"
      onPrimaryAction={onClose}
      onClose={onClose}
      isDismissable
    >
      {question ? (
        <div className={styles.body}>
          <div className={styles.tabBar}>
            <Tabs
              type="primary"
              size="small"
              aria-label="Question preview"
              value={tab}
              onChange={(value) => setTab(value as PreviewTab)}
              items={[
                { value: "preview", label: "Preview" },
                { value: "details", label: "Details" },
                { value: "usage", label: "Usage" },
              ]}
            />
          </div>

          <div className={styles.tabPanel}>
            <div
              className={styles.tabPane}
              data-active={tab === "preview" ? "" : undefined}
              inert={tab !== "preview"}
              aria-hidden={tab !== "preview"}
            >
              <BankQuestionPreview question={question} />
            </div>
            <div
              className={styles.tabPane}
              data-active={tab === "details" ? "" : undefined}
              inert={tab !== "details"}
              aria-hidden={tab !== "details"}
            >
              <div className={styles.details}>
                <div className={styles.explanationBlock}>
                  <span className={styles.detailLabel}>
                    {question.item.kind === "freeResponse"
                      ? "Exemplar"
                      : "Answer explanation"}
                  </span>
                  <p className={styles.detailBody}>
                    {question.item.kind === "freeResponse"
                      ? question.item.content.teacherAnswer?.exemplar ??
                        "No exemplar yet."
                      : question.reveal.explanation?.trim() ||
                        "No explanation yet."}
                  </p>
                </div>
                <div className={styles.metaRow}>
                  {meta ? (
                    <div className={styles.metaBlock}>
                      <span className={styles.detailLabel}>Question type</span>
                      <Tag
                        size="medium"
                        color="info"
                        startIconName={meta.iconName}
                        label={meta.label}
                      />
                    </div>
                  ) : null}
                  <div className={styles.standardsBlock}>
                    <span className={styles.detailLabel}>Standards</span>
                    {question.tags.length > 0 ? (
                      <div className={styles.tagRow}>
                        {question.tags.map((tag) => (
                          <Tag
                            key={tag.id}
                            size="medium"
                            color="pink"
                            label={standardLabel(tag)}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className={styles.detailBody}>No standards tagged.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div
              className={styles.tabPane}
              data-active={tab === "usage" ? "" : undefined}
              inert={tab !== "usage"}
              aria-hidden={tab !== "usage"}
            >
              <QuestionUsagePanel
                question={question}
                currentQuizTitle={artifact.title}
                showBankToggle={false}
              />
            </div>
          </div>

          <div className={styles.footer}>
            {inAssessment ? (
              <Button
                variant="outlined"
                color="secondary"
                size="medium"
                startIconName="plus"
                disabled
              >
                Add to quiz
              </Button>
            ) : showSectionMenu ? (
              <Dropdown
                role="action"
                size="extraSmall"
                menuPlacement="topRight"
                trigger={
                  <Button
                    variant="outlined"
                    color="secondary"
                    size="medium"
                    startIconName="plus"
                  >
                    Add to quiz
                  </Button>
                }
                options={bankSectionMenuOptions(sections)}
                onAction={(action) => {
                  if (action === BANK_ADD_NEW_SECTION) {
                    onAdd(BANK_ADD_NEW_SECTION);
                    return;
                  }
                  onAdd(action);
                }}
              />
            ) : (
              <Button
                variant="outlined"
                color="secondary"
                size="medium"
                startIconName="plus"
                onClick={() => onAdd()}
              >
                Add to quiz
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={onClose}
            >
              Back to all results
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

function BankQuestionPreview({ question }: { question: QuestionItem }) {
  const { heading, body } = studentStem(question);

  return (
    <div className={styles.preview} aria-hidden>
      <div className={styles.stem}>
        <p className={styles.stemHeading}>{heading}</p>
        {body ? (
          <div className={styles.stemBody}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
          </div>
        ) : null}
      </div>
      {question.item.kind === "multi" ? (
        <MultiChoicePreview content={question.item.content} />
      ) : null}
      {question.item.kind === "match" ? (
        <MatchingPreview content={question.item.content} />
      ) : null}
    </div>
  );
}

function MultiChoicePreview({ content }: { content: MultiChoiceQuestionContent }) {
  const correct = correctMultiIds(content);
  const multi = content.selectionMode === "multiple";

  return (
    <div className={styles.options}>
      {content.answers.map((answer, index) => {
        const isCorrect = correct.has(answer.id);
        return (
          <div
            key={answer.id}
            className={[
              styles.option,
              isCorrect ? styles.optionCorrect : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className={styles.optionMain}>
              <span
                className={[
                  styles.choiceMark,
                  isCorrect ? styles.choiceMarkCorrect : "",
                  multi ? styles.choiceCheck : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-hidden
              >
                {isCorrect && !multi ? <span className={styles.radioDot} /> : null}
                {isCorrect && multi ? (
                  <FaIcon name="check" fontSize="0.625rem" />
                ) : null}
              </span>
              <span className={styles.optionLetter}>
                {optionReferenceLetter(index)}.
              </span>
              <span className={styles.optionText}>{answer.text ?? ""}</span>
            </div>
            {isCorrect ? (
              <span className={styles.optionCheck} aria-hidden>
                <FaIcon name="check" fontSize="1rem" />
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function MatchingPreview({ content }: { content: MatchQuestionContent }) {
  return (
    <div className={styles.matchList}>
      {matchPairs(content).map((pair) => (
        <div key={pair.term} className={styles.matchRow}>
          <div className={styles.matchSide}>
            <div className={styles.matchChip}>
              <span className={styles.matchCheck} aria-hidden>
                <FaIcon name="check" fontSize="1rem" />
              </span>
              <span className={styles.matchTerm}>{pair.term}</span>
            </div>
            <span className={styles.knob} aria-hidden />
          </div>
          <span className={styles.matchLine} aria-hidden />
          <div className={styles.matchSide}>
            <span className={styles.knob} aria-hidden />
            <div className={styles.matchChip}>
              <span className={styles.matchDefinition}>{pair.definition}</span>
              <span className={styles.matchCheck} aria-hidden>
                <FaIcon name="check" fontSize="1rem" />
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
