import { FreeResponseWorkspace } from "../../components/assessment/free-response";
import { mockFreeResponseLevelMarkdownOnly } from "../../data/assessment";
import { freeResponseExperimentLinks } from "../levelTypeLinks";

export function FreeResponseMarkdownLevelPage() {
  return (
    <FreeResponseWorkspace
      payload={mockFreeResponseLevelMarkdownOnly}
      levelLinks={freeResponseExperimentLinks}
      currentLevelPath="/levels/free-response-markdown"
    />
  );
}
