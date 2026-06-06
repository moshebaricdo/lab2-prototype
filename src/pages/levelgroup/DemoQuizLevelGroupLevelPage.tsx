import { mockDemoQuizLevelGroup } from "../../data/assessment";
import { LevelGroupSteppedWorkspace } from "../../components/assessment/levelgroup";
import { levelGroupLevelLinks } from "../levelTypeLinks";

export function DemoQuizLevelGroupLevelPage() {
  return (
    <LevelGroupSteppedWorkspace
      payload={mockDemoQuizLevelGroup}
      levelLinks={levelGroupLevelLinks}
      currentLevelPath="/levels/levelgroup-demo-quiz"
      shellSubtitle="Four question types, one at a time."
    />
  );
}
