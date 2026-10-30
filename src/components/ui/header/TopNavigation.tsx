import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button, Dropdown } from "@moshebari/cads-react";
import {
  LevelProgressBubbles,
  type LevelProgressLink,
} from "./LevelProgressBubbles";
import { ContinueButton } from "../../lab2/resource-panel/ContinueButton";
import { Logo } from "../icons/Logo";
import styles from "./TopNavigation.module.scss";

export interface AccountMenuOption {
  value: string;
  label: string;
  iconName?: string;
}

/** Replaces the static Username button with a view or account menu. */
export interface AccountMenuConfig {
  /** Selected option. The field shows that option's label. */
  value: string;
  options: AccountMenuOption[];
  onSelect: (value: string) => void;
}

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
  onProgressLevelSelect?: (index: number) => void;
  /** Hide the lesson title + subtitle (keep logo, bubbles, and actions). */
  hideTitle?: boolean;
  /**
   * Extra actions in the left group (e.g. Back / Save). When set with a
   * title, the title sits next to those buttons instead of the center.
   */
  leadingActions?: ReactNode;
  /** Actions on the right, before the account button. */
  trailingActions?: ReactNode;
  /** When set, the Username button opens this menu. */
  accountMenu?: AccountMenuConfig;
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
  onProgressLevelSelect,
  hideTitle = false,
  leadingActions,
  trailingActions,
  accountMenu,
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

  const showTitle = !hideTitle;
  const titleBlock = showTitle ? (
    <div
      className={
        leadingActions ? styles.levelHeadingStart : styles.levelHeading
      }
    >
      <p className={styles.title}>{title}</p>
      <p className={styles.subtitle}>{subtitle}</p>
    </div>
  ) : null;

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
        {!hideProgression && !leadingActions && titleBlock}
        {!hideProgression ? (
          <LevelProgressBubbles
            currentLevel={currentLevel}
            totalLevels={totalLevels}
            completedLevels={completedLevels}
            levelLinks={levelLinks}
            currentLevelPath={currentLevelPath}
            completedLevelPaths={completedLevelPaths}
            readOnly={disableProgressionLinks}
            onLevelSelect={onProgressLevelSelect}
          />
        ) : null}
        {continueButton}
      </div>

      <div className={styles.rightGroup}>
        {trailingActions ? (
          <div className={styles.leadingActions}>{trailingActions}</div>
        ) : null}
        {accountMenu ? (
          <div className={styles.accountMenu} data-theme="Light">
            <Dropdown
              role="input"
              size="extraSmall"
              color="secondary"
              menuPlacement="bottomRight"
              aria-label="View quiz as"
              value={accountMenu.value}
              onChange={(next) => {
                const value = Array.isArray(next) ? next[0] : next;
                if (value) accountMenu.onSelect(value);
              }}
              options={accountMenu.options.map((option) => ({
                value: option.value,
                label: option.label,
                iconName: option.iconName,
              }))}
            />
          </div>
        ) : (
          <Button
            variant="outlined"
            color="secondary"
            size="extraSmall"
            endIconName="chevron-down"
            className={styles.userButton}
          >
            Username
          </Button>
        )}
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
        </div>
      </div>
    </div>
  );
}
