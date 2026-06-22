import type { AssessmentArtifact } from "../../types/assessmentBuilder";
import {
  mockBlankAssessment,
  mockSeededAssessment,
} from "../../data/assessmentBuilder/mockAssessments";

const STORAGE_KEY = "lab2:assessment-drafts";

const DEFAULT_DRAFTS: AssessmentArtifact[] = [
  mockBlankAssessment,
  mockSeededAssessment,
];

let cachedRaw: string | null = null;
let cachedDrafts: AssessmentArtifact[] | null = null;

let draftSnapshotRawKey: string | null = null;
const artifactSnapshots = new Map<string, AssessmentArtifact | undefined>();

function mergeMissingDefaultDrafts(drafts: AssessmentArtifact[]): AssessmentArtifact[] {
  const existingIds = new Set(drafts.map((draft) => draft.id));
  const missing = DEFAULT_DRAFTS.filter((draft) => !existingIds.has(draft.id));
  if (missing.length === 0) return drafts;
  return [...drafts, ...missing.map((draft) => structuredClone(draft))];
}

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
    const parsed = JSON.parse(raw) as AssessmentArtifact[];
    const merged = mergeMissingDefaultDrafts(parsed);
    if (merged.length !== parsed.length) {
      writeDrafts(merged, { notify: false });
      return merged;
    }
    cachedDrafts = parsed;
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
  draftSnapshotRawKey = null;
  artifactSnapshots.clear();
  if (options?.notify !== false) {
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  }
}

/** Cached snapshot for `useSyncExternalStore` — stable reference until storage changes. */
export function getAssessmentDraftSnapshot(id: string): AssessmentArtifact | undefined {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw !== draftSnapshotRawKey) {
    draftSnapshotRawKey = raw;
    artifactSnapshots.clear();
  }
  if (!artifactSnapshots.has(id)) {
    artifactSnapshots.set(id, readDrafts().find((draft) => draft.id === id));
  }
  return artifactSnapshots.get(id);
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
