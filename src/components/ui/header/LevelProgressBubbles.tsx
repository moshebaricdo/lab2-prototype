import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import {
  findLevelLinkIndex,
  includesLevelPath,
} from "../../../lib/levelShareLinks";
import { Tooltip } from "../Tooltip";
import styles from "./LevelProgressBubbles.module.scss";

export interface LevelProgressLink {
  name: string;
  path: string;
}

type BubbleState = "not-started" | "completed" | "current";

interface BubbleProps {
  state: BubbleState;
  levelNumber?: number;
  to?: string;
  label: string;
  readOnly?: boolean;
}

const circleClassByState: Record<Exclude<BubbleState, "current">, string> = {
  "not-started": styles.circleNotStarted,
  completed: styles.circleCompleted,
};

function Bubble({ state, levelNumber, to, label, readOnly = false }: BubbleProps) {
  const isCurrent = state === "current";
  const bubbleClass = isCurrent ? styles.bubbleCurrent : styles.bubble;

  const BubbleWrapper = ({ children }: { children: ReactNode }) => {
    if (to) {
      return (
        <Link to={to} className={bubbleClass} aria-label={label}>
          {children}
        </Link>
      );
    }
    if (readOnly) {
      return (
        <span className={bubbleClass} aria-label={label}>
          {children}
        </span>
      );
    }
    return (
      <button type="button" className={bubbleClass} aria-label={label}>
        {children}
      </button>
    );
  };

  if (isCurrent && levelNumber) {
    return (
      <BubbleWrapper>
        <div className={styles.currentSvgWrap}>
          <svg
            className={styles.currentSvg}
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 24 24"
          >
            <ellipse
              cx="11.9181"
              cy="11.9297"
              className={styles.currentFill}
              rx="11.9181"
              ry="11.9297"
              transform="matrix(1 0 0.000970931 1 0 0)"
            />
          </svg>
        </div>
        <div className={styles.currentNumberWrap}>
          <div className={styles.currentNumberInner}>
            <div className={styles.currentNumberText}>
              <p>{levelNumber}</p>
            </div>
          </div>
        </div>
      </BubbleWrapper>
    );
  }

  return (
    <BubbleWrapper>
      <div className={styles.bubbleSvgWrap}>
        <div className={styles.bubbleSvgInner}>
          <svg
            className={styles.bubbleSvg}
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 13 13"
          >
            <circle
              cx="6.5"
              cy="6.5"
              className={circleClassByState[state as Exclude<BubbleState, "current">]}
              r="5.75"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      </div>
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

  const getBubbleState = (
    index: number,
  ): "not-started" | "completed" | "current" => {
    if (index === resolvedCurrentLevel - 1) return "current";
    if (completedLevelsSet.has(index + 1)) return "completed";
    return "not-started";
  };

  const getBubbleLabel = (index: number) =>
    isLinkMode ? resolvedLevelLinks[index].name : `Level ${index + 1}`;

  return (
    <div className={styles.root}>
      <div className={styles.inner}>
        <TooltipPrimitive.Provider delayDuration={0} skipDelayDuration={300}>
          <div className={styles.bubbleRow}>
            {Array.from({ length: resolvedTotalLevels }).map(
              (_, index) => {
                const state = getBubbleState(index);
                const label = getBubbleLabel(index);
                const to = isLinkMode && !readOnly ? resolvedLevelLinks[index].path : undefined;
                return (
                  <div key={index} className={styles.bubbleItem}>
                    <Tooltip
                      content={label}
                      position="top"
                      sideOffset={8}
                      withProvider={false}
                      disableHoverableContent
                    >
                      <div className={state === "current" ? styles.tooltipWrapFlipped : styles.tooltipWrap}>
                        <Bubble
                          state={state}
                          levelNumber={state === "current" ? resolvedCurrentLevel : undefined}
                          to={to}
                          label={label}
                          readOnly={readOnly}
                        />
                      </div>
                    </Tooltip>
                  </div>
                );
              },
            )}
          </div>
        </TooltipPrimitive.Provider>
      </div>
      <div aria-hidden="true" className={styles.borderOverlay} />
    </div>
  );
}
