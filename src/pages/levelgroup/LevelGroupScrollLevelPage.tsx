import { mockLevelGroupScroll } from "../../data/assessment";
import { LevelGroupScrollWorkspace } from "../../components/assessment/levelgroup";
import { levelGroupLevelLinks } from "../levelTypeLinks";

export function LevelGroupScrollLevelPage() {
  return (
    <LevelGroupScrollWorkspace
      payload={mockLevelGroupScroll}
      levelLinks={levelGroupLevelLinks}
      currentLevelPath="/levels/levelgroup-scroll"
    />
  );
}
