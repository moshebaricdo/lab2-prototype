import { MultiChoiceWorkspace } from "../components/assessment/multi";
import { mockMultiChoiceAllThatApplyLevel } from "../data/assessment";
import { multiChoiceLevelLinks } from "./levelTypeLinks";

export function MultiChoiceAllThatApplyLevelPage() {
  return (
    <MultiChoiceWorkspace
      payload={mockMultiChoiceAllThatApplyLevel}
      levelLinks={multiChoiceLevelLinks}
      currentLevelPath="/levels/multi-all-that-apply"
    />
  );
}
