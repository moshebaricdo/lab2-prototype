import type {
  AssessmentCourseBank,
  CourseUnit,
  DomainTag,
  QuestionItem,
  QuestionUsageRow,
  QuestionVersionRow,
} from "../../types/assessmentBuilder";

const AIF_CONCEPTS: DomainTag[] = [
  { id: "domain-ml", label: "Machine Learning Fundamentals", code: "HS-AI-ML-04" },
  { id: "domain-ethics", label: "AI Ethics & Safety", code: "3B-AP-08" },
  { id: "domain-data", label: "Data & Features", code: "HS-AI-DAT-02" },
];

const AIF_UNITS: CourseUnit[] = [
  {
    id: "aif-unit-supervised",
    label: "Unit 1 · Supervised Learning",
    conceptIds: ["domain-ml", "domain-data"],
  },
  {
    id: "aif-unit-responsible",
    label: "Unit 2 · Responsible AI",
    conceptIds: ["domain-ethics"],
  },
  {
    id: "aif-unit-models",
    label: "Unit 3 · Models in Practice",
    conceptIds: ["domain-ml", "domain-data"],
  },
];

const WEB_CONCEPTS: DomainTag[] = [
  { id: "domain-html", label: "HTML & Structure", code: "HS-WEB-SEM-03" },
  { id: "domain-css", label: "CSS & Layout", code: "3A-AP-18" },
];

const WEB_UNITS: CourseUnit[] = [
  {
    id: "web-unit-html",
    label: "Unit 1 · Semantic markup",
    conceptIds: ["domain-html"],
  },
  {
    id: "web-unit-css",
    label: "Unit 2 · Page layout",
    conceptIds: ["domain-css"],
  },
];

const EXAM_QUIZ: QuestionUsageRow = {
  quizTitle: "Unit 3 Assessment: AI in Society",
  courseUnit: "AI Foundations · Unit 3",
  status: "live",
};

const PRACTICE_QUIZ: QuestionUsageRow = {
  quizTitle: "Unit 3 practice",
  courseUnit: "AI Foundations · Unit 3",
  status: "unpublished",
};

const SEEDED_QUIZ: QuestionUsageRow = {
  quizTitle: "AI Foundations practice quiz",
  courseUnit: "AI Foundations · Unit 1",
  status: "unpublished",
};

const CFU_ACCOUNTABILITY: QuestionUsageRow = {
  quizTitle: "Unit 2 CFU · Accountability",
  courseUnit: "AI Foundations · Unit 2",
  status: "unpublished",
};

const WEB_CHECKPOINT: QuestionUsageRow = {
  quizTitle: "HTML & CSS checkpoint",
  courseUnit: "Web Development Fundamentals · Unit 1",
  status: "unpublished",
};

function fakeQuestionKey(numericId: number): string {
  return `a1f00000-0000-4000-8000-${String(numericId).padStart(12, "0")}`;
}

/** Bank rows always have an integer id + family key (Levelbuilder created them). */
function bankIdentity({
  numericId,
  questionKey = fakeQuestionKey(numericId),
  lastEditedLabel = "Sep 5, 2026",
  usedInQuizzes = [],
  versions,
  versionIndex,
  versionCount,
  attachedToOtherQuizzes,
  usedInPublishedUnit,
}: {
  numericId: number;
  questionKey?: string;
  lastEditedLabel?: string;
  usedInQuizzes?: QuestionUsageRow[];
  versions?: QuestionVersionRow[];
  versionIndex?: number;
  versionCount?: number;
  attachedToOtherQuizzes?: boolean;
  usedInPublishedUnit?: boolean;
}): Pick<
  QuestionItem,
  | "numericId"
  | "questionKey"
  | "versionIndex"
  | "versionCount"
  | "lastEditedLabel"
  | "attachedToOtherQuizzes"
  | "usedInPublishedUnit"
  | "usedInQuizzes"
  | "versions"
> {
  const quizzes = usedInQuizzes;
  const index = versionIndex ?? 1;
  const count = versionCount ?? Math.max(1, versions?.length ?? 1);
  return {
    numericId,
    questionKey,
    versionIndex: index,
    versionCount: count,
    lastEditedLabel,
    attachedToOtherQuizzes: attachedToOtherQuizzes ?? quizzes.length > 1,
    usedInPublishedUnit:
      usedInPublishedUnit ??
      quizzes.some((row) => row.status === "live" || row.status === "sunsetting"),
    usedInQuizzes: quizzes,
    versions: versions ?? [
      {
        label: `Version ${index}`,
        id: numericId,
        usedIn:
          quizzes.length === 0
            ? "No quizzes"
            : quizzes.length === 1
              ? quizzes[0].quizTitle
              : `${quizzes.length} quizzes`,
        lastEdited: lastEditedLabel,
        isCurrent: true,
      },
    ],
  };
}

export const mockMultiBankQuestion: QuestionItem = {
  bankId: "q-aif-multi-1",
  courseId: "aif-cert",
  title: "Loss function purpose",
  unitId: "aif-unit-supervised",
  tags: [AIF_CONCEPTS[0]],
  difficulty: "intermediate",
  ...bankIdentity({
    numericId: 1842,
    questionKey: "8f3c2a11-4b6e-4d90-9c1a-2e7f0b5d1842",
    lastEditedLabel: "Sep 3, 2026",
    versionIndex: 2,
    versionCount: 2,
    usedInQuizzes: [EXAM_QUIZ, PRACTICE_QUIZ],
    versions: [
      {
        label: "Version 2",
        id: 1842,
        usedIn: "2 quizzes",
        lastEdited: "Sep 3, 2026",
        isCurrent: true,
      },
      {
        label: "Version 1",
        id: 1611,
        usedIn: "Unit 3 Assessment: AI in Society (2025)",
        lastEdited: "Aug 12, 2026",
      },
    ],
  }),
  listedInBank: true,
  reveal: {
    enabled: true,
    explanation:
      "A loss function quantifies prediction error so training can minimize it.",
  },
  teacherNote:
    "Students often pick the shuffling distractor — revisit the fit/evaluate split if that happens.",
  updatedAt: Date.now(),
  item: {
    kind: "multi",
    content: {
      prompt: "What is the loss function doing?",
      description: [
        "A supervised model compares each prediction to a known label, then uses that comparison to update weights. In code the comparison often looks like this:",
        "",
        "```python",
        "loss = (prediction - label) ** 2",
        "```",
        "",
        "What is the primary purpose of that `loss` value during training?",
      ].join("\n"),
      answers: [
        {
          id: "a",
          text: "Quantify how far the model's predictions are from the correct labels.",
        },
        {
          id: "b",
          text: "Randomly shuffle the training data at the start of each epoch.",
        },
        {
          id: "c",
          text: "Convert categorical labels into one-hot encoded vectors.",
        },
        {
          id: "d",
          text: "Store the trained weights after training finishes.",
        },
      ],
      correctAnswerId: "a",
    },
  },
};

export const mockMultiSelectBankQuestion: QuestionItem = {
  bankId: "q-aif-multi-2",
  courseId: "aif-cert",
  title: "Responsible AI practices",
  unitId: "aif-unit-responsible",
  tags: [AIF_CONCEPTS[1]],
  difficulty: "beginner",
  ...bankIdentity({
    numericId: 1843,
    lastEditedLabel: "Sep 4, 2026",
    usedInQuizzes: [EXAM_QUIZ, SEEDED_QUIZ],
  }),
  reveal: {
    enabled: true,
    explanation: "Bias audits and documentation support accountable AI systems.",
  },
  teacherNote:
    "Pairs with the Unit 3 accountability discussion; accept any three of the four safe practices.",
  updatedAt: Date.now(),
  item: {
    kind: "multi",
    content: {
      prompt:
        "Which practices help reduce harm from a deployed AI system? Select all that apply.",
      selectionMode: "multiple",
      correctAnswerIds: ["a", "c", "d"],
      answers: [
        { id: "a", text: "Audit training data for representation gaps." },
        { id: "b", text: "Hide model limitations from users." },
        { id: "c", text: "Document known failure modes." },
        { id: "d", text: "Test edge cases before launch." },
      ],
    },
  },
};

export const mockCodeRefBankQuestion: QuestionItem = {
  bankId: "q-aif-code-1",
  courseId: "aif-cert",
  title: "Trace classifier output",
  unitId: "aif-unit-models",
  tags: [AIF_CONCEPTS[0], AIF_CONCEPTS[2]],
  difficulty: "advanced",
  ...bankIdentity({
    numericId: 1844,
    lastEditedLabel: "Sep 4, 2026",
    usedInQuizzes: [EXAM_QUIZ, SEEDED_QUIZ],
  }),
  reveal: {
    enabled: true,
    explanation: "The weighted sum is positive, so predict returns 1.",
  },
  teacherNote:
    "Walk the arithmetic on the board if several students answer 0: 0.8·2.0 − 0.3·1.5 − 0.5 = 0.65.",
  updatedAt: Date.now(),
  item: {
    kind: "multi",
    content: {
      prompt: "What does this program print?",
      description: [
        "Trace the classifier below, then choose the value of `print`.",
        "",
        "```python",
        "def predict(features, weights, bias):",
        "    total = bias",
        "    for i in range(len(features)):",
        "        total += features[i] * weights[i]",
        "    return 1 if total >= 0 else 0",
        "",
        "features = [0.8, 0.3]",
        "weights = [2.0, -1.5]",
        "bias = -0.5",
        "print(predict(features, weights, bias))",
        "```",
      ].join("\n"),
      answers: [
        { id: "a", text: "0" },
        { id: "b", text: "1" },
        { id: "c", text: "-1" },
        { id: "d", text: "Error" },
      ],
      correctAnswerId: "b",
    },
  },
};

export const mockFreeResponseBankQuestion: QuestionItem = {
  bankId: "q-aif-fr-1",
  courseId: "aif-cert",
  title: "Explain overfitting",
  unitId: "aif-unit-supervised",
  tags: [AIF_CONCEPTS[0]],
  difficulty: "beginner",
  ...bankIdentity({
    numericId: 1845,
    lastEditedLabel: "Sep 4, 2026",
    usedInQuizzes: [EXAM_QUIZ, PRACTICE_QUIZ, SEEDED_QUIZ],
  }),
  reveal: {
    enabled: true,
    explanation:
      "Strong training performance with poor generalization indicates overfitting.",
  },
  teacherNote:
    "Grade with the rubric: definition plus one mitigation. Memorization language alone is not enough.",
  updatedAt: Date.now(),
  item: {
    kind: "freeResponse",
    content: {
      prompt:
        "In your own words, explain what overfitting means and name one strategy to reduce it.",
      placeholder: "Overfitting happens when… One way to reduce it is…",
      allowFileUpload: true,
      minCharacters: 60,
      revealAnswerEnabled: true,
      teacherAnswer: {
        exemplar:
          "Overfitting happens when a model memorizes training noise and fails on new data. Hold out a validation set and stop training when validation performance stops improving.",
        rubricCriteria: [
          "Defines overfitting as poor generalization.",
          "Names a reasonable mitigation strategy.",
        ],
      },
    },
  },
};

export const mockMatchBankQuestion: QuestionItem = {
  bankId: "q-aif-match-1",
  courseId: "aif-cert",
  title: "ML dataset roles",
  unitId: "aif-unit-supervised",
  tags: [AIF_CONCEPTS[2]],
  difficulty: "intermediate",
  ...bankIdentity({
    numericId: 1846,
    lastEditedLabel: "Sep 4, 2026",
    usedInQuizzes: [EXAM_QUIZ, PRACTICE_QUIZ, SEEDED_QUIZ],
  }),
  reveal: {
    enabled: true,
    explanation:
      "Training fits the model, validation compares design choices, and the test set is held out for a final check.",
  },
  teacherNote:
    "Validation vs test is the usual mix-up; the “comparing design choices” wording is the tell.",
  updatedAt: Date.now(),
  item: {
    kind: "match",
    content: {
      prompt: "Match each dataset role",
      description:
        "A typical supervised workflow splits labeled examples into three roles before anyone reports accuracy.\n\nMatch each role to its purpose.",
      terms: [
        { id: "t1", text: "Training set" },
        { id: "t2", text: "Validation set" },
        { id: "t3", text: "Test set" },
      ],
      prompts: [
        {
          id: "p1",
          text: "Examples used to fit model parameters.",
          correctTermId: "t1",
        },
        {
          id: "p2",
          text: "Held-out examples for comparing design choices.",
          correctTermId: "t2",
        },
        {
          id: "p3",
          text: "Unseen examples for final evaluation.",
          correctTermId: "t3",
        },
      ],
    },
  },
};

/** Kept for the legacy seeded quiz; not used in the P0 exam. */
export const mockSurveyBankQuestion: QuestionItem = {
  bankId: "q-aif-survey-1",
  courseId: "aif-cert",
  title: "Course confidence survey",
  unitId: "aif-unit-responsible",
  tags: [AIF_CONCEPTS[1]],
  difficulty: "beginner",
  listedInBank: false,
  ...bankIdentity({
    numericId: 1847,
    lastEditedLabel: "Aug 28, 2026",
    usedInQuizzes: [SEEDED_QUIZ],
  }),
  reveal: { enabled: false },
  updatedAt: Date.now(),
  item: {
    kind: "multi",
    content: {
      prompt: "How confident do you feel explaining model bias to a teammate?",
      surveyMode: true,
      answers: [
        { id: "a", text: "Very confident" },
        { id: "b", text: "Somewhat confident" },
        { id: "c", text: "Not confident yet" },
      ],
    },
  },
};

/** Kept for legacy routes; not listed or seeded in the P0 exam. */
export const mockFillInBlankBankQuestion: QuestionItem = {
  bankId: "q-aif-fib-1",
  courseId: "aif-cert",
  title: "Feature vs label",
  unitId: "aif-unit-supervised",
  tags: [AIF_CONCEPTS[2]],
  points: 1,
  listedInBank: false,
  ...bankIdentity({
    numericId: 1848,
    lastEditedLabel: "Aug 20, 2026",
    usedInQuizzes: [],
  }),
  reveal: {
    enabled: true,
    explanation:
      "Features are the input measurements; the label is the value the model is trained to predict.",
  },
  updatedAt: Date.now(),
  item: {
    kind: "fillInBlank",
    content: {
      prompt: "Complete the sentence about supervised learning data.",
      segments: [
        { type: "text", text: "In a labeled dataset, each example has input " },
        { type: "blank", blankId: "blank-1" },
        { type: "text", text: " and a target " },
        { type: "blank", blankId: "blank-2" },
        { type: "text", text: "." },
      ],
      blanks: [
        {
          id: "blank-1",
          placeholder: "inputs",
          acceptedAnswers: ["features", "feature values", "predictors"],
        },
        {
          id: "blank-2",
          placeholder: "output",
          acceptedAnswers: ["label", "labels", "target", "targets"],
        },
      ],
    },
  },
};

/** Kept for legacy routes; not listed or seeded in the P0 exam. */
export const mockParsonsBankQuestion: QuestionItem = {
  bankId: "q-aif-parsons-1",
  courseId: "aif-cert",
  title: "Training loop order",
  unitId: "aif-unit-models",
  tags: [AIF_CONCEPTS[0]],
  points: 2,
  listedInBank: false,
  ...bankIdentity({
    numericId: 1849,
    lastEditedLabel: "Aug 20, 2026",
    usedInQuizzes: [],
  }),
  reveal: {
    enabled: true,
    explanation:
      "Compute predictions, measure loss, then update weights from that error.",
  },
  updatedAt: Date.now(),
  item: {
    kind: "dragDrop",
    content: {
      prompt: "Arrange the steps of one training iteration in the correct order.",
      mode: "parsons",
      blocks: [
        { id: "b1", text: "Compute predictions from current weights" },
        { id: "b2", text: "Calculate loss against the true labels" },
        { id: "b3", text: "Update weights to reduce the loss" },
      ],
      correctOrder: ["b1", "b2", "b3"],
    },
  },
};

export const mockBiasVarianceBankQuestion: QuestionItem = {
  bankId: "q-aif-multi-4",
  courseId: "aif-cert",
  title: "High variance symptom",
  unitId: "aif-unit-supervised",
  tags: [AIF_CONCEPTS[0]],
  points: 1,
  ...bankIdentity({
    numericId: 1850,
    lastEditedLabel: "Sep 5, 2026",
    usedInQuizzes: [EXAM_QUIZ],
  }),
  reveal: {
    enabled: true,
    explanation:
      "High variance means the model is sensitive to the training sample and generalizes poorly.",
  },
  teacherNote:
    "Contrast with option B (high bias) when reviewing — both low is underfitting, not variance.",
  updatedAt: Date.now(),
  item: {
    kind: "multi",
    content: {
      prompt: "Which outcome most strongly suggests a model has high variance?",
      answers: [
        {
          id: "a",
          text: "Training accuracy is high, but accuracy on new data is much lower.",
        },
        {
          id: "b",
          text: "Training and test accuracy are both low.",
        },
        {
          id: "c",
          text: "The model uses fewer features than the dataset provides.",
        },
        {
          id: "d",
          text: "Training takes fewer epochs than expected.",
        },
      ],
      correctAnswerId: "a",
    },
  },
};

export const mockFairnessBankQuestion: QuestionItem = {
  bankId: "q-aif-multi-3",
  courseId: "aif-cert",
  title: "Fairness evaluation",
  unitId: "aif-unit-responsible",
  tags: [AIF_CONCEPTS[1]],
  points: 1,
  ...bankIdentity({
    numericId: 1851,
    lastEditedLabel: "Sep 5, 2026",
    usedInQuizzes: [EXAM_QUIZ],
  }),
  reveal: {
    enabled: true,
    explanation:
      "Comparing error rates across groups is a common fairness check; overall accuracy can hide disparities.",
  },
  teacherNote:
    "Ties into the hiring-model case study from Lesson 10 — reference the group error-rate table there.",
  updatedAt: Date.now(),
  item: {
    kind: "multi",
    content: {
      prompt: "A 92% accurate hiring model",
      description:
        "A screening model is 92% accurate on the held-out set. The team is ready to ship.\n\nWhat is the best next fairness check before they deploy?",
      answers: [
        {
          id: "a",
          text: "Compare false-positive and false-negative rates across applicant groups.",
        },
        {
          id: "b",
          text: "Increase the training set size until overall accuracy reaches 99%.",
        },
        {
          id: "c",
          text: "Remove the model card so applicants cannot inspect the system.",
        },
        {
          id: "d",
          text: "Switch from a neural net to a linear model without measuring group error.",
        },
      ],
      correctAnswerId: "a",
    },
  },
};

export const mockTwoCorrectBankQuestion: QuestionItem = {
  bankId: "q-aif-multi-two",
  courseId: "aif-cert",
  title: "Two correct accountability checks",
  unitId: "aif-unit-responsible",
  tags: [AIF_CONCEPTS[1]],
  ...bankIdentity({
    numericId: 1904,
    questionKey: "c21a9e44-0d18-4f7b-a6c3-11b8d2e01904",
    lastEditedLabel: "Sep 7, 2026",
    usedInQuizzes: [CFU_ACCOUNTABILITY],
  }),
  listedInBank: true,
  reveal: {
    enabled: true,
    explanation:
      "Documentation and group error checks are both required. Overall accuracy alone can hide harm.",
  },
  teacherNote:
    "Requires exactly two selections; students who pick only the model card are halfway there.",
  updatedAt: Date.now(),
  item: {
    kind: "multi",
    content: {
      prompt:
        "Which two actions are required before deploying a hiring model?",
      selectionMode: "multiple",
      correctAnswerIds: ["a", "c"],
      requiredSelectionCount: 2,
      maxSelectionCount: 2,
      answers: [
        { id: "a", text: "Compare error rates across applicant groups." },
        { id: "b", text: "Publish overall accuracy and stop there." },
        { id: "c", text: "Document known failure modes in a model card." },
        { id: "d", text: "Hide the training data sources from reviewers." },
      ],
    },
  },
};

export const mockFacialRecognitionBankQuestion: QuestionItem = {
  bankId: "q-aif-multi-facial",
  courseId: "aif-cert",
  title: "Facial recognition risk",
  unitId: "aif-unit-models",
  tags: [AIF_CONCEPTS[1]],
  ...bankIdentity({
    numericId: 1910,
    lastEditedLabel: "Sep 5, 2026",
    usedInQuizzes: [EXAM_QUIZ],
  }),
  listedInBank: true,
  reveal: {
    enabled: true,
    explanation:
      "Uneven accuracy across groups is a documented risk of facial recognition in public settings.",
  },
  teacherNote:
    "Good discussion starter for the civic-tech debate; ask for a real deployment example.",
  updatedAt: Date.now(),
  item: {
    kind: "multi",
    content: {
      prompt: "Should the city pause?",
      description:
        "A city proposes cameras that match faces in parks and transit hubs to a watch list.\n\nWhat is the strongest reason to pause the rollout?",
      answers: [
        {
          id: "a",
          text: "The system is likely to misidentify some groups more often than others.",
        },
        {
          id: "b",
          text: "Cameras cannot store images without a larger hard drive.",
        },
        {
          id: "c",
          text: "Facial recognition only works indoors.",
        },
        {
          id: "d",
          text: "The model cannot be updated after the first install.",
        },
      ],
      correctAnswerId: "a",
    },
  },
};

export const mockTradeoffBankQuestion: QuestionItem = {
  bankId: "q-aif-multi-tradeoff",
  courseId: "aif-cert",
  title: "Accuracy vs privacy tradeoff",
  unitId: "aif-unit-models",
  tags: [AIF_CONCEPTS[1], AIF_CONCEPTS[2]],
  ...bankIdentity({
    numericId: 1911,
    lastEditedLabel: "Sep 5, 2026",
    usedInQuizzes: [EXAM_QUIZ],
  }),
  listedInBank: true,
  reveal: {
    enabled: true,
    explanation:
      "Collecting more personal data can raise accuracy while increasing privacy harm. The tradeoff should be explicit.",
  },
  teacherNote:
    "Accept privacy, consent, or data-minimization phrasings when discussing — the point is naming a human cost.",
  updatedAt: Date.now(),
  item: {
    kind: "multi",
    content: {
      prompt:
        "A team can raise model accuracy by collecting more personal data. What tradeoff should they name first?",
      answers: [
        {
          id: "a",
          text: "Privacy risk for the people whose data is collected.",
        },
        {
          id: "b",
          text: "Whether the programming language is popular enough.",
        },
        {
          id: "c",
          text: "How many GPUs the office currently owns.",
        },
        {
          id: "d",
          text: "Whether the logo uses the brand color.",
        },
      ],
      correctAnswerId: "a",
    },
  },
};

export const mockHumanInTheLoopBankQuestion: QuestionItem = {
  bankId: "q-aif-fr-human-loop",
  courseId: "aif-cert",
  title: "Human in the loop",
  unitId: "aif-unit-models",
  tags: [AIF_CONCEPTS[1]],
  ...bankIdentity({
    numericId: 1912,
    lastEditedLabel: "Sep 4, 2026",
    usedInQuizzes: [EXAM_QUIZ],
  }),
  listedInBank: true,
  reveal: {
    enabled: true,
    explanation:
      "A human review step is most useful when the cost of an automated error is high.",
  },
  teacherNote:
    "Look for a high-stakes example plus a why; medical, lending, and justice examples all work.",
  updatedAt: Date.now(),
  item: {
    kind: "freeResponse",
    content: {
      prompt: "When is automation not enough?",
      description:
        "Some automated decisions are cheap to reverse. Others change someone’s housing, credit, or medical care.\n\nGive one example of a decision that should keep a human in the loop, and say why automation alone is not enough.",
      placeholder: "A human should review… because…",
      allowFileUpload: true,
      minCharacters: 40,
      revealAnswerEnabled: true,
      teacherAnswer: {
        exemplar:
          "A loan denial should be reviewed by a person because an automated error can block someone’s housing or education, and the applicant deserves a path to appeal.",
      },
    },
  },
};

export const mockFeatureLabelBankQuestion: QuestionItem = {
  bankId: "q-aif-multi-features",
  courseId: "aif-cert",
  title: "Feature vs label",
  unitId: "aif-unit-supervised",
  tags: [AIF_CONCEPTS[2]],
  points: 1,
  ...bankIdentity({
    numericId: 1916,
    lastEditedLabel: "Sep 3, 2026",
    usedInQuizzes: [EXAM_QUIZ],
  }),
  listedInBank: true,
  reveal: {
    enabled: true,
    explanation:
      "Features are the input measurements; the label is the value the model is trained to predict.",
  },
  teacherNote:
    "Vocabulary check — quick verbal recap of features vs labels clears most wrong answers here.",
  updatedAt: Date.now(),
  item: {
    kind: "multi",
    content: {
      prompt: "Name the pieces of this row",
      description: [
        "Each training example is a row the model can see, plus a target it is trying to predict:",
        "",
        "```python",
        "example = {",
        '    "hours_studied": 6,',
        '    "practice_tests": 2,',
        '    "passed_exam": True,',
        "}",
        "```",
        "",
        "Which values are features, and which is the label?",
      ].join("\n"),
      answers: [
        {
          id: "a",
          text: "`hours_studied` and `practice_tests` are features; `passed_exam` is the label.",
        },
        {
          id: "b",
          text: "`passed_exam` is a feature; the hours and tests are labels.",
        },
        {
          id: "c",
          text: "All three fields are labels.",
        },
        {
          id: "d",
          text: "All three fields are features.",
        },
      ],
      correctAnswerId: "a",
    },
  },
};

export const mockTrainingLoopBankQuestion: QuestionItem = {
  bankId: "q-aif-match-training",
  courseId: "aif-cert",
  title: "Training loop order",
  unitId: "aif-unit-models",
  tags: [AIF_CONCEPTS[0]],
  points: 2,
  ...bankIdentity({
    numericId: 1922,
    lastEditedLabel: "Sep 3, 2026",
    usedInQuizzes: [EXAM_QUIZ],
  }),
  listedInBank: true,
  reveal: {
    enabled: true,
    explanation:
      "Compute predictions, measure loss, then update weights from that error.",
  },
  teacherNote:
    "If the order flips, re-run the training-loop animation from Lesson 8 before retrying.",
  updatedAt: Date.now(),
  item: {
    kind: "match",
    content: {
      prompt: "Order the steps in this loop",
      description: [
        "Here is one pass over a batch:",
        "",
        "```python",
        "for batch in loader:",
        "    predictions = model(batch.x)",
        "    loss = criterion(predictions, batch.y)",
        "    optimizer.zero_grad()",
        "    loss.backward()",
        "    optimizer.step()",
        "```",
        "",
        "Match each step to its place in one training iteration. Ignore `zero_grad` — it only resets gradients before the update.",
      ].join("\n"),
      terms: [
        { id: "t1", text: "First" },
        { id: "t2", text: "Second" },
        { id: "t3", text: "Third" },
      ],
      prompts: [
        {
          id: "p1",
          text: "Compute predictions from current weights",
          correctTermId: "t1",
        },
        {
          id: "p2",
          text: "Calculate loss against the true labels",
          correctTermId: "t2",
        },
        {
          id: "p3",
          text: "Update weights to reduce the loss",
          correctTermId: "t3",
        },
      ],
    },
  },
};

export const mockAifCourseBank: AssessmentCourseBank = {
  courseId: "aif-cert",
  courseName: "AI Foundations",
  domains: AIF_CONCEPTS,
  units: AIF_UNITS,
  questions: [
    mockMultiBankQuestion,
    mockMultiSelectBankQuestion,
    mockCodeRefBankQuestion,
    mockFreeResponseBankQuestion,
    mockMatchBankQuestion,
    mockSurveyBankQuestion,
    mockFillInBlankBankQuestion,
    mockParsonsBankQuestion,
    mockFeatureLabelBankQuestion,
    mockTrainingLoopBankQuestion,
    mockBiasVarianceBankQuestion,
    mockFairnessBankQuestion,
    mockTwoCorrectBankQuestion,
    mockFacialRecognitionBankQuestion,
    mockTradeoffBankQuestion,
    mockHumanInTheLoopBankQuestion,
  ],
};

export const mockWebDevCourseBank: AssessmentCourseBank = {
  courseId: "web-dev-fundamentals",
  courseName: "Web Development Fundamentals",
  domains: WEB_CONCEPTS,
  units: WEB_UNITS,
  questions: [
    {
      bankId: "q-web-multi-1",
      courseId: "web-dev-fundamentals",
      title: "Semantic HTML elements",
      unitId: "web-unit-html",
      tags: [WEB_CONCEPTS[0]],
      difficulty: "beginner",
      ...bankIdentity({
        numericId: 2001,
        lastEditedLabel: "Sep 1, 2026",
        usedInQuizzes: [WEB_CHECKPOINT],
      }),
      reveal: {
        enabled: true,
        explanation: "`<article>` groups self-contained content.",
      },
      updatedAt: Date.now(),
      item: {
        kind: "multi",
        content: {
          prompt: "Which element wraps this post?",
          description: [
            "Semantic HTML tells the browser *what* a block of content is, not just how it looks:",
            "",
            "```html",
            "<main>",
            "  <????>",
            "    <h1>Why semantic HTML matters</h1>",
            "    <p>A standalone essay you could syndicate.</p>",
            "  </????>",
            "</main>",
            "```",
            "",
            "Which element best fills the `????` wrapper?",
          ].join("\n"),
          answers: [
            { id: "a", text: "<article>" },
            { id: "b", text: "<span>" },
            { id: "c", text: "<div>" },
            { id: "d", text: "<section>" },
          ],
          correctAnswerId: "a",
        },
      },
    },
    {
      bankId: "q-web-fr-1",
      courseId: "web-dev-fundamentals",
      title: "Flexbox vs grid",
      unitId: "web-unit-css",
      tags: [WEB_CONCEPTS[1]],
      difficulty: "intermediate",
      ...bankIdentity({
        numericId: 2002,
        lastEditedLabel: "Sep 1, 2026",
        usedInQuizzes: [WEB_CHECKPOINT],
      }),
      reveal: { enabled: true },
      updatedAt: Date.now(),
      item: {
        kind: "freeResponse",
        content: {
          prompt: "Flexbox or Grid?",
          description: [
            "A toolbar is one row of buttons that should stay in a line and wrap on small screens:",
            "",
            "```css",
            ".toolbar {",
            "  display: ???;",
            "  gap: 8px;",
            "}",
            "```",
            "",
            "When would you choose Flexbox over CSS Grid for a layout like this?",
          ].join("\n"),
          placeholder: "Flexbox is a better fit when…",
          minCharacters: 40,
        },
      },
    },
  ],
};

export const DEFAULT_COURSE_BANKS: AssessmentCourseBank[] = [
  mockAifCourseBank,
  mockWebDevCourseBank,
];
