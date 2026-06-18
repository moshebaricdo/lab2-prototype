import { MultiChoiceWorkspace } from "../../components/assessment/multi";
import { mockMultiChoiceCodeOptionsLevel } from "../../data/assessment";
import { multiChoiceExperimentLinks } from "../levelTypeLinks";

export function MultiChoiceAuthoringCodeLevelPage() {
  return (
    <MultiChoiceWorkspace
      payload={mockMultiChoiceCodeOptionsLevel}
      levelLinks={multiChoiceExperimentLinks}
      currentLevelPath="/levels/multi-authoring-code"
    />
  );
}
