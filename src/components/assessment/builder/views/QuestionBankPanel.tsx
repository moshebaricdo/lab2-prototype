import { useEffect, useMemo, useState } from "react";
import { Button, Dropdown, Tag, TextInput, Tooltip } from "@moshebaricdo/cads-react";
import { FaIcon } from "@moshebaricdo/cads-react/icons";
import type {
  AssessmentCourseBank,
  QuestionItem,
  QuestionItemKind,
  QuizPlacement,
} from "../../../../types/assessmentBuilder";
import {
  bankFilterDefaults,
  getConceptsForScope,
  placementScopeKey,
  questionMatchesTaxonomy,
  questionStemPreview,
  standardLabel,
} from "../../../../lib/assessmentBuilder";
import {
  QuestionBankFilterMenu,
  type BankSort,
} from "./QuestionBankFilterMenu";
import { questionKindMeta } from "./questionKindMeta";
import styles from "./QuestionBankPanel.module.scss";

function sameIdSet(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((id) => rightSet.has(id));
}

const KIND_RANK: Record<QuestionItemKind, number> = {
  multi: 0,
  freeResponse: 1,
  match: 2,
  dragDrop: 3,
  fillInBlank: 4,
};

interface QuestionBankPanelProps {
  courseBanks: AssessmentCourseBank[];
  placement?: QuizPlacement;
  resolvedQuestionIds: string[];
  onAddBankQuestion: (bankId: string) => void;
  onFocusQuestionInOutline?: (bankId: string) => void;
}

export function QuestionBankPanel({
  courseBanks,
  placement,
  resolvedQuestionIds,
  onAddBankQuestion,
  onFocusQuestionInOutline,
}: QuestionBankPanelProps) {
  const defaults = useMemo(() => bankFilterDefaults(placement), [placement]);
  const scopeKey = placementScopeKey(placement);

  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<BankSort>("az");
  const [selectedFullCourseIds, setSelectedFullCourseIds] = useState<string[]>(
    defaults.fullCourseIds,
  );
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>(
    defaults.unitIds,
  );
  const [selectedStandardIds, setSelectedStandardIds] = useState<string[]>([]);
  const [selectedKinds, setSelectedKinds] = useState<QuestionItemKind[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const next = bankFilterDefaults(placement);
    setSelectedFullCourseIds(next.fullCourseIds);
    setSelectedUnitIds(next.unitIds);
    setSelectedStandardIds([]);
    setSelectedKinds([]);
    setSearchQuery("");
    setSort("az");
    setFilterOpen(false);
    // Scope key is the stable placement identity; don't reset on every artifact write.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when placement identity changes
  }, [scopeKey]);

  const standardOptions = useMemo(
    () =>
      getConceptsForScope(
        courseBanks,
        selectedFullCourseIds,
        selectedUnitIds,
      ),
    [courseBanks, selectedFullCourseIds, selectedUnitIds],
  );

  const pruneStandards = (fullCourseIds: string[], unitIds: string[]) => {
    const allowed = new Set(
      getConceptsForScope(courseBanks, fullCourseIds, unitIds).map(
        (concept) => concept.value,
      ),
    );
    setSelectedStandardIds((ids) => ids.filter((id) => allowed.has(id)));
  };

  const filteredBankQuestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const kindSet = new Set(selectedKinds);
    const matches = courseBanks
      .flatMap((bank) => bank.questions)
      .filter((question) => {
        if (question.item.kind === "multi" && question.item.content.surveyMode) {
          return false;
        }
        if (
          !questionMatchesTaxonomy(
            question,
            selectedFullCourseIds,
            selectedUnitIds,
            selectedStandardIds,
          )
        ) {
          return false;
        }
        if (kindSet.size > 0 && !kindSet.has(question.item.kind)) {
          return false;
        }
        if (query.length > 0) {
          const haystack = `${question.title} ${questionStemPreview(question)}`.toLowerCase();
          if (!haystack.includes(query)) return false;
        }
        return true;
      });

    return [...matches].sort((left, right) => {
      if (sort === "za") return right.title.localeCompare(left.title);
      if (sort === "newest") return right.updatedAt - left.updatedAt;
      if (sort === "oldest") return left.updatedAt - right.updatedAt;
      if (sort === "kind") {
        const kindDelta =
          KIND_RANK[left.item.kind] - KIND_RANK[right.item.kind];
        if (kindDelta !== 0) return kindDelta;
      }
      return left.title.localeCompare(right.title);
    });
  }, [
    courseBanks,
    searchQuery,
    selectedFullCourseIds,
    selectedKinds,
    selectedStandardIds,
    selectedUnitIds,
    sort,
  ]);

  const isDirty =
    !sameIdSet(selectedFullCourseIds, defaults.fullCourseIds) ||
    !sameIdSet(selectedUnitIds, defaults.unitIds) ||
    selectedStandardIds.length > 0 ||
    selectedKinds.length > 0;

  const handleResetFilters = () => {
    setSelectedFullCourseIds(defaults.fullCourseIds);
    setSelectedUnitIds(defaults.unitIds);
    setSelectedStandardIds([]);
    setSelectedKinds([]);
  };

  const handleClearEmptyState = () => {
    handleResetFilters();
    setSearchQuery("");
  };

  const handleCourseScopeChange = (next: {
    fullCourseIds: string[];
    unitIds: string[];
  }) => {
    setSelectedFullCourseIds(next.fullCourseIds);
    setSelectedUnitIds(next.unitIds);
    pruneStandards(next.fullCourseIds, next.unitIds);
  };

  const hasResults = filteredBankQuestions.length > 0;

  return (
    <section className={styles.section}>
      <div className={styles.searchRow}>
        <div className={styles.searchField}>
          <TextInput
            size="small"
            color="secondary"
            startIconName="magnifying-glass"
            placeholder="Search for a question"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            aria-label="Search for a question"
          />
        </div>
        <Dropdown
          role="action"
          size="small"
          menuPlacement="bottomRight"
          menuType="custom"
          open={filterOpen}
          onOpenChange={setFilterOpen}
          customContent={
            <QuestionBankFilterMenu
              open={filterOpen}
              sort={sort}
              onSortChange={setSort}
              courseBanks={courseBanks}
              fullCourseIds={selectedFullCourseIds}
              unitIds={selectedUnitIds}
              onCourseScopeChange={handleCourseScopeChange}
              standardIds={selectedStandardIds}
              standardOptions={standardOptions}
              onStandardIdsChange={setSelectedStandardIds}
              kindIds={selectedKinds}
              onKindIdsChange={setSelectedKinds}
              isDirty={isDirty}
              onReset={handleResetFilters}
            />
          }
          aria-label="Filter questions"
          trigger={
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              startIconName="bars-filter"
              iconOnly
              className={isDirty ? styles.filterButtonActive : undefined}
              aria-label={
                isDirty ? "Filter questions (filters active)" : "Filter questions"
              }
            />
          }
        />
      </div>

      {hasResults ? (
        <>
          <p className={styles.resultCount}>
            {filteredBankQuestions.length} result
            {filteredBankQuestions.length === 1 ? "" : "s"}
          </p>
          <div className={styles.resultsList}>
            {filteredBankQuestions.map((question) => (
              <BankResultCard
                key={question.bankId}
                question={question}
                inAssessment={resolvedQuestionIds.includes(question.bankId)}
                onAdd={() => onAddBankQuestion(question.bankId)}
                onFocus={() => onFocusQuestionInOutline?.(question.bankId)}
              />
            ))}
          </div>
        </>
      ) : (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon} aria-hidden>
            <FaIcon name="ban" size="large" />
          </span>
          <p className={styles.emptyTitle}>No results</p>
          <p className={styles.emptyBody}>
            Your search produced no results. Try a different query or set of
            filters.
          </p>
          <Button
            variant="outlined"
            color="secondary"
            size="extraSmall"
            onClick={handleClearEmptyState}
          >
            Clear filters
          </Button>
        </div>
      )}
    </section>
  );
}

interface BankResultCardProps {
  question: QuestionItem;
  inAssessment: boolean;
  onAdd: () => void;
  onFocus: () => void;
}

function BankResultCard({
  question,
  inAssessment,
  onAdd,
  onFocus,
}: BankResultCardProps) {
  const meta = questionKindMeta(question);
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
          <span className={styles.resultTitleRow}>
            <span className={styles.resultTitle}>{question.title}</span>
            <span className={styles.previewEye} aria-hidden>
              <FaIcon name="eye" size="extraSmall" />
            </span>
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
      <div className={styles.resultTags}>
        <Tag
          size="small"
          color="neutral"
          startIconName={meta.iconName}
          label={meta.label}
        />
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
    </div>
  );
}
