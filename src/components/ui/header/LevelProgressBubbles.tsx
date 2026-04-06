import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { Tooltip } from "../Tooltip";

export interface LevelProgressLink {
  name: string;
  path: string;
}

interface BubbleProps {
  state:
    | "not-started"
    | "completed"
    | "in-progress"
    | "current";
  levelNumber?: number;
  to?: string;
  label: string;
}

function Bubble({ state, levelNumber, to, label }: BubbleProps) {
  const bubbleClassName = "group relative cursor-pointer";
  const bubbleProps = {
    "aria-label": label,
    className: `${bubbleClassName} ${state === "current" ? "size-[24.81px]" : "shrink-0 size-[15px]"}`,
  };

  const BubbleWrapper = ({ children }: { children: ReactNode }) => {
    if (to) {
      return (
        <Link to={to} {...bubbleProps}>
          {children}
        </Link>
      );
    }

    return (
      <button type="button" {...bubbleProps}>
        {children}
      </button>
    );
  };

  if (state === "current" && levelNumber) {
    return (
      <BubbleWrapper>
        <div className="absolute inset-[1.84%_1.92%_2%_1.92%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 24 24"
          >
            <ellipse
              cx="11.9181"
              cy="11.9297"
              className="fill-[#3EA33E] group-hover:fill-[#2d7a2d] transition-colors"
              rx="11.9181"
              ry="11.9297"
              transform="matrix(1 0 0.000970931 1 0 0)"
            />
          </svg>
        </div>
        <div className="absolute flex inset-[1.84%_1.92%_2%_1.92%] items-center justify-center pointer-events-none">
          <div className="flex-none scale-y-[-100%] size-[23.859px]">
            <div className="flex flex-col font-bold justify-center leading-[0] not-italic relative size-full text-[14.035px] text-center text-white">
              <p className="leading-[19.649px]">
                {levelNumber}
              </p>
            </div>
          </div>
        </div>
      </BubbleWrapper>
    );
  }

  let fillClass = "fill-white group-hover:fill-[#3EA33E]";
  let strokeClass =
    "stroke-[#D4DAE1] group-hover:stroke-[#3EA33E]";

  if (state === "completed") {
    fillClass = "fill-[#3EA33E] group-hover:fill-[#2d7a2d]";
    strokeClass =
      "stroke-[#3EA33E] group-hover:stroke-[#2d7a2d]";
  } else if (state === "in-progress") {
    fillClass = "fill-white group-hover:fill-[#3EA33E]";
    strokeClass =
      "stroke-[#3EA33E] group-hover:stroke-[#3EA33E]";
  }

  return (
    <BubbleWrapper>
      <div className="absolute flex inset-[6.667%] items-center justify-center pointer-events-none">
        <div className="flex-none scale-y-[-100%] size-[13px]">
          <div className="relative size-full">
            <svg
              className="block size-full"
              fill="none"
              preserveAspectRatio="none"
              viewBox="0 0 13 13"
            >
              <circle
                cx="6.5"
                cy="6.5"
                className={`${fillClass} ${strokeClass} transition-colors`}
                r="5.75"
                strokeWidth="1.5"
              />
            </svg>
          </div>
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
}

export function LevelProgressBubbles({
  currentLevel = 1,
  totalLevels = 1,
  completedLevels = [],
  levelLinks,
  currentLevelPath,
  completedLevelPaths,
}: LevelProgressBubblesProps) {
  const isLinkMode = Boolean(levelLinks && levelLinks.length > 0);
  const resolvedLevelLinks = isLinkMode ? levelLinks ?? [] : [];
  const resolvedTotalLevels = isLinkMode
    ? resolvedLevelLinks.length
    : totalLevels;
  const linkModeCurrentLevel = isLinkMode
    ? resolvedLevelLinks.findIndex(
        (levelLink) => levelLink.path === currentLevelPath,
      ) + 1
    : currentLevel;
  const resolvedCurrentLevel = isLinkMode
    ? Math.max(1, Math.min(resolvedTotalLevels, linkModeCurrentLevel || currentLevel))
    : currentLevel;

  const completedLevelsSet = new Set<number>(
    isLinkMode
      ? resolvedLevelLinks.reduce<number[]>((result, levelLink, index) => {
          if (completedLevelPaths?.includes(levelLink.path)) {
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
  ):
    | "not-started"
    | "completed"
    | "in-progress"
    | "current" => {
    if (index === resolvedCurrentLevel - 1) return "current";
    if (completedLevelsSet.has(index + 1)) return "completed";
    if (index === resolvedCurrentLevel) return "in-progress";
    return "not-started";
  };

  const getBubbleLabel = (index: number) =>
    isLinkMode ? resolvedLevelLinks[index].name : `Level ${index + 1}`;

  return (
    <div className="bg-[#f0f2f5] h-[36px] relative rounded-[4px] shrink-0">
      <div className="content-stretch flex h-[36px] items-center overflow-clip relative rounded-[inherit]">
        <TooltipPrimitive.Provider delayDuration={0}>
          <div className="box-border content-stretch flex gap-[3px] items-center px-[6px] py-[2px] relative shrink-0">
            {Array.from({ length: resolvedTotalLevels }).map(
              (_, index) => {
                const state = getBubbleState(index);
                const label = getBubbleLabel(index);
                const to = isLinkMode ? resolvedLevelLinks[index].path : undefined;
                return (
                  <div
                    key={index}
                    className="flex items-center justify-center relative shrink-0"
                  >
                    <Tooltip
                      content={label}
                      position="top"
                      sideOffset={8}
                      withProvider={false}
                    >
                      <div className={state === "current" ? "flex items-center scale-y-[-100%]" : "flex items-center"}>
                        <Bubble
                          state={state}
                          levelNumber={state === "current" ? resolvedCurrentLevel : undefined}
                          to={to}
                          label={label}
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
      <div
        aria-hidden="true"
        className="absolute border border-[#d4dae1] border-solid inset-0 pointer-events-none rounded-[4px]"
      />
    </div>
  );
}
