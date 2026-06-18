import type { AssessmentCourseBank, QuestionItem } from "../../types/assessmentBuilder";

const AIF_DOMAINS = [
  { id: "domain-ml", label: "Machine Learning Fundamentals" },
  { id: "domain-ethics", label: "AI Ethics & Safety" },
  { id: "domain-data", label: "Data & Features" },
];

const WEB_DOMAINS = [
  { id: "domain-html", label: "HTML & Structure" },
  { id: "domain-css", label: "CSS & Layout" },
];

export const mockMultiBankQuestion: QuestionItem = {
  bankId: "q-aif-multi-1",
  courseId: "aif-cert",
  title: "Loss function purpose",
  tags: [AIF_DOMAINS[0]],
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
  tags: [AIF_DOMAINS[1]],
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
  tags: [AIF_DOMAINS[0], AIF_DOMAINS[2]],
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
  tags: [AIF_DOMAINS[0]],
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
  tags: [AIF_DOMAINS[2]],
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

export const mockSurveyBankQuestion: QuestionItem = {
  bankId: "q-aif-survey-1",
  courseId: "aif-cert",
  title: "Course confidence survey",
  tags: [AIF_DOMAINS[1]],
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

export const mockAifCourseBank: AssessmentCourseBank = {
  courseId: "aif-cert",
  courseName: "AI Foundations Certification",
  domains: AIF_DOMAINS,
  questions: [
    mockMultiBankQuestion,
    mockMultiSelectBankQuestion,
    mockCodeRefBankQuestion,
    mockFreeResponseBankQuestion,
    mockMatchBankQuestion,
    mockSurveyBankQuestion,
  ],
};

export const mockWebDevCourseBank: AssessmentCourseBank = {
  courseId: "web-dev-fundamentals",
  courseName: "Web Development Fundamentals",
  domains: WEB_DOMAINS,
  questions: [
    {
      bankId: "q-web-multi-1",
      courseId: "web-dev-fundamentals",
      title: "Semantic HTML elements",
      tags: [WEB_DOMAINS[0]],
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
      tags: [WEB_DOMAINS[1]],
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
