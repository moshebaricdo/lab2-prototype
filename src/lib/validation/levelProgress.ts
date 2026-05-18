import type {
  LevelProgressCriterion,
  LevelProgressSnapshot,
  ValidationReviewCardData,
  ValidationReviewItem,
} from "../../types/validationReview";

function criterionFromItem(item: ValidationReviewItem): LevelProgressCriterion {
  return {
    id: item.id,
    label: item.label,
    status: item.status,
    detail: item.detail,
  };
}

export function buildLevelProgressSnapshot(
  review?: ValidationReviewCardData | null,
): LevelProgressSnapshot | undefined {
  if (!review || review.kind !== "summary") return undefined;

  const criteria = review.items?.map(criterionFromItem) ?? [];
  const passedCriteria = criteria.filter((item) => item.status === "pass");
  const incompleteCriteria = criteria.filter((item) => item.status !== "pass");
  const nextIncompleteCriterion = incompleteCriteria[0];
  const phase: LevelProgressSnapshot["phase"] =
    review.status === "likely_complete"
      ? "ready_to_continue"
      : passedCriteria.length > 0
        ? "partially_complete"
        : "not_started";

  return {
    title: review.title,
    mode: review.mode,
    status: review.status ?? "not_started",
    phase,
    passedCriteria,
    incompleteCriteria,
    nextIncompleteCriterion,
    requirements: review.requirements,
    nextStep: review.nextStep,
  };
}
