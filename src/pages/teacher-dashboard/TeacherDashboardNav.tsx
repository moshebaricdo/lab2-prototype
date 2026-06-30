import { Link } from "react-router-dom";
import { AppButton } from "../../components/ui/AppButton";
import { FaIcon } from "../../components/ui/icons/FaIcon";
import { GlobalNavMenu } from "../../components/ui/header/GlobalNavMenu";
import { Logo } from "../../components/ui/icons/Logo";
import { NAV_LINKS, TEACHER_NAME } from "./teacherDashboardData";
import styles from "./TeacherDashboardNav.module.scss";

export function TeacherDashboardNav() {
  return (
    <header className={styles.root}>
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
          size="s"
          iconName="chevron-down"
          iconPosition="end"
          className={styles.outlineButton}
        >
          New Project
        </AppButton>
        <AppButton
          variant="secondary"
          tone="white"
          size="s"
          iconName="circle-user"
          className={styles.outlineButton}
        >
          {TEACHER_NAME}
          <FaIcon name="chevron-down" size="xs" className={styles.userChevron} />
        </AppButton>
        <AppButton
          variant="tertiary"
          tone="white"
          size="s"
          iconName="circle-question"
          className={styles.iconButton}
          aria-label="Help"
        />
        <GlobalNavMenu />
      </div>
    </header>
  );
}
