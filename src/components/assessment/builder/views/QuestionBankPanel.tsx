import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Dropdown, Tag, TextInput, Tooltip } from "@moshebaricdo/cads-react";
import { FaIcon } from "@moshebaricdo/cads-react/icons";
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
import styles from "./QuestionBankPanel.module.scss";

function asStringArray(value: string | string[]): string[] {
  return Array.isArray(value) ? value : [value];
}

/** CADS checklist menus ignore `menuWidth` and hug content; lock to the trigger. */
function syncChecklistMenuToTrigger(triggerRoot: HTMLElement | null) {
  const trigger = triggerRoot?.querySelector("button");
  const menu = document.querySelector<HTMLElement>("[data-cads-dropdown-menu]");
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

function questionKindIcon(question: QuestionItem): string {
  switch (question.item.kind) {
    case "multi":
      return "list-radio";
    case "freeResponse":
      return "keyboard";
    case "fillInBlank":
      return "i-cursor";
    case "match":
      return "diagram-predecessor";
    case "dragDrop":
      return "layer-group";
  }
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

  const selectedCourses = useMemo(
    () => courseBanks.filter((bank) => selectedCourseIds.includes(bank.courseId)),
    [courseBanks, selectedCourseIds],
  );

  const selectedUnits = useMemo(
    () => unitRecords.filter((unit) => selectedUnitIds.includes(unit.value)),
    [selectedUnitIds, unitRecords],
  );

  const selectedStandards = useMemo(() => {
    const byId = new Map(
      courseBanks.flatMap((bank) => bank.domains).map((domain) => [domain.id, domain]),
    );
    return selectedStandardIds
      .map((id) => byId.get(id))
      .filter((domain): domain is NonNullable<typeof domain> => domain != null);
  }, [courseBanks, selectedStandardIds]);

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

  const handleClearFilters = () => {
    setSelectedCourseIds([defaultCourseId]);
    setSelectedUnitIds([]);
    setSelectedStandardIds([]);
    setSearchQuery("");
    setSort("az");
  };

  const handleCourseOrUnitChange = (value: string | string[]) => {
    const next = parseCourseOrUnitValues(asStringArray(value));
    setSelectedCourseIds(next.courseIds);
    setSelectedUnitIds(next.unitIds);
  };

  return (
    <section className={styles.section}>
      <div className={styles.groupCard}>
        <div className={`${styles.groupHeader} ${styles.groupHeaderWithAction}`}>
          <h3 className={styles.groupHeading}>Filters</h3>
          <Tooltip title="Clear all filters" placement="bottom">
            <span>
              <Button
                variant="text"
                color="tertiary"
                size="extraSmall"
                iconOnly
                startIconName="arrows-rotate"
                aria-label="Clear all filters"
                onClick={handleClearFilters}
              />
            </span>
          </Tooltip>
        </div>
        <div className={styles.filterBody}>
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
              iconOnly
              size="small"
              buttonVariant="outlined"
              buttonColor="secondary"
              startIconName="arrow-down-a-z"
              aria-label="Sort questions"
              options={[
                { value: "az", label: "A–Z", iconName: "arrow-down-a-z" },
                { value: "recent", label: "Recent", iconName: "clock-rotate-left" },
              ]}
              onAction={(value) => setSort(value as BankSort)}
            />
          </div>

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
            {(selectedCourses.length > 0 || selectedUnits.length > 0) && (
              <div className={styles.chipRow}>
                {selectedCourses.map((course) => (
                  <Tag
                    key={course.courseId}
                    size="small"
                    color="info"
                    startIconName="book"
                    label={course.courseName}
                    isDismissible
                    onClose={() =>
                      setSelectedCourseIds((current) =>
                        current.filter((id) => id !== course.courseId),
                      )
                    }
                  />
                ))}
                {selectedUnits.map((unit) => (
                  <Tag
                    key={unit.value}
                    size="small"
                    color="info"
                    startIconName="book"
                    label={unit.label}
                    isDismissible
                    onClose={() =>
                      setSelectedUnitIds((current) =>
                        current.filter((id) => id !== unit.value),
                      )
                    }
                  />
                ))}
              </div>
            )}
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
            {selectedStandards.length > 0 && (
              <div className={styles.chipRow}>
                {selectedStandards.map((standard) => (
                  <Tag
                    key={standard.id}
                    size="small"
                    color="pink"
                    startIconName="clipboard-list-check"
                    label={standardLabel(standard)}
                    isDismissible
                    onClose={() =>
                      setSelectedStandardIds((current) =>
                        current.filter((id) => id !== standard.id),
                      )
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.groupCard}>
        <div className={styles.groupHeader}>
          <h3 className={styles.groupHeading}>Questions</h3>
          <Tag size="small" color="neutral" label={String(filteredBankQuestions.length)} />
        </div>
        {filteredBankQuestions.length === 0 ? (
          <p className={styles.emptyListHint}>No questions match the current filters.</p>
        ) : (
          <div className={styles.resultsList}>
            {filteredBankQuestions.map((question) => {
              const inAssessment = resolvedQuestionIds.includes(question.bankId);
              const unitName = unitLabel(courseBanks, question.unitId);
              const extraStandards = Math.max(0, question.tags.length - 1);
              return (
                <div key={question.bankId} className={styles.resultRow}>
                  <div className={styles.resultTop}>
                    <button
                      type="button"
                      className={styles.resultMain}
                      disabled={!inAssessment}
                      onClick={() => {
                        if (inAssessment) onFocusQuestionInOutline?.(question.bankId);
                      }}
                    >
                      <span className={styles.titleRow}>
                        <FaIcon
                          name={questionKindIcon(question)}
                          size="small"
                          className={styles.kindIcon}
                          title={question.item.kind}
                        />
                        <span className={styles.resultTitle}>{question.title}</span>
                      </span>
                      <span className={styles.stemPreview}>
                        {questionStemPreview(question)}
                      </span>
                    </button>
                    {inAssessment ? (
                      <Button
                        variant="text"
                        color="tertiary"
                        size="extraSmall"
                        iconOnly
                        startIconName="check"
                        disabled
                        aria-label="Added to assessment"
                      />
                    ) : (
                      <Button
                        variant="outlined"
                        color="secondary"
                        size="extraSmall"
                        iconOnly
                        startIconName="plus"
                        aria-label={`Add ${question.title}`}
                        onClick={() => onAddBankQuestion(question.bankId)}
                      />
                    )}
                  </div>
                  {(unitName || question.tags.length > 0) && (
                    <div className={styles.resultTags}>
                      {unitName && (
                        <Tag
                          size="small"
                          color="info"
                          startIconName="book"
                          label={unitName}
                        />
                      )}
                      {question.tags[0] && (
                        <Tag
                          size="small"
                          color="pink"
                          startIconName="clipboard-list-check"
                          label={standardLabel(question.tags[0])}
                        />
                      )}
                      {extraStandards > 0 && (
                        <Tag
                          size="small"
                          color="pink"
                          label={`+${extraStandards}`}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
