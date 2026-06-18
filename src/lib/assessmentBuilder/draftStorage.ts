import type { AssessmentArtifact } from "../../types/assessmentBuilder";
import {
  mockExamAssessment,
  mockQuizAssessment,
  mockSingleMultiAssessment,
  mockSurveyAssessment,
} from "../../data/assessmentBuilder/mockAssessments";

const STORAGE_KEY = "lab2:assessment-drafts";

const DEFAULT_DRAFTS: AssessmentArtifact[] = [
  mockSingleMultiAssessment,
  mockSurveyAssessment,
  mockQuizAssessment,
  mockExamAssessment,
];

let cachedRaw: string | null = null;
let cachedDrafts: AssessmentArtifact[] | null = null;

function readDrafts(): AssessmentArtifact[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw && cachedDrafts) return cachedDrafts;
    cachedRaw = raw;
    if (!raw) {
      cachedDrafts = structuredClone(DEFAULT_DRAFTS);
      writeDrafts(cachedDrafts, { notify: false });
      return cachedDrafts;
    }
    cachedDrafts = JSON.parse(raw) as AssessmentArtifact[];
    return cachedDrafts;
  } catch {
    cachedDrafts = structuredClone(DEFAULT_DRAFTS);
    return cachedDrafts;
  }
}

function writeDrafts(drafts: AssessmentArtifact[], options?: { notify?: boolean }) {
  const json = JSON.stringify(drafts);
  localStorage.setItem(STORAGE_KEY, json);
  cachedRaw = json;
  cachedDrafts = drafts;
  if (options?.notify !== false) {
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  }
}

export function getAssessmentDrafts(): AssessmentArtifact[] {
  return readDrafts();
}

export function getAssessmentDraft(id: string): AssessmentArtifact | undefined {
  return readDrafts().find((draft) => draft.id === id);
}

export function upsertAssessmentDraft(artifact: AssessmentArtifact): AssessmentArtifact {
  const drafts = readDrafts();
  const index = drafts.findIndex((draft) => draft.id === artifact.id);
  const next = { ...artifact, updatedAt: Date.now() };
  const nextDrafts =
    index === -1
      ? [next, ...drafts]
      : drafts.map((draft, i) => (i === index ? next : draft));
  writeDrafts(nextDrafts);
  return next;
}

export function resetAssessmentDrafts() {
  writeDrafts(structuredClone(DEFAULT_DRAFTS));
}
