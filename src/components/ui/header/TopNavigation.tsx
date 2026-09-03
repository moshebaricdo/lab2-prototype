import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@moshebaricdo/cads-react";
import { GlobalNavMenu } from "./GlobalNavMenu";
import {
  LevelProgressBubbles,
  type LevelProgressLink,
} from "./LevelProgressBubbles";
import { ContinueButton } from "../../lab2/resource-panel/ContinueButton";
import { Logo } from "../icons/Logo";
import styles from "./TopNavigation.module.scss";

export interface TopNavigationProps {
  title?: string;
  subtitle?: string;
  currentLevel?: number;
  totalLevels?: number;
  completedLevels?: number[];
  levelLinks?: LevelProgressLink[];
  currentLevelPath?: string;
  completedLevelPaths?: string[];
  showContinueButton?: boolean;
  onContinue?: () => void;
  continueLabel?: string;
  disableLogoLink?: boolean;
  hideProgression?: boolean;
  disableProgressionLinks?: boolean;
  /**
   * Extra actions after the title (e.g. Back / Save). When set, the title
   * sits in the left group so it can sit next to those buttons.
   */
  leadingActions?: ReactNode;
}

export function TopNavigation({
  title = "Lesson #: Lesson Title",
  subtitle = "Saved a few seconds ago",
  currentLevel = 9,
  totalLevels = 10,
  completedLevels = [1, 2, 3],
  levelLinks,
  currentLevelPath,
  completedLevelPaths,
  showContinueButton = false,
  onContinue,
  continueLabel,
  disableLogoLink = false,
  hideProgression = false,
  disableProgressionLinks = false,
  leadingActions,
}: TopNavigationProps) {
  const continueButton = showContinueButton ? (
    <ContinueButton
      fullWidth={false}
      size="small"
      onClick={onContinue}
      label={continueLabel ?? "Continue"}
      className={styles.continueButton}
    />
  ) : null;

  const titleBlock = (
    <div
      className={
        leadingActions ? styles.levelHeadingStart : styles.levelHeading
      }
    >
      <p className={styles.title}>{title}</p>
      <p className={styles.subtitle}>{subtitle}</p>
    </div>
  );

  return (
    <div className={`${styles.root} dark`} data-theme="Dark">
      <div className={styles.leftGroup}>
        <div className={styles.logoWrap}>
          {disableLogoLink ? (
            <div className={styles.logoBox} aria-label="Code.org">
              <Logo />
            </div>
          ) : (
            <Link
              to="/levels"
              className={styles.logoBox}
              aria-label="Go to levels page"
            >
              <Logo />
            </Link>
          )}
        </div>
        {leadingActions ? (
          <>
            {titleBlock}
            <div className={styles.leadingActions}>{leadingActions}</div>
          </>
        ) : null}
      </div>

      <div className={styles.centerGroup}>
        {!hideProgression && !leadingActions ? titleBlock : null}
        {!hideProgression ? (
          <LevelProgressBubbles
            currentLevel={currentLevel}
            totalLevels={totalLevels}
            completedLevels={completedLevels}
            levelLinks={levelLinks}
            currentLevelPath={currentLevelPath}
            completedLevelPaths={completedLevelPaths}
            readOnly={disableProgressionLinks}
          />
        ) : null}
        {continueButton}
      </div>

      <div className={styles.rightGroup}>
        <Button
          variant="outlined"
          color="secondary"
          size="extraSmall"
          endIconName="chevron-down"
          className={styles.userButton}
        >
          Username
        </Button>
        <div className={styles.iconGroup}>
          <Button
            variant="text"
            color="tertiary"
            size="extraSmall"
            iconOnly
            startIconName="circle-question"
            className={`${styles.rightIconButton} ${styles.helpButton}`}
            aria-label="Help"
          />
          <GlobalNavMenu />
        </div>
      </div>
    </div>
  );
}
