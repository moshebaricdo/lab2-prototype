import { FillInBlankWorkspace } from "../../components/assessment/fill-in-blank";
import { mockFillInBlankMultiLevel } from "../../data/assessment";
import { fillInBlankLevelLinks } from "../levelTypeLinks";

export function FillInBlankMultiLevelPage() {
  return (
    <FillInBlankWorkspace
      payload={mockFillInBlankMultiLevel}
      levelLinks={fillInBlankLevelLinks}
      currentLevelPath="/levels/fill-in-blank-multi"
    />
  );
}
