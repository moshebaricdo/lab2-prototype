import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faBars,
  faCircleQuestion,
} from "@fortawesome/free-solid-svg-icons";
import { AppButton } from "../AppButton";
import { LevelProgressBubbles } from "./LevelProgressBubbles";
import { Logo } from "../../icons/Logo";
import styles from "./TopNavigation.module.scss";

export function TopNavigation() {
  return (
    <div className={styles.root}>
      <div className={styles.leftGroup}>
        <div className={styles.logoWrap}>
          <div className={styles.logoBox}>
            <Logo />
          </div>
        </div>
      </div>

      <div className={styles.centerGroup}>
        <div className={styles.textCenter}>
          <p className={styles.title}>
            Lesson #: Lesson Title
          </p>
          <p className={styles.subtitle}>
            Saved a few seconds ago
          </p>
        </div>
        <LevelProgressBubbles
          currentLevel={9}
          totalLevels={10}
          completedLevels={[1, 2, 3]}
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
