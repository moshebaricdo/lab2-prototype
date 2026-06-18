import { mockDemoQuizLevelGroup } from "../../data/assessment";
import { LevelGroupSteppedWorkspace } from "../../components/assessment/levelgroup";
import { assessmentSetLevelLinks } from "../levelTypeLinks";

export function DemoQuizLevelGroupLevelPage() {
  return (
    <LevelGroupSteppedWorkspace
      payload={mockDemoQuizLevelGroup}
      levelLinks={assessmentSetLevelLinks}
      currentLevelPath="/levels/levelgroup-demo-quiz"
      shellSubtitle="Four question types, one at a time."
    />
  );
}
