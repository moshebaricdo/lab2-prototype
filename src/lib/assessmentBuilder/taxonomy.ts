import type {
  AssessmentCourseBank,
  CourseUnit,
  DomainTag,
  QuestionItem,
} from "../../types/assessmentBuilder";

export interface TaxonomyOption {
  value: string;
  label: string;
  code?: string;
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
    code: concept.code,
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

export function questionStemPreview(question: QuestionItem): string {
  return question.item.content.prompt.trim();
}

/**
 * Course/unit layer is a union: a full-course selection matches every
 * question in that family; individually selected units match by `unitId`.
 * Empty scope matches all. Standards still AND with that union.
 */
export function questionMatchesTaxonomy(
  question: QuestionItem,
  fullCourseIds: string[],
  selectedUnitIds: string[],
  selectedConceptIds: string[],
): boolean {
  const hasScope = fullCourseIds.length > 0 || selectedUnitIds.length > 0;
  if (hasScope) {
    const matchesCourse = fullCourseIds.includes(question.courseId);
    const matchesUnit =
      question.unitId != null && selectedUnitIds.includes(question.unitId);
    if (!matchesCourse && !matchesUnit) return false;
  }

  if (
    selectedConceptIds.length > 0 &&
    !question.tags.some((tag) => selectedConceptIds.includes(tag.id))
  ) {
    return false;
  }

  return true;
}

/** Standards available for the current course/unit union (empty = all). */
export function getConceptsForScope(
  banks: AssessmentCourseBank[],
  fullCourseIds: string[],
  unitIds: string[],
): TaxonomyOption[] {
  if (fullCourseIds.length === 0 && unitIds.length === 0) {
    return getConceptsForBanks(banks);
  }

  const merged = new Map<string, TaxonomyOption>();
  const fromCourses =
    fullCourseIds.length > 0
      ? getConceptsForBanks(banks, fullCourseIds)
      : [];
  const fromUnits =
    unitIds.length > 0
      ? getConceptsForBanks(banks, undefined, unitIds)
      : [];

  for (const option of [...fromCourses, ...fromUnits]) {
    merged.set(option.value, option);
  }
  return Array.from(merged.values());
}

/** Group header for the standards typeahead (CSTA / AP / course frameworks). */
export function standardFrameworkGroup(code?: string): string {
  if (!code) return "Other";
  if (/^(1A|1B|2|3A|3B)-/i.test(code)) return "CSTA Framework";
  if (/^AP[- ]/i.test(code)) return "AP Framework";
  if (code.startsWith("HS-AI")) return "AI Framework";
  if (code.startsWith("HS-WEB")) return "Web Framework";
  return "Other";
}

export function groupStandardsByFramework(
  options: TaxonomyOption[],
): Array<{ group: string; items: TaxonomyOption[] }> {
  const order = [
    "CSTA Framework",
    "AP Framework",
    "AI Framework",
    "Web Framework",
    "Other",
  ];
  const grouped = new Map<string, TaxonomyOption[]>();
  for (const option of options) {
    const group = standardFrameworkGroup(option.code);
    const items = grouped.get(group) ?? [];
    items.push(option);
    grouped.set(group, items);
  }
  return order
    .filter((group) => grouped.has(group))
    .map((group) => ({ group, items: grouped.get(group) ?? [] }));
}
