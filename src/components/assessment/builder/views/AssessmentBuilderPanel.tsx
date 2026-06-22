import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { AppMultiSelectDropdown } from "../../../ui/AppDropdown";
import { AppButton } from "../../../ui/AppButton";
import { AppTextField } from "../../../ui/AppTextField";
import { AppCheckbox } from "../../../ui/AppCheckbox";
import { AppTag } from "../../../ui/AppTag";
import { Tooltip } from "../../../ui/Tooltip";
import { ScrollArea } from "../../../ui/scroll-area";
import type { SidebarTab } from "../../../lab2/resource-panel/Sidebar.types";
import {
  getAllCourseBanksSnapshot,
  QUESTION_DIFFICULTIES,
  QUESTION_DIFFICULTY_LABELS,
} from "../../../../lib/assessmentBuilder";
import type {
  AssessmentArtifact,
  DomainTag,
  QuestionDifficulty,
} from "../../../../types/assessmentBuilder";
import styles from "./AssessmentBuilderPanel.module.scss";

function subscribeToBankStorage(callback: () => void) {
  const handler = (event: StorageEvent) => {
    if (event.key === "lab2:assessment-bank" || event.key === null) callback();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

interface AssessmentBuilderPanelProps {
  activeTab: SidebarTab;
  artifact: AssessmentArtifact;
  onUpdateArtifact: (updater: (current: AssessmentArtifact) => AssessmentArtifact) => void;
  onAddBankQuestion: (bankId: string) => void;
  /** Focus and expand a question already in the outline. */
  onFocusQuestionInOutline?: (bankId: string) => void;
}

const ITEM_KIND_LABELS: Record<string, string> = {
  multi: "Multiple choice",
  freeResponse: "Free response",
  match: "Matching",
  dragDrop: "Drag & drop",
  fillInBlank: "Fill in the blank",
};

function itemKindLabel(kind: string): string {
  return ITEM_KIND_LABELS[kind] ?? kind;
}

export function AssessmentBuilderPanel({
  activeTab,
  artifact,
  onUpdateArtifact,
  onAddBankQuestion,
  onFocusQuestionInOutline,
}: AssessmentBuilderPanelProps) {
  const allCourseBanks = useSyncExternalStore(
    subscribeToBankStorage,
    getAllCourseBanksSnapshot,
    getAllCourseBanksSnapshot,
  );
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [selectedDomainIds, setSelectedDomainIds] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<
    QuestionDifficulty[]
  >([]);

  useEffect(() => {
    setSelectedCourseIds([artifact.courseId]);
    setSelectedDomainIds([]);
    setSelectedDifficulties([]);
  }, [artifact.courseId]);

  const resolvedQuestionIds = artifact.questionRefs.map((ref) =>
    ref.type === "bank" ? ref.bankId : ref.item.bankId,
  );

  const courseOptions = useMemo(
    () =>
      allCourseBanks.map((bank) => ({
        value: bank.courseId,
        label: bank.courseName,
      })),
    [allCourseBanks],
  );

  const domainOptions = useMemo(() => {
    const banks =
      selectedCourseIds.length === 0
        ? allCourseBanks
        : allCourseBanks.filter((bank) => selectedCourseIds.includes(bank.courseId));
    const domains = new Map<string, DomainTag>();
    for (const bank of banks) {
      for (const domain of bank.domains) {
        domains.set(domain.id, domain);
      }
    }
    return Array.from(domains.values()).map((domain) => ({
      value: domain.id,
      label: domain.label,
    }));
  }, [allCourseBanks, selectedCourseIds]);

  const difficultyOptions = useMemo(
    () =>
      QUESTION_DIFFICULTIES.map((difficulty) => ({
        value: difficulty,
        label: QUESTION_DIFFICULTY_LABELS[difficulty],
      })),
    [],
  );

  const filteredBankQuestions = useMemo(() => {
    const banks =
      selectedCourseIds.length === 0
        ? allCourseBanks
        : allCourseBanks.filter((bank) => selectedCourseIds.includes(bank.courseId));

    return banks
      .flatMap((bank) => bank.questions)
      .filter((question) => {
        if (
          selectedDomainIds.length > 0 &&
          !question.tags.some((tag) => selectedDomainIds.includes(tag.id))
        ) {
          return false;
        }

        if (selectedDifficulties.length > 0) {
          const difficulty = question.difficulty ?? "intermediate";
          if (!selectedDifficulties.includes(difficulty)) {
            return false;
          }
        }

        return true;
      });
  }, [
    allCourseBanks,
    selectedCourseIds,
    selectedDomainIds,
    selectedDifficulties,
  ]);

  const handleBankRowClick = (bankId: string, inAssessment: boolean) => {
    if (inAssessment) {
      onFocusQuestionInOutline?.(bankId);
    }
  };

  const handleClearFilters = () => {
    setSelectedCourseIds([artifact.courseId]);
    setSelectedDomainIds([]);
    setSelectedDifficulties([]);
  };

  return (
    <ScrollArea className={styles.root}>
      <div className={styles.inner}>
        {activeTab === "builder-bank" && (
          <section className={styles.section}>
            <div className={styles.groupCard}>
              <div className={`${styles.groupHeader} ${styles.groupHeaderWithAction}`}>
                <h3 className={styles.groupHeading}>Filters</h3>
                <Tooltip content="Clear all filters" position="bottom">
                  <AppButton
                    variant="tertiary"
                    tone="gray"
                    size="xs"
                    iconName="arrow-rotate-left"
                    aria-label="Clear all filters"
                    onClick={handleClearFilters}
                  />
                </Tooltip>
              </div>
              <div className={styles.groupBody}>
                <div className={styles.filterFields}>
                  <div className={styles.filterField}>
                    <span className={styles.filterLabel}>Course</span>
                    <AppMultiSelectDropdown
                      options={courseOptions}
                      selectedValues={selectedCourseIds}
                      onSelectedValuesChange={setSelectedCourseIds}
                      placeholder="All courses"
                      size="xs"
                      tone="gray"
                      fullWidth
                      iconName="book"
                    />
                  </div>
                  <div className={styles.filterRow}>
                    <div className={styles.filterField}>
                      <span className={styles.filterLabel}>Domains</span>
                      <AppMultiSelectDropdown
                        options={domainOptions}
                        selectedValues={selectedDomainIds}
                        onSelectedValuesChange={setSelectedDomainIds}
                        placeholder="All domains"
                        size="xs"
                        tone="gray"
                        fullWidth
                        iconName="tag"
                        disabled={domainOptions.length === 0}
                      />
                    </div>
                    <div className={styles.filterField}>
                      <span className={styles.filterLabel}>Difficulty</span>
                      <AppMultiSelectDropdown
                        options={difficultyOptions}
                        selectedValues={selectedDifficulties}
                        onSelectedValuesChange={(values) =>
                          setSelectedDifficulties(values as QuestionDifficulty[])
                        }
                        placeholder="All levels"
                        size="xs"
                        tone="gray"
                        fullWidth
                        iconName="signal"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.groupCard}>
              <div className={styles.groupHeader}>
                <h3 className={styles.groupHeading}>Questions</h3>
                <span className={styles.groupMeta}>
                  {filteredBankQuestions.length}
                </span>
              </div>
              <div className={styles.groupBody}>
                {filteredBankQuestions.length === 0 ? (
                  <p className={styles.emptyListHint}>
                    No questions match the current filters.
                  </p>
                ) : (
                  <div className={styles.bankList}>
                    {filteredBankQuestions.map((question) => {
                      const inAssessment = resolvedQuestionIds.includes(question.bankId);
                      return (
                        <div key={question.bankId} className={styles.bankRow}>
                          <button
                            type="button"
                            className={styles.bankRowMain}
                            disabled={!inAssessment}
                            onClick={() =>
                              handleBankRowClick(question.bankId, inAssessment)
                            }
                          >
                            <span className={styles.rowLabel}>{question.title}</span>
                            <span className={styles.rowMeta}>
                              {itemKindLabel(question.item.kind)}
                            </span>
                            {(question.tags.length > 0 ||
                              question.difficulty != null) && (
                              <span className={styles.tagRow}>
                                {question.tags.map((tag) => (
                                  <AppTag key={tag.id}>{tag.label}</AppTag>
                                ))}
                                {question.difficulty != null && (
                                  <AppTag>
                                    {QUESTION_DIFFICULTY_LABELS[question.difficulty]}
                                  </AppTag>
                                )}
                              </span>
                            )}
                          </button>
                          <AppButton
                            variant={inAssessment ? "tertiary" : "secondary"}
                            tone="gray"
                            size="xs"
                            iconName={inAssessment ? "check" : "plus"}
                            disabled={inAssessment}
                            onClick={() => onAddBankQuestion(question.bankId)}
                          >
                            {inAssessment ? "Added" : "Add"}
                          </AppButton>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === "builder-settings" && (
          <section className={styles.section}>
            <div className={styles.groupCard}>
              <div className={styles.groupHeader}>
                <h3 className={styles.groupHeading}>Assessment</h3>
              </div>
              <div className={styles.groupBody}>
              <AppTextField
                label="Title"
                size="s"
                tone="gray"
                value={artifact.title}
                onChange={(event) =>
                  onUpdateArtifact((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
              />
              </div>
            </div>

            <div className={styles.groupCard}>
              <div className={styles.groupHeader}>
                <h3 className={styles.groupHeading}>Shuffling</h3>
              </div>
              <div className={styles.groupBody}>
              <label className={styles.checkRow}>
                <AppCheckbox
                  checkboxSize="s"
                  checked={artifact.shuffle.shuffleQuestions}
                  onChange={(event) =>
                    onUpdateArtifact((current) => ({
                      ...current,
                      shuffle: {
                        ...current.shuffle,
                        shuffleQuestions: event.target.checked,
                      },
                    }))
                  }
                />
                <span>Shuffle question order</span>
              </label>
              <label className={styles.checkRow}>
                <AppCheckbox
                  checkboxSize="s"
                  checked={artifact.shuffle.shuffleOptions}
                  onChange={(event) =>
                    onUpdateArtifact((current) => ({
                      ...current,
                      shuffle: {
                        ...current.shuffle,
                        shuffleOptions: event.target.checked,
                      },
                    }))
                  }
                />
                <span>Shuffle answer options</span>
              </label>
              </div>
            </div>

            <div className={styles.groupCard}>
              <div className={styles.groupHeader}>
                <h3 className={styles.groupHeading}>AI Tutor</h3>
              </div>
              <div className={styles.groupBody}>
              <label className={styles.checkRow}>
                <AppCheckbox
                  checkboxSize="s"
                  checked={artifact.tutor.enabled}
                  onChange={(event) =>
                    onUpdateArtifact((current) => ({
                      ...current,
                      tutor: { ...current.tutor, enabled: event.target.checked },
                    }))
                  }
                />
                <span>Enable AI Tutor</span>
              </label>
              {artifact.mode === "exam" && !artifact.tutor.enabled && (
                <p className={styles.hint}>Practice exams default the Tutor off.</p>
              )}
              </div>
            </div>

            {artifact.mode === "exam" && (
              <div className={styles.groupCard}>
                <div className={styles.groupHeader}>
                  <h3 className={styles.groupHeading}>Timed exam</h3>
                </div>
                <div className={styles.groupBody}>
                  <AppTextField
                    label="Time limit (minutes)"
                    size="s"
                    tone="gray"
                    inputMode="numeric"
                    value={String(artifact.timing?.timeLimitMinutes ?? "")}
                    onChange={(event) => {
                      const minutes = Number.parseInt(event.target.value, 10);
                      onUpdateArtifact((current) => ({
                        ...current,
                        timing: Number.isFinite(minutes)
                          ? { timeLimitMinutes: minutes }
                          : undefined,
                      }));
                    }}
                  />
                  <AppTextField
                    label="Max attempts"
                    size="s"
                    tone="gray"
                    inputMode="numeric"
                    value={String(artifact.attempts?.maxAttempts ?? "")}
                    onChange={(event) => {
                      const maxAttempts = Number.parseInt(event.target.value, 10);
                      onUpdateArtifact((current) => ({
                        ...current,
                        attempts: Number.isFinite(maxAttempts)
                          ? { maxAttempts }
                          : undefined,
                      }));
                    }}
                  />
                  {(artifact.poolDrawRules?.length ?? 0) > 0 && (
                    <div className={styles.poolRules}>
                      {artifact.poolDrawRules?.map((rule) => (
                        <p key={rule.id} className={styles.hint}>
                          {rule.label}: draw {rule.count} at runtime from tagged pool
                        </p>
                      ))}
                    </div>
                  )}
                  <p className={styles.hint}>
                    Exam mode suppresses per-item reveal during the attempt.
                  </p>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </ScrollArea>
  );
}
