import { MultiChoiceWorkspace } from "../components/assessment/multi";
import { mockMultiChoiceCodeOptionsLevel } from "../data/assessment";
import { multiChoiceLevelLinks } from "./levelTypeLinks";

export function MultiChoiceAuthoringCodeLevelPage() {
  return (
    <MultiChoiceWorkspace
      payload={mockMultiChoiceCodeOptionsLevel}
      levelLinks={multiChoiceLevelLinks}
      currentLevelPath="/levels/multi-authoring-code"
    />
  );
}
