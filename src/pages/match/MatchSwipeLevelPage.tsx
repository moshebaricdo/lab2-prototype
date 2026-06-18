import { MatchSwipeWorkspace } from "../../components/assessment/match";
import { mockMatchSwipeCardsLevel } from "../../data/assessment";
import { matchExperimentLinks } from "../levelTypeLinks";

export function MatchSwipeLevelPage() {
  return (
    <MatchSwipeWorkspace
      payload={mockMatchSwipeCardsLevel}
      levelLinks={matchExperimentLinks}
      currentLevelPath="/levels/match-swipe-cards"
    />
  );
}
