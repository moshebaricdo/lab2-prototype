import { useState } from "react";
import { AppButton } from "../../components/ui/AppButton";
import { AppIconButton } from "../../components/ui/AppIconButton";
import { AppLink } from "../../components/ui/AppLink";
import { FaIcon } from "../../components/ui/icons/FaIcon";
import styles from "./DashboardSidebar.module.scss";

interface DashboardSidebarProps {
  className?: string;
}

export function DashboardSidebar({ className = "" }: DashboardSidebarProps) {
  const [showCurriculumPromo, setShowCurriculumPromo] = useState(true);

  return (
    <aside
      className={`${styles.root}${className ? ` ${className}` : ""}`}
      aria-label="Announcements"
    >
      {showCurriculumPromo && (
        <article className={`${styles.card} ${styles.curriculumCard}`}>
          <div className={styles.cardTopRow}>
            <p className={styles.eyebrow}>
              <FaIcon name="book" size="xs" className={styles.eyebrowIcon} />
              New curriculum
            </p>
            <AppIconButton
              variant="tertiary"
              tone="black"
              size="xs"
              iconName="xmark"
              className={styles.dismissButton}
              aria-label="Dismiss new curriculum announcement"
              onClick={() => setShowCurriculumPromo(false)}
            />
          </div>

          <h3 className={styles.cardTitle}>
            Check out our new Explore Generative AI unit!
          </h3>

          <div className={styles.curriculumIllustration} aria-hidden="true">
            <FaIcon name="message-bot" size="s" className={styles.illustrationChatLeft} />
            <FaIcon name="robot" size="l" className={styles.illustrationRobot} />
            <FaIcon name="message-lines" size="s" className={styles.illustrationChatRight} />
            <FaIcon name="book" size="m" className={styles.illustrationBook} />
          </div>

          <p className={styles.bodyText}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
            tempor incididunt ut labore et dolore magna aliqua.
          </p>
          <p className={styles.bodyText}>
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat.
          </p>

          <p className={styles.partnership}>
            In partnership with{" "}
            <span className={styles.partnerMark}>Amazon Future Engineer</span>
          </p>

          <AppButton
            variant="secondary"
            tone="gray"
            size="s"
            fullWidth
            className={styles.promoActionButton}
          >
            Explore the unit
          </AppButton>
        </article>
      )}

      <article className={`${styles.card} ${styles.resourcesCard}`}>
        <p className={styles.eyebrow}>
          <FaIcon name="graduation-cap" size="xs" className={styles.eyebrowIcon} />
          Teacher resources
        </p>

        <h3 className={styles.cardTitle}>
          You&apos;re eligible for free resources from Amazon!
        </h3>

        <p className={styles.bodyText}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
          tempor incididunt ut labore et dolore magna aliqua.
        </p>
        <p className={styles.bodyText}>
          Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat.
        </p>

        <AppButton
          variant="secondary"
          tone="gray"
          size="s"
          iconName="arrow-up-right-from-square"
          iconPosition="end"
          fullWidth
          className={styles.promoActionButton}
        >
          Learn more
        </AppButton>
      </article>

      <article className={`${styles.card} ${styles.infoCard}`}>
        <div className={styles.infoContent}>
          <h3 className={styles.infoTitle}>Grow your knowledge</h3>
          <p className={styles.infoText}>
            Find workshops and self-paced learning to help empower your teaching.
          </p>
          <AppLink href="#" size="s" className={styles.infoLink}>
            Explore professional learning
            <FaIcon name="arrow-up-right-from-square" size="xs" />
          </AppLink>
        </div>
        <div className={styles.infoIllustration} aria-hidden="true">
          <FaIcon name="book-open" size="l" />
          <FaIcon name="lightbulb" size="s" />
        </div>
      </article>

      <article className={`${styles.card} ${styles.infoCard}`}>
        <div className={styles.infoContent}>
          <h3 className={styles.infoTitle}>Help improve Code.org</h3>
          <p className={styles.infoText}>
            Participate in user research to help us improve our platform for everyone.
          </p>
          <AppLink href="#" size="s" className={styles.infoLink}>
            Join the user research program
            <FaIcon name="arrow-up-right-from-square" size="xs" />
          </AppLink>
        </div>
        <div className={styles.infoIllustration} aria-hidden="true">
          <FaIcon name="magnifying-glass" size="l" />
          <FaIcon name="clipboard-list" size="s" />
        </div>
      </article>
    </aside>
  );
}
