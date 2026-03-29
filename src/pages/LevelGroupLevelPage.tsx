import { LevelGroupWorkspace } from "../components/assessment/levelgroup";
import { levelGroupLevelLinks } from "./levelTypeLinks";

export function LevelGroupLevelPage() {
  return (
    <LevelGroupWorkspace
      levelLinks={levelGroupLevelLinks}
      currentLevelPath="/levels/levelgroup"
    />
  );
}
