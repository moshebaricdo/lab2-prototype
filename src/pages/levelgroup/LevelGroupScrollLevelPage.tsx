import { mockLevelGroupScroll } from "../../data/assessment";
import { LevelGroupScrollWorkspace } from "../../components/assessment/levelgroup";
import { levelGroupExperimentLinks } from "../levelTypeLinks";

export function LevelGroupScrollLevelPage() {
  return (
    <LevelGroupScrollWorkspace
      payload={mockLevelGroupScroll}
      levelLinks={levelGroupExperimentLinks}
      currentLevelPath="/levels/levelgroup-scroll"
    />
  );
}
