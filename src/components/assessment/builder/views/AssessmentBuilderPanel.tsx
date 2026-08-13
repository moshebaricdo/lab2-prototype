import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Button, Checkbox, Dropdown, Tag, TextInput, Tooltip } from "@moshebaricdo/cads-react";
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
  const courseFilterRef = useRef<HTMLDivElement>(null);

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
                <Tooltip title="Clear all filters" placement="bottom">
                  <span>
                    <Button
                      variant="text"
                      color="tertiary"
                      size="extraSmall"
                      iconOnly
                      startIconName="arrow-rotate-left"
                      aria-label="Clear all filters"
                      onClick={handleClearFilters}
                    />
                  </span>
                </Tooltip>
              </div>
              <div className={styles.groupBody}>
                <div className={styles.filterFields}>
                  <div className={styles.filterField} ref={courseFilterRef}>
                    <span className={styles.filterLabel}>Course</span>
                    <Dropdown
                      role="input"
                      menuType="checklist"
                      options={courseOptions}
                      value={selectedCourseIds}
                      onChange={(value) => setSelectedCourseIds(asStringArray(value))}
                      onOpenChange={(open) => {
                        if (open) {
                          requestAnimationFrame(() => {
                            syncChecklistMenuToTrigger(courseFilterRef.current);
                          });
                        }
                      }}
                      placeholder="All courses"
                      size="extraSmall"
                      color="secondary"
                      width="full"
                      menuWidth="trigger"
                      startIconName="book"
                    />
                  </div>
                  <div className={styles.filterRow}>
                    <div className={styles.filterField}>
                      <span className={styles.filterLabel}>Domains</span>
                      <Dropdown
                        role="input"
                        menuType="checklist"
                        options={domainOptions}
                        value={selectedDomainIds}
                        onChange={(value) => setSelectedDomainIds(asStringArray(value))}
                        placeholder="All domains"
                        size="extraSmall"
                        color="secondary"
                        width="full"
                        startIconName="tag"
                        disabled={domainOptions.length === 0}
                      />
                    </div>
                    <div className={styles.filterField}>
                      <span className={styles.filterLabel}>Difficulty</span>
                      <Dropdown
                        role="input"
                        menuType="checklist"
                        options={difficultyOptions}
                        value={selectedDifficulties}
                        onChange={(value) =>
                          setSelectedDifficulties(
                            asStringArray(value) as QuestionDifficulty[],
                          )
                        }
                        placeholder="All levels"
                        size="extraSmall"
                        color="secondary"
                        width="full"
                        startIconName="signal"
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
                                  <Tag
                                    key={tag.id}
                                    size="small"
                                    color="neutral"
                                    label={tag.label}
                                  />
                                ))}
                                {question.difficulty != null && (
                                  <Tag
                                    size="small"
                                    color="neutral"
                                    label={QUESTION_DIFFICULTY_LABELS[question.difficulty]}
                                  />
                                )}
                              </span>
                            )}
                          </button>
                          <Button
                            variant={inAssessment ? "text" : "outlined"}
                            color="secondary"
                            size="extraSmall"
                            startIconName={inAssessment ? "check" : "plus"}
                            disabled={inAssessment}
                            onClick={() => onAddBankQuestion(question.bankId)}
                          >
                            {inAssessment ? "Added" : "Add"}
                          </Button>
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
              <TextInput
                label="Title"
                size="small"
                color="secondary"
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
              <Checkbox
                size="small"
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
                label="Shuffle question order"
              />
              <Checkbox
                size="small"
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
                label="Shuffle answer options"
              />
              </div>
            </div>

            <div className={styles.groupCard}>
              <div className={styles.groupHeader}>
                <h3 className={styles.groupHeading}>AI Tutor</h3>
              </div>
              <div className={styles.groupBody}>
              <Checkbox
                size="small"
                checked={artifact.tutor.enabled}
                onChange={(event) =>
                  onUpdateArtifact((current) => ({
                    ...current,
                    tutor: { ...current.tutor, enabled: event.target.checked },
                  }))
                }
                label="Enable AI Tutor"
              />
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
                  <TextInput
                    label="Time limit (minutes)"
                    size="small"
                    color="secondary"
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
                  <TextInput
                    label="Max attempts"
                    size="small"
                    color="secondary"
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
