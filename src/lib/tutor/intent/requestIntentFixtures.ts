import type { TutorRequestIntent } from "./requestIntent";
import type { RequestIntentClassifierContext } from "./requestIntentClassifier";

/**
 * Labeled corpus of student messages with their intended routing. Documents
 * phrasings the regex cascade gets wrong and gives a reusable set to evaluate
 * the model classifier against (mocked in unit tests, and optionally against a
 * live key in manual evaluation).
 *
 * `regexKnownWrong: true` marks cases where the deterministic regex cascade
 * currently mis-routes the message. Do not assert the regex produces
 * `expectedIntent` for those; assert only that the model path (and the wiring)
 * handle them.
 */
export interface RequestIntentFixture {
  message: string;
  context: RequestIntentClassifierContext;
  expectedIntent: TutorRequestIntent;
  expectedIsConcept?: boolean;
  expectedAsksForAnswer?: boolean;
  /** The deterministic regex cascade is known to mis-route this message today. */
  regexKnownWrong?: boolean;
  note: string;
}

const curriculum: RequestIntentClassifierContext = {
  supportContext: "curriculum-level",
};
const standalone: RequestIntentClassifierContext = {
  supportContext: "standalone-project",
};

export const REQUEST_INTENT_FIXTURES: RequestIntentFixture[] = [
  // --- Edit verbs used inside a QUESTION (should stay guidance) ---
  {
    message: "why won't my page build?",
    context: curriculum,
    expectedIntent: "guidance",
    note: "'build' is the verb but the student is debugging, not asking Tutor to build. Regex handles this via question phrasing.",
  },
  {
    message: "how do I fix the overlap between these two cards?",
    context: curriculum,
    expectedIntent: "guidance",
    note: "'how do I fix' wants the approach, not for Tutor to make the change.",
  },
  {
    message: "what does it mean to style something with flexbox?",
    context: curriculum,
    expectedIntent: "guidance",
    expectedIsConcept: true,
    note: "'style' is an edit verb but this is a concept question. Regex handles it via 'what does it mean'.",
  },

  // --- Indirect change requests with NO edit verb (should be edit) ---
  {
    message: "the heading feels way too small and cramped",
    context: standalone,
    expectedIntent: "edit",
    regexKnownWrong: true,
    note: "No edit verb, but clearly wants the heading changed.",
  },
  {
    message: "these buttons are kind of boring honestly",
    context: standalone,
    expectedIntent: "edit",
    regexKnownWrong: true,
    note: "Implicit restyle request expressed as an opinion.",
  },

  // --- Unusual but clear edit verbs the verb list may miss ---
  {
    message: "can you jazz up the hero section a bit?",
    context: standalone,
    expectedIntent: "edit",
    regexKnownWrong: true,
    note: "'jazz up' is an edit request not in the verb list.",
  },
  {
    message: "punch up the contrast on the nav so it pops",
    context: standalone,
    expectedIntent: "edit",
    regexKnownWrong: true,
    note: "'punch up' / 'pops' = restyle, unusual phrasing.",
  },

  // --- Direct edit requests (regex usually gets these) ---
  {
    message: "add a footer with my name and the year",
    context: standalone,
    expectedIntent: "edit",
    note: "Plain direct edit request.",
  },
  {
    message: "the instructions say to ask Tutor to update the button color",
    context: curriculum,
    expectedIntent: "edit",
    note: "Curriculum hand-off to Tutor to perform a change.",
  },

  // --- Concept / definition questions (guidance + isConcept) ---
  {
    message: "what is a promise in javascript?",
    context: curriculum,
    expectedIntent: "guidance",
    expectedIsConcept: true,
    note: "Plain concept question.",
  },
  {
    message: "i don't really get what hoisting is",
    context: curriculum,
    expectedIntent: "guidance",
    expectedIsConcept: true,
    note: "Concept confusion phrased indirectly.",
  },

  // --- Explicit answer requests (guidance + asksForAnswer) ---
  {
    message: "just tell me the exact selector I need",
    context: curriculum,
    expectedIntent: "guidance",
    expectedAsksForAnswer: true,
    note: "Wants the answer handed over; disclosure policy should resist.",
  },

  // --- Planning (standalone, plan shaping) ---
  {
    message: "help me figure out what pages my portfolio site should have",
    context: standalone,
    expectedIntent: "planning",
    note: "Shaping a spec before building.",
  },
  {
    message: "let's brainstorm some features before I start coding",
    context: standalone,
    expectedIntent: "planning",
    regexKnownWrong: true,
    note: "Explicit brainstorm/plan request; regex routes it to guidance.",
  },

  // --- "How would I..." learning questions (guidance even if outcome is edit-like) ---
  {
    message: "how would I make the background a gradient?",
    context: curriculum,
    expectedIntent: "guidance",
    note: "Wants to learn the technique, not have Tutor do it. Regex handles 'how would I'.",
  },
];
