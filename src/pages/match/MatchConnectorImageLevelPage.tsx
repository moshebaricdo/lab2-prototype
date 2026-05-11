import { MatchConnectorWorkspace } from "../../components/assessment/match";
import { mockMatchConnectorImageLevel } from "../../data/assessment";
import { matchLevelLinks } from "../levelTypeLinks";

export function MatchConnectorImageLevelPage() {
  return (
    <MatchConnectorWorkspace
      payload={mockMatchConnectorImageLevel}
      levelLinks={matchLevelLinks}
      currentLevelPath="/levels/match-connector-images"
    />
  );
}
