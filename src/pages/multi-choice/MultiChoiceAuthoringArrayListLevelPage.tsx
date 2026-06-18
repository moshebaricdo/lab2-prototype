import { MultiChoiceWorkspace } from "../../components/assessment/multi";
import { mockMultiChoiceArrayListLevel } from "../../data/assessment";
import { multiChoiceExperimentLinks } from "../levelTypeLinks";

export function MultiChoiceAuthoringArrayListLevelPage() {
  return (
    <MultiChoiceWorkspace
      payload={mockMultiChoiceArrayListLevel}
      levelLinks={multiChoiceExperimentLinks}
      currentLevelPath="/levels/multi-authoring-arraylist"
    />
  );
}
