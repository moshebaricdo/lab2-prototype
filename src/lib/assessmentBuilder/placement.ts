import type { QuizPlacement } from "../../types/assessmentBuilder";

export const FLOATING_PLACEMENT_LABEL = "Draft · not in a live unit";

export function isQuizAttached(
  placement: QuizPlacement | undefined,
): placement is Extract<QuizPlacement, { kind: "attached" }> {
  return placement?.kind === "attached";
}

/** Writer-facing chrome: floating vs “Used in {course} · {unit}”. */
export function quizPlacementLabel(placement: QuizPlacement | undefined): string {
  if (!isQuizAttached(placement)) return FLOATING_PLACEMENT_LABEL;
  return placement.unitLabel
    ? `Used in ${placement.courseLabel} · ${placement.unitLabel}`
    : `Used in ${placement.courseLabel}`;
}

export interface BankFilterScope {
  /** Courses whose entire unit set is selected (parent check, not per-unit). */
  fullCourseIds: string[];
  /** Individually selected units (partial course). */
  unitIds: string[];
}

/**
 * Default bank scope from quiz placement. Attached → that family + unit
 * (clearable; parent course shows indeterminate). Floating → empty;
 * name / standard / type still work.
 */
export function bankFilterDefaults(
  placement: QuizPlacement | undefined,
): BankFilterScope {
  if (!isQuizAttached(placement)) {
    return { fullCourseIds: [], unitIds: [] };
  }
  if (placement.unitId) {
    return { fullCourseIds: [], unitIds: [placement.unitId] };
  }
  return { fullCourseIds: [placement.courseId], unitIds: [] };
}

export function placementScopeKey(
  placement: QuizPlacement | undefined,
): string {
  if (!isQuizAttached(placement)) return "floating";
  return `attached:${placement.courseId}:${placement.unitId ?? ""}`;
}
