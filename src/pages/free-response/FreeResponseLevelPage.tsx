import { FreeResponseWorkspace } from "../../components/assessment/free-response";
import { mockFreeResponseLevel } from "../../data/assessment";
import { freeResponseExperimentLinks } from "../levelTypeLinks";

export function FreeResponseLevelPage() {
  return (
    <FreeResponseWorkspace
      payload={mockFreeResponseLevel}
      levelLinks={freeResponseExperimentLinks}
      currentLevelPath="/levels/free-response"
    />
  );
}
