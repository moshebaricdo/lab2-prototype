import { FreeResponseWorkspace } from "../../components/assessment/free-response";
import { mockFreeResponseLevelReveal } from "../../data/assessment";
import { freeResponseLevelLinks } from "../levelTypeLinks";

export function FreeResponseRevealLevelPage() {
  return (
    <FreeResponseWorkspace
      payload={mockFreeResponseLevelReveal}
      levelLinks={freeResponseLevelLinks}
      currentLevelPath="/levels/free-response-reveal"
    />
  );
}
