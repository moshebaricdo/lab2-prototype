import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Button,
  Checkbox,
  Dropdown,
  FieldWrapper,
  TextInput,
} from "@moshebari/cads-react";
import { FaIcon, type FaIconName } from "@moshebari/cads-react/icons";
import type {
  AssessmentCourseBank,
  QuestionItemKind,
} from "../../../../types/assessmentBuilder";
import { type TaxonomyOption } from "../../../../lib/assessmentBuilder";
import { FINAL_BANK_KIND_FILTER_OPTIONS } from "./questionKindMeta";
import { StandardsTypeaheadPanel } from "./StandardsTypeahead";
import styles from "./QuestionBankFilterMenu.module.scss";

export type BankSort = "az" | "za" | "newest" | "oldest" | "kind";

type FilterView = "main" | "courses" | "standards";

interface QuestionBankFilterMenuProps {
  open: boolean;
  sort: BankSort;
  onSortChange: (sort: BankSort) => void;
  courseBanks: AssessmentCourseBank[];
  fullCourseIds: string[];
  unitIds: string[];
  onCourseScopeChange: (next: {
    fullCourseIds: string[];
    unitIds: string[];
  }) => void;
  standardIds: string[];
  standardOptions: TaxonomyOption[];
  onStandardIdsChange: (ids: string[]) => void;
  kindIds: QuestionItemKind[];
  onKindIdsChange: (kindIds: QuestionItemKind[]) => void;
  hideAddedItems: boolean;
  onHideAddedItemsChange: (hide: boolean) => void;
  isDirty: boolean;
  onReset: () => void;
}

const SORT_OPTIONS: Array<{ value: BankSort; label: string }> = [
  { value: "az", label: "Alphabetical (A-Z)" },
  { value: "za", label: "Alphabetical (Z-A)" },
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "kind", label: "Question Type" },
];

const KIND_OPTIONS = FINAL_BANK_KIND_FILTER_OPTIONS.map((option) => ({
  value: option.kind,
  label: option.label,
}));

function asStringArray(value: string | string[]): string[] {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
}

function matchesQuery(haystack: string, query: string): boolean {
  if (query.length === 0) return true;
  return haystack.toLowerCase().includes(query);
}

function overflowSummary(labels: string[], visible = 3): string {
  if (labels.length === 0) return "";
  if (labels.length <= visible) return labels.join(", ");
  return `${labels.slice(0, visible).join(", ")}, +${labels.length - visible}`;
}

function courseUnitSummary(
  banks: AssessmentCourseBank[],
  fullCourseIds: string[],
  unitIds: string[],
): string {
  const parts: string[] = [];
  for (const bank of banks) {
    const units = bank.units ?? [];
    if (fullCourseIds.includes(bank.courseId)) {
      parts.push(`${bank.courseName} (All)`);
      continue;
    }
    const selectedCount = units.filter((unit) =>
      unitIds.includes(unit.id),
    ).length;
    if (selectedCount > 0) {
      parts.push(
        `${bank.courseName} (${selectedCount} unit${selectedCount === 1 ? "" : "s"})`,
      );
    }
  }
  return parts.join(", ");
}

/** CADS checklist menus ignore `menuWidth` and hug content; lock to the trigger. */
function syncChecklistMenuToTrigger(triggerRoot: HTMLElement | null) {
  const trigger = triggerRoot?.querySelector("button");
  const menus = document.querySelectorAll<HTMLElement>(
    "[data-cads-dropdown-menu]",
  );
  const menu = menus[menus.length - 1];
  if (!trigger || !menu) return;
  const width = `${Math.round(trigger.getBoundingClientRect().width)}px`;
  const popper = menu.parentElement;
  if (popper) {
    popper.style.width = width;
    popper.style.minWidth = width;
  }
  menu.style.width = width;
  menu.style.minWidth = width;
  menu.style.setProperty("--dd-panel-width", width);
  menu.style.setProperty("--dd-panel-min-width", width);
}

/** CADS extraSmall checklist row — same chrome as Dropdown menuType=checklist. */
function ChecklistItem({
  selected,
  indeterminate,
  indented,
  onClick,
  children,
}: {
  selected: boolean;
  indeterminate?: boolean;
  indented?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      aria-checked={indeterminate ? "mixed" : selected}
      className={[styles.item, indented ? styles.itemIndented : ""]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
    >
      <span className={styles.itemInner}>
        <span
          aria-hidden
          className={[
            styles.checkbox,
            selected
              ? styles.checkboxSelected
              : indeterminate
                ? styles.checkboxIndeterminate
                : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {selected ? (
            <FaIcon name="check" fontSize="0.625rem" />
          ) : indeterminate ? (
            <FaIcon name="minus" fontSize="0.625rem" />
          ) : null}
        </span>
        <span className={styles.itemLabel}>{children}</span>
      </span>
    </button>
  );
}

function FilterFieldTrigger({
  label,
  value,
  placeholder,
  applied,
  endIcon,
  onClick,
}: {
  label: string;
  value: string;
  placeholder: string;
  applied: boolean;
  endIcon: FaIconName;
  onClick: () => void;
}) {
  return (
    <div className={styles.field}>
      <FieldWrapper size="extraSmall" label={label}>
        <button type="button" className={styles.fieldTrigger} onClick={onClick}>
          {applied && (
            <span className={styles.fieldCheck} aria-hidden>
              <FaIcon name="circle-check" fontSize="12px" />
            </span>
          )}
          <span
            className={applied ? styles.fieldValue : styles.fieldPlaceholder}
          >
            {applied ? value : placeholder}
          </span>
          <span className={styles.fieldChevron} aria-hidden>
            <FaIcon name={endIcon} fontSize="12px" />
          </span>
        </button>
      </FieldWrapper>
    </div>
  );
}

export function QuestionBankFilterMenu({
  open,
  sort,
  onSortChange,
  courseBanks,
  fullCourseIds,
  unitIds,
  onCourseScopeChange,
  standardIds,
  standardOptions,
  onStandardIdsChange,
  kindIds,
  onKindIdsChange,
  hideAddedItems,
  onHideAddedItemsChange,
  isDirty,
  onReset,
}: QuestionBankFilterMenuProps) {
  const [view, setView] = useState<FilterView>("main");
  const [query, setQuery] = useState("");
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const kindFieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setView("main");
      setQuery("");
    }
  }, [open]);

  useEffect(() => {
    setQuery("");
  }, [view]);

  useEffect(() => {
    if (view === "main") return;
    const input = searchWrapRef.current?.querySelector("input");
    input?.focus();
  }, [view]);

  const normalizedQuery = query.trim().toLowerCase();

  const courseGroups = useMemo(() => {
    return courseBanks
      .map((bank) => {
        const units = bank.units ?? [];
        const courseMatches = matchesQuery(
          `${bank.courseName} ${bank.courseId}`,
          normalizedQuery,
        );
        const visibleUnits = courseMatches
          ? units
          : units.filter((unit) => matchesQuery(unit.label, normalizedQuery));
        return {
          courseId: bank.courseId,
          courseName: bank.courseName,
          units: visibleUnits,
          allUnits: units,
          include: courseMatches || visibleUnits.length > 0,
        };
      })
      .filter((group) => group.include);
  }, [courseBanks, normalizedQuery]);

  const courseSummary = courseUnitSummary(
    courseBanks,
    fullCourseIds,
    unitIds,
  );
  const courseApplied = fullCourseIds.length > 0 || unitIds.length > 0;

  const standardSummary = overflowSummary(
    standardOptions
      .filter((option) => standardIds.includes(option.value))
      .map((option) => option.code ?? option.label),
  );
  const standardsApplied = standardIds.length > 0;

  const goBack = () => setView("main");

  const clearCourseScope = () => {
    onCourseScopeChange({ fullCourseIds: [], unitIds: [] });
  };

  const toggleCourse = (courseId: string, allUnitIds: string[]) => {
    if (fullCourseIds.includes(courseId)) {
      onCourseScopeChange({
        fullCourseIds: fullCourseIds.filter((id) => id !== courseId),
        unitIds: unitIds.filter((id) => !allUnitIds.includes(id)),
      });
      return;
    }
    onCourseScopeChange({
      fullCourseIds: [...fullCourseIds, courseId],
      unitIds: unitIds.filter((id) => !allUnitIds.includes(id)),
    });
  };

  const toggleUnit = (
    courseId: string,
    unitId: string,
    allUnitIds: string[],
  ) => {
    if (fullCourseIds.includes(courseId)) {
      onCourseScopeChange({
        fullCourseIds: fullCourseIds.filter((id) => id !== courseId),
        unitIds: [
          ...unitIds.filter((id) => !allUnitIds.includes(id)),
          unitId,
        ],
      });
      return;
    }

    const nextUnits = toggleId(unitIds, unitId);
    const selectedInCourse = allUnitIds.filter((id) => nextUnits.includes(id));
    if (
      allUnitIds.length > 0 &&
      selectedInCourse.length === allUnitIds.length
    ) {
      onCourseScopeChange({
        fullCourseIds: [...fullCourseIds, courseId],
        unitIds: nextUnits.filter((id) => !allUnitIds.includes(id)),
      });
      return;
    }
    onCourseScopeChange({
      fullCourseIds,
      unitIds: nextUnits,
    });
  };

  if (view === "standards") {
    return (
      <div className={styles.drill}>
        <StandardsTypeaheadPanel
          options={standardOptions}
          selectedIds={standardIds}
          onChange={onStandardIdsChange}
          onBack={goBack}
          onDone={goBack}
        />
      </div>
    );
  }

  if (view === "courses") {
    const empty = courseGroups.length === 0;

    return (
      <div className={styles.drill}>
        <div className={styles.drillHeader}>
          <Button
            variant="text"
            color="tertiary"
            size="extraSmall"
            iconOnly
            startIconName="chevron-left"
            aria-label="Back to filters"
            onClick={goBack}
          />
          <span className={styles.drillTitle}>Courses and units</span>
          <span className={styles.drillHeaderSpacer} aria-hidden />
        </div>
        <div className={styles.searchRow} ref={searchWrapRef}>
          <TextInput
            size="extraSmall"
            color="secondary"
            placeholder="Search by course or unit name"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search by course or unit name"
          />
        </div>
        <div
          className={[
            styles.optionList,
            empty ? styles.optionListEmpty : "",
          ]
            .filter(Boolean)
            .join(" ")}
          role="listbox"
          aria-label="Courses and units"
          aria-multiselectable
        >
          {empty ? (
            <p className={styles.emptyHint}>No results</p>
          ) : (
            courseGroups.map((group, index) => {
              const courseSelected = fullCourseIds.includes(group.courseId);
              const selectedUnitCount = group.allUnits.filter((unit) =>
                unitIds.includes(unit.id),
              ).length;
              const courseIndeterminate =
                !courseSelected &&
                selectedUnitCount > 0 &&
                selectedUnitCount < group.allUnits.length;
              return (
                <div key={group.courseId}>
                  {index > 0 && (
                    <div className={styles.separator}>
                      <div className={styles.separatorLine} />
                    </div>
                  )}
                  <ChecklistItem
                    selected={courseSelected}
                    indeterminate={courseIndeterminate}
                    onClick={() =>
                      toggleCourse(
                        group.courseId,
                        group.allUnits.map((unit) => unit.id),
                      )
                    }
                  >
                    {group.courseName}
                  </ChecklistItem>
                  {group.units.map((unit) => (
                    <ChecklistItem
                      key={unit.id}
                      selected={courseSelected || unitIds.includes(unit.id)}
                      indented
                      onClick={() =>
                        toggleUnit(
                          group.courseId,
                          unit.id,
                          group.allUnits.map((item) => item.id),
                        )
                      }
                    >
                      {unit.label}
                    </ChecklistItem>
                  ))}
                </div>
              );
            })
          )}
        </div>
        <div className={styles.menuActionRow}>
          <Button
            variant="text"
            color="secondary"
            size="extraSmall"
            onClick={clearCourseScope}
          >
            Clear all
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="extraSmall"
            onClick={goBack}
          >
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.fields}>
        <div className={styles.field}>
          <Dropdown
            role="input"
            label="Sort by:"
            options={SORT_OPTIONS}
            value={sort}
            onChange={(value) => onSortChange(value as BankSort)}
            size="extraSmall"
            color="secondary"
            width="full"
            menuWidth="trigger"
          />
        </div>

        <div className={styles.field} ref={kindFieldRef}>
          <Dropdown
            role="input"
            menuType="checklist"
            label="Question type(s):"
            options={KIND_OPTIONS}
            value={kindIds}
            onChange={(value) =>
              onKindIdsChange(asStringArray(value) as QuestionItemKind[])
            }
            placeholder="All"
            size="extraSmall"
            color="secondary"
            width="full"
            menuWidth="trigger"
            startIconName={kindIds.length > 0 ? "circle-check" : undefined}
            onOpenChange={(open) => {
              if (!open) return;
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  syncChecklistMenuToTrigger(kindFieldRef.current);
                });
              });
            }}
          />
        </div>

        <FilterFieldTrigger
          label="Standard(s):"
          value={standardSummary}
          placeholder="All"
          applied={standardsApplied}
          endIcon="chevron-right"
          onClick={() => setView("standards")}
        />

        <FilterFieldTrigger
          label="Used in course(s) or unit(s):"
          value={courseSummary}
          placeholder="All"
          applied={courseApplied}
          endIcon="chevron-right"
          onClick={() => setView("courses")}
        />

        <div className={styles.hideAdded}>
          <Checkbox
            size="extraSmall"
            checked={hideAddedItems}
            onChange={(event) => onHideAddedItemsChange(event.target.checked)}
            label="Hide added items from results"
          />
        </div>
      </div>

      <div className={styles.actionRow}>
        <Button
          variant="text"
          color="secondary"
          size="extraSmall"
          disabled={!isDirty}
          onClick={onReset}
        >
          Clear filters
        </Button>
      </div>
    </div>
  );
}
