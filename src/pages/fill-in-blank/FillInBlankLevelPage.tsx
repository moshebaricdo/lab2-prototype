import { FillInBlankWorkspace } from "../../components/assessment/fill-in-blank";
import { mockFillInBlankLevel } from "../../data/assessment";
import { fillInBlankLevelLinks } from "../levelTypeLinks";

export function FillInBlankLevelPage() {
  return (
    <FillInBlankWorkspace
      payload={mockFillInBlankLevel}
      levelLinks={fillInBlankLevelLinks}
      currentLevelPath="/levels/fill-in-blank"
    />
  );
}
