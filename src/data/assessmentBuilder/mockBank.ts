import type {
  AssessmentCourseBank,
  CourseUnit,
  DomainTag,
  QuestionItem,
  QuestionUsageRow,
  QuestionVersionRow,
  StandardCategory,
  StandardFramework,
} from "../../types/assessmentBuilder";

/**
 * AI-901 (Microsoft Azure AI Fundamentals) skills measured, as of Apr 15, 2026.
 * Framework → category (skill area) → standard (functional group), matching
 * the prod standards model. Labels are shortened from Microsoft's wording so
 * they fit results tables; `description` and `skills` keep the exact wording.
 */
const AI901: StandardFramework = {
  id: "ai-901",
  shortLabel: "AI-901",
  label: "Microsoft Azure AI Fundamentals (AI-901)",
};
const AI901_CONCEPTS: StandardCategory = {
  id: "ai901-cat-concepts",
  code: "1",
  label: "Identify AI concepts and capabilities",
};
const AI901_FOUNDRY: StandardCategory = {
  id: "ai901-cat-foundry",
  code: "2",
  label: "Implement AI solutions by using Microsoft Foundry",
};

const AIF_CONCEPTS: DomainTag[] = [
  {
    id: "ai901-responsible",
    label: "Responsible AI principles",
    code: "AI-901 1.1",
    framework: AI901,
    category: AI901_CONCEPTS,
    description: "Describe principles of responsible AI",
    skills: [
      "Describe considerations for fairness in an AI solution",
      "Describe considerations for reliability and safety in an AI solution",
      "Describe considerations for privacy and security in an AI solution",
      "Describe considerations for inclusiveness in an AI solution",
      "Describe considerations for transparency in an AI solution",
      "Describe considerations for accountability in an AI solution",
    ],
  },
  {
    id: "ai901-models",
    label: "AI models and configuration",
    code: "AI-901 1.2",
    framework: AI901,
    category: AI901_CONCEPTS,
    description: "Identify AI model components and configurations",
    skills: [
      "Describe how generative AI models work",
      "Identify an appropriate AI model, based on capabilities",
      "Identify appropriate model deployment options and configuration parameters",
    ],
  },
  {
    id: "ai901-workloads",
    label: "AI workloads",
    code: "AI-901 1.3",
    framework: AI901,
    category: AI901_CONCEPTS,
    description: "Identify AI workloads",
    skills: [
      "Identify scenarios for common AI workloads, including generative and agentic AI, text analysis, speech, computer vision, and information extraction",
      "Describe common text analysis techniques, including keyword extraction, entity detection, sentiment analysis, and summarization",
      "Identify features and capabilities of speech recognition and speech synthesis",
      "Identify features and capabilities of computer vision and image-generation models",
      "Identify techniques to extract information from text, images, audio, and videos",
    ],
  },
  {
    id: "ai901-genai-agents",
    label: "Generative AI apps and agents",
    code: "AI-901 2.1",
    framework: AI901,
    category: AI901_FOUNDRY,
    description: "Implement generative AI apps and agents by using Foundry",
    skills: [
      "Create effective system and user prompts for generative AI models",
      "Deploy a model and interact with it in the Foundry portal",
      "Create a lightweight chat client application by using the Foundry SDK",
      "Create and test a single-agent solution in the Foundry portal",
      "Create a lightweight client application for an agent",
    ],
  },
  {
    id: "ai901-text-speech",
    label: "Text and speech solutions",
    code: "AI-901 2.2",
    framework: AI901,
    category: AI901_FOUNDRY,
    description: "Implement AI solutions for text and speech by using Foundry",
    skills: [
      "Build a lightweight application that includes text analysis",
      "Respond to spoken prompts by using a deployed multimodal model",
      "Build a lightweight application by using Azure Speech in Foundry Tools",
    ],
  },
  {
    id: "ai901-vision",
    label: "Vision and image generation",
    code: "AI-901 2.3",
    framework: AI901,
    category: AI901_FOUNDRY,
    description:
      "Implement AI solutions with computer vision and image-generation capabilities by using Foundry",
    skills: [
      "Interpret visual input in prompts by using a deployed multimodal model",
      "Create new visual outputs by using generative models",
      "Build a lightweight application that includes vision capabilities",
    ],
  },
  {
    id: "ai901-extraction",
    label: "Information extraction",
    code: "AI-901 2.4",
    framework: AI901,
    category: AI901_FOUNDRY,
    description: "Implement AI solutions for information extraction by using Foundry",
    skills: [
      "Extract information from documents and forms by using Azure Content Understanding in Foundry Tools",
      "Extract information from images by using Content Understanding",
      "Extract information from audio and video by using Content Understanding",
      "Build a lightweight application with information extraction capabilities by using Content Understanding",
    ],
  },
];

const [
  STD_RESPONSIBLE,
  STD_MODELS,
  STD_WORKLOADS,
  STD_GENAI_AGENTS,
  STD_TEXT_SPEECH,
  STD_VISION,
  STD_EXTRACTION,
] = AIF_CONCEPTS;

const AIF_UNITS: CourseUnit[] = [
  {
    id: "aif-unit-concepts",
    label: "Unit 1 · Responsible AI and models",
    conceptIds: [STD_RESPONSIBLE.id, STD_MODELS.id],
  },
  {
    id: "aif-unit-workloads",
    label: "Unit 2 · AI workloads",
    conceptIds: [STD_WORKLOADS.id],
  },
  {
    id: "aif-unit-foundry",
    label: "Unit 3 · Building with Microsoft Foundry",
    conceptIds: [
      STD_GENAI_AGENTS.id,
      STD_TEXT_SPEECH.id,
      STD_VISION.id,
      STD_EXTRACTION.id,
    ],
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
  quizTitle: "AI-901 Practice Exam",
  courseUnit: "Building AI Systems · Unit 3",
  status: "live",
};

const PRACTICE_QUIZ: QuestionUsageRow = {
  quizTitle: "Unit 3 practice",
  courseUnit: "Building AI Systems · Unit 3",
  status: "unpublished",
};

const SEEDED_QUIZ: QuestionUsageRow = {
  quizTitle: "Building AI Systems practice quiz",
  courseUnit: "Building AI Systems · Unit 1",
  status: "unpublished",
};

const CFU_ACCOUNTABILITY: QuestionUsageRow = {
  quizTitle: "Unit 1 CFU · Accountability",
  courseUnit: "Building AI Systems · Unit 1",
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
  title: "Temperature setting",
  unitId: "aif-unit-concepts",
  tags: [STD_MODELS],
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
        usedIn: "AI-900 Practice Exam (2025)",
        lastEdited: "Aug 12, 2026",
      },
    ],
  }),
  listedInBank: true,
  reveal: {
    enabled: true,
    explanation:
      "Temperature controls randomness. A low value makes the model pick the most likely tokens, so answers are more focused and repeatable.",
  },
  updatedAt: Date.now(),
  item: {
    kind: "multi",
    content: {
      prompt: "What does lowering the temperature do?",
      description: [
        "A student app sends chat requests to a model deployed in Microsoft Foundry:",
        "",
        "```python",
        "response = client.chat.completions.create(",
        '    model="tutor-deployment",',
        "    messages=messages,",
        "    temperature=0.2,",
        ")",
        "```",
        "",
        "The team lowered `temperature` from 1.0 to 0.2. What effect should they expect?",
      ].join("\n"),
      answers: [
        {
          id: "a",
          text: "Responses become more focused and consistent from one request to the next.",
        },
        {
          id: "b",
          text: "Responses are cut off after a shorter maximum length.",
        },
        {
          id: "c",
          text: "The model switches to a smaller, cheaper version of itself.",
        },
        {
          id: "d",
          text: "The model stops using the system message.",
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
  unitId: "aif-unit-concepts",
  tags: [STD_RESPONSIBLE],
  difficulty: "beginner",
  ...bankIdentity({
    numericId: 1843,
    lastEditedLabel: "Sep 4, 2026",
    usedInQuizzes: [EXAM_QUIZ, SEEDED_QUIZ],
  }),
  reveal: {
    enabled: true,
    explanation:
      "Testing with assistive technology supports inclusiveness, stating limits supports transparency, and a named owner supports accountability. Hiding the AI breaks transparency.",
  },
  updatedAt: Date.now(),
  item: {
    kind: "multi",
    content: {
      prompt:
        "A city is launching a chatbot for its benefits office. Which practices follow Microsoft’s responsible AI principles? Select all that apply.",
      selectionMode: "multiple",
      correctAnswerIds: ["a", "c", "d"],
      answers: [
        { id: "a", text: "Test the chatbot with people who use screen readers." },
        { id: "b", text: "Don’t mention that residents are talking to an AI." },
        { id: "c", text: "Tell residents what the chatbot can’t help with." },
        { id: "d", text: "Name a team that reviews complaints and can turn it off." },
      ],
    },
  },
};

export const mockCodeRefBankQuestion: QuestionItem = {
  bankId: "q-aif-code-1",
  courseId: "aif-cert",
  title: "Trace a chat client",
  unitId: "aif-unit-foundry",
  tags: [STD_GENAI_AGENTS],
  difficulty: "advanced",
  ...bankIdentity({
    numericId: 1844,
    lastEditedLabel: "Sep 4, 2026",
    usedInQuizzes: [EXAM_QUIZ, SEEDED_QUIZ],
  }),
  reveal: {
    enabled: true,
    explanation:
      "One system message, plus a user and an assistant message for each call: 1 + 2 + 2 = 5. Keeping the history is what lets the model answer the follow-up.",
  },
  updatedAt: Date.now(),
  item: {
    kind: "multi",
    content: {
      prompt: "What does this program print?",
      description: [
        "This chat client talks to a model deployed in Microsoft Foundry. Trace it, then choose what `print` shows.",
        "",
        "```python",
        'messages = [{"role": "system", "content": "Answer in one word."}]',
        "",
        "def ask(question):",
        '    messages.append({"role": "user", "content": question})',
        "    reply = client.chat.completions.create(",
        "        model=DEPLOYMENT, messages=messages",
        "    )",
        "    answer = reply.choices[0].message.content",
        '    messages.append({"role": "assistant", "content": answer})',
        "    return answer",
        "",
        'ask("Capital of France?")',
        'ask("And of Spain?")',
        "print(len(messages))",
        "```",
      ].join("\n"),
      answers: [
        { id: "a", text: "3" },
        { id: "b", text: "5" },
        { id: "c", text: "4" },
        { id: "d", text: "2" },
      ],
      correctAnswerId: "b",
    },
  },
};

export const mockFreeResponseBankQuestion: QuestionItem = {
  bankId: "q-aif-fr-1",
  courseId: "aif-cert",
  title: "Choose a model for the task",
  unitId: "aif-unit-concepts",
  tags: [STD_MODELS],
  difficulty: "beginner",
  ...bankIdentity({
    numericId: 1845,
    lastEditedLabel: "Sep 4, 2026",
    usedInQuizzes: [EXAM_QUIZ, PRACTICE_QUIZ, SEEDED_QUIZ],
  }),
  reveal: {
    enabled: true,
    explanation:
      "Photos need a model that accepts image input. A low temperature keeps factual answers consistent.",
  },
  updatedAt: Date.now(),
  item: {
    kind: "freeResponse",
    content: {
      prompt:
        "A science teacher wants an app that answers questions about photos of lab equipment. What kind of model should they deploy, and what is one setting you would choose? Explain why.",
      placeholder: "I would deploy… because… I would set…",
      allowFileUpload: true,
      minCharacters: 60,
      revealAnswerEnabled: true,
      teacherAnswer: {
        exemplar:
          "A multimodal model that accepts images, because a text-only model can’t see the photo. I would set a low temperature so answers about the equipment stay factual and consistent.",
        rubricCriteria: [
          "Chooses a model whose capabilities fit the task (accepts image input).",
          "Names a deployment option or parameter and explains the choice.",
        ],
      },
    },
  },
};

export const mockMatchBankQuestion: QuestionItem = {
  bankId: "q-aif-match-1",
  courseId: "aif-cert",
  title: "Text analysis techniques",
  unitId: "aif-unit-workloads",
  tags: [STD_WORKLOADS],
  difficulty: "intermediate",
  ...bankIdentity({
    numericId: 1846,
    lastEditedLabel: "Sep 4, 2026",
    usedInQuizzes: [EXAM_QUIZ, PRACTICE_QUIZ, SEEDED_QUIZ],
  }),
  reveal: {
    enabled: true,
    explanation:
      "Sentiment analysis judges opinion, entity detection finds named people, places, and dates, and summarization condenses long text.",
  },
  updatedAt: Date.now(),
  item: {
    kind: "match",
    content: {
      prompt: "Match each text analysis technique",
      description:
        "A news app runs several text analysis techniques on the articles and reviews it collects.\n\nMatch each technique to the job it does.",
      terms: [
        { id: "t1", text: "Sentiment analysis" },
        { id: "t2", text: "Entity detection" },
        { id: "t3", text: "Summarization" },
      ],
      prompts: [
        {
          id: "p1",
          text: "Decide whether a product review is positive or negative.",
          correctTermId: "t1",
        },
        {
          id: "p2",
          text: "Find the people, places, and dates an article mentions.",
          correctTermId: "t2",
        },
        {
          id: "p3",
          text: "Condense a long report into a short paragraph.",
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
  unitId: "aif-unit-foundry",
  tags: [STD_GENAI_AGENTS],
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
      prompt: "How confident do you feel deploying a model in the Foundry portal?",
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
  title: "Speech recognition vs synthesis",
  unitId: "aif-unit-workloads",
  tags: [STD_WORKLOADS],
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
      "Speech recognition turns audio into text; speech synthesis turns text into audio.",
  },
  updatedAt: Date.now(),
  item: {
    kind: "fillInBlank",
    content: {
      prompt: "Complete the sentence about speech capabilities.",
      segments: [
        { type: "text", text: "Speech " },
        { type: "blank", blankId: "blank-1" },
        { type: "text", text: " turns spoken audio into text, and speech " },
        { type: "blank", blankId: "blank-2" },
        { type: "text", text: " turns text into spoken audio." },
      ],
      blanks: [
        {
          id: "blank-1",
          placeholder: "audio → text",
          acceptedAnswers: ["recognition", "to text", "-to-text"],
        },
        {
          id: "blank-2",
          placeholder: "text → audio",
          acceptedAnswers: ["synthesis"],
        },
      ],
    },
  },
};

/** Kept for legacy routes; not listed or seeded in the P0 exam. */
export const mockParsonsBankQuestion: QuestionItem = {
  bankId: "q-aif-parsons-1",
  courseId: "aif-cert",
  title: "Text analysis app steps",
  unitId: "aif-unit-foundry",
  tags: [STD_TEXT_SPEECH],
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
      "Connect a client first, send the text, then read the result from the response.",
  },
  updatedAt: Date.now(),
  item: {
    kind: "dragDrop",
    content: {
      prompt: "Arrange the steps of a small sentiment analysis app in the correct order.",
      mode: "parsons",
      blocks: [
        { id: "b1", text: "Create a client with the resource endpoint and key" },
        { id: "b2", text: "Send the review text for sentiment analysis" },
        { id: "b3", text: "Read the sentiment label and confidence scores" },
      ],
      correctOrder: ["b1", "b2", "b3"],
    },
  },
};

export const mockBiasVarianceBankQuestion: QuestionItem = {
  bankId: "q-aif-multi-4",
  courseId: "aif-cert",
  title: "How language models generate text",
  unitId: "aif-unit-concepts",
  tags: [STD_MODELS],
  points: 1,
  ...bankIdentity({
    numericId: 1850,
    lastEditedLabel: "Sep 5, 2026",
    usedInQuizzes: [EXAM_QUIZ],
  }),
  reveal: {
    enabled: true,
    explanation:
      "A generative language model predicts the next token from everything so far, adds it, and repeats until the response is done.",
  },
  updatedAt: Date.now(),
  item: {
    kind: "multi",
    content: {
      prompt: "How does a generative language model write a response?",
      answers: [
        {
          id: "a",
          text: "It predicts a likely next token, one at a time, based on the text so far.",
        },
        {
          id: "b",
          text: "It looks up a stored answer that matches the question.",
        },
        {
          id: "c",
          text: "It copies the closest web page it saw during training.",
        },
        {
          id: "d",
          text: "It runs a rule a developer wrote for each topic.",
        },
      ],
      correctAnswerId: "a",
    },
  },
};

export const mockFairnessBankQuestion: QuestionItem = {
  bankId: "q-aif-multi-3",
  courseId: "aif-cert",
  title: "Extract data from forms",
  unitId: "aif-unit-foundry",
  tags: [STD_EXTRACTION],
  points: 1,
  ...bankIdentity({
    numericId: 1851,
    lastEditedLabel: "Sep 5, 2026",
    usedInQuizzes: [EXAM_QUIZ],
  }),
  reveal: {
    enabled: true,
    explanation:
      "Azure Content Understanding extracts fields from documents and forms into structured data.",
  },
  updatedAt: Date.now(),
  item: {
    kind: "multi",
    content: {
      prompt: "Thousands of paper intake forms",
      description:
        "A clinic has scanned thousands of paper intake forms. Staff want each patient’s name, date of birth, and allergies in a spreadsheet.\n\nWhich approach fits best?",
      answers: [
        {
          id: "a",
          text: "Use Azure Content Understanding to extract those fields from the scans.",
        },
        {
          id: "b",
          text: "Use speech recognition on recordings of staff reading each form aloud.",
        },
        {
          id: "c",
          text: "Use an image-generation model to create a clean copy of each form.",
        },
        {
          id: "d",
          text: "Run sentiment analysis on each form.",
        },
      ],
      correctAnswerId: "a",
    },
  },
};

export const mockTwoCorrectBankQuestion: QuestionItem = {
  bankId: "q-aif-multi-two",
  courseId: "aif-cert",
  title: "Two accountability checks",
  unitId: "aif-unit-concepts",
  tags: [STD_RESPONSIBLE],
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
      "Accountability means people own the system’s outcomes: a named owner, and a way for affected people to get a human review.",
  },
  updatedAt: Date.now(),
  item: {
    kind: "multi",
    content: {
      prompt:
        "Which two actions show accountability for a deployed AI system?",
      selectionMode: "multiple",
      correctAnswerIds: ["a", "c"],
      requiredSelectionCount: 2,
      maxSelectionCount: 2,
      answers: [
        { id: "a", text: "Name a team responsible for the system’s decisions." },
        { id: "b", text: "Publish overall accuracy and stop there." },
        { id: "c", text: "Let people report a problem and get a human review." },
        { id: "d", text: "Let the model vendor decide how the system is used." },
      ],
    },
  },
};

export const mockFacialRecognitionBankQuestion: QuestionItem = {
  bankId: "q-aif-multi-facial",
  courseId: "aif-cert",
  title: "Visual input in prompts",
  unitId: "aif-unit-foundry",
  tags: [STD_VISION],
  ...bankIdentity({
    numericId: 1910,
    lastEditedLabel: "Sep 5, 2026",
    usedInQuizzes: [EXAM_QUIZ],
  }),
  listedInBank: true,
  reveal: {
    enabled: true,
    explanation:
      "A multimodal model accepts images alongside text, so it can read the photo and follow the instruction in the same prompt.",
  },
  updatedAt: Date.now(),
  item: {
    kind: "multi",
    content: {
      prompt: "Turn a whiteboard photo into notes",
      description:
        "A student sends a deployed model a photo of a whiteboard with the prompt “Turn these notes into a bulleted list.” The model replies with an accurate list.\n\nWhat made this possible?",
      answers: [
        {
          id: "a",
          text: "The model is multimodal, so it reads the image and the text instruction together.",
        },
        {
          id: "b",
          text: "The model converted the image to audio, then transcribed it.",
        },
        {
          id: "c",
          text: "An image-generation model drew a new picture of the notes.",
        },
        {
          id: "d",
          text: "The photo was sent as training data, so the model learned the notes.",
        },
      ],
      correctAnswerId: "a",
    },
  },
};

export const mockTradeoffBankQuestion: QuestionItem = {
  bankId: "q-aif-multi-tradeoff",
  courseId: "aif-cert",
  title: "Synthetic voice disclosure",
  unitId: "aif-unit-foundry",
  tags: [STD_RESPONSIBLE, STD_TEXT_SPEECH],
  ...bankIdentity({
    numericId: 1911,
    lastEditedLabel: "Sep 5, 2026",
    usedInQuizzes: [EXAM_QUIZ],
  }),
  listedInBank: true,
  reveal: {
    enabled: true,
    explanation:
      "Callers should know when they are hearing a synthetic voice. That is transparency, and it matters most when the voice sounds human.",
  },
  updatedAt: Date.now(),
  item: {
    kind: "multi",
    content: {
      prompt:
        "A bank uses Azure Speech to give its phone line a synthetic voice that sounds like a real employee. What should the team address first?",
      answers: [
        {
          id: "a",
          text: "Tell callers they are hearing a synthetic voice.",
        },
        {
          id: "b",
          text: "Pick the voice with the fastest speaking rate.",
        },
        {
          id: "c",
          text: "Switch to the largest language model available.",
        },
        {
          id: "d",
          text: "Save call recordings in a different audio format.",
        },
      ],
      correctAnswerId: "a",
    },
  },
};

export const mockHumanInTheLoopBankQuestion: QuestionItem = {
  bankId: "q-aif-fr-human-loop",
  courseId: "aif-cert",
  title: "Human approval for agents",
  unitId: "aif-unit-foundry",
  tags: [STD_RESPONSIBLE],
  ...bankIdentity({
    numericId: 1912,
    lastEditedLabel: "Sep 4, 2026",
    usedInQuizzes: [EXAM_QUIZ],
  }),
  listedInBank: true,
  reveal: {
    enabled: true,
    explanation:
      "Actions that are costly or hard to undo should wait for a person to approve them, so someone stays accountable for the outcome.",
  },
  updatedAt: Date.now(),
  item: {
    kind: "freeResponse",
    content: {
      prompt: "When should an agent wait for a person?",
      description:
        "An agent built in Foundry can answer questions and take actions for customers, such as changing an order or issuing a refund.\n\nGive one action that should need a person’s approval, and explain why the agent shouldn’t do it alone.",
      placeholder: "A person should approve… because…",
      allowFileUpload: true,
      minCharacters: 40,
      revealAnswerEnabled: true,
      teacherAnswer: {
        exemplar:
          "A large refund should need a person’s approval, because a mistake costs real money and is hard to reverse, and someone needs to be accountable for the decision.",
      },
    },
  },
};

export const mockFeatureLabelBankQuestion: QuestionItem = {
  bankId: "q-aif-multi-features",
  courseId: "aif-cert",
  title: "System and user prompts",
  unitId: "aif-unit-foundry",
  tags: [STD_GENAI_AGENTS],
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
      "The system message sets behavior and limits for the whole conversation; the user message is the request to answer.",
  },
  updatedAt: Date.now(),
  item: {
    kind: "multi",
    content: {
      prompt: "Name the two messages",
      description: [
        "A chat app sends these messages to a deployed model:",
        "",
        "```python",
        "messages = [",
        '    {"role": "system", "content": "You tutor 9th grade biology. Answer in two sentences or fewer."},',
        '    {"role": "user", "content": "Why do leaves change color in the fall?"},',
        "]",
        "```",
        "",
        "Which statement describes them correctly?",
      ].join("\n"),
      answers: [
        {
          id: "a",
          text: "The system message sets how the model behaves; the user message is the question to answer.",
        },
        {
          id: "b",
          text: "The system message is the question; the user message is the answer to copy.",
        },
        {
          id: "c",
          text: "Both messages permanently retrain the model.",
        },
        {
          id: "d",
          text: "The system message is shown to the user; the user message is hidden.",
        },
      ],
      correctAnswerId: "a",
    },
  },
};

export const mockTrainingLoopBankQuestion: QuestionItem = {
  bankId: "q-aif-match-training",
  courseId: "aif-cert",
  title: "Agent setup order",
  unitId: "aif-unit-foundry",
  tags: [STD_GENAI_AGENTS],
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
      "An agent needs a deployed model first. Then you create the agent with its instructions, and test it in the playground before building a client app.",
  },
  updatedAt: Date.now(),
  item: {
    kind: "match",
    content: {
      prompt: "Order the agent setup steps",
      description:
        "You are building a single-agent solution in the Foundry portal that answers questions about a school’s course catalog.\n\nMatch each step to its place in the setup.",
      terms: [
        { id: "t1", text: "First" },
        { id: "t2", text: "Second" },
        { id: "t3", text: "Third" },
      ],
      prompts: [
        {
          id: "p1",
          text: "Deploy a model for the agent to use",
          correctTermId: "t1",
        },
        {
          id: "p2",
          text: "Create the agent and write its instructions",
          correctTermId: "t2",
        },
        {
          id: "p3",
          text: "Test the agent in the playground",
          correctTermId: "t3",
        },
      ],
    },
  },
};

export const mockAifCourseBank: AssessmentCourseBank = {
  courseId: "aif-cert",
  courseName: "Building AI Systems",
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
