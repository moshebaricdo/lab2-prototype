import { useMemo, useState } from "react";
import { Button, SegmentedButton } from "@moshebari/cads-react";
import { FaIcon } from "@moshebari/cads-react/icons";
import { CadsLabProvider } from "../../components/lab2/CadsLabProvider";
import {
  StandardScoreBreakdown,
  type StandardBreakdownVariant,
} from "../../components/assessment/quiz/StandardScoreBreakdown";
import { cstaTag } from "../../data/assessmentBuilder/csta2026";
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

/* ---------- CSTA 2026 (prod shape: concept → subconcept → standard) ---------- */

/** `MS-PRO-TR-19` → tagged row; the trailing number is outline order within a band. */
function cstaRow(code: string, label: string, correct: number, graded: number) {
  return {
    tag: cstaTag(code, label),
    correct,
    graded,
    percent: Math.round((correct / graded) * 100),
  };
}

/** Subtotals per concept, the same roll-up `scoreByStandard` does. */
function withConceptSubtotals(rows: Breakdown["rows"]): Breakdown {
  const byConcept = new Map<string, Breakdown["categories"][number]>();
  for (const row of rows) {
    const concept = row.tag.category!.parent!;
    const cat = byConcept.get(concept.id) ?? { category: concept, correct: 0, graded: 0, percent: 0 };
    cat.correct += row.correct;
    cat.graded += row.graded;
    byConcept.set(concept.id, cat);
  }
  return {
    rows: [...rows].sort((a, b) => a.tag.position! - b.tag.position!),
    categories: [...byConcept.values()]
      .map((c) => ({ ...c, percent: Math.round((c.correct / c.graded) * 100) }))
      .sort((a, b) => a.category.position! - b.category.position!),
    untaggedGraded: 0,
    untaggedCorrect: 0,
    hasMultiTagged: false,
  };
}

/** The three standards from the Lesson 3 outline. Prod names are the full sentence. */
const CSTA_LONG_NAMES = withConceptSubtotals([
  cstaRow("MS-ALG-ML-06", "Hypothesize how a machine learning model generates classifications or predictions.", 3, 4),
  cstaRow("MS-ALG-ML-08", "Evaluate the features and limitations of a machine learning model.", 2, 4),
  cstaRow("MS-PRO-TR-19", "Use systematic strategies to test, refine, and document changes to a computing technology to meet the intended purpose.", 5, 6),
]);

/**
 * Every CSTA 2026 middle school standard (45), as if one big exam tagged
 * them all. Scores are seeded, not real. Worst case for sprawl.
 */
const CSTA_MS_STANDARDS: Array<[string, string]> = [
  ["MS-ALG-PS-01", "Design an algorithm that includes variables of multiple data types to solve a problem or express an idea."],
  ["MS-ALG-PS-02", "Model a given algorithm with a flowchart or pseudocode that includes a combination of control structures and procedures."],
  ["MS-ALG-PS-03", "Verify the accuracy of an algorithm for given inputs."],
  ["MS-ALG-PS-04", "Justify whether a problem is best solved using procedural instructions, rule-based logic, data-driven methods, or a combination of these approaches."],
  ["MS-ALG-PS-05", "Use an AI tool to generate outputs that assist in solving a computational problem."],
  ["MS-ALG-ML-06", "Hypothesize how a machine learning model generates classifications or predictions."],
  ["MS-ALG-ML-07", "Investigate ways to improve the accuracy of a machine learning model and reduce bias by refining the quality of examples and nonexamples in the training data."],
  ["MS-ALG-ML-08", "Evaluate the features and limitations of a machine learning model."],
  ["MS-ALG-IM-09", "Evaluate which human-centered design principles are present or missing in an existing computing technology."],
  ["MS-ALG-IM-10", "Examine evidence of beneficial and harmful impacts, ethical issues, and biases of algorithms encountered in daily life."],
  ["MS-ALG-IM-11", "Modify an algorithm to address a specific societal impact, ethical issue, or bias."],
  ["MS-PRO-PD-12", "Use a procedure to structure code for clarity and reusability."],
  ["MS-PRO-PD-13", "Use reference documentation in program development."],
  ["MS-PRO-PD-14", "Justify the importance of attribution and intellectual property when developing computing technologies."],
  ["MS-PRO-PD-15", "Develop a program utilizing inclusive collaboration practices."],
  ["MS-PRO-VD-16", "Use variables of multiple data types to store, access, and manipulate data within a program."],
  ["MS-PRO-RD-17", "Analyze the roles of iteration, selection, variables, and procedures in a segment of code."],
  ["MS-PRO-RD-18", "Analyze AI-generated code for accuracy and usability in a programming project."],
  ["MS-PRO-TR-19", "Use systematic strategies to test, refine, and document changes to a computing technology to meet the intended purpose."],
  ["MS-PRO-TR-20", "Refine a computing technology based on user feedback to improve its usability and accessibility."],
  ["MS-DAT-DC-21", "Evaluate how different levels of precision and granularity in data collection affect accuracy, storage, and analysis."],
  ["MS-DAT-DC-22", "Explain how data and its associated metadata can be used to answer questions."],
  ["MS-DAT-DC-23", "Use a computational tool to sort, filter, group, and summarize structured data."],
  ["MS-DAT-DC-24", "Analyze options to address a data quality issue."],
  ["MS-DAT-DI-25", "Use a computational tool to identify relationships among variables in a dataset and make a classification or prediction."],
  ["MS-DAT-DI-26", "Create data visualizations to show how different design choices can impact the interpretation of the same data."],
  ["MS-DAT-DI-27", "Summarize a data investigation process, including potential biases, limitations, and supporting evidence."],
  ["MS-DAT-IM-28", "Explain the benefits and risks of allowing personal data and metadata to be collected and used in datasets, including issues of data ownership, privacy, and sovereignty."],
  ["MS-DAT-IM-29", "Analyze how decisions made at different stages of working with data can lead to biased data, misleading conclusions, and compromised AI models."],
  ["MS-SYS-HW-30", "Examine differences between computing systems based on user needs, system requirements, and potential societal, environmental, and ethical impacts."],
  ["MS-SYS-HW-31", "Describe computing devices used in various industries, their basic functions, and how they are used to accomplish tasks or solve problems."],
  ["MS-SYS-SE-32", "Explain the effects of not using the CIA triad when working with data."],
  ["MS-SYS-SE-33", "Evaluate common types of cyber attacks and preventions."],
  ["MS-SYS-NT-34", "Model how information in a network is broken down into packets, transmitted between devices, and reassembled."],
  ["MS-SYS-NT-35", "Explain how the resilience of the internet depends on interconnected devices and their roles and functions within the network."],
  ["MS-SYS-IM-36", "Collaborate to improve the design of a computing system to meet the needs of diverse users."],
  ["MS-SYS-IM-37", "Examine how access to computing systems can vary based on personal and social factors, such as physical ability, geographic location, socioeconomic status, and age."],
  ["MS-SOC-HI-38", "Compare the roles of individuals, communities, organizations, and governments in shaping computing technologies across major eras in computing history."],
  ["MS-SOC-HI-39", "Analyze intended and unintended impacts of a historical computing technology on society and the environment."],
  ["MS-SOC-ET-40", "Evaluate when it is appropriate to use AI and other emerging technologies to solve a problem based on their capabilities, limitations, and environmental impacts."],
  ["MS-SOC-ET-41", "Evaluate how the decisions made while designing an emerging technology influence user experiences differently across different communities."],
  ["MS-SOC-ET-42", "Debate ways an emerging technology impacts the social, cultural, and environmental issues in local communities."],
  ["MS-SOC-HU-43", "Analyze how the decisions humans make when using computing technologies have ethical and social consequences."],
  ["MS-SOC-CE-44", "Analyze how workers in different careers use computational thinking to solve real-world problems."],
  ["MS-SOC-CE-45", "Evaluate how automation in technology can create or replace jobs and change how people work."],
];

function cstaMsBreakdown(): Breakdown {
  let seed = 7;
  const next = () => (seed = (seed * 31 + 11) % 97);
  return withConceptSubtotals(
    CSTA_MS_STANDARDS.map(([code, label]) => {
      const graded = 1 + (next() % 3);
      return cstaRow(code, label, next() % (graded + 1), graded);
    }),
  );
}
const SPRAWL = cstaMsBreakdown();
const SPRAWL_CORRECT = SPRAWL.rows.reduce((n, r) => n + r.correct, 0);
const SPRAWL_GRADED = SPRAWL.rows.reduce((n, r) => n + r.graded, 0);

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
        id: "csta",
        name: "CSTA 2026 · long standard names",
        description:
          "CSTA names are the full standard sentence. Code leads the cell and the name wraps under it. Standards point at a subconcept (ML, TR); results group by its concept (ALG, PRO), and the subconcept reads in the code.",
        overline: "results",
        title: "Lesson 3 Check: AI-Assisted Creation",
        correct: 10,
        graded: 14,
        hasFr: false,
        attemptHelper: "Unlimited attempts",
        breakdown: CSTA_LONG_NAMES,
      },
      {
        id: "sprawl",
        name: "Stress · every CSTA 2026 middle school standard (5 concepts, 45 standards)",
        description:
          "Worst case: one exam tagged with the whole MS band (scores seeded). Past 8 standards, concepts start collapsed to their subtotals; open one, or Expand all.",
        overline: "results",
        title: "Middle School CS Benchmark",
        correct: SPRAWL_CORRECT,
        graded: SPRAWL_GRADED,
        hasFr: false,
        attemptHelper: "Unlimited attempts",
        breakdown: SPRAWL,
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
