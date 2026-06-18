import { FillInBlankWorkspace } from "../../components/assessment/fill-in-blank";
import { mockFillInBlankCodeRefLevel } from "../../data/assessment";
import { fillInBlankLevelLinks } from "../levelTypeLinks";

export function FillInBlankCodeRefLevelPage() {
  return (
    <FillInBlankWorkspace
      payload={mockFillInBlankCodeRefLevel}
      codePanel={mockFillInBlankCodeRefLevel.codePanel}
      levelLinks={fillInBlankLevelLinks}
      currentLevelPath="/levels/fill-in-blank-code-ref"
    />
  );
}
