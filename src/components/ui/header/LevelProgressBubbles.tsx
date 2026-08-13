import { Link, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { Button, Dropdown, Tooltip } from "@moshebaricdo/cads-react";
import { FaIcon } from "@moshebaricdo/cads-react/icons";
import {
  findLevelLinkIndex,
  includesLevelPath,
} from "../../../lib/levelShareLinks";
import styles from "./LevelProgressBubbles.module.scss";

export type ProgressBubbleStatus = "notStarted" | "inProgress" | "completed";

export interface LevelProgressLink {
  name: string;
  path: string;
  /** Figma Progress Bubbles `isAssessment` (star glyph). Inferred from `path` when omitted. */
  isAssessment?: boolean;
}

const ASSESSMENT_PATH_PATTERN =
  /\/levels\/(?:multi|free-response|match-|drag-drop|fill-in-blank|levelgroup|assessment-builder|progression-free-response|progression-levelgroup)/;

function inferIsAssessment(path: string | undefined): boolean {
  return Boolean(path && ASSESSMENT_PATH_PATTERN.test(path));
}

interface BubbleProps {
  status: ProgressBubbleStatus;
  isActive: boolean;
  isAssessment: boolean;
  levelNumber: number;
  to?: string;
  label: string;
  readOnly?: boolean;
}

function bubbleClassName({
  status,
  isActive,
}: Pick<BubbleProps, "status" | "isActive">): string {
  const parts = [
    styles.bubble,
    isActive ? styles.bubbleActive : styles.bubbleInactive,
  ];
  if (status === "completed") parts.push(styles.statusCompleted);
  else if (status === "inProgress") parts.push(styles.statusInProgress);
  else parts.push(styles.statusNotStarted);
  return parts.join(" ");
}

function Bubble({
  status,
  isActive,
  isAssessment,
  levelNumber,
  to,
  label,
  readOnly = false,
}: BubbleProps) {
  const className = bubbleClassName({ status, isActive });
  const starSize = isActive ? "5px" : "6px";

  const BubbleWrapper = ({ children }: { children: ReactNode }) => {
    if (to) {
      return (
        <Link to={to} className={className} aria-label={label} aria-current={isActive ? "step" : undefined}>
          {children}
        </Link>
      );
    }
    if (readOnly) {
      return (
        <span className={className} aria-label={label} aria-current={isActive ? "step" : undefined}>
          {children}
        </span>
      );
    }
    return (
      <button
        type="button"
        className={className}
        aria-label={label}
        aria-current={isActive ? "step" : undefined}
      >
        {children}
      </button>
    );
  };

  return (
    <BubbleWrapper>
      {isActive ? <span className={styles.levelNumber}>{levelNumber}</span> : null}
      {isAssessment && !isActive ? (
        <FaIcon name="star" family="solid" fontSize={starSize} className={styles.star} />
      ) : null}
      {isAssessment && isActive ? (
        <span className={styles.assessmentBadge} aria-hidden="true">
          <FaIcon name="star" family="solid" fontSize={starSize} />
        </span>
      ) : null}
    </BubbleWrapper>
  );
}

interface LevelProgressBubblesProps {
  currentLevel?: number;
  totalLevels?: number;
  completedLevels?: number[];
  levelLinks?: LevelProgressLink[];
  currentLevelPath?: string;
  completedLevelPaths?: string[];
  readOnly?: boolean;
}

export function LevelProgressBubbles({
  currentLevel = 1,
  totalLevels = 1,
  completedLevels = [],
  levelLinks,
  currentLevelPath,
  completedLevelPaths,
  readOnly = false,
}: LevelProgressBubblesProps) {
  const navigate = useNavigate();
  const isLinkMode = Boolean(levelLinks && levelLinks.length > 0);
  const resolvedLevelLinks = isLinkMode ? levelLinks ?? [] : [];
  const resolvedTotalLevels = isLinkMode
    ? resolvedLevelLinks.length
    : totalLevels;
  const linkModeCurrentLevel = isLinkMode
    ? findLevelLinkIndex(resolvedLevelLinks, currentLevelPath) + 1
    : currentLevel;
  const resolvedCurrentLevel = isLinkMode
    ? Math.max(1, Math.min(resolvedTotalLevels, linkModeCurrentLevel || currentLevel))
    : currentLevel;

  const completedLevelsSet = new Set<number>(
    isLinkMode
      ? resolvedLevelLinks.reduce<number[]>((result, levelLink, index) => {
          if (includesLevelPath(completedLevelPaths, levelLink.path)) {
            result.push(index + 1);
            return result;
          }

          if (!completedLevelPaths && index < resolvedCurrentLevel - 1) {
            result.push(index + 1);
          }

          return result;
        }, [])
      : completedLevels,
  );

  const getStatus = (index: number): ProgressBubbleStatus => {
    if (completedLevelsSet.has(index + 1)) return "completed";
    if (index === resolvedCurrentLevel - 1) return "inProgress";
    return "notStarted";
  };

  const getBubbleLabel = (index: number) =>
    isLinkMode ? resolvedLevelLinks[index].name : `Level ${index + 1}`;

  const moreMenuOptions = isLinkMode
    ? resolvedLevelLinks.map((levelLink) => ({
        value: levelLink.path,
        label: levelLink.name,
      }))
    : Array.from({ length: resolvedTotalLevels }, (_, index) => ({
        value: String(index + 1),
        label: `Level ${index + 1}`,
      }));

  return (
    <div className={styles.root} data-theme="Light">
      <div className={styles.bubbleSlot}>
        {Array.from({ length: resolvedTotalLevels }).map((_, index) => {
          const isActive = index === resolvedCurrentLevel - 1;
          const status = getStatus(index);
          const label = getBubbleLabel(index);
          const link = isLinkMode ? resolvedLevelLinks[index] : undefined;
          const to = link && !readOnly ? link.path : undefined;
          const isAssessment = link?.isAssessment ?? inferIsAssessment(link?.path);
          return (
            <div key={link?.path ?? index} className={styles.bubbleItem}>
              <Tooltip
                title={label}
                placement="top"
                slotProps={{ popper: { disablePortal: true } }}
              >
                <span className={styles.tooltipWrap}>
                  <Bubble
                    status={status}
                    isActive={isActive}
                    isAssessment={isAssessment}
                    levelNumber={index + 1}
                    to={to}
                    label={label}
                    readOnly={readOnly}
                  />
                </span>
              </Tooltip>
            </div>
          );
        })}
      </div>
      <div className={styles.moreSlot}>
        {isLinkMode && !readOnly ? (
          <Dropdown
            role="action"
            size="extraSmall"
            iconOnly
            startIconName="chevron-down"
            buttonVariant="text"
            buttonColor="secondary"
            aria-label="More levels"
            menuPlacement="bottomRight"
            disablePortal
            options={moreMenuOptions}
            onAction={(value) => navigate(String(value))}
          />
        ) : (
          <Button
            variant="text"
            color="secondary"
            size="extraSmall"
            iconOnly
            startIconName="chevron-down"
            aria-label="More levels"
          />
        )}
      </div>
    </div>
  );
}
