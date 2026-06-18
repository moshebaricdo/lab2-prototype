import { mockLevelGroupStepped } from "../../data/assessment";
import { LevelGroupSteppedWorkspace } from "../../components/assessment/levelgroup";
import { assessmentSetLevelLinks } from "../levelTypeLinks";

export function LevelGroupSteppedLevelPage() {
  return (
    <LevelGroupSteppedWorkspace
      payload={mockLevelGroupStepped}
      levelLinks={assessmentSetLevelLinks}
      currentLevelPath="/levels/levelgroup-stepped"
    />
  );
}
