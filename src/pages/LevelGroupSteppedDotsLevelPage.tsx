import { mockLevelGroupStepped } from "../data/assessment";
import { LevelGroupSteppedWorkspace } from "../components/assessment/levelgroup";
import { levelGroupLevelLinks } from "./levelTypeLinks";

export function LevelGroupSteppedDotsLevelPage() {
  return (
    <LevelGroupSteppedWorkspace
      payload={mockLevelGroupStepped}
      levelLinks={levelGroupLevelLinks}
      currentLevelPath="/levels/levelgroup-stepped-dots"
      progressVariant="bottomDots"
      shellSubtitle="Step through questions — progress as dots in the footer (no reveal in this variant)."
    />
  );
}
