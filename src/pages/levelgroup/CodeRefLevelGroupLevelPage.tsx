import { LevelGroupScrollWorkspace } from "../../components/assessment/levelgroup";
import { mockCodeRefLevelGroup } from "../../data/assessment";
import { levelGroupLevelLinks } from "../levelTypeLinks";

export function CodeRefLevelGroupLevelPage() {
  return (
    <LevelGroupScrollWorkspace
      payload={mockCodeRefLevelGroup}
      codePanel={mockCodeRefLevelGroup.codePanel}
      levelLinks={levelGroupLevelLinks}
      currentLevelPath="/levels/levelgroup-code-ref"
    />
  );
}
