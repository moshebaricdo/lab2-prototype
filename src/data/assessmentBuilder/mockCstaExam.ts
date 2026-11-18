import type {
  AssessmentArtifact,
  QuestionItem,
  QuestionItemContent,
  AssessmentQuestionRef,
} from "../../types/assessmentBuilder";
import { cstaTag } from "./csta2026";

/**
 * Middle school CS exam tagged to CSTA 2026 MS standards: 22 questions,
 * 22 standards across all five concepts, one question tagged with two.
 * Big enough that score by standard opens collapsed to concept subtotals.
 */

const COURSE_ID = "csd-ms";
const SEED_UPDATED_AT = new Date("2026-11-17T12:00:00").getTime();

const STD = {
  PS02: cstaTag("MS-ALG-PS-02", "Model a given algorithm with a flowchart or pseudocode that includes a combination of control structures and procedures."),
  PS03: cstaTag("MS-ALG-PS-03", "Verify the accuracy of an algorithm for given inputs."),
  PS04: cstaTag("MS-ALG-PS-04", "Justify whether a problem is best solved using procedural instructions, rule-based logic, data-driven methods, or a combination of these approaches."),
  ML06: cstaTag("MS-ALG-ML-06", "Hypothesize how a machine learning model generates classifications or predictions."),
  ML07: cstaTag("MS-ALG-ML-07", "Investigate ways to improve the accuracy of a machine learning model and reduce bias by refining the quality of examples and nonexamples in the training data."),
  ML08: cstaTag("MS-ALG-ML-08", "Evaluate the features and limitations of a machine learning model."),
  IM10: cstaTag("MS-ALG-IM-10", "Examine evidence of beneficial and harmful impacts, ethical issues, and biases of algorithms encountered in daily life."),
  PD12: cstaTag("MS-PRO-PD-12", "Use a procedure to structure code for clarity and reusability."),
  PD14: cstaTag("MS-PRO-PD-14", "Justify the importance of attribution and intellectual property when developing computing technologies."),
  VD16: cstaTag("MS-PRO-VD-16", "Use variables of multiple data types to store, access, and manipulate data within a program."),
  RD17: cstaTag("MS-PRO-RD-17", "Analyze the roles of iteration, selection, variables, and procedures in a segment of code."),
  RD18: cstaTag("MS-PRO-RD-18", "Analyze AI-generated code for accuracy and usability in a programming project."),
  TR19: cstaTag("MS-PRO-TR-19", "Use systematic strategies to test, refine, and document changes to a computing technology to meet the intended purpose."),
  TR20: cstaTag("MS-PRO-TR-20", "Refine a computing technology based on user feedback to improve its usability and accessibility."),
  DC21: cstaTag("MS-DAT-DC-21", "Evaluate how different levels of precision and granularity in data collection affect accuracy, storage, and analysis."),
  DC24: cstaTag("MS-DAT-DC-24", "Analyze options to address a data quality issue."),
  DI26: cstaTag("MS-DAT-DI-26", "Create data visualizations to show how different design choices can impact the interpretation of the same data."),
  SE32: cstaTag("MS-SYS-SE-32", "Explain the effects of not using the CIA triad when working with data."),
  SE33: cstaTag("MS-SYS-SE-33", "Evaluate common types of cyber attacks and preventions."),
  NT34: cstaTag("MS-SYS-NT-34", "Model how information in a network is broken down into packets, transmitted between devices, and reassembled."),
  ET40: cstaTag("MS-SOC-ET-40", "Evaluate when it is appropriate to use AI and other emerging technologies to solve a problem based on their capabilities, limitations, and environmental impacts."),
  CE45: cstaTag("MS-SOC-CE-45", "Evaluate how automation in technology can create or replace jobs and change how people work."),
};

let nextNumericId = 62001;

function q(
  bankId: string,
  title: string,
  tags: QuestionItem["tags"],
  item: QuestionItemContent,
  explanation: string,
): QuestionItem {
  return {
    bankId,
    courseId: COURSE_ID,
    title,
    tags,
    reveal: { enabled: true, explanation },
    points: 1,
    item,
    numericId: nextNumericId++,
    questionKey: `csta-ms-${bankId}`,
    versionIndex: 1,
    versionCount: 1,
    listedInBank: false,
    neverSaved: false,
    lastEditedLabel: "Nov 17, 2026",
    updatedAt: SEED_UPDATED_AT,
  };
}

type Answer = { id: string; text: string };
const single = (
  prompt: string,
  answers: Answer[],
  correctAnswerId: string,
  description?: string,
): QuestionItemContent => ({
  kind: "multi",
  content: { prompt, description, selectionMode: "single", answers, correctAnswerId },
});
const multiple = (
  prompt: string,
  answers: Answer[],
  correctAnswerIds: string[],
): QuestionItemContent => ({
  kind: "multi",
  content: { prompt, selectionMode: "multiple", answers, correctAnswerIds },
});
const opts = (...texts: string[]): Answer[] =>
  texts.map((text, i) => ({ id: "abcdef"[i], text }));

/* ---------- ALG: Algorithms and Design ---------- */

const algQuestions = [
  q("flowchart-decision", "Flowchart decision", [STD.PS02],
    single("In a flowchart, which shape shows a decision that splits the path into a Yes branch and a No branch?",
      opts("Diamond", "Rectangle", "Oval", "Parallelogram"), "a"),
    "A diamond holds a yes/no question. Rectangles are steps, ovals are start and end, parallelograms are input and output."),
  q("verify-larger", "Verify an algorithm", [STD.PS03],
    single("Which input shows that this algorithm has a bug?",
      opts("A = 5, B = 5", "A = 9, B = 2", "A = 2, B = 9", "A = 0, B = 1"), "a",
      ["This algorithm should display the larger of two numbers.", "", "```", "IF A > B", "  DISPLAY A", "IF B > A", "  DISPLAY B", "```"].join("\n")),
    "When A and B are equal, neither condition is true, so nothing is displayed. Testing equal values catches the missing case."),
  q("rules-or-data", "Rules or data", [STD.PS04],
    single("Which problem is best solved with a data-driven method, such as a machine learning model, instead of step-by-step rules?",
      opts(
        "Recognizing which digit 0–9 is written in a photo of handwriting",
        "Converting a temperature from Celsius to Fahrenheit",
        "Adding sales tax to the price of an item",
        "Putting a list of names in alphabetical order",
      ), "a"),
    "Handwriting varies too much to write rules for every shape, so learning from many labeled examples works better. The others have exact formulas or procedures."),
  q("wolf-snow", "Snowy wolves", [STD.ML06],
    single("An image model labels almost every photo with snow in it as \"wolf,\" even photos of dogs. What is the most likely explanation?",
      opts(
        "Most wolf photos in its training data had snowy backgrounds, so it learned snow as a clue",
        "The model can only see the color white",
        "Dogs and wolves are the same animal to a computer",
        "The model ran out of memory while looking at snowy photos",
      ), "a"),
    "Models find patterns that separate the labels in their training data. If snow showed up with wolves, snow becomes part of the pattern."),
  q("green-apples", "Green apples", [STD.ML07],
    single("A fruit classifier often labels green apples as limes. Which change to the training data is most likely to help?",
      opts(
        "Add many labeled photos of green apples, in different lighting and angles",
        "Remove all the lime photos",
        "Add more photos of red apples",
        "Train on the same photos again",
      ), "a"),
    "The model has too few examples of green apples. Adding varied examples of the case it gets wrong is the most direct fix; removing limes would break lime detection."),
  q("daylight-dogs", "Daylight dogs", [STD.ML08],
    multiple("A model was trained only on daytime photos of dogs. Which are likely limitations? Select all that apply.",
      opts(
        "It may do worse on photos taken at night",
        "It may give a confident wrong answer for an animal it never saw, like a ferret",
        "It will refuse to open images bigger than its training photos",
        "It will learn to recognize cats on its own over time",
      ), ["a", "b"]),
    "A model is limited by what its training data covered: night photos and unseen animals are outside it. Image size and learning on its own are not how it works."),
  q("class-recommender", "Class recommender", [STD.IM10],
    single("A school uses an algorithm to recommend students for an advanced class based only on last year's grades. Which concern is most about bias?",
      opts(
        "Students who changed schools or had a hard year may be left out even if they're ready",
        "The algorithm might take a few seconds to run",
        "Teachers would have to log in to see the list",
        "The list might be printed in alphabetical order",
      ), "a"),
    "Using one past measure can unfairly leave out groups of students whose grades don't reflect what they can do now. The other choices are about speed or format, not fairness."),
];

/* ---------- PRO: Programming ---------- */

const proQuestions = [
  q("house-procedure", "Repeated house", [STD.PD12],
    single("A program draws a house in three places by copying the same 20 lines of code three times. What is the best way to improve it?",
      opts(
        "Move the 20 lines into a procedure with parameters for position, then call it three times",
        "Add a comment above each copy that says \"house\"",
        "Put all 60 lines on fewer lines so the file is shorter",
        "Draw only one house so there is less code",
      ), "a"),
    "A procedure with parameters removes the repeated code, so a fix in one place updates every house."),
  q("sound-credit", "Borrowed sound", [STD.PD14],
    single("You want to use a sound effect someone else made in your game. What should you do?",
      opts(
        "Check its license and credit the creator the way the license asks",
        "Use it, since anything online is free to use",
        "Rename the file so it looks like your own",
        "Use it only if nobody will play your game",
      ), "a"),
    "Creators own their work. A license says how you may use it, and attribution gives credit where it's due."),
  q("score-variable", "Score variable", [STD.VD16],
    single("What is the value of score after this code runs?",
      opts("30", "15", "25", "20"), "a",
      ["```", "score ← 10", "score ← score + 5", "score ← score * 2", "```"].join("\n")),
    "score becomes 10, then 15, then 15 × 2 = 30. Each line replaces the old value."),
  q("loop-trace", "Loop and condition", [STD.RD17, STD.VD16],
    single("What does this code display?",
      opts("big", "small", "12", "Nothing"), "a",
      ["```", "total ← 0", "REPEAT 4 TIMES", "  total ← total + 3", "IF total > 10", "  DISPLAY \"big\"", "ELSE", "  DISPLAY \"small\"", "```"].join("\n")),
    "The loop adds 3 four times, so total is 12. Since 12 > 10, the IF branch runs and displays \"big\"."),
  q("ai-average", "AI-written average", [STD.RD18],
    single("An AI tool wrote this procedure to find the average of a list. What is wrong with it?",
      opts(
        "It divides by 2 instead of by the number of items in the list",
        "It should multiply instead of add",
        "Procedures can't use loops",
        "Nothing is wrong; it works for any list",
      ), "a",
      ["```", "PROCEDURE average(list)", "  sum ← 0", "  FOR EACH item IN list", "    sum ← sum + item", "  RETURN sum / 2", "```"].join("\n")),
    "It only works for lists of two items. Testing with a list like [3, 6, 9] (average 6) would show it returns 9."),
  q("age-tests", "Testing an age input", [STD.TR19],
    single("A program accepts ages from 0 to 120. Which set of test inputs is the most systematic?",
      opts("-1, 0, 50, 120, 121", "10, 20, 30", "50, 50, 50", "1, 2, 3, 4, 5"), "a"),
    "Testing just outside, at, and inside each boundary checks the places bugs most often hide."),
  q("button-contrast", "Hard-to-read button", [STD.TR20],
    single("Testers say they can't read the white text on a light yellow button. What is the best refinement?",
      opts(
        "Change the colors so the text and button have strong contrast",
        "Make the button smaller",
        "Add more buttons with the same colors",
        "Tell testers to turn up their screen brightness",
      ), "a"),
    "Low contrast makes text hard to read for many people. Fixing the colors acts on the feedback and improves accessibility."),
];

/* ---------- DAT: Data and Analysis ---------- */

const datQuestions = [
  q("weather-granularity", "Every second", [STD.DC21],
    single("A weather station changes from recording the temperature once an hour to once a second. What is a likely effect?",
      opts(
        "More detail about quick changes, but much more data to store and analyze",
        "Less detail, because the readings are too close together",
        "The temperature readings become more accurate on their own",
        "No change, because temperature doesn't vary within an hour",
      ), "a"),
    "Finer granularity captures more detail, but 3,600 readings an hour costs more storage and processing."),
  q("messy-ages", "Messy ages", [STD.DC24],
    single("A survey's age column has entries like \"twelve\", \"12\", and blanks. What is a reasonable first step?",
      opts(
        "Convert every entry to a number and decide how to handle the blanks",
        "Delete the whole age column",
        "Sort the column alphabetically",
        "Leave it as is, since a chart will fix it",
      ), "a"),
    "Making the values a consistent type and choosing a rule for missing data lets you analyze the column without losing it."),
  q("axis-start", "Bar chart axis", [STD.DI26],
    single("Two bars show 92 and 95. The chart's y-axis starts at 90 instead of 0. How does that change what readers see?",
      opts(
        "A small difference looks much larger than it is",
        "The difference disappears",
        "The values become more accurate",
        "Nothing changes",
      ), "a"),
    "Starting at 90 makes one bar look more than twice as tall as the other, even though the values differ by about 3%."),
];

/* ---------- SYS: Systems and Security ---------- */

const sysQuestions = [
  q("cia-match", "CIA triad", [STD.SE32], {
    kind: "match",
    content: {
      prompt: "Match each part of the CIA triad to what goes wrong without it.",
      terms: [
        { id: "t1", text: "Confidentiality" },
        { id: "t2", text: "Integrity" },
        { id: "t3", text: "Availability" },
      ],
      prompts: [
        { id: "p1", text: "A stranger reads your private messages.", correctTermId: "t1" },
        { id: "p2", text: "Someone secretly changes your grades in the school system.", correctTermId: "t2" },
        { id: "p3", text: "The homework site is down the night an assignment is due.", correctTermId: "t3" },
      ],
    },
  }, "Confidentiality keeps data private, integrity keeps it unchanged, and availability keeps it reachable when needed."),
  q("phishing", "Suspicious email", [STD.SE33],
    single("An email that looks like it's from your school asks you to click a link and enter your password. What kind of attack is this most likely?",
      opts("Phishing", "Overheating", "A software update", "Encryption"), "a"),
    "Phishing tricks people into giving away information. Go to the school site yourself instead of using the link."),
  q("packets", "Sending a photo", [STD.NT34],
    single("When you send a photo to a friend over the internet, what happens?",
      opts(
        "It is split into packets that may take different routes and are put back together at the other end",
        "The whole photo travels as one piece along a single wire",
        "A copy is mailed to your friend's internet provider",
        "It is sent only when no one else is online",
      ), "a"),
    "Data is broken into packets with addresses and order numbers, so they can travel separately and be reassembled."),
];

/* ---------- SOC: Computing and Society ---------- */

const socQuestions = [
  q("ai-report-facts", "AI for a report", [STD.ET40],
    single("Which task is least appropriate to hand to an AI chatbot without checking its work?",
      opts(
        "Writing the facts and dates for a history report",
        "Brainstorming possible titles for a story",
        "Suggesting synonyms for a word you overuse",
        "Listing questions you could ask in an interview",
      ), "a"),
    "Chatbots can state wrong facts confidently. Brainstorming tasks are low-risk because you choose what to keep."),
  q("self-checkout", "Self-checkout", [STD.CE45],
    single("A grocery store adds self-checkout machines. What is the most likely effect on jobs?",
      opts(
        "Fewer cashier jobs, plus some new jobs helping customers and maintaining the machines",
        "Every job at the store disappears",
        "No change, because machines can't do cashier work",
        "The store must hire more cashiers than before",
      ), "a"),
    "Automation often replaces some tasks while creating others, which changes the kinds of work people do."),
];

const sections: Array<{ id: string; questions: QuestionItem[] }> = [
  { id: "sec-csta-alg", questions: algQuestions },
  { id: "sec-csta-pro", questions: proQuestions },
  { id: "sec-csta-dat", questions: datQuestions },
  { id: "sec-csta-sys", questions: sysQuestions },
  { id: "sec-csta-soc", questions: socQuestions },
];

const ref = (item: QuestionItem): AssessmentQuestionRef => ({ type: "inline", item });

/** Retries and correctness on, so results show the score by standard. */
export const mockCstaMsExamAssessment: AssessmentArtifact = {
  id: "quiz-csta-ms-exam",
  courseId: COURSE_ID,
  title: "Middle School CS Benchmark",
  lessonName: "Benchmark",
  levelId: 62000,
  placement: { kind: "floating" },
  purpose: "exam",
  mode: "exam",
  layout: "stepped",
  metadata: {
    levelPosition: 1,
    totalLevelsInScript: 1,
    assessmentName: "Middle School CS Benchmark",
  },
  questionRefs: sections.flatMap((s) => s.questions.map(ref)),
  sections: sections.map((s) => ({ id: s.id, questionRefs: s.questions.map(ref) })),
  shuffle: { shuffleQuestions: false, shuffleOptions: true },
  showIntroScreen: true,
  timing: { timeLimitMinutes: 40 },
  allowMultipleAttempts: true,
  attempts: { maxAttempts: 3 },
  feedback: {
    showCorrectness: true,
    revealAnswerExplanation: true,
  },
  showScoreByStandard: true,
  tutor: { enabled: false },
  intro: {
    overviewContent: `This benchmark covers the CSTA 2026 middle school standards across all five concepts: algorithms and design, programming, data, systems and security, and computing and society.

There are 22 questions on five pages. You have 40 minutes per attempt and up to three attempts.

When you are ready, begin.`,
    timeMinutes: 40,
    attempts: 3,
  },
  updatedAt: SEED_UPDATED_AT,
};
