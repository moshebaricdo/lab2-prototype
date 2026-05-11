import { MatchSwipeWorkspace } from "../../components/assessment/match";
import { mockMatchSwipeCodeLevel } from "../../data/assessment";
import { matchLevelLinks } from "../levelTypeLinks";

export function MatchSwipeCodeLevelPage() {
  return (
    <MatchSwipeWorkspace
      payload={mockMatchSwipeCodeLevel}
      levelLinks={matchLevelLinks}
      currentLevelPath="/levels/match-swipe-code"
    />
  );
}
