import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Dropdown, Tag, TextInput, Tooltip } from "@moshebaricdo/cads-react";
import { FaIcon } from "../../../ui/icons/FaIcon";
import type { AssessmentCourseBank, QuestionItem } from "../../../../types/assessmentBuilder";
import {
  courseScopeValue,
  getConceptsForBanks,
  getCourseOrUnitOptions,
  getUnitsForBanks,
  parseCourseOrUnitValues,
  questionMatchesCourseOrUnit,
  questionStemPreview,
  standardLabel,
  unitLabel,
  unitScopeValue,
} from "../../../../lib/assessmentBuilder";
import { questionKindMeta } from "./questionKindMeta";
import styles from "./QuestionBankPanel.module.scss";

function asStringArray(value: string | string[]): string[] {
  return Array.isArray(value) ? value : [value];
}

/**
 * CADS checklist menus ignore `menuWidth` and hug content; lock to the
 * trigger. The filter popover keeps its own menu open, so target the most
 * recently opened panel (last in the DOM).
 */
function syncChecklistMenuToTrigger(triggerRoot: HTMLElement | null) {
  const trigger = triggerRoot?.querySelector("button");
  const menus = document.querySelectorAll<HTMLElement>("[data-cads-dropdown-menu]");
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

type BankSort = "az" | "recent";

interface QuestionBankPanelProps {
  courseBanks: AssessmentCourseBank[];
  defaultCourseId: string;
  resolvedQuestionIds: string[];
  onAddBankQuestion: (bankId: string) => void;
  onFocusQuestionInOutline?: (bankId: string) => void;
}

export function QuestionBankPanel({
  courseBanks,
  defaultCourseId,
  resolvedQuestionIds,
  onAddBankQuestion,
  onFocusQuestionInOutline,
}: QuestionBankPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<BankSort>("az");
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([defaultCourseId]);
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [selectedStandardIds, setSelectedStandardIds] = useState<string[]>([]);
  const courseOrUnitRef = useRef<HTMLDivElement>(null);
  const standardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedCourseIds([defaultCourseId]);
    setSelectedUnitIds([]);
    setSelectedStandardIds([]);
    setSearchQuery("");
    setSort("az");
  }, [defaultCourseId]);

  const courseOrUnitOptions = useMemo(
    () => getCourseOrUnitOptions(courseBanks),
    [courseBanks],
  );

  const selectedCourseOrUnitValues = useMemo(
    () => [
      ...selectedCourseIds.map(courseScopeValue),
      ...selectedUnitIds.map(unitScopeValue),
    ],
    [selectedCourseIds, selectedUnitIds],
  );

  const unitRecords = useMemo(
    () => getUnitsForBanks(courseBanks),
    [courseBanks],
  );

  const standardScopeCourseIds = useMemo(() => {
    if (selectedCourseIds.length > 0) return selectedCourseIds;
    if (selectedUnitIds.length === 0) return [];
    return Array.from(
      new Set(
        unitRecords
          .filter((unit) => selectedUnitIds.includes(unit.value))
          .map((unit) => unit.courseId),
      ),
    );
  }, [selectedCourseIds, selectedUnitIds, unitRecords]);

  const standardOptions = useMemo(
    () =>
      getConceptsForBanks(
        courseBanks,
        standardScopeCourseIds,
        selectedUnitIds,
      ).map((concept) => {
        const domain = courseBanks
          .flatMap((bank) => bank.domains)
          .find((entry) => entry.id === concept.value);
        return {
          value: concept.value,
          label: domain ? standardLabel(domain) : concept.label,
          iconName: "clipboard-list-check" as const,
        };
      }),
    [courseBanks, selectedUnitIds, standardScopeCourseIds],
  );

  const filteredBankQuestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const matches = courseBanks
      .flatMap((bank) => bank.questions)
      .filter((question) => {
        if (question.item.kind === "multi" && question.item.content.surveyMode) {
          return false;
        }
        if (!questionMatchesCourseOrUnit(question, selectedCourseIds, selectedUnitIds)) {
          return false;
        }
        if (
          selectedStandardIds.length > 0 &&
          !question.tags.some((tag) => selectedStandardIds.includes(tag.id))
        ) {
          return false;
        }
        if (query.length > 0) {
          const haystack = `${question.title} ${questionStemPreview(question)}`.toLowerCase();
          if (!haystack.includes(query)) return false;
        }
        return true;
      });

    return [...matches].sort((left, right) => {
      if (sort === "recent") return right.updatedAt - left.updatedAt;
      return left.title.localeCompare(right.title);
    });
  }, [
    courseBanks,
    searchQuery,
    selectedCourseIds,
    selectedStandardIds,
    selectedUnitIds,
    sort,
  ]);

  /* The default course scope is the panel's baseline, not a user filter —
   * the badge only counts deviations from it. */
  const isDefaultScope =
    selectedCourseIds.length === 1 &&
    selectedCourseIds[0] === defaultCourseId &&
    selectedUnitIds.length === 0;
  const activeFilterCount =
    (isDefaultScope ? 0 : selectedCourseIds.length + selectedUnitIds.length) +
    selectedStandardIds.length;

  const handleResetFilters = () => {
    setSelectedCourseIds([defaultCourseId]);
    setSelectedUnitIds([]);
    setSelectedStandardIds([]);
    setSort("az");
  };

  const handleCourseOrUnitChange = (value: string | string[]) => {
    const next = parseCourseOrUnitValues(asStringArray(value));
    setSelectedCourseIds(next.courseIds);
    setSelectedUnitIds(next.unitIds);
  };

  const filterPanel = (
    <div className={styles.filterPanel}>
      <div className={styles.filterField} ref={courseOrUnitRef}>
        <Dropdown
          role="input"
          menuType="checklist"
          label="Course or unit"
          options={courseOrUnitOptions}
          value={selectedCourseOrUnitValues}
          onChange={handleCourseOrUnitChange}
          onOpenChange={(open) => {
            if (open) {
              requestAnimationFrame(() => {
                syncChecklistMenuToTrigger(courseOrUnitRef.current);
              });
            }
          }}
          placeholder="All courses and units"
          size="small"
          color="primary"
          width="full"
          menuWidth="trigger"
          startIconName="circle-check"
        />
      </div>
      <div className={styles.filterField} ref={standardRef}>
        <Dropdown
          role="input"
          menuType="checklist"
          label="Standard"
          options={standardOptions}
          value={selectedStandardIds}
          onChange={(value) => setSelectedStandardIds(asStringArray(value))}
          onOpenChange={(open) => {
            if (open) {
              requestAnimationFrame(() => {
                syncChecklistMenuToTrigger(standardRef.current);
              });
            }
          }}
          placeholder="All standards"
          size="small"
          color="primary"
          width="full"
          menuWidth="trigger"
          startIconName="clipboard-list-check"
          disabled={standardOptions.length === 0}
        />
      </div>
      <div className={styles.filterField}>
        <Dropdown
          role="input"
          label="Sort by"
          options={[
            { value: "az", label: "A–Z", iconName: "arrow-down-a-z" },
            { value: "recent", label: "Recently updated", iconName: "clock-rotate-left" },
          ]}
          value={sort}
          onChange={(value) => setSort(value as BankSort)}
          size="small"
          color="primary"
          width="full"
          menuWidth="trigger"
        />
      </div>
      <div className={styles.filterFooter}>
        <Button
          variant="text"
          color="secondary"
          size="extraSmall"
          startIconName="arrows-rotate"
          onClick={handleResetFilters}
        >
          Reset filters
        </Button>
      </div>
    </div>
  );

  return (
    <section className={styles.section}>
      <div className={styles.searchRow}>
        <div className={styles.searchField}>
          <TextInput
            size="small"
            color="primary"
            startIconName="search"
            placeholder="Search questions"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            aria-label="Search questions"
          />
        </div>
        <Dropdown
          role="action"
          size="small"
          menuPlacement="bottomRight"
          menuType="custom"
          customContent={filterPanel}
          aria-label="Filter questions"
          trigger={
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              startIconName="bars-filter"
              iconOnly={activeFilterCount === 0}
              aria-label={
                activeFilterCount === 0
                  ? "Filter questions"
                  : `Filter questions (${activeFilterCount} active)`
              }
            >
              {activeFilterCount > 0 ? String(activeFilterCount) : undefined}
            </Button>
          }
        />
      </div>

      <p className={styles.resultCount}>
        {filteredBankQuestions.length} result
        {filteredBankQuestions.length === 1 ? "" : "s"}
      </p>

      {filteredBankQuestions.length === 0 ? (
        <p className={styles.emptyListHint}>
          No questions match the current filters.
        </p>
      ) : (
        <div className={styles.resultsList}>
          {filteredBankQuestions.map((question) => (
            <BankResultCard
              key={question.bankId}
              question={question}
              courseBanks={courseBanks}
              inAssessment={resolvedQuestionIds.includes(question.bankId)}
              onAdd={() => onAddBankQuestion(question.bankId)}
              onFocus={() => onFocusQuestionInOutline?.(question.bankId)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

interface BankResultCardProps {
  question: QuestionItem;
  courseBanks: AssessmentCourseBank[];
  inAssessment: boolean;
  onAdd: () => void;
  onFocus: () => void;
}

function BankResultCard({
  question,
  courseBanks,
  inAssessment,
  onAdd,
  onFocus,
}: BankResultCardProps) {
  const meta = questionKindMeta(question);
  const unitName = unitLabel(courseBanks, question.unitId);
  const extraStandards = Math.max(0, question.tags.length - 1);

  return (
    <div
      className={[styles.resultCard, inAssessment ? styles.resultCardAdded : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={styles.resultTop}>
        <button
          type="button"
          className={styles.resultMain}
          disabled={!inAssessment}
          onClick={() => {
            if (inAssessment) onFocus();
          }}
        >
          <span className={styles.titleRow}>
            <Tooltip title={meta.label} placement="top">
              <span className={styles.kindIcon} aria-label={meta.label}>
                <FaIcon name={meta.iconName} size="s" aria-hidden />
              </span>
            </Tooltip>
            <span className={styles.resultTitle}>{question.title}</span>
          </span>
          <span className={styles.stemPreview}>
            {questionStemPreview(question)}
          </span>
        </button>
        {inAssessment ? (
          <Tooltip title="Already in this assessment" placement="left">
            <span>
              <Button
                variant="outlined"
                color="secondary"
                size="extraSmall"
                iconOnly
                startIconName="check"
                disabled
                aria-label="Added to assessment"
              />
            </span>
          </Tooltip>
        ) : (
          <Tooltip title="Add to assessment" placement="left">
            <Button
              variant="contained"
              color="primary"
              size="extraSmall"
              iconOnly
              startIconName="plus"
              aria-label={`Add ${question.title}`}
              onClick={onAdd}
            />
          </Tooltip>
        )}
      </div>
      {(unitName || question.tags.length > 0) && (
        <div className={styles.resultTags}>
          {unitName && (
            <span className={styles.unitTag}>
              <Tag size="small" color="info" label={unitName} />
            </span>
          )}
          {question.tags[0] && (
            <Tag
              size="small"
              color="pink"
              label={standardLabel(question.tags[0])}
            />
          )}
          {extraStandards > 0 && (
            <Tooltip
              title={question.tags
                .slice(1)
                .map((tag) => standardLabel(tag))
                .join(", ")}
              placement="top"
            >
              <span>
                <Tag size="small" color="pink" label={`+${extraStandards}`} />
              </span>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
}
