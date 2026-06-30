import { useState } from "react";
import { AppButton } from "../../components/ui/AppButton";
import { AppActionDropdown } from "../../components/ui/AppDropdown";
import {
  SegmentedControl,
  type SegmentedOption,
} from "../../components/ui/SegmentedControl";
import { ClassSectionCard } from "./ClassSectionCard";
import { CLASS_SECTIONS, TEACHER_NAME } from "./teacherDashboardData";
import styles from "./ClassSectionsPanel.module.scss";

type SectionTab = "teaching" | "archived";

const SECTION_TAB_OPTIONS: SegmentedOption<SectionTab>[] = [
  { value: "teaching", label: "Teaching" },
  { value: "archived", label: "Archived" },
];

const NEW_SECTION_MENU_ITEMS = [
  { id: "import", label: "Import a section" },
  { id: "join", label: "Join a section as a teacher" },
];

export function ClassSectionsPanel() {
  const [activeTab, setActiveTab] = useState<SectionTab>("teaching");

  return (
    <section className={styles.root} aria-labelledby="teacher-dashboard-welcome">
      <h1 id="teacher-dashboard-welcome" className={styles.welcome}>
        Welcome, {TEACHER_NAME}
      </h1>

      <div className={styles.sectionHeaderBlock}>
        <h2 className={styles.sectionTitle}>Class Sections</h2>

        <div className={styles.toolbar}>
          <SegmentedControl<SectionTab>
            options={SECTION_TAB_OPTIONS}
            value={activeTab}
            onChange={setActiveTab}
            size="s"
          />

          <div className={styles.createSectionGroup}>
            <AppButton
              variant="primary"
              tone="purple"
              size="s"
              iconName="plus"
            >
              New class section
            </AppButton>
            <AppActionDropdown
              trigger={
                <AppButton
                  variant="secondary"
                  tone="gray"
                  size="s"
                  iconName="ellipsis-vertical"
                  className={styles.overflowButton}
                  aria-label="More class section actions"
                />
              }
              items={NEW_SECTION_MENU_ITEMS}
            />
          </div>
        </div>
      </div>

      <div className={styles.cardList} role="tabpanel">
        {activeTab === "teaching" ? (
          CLASS_SECTIONS.map((section) => (
            <ClassSectionCard key={section.id} section={section} />
          ))
        ) : (
          <p className={styles.emptyState}>No archived class sections.</p>
        )}
      </div>
    </section>
  );
}
