import { LevelGroupSteppedWorkspace } from "../../components/assessment/levelgroup";
import { progressionLevelGroup } from "../../data/progression";
import { sampleProgressionLinks } from "../levelTypeLinks";

export function ProgressionLevelGroupPage() {
  return (
    <LevelGroupSteppedWorkspace
      payload={progressionLevelGroup}
      levelLinks={sampleProgressionLinks}
      currentLevelPath="/levels/progression-levelgroup"
      completedLevelPaths={[
        "/levels/progression-weblab",
        "/levels/progression-free-response",
        "/levels/progression-bubble-choice",
        "/levels/progression-branch-color",
      ]}
    />
  );
}
