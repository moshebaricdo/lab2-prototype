import type { LevelGroupFlowPayload, LevelGroupQuestionBlock } from "./levelGroup";

const demoQuizSteps: LevelGroupQuestionBlock[] = [
  {
    kind: "multi",
    blockId: "demo-m1",
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
            "",
            "features = [0.8, 0.3]",
            "weights = [2.0, -1.5]",
            "bias = -0.5",
            "",
            "result = predict(features, weights, bias)",
            'print(f"{result:.2f}")',
          ].join("\n"),
        },
      ],
      stemPosition: "inline",
      defaultWidthRatio: 0.5,
    },
    question: {
      id: "demo-multi-1",
      prompt:
        "Trace the program and determine what the final print statement outputs.",
      answers: [
        {
          id: "a",
          contentBlocks: [{ type: "code", code: "0.00" }],
        },
        {
          id: "b",
          contentBlocks: [{ type: "code", code: "1.00" }],
        },
        {
          id: "c",
          contentBlocks: [{ type: "code", code: "0.65" }],
        },
        {
          id: "d",
          contentBlocks: [{ type: "code", code: "2.00" }],
        },
      ],
      correctAnswerId: "b",
    },
  },
  {
    kind: "freeResponse",
    blockId: "demo-fr1",
    question: {
      id: "demo-free-1",
      prompt:
        "In your own words, explain what overfitting means when training a machine learning model. Include one strategy a developer can use to reduce it.",
      placeholder:
        "Overfitting happens when… One way to reduce it is…",
      minCharacters: 60,
      revealAnswerEnabled: true,
      teacherAnswer: {
        exemplar:
          "Overfitting happens when a model learns patterns that are specific to the training data—including noise—so it performs well on training examples but poorly on new data. One way to reduce it is to hold out a validation set and stop training (or choose simpler models) when validation performance stops improving.",
        rubricCriteria: [
          "Defines overfitting as strong training performance but poor generalization.",
          "Names at least one reasonable mitigation (validation split, regularization, simpler model, more data, etc.).",
        ],
      },
    },
  },
  {
    kind: "match",
    blockId: "demo-match1",
    question: {
      id: "demo-match-1",
      prompt: "Match each machine learning term to its role in the model development process.",
      terms: [
        { id: "t3", text: "Test set" },
        { id: "t4", text: "Feature" },
        { id: "t1", text: "Training set" },
        { id: "t2", text: "Validation set" },
      ],
      prompts: [
        {
          id: "p1",
          text: "Examples used to adjust the model's learned parameters (weights).",
          correctTermId: "t1",
        },
        {
          id: "p2",
          text: "Held-out examples used to compare design choices before final evaluation.",
          correctTermId: "t2",
        },
        {
          id: "p3",
          text: "Unseen examples reserved for a final, unbiased performance check.",
          correctTermId: "t3",
        },
        {
          id: "p4",
          text: "A measurable input the model uses to make a prediction.",
          correctTermId: "t4",
        },
      ],
    },
  },
  {
    kind: "multi",
    blockId: "demo-m2",
    question: {
      id: "demo-multi-2",
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
];

/** Stepped quiz demo for screencasts — one of each question type in AI/ML curriculum order. */
export const mockDemoQuizLevelGroup: LevelGroupFlowPayload = {
  level: {
    id: 42100,
    name: "Unit Checkpoint",
    type: "LevelGroup",
    metadata: {
      lessonName: "Machine Learning",
      assessmentName: "ML Foundations Checkpoint",
      levelPosition: 5,
      totalLevelsInScript: 8,
    },
    intro: {
      overviewContent: `This checkpoint covers core ideas from the Introduction to Machine Learning unit: reading simple prediction code, explaining model behavior, matching key vocabulary, and recognizing how models learn from labeled data.

You will answer four questions—a multiple-choice item with a code reference panel, a short written response, a four-item matching activity, and a final multiple-choice question. Read each item carefully before selecting Next.

When you are ready, choose Begin assessment to start. The timer for this attempt begins at that moment.`,
      timeMinutes: 20,
    },
    steps: demoQuizSteps,
  },
};
