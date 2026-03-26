interface BubbleProps {
  state:
    | "not-started"
    | "completed"
    | "in-progress"
    | "current";
  levelNumber?: number;
}

function Bubble({ state, levelNumber }: BubbleProps) {
  if (state === "current" && levelNumber) {
    return (
      <button className="group relative size-[24.81px] cursor-pointer">
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
      </button>
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
    <button className="group relative shrink-0 size-[15px] cursor-pointer">
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
    </button>
  );
}

interface LevelProgressBubblesProps {
  currentLevel: number;
  totalLevels: number;
  completedLevels: number[];
}

export function LevelProgressBubbles({
  currentLevel,
  totalLevels,
  completedLevels,
}: LevelProgressBubblesProps) {
  const getBubbleState = (
    index: number,
  ):
    | "not-started"
    | "completed"
    | "in-progress"
    | "current" => {
    if (index === currentLevel - 1) return "current";
    if (completedLevels.includes(index + 1)) return "completed";
    if (index === currentLevel) return "in-progress";
    return "not-started";
  };

  return (
    <div className="bg-[#f0f2f5] h-[36px] relative rounded-[4px] shrink-0">
      <div className="content-stretch flex h-[36px] items-center overflow-clip relative rounded-[inherit]">
        <div className="box-border content-stretch flex gap-[3px] items-center px-[6px] py-[2px] relative shrink-0">
          {Array.from({ length: totalLevels }).map(
            (_, index) => {
              const state = getBubbleState(index);
              return (
                <div
                  key={index}
                  className="flex items-center justify-center relative shrink-0"
                >
                  {state === "current" ? (
                    <div className="flex items-center scale-y-[-100%]">
                      <Bubble
                        state={state}
                        levelNumber={currentLevel}
                      />
                    </div>
                  ) : (
                    <Bubble state={state} />
                  )}
                </div>
              );
            },
          )}
        </div>
      </div>
      <div
        aria-hidden="true"
        className="absolute border border-[#d4dae1] border-solid inset-0 pointer-events-none rounded-[4px]"
      />
    </div>
  );
}
