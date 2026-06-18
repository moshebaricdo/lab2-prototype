import { MultiChoiceWorkspace } from "../../components/assessment/multi";
import { mockCodeRefMultiFile } from "../../data/assessment";
import { multiChoiceExperimentLinks } from "../levelTypeLinks";

export function CodeRefMultiFileLevelPage() {
  return (
    <MultiChoiceWorkspace
      payload={mockCodeRefMultiFile}
      codePanel={mockCodeRefMultiFile.codePanel}
      levelLinks={multiChoiceExperimentLinks}
      currentLevelPath="/levels/multi-code-ref-multifile"
    />
  );
}
