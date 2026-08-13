import { useEffect, useMemo, useState } from "react";
import { Button, Tag } from "@moshebaricdo/cads-react";
import { ScrollArea } from "../../../ui/scroll-area";
import { FaIcon } from "../../../ui/icons/FaIcon";
import styles from "./RubricPanel.module.scss";

export interface RubricCategory {
  id: string;
  label: string;
  description: string;
}

/** Mirrors teacher controls such as “student needs to keep working.” */
export type RubricSubmissionStatus = "complete" | "needs-revisions";

export interface RubricData {
  name: string;
  feedback: string | null;
  categories: RubricCategory[];
  /** ID of the category the teacher selected, or null if ungraded. */
  selectedCategoryId: string | null;
  /**
   * When graded, whether the student still owes revisions. Drives the status pill below
   * the rubric title. Ignored when there is no selected category.
   */
  submissionStatus?: RubricSubmissionStatus;
}

interface RubricPanelProps {
  /** One level may include up to four rubrics; navigation appears when there are multiple. */
  rubrics: RubricData[];
}

function getDefaultExpandedCategoryIds(rubric: RubricData | undefined) {
  const selectedCategoryId = rubric?.selectedCategoryId;
  return selectedCategoryId
    ? new Set([selectedCategoryId])
    : new Set<string>();
}

export function RubricPanel({ rubrics }: RubricPanelProps) {
  const [rubricIndex, setRubricIndex] = useState(0);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(
    () => getDefaultExpandedCategoryIds(rubrics[0]),
  );
  const rubric = rubrics[rubricIndex];

  useEffect(() => {
    setRubricIndex((i) =>
      rubrics.length === 0 ? 0 : Math.min(i, rubrics.length - 1),
    );
  }, [rubrics]);

  useEffect(() => {
    setExpandedCategoryIds(getDefaultExpandedCategoryIds(rubric));
  }, [rubric?.selectedCategoryId, rubricIndex]);

  const selectedCategory = useMemo(() => {
    if (!rubric) return undefined;
    return rubric.categories.find((c) => c.id === rubric.selectedCategoryId);
  }, [rubric]);

  const isGraded = selectedCategory != null;
  const submissionStatus = rubric?.submissionStatus ?? "complete";

  const showRubricNav = rubrics.length > 1;

  const toggleDescription = (categoryId: string) => {
    setExpandedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  if (!rubric) return null;

  return (
    <ScrollArea className={styles.root}>
      <div className={styles.inner} key={rubricIndex}>
        {showRubricNav && (
          <div className={styles.navCard}>
            <Button
              variant="outlined"
              color="secondary"
              size="extraSmall"
              iconOnly
              startIconName="chevron-left"
              disabled={rubricIndex === 0}
              onClick={() => setRubricIndex((i) => Math.max(0, i - 1))}
              aria-label="Previous rubric"
            />
            <span className={styles.navLabel}>
              Viewing {rubricIndex + 1} of {rubrics.length}
            </span>
            <Button
              variant="outlined"
              color="secondary"
              size="extraSmall"
              iconOnly
              startIconName="chevron-right"
              disabled={rubricIndex >= rubrics.length - 1}
              onClick={() =>
                setRubricIndex((i) =>
                  Math.min(rubrics.length - 1, i + 1),
                )
              }
              aria-label="Next rubric"
            />
          </div>
        )}

        {/* Header card — title + status pill, then teacher feedback */}
        <div className={styles.headerCard}>
          <div className={styles.titleRow}>
            <p className={styles.rubricName}>{rubric.name}</p>
            {isGraded && submissionStatus === "complete" && (
              <Tag
                size="small"
                color="success"
                label="Complete"
                className={styles.statusTag}
              />
            )}
            {isGraded && submissionStatus === "needs-revisions" && (
              <Tag
                size="small"
                color="warning"
                label="Needs work"
                className={styles.statusTag}
              />
            )}
            {!isGraded && (
              <Tag
                size="small"
                color="neutral"
                label="Not graded"
                className={styles.statusTag}
              />
            )}
          </div>
          <div className={styles.feedbackSection}>
            {rubric.feedback && (
              <div className={styles.feedbackLabelRow}>
                <span className={styles.feedbackLabel}>Teacher feedback</span>
              </div>
            )}
            <p className={styles.feedbackBody}>
              {rubric.feedback ?? "No teacher feedback yet!"}
            </p>
          </div>
        </div>

        {/* Rubric table */}
        {rubric.categories.length > 0 ? (
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <p className={styles.tableHeaderLabel}>Rubric levels</p>
            </div>
            {rubric.categories.map((cat) => {
              const isSelected = cat.id === rubric.selectedCategoryId;
              const hasDescription = Boolean(cat.description?.trim());
              const expanded = expandedCategoryIds.has(cat.id);
              return (
                <div key={cat.id} className={styles.categoryRow}>
                  <div className={styles.categoryHeader}>
                    {isGraded && (
                      <div
                        className={`${styles.selectedMarker} ${
                          isSelected
                            ? styles.markerSelected
                            : styles.markerUnselected
                        }`}
                      >
                        {isSelected && <FaIcon name="check" size="inherit" />}
                      </div>
                    )}
                    <div className={styles.categoryInfo}>
                      <div className={styles.categoryTitleRow}>
                        <p
                          className={`${styles.categoryLabel} ${
                            isSelected ? styles.categoryLabelSelected : ""
                          }`}
                        >
                          {cat.label}
                        </p>
                        {hasDescription && (
                          <Button
                            variant="text"
                            color="tertiary"
                            size="extraSmall"
                            iconOnly
                            startIconName={expanded ? "chevron-up" : "chevron-down"}
                            onClick={() => toggleDescription(cat.id)}
                            aria-expanded={expanded}
                            aria-label={
                              expanded
                                ? "Collapse evidence description"
                                : "Expand evidence description"
                            }
                          />
                        )}
                      </div>
                      {hasDescription && expanded && (
                        <p className={styles.categoryDescription}>
                          {cat.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyCard}>
            <FaIcon name="clipboard-list" size="l" className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>No rubric criteria</p>
            <p className={styles.emptyBody}>
              This rubric doesn't have any categories defined yet.
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
