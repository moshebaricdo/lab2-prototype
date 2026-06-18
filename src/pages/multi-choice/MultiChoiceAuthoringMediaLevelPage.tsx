import { MultiChoiceWorkspace } from "../../components/assessment/multi";
import { mockMultiChoiceMediaOptionsLevel } from "../../data/assessment";
import { multiChoiceExperimentLinks } from "../levelTypeLinks";

export function MultiChoiceAuthoringMediaLevelPage() {
  return (
    <MultiChoiceWorkspace
      payload={mockMultiChoiceMediaOptionsLevel}
      levelLinks={multiChoiceExperimentLinks}
      currentLevelPath="/levels/multi-authoring-media"
    />
  );
}
