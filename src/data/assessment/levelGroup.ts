import type {
  FreeResponseLevelPayload,
  FreeResponseTeacherAnswer,
} from "./freeResponse";
import type { MatchLevelPayload } from "./match";
import type { MultiChoiceLevelPayload } from "./multi";

export interface LevelGroupMultiQuestion {
  id: string;
  prompt: string;
  answers: Array<{ id: string; text: string }>;
  /** Required for graded quizzes. Omit when the level uses `surveyMode`. */
  correctAnswerId?: string;
}

export interface LevelGroupFreeResponseQuestion {
  id: string;
  prompt: string;
  placeholder: string;
  minCharacters: number;
  revealAnswerEnabled?: boolean;
  teacherAnswer?: FreeResponseTeacherAnswer;
  allowFileUpload?: boolean;
}

export interface LevelGroupMatchQuestion {
  id: string;
  prompt: string;
  terms: Array<{ id: string; text: string }>;
  prompts: Array<{ id: string; text: string; correctTermId: string }>;
}

/** One question in an ordered levelgroup flow (scroll-all or stepped). */
export type LevelGroupQuestionBlock =
  | { kind: "multi"; blockId: string; question: LevelGroupMultiQuestion }
  | {
      kind: "freeResponse";
      blockId: string;
      question: LevelGroupFreeResponseQuestion;
    }
  | { kind: "match"; blockId: string; question: LevelGroupMatchQuestion };

/** Optional “before you begin” screen for stepped levelgroups (header-track UI). */
export interface LevelGroupAssessmentIntro {
  /**
   * Levelbuilder-authored copy between the title and footer (what the assessment covers,
   * expectations, etc.). Use blank lines between paragraphs.
   */
  overviewContent: string;
  /** Total time allowed (minutes), shown next to question count above Begin. */
  timeMinutes: number;
}

export interface LevelGroupFlowPayload {
  level: {
    id: number;
    name: string;
    type: "LevelGroup";
    metadata: {
      lessonName: string;
      /** Shown in the stepped (header track) card top row — assessment title. */
      assessmentName?: string;
      levelPosition: number;
      totalLevelsInScript: number;
    };
    /** When set, the stepped flow opens on an intro screen until the student begins. */
    intro?: LevelGroupAssessmentIntro;
    /**
     * Reflection / feedback flows: no graded key, no reveal affordances in scroll layout.
     * Multi blocks omit `correctAnswerId`; payloads map to multi `surveyMode`.
     */
    surveyMode?: boolean;
    steps: LevelGroupQuestionBlock[];
  };
}

const levelGroupFlowSteps: LevelGroupQuestionBlock[] = [
  {
    kind: "multi",
    blockId: "block-m1",
    question: {
      id: "multi-1",
      prompt:
        "Which action best protects your account from unauthorized access?",
      answers: [
        { id: "a", text: "Use the same password for every site." },
        { id: "b", text: "Enable two-factor authentication." },
        { id: "c", text: "Share your password with close friends." },
        { id: "d", text: "Save your password in public chat." },
      ],
      correctAnswerId: "b",
    },
  },
  {
    kind: "multi",
    blockId: "block-m2",
    question: {
      id: "multi-2",
      prompt:
        "Before you post a photo of classmates, what is the most responsible first step?",
      answers: [
        { id: "a", text: "Post first, ask later." },
        { id: "b", text: "Ask for consent from people who are identifiable." },
        { id: "c", text: "Tag everyone automatically." },
        { id: "d", text: "Assume public events are always fine to share." },
      ],
      correctAnswerId: "b",
    },
  },
  {
    kind: "freeResponse",
    blockId: "block-fr1",
    question: {
      id: "free-1",
      prompt:
        "Write one sentence you could post to give respectful, constructive feedback on a peer's project.",
      placeholder: "Type your feedback sentence...",
      minCharacters: 30,
      revealAnswerEnabled: true,
      teacherAnswer: {
        exemplar:
          "I liked how you organized your sections — one idea to try next is adding a short example for your main claim.",
        rubricCriteria: ["Respectful tone", "Specific and actionable"],
      },
    },
  },
  {
    kind: "match",
    blockId: "block-match1",
    question: {
      id: "match-1",
      prompt: "Match each term to its definition.",
      terms: [
        { id: "m1", text: "Privacy settings" },
        { id: "m2", text: "Citation" },
        { id: "m3", text: "Secure network" },
      ],
      prompts: [
        {
          id: "mp1",
          text: "Rules that control who can view or contact you online.",
          correctTermId: "m1",
        },
        {
          id: "mp2",
          text: "Giving credit to a source when using someone else's work.",
          correctTermId: "m2",
        },
        {
          id: "mp3",
          text: "An internet connection that protects data from interception.",
          correctTermId: "m3",
        },
      ],
    },
  },
  {
    kind: "freeResponse",
    blockId: "block-fr2",
    question: {
      id: "free-2",
      prompt:
        "In one or two sentences, describe how you would verify a news headline before sharing it.",
      placeholder: "Describe your verification steps...",
      minCharacters: 40,
      allowFileUpload: true,
    },
  },
  {
    kind: "multi",
    blockId: "block-m3",
    question: {
      id: "multi-3",
      prompt: "Which situation most clearly signals a phishing attempt?",
      answers: [
        {
          id: "a",
          text: "A bank email asks you to log in via a link in the message.",
        },
        {
          id: "b",
          text: "Your teacher posts an assignment in your class learning system.",
        },
        {
          id: "c",
          text: "A friend texts you from the number you already saved.",
        },
        { id: "d", text: "A receipt arrives for a purchase you recognize." },
      ],
      correctAnswerId: "a",
    },
  },
];

export const mockLevelGroupScroll: LevelGroupFlowPayload = {
  level: {
    id: 42041,
    name: "Unit survey (all at once)",
    type: "LevelGroup",
    metadata: {
      lessonName: "Digital Citizenship Foundations",
      levelPosition: 6,
      totalLevelsInScript: 8,
    },
    steps: levelGroupFlowSteps,
  },
};

/** Same questions as scroll-all; used for the sticky-footer layout demo. */
export const mockLevelGroupScrollStickyFooter: LevelGroupFlowPayload = {
  level: {
    ...mockLevelGroupScroll.level,
    id: 42043,
    name: "Unit survey (sticky footer)",
  },
};

export const mockLevelGroupStepped: LevelGroupFlowPayload = {
  level: {
    id: 42042,
    name: "Checkpoint quiz (step by step)",
    type: "LevelGroup",
    metadata: {
      lessonName: "Digital Citizenship Foundations",
      assessmentName: "Internet Citizenship Assessment",
      levelPosition: 6,
      totalLevelsInScript: 8,
    },
    steps: levelGroupFlowSteps,
  },
};

/** Same flow as `mockLevelGroupStepped` but opens on an intro screen first. */
export const mockLevelGroupSteppedWithIntro: LevelGroupFlowPayload = {
  level: {
    id: 42043,
    name: "Checkpoint quiz (with intro)",
    type: "LevelGroup",
    metadata: {
      lessonName: "Digital Citizenship Foundations",
      assessmentName: "Internet Citizenship Assessment",
      levelPosition: 6,
      totalLevelsInScript: 8,
    },
    intro: {
      overviewContent: `This assessment measures how you apply ideas from the Internet Citizenship unit in realistic situations: protecting accounts and personal information, communicating respectfully with peers, matching key vocabulary to definitions, and explaining how you would verify information before you share it.

You will see a mix of formats—multiple choice, short written responses, and a short matching activity—so we can see both recall and how you explain your thinking.

Read each item carefully. When you are ready, use Begin assessment to start; the timer for this attempt begins at that moment.`,
      timeMinutes: 30,
    },
    steps: levelGroupFlowSteps,
  },
};

/** Post-unit teacher survey: intro screen, then all items on one scroll page (no grading UI). */
const levelGroupTeacherSurveySteps: LevelGroupQuestionBlock[] = [
  {
    kind: "multi",
    blockId: "survey-m1",
    question: {
      id: "survey-1",
      prompt:
        "Overall, how well did the unit materials align with what you needed to teach this topic?",
      answers: [
        { id: "a", text: "Very well" },
        { id: "b", text: "Somewhat well" },
        { id: "c", text: "Neutral" },
        { id: "d", text: "Somewhat poorly" },
        { id: "e", text: "Not well" },
      ],
    },
  },
  {
    kind: "multi",
    blockId: "survey-m2",
    question: {
      id: "survey-2",
      prompt:
        "How likely are you to use at least one activity from this unit in the next school year?",
      answers: [
        { id: "a", text: "Very likely" },
        { id: "b", text: "Somewhat likely" },
        { id: "c", text: "Unsure" },
        { id: "d", text: "Somewhat unlikely" },
        { id: "e", text: "Very unlikely" },
      ],
    },
  },
  {
    kind: "freeResponse",
    blockId: "survey-fr1",
    question: {
      id: "survey-fr1",
      prompt:
        "What is one thing that worked well for you or your students in this unit? (Optional but encouraged.)",
      placeholder: "Share a brief reflection…",
      minCharacters: 20,
    },
  },
  {
    kind: "freeResponse",
    blockId: "survey-fr2",
    question: {
      id: "survey-fr2",
      prompt:
        "What would you change or add next time we run this unit? (Optional but encouraged.)",
      placeholder: "Suggestions, pacing, resources…",
      minCharacters: 20,
    },
  },
];

export const mockLevelGroupSurveyWithIntro: LevelGroupFlowPayload = {
  level: {
    id: 42044,
    name: "Post-unit teacher survey (intro + one page)",
    type: "LevelGroup",
    metadata: {
      lessonName: "Digital Citizenship Foundations",
      assessmentName: "Unit feedback survey",
      levelPosition: 6,
      totalLevelsInScript: 8,
    },
    surveyMode: true,
    intro: {
      overviewContent: `Thank you for teaching the Internet Citizenship unit. This short survey helps us understand how the materials landed in real classrooms—what felt useful, what we should adjust, and how likely you are to reuse activities.

Your responses are anonymous in this prototype. There are no right or wrong answers.

When you are ready, use Begin survey to open the form; all questions appear on one page so you can answer at your own pace.`,
      timeMinutes: 15,
    },
    steps: levelGroupTeacherSurveySteps,
  },
};

/** Map a levelgroup multi block to the standalone multi-choice payload shape. */
export function levelGroupMultiToPayload(
  block: Extract<LevelGroupQuestionBlock, { kind: "multi" }>,
  flowLevel: LevelGroupFlowPayload["level"],
  stepIndex: number,
): MultiChoiceLevelPayload {
  const q = block.question;
  const survey = flowLevel.surveyMode === true;
  return {
    level: {
      id: flowLevel.id * 100 + stepIndex,
      name: flowLevel.name,
      type: "Multi",
      stem: { question: q.prompt },
      answers: q.answers.map((a) => ({ id: a.id, text: a.text })),
      ...(survey
        ? { surveyMode: true as const }
        : { correctAnswerId: q.correctAnswerId! }),
      metadata: flowLevel.metadata,
    },
  };
}

/** Map a levelgroup free-response block to the standalone free-response payload shape. */
export function levelGroupFreeToPayload(
  block: Extract<LevelGroupQuestionBlock, { kind: "freeResponse" }>,
  flowLevel: LevelGroupFlowPayload["level"],
  stepIndex: number,
): FreeResponseLevelPayload {
  const q = block.question;
  return {
    level: {
      id: flowLevel.id * 100 + stepIndex,
      name: flowLevel.name,
      type: "FreeResponse",
      stem: { question: q.prompt },
      question: {
        placeholder: q.placeholder,
        minCharacters: q.minCharacters,
      },
      ...(q.revealAnswerEnabled !== undefined && {
        revealAnswerEnabled: q.revealAnswerEnabled,
      }),
      ...(q.teacherAnswer !== undefined && { teacherAnswer: q.teacherAnswer }),
      ...(q.allowFileUpload !== undefined && {
        allowFileUpload: q.allowFileUpload,
      }),
      metadata: flowLevel.metadata,
    },
  };
}

/** Map a levelgroup match block to the connector-style match payload shape. */
export function levelGroupMatchToPayload(
  block: Extract<LevelGroupQuestionBlock, { kind: "match" }>,
  flowLevel: LevelGroupFlowPayload["level"],
  stepIndex: number,
): MatchLevelPayload {
  const q = block.question;
  return {
    level: {
      id: flowLevel.id * 100 + stepIndex,
      name: flowLevel.name,
      type: "Match",
      stem: { question: q.prompt },
      question: {
        terms: q.terms.map((t) => ({ id: t.id, text: t.text })),
        prompts: q.prompts.map((p) => ({
          id: p.id,
          text: p.text,
          correctTermId: p.correctTermId,
        })),
      },
      metadata: flowLevel.metadata,
    },
  };
}
