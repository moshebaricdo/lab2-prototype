import { FreeResponseWorkspace } from "../components/assessment/free-response";
import { mockFreeResponseLevel } from "../data/assessment";
import { freeResponseLevelLinks } from "./levelTypeLinks";

export function FreeResponseLevelPage() {
  return (
    <FreeResponseWorkspace
      payload={mockFreeResponseLevel}
      levelLinks={freeResponseLevelLinks}
      currentLevelPath="/levels/free-response"
    />
  );
}
