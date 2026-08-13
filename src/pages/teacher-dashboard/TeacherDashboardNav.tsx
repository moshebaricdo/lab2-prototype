import { Link } from "react-router-dom";
import { AppButton } from "../../components/ui/AppButton";
import { GlobalNavMenu } from "../../components/ui/header/GlobalNavMenu";
import { Logo } from "../../components/ui/icons/Logo";
import { NAV_LINKS, TEACHER_NAME } from "./teacherDashboardData";
import styles from "./TeacherDashboardNav.module.scss";

export function TeacherDashboardNav() {
  return (
    <header className={`${styles.root} dark`} data-theme="Dark">
      <div className={styles.leftGroup}>
        <Link to="/levels" className={styles.logoBox} aria-label="Go to levels page">
          <Logo />
        </Link>
        <nav className={styles.navLinks} aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <a key={link.label} href={link.href} className={styles.navLink}>
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      <div className={styles.rightGroup}>
        <AppButton
          variant="secondary"
          tone="white"
          size="xs"
          iconName="plus"
          iconPosition="end"
          className={styles.outlineButton}
        >
          New project
        </AppButton>
        <AppButton
          variant="secondary"
          tone="white"
          size="xs"
          iconName="chevron-down"
          iconPosition="end"
          className={styles.outlineButton}
        >
          {TEACHER_NAME}
        </AppButton>
        <div className={styles.iconGroup}>
          <AppButton
            variant="tertiary"
            tone="white"
            size="xs"
            iconName="circle-question"
            className={`${styles.iconButton} ${styles.helpButton}`}
            aria-label="Help"
          />
          <GlobalNavMenu />
        </div>
      </div>
    </header>
  );
}
