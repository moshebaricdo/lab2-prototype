import { MatchSwipeWorkspace } from "../../components/assessment/match";
import { mockMatchSwipeCardsLevel } from "../../data/assessment";
import { matchLevelLinks } from "../levelTypeLinks";

export function MatchSwipeLevelPage() {
  return (
    <MatchSwipeWorkspace
      payload={mockMatchSwipeCardsLevel}
      levelLinks={matchLevelLinks}
      currentLevelPath="/levels/match-swipe-cards"
    />
  );
}
