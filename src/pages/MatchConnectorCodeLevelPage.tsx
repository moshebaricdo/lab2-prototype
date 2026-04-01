import { MatchConnectorWorkspace } from "../components/assessment/match";
import { mockMatchConnectorCodeLevel } from "../data/assessment";
import { matchLevelLinks } from "./levelTypeLinks";

export function MatchConnectorCodeLevelPage() {
  return (
    <MatchConnectorWorkspace
      payload={mockMatchConnectorCodeLevel}
      levelLinks={matchLevelLinks}
      currentLevelPath="/levels/match-connector-code"
    />
  );
}
