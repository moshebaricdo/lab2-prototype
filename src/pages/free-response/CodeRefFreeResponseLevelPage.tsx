import { FreeResponseWorkspace } from "../../components/assessment/free-response";
import { mockCodeRefFreeResponse } from "../../data/assessment";
import { freeResponseLevelLinks } from "../levelTypeLinks";

export function CodeRefFreeResponseLevelPage() {
  return (
    <FreeResponseWorkspace
      payload={mockCodeRefFreeResponse}
      codePanel={mockCodeRefFreeResponse.codePanel}
      levelLinks={freeResponseLevelLinks}
      currentLevelPath="/levels/free-response-code-ref"
    />
  );
}
