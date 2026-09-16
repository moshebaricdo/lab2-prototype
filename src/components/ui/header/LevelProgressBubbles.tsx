import { Link, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { Button, Dropdown, Tooltip } from "@moshebari/cads-react";
import { FaIcon } from "@moshebari/cads-react/icons";
import {
  findLevelLinkIndex,
  includesLevelPath,
  levelLinksHaveDuplicatePaths,
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
  /\/levels\/(?:multi|free-response|match-|drag-drop|fill-in-blank|levelgroup|assessment-builder|cfu-|quiz-|progression-free-response|progression-levelgroup)/;

function inferIsAssessment(path: string | undefined): boolean {
  return Boolean(path && ASSESSMENT_PATH_PATTERN.test(path));
}

interface BubbleProps {
  status: ProgressBubbleStatus;
  isActive: boolean;
  isAssessment: boolean;
  levelNumber: number;
  to?: string;
  onClick?: () => void;
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
  onClick,
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
    if (onClick) {
      return (
        <button
          type="button"
          className={className}
          aria-label={label}
          aria-current={isActive ? "step" : undefined}
          onClick={onClick}
        >
          {children}
        </button>
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
  /** Single-route progressions where every link shares the same pathname. */
  onLevelSelect?: (index: number) => void;
}

export function LevelProgressBubbles({
  currentLevel = 1,
  totalLevels = 1,
  completedLevels = [],
  levelLinks,
  currentLevelPath,
  completedLevelPaths,
  readOnly = false,
  onLevelSelect,
}: LevelProgressBubblesProps) {
  const navigate = useNavigate();
  const isLinkMode = Boolean(levelLinks && levelLinks.length > 0);
  const resolvedLevelLinks = isLinkMode ? levelLinks ?? [] : [];
  const resolvedTotalLevels = isLinkMode
    ? resolvedLevelLinks.length
    : totalLevels;
  const useExplicitLevelIndex =
    isLinkMode && levelLinksHaveDuplicatePaths(resolvedLevelLinks);
  const linkModeCurrentLevel = isLinkMode && !useExplicitLevelIndex
    ? findLevelLinkIndex(resolvedLevelLinks, currentLevelPath) + 1
    : currentLevel;
  const resolvedCurrentLevel = isLinkMode
    ? Math.max(
        1,
        Math.min(resolvedTotalLevels, linkModeCurrentLevel || currentLevel),
      )
    : currentLevel;

  const completedLevelsSet = new Set<number>(
    isLinkMode
      ? useExplicitLevelIndex
        ? completedLevels.length > 0
          ? completedLevels
          : Array.from(
              { length: Math.max(0, resolvedCurrentLevel - 1) },
              (_, index) => index + 1,
            )
        : resolvedLevelLinks.reduce<number[]>((result, levelLink, index) => {
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

  const useLevelSelect =
    useExplicitLevelIndex && Boolean(onLevelSelect) && !readOnly;

  const moreMenuOptions = isLinkMode
    ? resolvedLevelLinks.map((levelLink, index) => ({
        value: useLevelSelect ? String(index) : levelLink.path,
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
          const to =
            link && !readOnly && !useLevelSelect ? link.path : undefined;
          const isAssessment = link?.isAssessment ?? inferIsAssessment(link?.path);
          return (
            <div
              key={useExplicitLevelIndex ? index : (link?.path ?? index)}
              className={styles.bubbleItem}
            >
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
                    onClick={
                      useLevelSelect ? () => onLevelSelect?.(index) : undefined
                    }
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
            onAction={(value) => {
              if (useLevelSelect) {
                onLevelSelect?.(Number(value));
                return;
              }
              navigate(String(value));
            }}
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
