import { MultiChoiceWorkspace } from "../components/assessment/multi";
import { mockMultiChoiceMediaOptionsLevel } from "../data/assessment";
import { multiChoiceLevelLinks } from "./levelTypeLinks";

export function MultiChoiceAuthoringMediaLevelPage() {
  return (
    <MultiChoiceWorkspace
      payload={mockMultiChoiceMediaOptionsLevel}
      levelLinks={multiChoiceLevelLinks}
      currentLevelPath="/levels/multi-authoring-media"
    />
  );
}
