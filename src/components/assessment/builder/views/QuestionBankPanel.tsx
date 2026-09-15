import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button, Dropdown, Tag, TextInput, Tooltip } from "@moshebari/cads-react";
import { FaIcon } from "@moshebari/cads-react/icons";
import type {
  AssessmentArtifact,
  AssessmentCourseBank,
  AssessmentSection,
  QuestionItem,
  QuestionItemKind,
  QuizPlacement,
} from "../../../../types/assessmentBuilder";
import {
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
import { questionKindMeta, FINAL_BANK_KIND_FILTER_OPTIONS } from "./questionKindMeta";
import { QuestionBankPreviewModal } from "./QuestionBankPreviewModal";
import {
  BANK_ADD_NEW_SECTION,
  bankSectionMenuOptions,
  type BankAddSectionId,
} from "./bankAddMenu";
import styles from "./QuestionBankPanel.module.scss";

const P0_BANK_KINDS = new Set(
  FINAL_BANK_KIND_FILTER_OPTIONS.map((option) => option.kind),
);

const KIND_RANK: Record<QuestionItemKind, number> = {
  multi: 0,
  freeResponse: 1,
  match: 2,
  dragDrop: 3,
  fillInBlank: 4,
};

/** Figma questionListItem shows two standard chips, then +N overflow. */
const VISIBLE_STANDARD_CHIPS = 2;

/** Pause so the check tip does not flash when plus becomes “already added”. */
const ADDED_TOOLTIP_ENTER_MS = 500;

interface QuestionBankPanelProps {
  courseBanks: AssessmentCourseBank[];
  artifact: AssessmentArtifact;
  placement?: QuizPlacement;
  resolvedQuestionIds: string[];
  onAddBankQuestion: (bankId: string, sectionId?: BankAddSectionId) => void;
  onFocusQuestionInOutline?: (bankId: string) => void;
}

export function QuestionBankPanel({
  courseBanks,
  artifact,
  placement,
  resolvedQuestionIds,
  onAddBankQuestion,
  onFocusQuestionInOutline,
}: QuestionBankPanelProps) {
  const scopeKey = placementScopeKey(placement);
  const sections = artifact.sections ?? [];

  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<BankSort>("az");
  const [selectedFullCourseIds, setSelectedFullCourseIds] = useState<string[]>(
    [],
  );
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [selectedStandardIds, setSelectedStandardIds] = useState<string[]>([]);
  const [selectedKinds, setSelectedKinds] = useState<QuestionItemKind[]>([]);
  const [hideAddedItems, setHideAddedItems] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState<QuestionItem | null>(
    null,
  );
  const [closedPreviewBankId, setClosedPreviewBankId] = useState<string | null>(
    null,
  );
  const [previewHoverEpoch, setPreviewHoverEpoch] = useState(0);
  const [addHoverEpoch, setAddHoverEpoch] = useState(0);

  const closePreview = () => {
    const closingId = previewQuestion?.bankId ?? null;
    setPreviewQuestion(null);
    if (closingId) {
      setClosedPreviewBankId(closingId);
      setPreviewHoverEpoch((epoch) => epoch + 1);
    }
  };

  useEffect(() => {
    setSelectedFullCourseIds([]);
    setSelectedUnitIds([]);
    setSelectedStandardIds([]);
    setSelectedKinds([]);
    setHideAddedItems(false);
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
        if (question.listedInBank === false) {
          return false;
        }
        if (!P0_BANK_KINDS.has(question.item.kind)) {
          return false;
        }
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
        if (hideAddedItems && resolvedQuestionIds.includes(question.bankId)) {
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
    hideAddedItems,
    resolvedQuestionIds,
    selectedKinds,
    selectedStandardIds,
    selectedUnitIds,
    sort,
  ]);

  const isDirty =
    selectedFullCourseIds.length > 0 ||
    selectedUnitIds.length > 0 ||
    selectedStandardIds.length > 0 ||
    selectedKinds.length > 0 ||
    hideAddedItems;

  const handleResetFilters = () => {
    setSelectedFullCourseIds([]);
    setSelectedUnitIds([]);
    setSelectedStandardIds([]);
    setSelectedKinds([]);
    setHideAddedItems(false);
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

  const placeQuestion = (
    bankId: string,
    sectionId?: BankAddSectionId,
  ) => {
    onAddBankQuestion(bankId, sectionId);
    setAddHoverEpoch((epoch) => epoch + 1);
  };

  const resultKey = (bankId: string, inAssessment: boolean) => {
    const tokens = [bankId];
    if (inAssessment) tokens.push(`in:${addHoverEpoch}`);
    if (bankId === closedPreviewBankId) {
      tokens.push(`preview:${previewHoverEpoch}`);
    }
    return tokens.join(":");
  };

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
              hideAddedItems={hideAddedItems}
              onHideAddedItemsChange={setHideAddedItems}
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
            {filteredBankQuestions.map((question) => {
              const inAssessment = resolvedQuestionIds.includes(
                question.bankId,
              );
              return (
                <BankResultCard
                  key={resultKey(question.bankId, inAssessment)}
                  question={question}
                  inAssessment={inAssessment}
                  sections={sections}
                  onAdd={(sectionId) =>
                    placeQuestion(question.bankId, sectionId)
                  }
                  onFocus={() => onFocusQuestionInOutline?.(question.bankId)}
                  onPreview={() => setPreviewQuestion(question)}
                />
              );
            })}
          </div>
        </>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyContent}>
            <span className={styles.emptyIcon} aria-hidden>
              <FaIcon name="empty-set" fontSize="24px" />
            </span>
            <div className={styles.emptyMessage}>
              <p className={styles.emptyTitle}>No results</p>
              <p className={styles.emptyBody}>
                Your search produced no results. Try a different query or set of
                filters.
              </p>
            </div>
          </div>
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
      <QuestionBankPreviewModal
        question={previewQuestion}
        artifact={artifact}
        inAssessment={
          previewQuestion
            ? resolvedQuestionIds.includes(previewQuestion.bankId)
            : false
        }
        sections={sections}
        onAdd={(sectionId) => {
          if (!previewQuestion) return;
          placeQuestion(previewQuestion.bankId, sectionId);
          closePreview();
        }}
        onClose={closePreview}
      />
    </section>
  );
}

interface BankResultCardProps {
  question: QuestionItem;
  inAssessment: boolean;
  sections: AssessmentSection[];
  onAdd: (sectionId?: BankAddSectionId) => void;
  onFocus: () => void;
  onPreview: () => void;
}

function BankResultCard({
  question,
  inAssessment,
  sections,
  onAdd,
  onFocus,
  onPreview,
}: BankResultCardProps) {
  return (
    <div className={styles.resultCard}>
      <div className={styles.resultTop}>
        <div className={styles.resultText}>
          <div className={styles.resultTitleRow}>
            {inAssessment ? (
              <button
                type="button"
                className={styles.resultTitle}
                onClick={onFocus}
              >
                {question.title}
              </button>
            ) : (
              <span className={styles.resultTitle}>{question.title}</span>
            )}
            <Tooltip title="Preview" placement="top">
              <span className={styles.previewEyeSlot}>
                <button
                  type="button"
                  className={styles.previewEye}
                  aria-label={`Preview ${question.title}`}
                  onClick={(event) => {
                    event.currentTarget.blur();
                    onPreview();
                  }}
                >
                  <FaIcon name="eye" fontSize="0.75rem" />
                </button>
              </span>
            </Tooltip>
          </div>
          <span className={styles.stemPreview}>
            {questionStemPreview(question)}
          </span>
        </div>
        <BankAddControl
          questionTitle={question.title}
          inAssessment={inAssessment}
          sections={sections}
          onAdd={onAdd}
        />
      </div>
      <BankResultTags question={question} />
    </div>
  );
}

function BankAddControl({
  questionTitle,
  inAssessment,
  sections,
  onAdd,
}: {
  questionTitle: string;
  inAssessment: boolean;
  sections: AssessmentSection[];
  onAdd: (sectionId?: BankAddSectionId) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const closeTooltip = () => setTooltipOpen(false);
  const place = (sectionId?: BankAddSectionId) => {
    closeTooltip();
    onAdd(sectionId);
  };

  if (inAssessment) {
    return (
      <Tooltip
        title="Already in this assessment"
        placement="top"
        enterDelay={ADDED_TOOLTIP_ENTER_MS}
        enterNextDelay={ADDED_TOOLTIP_ENTER_MS}
        open={tooltipOpen}
        onOpen={() => setTooltipOpen(true)}
        onClose={closeTooltip}
      >
        <span>
          <Button
            variant="contained"
            color="primary"
            size="extraSmall"
            iconOnly
            startIconName="check"
            disabled
            aria-label="Added to assessment"
          />
        </span>
      </Tooltip>
    );
  }

  const addButton = (
    <Button
      variant="contained"
      color="primary"
      size="extraSmall"
      iconOnly
      startIconName="plus"
      aria-label={`Add ${questionTitle}`}
      onClick={
        sections.length > 1
          ? undefined
          : (event) => {
              event.currentTarget.blur();
              place();
            }
      }
    />
  );

  if (sections.length > 1) {
    return (
      <Tooltip
        title="Add to assessment"
        placement="top"
        open={tooltipOpen && !menuOpen}
        onOpen={() => setTooltipOpen(true)}
        onClose={closeTooltip}
        disableHoverListener={menuOpen}
        disableFocusListener={menuOpen}
        disableTouchListener={menuOpen}
      >
        <span>
          <Dropdown
            role="action"
            size="extraSmall"
            menuPlacement="bottomLeft"
            onOpenChange={(open) => {
              setMenuOpen(open);
              if (open) closeTooltip();
            }}
            trigger={
              <Button
                variant="contained"
                color="primary"
                size="extraSmall"
                iconOnly
                startIconName="plus"
                aria-label={`Add ${questionTitle}`}
              />
            }
            options={bankSectionMenuOptions(sections)}
            onAction={(action) => {
              if (action === BANK_ADD_NEW_SECTION) {
                place(BANK_ADD_NEW_SECTION);
                return;
              }
              place(action);
            }}
          />
        </span>
      </Tooltip>
    );
  }

  return (
    <Tooltip
      title="Add to assessment"
      placement="top"
      open={tooltipOpen}
      onOpen={() => setTooltipOpen(true)}
      onClose={closeTooltip}
    >
      <span>{addButton}</span>
    </Tooltip>
  );
}

function BankResultTags({ question }: { question: QuestionItem }) {
  const meta = questionKindMeta(question);
  const rowRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(
    Math.min(VISIBLE_STANDARD_CHIPS, question.tags.length),
  );

  useLayoutEffect(() => {
    const row = rowRef.current;
    const measure = measureRef.current;
    if (!row || !measure) return;

    const run = () => {
      const available = row.clientWidth;
      const typeEl = measure.querySelector<HTMLElement>("[data-measure=type]");
      const overflowEl = measure.querySelector<HTMLElement>(
        "[data-measure=overflow]",
      );
      const chips = Array.from(
        measure.querySelectorAll<HTMLElement>("[data-measure=std]"),
      );
      const gap = 4;
      const typeWidth = typeEl?.offsetWidth ?? 0;
      const overflowWidth = overflowEl?.offsetWidth ?? 0;
      const max = Math.min(VISIBLE_STANDARD_CHIPS, question.tags.length);

      let visible = max;
      while (visible >= 0) {
        const hidden = question.tags.length - visible;
        let used = typeWidth;
        for (let i = 0; i < visible; i += 1) {
          used += gap + (chips[i]?.offsetWidth ?? 0);
        }
        if (hidden > 0) used += gap + overflowWidth;
        if (used <= available || visible === 0) {
          setVisibleCount(visible);
          return;
        }
        visible -= 1;
      }
    };

    run();
    const observer = new ResizeObserver(run);
    observer.observe(row);
    return () => observer.disconnect();
  }, [question.tags]);

  const visibleStandards = question.tags.slice(0, visibleCount);
  const extraStandards = Math.max(0, question.tags.length - visibleCount);

  return (
    <div className={styles.tagsWrap}>
      <div ref={rowRef} className={styles.resultTags}>
        <Tag
          size="small"
          color="info"
          startIconName={meta.iconName}
          label={meta.label}
        />
        {visibleStandards.map((tag) => (
          <Tag
            key={tag.id}
            size="small"
            color="pink"
            label={standardLabel(tag)}
          />
        ))}
        {extraStandards > 0 && (
          <Tooltip
            title={question.tags
              .slice(visibleCount)
              .map((tag) => standardLabel(tag))
              .join(", ")}
            placement="top"
          >
            <span className={styles.overflowTag}>
              <Tag size="small" color="pink" label={`+${extraStandards}`} />
            </span>
          </Tooltip>
        )}
      </div>
      <div ref={measureRef} className={styles.tagMeasure} aria-hidden>
        <span data-measure="type">
          <Tag
            size="small"
            color="info"
            startIconName={meta.iconName}
            label={meta.label}
          />
        </span>
        {question.tags.map((tag) => (
          <span key={tag.id} data-measure="std">
            <Tag size="small" color="pink" label={standardLabel(tag)} />
          </span>
        ))}
        <span data-measure="overflow">
          <Tag
            size="small"
            color="pink"
            label={`+${Math.max(question.tags.length, 9)}`}
          />
        </span>
      </div>
    </div>
  );
}
