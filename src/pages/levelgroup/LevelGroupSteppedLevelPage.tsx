import { mockLevelGroupStepped } from "../../data/assessment";
import { LevelGroupSteppedWorkspace } from "../../components/assessment/levelgroup";
import { levelGroupLevelLinks } from "../levelTypeLinks";

export function LevelGroupSteppedLevelPage() {
  return (
    <LevelGroupSteppedWorkspace
      payload={mockLevelGroupStepped}
      levelLinks={levelGroupLevelLinks}
      currentLevelPath="/levels/levelgroup-stepped"
    />
  );
}
