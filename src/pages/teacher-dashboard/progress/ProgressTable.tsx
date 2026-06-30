import { useState } from "react";
import { AppButton } from "../../../components/ui/AppButton";
import { AppNativeSelect } from "../../../components/ui/AppDropdown";
import { FaIcon } from "../../../components/ui/icons/FaIcon";
import { ProgressStatusGlyph } from "./ProgressStatusGlyph";
import {
  LESSONS,
  SORT_OPTIONS,
  STUDENTS,
  UNIT_OPTIONS,
  type ProgressLesson,
  type ProgressStudentRow,
} from "./progressData";
import styles from "./ProgressTable.module.scss";

function LockColumn() {
  return (
    <div className={`${styles.column} ${styles.lockColumn}`}>
      <div className={`${styles.headerCell} ${styles.lockHeader}`}>
        <FaIcon name="lock" size="s" className={styles.lockIcon} />
      </div>
      <div className={`${styles.bodyCell} ${styles.studentRowCell} ${styles.lockBody}`}>
        <FaIcon name="lock" size="xs" className={styles.lockIcon} />
      </div>
      <div className={`${styles.bodyCell} ${styles.statRowCell}`} />
      <div className={`${styles.bodyCell} ${styles.statRowCell}`} />
    </div>
  );
}

function CollapsedLessonColumn({
  lesson,
  student,
}: {
  lesson: ProgressLesson;
  student: ProgressStudentRow;
}) {
  const status = student.lessonStatus[lesson.id];
  const hasData = Boolean(status);

  return (
    <div className={`${styles.column} ${styles.collapsedColumn}`}>
      <div className={`${styles.headerCell} ${styles.collapsedHeader}`}>
        <FaIcon name="caret-right" size="xs" className={styles.collapsedCaret} />
        {lesson.number}
      </div>
      <div className={`${styles.bodyCell} ${styles.studentRowCell}`}>
        {status ? <ProgressStatusGlyph status={status} /> : null}
      </div>
      <div className={`${styles.bodyCell} ${styles.statRowCell}`}>
        {hasData ? student.timeSpentMinutes : null}
      </div>
      <div className={`${styles.bodyCell} ${styles.statRowCell}`}>
        {hasData ? student.lastUpdated : null}
      </div>
    </div>
  );
}

function ExpandedLessonColumn({ lesson }: { lesson: ProgressLesson }) {
  return (
    <div className={`${styles.column} ${styles.expandedColumn}`}>
      <div className={`${styles.headerCell} ${styles.lessonTitleCell}`}>
        <FaIcon name="caret-down" size="xs" className={styles.lessonTitleCaret} />
        <span className={styles.lessonTitleText}>{lesson.title}</span>
      </div>

      <div className={styles.sublevelHeaderRow}>
        {lesson.sublevels.map((sublevel) => (
          <div key={sublevel.id} className={styles.sublevelHeaderCell}>
            <span>{sublevel.label}</span>
            {sublevel.levelType === "assessment" ? (
              <FaIcon name="star" size="xs" className={styles.sublevelStar} />
            ) : null}
            {sublevel.levelType === "choice" ? (
              <FaIcon name="code-fork" size="xs" className={styles.sublevelChoice} />
            ) : null}
          </div>
        ))}
      </div>

      <div className={styles.sublevelBodyRow}>
        {lesson.sublevels.map((sublevel) => (
          <div
            key={sublevel.id}
            className={`${styles.sublevelCell} ${styles.studentRowCell}`}
          />
        ))}
      </div>
      <div className={styles.sublevelBodyRow}>
        {lesson.sublevels.map((sublevel) => (
          <div
            key={sublevel.id}
            className={`${styles.sublevelCell} ${styles.statRowCell}`}
          />
        ))}
      </div>
      <div className={styles.sublevelBodyRow}>
        {lesson.sublevels.map((sublevel) => (
          <div
            key={sublevel.id}
            className={`${styles.sublevelCell} ${styles.statRowCell}`}
          />
        ))}
      </div>
    </div>
  );
}

export function ProgressTable() {
  const [sortBy, setSortBy] = useState(SORT_OPTIONS[0].value);
  const [unit, setUnit] = useState(UNIT_OPTIONS[0].value);
  const student = STUDENTS[0];

  return (
    <div className={styles.root}>
      <div className={styles.topBand}>
        <div className={styles.studentsHeadCell}>
          <h2 className={styles.studentsTitle}>Students</h2>
        </div>
        <div className={styles.lessonsToolbar}>
          <span className={styles.lessonsLabel}>Lessons in</span>
          <AppNativeSelect
            value={unit}
            onValueChange={setUnit}
            options={UNIT_OPTIONS}
            placeholder=""
            size="s"
            tone="gray"
            className={styles.unitSelect}
          />
          <AppButton
            variant="secondary"
            tone="gray"
            size="s"
            iconName="download"
            aria-label="Download progress"
          />
          <AppButton
            variant="secondary"
            tone="gray"
            size="s"
            iconName="ellipsis-vertical"
            aria-label="More progress options"
          />
        </div>
      </div>

      <div className={styles.gridScroll}>
        <div className={styles.grid}>
          <div className={`${styles.column} ${styles.studentColumn}`}>
            <div className={`${styles.headerCell} ${styles.sortHeader}`}>
              <span className={styles.sortLabel}>Sort by:</span>
              <AppNativeSelect
                value={sortBy}
                onValueChange={setSortBy}
                options={SORT_OPTIONS}
                placeholder=""
                size="s"
                tone="gray"
                fullWidth
              />
            </div>
            <div className={`${styles.bodyCell} ${styles.studentRowCell} ${styles.studentNameCell}`}>
              <FaIcon name="caret-down" size="xs" className={styles.studentCaret} />
              <span className={styles.studentName}>{student.name}</span>
            </div>
            <div className={`${styles.bodyCell} ${styles.statRowCell} ${styles.statLabelCell}`}>
              Time Spent (mins)
            </div>
            <div className={`${styles.bodyCell} ${styles.statRowCell} ${styles.statLabelCell}`}>
              Last Updated
            </div>
          </div>

          <LockColumn />

          {LESSONS.map((lesson) =>
            lesson.expanded ? (
              <ExpandedLessonColumn key={lesson.id} lesson={lesson} />
            ) : (
              <CollapsedLessonColumn
                key={lesson.id}
                lesson={lesson}
                student={student}
              />
            ),
          )}

          <LockColumn />
        </div>
      </div>
    </div>
  );
}
