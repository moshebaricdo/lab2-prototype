import { MatchConnectorWorkspace } from "../../components/assessment/match";
import { mockMatchConnectorImageLevel } from "../../data/assessment";
import { matchExperimentLinks } from "../levelTypeLinks";

export function MatchConnectorImageLevelPage() {
  return (
    <MatchConnectorWorkspace
      payload={mockMatchConnectorImageLevel}
      levelLinks={matchExperimentLinks}
      currentLevelPath="/levels/match-connector-images"
    />
  );
}
