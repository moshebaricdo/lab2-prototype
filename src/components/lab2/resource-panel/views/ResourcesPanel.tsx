import type { ReactNode } from "react";
import { AppButton } from "../../../ui/AppButton";
import { ScrollArea } from "../../../ui/scroll-area";
import styles from "./ResourcesPanel.module.scss";

interface ResourcesPanelProps {
  showStudentLessonResource: boolean;
  showDocumentationResource: boolean;
  showWalkthroughResources: boolean;
}

interface ResourceSectionProps {
  title: string;
  body: string;
  children: ReactNode;
}

const WALKTHROUGHS = [
  "Using the Resource Panel",
  "Using AI Tutor",
  "Validating Your Work",
];

function ResourceSection({
  title,
  body,
  children,
}: ResourceSectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionText}>
        <h3 className={styles.sectionTitle}>{title}</h3>
        <p className={styles.body}>{body}</p>
      </div>
      {children}
    </section>
  );
}

function ResourceActionRow({
  label,
  iconName,
}: {
  label: string;
  iconName: "arrow-up-right-from-square" | "play";
}) {
  return (
    <div className={styles.resourceItem}>
      <span className={styles.resourceTitle}>{label}</span>
      <AppButton
        variant="secondary"
        tone="gray"
        size="xs"
        iconName={iconName}
        disabled
        aria-label={label}
      />
    </div>
  );
}

export function ResourcesPanel({
  showStudentLessonResource,
  showDocumentationResource,
  showWalkthroughResources,
}: ResourcesPanelProps) {
  return (
    <ScrollArea className={styles.root} viewportClassName={styles.viewport}>
      <div className={styles.inner}>
        {showStudentLessonResource && (
          <ResourceSection
            title="Lesson resources"
            body="Key vocabulary, materials, and context for this lesson."
          >
            <ResourceActionRow
              label="Lesson 1: Computing Careers"
              iconName="arrow-up-right-from-square"
            />
          </ResourceSection>
        )}

        {showDocumentationResource && (
          <ResourceSection
            title="Documentation"
            body="A detailed guide to the programming concepts in this lab."
          >
            <ResourceActionRow
              label="Web Lab 2 Documentation"
              iconName="arrow-up-right-from-square"
            />
          </ResourceSection>
        )}

        {showWalkthroughResources && (
          <ResourceSection
            title="Guided walkthroughs"
            body="Short, interactive tours that teach you how to use important features in this lab. You won't lose your progress."
          >
            <div className={styles.resourceList}>
              {WALKTHROUGHS.map((walkthrough) => (
                <ResourceActionRow
                  key={walkthrough}
                  label={walkthrough}
                  iconName="play"
                />
              ))}
            </div>
          </ResourceSection>
        )}
      </div>
    </ScrollArea>
  );
}
