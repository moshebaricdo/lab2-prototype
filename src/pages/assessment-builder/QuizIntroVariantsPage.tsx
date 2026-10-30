import { type CSSProperties, type ReactNode } from "react";
import { DndContext } from "@dnd-kit/core";
import { Button } from "@moshebari/cads-react";
import { FaIcon } from "@moshebari/cads-react/icons";
import { DialRoot, useDialKit } from "dialkit";
import "dialkit/styles.css";
import { CadsLabProvider } from "../../components/lab2/CadsLabProvider";
import {
  OutlineAddQuestionRow,
  OutlineAddSectionGhost,
} from "../../components/assessment/builder/views/OutlineAddRow";
import { QuestionRowContent } from "../../components/assessment/builder/views/OutlineQuestionCard";
import { OutlineSectionBlock } from "../../components/assessment/builder/views/OutlineSectionBlock";
import {
  mockFairnessBankQuestion,
  mockFeatureLabelBankQuestion,
  mockMatchBankQuestion,
  mockTrainingLoopBankQuestion,
} from "../../data/assessmentBuilder/mockBank";
import type { QuestionItem } from "../../types/assessmentBuilder";
import styles from "./QuizIntroVariantsPage.module.scss";

const PEEK =
  "This assessment covers bias, accountability, training data, and applied AI systems.";

const FLAT_QUESTIONS: QuestionItem[] = [
  mockFeatureLabelBankQuestion,
  mockMatchBankQuestion,
];

const PAGED: Array<{ id: string; questions: QuestionItem[] }> = [
  { id: "p1", questions: [mockFairnessBankQuestion, mockTrainingLoopBankQuestion] },
  { id: "p2", questions: [mockFeatureLabelBankQuestion] },
];

type Treatment = "row" | "page" | "banner" | "well" | "compact";
type RadiusToken = "sm" | "md" | "lg" | "xl";
type FillToken = "primary" | "secondary" | "none";
type TickAlign = "center" | "icon" | "none";

interface IntroLook {
  treatment: Treatment;
  radius: RadiusToken;
  fill: FillToken;
  bordered: boolean;
  padX: number;
  minH: number;
  fromIntro: TickAlign;
}

const RADIUS: Record<RadiusToken, string> = {
  sm: "var(--shape-sm)",
  md: "var(--shape-md)",
  lg: "var(--shape-lg)",
  xl: "var(--shape-xl)",
};

const FILL: Record<FillToken, string> = {
  primary: "var(--background-neutral-primary)",
  secondary: "var(--background-neutral-secondary)",
  none: "transparent",
};

const RECIPES: Array<{
  id: string;
  letter: string;
  name: string;
  description: string;
  look: IntroLook;
}> = [
  {
    id: "A",
    letter: "A",
    name: "Question row",
    description:
      "What ships. Intro is a sibling of questions, so it wants question radius and icon ticks next to questions, and page radius next to pages. That is the state tracking.",
    look: {
      treatment: "row",
      radius: "sm",
      fill: "primary",
      bordered: true,
      padX: 10,
      minH: 46,
      fromIntro: "center",
    },
  },
  {
    id: "A2",
    letter: "A2",
    name: "Question row, icon tick",
    description:
      "Same row, but the line from intro uses the question-icon column. The flat outline lines up; the paged outline does not, because the next block is a page card.",
    look: {
      treatment: "row",
      radius: "sm",
      fill: "primary",
      bordered: true,
      padX: 10,
      minH: 46,
      fromIntro: "icon",
    },
  },
  {
    id: "B",
    letter: "B",
    name: "Always a page-sized card",
    description:
      "Intro keeps page chrome in both layouts. Centered ticks, because it is not a question. Nested question rows stay sm; root questions (no pages) use the same lg radius as intro.",
    look: {
      treatment: "page",
      radius: "lg",
      fill: "primary",
      bordered: true,
      padX: 8,
      minH: 46,
      fromIntro: "center",
    },
  },
  {
    id: "C",
    letter: "C",
    name: "Banner",
    description:
      "A quiz-level note on a secondary fill. It never competes with question or page cards, so neither layout has to match it.",
    look: {
      treatment: "banner",
      radius: "xl",
      fill: "secondary",
      bordered: true,
      padX: 12,
      minH: 46,
      fromIntro: "center",
    },
  },
  {
    id: "D",
    letter: "D",
    name: "Well",
    description:
      "Softer inset, as if the intro belongs to the quiz canvas rather than the outline list.",
    look: {
      treatment: "well",
      radius: "xl",
      fill: "secondary",
      bordered: false,
      padX: 12,
      minH: 46,
      fromIntro: "center",
    },
  },
  {
    id: "E",
    letter: "E",
    name: "Compact meta",
    description:
      "Not a card. A labeled strip so it cannot be mistaken for a question or a page.",
    look: {
      treatment: "compact",
      radius: "sm",
      fill: "none",
      bordered: false,
      padX: 0,
      minH: 32,
      fromIntro: "center",
    },
  },
];

function lookVars(
  look: IntroLook,
  extras?: { itemHeight: number; iconInset: number; sectionHeight: number },
): CSSProperties {
  return {
    "--intro-radius": RADIUS[look.radius],
    "--intro-fill": FILL[look.fill],
    "--intro-border": look.bordered
      ? "var(--border-neutral-primary)"
      : "transparent",
    "--intro-pad-x": `${look.padX}px`,
    "--intro-min-h": `${look.minH}px`,
    "--tick-height": `${extras?.sectionHeight ?? 16}px`,
    "--tick-item-height": `${extras?.itemHeight ?? 8}px`,
    "--tick-inset": `${extras?.iconInset ?? 18}px`,
  } as CSSProperties;
}

function Tick({ align, height }: { align: TickAlign; height: number }) {
  return (
    <div
      className={[
        styles.connector,
        align === "icon"
          ? styles.connectorIcon
          : align === "none"
            ? styles.connectorNone
            : styles.connectorCenter,
      ].join(" ")}
      style={{ height }}
      aria-hidden
    >
      <span className={styles.tick} />
    </div>
  );
}

function PlaygroundIntro({ look }: { look: IntroLook }) {
  return (
    <div
      className={[
        styles.intro,
        look.treatment === "compact" ? styles.introCompact : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className={styles.introIcon} aria-hidden>
        <FaIcon name="hand-wave" size="small" />
      </span>
      <span className={styles.introName}>Intro Screen</span>
      <span className={styles.introPeek}>{PEEK}</span>
      <span className={styles.introAction}>
        <Button
          variant="outlined"
          color="secondary"
          size="extraSmall"
          iconOnly
          startIconName="pencil"
          aria-label="Edit intro"
        />
      </span>
    </div>
  );
}

function QuestionCard({ question }: { question: QuestionItem }) {
  return (
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
  );
}

function FlatOutline({
  look,
  itemHeight,
  sectionHeight,
}: {
  look: IntroLook;
  itemHeight: number;
  sectionHeight: number;
}) {
  return (
    <div className={styles.outline}>
      <PlaygroundIntro look={look} />
      <Tick align={look.fromIntro} height={sectionHeight} />
      {FLAT_QUESTIONS.map((question, index) => (
        <div key={question.bankId}>
          {index > 0 ? <Tick align="icon" height={itemHeight} /> : null}
          <QuestionCard question={question} />
        </div>
      ))}
      <Tick align="icon" height={itemHeight} />
      <OutlineAddQuestionRow
        droppableId="end:flat"
        isDropActive={false}
        onCreateQuestion={() => {}}
      />
    </div>
  );
}

function PagedOutline({
  look,
  itemHeight,
  sectionHeight,
  collapseFirst,
}: {
  look: IntroLook;
  itemHeight: number;
  sectionHeight: number;
  collapseFirst: boolean;
}) {
  return (
    <div className={styles.outline}>
      <PlaygroundIntro look={look} />
      {PAGED.map((page, index) => (
        <div key={page.id}>
          <Tick
            align={index === 0 ? look.fromIntro : "center"}
            height={sectionHeight}
          />
          <OutlineSectionBlock
            sectionId={page.id}
            displayTitle={`Page ${index + 1}`}
            sectionNumber={index + 1}
            questionCount={page.questions.length}
            questionTitles={page.questions.map((question) => question.title)}
            collapsed={index === 0 ? collapseFirst : false}
            collapsedStyle="card"
            isFirst={index === 0}
            isLast={index === PAGED.length - 1}
            isQuestionDropTarget={false}
            onToggleCollapsed={() => {}}
            onMoveUp={() => {}}
            onMoveDown={() => {}}
            onAddAbove={() => {}}
            onAddBelow={() => {}}
            onDelete={() => {}}
          >
            {page.questions.map((question, itemIndex) => (
              <div key={question.bankId}>
                {itemIndex > 0 ? <Tick align="icon" height={itemHeight} /> : null}
                <QuestionCard question={question} />
              </div>
            ))}
            <Tick align="icon" height={itemHeight} />
            <OutlineAddQuestionRow
              droppableId={`end:${page.id}`}
              isDropActive={false}
              onCreateQuestion={() => {}}
            />
          </OutlineSectionBlock>
        </div>
      ))}
      <Tick align="center" height={sectionHeight} />
      <OutlineAddSectionGhost onClick={() => {}} />
    </div>
  );
}

function Pair({
  look,
  itemHeight,
  sectionHeight,
  collapseFirst,
  vars,
}: {
  look: IntroLook;
  itemHeight: number;
  sectionHeight: number;
  collapseFirst: boolean;
  vars?: CSSProperties;
}) {
  return (
    <DndContext>
      <div className={styles.pair} style={{ ...lookVars(look, { itemHeight, iconInset: 18, sectionHeight }), ...vars }}>
        <div className={styles.lane}>
          <span className={styles.laneLabel}>No pages</span>
          <FlatOutline
            look={look}
            itemHeight={itemHeight}
            sectionHeight={sectionHeight}
          />
        </div>
        <div className={styles.lane}>
          <span className={styles.laneLabel}>With pages</span>
          <PagedOutline
            look={look}
            itemHeight={itemHeight}
            sectionHeight={sectionHeight}
            collapseFirst={collapseFirst}
          />
        </div>
      </div>
    </DndContext>
  );
}

function Recipe({
  letter,
  name,
  description,
  children,
}: {
  letter: string;
  name: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.variant}>
      <header className={styles.variantHeader}>
        <span className={styles.variantLetter}>Variant {letter}</span>
        <h2 className={styles.variantName}>{name}</h2>
        <p className={styles.variantDescription}>{description}</p>
      </header>
      {children}
    </section>
  );
}

function Tuner() {
  const scene = useDialKit("Scene", {
    collapseFirstPage: true,
  });
  const intro = useDialKit("Intro", {
    treatment: {
      type: "select" as const,
      options: [
        { value: "row", label: "Question row" },
        { value: "page", label: "Page-sized card" },
        { value: "banner", label: "Banner" },
        { value: "well", label: "Well" },
        { value: "compact", label: "Compact meta" },
      ],
      default: "page",
    },
    radius: {
      type: "select" as const,
      options: [
        { value: "sm", label: "sm · 6px (questions)" },
        { value: "md", label: "md · 8px" },
        { value: "lg", label: "lg · 10px" },
        { value: "lg", label: "lg · 10px (pages)" },
        { value: "xl", label: "xl · 12px" },
      ],
      default: "lg",
    },
    fill: {
      type: "select" as const,
      options: [
        { value: "primary", label: "Primary" },
        { value: "secondary", label: "Secondary" },
        { value: "none", label: "None" },
      ],
      default: "primary",
    },
    bordered: true,
    padX: [8, 0, 24],
    minH: [46, 28, 64],
  });
  const ticks = useDialKit("Ticks", {
    fromIntro: {
      type: "select" as const,
      options: [
        { value: "center", label: "Center (section)" },
        { value: "icon", label: "Icon column (item)" },
        { value: "none", label: "None" },
      ],
      default: "center",
    },
    sectionHeight: [16, 4, 32],
    itemHeight: [8, 4, 24],
    iconInset: [18, 0, 40],
  });

  const look: IntroLook = {
    treatment: intro.treatment as Treatment,
    radius: intro.radius as RadiusToken,
    fill: intro.fill as FillToken,
    bordered: intro.bordered,
    padX: intro.padX,
    minH: intro.minH,
    fromIntro: ticks.fromIntro as TickAlign,
  };

  return (
    <Pair
      look={look}
      itemHeight={ticks.itemHeight}
      sectionHeight={ticks.sectionHeight}
      collapseFirst={scene.collapseFirstPage}
      vars={{ "--tick-inset": `${ticks.iconInset}px` } as CSSProperties}
    />
  );
}

/** Workspace-only comparison of intro treatments with and without pages. */
export function QuizIntroVariantsPage() {
  return (
    <CadsLabProvider>
      <main className={styles.page}>
        <div className={styles.column}>
          <header className={styles.lede}>
            <h1 className={styles.title}>Intro screen · with and without pages</h1>
            <p className={styles.body}>
              Each recipe is shown in both layouts. The rule we are testing:
              intro is a quiz-level block, not a question, so it should not
              change when pages appear. Ticks from intro stay centered; ticks
              between questions stay on the type-icon column. Use the DialKit
              panel to nudge the live pair at the top.
            </p>
          </header>

          <section className={styles.variant}>
            <header className={styles.variantHeader}>
              <span className={styles.variantLetter}>Live</span>
              <h2 className={styles.variantName}>Tuner</h2>
              <p className={styles.variantDescription}>
                Starts on the page-sized card. Change treatment, radius, fill,
                and tick alignment without the recipes below moving.
              </p>
            </header>
            <Tuner />
          </section>

          <h1 className={styles.roundTitle}>Recipes</h1>
          {RECIPES.map((recipe) => (
            <Recipe
              key={recipe.id}
              letter={recipe.letter}
              name={recipe.name}
              description={recipe.description}
            >
              <Pair
                look={recipe.look}
                itemHeight={8}
                sectionHeight={16}
                collapseFirst
              />
            </Recipe>
          ))}
        </div>
      </main>
      <DialRoot position="top-right" theme="light" productionEnabled defaultOpen />
    </CadsLabProvider>
  );
}
