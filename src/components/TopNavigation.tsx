import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faBars,
  faCircleQuestion,
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "./ui/button";
import { LevelProgressBubbles } from "./LevelProgressBubbles";
import { Logo } from "./icons/Logo";

export function TopNavigation() {
  return (
    <div className="bg-accent h-[50px] flex items-center justify-between px-2 border-b border-[#d4dae1]">
      <div className="flex items-center gap-6">
        <div className="flex items-center pr-3">
          <div className="size-9">
            <Logo />
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center gap-2">
        <div className="text-center">
          <p className="text-white text-xs font-semibold text-[14px]">
            Lesson #: Lesson Title
          </p>
          <p className="text-[rgb(255,255,255)] text-[12px] opacity-70">
            Saved a few seconds ago
          </p>
        </div>
        <LevelProgressBubbles
          currentLevel={9}
          totalLevels={10}
          completedLevels={[1, 2, 3]}
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          className="text-white border border-white hover:bg-white/10 hover:text-white"
        >
          Username{" "}
          <FontAwesomeIcon
            icon={faChevronDown}
            className="ml-2 w-4 h-4"
          />
        </Button>
        <FontAwesomeIcon
          icon={faCircleQuestion}
          className="w-6 h-6 text-white cursor-pointer"
        />
        <FontAwesomeIcon
          icon={faBars}
          className="w-6 h-6 text-white cursor-pointer"
        />
      </div>
    </div>
  );
}
