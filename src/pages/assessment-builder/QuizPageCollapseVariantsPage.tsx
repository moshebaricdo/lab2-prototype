import { Fragment, useState } from "react";
import { DndContext } from "@dnd-kit/core";
import { Button } from "@moshebari/cads-react";
import { CadsLabProvider } from "../../components/lab2/CadsLabProvider";
import {
  OutlineAddQuestionRow,
  OutlineAddSectionGhost,
  OutlineConnector,
  OutlineEmptySectionSlot,
} from "../../components/assessment/builder/views/OutlineAddRow";
import { QuestionRowContent } from "../../components/assessment/builder/views/OutlineQuestionCard";
import {
  OutlineSectionBlock,
  type CollapsedPageStyle,
  type PagePillAlign,
} from "../../components/assessment/builder/views/OutlineSectionBlock";
import {
  mockBiasVarianceBankQuestion,
  mockFacialRecognitionBankQuestion,
  mockFairnessBankQuestion,
  mockFeatureLabelBankQuestion,
  mockHumanInTheLoopBankQuestion,
  mockMatchBankQuestion,
  mockTradeoffBankQuestion,
  mockTrainingLoopBankQuestion,
} from "../../data/assessmentBuilder/mockBank";
import type { QuestionItem } from "../../types/assessmentBuilder";
import styles from "./QuizPageCollapseVariantsPage.module.scss";

const PAGES: Array<{ id: string; questions: QuestionItem[] }> = [
  {
    id: "p1",
    questions: [
      mockFeatureLabelBankQuestion,
      mockMatchBankQuestion,
      mockBiasVarianceBankQuestion,
    ],
  },
  {
    id: "p2",
    questions: [mockFairnessBankQuestion, mockTrainingLoopBankQuestion],
  },
  {
    id: "p3",
    questions: [
      mockFacialRecognitionBankQuestion,
      mockTradeoffBankQuestion,
      mockHumanInTheLoopBankQuestion,
    ],
  },
  { id: "p4", questions: [] },
];

type VariantId = "A" | "B" | "C" | "D" | "E" | "F" | "G";

type Round = 1 | 2 | 3;

const VARIANTS: Array<{
  id: VariantId;
  round: Round;
  style: CollapsedPageStyle;
  pillAlign?: PagePillAlign;
  letter: string;
  name: string;
  description: string;
}> = [
  {
    id: "G",
    round: 3,
    style: "card",
    letter: "G",
    name: "Header card",
    description:
      "What the builder ships. A full-width header bar in both states, with the collapse chevron next to the overflow menu. Open pages show their questions on a tinted well; closed pages keep the deck.",
  },
  {
    id: "E",
    round: 2,
    style: "deckAnchored",
    letter: "E",
    name: "Anchored deck",
    description:
      "The frame and pill never move. Closing a page fills the frame and tucks a deck under it. Hover a closed page to spread the stack.",
  },
  {
    id: "F",
    round: 2,
    style: "deckAnchored",
    pillAlign: "start",
    letter: "F",
    name: "Anchored deck, left pill",
    description:
      "Same as E with the pill on the left edge, so the collapse control lines up with the question type icons.",
  },
  {
    id: "D",
    round: 2,
    style: "deck",
    letter: "D",
    name: "Stacked deck (tightened)",
    description:
      "Round 1’s deck with a tighter stack and the hover spread. The control still jumps between the row and the pill.",
  },
  {
    id: "A",
    round: 1,
    style: "pill",
    letter: "A",
    name: "Pill only",
    description: "Round 1. A collapsed page is just its header pill.",
  },
  {
    id: "B",
    round: 1,
    style: "closed",
    letter: "B",
    name: "Closed group",
    description:
      "The frame stays, with the pill on its edge and a one-line list of the questions inside.",
  },
  {
    id: "C",
    round: 1,
    style: "summary",
    letter: "C",
    name: "Summary row",
    description:
      "A full-width row the same height as a question: page, count, then the question names.",
  },
];

const ROUNDS: Array<{ round: Round; title: string }> = [
  { round: 3, title: "Round 3 · Header card" },
  { round: 2, title: "Round 2 · Deck" },
  { round: 1, title: "Round 1" },
];

const DEFAULT_COLLAPSED = ["p1", "p3", "p4"];

function VariantOutline({
  id,
  variant,
  pillAlign,
  collapsedIds,
  onToggle,
}: {
  id: VariantId;
  variant: CollapsedPageStyle;
  pillAlign?: PagePillAlign;
  collapsedIds: Set<string>;
  onToggle: (pageId: string) => void;
}) {
  return (
    <DndContext>
      <div className={styles.outline}>
        {PAGES.map((page, index) => {
          const collapsed = collapsedIds.has(page.id);
          return (
            <Fragment key={page.id}>
              {index > 0 && <OutlineConnector size="section" />}
              <OutlineSectionBlock
                sectionId={`${id}-${page.id}`}
                displayTitle={`Page ${index + 1}`}
                sectionNumber={index + 1}
                questionCount={page.questions.length}
                questionTitles={page.questions.map((question) => question.title)}
                collapsed={collapsed}
                collapsedStyle={variant}
                pillAlign={pillAlign}
                isFirst={index === 0}
                isLast={index === PAGES.length - 1}
                isQuestionDropTarget={false}
                onToggleCollapsed={() => onToggle(page.id)}
                onMoveUp={() => {}}
                onMoveDown={() => {}}
                onAddAbove={() => {}}
                onAddBelow={() => {}}
                onDelete={() => {}}
              >
                {page.questions.length === 0 ? (
                  <OutlineEmptySectionSlot
                    droppableId={`end:${id}-${page.id}`}
                    isDropActive={false}
                    onCreateQuestion={() => {}}
                  />
                ) : (
                  <>
                    {page.questions.map((question, itemIndex) => (
                      <Fragment key={question.bankId}>
                        {itemIndex > 0 && <OutlineConnector size="item" />}
                        <div className={styles.questionCard}>
                          <QuestionRowContent
                            question={question}
                            showHandle={false}
                            actions={
                              <Button
                                variant="outlined"
                                color="secondary"
                                size="extraSmall"
                                iconOnly
                                startIconName="pencil"
                                aria-label="Edit question"
                              />
                            }
                          />
                        </div>
                      </Fragment>
                    ))}
                    <OutlineConnector size="item" />
                    <OutlineAddQuestionRow
                      droppableId={`end:${id}-${page.id}`}
                      isDropActive={false}
                      onCreateQuestion={() => {}}
                    />
                  </>
                )}
              </OutlineSectionBlock>
            </Fragment>
          );
        })}
        <OutlineConnector size="section" />
        <OutlineAddSectionGhost onClick={() => {}} />
      </div>
    </DndContext>
  );
}

/** Side-by-side collapsed-page treatments for the quiz builder outline. */
export function QuizPageCollapseVariantsPage() {
  const [collapsed, setCollapsed] = useState<Record<VariantId, Set<string>>>(
    () =>
      Object.fromEntries(
        VARIANTS.map((variant) => [variant.id, new Set(DEFAULT_COLLAPSED)]),
      ) as Record<VariantId, Set<string>>,
  );

  const setAll = (ids: string[]) =>
    setCollapsed(
      Object.fromEntries(
        VARIANTS.map((variant) => [variant.id, new Set(ids)]),
      ) as Record<VariantId, Set<string>>,
    );

  const toggle = (variant: VariantId, pageId: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev[variant]);
      if (next.has(pageId)) next.delete(pageId);
      else next.add(pageId);
      return { ...prev, [variant]: next };
    });

  return (
    <CadsLabProvider>
      <main className={styles.page}>
        <div className={styles.column}>
          <div className={styles.toolbar}>
            <Button
              variant="outlined"
              color="secondary"
              size="extraSmall"
              startIconName="arrows-to-line"
              onClick={() => setAll(PAGES.map((page) => page.id))}
            >
              Collapse all
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              size="extraSmall"
              startIconName="arrows-from-line"
              onClick={() => setAll([])}
            >
              Expand all
            </Button>
            <Button
              variant="text"
              color="secondary"
              size="extraSmall"
              onClick={() => setAll(DEFAULT_COLLAPSED)}
            >
              Reset
            </Button>
          </div>
          {ROUNDS.map((round) => (
            <Fragment key={round.round}>
              <h1 className={styles.roundTitle}>{round.title}</h1>
              {VARIANTS.filter((variant) => variant.round === round.round).map(
                (variant) => (
                  <section key={variant.id} className={styles.variant}>
                    <header className={styles.variantHeader}>
                      <span className={styles.variantLetter}>
                        Variant {variant.letter}
                      </span>
                      <h2 className={styles.variantName}>{variant.name}</h2>
                      <p className={styles.variantDescription}>
                        {variant.description}
                      </p>
                    </header>
                    <VariantOutline
                      id={variant.id}
                      variant={variant.style}
                      pillAlign={variant.pillAlign}
                      collapsedIds={collapsed[variant.id]}
                      onToggle={(pageId) => toggle(variant.id, pageId)}
                    />
                  </section>
                ),
              )}
            </Fragment>
          ))}
        </div>
      </main>
    </CadsLabProvider>
  );
}
