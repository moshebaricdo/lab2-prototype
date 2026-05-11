import { mockLevelGroupScrollStickyFooter } from "../../data/assessment";
import { LevelGroupScrollWorkspace } from "../../components/assessment/levelgroup";
import { levelGroupLevelLinks } from "../levelTypeLinks";

export function LevelGroupScrollStickyFooterLevelPage() {
  return (
    <LevelGroupScrollWorkspace
      payload={mockLevelGroupScrollStickyFooter}
      levelLinks={levelGroupLevelLinks}
      currentLevelPath="/levels/levelgroup-scroll-sticky-footer"
      stickyFooter
    />
  );
}
