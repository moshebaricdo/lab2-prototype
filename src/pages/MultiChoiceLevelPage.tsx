import { MultiChoiceWorkspace } from "../components/assessment/multi";
import { multiChoiceLevelLinks } from "./levelTypeLinks";

export function MultiChoiceLevelPage() {
  return (
    <MultiChoiceWorkspace
      levelLinks={multiChoiceLevelLinks}
      currentLevelPath="/levels/multi"
    />
  );
}
