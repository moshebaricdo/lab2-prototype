import { MultiChoiceWorkspace } from "../../components/assessment/multi";
import { mockCodeRefMultiFile } from "../../data/assessment";
import { multiChoiceLevelLinks } from "../levelTypeLinks";

export function CodeRefMultiFileLevelPage() {
  return (
    <MultiChoiceWorkspace
      payload={mockCodeRefMultiFile}
      codePanel={mockCodeRefMultiFile.codePanel}
      levelLinks={multiChoiceLevelLinks}
      currentLevelPath="/levels/multi-code-ref-multifile"
    />
  );
}
