import { MultiChoiceWorkspace } from "../components/assessment/multi";
import { mockMultiChoiceAuthoringLevel } from "../data/assessment";
import { multiChoiceLevelLinks } from "./levelTypeLinks";

export function MultiChoiceAuthoringLevelPage() {
  return (
    <MultiChoiceWorkspace
      payload={mockMultiChoiceAuthoringLevel}
      levelLinks={multiChoiceLevelLinks}
      currentLevelPath="/levels/multi-authoring"
    />
  );
}
