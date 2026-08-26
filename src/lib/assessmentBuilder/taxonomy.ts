import type {
  AssessmentCourseBank,
  CourseUnit,
  DomainTag,
  QuestionItem,
} from "../../types/assessmentBuilder";

export interface TaxonomyOption {
  value: string;
  label: string;
}

export interface UnitOption extends TaxonomyOption {
  courseId: string;
  conceptIds: string[];
}

export function getUnitsForBanks(
  banks: AssessmentCourseBank[],
  courseIds?: string[],
): UnitOption[] {
  const scoped =
    courseIds && courseIds.length > 0
      ? banks.filter((bank) => courseIds.includes(bank.courseId))
      : banks;

  return scoped.flatMap((bank) =>
    (bank.units ?? []).map((unit) => ({
      value: unit.id,
      label: unit.label,
      courseId: bank.courseId,
      conceptIds: unit.conceptIds,
    })),
  );
}

export function getConceptsForBanks(
  banks: AssessmentCourseBank[],
  courseIds?: string[],
  unitIds?: string[],
): TaxonomyOption[] {
  const scoped =
    courseIds && courseIds.length > 0
      ? banks.filter((bank) => courseIds.includes(bank.courseId))
      : banks;

  const selectedUnits =
    unitIds && unitIds.length > 0
      ? new Set(
          scoped
            .flatMap((bank) => bank.units ?? [])
            .filter((unit) => unitIds.includes(unit.id))
            .flatMap((unit) => unit.conceptIds),
        )
      : null;

  const concepts = new Map<string, DomainTag>();
  for (const bank of scoped) {
    for (const domain of bank.domains) {
      if (selectedUnits && !selectedUnits.has(domain.id)) continue;
      concepts.set(domain.id, domain);
    }
  }

  return Array.from(concepts.values()).map((concept) => ({
    value: concept.id,
    label: concept.label,
  }));
}

export function getUnitOptionsForCourse(
  banks: AssessmentCourseBank[],
  courseId: string,
): UnitOption[] {
  return getUnitsForBanks(banks, [courseId]);
}

export function getConceptOptionsForCourse(
  banks: AssessmentCourseBank[],
  courseId: string,
  unitId?: string,
): TaxonomyOption[] {
  return getConceptsForBanks(
    banks,
    [courseId],
    unitId ? [unitId] : undefined,
  );
}

export function findUnit(
  banks: AssessmentCourseBank[],
  unitId: string | undefined,
): CourseUnit | undefined {
  if (!unitId) return undefined;
  for (const bank of banks) {
    const match = (bank.units ?? []).find((unit) => unit.id === unitId);
    if (match) return match;
  }
  return undefined;
}

export function unitLabel(
  banks: AssessmentCourseBank[],
  unitId: string | undefined,
): string | undefined {
  return findUnit(banks, unitId)?.label;
}

export function standardLabel(tag: DomainTag): string {
  return tag.code ?? tag.label;
}

const COURSE_SCOPE_PREFIX = "course:";
const UNIT_SCOPE_PREFIX = "unit:";

export function courseScopeValue(courseId: string): string {
  return `${COURSE_SCOPE_PREFIX}${courseId}`;
}

export function unitScopeValue(unitId: string): string {
  return `${UNIT_SCOPE_PREFIX}${unitId}`;
}

export function parseCourseOrUnitValues(values: string[]): {
  courseIds: string[];
  unitIds: string[];
} {
  const courseIds: string[] = [];
  const unitIds: string[] = [];
  for (const value of values) {
    if (value.startsWith(COURSE_SCOPE_PREFIX)) {
      courseIds.push(value.slice(COURSE_SCOPE_PREFIX.length));
    } else if (value.startsWith(UNIT_SCOPE_PREFIX)) {
      unitIds.push(value.slice(UNIT_SCOPE_PREFIX.length));
    }
  }
  return { courseIds, unitIds };
}

export function getCourseOrUnitOptions(banks: AssessmentCourseBank[]) {
  const courses = banks.map((bank) => ({
    value: courseScopeValue(bank.courseId),
    label: bank.courseName,
    iconName: "book" as const,
  }));
  const units = getUnitsForBanks(banks).map((unit) => ({
    value: unitScopeValue(unit.value),
    label: unit.label,
    iconName: "book" as const,
  }));

  return [
    { type: "group" as const, label: "Courses" },
    ...courses,
    { type: "group" as const, label: "Units" },
    ...units,
  ];
}

export function questionMatchesCourseOrUnit(
  question: QuestionItem,
  selectedCourseIds: string[],
  selectedUnitIds: string[],
): boolean {
  const hasCourse = selectedCourseIds.length > 0;
  const hasUnit = selectedUnitIds.length > 0;
  if (!hasCourse && !hasUnit) return true;
  if (hasCourse && selectedCourseIds.includes(question.courseId)) return true;
  if (hasUnit && question.unitId != null && selectedUnitIds.includes(question.unitId)) {
    return true;
  }
  return false;
}

export function questionStemPreview(question: QuestionItem): string {
  return question.item.content.prompt.trim();
}

export function questionMatchesTaxonomy(
  question: QuestionItem,
  selectedCourseIds: string[],
  selectedUnitIds: string[],
  selectedConceptIds: string[],
): boolean {
  if (
    selectedCourseIds.length > 0 &&
    !selectedCourseIds.includes(question.courseId)
  ) {
    return false;
  }

  if (
    selectedUnitIds.length > 0 &&
    (question.unitId == null || !selectedUnitIds.includes(question.unitId))
  ) {
    return false;
  }

  if (
    selectedConceptIds.length > 0 &&
    !question.tags.some((tag) => selectedConceptIds.includes(tag.id))
  ) {
    return false;
  }

  return true;
}
