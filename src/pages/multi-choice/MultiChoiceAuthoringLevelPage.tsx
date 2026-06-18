import { MultiChoiceWorkspace } from "../../components/assessment/multi";
import { mockMultiChoiceAuthoringLevel } from "../../data/assessment";
import { multiChoiceExperimentLinks } from "../levelTypeLinks";

export function MultiChoiceAuthoringLevelPage() {
  return (
    <MultiChoiceWorkspace
      payload={mockMultiChoiceAuthoringLevel}
      levelLinks={multiChoiceExperimentLinks}
      currentLevelPath="/levels/multi-authoring"
    />
  );
}
