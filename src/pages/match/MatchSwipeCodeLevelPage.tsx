import { MatchSwipeWorkspace } from "../../components/assessment/match";
import { mockMatchSwipeCodeLevel } from "../../data/assessment";
import { matchExperimentLinks } from "../levelTypeLinks";

export function MatchSwipeCodeLevelPage() {
  return (
    <MatchSwipeWorkspace
      payload={mockMatchSwipeCodeLevel}
      levelLinks={matchExperimentLinks}
      currentLevelPath="/levels/match-swipe-code"
    />
  );
}
