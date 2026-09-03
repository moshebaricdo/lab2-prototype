import type {
  AssessmentArtifact,
  AssessmentQuestionRef,
  AssessmentSection,
} from "../../types/assessmentBuilder";

/**
 * Sectioned-outline helpers for the P0 builder.
 *
 * Invariant: an assessment is either flat (`sections` undefined/empty, order
 * lives in `questionRefs`) or fully sectioned (every question in a section,
 * `questionRefs` kept as the flattened mirror so adapters/preview/scoring
 * never have to know about sections).
 */

/** Stable identity for a ref — bank id either way. */
export function questionRefId(ref: AssessmentQuestionRef): string {
  return ref.type === "bank" ? ref.bankId : ref.item.bankId;
}

export function isSectioned(artifact: AssessmentArtifact): boolean {
  return (artifact.sections?.length ?? 0) > 0;
}

export function createSectionId(): string {
  return `section-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Display title with `Section N` fallback for untitled sections. */
export function sectionDisplayTitle(
  section: AssessmentSection,
  index: number,
): string {
  return section.title?.trim() || `Section ${index + 1}`;
}

/**
 * Outline position label. Flat outlines count `1, 2, 3…`; sectioned outlines
 * are `page.item` (`2.1`) because each section is a page to the learner.
 */
export function formatOutlineNumber(
  sectionIndex: number | null,
  itemIndex: number,
): string {
  if (sectionIndex == null) return String(itemIndex + 1);
  return `${sectionIndex + 1}.${itemIndex + 1}`;
}

function flattenSections(sections: AssessmentSection[]): AssessmentQuestionRef[] {
  return sections.flatMap((section) => section.questionRefs);
}

/**
 * Commit a section layout onto the artifact, re-deriving the flattened
 * `questionRefs` mirror. Empty layouts flatten back to a flat outline
 * (keeping `sections: []` so hydration can tell "flattened" from "legacy").
 */
export function withSections(
  artifact: AssessmentArtifact,
  sections: AssessmentSection[],
): AssessmentArtifact {
  if (sections.length === 0) {
    return { ...artifact, sections: [] };
  }
  return {
    ...artifact,
    sections,
    questionRefs: flattenSections(sections),
  };
}

/**
 * Add a section. On a flat outline with questions this is the wrap step:
 * existing questions become Section 1. Flat and empty starts Section 1
 * empty; already-sectioned outlines append an empty section.
 */
export function addSection(artifact: AssessmentArtifact): AssessmentArtifact {
  const sections = artifact.sections ?? [];
  if (sections.length === 0) {
    return withSections(artifact, [
      { id: createSectionId(), questionRefs: [...artifact.questionRefs] },
    ]);
  }
  return withSections(artifact, [
    ...sections,
    { id: createSectionId(), questionRefs: [] },
  ]);
}

/** Set or clear a section's custom title. Empty string removes the title. */
export function renameSection(
  artifact: AssessmentArtifact,
  sectionId: string,
  title: string,
): AssessmentArtifact {
  const sections = artifact.sections ?? [];
  const index = sections.findIndex((section) => section.id === sectionId);
  if (index === -1) return artifact;
  const trimmed = title.trim();
  const nextTitle = trimmed.length > 0 ? trimmed : undefined;
  if (sections[index].title === nextTitle) return artifact;
  return withSections(
    artifact,
    sections.map((section) =>
      section.id === sectionId ? { ...section, title: nextTitle } : section,
    ),
  );
}

/** Move a section up (-1) or down (+1) one slot. */
export function moveSection(
  artifact: AssessmentArtifact,
  sectionId: string,
  direction: -1 | 1,
): AssessmentArtifact {
  const sections = artifact.sections ?? [];
  const from = sections.findIndex((section) => section.id === sectionId);
  const to = from + direction;
  if (from === -1 || to < 0 || to >= sections.length) return artifact;
  const next = [...sections];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return withSections(artifact, next);
}

/** Move a section to an explicit index (drag-reorder of collapsed sections). */
export function moveSectionToIndex(
  artifact: AssessmentArtifact,
  sectionId: string,
  toIndex: number,
): AssessmentArtifact {
  const sections = artifact.sections ?? [];
  const from = sections.findIndex((section) => section.id === sectionId);
  if (from === -1) return artifact;
  const to = Math.max(0, Math.min(sections.length - 1, toIndex));
  if (from === to) return artifact;
  const next = [...sections];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return withSections(artifact, next);
}

/**
 * Dissolve a section, keeping its questions: they merge into the previous
 * section (or the next when it is first). Ungrouping the only section
 * flattens the outline.
 */
export function ungroupSection(
  artifact: AssessmentArtifact,
  sectionId: string,
): AssessmentArtifact {
  const sections = artifact.sections ?? [];
  const index = sections.findIndex((section) => section.id === sectionId);
  if (index === -1) return artifact;
  if (sections.length === 1) {
    return { ...artifact, sections: [], questionRefs: [...sections[0].questionRefs] };
  }
  const absorbed = sections[index].questionRefs;
  const next = sections.filter((section) => section.id !== sectionId);
  const targetIndex = Math.max(0, index - 1);
  next[targetIndex] = {
    ...next[targetIndex],
    questionRefs:
      index === 0
        ? [...absorbed, ...next[targetIndex].questionRefs]
        : [...next[targetIndex].questionRefs, ...absorbed],
  };
  return withSections(artifact, next);
}

/**
 * Delete a section and its questions. Deleting the last section flattens
 * back to an empty flat outline.
 */
export function deleteSection(
  artifact: AssessmentArtifact,
  sectionId: string,
): AssessmentArtifact {
  const sections = artifact.sections ?? [];
  const next = sections.filter((section) => section.id !== sectionId);
  if (next.length === sections.length) return artifact;
  if (next.length === 0) {
    return { ...artifact, sections: [], questionRefs: [] };
  }
  return withSections(artifact, next);
}

/**
 * Append a question. Sectioned outlines default to the last section unless
 * a target section is given; flat outlines append to the flat list.
 */
export function appendQuestionRef(
  artifact: AssessmentArtifact,
  ref: AssessmentQuestionRef,
  sectionId?: string | null,
): AssessmentArtifact {
  if (!isSectioned(artifact)) {
    return { ...artifact, questionRefs: [...artifact.questionRefs, ref] };
  }
  const sections = artifact.sections ?? [];
  const targetId = sectionId ?? sections[sections.length - 1].id;
  return withSections(
    artifact,
    sections.map((section) =>
      section.id === targetId
        ? { ...section, questionRefs: [...section.questionRefs, ref] }
        : section,
    ),
  );
}

/** Remove a question wherever it lives (flat list or any section). */
export function removeQuestionRef(
  artifact: AssessmentArtifact,
  bankId: string,
): AssessmentArtifact {
  if (!isSectioned(artifact)) {
    return {
      ...artifact,
      questionRefs: artifact.questionRefs.filter(
        (ref) => questionRefId(ref) !== bankId,
      ),
    };
  }
  return withSections(
    artifact,
    (artifact.sections ?? []).map((section) => ({
      ...section,
      questionRefs: section.questionRefs.filter(
        (ref) => questionRefId(ref) !== bankId,
      ),
    })),
  );
}

/** Drop target for a question move. `sectionId: null` targets the flat list. */
export interface OutlineDropTarget {
  sectionId: string | null;
  /** Insertion index within the target list (after the drag item is removed). */
  index: number;
}

/**
 * Move a question within or across sections (or within the flat list).
 * The index is interpreted against the target list with the dragged ref
 * already removed.
 */
export function moveQuestionRef(
  artifact: AssessmentArtifact,
  bankId: string,
  target: OutlineDropTarget,
): AssessmentArtifact {
  if (!isSectioned(artifact)) {
    const ref = artifact.questionRefs.find(
      (entry) => questionRefId(entry) === bankId,
    );
    if (!ref) return artifact;
    const rest = artifact.questionRefs.filter(
      (entry) => questionRefId(entry) !== bankId,
    );
    const index = Math.max(0, Math.min(rest.length, target.index));
    return {
      ...artifact,
      questionRefs: [...rest.slice(0, index), ref, ...rest.slice(index)],
    };
  }

  const sections = artifact.sections ?? [];
  let moved: AssessmentQuestionRef | undefined;
  const stripped = sections.map((section) => {
    const match = section.questionRefs.find(
      (entry) => questionRefId(entry) === bankId,
    );
    if (match) moved = match;
    return {
      ...section,
      questionRefs: section.questionRefs.filter(
        (entry) => questionRefId(entry) !== bankId,
      ),
    };
  });
  if (!moved || target.sectionId == null) return artifact;

  const next = stripped.map((section) => {
    if (section.id !== target.sectionId) return section;
    const index = Math.max(0, Math.min(section.questionRefs.length, target.index));
    return {
      ...section,
      questionRefs: [
        ...section.questionRefs.slice(0, index),
        moved as AssessmentQuestionRef,
        ...section.questionRefs.slice(index),
      ],
    };
  });
  return withSections(artifact, next);
}

/**
 * Replace a question ref in place (identity by bank id) wherever it lives,
 * keeping the flattened mirror in sync.
 */
export function replaceQuestionRef(
  artifact: AssessmentArtifact,
  bankId: string,
  nextRef: AssessmentQuestionRef,
): AssessmentArtifact {
  const swap = (refs: AssessmentQuestionRef[]) =>
    refs.map((ref) => (questionRefId(ref) === bankId ? nextRef : ref));
  if (!isSectioned(artifact)) {
    return { ...artifact, questionRefs: swap(artifact.questionRefs) };
  }
  return withSections(
    artifact,
    (artifact.sections ?? []).map((section) => ({
      ...section,
      questionRefs: swap(section.questionRefs),
    })),
  );
}
