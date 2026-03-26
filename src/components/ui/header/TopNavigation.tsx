import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faBars,
  faCircleQuestion,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { AppButton } from "../AppButton";
import { LevelProgressBubbles } from "./LevelProgressBubbles";
import { Logo } from "../../icons/Logo";
import styles from "./TopNavigation.module.scss";

export interface TopNavigationProps {
  title?: string;
  subtitle?: string;
  currentLevel?: number;
  totalLevels?: number;
  completedLevels?: number[];
}

export function TopNavigation({
  title = "Lesson #: Lesson Title",
  subtitle = "Saved a few seconds ago",
  currentLevel = 9,
  totalLevels = 10,
  completedLevels = [1, 2, 3],
}: TopNavigationProps) {
  return (
    <div className={styles.root}>
      <div className={styles.leftGroup}>
        <div className={styles.logoWrap}>
          <Link
            to="/levels"
            className={styles.logoBox}
            aria-label="Go to levels page"
          >
            <Logo />
          </Link>
        </div>
      </div>

      <div className={styles.centerGroup}>
        <div className={styles.textCenter}>
          <p className={styles.title}>
            {title}
          </p>
          <p className={styles.subtitle}>
            {subtitle}
          </p>
        </div>
        <LevelProgressBubbles
          currentLevel={currentLevel}
          totalLevels={totalLevels}
          completedLevels={completedLevels}
        />
      </div>

      <div className={styles.rightGroup}>
        <AppButton
          variant="secondary"
          tone="white"
          size="s"
          className={styles.userButton}
        >
          Username
          <FontAwesomeIcon
            icon={faChevronDown}
            className={styles.userChevron}
          />
        </AppButton>
        <AppButton
          variant="tertiary"
          tone="white"
          size="s"
          icon={<FontAwesomeIcon icon={faCircleQuestion} className={styles.iconGlyph} />}
          className={styles.rightIconButton}
          aria-label="Help"
        />
        <AppButton
          variant="tertiary"
          tone="white"
          size="s"
          icon={<FontAwesomeIcon icon={faBars} className={styles.iconGlyph} />}
          className={styles.rightIconButton}
          aria-label="Menu"
        />
      </div>
    </div>
  );
}
