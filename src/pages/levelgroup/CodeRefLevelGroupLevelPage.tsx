import { LevelGroupScrollWorkspace } from "../../components/assessment/levelgroup";
import { mockCodeRefLevelGroup } from "../../data/assessment";
import { levelGroupExperimentLinks } from "../levelTypeLinks";

export function CodeRefLevelGroupLevelPage() {
  return (
    <LevelGroupScrollWorkspace
      payload={mockCodeRefLevelGroup}
      codePanel={mockCodeRefLevelGroup.codePanel}
      levelLinks={levelGroupExperimentLinks}
      currentLevelPath="/levels/levelgroup-code-ref"
    />
  );
}
