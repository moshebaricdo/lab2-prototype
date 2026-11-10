import { useMemo, useState } from "react";
import { Button, SegmentedButton } from "@moshebari/cads-react";
import { FaIcon } from "@moshebari/cads-react/icons";
import { CadsLabProvider } from "../../components/lab2/CadsLabProvider";
import {
  StandardScoreBreakdown,
  type StandardBreakdownVariant,
} from "../../components/assessment/quiz/StandardScoreBreakdown";
import { mockAifCourseBank } from "../../data/assessmentBuilder/mockBank";
import { mockP0ExamAssessment } from "../../data/assessmentBuilder/mockAssessments";
import {
  MOCK_STUDENT_NAME,
  mockQuizStudentResponseSubmitted,
} from "../../data/assessmentBuilder/mockStudentResponses";
import { scoreByStandard, scoreQuestionResponse } from "../../lib/assessmentBuilder";
import type {
  QuestionItem,
  QuestionResponse,
  StandardScoreBreakdown as Breakdown,
} from "../../types/assessmentBuilder";
import cardStyles from "../../components/assessment/quiz/QuizAttemptWorkspace.module.scss";
import styles from "./QuizScoreByStandardVariantsPage.module.scss";

/* ---------- Scenario data ---------- */

/** The Unit 3 exam with Maya’s seeded submission, scored for real. */
function demoExamScenario() {
  const byId = new Map(mockAifCourseBank.questions.map((q) => [q.bankId, q]));
  const { answers } = mockQuizStudentResponseSubmitted;
  const entries = mockP0ExamAssessment.questionRefs.flatMap((ref) => {
    const question = ref.type === "bank" ? byId.get(ref.bankId) : ref.item;
    if (!question) return [];
    const response: QuestionResponse = {
      bankId: question.bankId,
      multiSelectedIds: answers.multi[question.bankId]
        ? [answers.multi[question.bankId]]
        : undefined,
      freeText: answers.freeText[question.bankId],
      matchAssignments: answers.match[question.bankId],
    };
    return [{ question: question as QuestionItem, response }];
  });
  const graded = entries.filter((e) => e.question.item.kind !== "freeResponse");
  const correct = graded.filter(
    (e) => scoreQuestionResponse(e.question, e.response).outcome === "correct",
  ).length;
  return {
    breakdown: scoreByStandard(entries),
    correct,
    graded: graded.length,
    hasFr: graded.length < entries.length,
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  "1": "Identify AI concepts and capabilities",
  "2": "Implement AI solutions by using Microsoft Foundry",
};

function row(id: string, label: string, code: string, correct: number, graded: number) {
  // "AI-901 2.3" → skill area "2"
  const catCode = code.split(" ")[1].split(".")[0];
  return {
    tag: {
      id,
      label,
      code,
      category: { id: `cat-${catCode}`, code: catCode, label: CATEGORY_LABELS[catCode] },
    },
    correct,
    graded,
    percent: Math.round((correct / graded) * 100),
  };
}

function category(code: string, correct: number, graded: number) {
  return {
    category: { id: `cat-${code}`, code, label: CATEGORY_LABELS[code] },
    correct,
    graded,
    percent: Math.round((correct / graded) * 100),
  };
}

/** A full AI-901 practice exam: all seven skill groups, one untagged question. */
const ALL_AI901_STANDARDS: Breakdown = {
  rows: [
    row("s1", "Responsible AI principles", "AI-901 1.1", 5, 6),
    row("s2", "AI models and configuration", "AI-901 1.2", 3, 5),
    row("s3", "AI workloads", "AI-901 1.3", 4, 4),
    row("s4", "Generative AI apps and agents", "AI-901 2.1", 4, 7),
    row("s5", "Text and speech solutions", "AI-901 2.2", 2, 3),
    row("s6", "Vision and image generation", "AI-901 2.3", 1, 2),
    row("s7", "Information extraction", "AI-901 2.4", 2, 2),
  ],
  categories: [
    category("1", 12, 15),
    category("2", 9, 14),
  ],
  untaggedGraded: 1,
  untaggedCorrect: 1,
  hasMultiTagged: false,
};

/** Every graded question shares one standard, so the breakdown repeats the total. */
const ONE_STANDARD: Breakdown = {
  rows: [row("s1", "Responsible AI principles", "AI-901 1.1", 4, 5)],
  categories: [],
  untaggedGraded: 0,
  untaggedCorrect: 0,
  hasMultiTagged: false,
};

/* ---------- Results card replica ---------- */

interface ScenarioCard {
  id: string;
  name: string;
  description: string;
  overline: string;
  title: string;
  correct: number;
  graded: number;
  hasFr: boolean;
  attemptHelper: string;
  breakdown: Breakdown;
}

function ResultsCard({
  scenario,
  variant,
}: {
  scenario: ScenarioCard;
  variant: StandardBreakdownVariant;
}) {
  const percent = Math.round((scenario.correct / scenario.graded) * 100);
  return (
    <article className={`${cardStyles.summaryCard} ${styles.card}`}>
      <div className={cardStyles.summaryBody}>
        <div className={cardStyles.summaryHeader}>
          <p className={cardStyles.overline}>{scenario.overline}</p>
          <h1 className={cardStyles.title}>{scenario.title}</h1>
        </div>
      </div>
      <div className={`${cardStyles.stats} ${cardStyles.statsPair}`}>
        <div className={cardStyles.stat}>
          <p className={cardStyles.statValue}>{percent}%</p>
          <div className={cardStyles.statCopy}>
            <p className={cardStyles.statLabel}>
              {scenario.correct} of {scenario.graded} Correct
            </p>
            {scenario.hasFr ? (
              <p className={cardStyles.statHelper}>Not including free response</p>
            ) : null}
          </div>
        </div>
        <div className={cardStyles.stat}>
          <p className={cardStyles.statValue}>1</p>
          <div className={cardStyles.statCopy}>
            <p className={cardStyles.statLabel}>First attempt</p>
            <p className={cardStyles.statHelper}>{scenario.attemptHelper}</p>
          </div>
        </div>
      </div>
      <StandardScoreBreakdown breakdown={scenario.breakdown} variant={variant} />
      <footer className={cardStyles.cardFooter}>
        <span className={cardStyles.metaSuccess}>
          <FaIcon name="circle-check" size="small" /> Submitted Nov 6, 10:42 AM
        </span>
        <div className={cardStyles.cardFooterActions}>
          <Button variant="contained" color="primary" size="small" endIconName="arrow-right">
            Next level
          </Button>
        </div>
      </footer>
    </article>
  );
}

/* ---------- Page ---------- */

const VARIANT_META: Array<{
  value: StandardBreakdownVariant;
  letter: string;
  name: string;
  description: string;
}> = [
  {
    value: "bars",
    letter: "A",
    name: "Meter rows",
    description:
      "One row per standard: name and code, then percent and count, then a meter. Easy to spot the low row at a glance. Brand fill, no red or green, so a low standard reads as a level rather than a failure.",
  },
  {
    value: "table",
    letter: "B",
    name: "Table",
    description:
      "Standard / Correct / Score columns. The densest option, and the one that still holds up at eight or more standards. Reads more like a report than feedback.",
  },
  {
    value: "tiles",
    letter: "C",
    name: "Stat tiles",
    description:
      "Mini versions of the stats row above. Feels the most native to the card, but wraps to a grid past three standards and long names get cramped.",
  },
];

type ViewMode = StandardBreakdownVariant | "all";

export function QuizScoreByStandardVariantsPage() {
  const [mode, setMode] = useState<ViewMode>("all");

  const scenarios = useMemo<ScenarioCard[]>(() => {
    const demo = demoExamScenario();
    return [
      {
        id: "student",
        name: "Student · AI-901 practice exam",
        description:
          "The demo exam with Maya’s seeded answers, scored by the real helper. Seven AI-901 standards, one question tagged with two, two free-response questions left out.",
        overline: "results",
        title: mockP0ExamAssessment.title,
        correct: demo.correct,
        graded: demo.graded,
        hasFr: demo.hasFr,
        attemptHelper: "No attempts remaining",
        breakdown: demo.breakdown,
      },
      {
        id: "teacher",
        name: "Teacher · reviewing one student",
        description:
          "Same data from the teacher’s side. Teachers see this even when Show correctness is off for students.",
        overline: `${MOCK_STUDENT_NAME}’s results`,
        title: mockP0ExamAssessment.title,
        correct: demo.correct,
        graded: demo.graded,
        hasFr: demo.hasFr,
        attemptHelper: "Submitted",
        breakdown: demo.breakdown,
      },
      {
        id: "six",
        name: "Full exam · all seven AI-901 standards, one untagged",
        description:
          "A longer AI-901 exam with every skill group. Tests row count and the Untagged questions row.",
        overline: "results",
        title: "AI-901 Full Practice Exam",
        correct: 22,
        graded: 30,
        hasFr: false,
        attemptHelper: "Unlimited attempts",
        breakdown: ALL_AI901_STANDARDS,
      },
      {
        id: "one",
        name: "Edge · one standard",
        description:
          "Every question has the same standard, so the breakdown repeats the total. Hide it in this case, or show it so the standard is named?",
        overline: "results",
        title: "Unit 1 Check: Responsible AI",
        correct: 4,
        graded: 5,
        hasFr: false,
        attemptHelper: "2 attempts remaining",
        breakdown: ONE_STANDARD,
      },
    ];
  }, []);

  const shownVariants =
    mode === "all" ? VARIANT_META : VARIANT_META.filter((v) => v.value === mode);

  return (
    <CadsLabProvider>
      <main className={styles.page}>
        <div className={styles.column}>
          <header className={styles.intro}>
            <p className={styles.overline}>Experiment</p>
            <h1 className={styles.heading}>Score by standard on quiz results</h1>
            <p className={styles.lede}>
              ACE needs results broken down by domain; domains are standards in this model.
              Each card is the real results summary with the breakdown under the stats row.
              The live quiz takes <code>?byStandard=bars|table|tiles</code>.
            </p>
          </header>

          <div className={styles.toolbar}>
            <SegmentedButton
              size="extraSmall"
              aria-label="Variant"
              value={mode}
              onChange={(value) => setMode(value as ViewMode)}
              options={[
                { value: "all", label: "Compare all" },
                ...VARIANT_META.map((v) => ({ value: v.value, label: `${v.letter} · ${v.name}` })),
              ]}
            />
          </div>

          {scenarios.map((scenario) => (
            <section key={scenario.id} className={styles.scenario}>
              <div className={styles.scenarioHeader}>
                <h2 className={styles.scenarioName}>{scenario.name}</h2>
                <p className={styles.scenarioDescription}>{scenario.description}</p>
              </div>
              {shownVariants.map((variant) => (
                <div key={variant.value} className={styles.variant}>
                  <div className={styles.variantHeader}>
                    <span className={styles.variantLetter}>
                      {variant.letter} · {variant.name}
                    </span>
                    {scenario.id === "student" ? (
                      <p className={styles.variantDescription}>{variant.description}</p>
                    ) : null}
                  </div>
                  <ResultsCard scenario={scenario} variant={variant.value} />
                </div>
              ))}
            </section>
          ))}
        </div>
      </main>
    </CadsLabProvider>
  );
}
