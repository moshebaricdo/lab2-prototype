import type {
  AssessmentCourseBank,
  DomainTag,
  QuestionItem,
} from "../../types/assessmentBuilder";
import {
  DEFAULT_COURSE_BANKS,
  mockAifCourseBank,
} from "../../data/assessmentBuilder/mockBank";

const STORAGE_KEY = "lab2:assessment-bank";

let cachedRaw: string | null = null;
let cachedBanks: AssessmentCourseBank[] | null = null;

let bankSnapshotRawKey: string | null = null;
let banksListSnapshot: AssessmentCourseBank[] = [];
const courseBankSnapshots = new Map<string, AssessmentCourseBank | undefined>();
const questionMapSnapshots = new Map<string, Map<string, QuestionItem>>();

function defaultBanksByCourse(): Map<string, AssessmentCourseBank> {
  return new Map(DEFAULT_COURSE_BANKS.map((bank) => [bank.courseId, bank]));
}

function hydrateDomainTag(tag: DomainTag, mock: AssessmentCourseBank): DomainTag {
  if (tag.code) return tag;
  const fromCatalog = mock.domains.find((domain) => domain.id === tag.id);
  return fromCatalog?.code ? { ...tag, code: fromCatalog.code } : tag;
}

function hydrateQuestion(
  question: QuestionItem,
  mock: AssessmentCourseBank,
): QuestionItem {
  const tags = question.tags.map((tag) => hydrateDomainTag(tag, mock));
  const withTags = tags.some((tag, index) => tag !== question.tags[index])
    ? { ...question, tags }
    : question;
  if (withTags.unitId) return withTags;
  const fromMock = mock.questions.find((entry) => entry.bankId === question.bankId);
  if (fromMock?.unitId) return { ...withTags, unitId: fromMock.unitId };
  const unit = (mock.units ?? []).find((entry) =>
    withTags.tags.some((tag) => entry.conceptIds.includes(tag.id)),
  );
  return unit ? { ...withTags, unitId: unit.id } : withTags;
}

function hydrateCourseBanks(banks: AssessmentCourseBank[]): AssessmentCourseBank[] {
  const mocks = defaultBanksByCourse();
  const byCourse = new Map(banks.map((bank) => [bank.courseId, bank]));
  for (const mock of DEFAULT_COURSE_BANKS) {
    if (!byCourse.has(mock.courseId)) {
      byCourse.set(mock.courseId, structuredClone(mock));
    }
  }

  return Array.from(byCourse.values()).map((bank) => {
    const mock = mocks.get(bank.courseId);
    if (!mock) return bank;
    const existingIds = new Set(bank.questions.map((question) => question.bankId));
    const mergedQuestions = [
      ...bank.questions,
      ...mock.questions.filter((question) => !existingIds.has(question.bankId)),
    ].map((question) => hydrateQuestion(question, mock));
    const domains =
      bank.domains.length > 0
        ? bank.domains.map((domain) => hydrateDomainTag(domain, mock))
        : mock.domains;
    return {
      ...bank,
      units: bank.units?.length ? bank.units : mock.units,
      domains,
      questions: mergedQuestions,
    };
  });
}

function banksNeedPersist(
  parsed: AssessmentCourseBank[],
  hydrated: AssessmentCourseBank[],
): boolean {
  if (parsed.length !== hydrated.length) return true;
  for (const next of hydrated) {
    const before = parsed.find((bank) => bank.courseId === next.courseId);
    if (!before) return true;
    if ((before.units?.length ?? 0) === 0 && (next.units?.length ?? 0) > 0) {
      return true;
    }
    if (before.questions.length !== next.questions.length) return true;
    const injectedUnit = next.questions.some((question) => {
      const original = before.questions.find(
        (entry) => entry.bankId === question.bankId,
      );
      return original != null && original.unitId == null && question.unitId != null;
    });
    if (injectedUnit) return true;
    const injectedCode = next.domains.some((domain) => {
      const original = before.domains.find((entry) => entry.id === domain.id);
      return original != null && original.code == null && domain.code != null;
    });
    if (injectedCode) return true;
  }
  return false;
}

function readBanks(): AssessmentCourseBank[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw && cachedBanks) return cachedBanks;
    cachedRaw = raw;
    if (!raw) {
      cachedBanks = structuredClone(DEFAULT_COURSE_BANKS);
      writeBanks(cachedBanks, { notify: false });
      return cachedBanks;
    }
    const parsed = JSON.parse(raw) as AssessmentCourseBank[];
    const hydrated = hydrateCourseBanks(parsed);
    if (banksNeedPersist(parsed, hydrated)) {
      writeBanks(hydrated, { notify: false });
      return hydrated;
    }
    cachedBanks = hydrated;
    return cachedBanks;
  } catch {
    cachedBanks = structuredClone(DEFAULT_COURSE_BANKS);
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
