import { MatchConnectorWorkspace } from "../components/assessment/match";
import { matchLevelLinks } from "./levelTypeLinks";

export function MatchConnectorLevelPage() {
  return (
    <MatchConnectorWorkspace
      levelLinks={matchLevelLinks}
      currentLevelPath="/levels/match-connector"
    />
  );
}
