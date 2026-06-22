import type { AssessmentCourseBank, QuestionItem } from "../../types/assessmentBuilder";
import { mockAifCourseBank, mockWebDevCourseBank } from "../../data/assessmentBuilder/mockBank";

const STORAGE_KEY = "lab2:assessment-bank";

let cachedRaw: string | null = null;
let cachedBanks: AssessmentCourseBank[] | null = null;

let bankSnapshotRawKey: string | null = null;
let banksListSnapshot: AssessmentCourseBank[] = [];
const courseBankSnapshots = new Map<string, AssessmentCourseBank | undefined>();
const questionMapSnapshots = new Map<string, Map<string, QuestionItem>>();

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

function invalidateSyncSnapshots() {
  bankSnapshotRawKey = null;
  courseBankSnapshots.clear();
  questionMapSnapshots.clear();
}

function writeBanks(banks: AssessmentCourseBank[], options?: { notify?: boolean }) {
  const json = JSON.stringify(banks);
  localStorage.setItem(STORAGE_KEY, json);
  cachedRaw = json;
  cachedBanks = banks;
  invalidateSyncSnapshots();
  if (options?.notify !== false) {
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  }
}

function refreshBankSnapshotsIfNeeded() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === bankSnapshotRawKey) return;
  bankSnapshotRawKey = raw;
  banksListSnapshot = readBanks();
  courseBankSnapshots.clear();
  questionMapSnapshots.clear();
}

function buildQuestionMap(courseId: string): Map<string, QuestionItem> {
  const bank = banksListSnapshot.find((entry) => entry.courseId === courseId);
  const map = new Map<string, QuestionItem>();
  if (bank) {
    for (const question of bank.questions) {
      map.set(question.bankId, question);
    }
  }
  return map;
}

/** Cached snapshot for `useSyncExternalStore` — stable reference until storage changes. */
export function getAllCourseBanksSnapshot(): AssessmentCourseBank[] {
  refreshBankSnapshotsIfNeeded();
  return banksListSnapshot;
}

/** Cached snapshot for `useSyncExternalStore` — stable reference until storage changes. */
export function getCourseBankSnapshot(courseId: string): AssessmentCourseBank | undefined {
  refreshBankSnapshotsIfNeeded();
  if (!courseBankSnapshots.has(courseId)) {
    courseBankSnapshots.set(
      courseId,
      banksListSnapshot.find((bank) => bank.courseId === courseId),
    );
  }
  return courseBankSnapshots.get(courseId);
}

/** Cached snapshot for `useSyncExternalStore` — stable reference until storage changes. */
export function getBankQuestionMapSnapshot(courseId: string): Map<string, QuestionItem> {
  refreshBankSnapshotsIfNeeded();
  let map = questionMapSnapshots.get(courseId);
  if (!map) {
    map = buildQuestionMap(courseId);
    questionMapSnapshots.set(courseId, map);
  }
  return map;
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
  return getBankQuestionMapSnapshot(courseId);
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
