import { applyQuizPurpose } from "../../lib/assessmentBuilder/quizPurpose";
import type {
  AssessmentArtifact,
  QuestionItem,
} from "../../types/assessmentBuilder";

const SEED_UPDATED_AT = new Date("2026-10-28T12:00:00").getTime();
const COURSE_ID = "aif-cert";

export const EDITABLE_QUIZ_DEMOS = [
  {
    id: "quiz-demo-multi",
    slug: "multi",
    name: "Multiple choice",
    /** Index opens the student quiz. Edit in the header opens the builder. */
    indexOpensBuilder: false,
  },
  {
    id: "quiz-demo-multi-select",
    slug: "multi-select",
    name: "Multiple select",
    indexOpensBuilder: false,
  },
  {
    id: "quiz-demo-free-response",
    slug: "free-response",
    name: "Free response",
    indexOpensBuilder: false,
  },
  {
    id: "quiz-demo-matching",
    slug: "matching",
    name: "Matching",
    indexOpensBuilder: false,
  },
  {
    id: "quiz-demo-blank",
    slug: "blank",
    name: "Blank quiz",
    /** Start in the builder so Save is what reveals the student quiz. */
    indexOpensBuilder: true,
  },
] as const;

export type EditableQuizDemoId = (typeof EDITABLE_QUIZ_DEMOS)[number]["id"];
export type EditableQuizSlug = (typeof EDITABLE_QUIZ_DEMOS)[number]["slug"];

const DEMO_BY_ID = new Map(EDITABLE_QUIZ_DEMOS.map((demo) => [demo.id, demo]));
const DEMO_BY_SLUG = new Map(
  EDITABLE_QUIZ_DEMOS.map((demo) => [demo.slug, demo]),
);

export function editableQuizDemoBySlug(slug: string | undefined) {
  if (!slug) return undefined;
  return DEMO_BY_SLUG.get(slug as EditableQuizSlug);
}

export function editableQuizDemoById(id: string) {
  return DEMO_BY_ID.get(id as EditableQuizDemoId);
}

export function isEditableQuizDemoId(id: string): id is EditableQuizDemoId {
  return DEMO_BY_ID.has(id as EditableQuizDemoId);
}

export function editableQuizPlayPath(id: EditableQuizDemoId): string {
  const demo = DEMO_BY_ID.get(id);
  return `/levels/quiz-demo/${demo?.slug ?? "multi"}`;
}

export function editableQuizEditPath(id: EditableQuizDemoId): string {
  return `${editableQuizPlayPath(id)}/edit`;
}

function question(
  partial: Pick<QuestionItem, "bankId" | "title" | "item"> & Partial<QuestionItem>,
): QuestionItem {
  return {
    courseId: COURSE_ID,
    tags: [],
    reveal: { enabled: true },
    points: 1,
    listedInBank: false,
    neverSaved: false,
    versionIndex: 1,
    versionCount: 1,
    lastEditedLabel: "Oct 28, 2026",
    updatedAt: SEED_UPDATED_AT,
    ...partial,
  };
}

const multiQuestion = question({
  bankId: "q-demo-multi",
  title: "Training set",
  numericId: 51011,
  questionKey: "demo-multi-training-set",
  reveal: {
    enabled: true,
    explanation:
      "The training set is the labeled data a model fits. Validation and test sets are held out.",
  },
  item: {
    kind: "multi",
    content: {
      prompt: "What is a training set?",
      description:
        "A supervised model learns from labeled examples before anyone reports how well it does on new data.",
      selectionMode: "single",
      correctAnswerId: "a",
      answers: [
        { id: "a", text: "Labeled examples the model uses to fit its parameters." },
        { id: "b", text: "A held-out set used only for the final accuracy report." },
        { id: "c", text: "The list of features the author chose not to collect." },
        { id: "d", text: "A written description of the model's intended users." },
      ],
    },
  },
});

const multiSelectQuestion = question({
  bankId: "q-demo-multi-select",
  title: "Reducing harm",
  numericId: 51012,
  questionKey: "demo-multi-select-harm",
  reveal: {
    enabled: true,
    explanation:
      "Audits and a way to appeal a decision both reduce harm. Shipping faster and hiding the data source do not.",
  },
  item: {
    kind: "multi",
    content: {
      prompt:
        "Which of these reduce harm from a deployed model? Select all that apply.",
      selectionMode: "multiple",
      correctAnswerIds: ["a", "c"],
      answers: [
        { id: "a", text: "Check the model's errors on groups of people before launch." },
        { id: "b", text: "Ship the model as soon as overall accuracy looks high." },
        { id: "c", text: "Give people a way to appeal a decision the model made." },
        { id: "d", text: "Keep the training data source private so nobody can question it." },
      ],
    },
  },
});

const freeResponseQuestion = question({
  bankId: "q-demo-free-response",
  title: "Overfitting",
  numericId: 51013,
  questionKey: "demo-free-response-overfitting",
  reveal: { enabled: false },
  item: {
    kind: "freeResponse",
    content: {
      prompt: "In one or two sentences, what is overfitting?",
      description:
        "Use your own words. A strong answer names what the model memorized and what happens on new data.",
      placeholder: "Type your response…",
      minCharacters: 40,
      teacherAnswer: {
        exemplar:
          "Overfitting is when a model memorizes the training examples, including noise, and then does worse on new data.",
        expectedElements: [
          "Mentions memorizing training data",
          "Mentions poor performance on new data",
        ],
      },
    },
  },
});

const matchingQuestion = question({
  bankId: "q-demo-matching",
  title: "Dataset roles",
  numericId: 51014,
  questionKey: "demo-matching-roles",
  reveal: {
    enabled: true,
    explanation:
      "Training fits the model, validation compares choices, and the test set is a final check.",
  },
  item: {
    kind: "match",
    content: {
      prompt: "Match each dataset role to its job.",
      terms: [
        { id: "t1", text: "Training set" },
        { id: "t2", text: "Validation set" },
        { id: "t3", text: "Test set" },
      ],
      prompts: [
        {
          id: "p1",
          text: "Examples used to fit the model's parameters.",
          correctTermId: "t1",
        },
        {
          id: "p2",
          text: "Examples used to compare design choices.",
          correctTermId: "t2",
        },
        {
          id: "p3",
          text: "Held-out examples for a final check.",
          correctTermId: "t3",
        },
      ],
    },
  },
});

function cfuQuiz(
  id: EditableQuizDemoId,
  title: string,
  levelId: number,
  levelPosition: number,
  item: QuestionItem,
): AssessmentArtifact {
  return applyQuizPurpose(
    {
      id,
      courseId: COURSE_ID,
      title,
      lessonName: "Editable quizzes",
      levelId,
      placement: { kind: "floating" },
      mode: "checkpoint",
      layout: "stepped",
      metadata: {
        levelPosition,
        totalLevelsInScript: EDITABLE_QUIZ_DEMOS.length,
        assessmentName: title,
      },
      questionRefs: [{ type: "inline", item }],
      shuffle: { shuffleQuestions: false, shuffleOptions: false },
      tutor: { enabled: false },
      updatedAt: SEED_UPDATED_AT,
    },
    "check_for_understanding",
  );
}

/** One-question quizzes whose settings match a check-for-understanding seed. */
export const editableQuizSeeds: Record<EditableQuizDemoId, AssessmentArtifact> = {
  "quiz-demo-multi": cfuQuiz(
    "quiz-demo-multi",
    "Multiple choice",
    51001,
    1,
    multiQuestion,
  ),
  "quiz-demo-multi-select": cfuQuiz(
    "quiz-demo-multi-select",
    "Multiple select",
    51002,
    2,
    multiSelectQuestion,
  ),
  "quiz-demo-free-response": cfuQuiz(
    "quiz-demo-free-response",
    "Free response",
    51003,
    3,
    freeResponseQuestion,
  ),
  "quiz-demo-matching": cfuQuiz(
    "quiz-demo-matching",
    "Matching",
    51004,
    4,
    matchingQuestion,
  ),
  "quiz-demo-blank": {
    id: "quiz-demo-blank",
    courseId: COURSE_ID,
    title: "Blank quiz",
    lessonName: "Editable quizzes",
    levelId: 51005,
    placement: { kind: "floating" },
    mode: "checkpoint",
    layout: "stepped",
    metadata: {
      levelPosition: 5,
      totalLevelsInScript: EDITABLE_QUIZ_DEMOS.length,
      assessmentName: "Blank quiz",
    },
    questionRefs: [],
    shuffle: { shuffleQuestions: false, shuffleOptions: false },
    tutor: { enabled: false },
    updatedAt: SEED_UPDATED_AT,
  },
};

export function editableQuizSeed(id: EditableQuizDemoId): AssessmentArtifact {
  return editableQuizSeeds[id];
}
