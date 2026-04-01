import { mockLevelGroupSteppedWithIntro } from "../data/assessment";
import { LevelGroupSteppedWorkspace } from "../components/assessment/levelgroup";
import { levelGroupLevelLinks } from "./levelTypeLinks";

export function LevelGroupSteppedIntroLevelPage() {
  return (
    <LevelGroupSteppedWorkspace
      payload={mockLevelGroupSteppedWithIntro}
      levelLinks={levelGroupLevelLinks}
      currentLevelPath="/levels/levelgroup-stepped-intro"
      shellSubtitle="Starts with an overview — questions begin after you choose Begin assessment."
    />
  );
}
