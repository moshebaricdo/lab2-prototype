import type {
  AssessmentArtifact,
  AssessmentQuestionRef,
} from "../../types/assessmentBuilder";
import {
  mockBlankAssessment,
  mockP0CfuAssessment,
  mockP0ExamAssessment,
  mockP0FloatingAssessment,
  mockQuizPracticeAssessment,
  mockSeededAssessment,
} from "../../data/assessmentBuilder/mockAssessments";

const STORAGE_KEY = "lab2:assessment-drafts";

const DEFAULT_DRAFTS: AssessmentArtifact[] = [
  mockBlankAssessment,
  mockSeededAssessment,
  mockP0ExamAssessment,
  mockP0CfuAssessment,
  mockP0FloatingAssessment,
  mockQuizPracticeAssessment,
];

let cachedRaw: string | null = null;
let cachedDrafts: AssessmentArtifact[] | null = null;

let draftSnapshotRawKey: string | null = null;
const artifactSnapshots = new Map<string, AssessmentArtifact | undefined>();

/** Retired P0 seed types (fill-in-blank / ordering) → current MC / Matching ids. */
const P0_EXAM_BANK_ID_ALIASES: Record<string, string> = {
  "q-aif-fib-1": "q-aif-multi-features",
  "q-aif-parsons-1": "q-aif-match-training",
};

function remapP0ExamBankRef(
  ref: AssessmentQuestionRef,
): AssessmentQuestionRef {
  if (ref.type !== "bank") return ref;
  const nextId = P0_EXAM_BANK_ID_ALIASES[ref.bankId];
  return nextId ? { type: "bank", bankId: nextId } : ref;
}

function mergeMissingDefaultDrafts(drafts: AssessmentArtifact[]): AssessmentArtifact[] {
  const existingIds = new Set(drafts.map((draft) => draft.id));
  const missing = DEFAULT_DRAFTS.filter((draft) => !existingIds.has(draft.id));
  if (missing.length === 0) return drafts;
  return [...drafts, ...missing.map((draft) => structuredClone(draft))];
}

/**
 * Upgrade stored drafts that predate sectioned outlines, quiz placement,
 * named P0 sections, or the P0-only question-type seed. A draft without a
 * `sections` key was written before sections existed; reseed the P0 exam so
 * the outline is demoable. Missing placement / seed titles / lesson name /
 * level id fill from the seed without wiping author edits. Placeholder
 * “New quiz” titles on the floating draft upgrade to the Levelbuilder name.
 * Stale fill-in-blank and
 * ordering refs remap to the current Multiple Choice / Matching items.
 * Untouched CFU seeds that still have the old attempts-off default pick up
 * attempts-on + require-correct (legacy CfU).
 */
function hydrateDrafts(drafts: AssessmentArtifact[]): AssessmentArtifact[] {
  let changed = false;
  const next = drafts.map((draft) => {
    if (draft.id === mockP0ExamAssessment.id) {
      if (
        draft.purpose == null ||
        draft.title === "AI Foundations Certification Exam"
      ) {
        changed = true;
        return structuredClone(mockP0ExamAssessment);
      }
    }
    if (draft.id === mockP0FloatingAssessment.id) {
      const placeholderTitle =
        !draft.title.trim() ||
        draft.title === "New quiz" ||
        draft.title === "New checkpoint";
      if (placeholderTitle) {
        changed = true;
        return {
          ...draft,
          title: mockP0FloatingAssessment.title,
          metadata: {
            ...draft.metadata,
            assessmentName: mockP0FloatingAssessment.metadata.assessmentName,
          },
          levelId: draft.levelId ?? mockP0FloatingAssessment.levelId,
        };
      }
      if (draft.levelId == null && mockP0FloatingAssessment.levelId != null) {
        changed = true;
        return { ...draft, levelId: mockP0FloatingAssessment.levelId };
      }
    }
    if (draft.id === mockP0CfuAssessment.id) {
      const looksLikeOldCfuSeed =
        draft.allowMultipleAttempts === false &&
        draft.requireCorrectAnswerToContinue == null &&
        draft.feedback?.showCorrectness === true &&
        draft.feedback?.revealAnswerExplanation === false &&
        draft.tutor.enabled === false &&
        draft.showIntroScreen === false;
      if (looksLikeOldCfuSeed) {
        changed = true;
        return {
          ...draft,
          allowMultipleAttempts: true,
          requireCorrectAnswerToContinue: true,
          attempts: undefined,
        };
      }
    }
    if (draft.id !== mockP0ExamAssessment.id) return draft;
    if (!("sections" in draft)) {
      changed = true;
      return structuredClone(mockP0ExamAssessment);
    }

    let updated = draft;
    if (draft.placement == null) {
      changed = true;
      updated = {
        ...updated,
        placement: structuredClone(mockP0ExamAssessment.placement),
      };
    }
    if (updated.lessonName === "AI Foundations" || updated.lessonName === "AIF Practice Exam") {
      changed = true;
      updated = { ...updated, lessonName: mockP0ExamAssessment.lessonName };
    }
    if (updated.levelId == null && mockP0ExamAssessment.levelId != null) {
      changed = true;
      updated = { ...updated, levelId: mockP0ExamAssessment.levelId };
    }
    const stalePlacementName = updated.unitPlacements?.[0]?.unitName ?? "";
    if (
      (stalePlacementName === "Unit 3 · 2025" ||
        stalePlacementName.startsWith("Unit 3 ·")) &&
      mockP0ExamAssessment.unitPlacements
    ) {
      changed = true;
      updated = {
        ...updated,
        unitPlacements: structuredClone(mockP0ExamAssessment.unitPlacements),
        updatedAt: mockP0ExamAssessment.updatedAt,
      };
    }

    const seedById = new Map(
      (mockP0ExamAssessment.sections ?? []).map((section) => [
        section.id,
        section.title,
      ]),
    );
    const sections = (updated.sections ?? []).map((section) => {
      const seedTitle = seedById.get(section.id);
      const remappedRefs = section.questionRefs.map(remapP0ExamBankRef);
      const refsChanged = remappedRefs.some(
        (ref, index) => ref !== section.questionRefs[index],
      );
      if (seedTitle && !section.title?.trim()) {
        changed = true;
        return {
          ...section,
          title: seedTitle,
          questionRefs: refsChanged ? remappedRefs : section.questionRefs,
        };
      }
      if (refsChanged) {
        changed = true;
        return { ...section, questionRefs: remappedRefs };
      }
      return section;
    });
    if (sections !== updated.sections) {
      updated = { ...updated, sections };
    }

    const remappedFlat = updated.questionRefs.map(remapP0ExamBankRef);
    if (remappedFlat.some((ref, index) => ref !== updated.questionRefs[index])) {
      changed = true;
      updated = { ...updated, questionRefs: remappedFlat };
    }
    return updated;
  });
  return changed ? next : drafts;
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
    const merged = hydrateDrafts(mergeMissingDefaultDrafts(parsed));
    if (merged !== parsed || merged.length !== parsed.length) {
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
