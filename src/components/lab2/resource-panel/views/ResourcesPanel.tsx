import { AppButton } from "../../../ui/AppButton";
import { ScrollArea } from "../../../ui/scroll-area";
import styles from "./ResourcesPanel.module.scss";

interface ResourcesPanelProps {
  showStudentLessonResource: boolean;
  showDocumentationResource: boolean;
  showWalkthroughResources: boolean;
}

interface ResourceCardProps {
  eyebrow: string;
  body: string;
  actionLabel: string;
  actionIconName: "link" | "play";
}

const WALKTHROUGHS = [
  "Getting started with the workspace",
  "Using AI Tutor for planning",
  "Previewing and polishing your project",
];

function ResourceCard({
  eyebrow,
  body,
  actionLabel,
  actionIconName,
}: ResourceCardProps) {
  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <p className={styles.eyebrow}>{eyebrow}</p>
      </div>
      <div className={styles.cardBody}>
        <p className={styles.body}>{body}</p>
        <ResourceActionRow
          label={actionLabel}
          iconName={actionIconName}
        />
      </div>
    </section>
  );
}

function ResourceActionRow({
  label,
  iconName,
}: {
  label: string;
  iconName: "link" | "play";
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
          <ResourceCard
            eyebrow="Lesson resources"
            body="Jump back to the lesson resources connected to this level."
            actionLabel="Open lesson resources"
            actionIconName="link"
          />
        )}

        {showDocumentationResource && (
          <ResourceCard
            eyebrow="Documentation"
            body="Reference docs and examples for this lab will be linked here."
            actionLabel="Open documentation"
            actionIconName="link"
          />
        )}

        {showWalkthroughResources && (
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <p className={styles.eyebrow}>Walkthroughs</p>
            </div>
            <div className={styles.cardBody}>
              <p className={styles.body}>
                Restart guided walkthroughs for this level whenever you need a refresher.
              </p>
              <div className={styles.resourceList}>
                {WALKTHROUGHS.map((walkthrough) => (
                  <ResourceActionRow
                    key={walkthrough}
                    label={walkthrough}
                    iconName="play"
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </ScrollArea>
  );
}
