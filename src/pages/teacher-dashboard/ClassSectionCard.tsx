import { useNavigate } from "react-router-dom";
import { AppButton } from "../../components/ui/AppButton";
import { AppActionDropdown } from "../../components/ui/AppDropdown";
import { AppNativeSelect } from "../../components/ui/AppDropdown";
import { FaIcon } from "../../components/ui/icons/FaIcon";
import {
  LESSON_OPTIONS,
  type ClassSection,
} from "./teacherDashboardData";
import styles from "./ClassSectionCard.module.scss";

interface ClassSectionCardProps {
  section: ClassSection;
}

const ICON_TONE_CLASS: Record<ClassSection["iconTone"], string> = {
  teal: styles.iconTeal,
  orange: styles.iconOrange,
  green: styles.iconGreen,
  yellow: styles.iconYellow,
};

export function ClassSectionCard({ section }: ClassSectionCardProps) {
  const navigate = useNavigate();

  return (
    <article className={styles.root}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.dragHandle}
          aria-label={`Reorder ${section.period}`}
        >
          <FaIcon name="grip-dots-vertical" size="s" />
        </button>

        <div className={`${styles.classIcon} ${ICON_TONE_CLASS[section.iconTone]}`}>
          <FaIcon name={section.iconName} size="m" />
        </div>

        <div className={styles.titleBlock}>
          <h3 className={styles.title}>
            {section.period}: {section.title} ({section.term})
          </h3>
          <p className={styles.classCode}>
            CLASS CODE:{" "}
            <span className={styles.classCodeValue}>{section.classCode}</span>
          </p>
        </div>

        <AppActionDropdown
          trigger={
            <AppButton
              variant="tertiary"
              tone="black"
              size="s"
              iconName="ellipsis-vertical"
              className={styles.menuButton}
              aria-label={`More options for ${section.period}`}
            />
          }
          items={[
            { id: "edit", label: "Edit section details" },
            { id: "archive", label: "Archive section" },
            { id: "code", label: "Print class login cards" },
          ]}
        />
      </div>

      <div className={styles.body}>
        <div className={styles.courseBox}>
          <label className={styles.courseLabel} htmlFor={`course-${section.id}`}>
            <span className={styles.courseLabelKey}>Course:</span>{" "}
            {section.courseName}
          </label>
          <AppNativeSelect
            id={`course-${section.id}`}
            value=""
            onValueChange={() => {}}
            options={LESSON_OPTIONS}
            size="s"
            tone="gray"
            fullWidth
          />
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.actionRow}
            onClick={() => navigate("/levels/teacher-dashboard/progress")}
          >
            <FaIcon name="chart-line" size="s" className={styles.actionIcon} />
            <span className={styles.actionLabel}>View progress</span>
            <FaIcon name="arrow-right" size="s" className={styles.actionArrow} />
          </button>
          <button type="button" className={styles.actionRow}>
            <FaIcon name="folder" size="s" className={styles.actionIcon} />
            <span className={styles.actionLabel}>View lesson materials</span>
            <FaIcon name="arrow-right" size="s" className={styles.actionArrow} />
          </button>
        </div>
      </div>
    </article>
  );
}
