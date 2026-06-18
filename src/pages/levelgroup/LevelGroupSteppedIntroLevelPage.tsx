import { mockLevelGroupSteppedWithIntro } from "../../data/assessment";
import { LevelGroupSteppedWorkspace } from "../../components/assessment/levelgroup";
import { levelGroupExperimentLinks } from "../levelTypeLinks";

export function LevelGroupSteppedIntroLevelPage() {
  return (
    <LevelGroupSteppedWorkspace
      payload={mockLevelGroupSteppedWithIntro}
      levelLinks={levelGroupExperimentLinks}
      currentLevelPath="/levels/levelgroup-stepped-intro"
      shellSubtitle="Starts with an overview — questions begin after you choose Begin assessment."
    />
  );
}
