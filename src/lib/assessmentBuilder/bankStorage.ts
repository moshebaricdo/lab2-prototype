import type { AssessmentCourseBank, QuestionItem } from "../../types/assessmentBuilder";
import { mockAifCourseBank, mockWebDevCourseBank } from "../../data/assessmentBuilder/mockBank";

const STORAGE_KEY = "lab2:assessment-bank";

let cachedRaw: string | null = null;
let cachedBanks: AssessmentCourseBank[] | null = null;
let cachedQuestionMapKey: string | null = null;
let cachedQuestionMap: Map<string, QuestionItem> = new Map();

function readBanks(): AssessmentCourseBank[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw && cachedBanks) return cachedBanks;
    cachedRaw = raw;
    if (!raw) {
      cachedBanks = [
        structuredClone(mockAifCourseBank),
        structuredClone(mockWebDevCourseBank),
      ];
      writeBanks(cachedBanks, { notify: false });
      return cachedBanks;
    }
    cachedBanks = JSON.parse(raw) as AssessmentCourseBank[];
    return cachedBanks;
  } catch {
    cachedBanks = [
      structuredClone(mockAifCourseBank),
      structuredClone(mockWebDevCourseBank),
    ];
    return cachedBanks;
  }
}

function invalidateQuestionMapCache() {
  cachedQuestionMapKey = null;
  cachedQuestionMap = new Map();
}

function writeBanks(banks: AssessmentCourseBank[], options?: { notify?: boolean }) {
  const json = JSON.stringify(banks);
  localStorage.setItem(STORAGE_KEY, json);
  cachedRaw = json;
  cachedBanks = banks;
  invalidateQuestionMapCache();
  if (options?.notify !== false) {
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  }
}

export function getCourseBank(courseId: string): AssessmentCourseBank | undefined {
  return readBanks().find((bank) => bank.courseId === courseId);
}

export function getAllCourseBanks(): AssessmentCourseBank[] {
  return readBanks();
}

export function getBankQuestion(
  courseId: string,
  bankId: string,
): QuestionItem | undefined {
  return getCourseBank(courseId)?.questions.find((q) => q.bankId === bankId);
}

export function getBankQuestionMap(courseId: string): Map<string, QuestionItem> {
  const mapKey = `${cachedRaw ?? ""}:${courseId}`;
  if (cachedQuestionMapKey === mapKey) return cachedQuestionMap;

  const bank = getCourseBank(courseId);
  const map = new Map<string, QuestionItem>();
  if (bank) {
    for (const question of bank.questions) {
      map.set(question.bankId, question);
    }
  }

  cachedQuestionMapKey = mapKey;
  cachedQuestionMap = map;
  return cachedQuestionMap;
}

export function upsertBankQuestion(
  courseId: string,
  question: QuestionItem,
): QuestionItem {
  const banks = readBanks();
  const bankIndex = banks.findIndex((bank) => bank.courseId === courseId);
  if (bankIndex === -1) return question;

  const bank = banks[bankIndex];
  const questionIndex = bank.questions.findIndex((q) => q.bankId === question.bankId);
  const nextQuestion = { ...question, updatedAt: Date.now() };
  const nextQuestions =
    questionIndex === -1
      ? [nextQuestion, ...bank.questions]
      : bank.questions.map((q, i) => (i === questionIndex ? nextQuestion : q));

  const nextBank = { ...bank, questions: nextQuestions };
  const nextBanks = [...banks];
  nextBanks[bankIndex] = nextBank;
  writeBanks(nextBanks);
  return nextQuestion;
}

export function deleteBankQuestion(courseId: string, bankId: string) {
  const banks = readBanks();
  const bankIndex = banks.findIndex((bank) => bank.courseId === courseId);
  if (bankIndex === -1) return;

  const bank = banks[bankIndex];
  const nextBank = {
    ...bank,
    questions: bank.questions.filter((q) => q.bankId !== bankId),
  };
  const nextBanks = [...banks];
  nextBanks[bankIndex] = nextBank;
  writeBanks(nextBanks);
}

export function resetCourseBank(courseId: string) {
  if (courseId !== mockAifCourseBank.courseId) return;
  const banks = readBanks().filter((bank) => bank.courseId !== courseId);
  writeBanks([structuredClone(mockAifCourseBank), ...banks]);
}
