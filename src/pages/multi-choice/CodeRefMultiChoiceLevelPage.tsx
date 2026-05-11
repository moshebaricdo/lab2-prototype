import { MultiChoiceWorkspace } from "../../components/assessment/multi";
import { mockCodeRefMultiChoice } from "../../data/assessment";
import { multiChoiceLevelLinks } from "../levelTypeLinks";

export function CodeRefMultiChoiceLevelPage() {
  return (
    <MultiChoiceWorkspace
      payload={mockCodeRefMultiChoice}
      codePanel={mockCodeRefMultiChoice.codePanel}
      levelLinks={multiChoiceLevelLinks}
      currentLevelPath="/levels/multi-code-ref"
    />
  );
}
