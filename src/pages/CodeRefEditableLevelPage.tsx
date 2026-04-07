import { useMemo, useState } from "react";
import { MultiChoiceWorkspace } from "../components/assessment/multi";
import { mockCodeRefEditable } from "../data/assessment";
import type { CodePanelConfig } from "../data/assessment/codePanel";
import { multiChoiceLevelLinks } from "./levelTypeLinks";

export function CodeRefEditableLevelPage() {
  const [files, setFiles] = useState(mockCodeRefEditable.codePanel.files);

  const codePanel: CodePanelConfig = useMemo(
    () => ({ ...mockCodeRefEditable.codePanel, files }),
    [files],
  );

  const handleContentChange = (fileIndex: number, content: string) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === fileIndex ? { ...f, content } : f)),
    );
  };

  return (
    <MultiChoiceWorkspace
      payload={mockCodeRefEditable}
      codePanel={codePanel}
      codePanelEditable
      onCodeContentChange={handleContentChange}
      levelLinks={multiChoiceLevelLinks}
      currentLevelPath="/levels/multi-code-ref-editable"
    />
  );
}
