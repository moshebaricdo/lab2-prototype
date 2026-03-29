import { MultiChoiceWorkspace } from "../components/assessment/multi";
import { mockMultiChoiceArrayListLevel } from "../data/assessment";
import { multiChoiceLevelLinks } from "./levelTypeLinks";

export function MultiChoiceAuthoringArrayListLevelPage() {
  return (
    <MultiChoiceWorkspace
      payload={mockMultiChoiceArrayListLevel}
      levelLinks={multiChoiceLevelLinks}
      currentLevelPath="/levels/multi-authoring-arraylist"
    />
  );
}
