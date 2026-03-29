import { MatchWorkspace } from "../components/assessment/match";
import { matchLevelLinks } from "./levelTypeLinks";

export function MatchLevelPage() {
  return (
    <MatchWorkspace
      levelLinks={matchLevelLinks}
      currentLevelPath="/levels/match"
    />
  );
}
