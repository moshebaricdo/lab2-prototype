import { mockLevelGroupScrollStickyFooter } from "../../data/assessment";
import { LevelGroupScrollWorkspace } from "../../components/assessment/levelgroup";
import { levelGroupExperimentLinks } from "../levelTypeLinks";

export function LevelGroupScrollStickyFooterLevelPage() {
  return (
    <LevelGroupScrollWorkspace
      payload={mockLevelGroupScrollStickyFooter}
      levelLinks={levelGroupExperimentLinks}
      currentLevelPath="/levels/levelgroup-scroll-sticky-footer"
      stickyFooter
    />
  );
}
