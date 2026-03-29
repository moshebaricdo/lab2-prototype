import { MatchDefinitionBankWorkspace } from "../components/assessment/match";
import { mockMatchDefinitionBankLevel } from "../data/assessment";
import { matchLevelLinks } from "./levelTypeLinks";

export function MatchDefinitionBankLevelPage() {
  return (
    <MatchDefinitionBankWorkspace
      payload={mockMatchDefinitionBankLevel}
      levelLinks={matchLevelLinks}
      currentLevelPath="/levels/match-definition-bank"
    />
  );
}
