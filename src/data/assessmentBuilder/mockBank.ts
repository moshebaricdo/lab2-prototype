import type {
  AssessmentCourseBank,
  CourseUnit,
  DomainTag,
  QuestionItem,
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

export const mockMultiBankQuestion: QuestionItem = {
  bankId: "q-aif-multi-1",
  courseId: "aif-cert",
  title: "Loss function purpose",
  unitId: "aif-unit-supervised",
  tags: [AIF_CONCEPTS[0]],
  difficulty: "intermediate",
  reveal: {
    enabled: true,
    explanation:
      "A loss function quantifies prediction error so training can minimize it.",
  },
  updatedAt: Date.now(),
  item: {
    kind: "multi",
    content: {
      prompt:
        "During supervised learning, what is the primary purpose of a loss function?",
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
  reveal: {
    enabled: true,
    explanation: "Bias audits and documentation support accountable AI systems.",
  },
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
  reveal: {
    enabled: true,
    explanation: "The weighted sum is positive, so predict returns 1.",
  },
  codePanel: {
    files: [
      {
        name: "threshold_classifier.py",
        language: "python",
        content: [
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
        ].join("\n"),
      },
    ],
    stemPosition: "inline",
    defaultWidthRatio: 0.5,
  },
  updatedAt: Date.now(),
  item: {
    kind: "multi",
    content: {
      prompt: "What does the program print?",
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
  reveal: {
    enabled: true,
    explanation:
      "Strong training performance with poor generalization indicates overfitting.",
  },
  updatedAt: Date.now(),
  item: {
    kind: "freeResponse",
    content: {
      prompt:
        "In your own words, explain what overfitting means and name one strategy to reduce it.",
      placeholder: "Overfitting happens when… One way to reduce it is…",
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
  reveal: { enabled: true },
  updatedAt: Date.now(),
  item: {
    kind: "match",
    content: {
      prompt: "Match each dataset role to its purpose.",
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

export const mockFillInBlankBankQuestion: QuestionItem = {
  bankId: "q-aif-fib-1",
  courseId: "aif-cert",
  title: "Feature vs label",
  unitId: "aif-unit-supervised",
  tags: [AIF_CONCEPTS[2]],
  points: 1,
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

export const mockParsonsBankQuestion: QuestionItem = {
  bankId: "q-aif-parsons-1",
  courseId: "aif-cert",
  title: "Training loop order",
  unitId: "aif-unit-models",
  tags: [AIF_CONCEPTS[0]],
  points: 2,
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
  reveal: {
    enabled: true,
    explanation:
      "High variance means the model is sensitive to the training sample and generalizes poorly.",
  },
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
  reveal: {
    enabled: true,
    explanation:
      "Comparing error rates across groups is a common fairness check; overall accuracy can hide disparities.",
  },
  updatedAt: Date.now(),
  item: {
    kind: "multi",
    content: {
      prompt:
        "A hiring model is 92% accurate overall. What is the best next fairness check?",
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
    mockBiasVarianceBankQuestion,
    mockFairnessBankQuestion,
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
      reveal: {
        enabled: true,
        explanation: "`<article>` groups self-contained content.",
      },
      updatedAt: Date.now(),
      item: {
        kind: "multi",
        content: {
          prompt: "Which element best wraps a standalone blog post?",
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
      reveal: { enabled: true },
      updatedAt: Date.now(),
      item: {
        kind: "freeResponse",
        content: {
          prompt: "When would you choose Flexbox over CSS Grid for a layout?",
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
