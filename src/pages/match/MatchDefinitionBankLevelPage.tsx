import { MatchDefinitionBankWorkspace } from "../../components/assessment/match";
import { mockMatchDefinitionBankLevel } from "../../data/assessment";
import { matchExperimentLinks } from "../levelTypeLinks";

export function MatchDefinitionBankLevelPage() {
  return (
    <MatchDefinitionBankWorkspace
      payload={mockMatchDefinitionBankLevel}
      levelLinks={matchExperimentLinks}
      currentLevelPath="/levels/match-definition-bank"
    />
  );
}
