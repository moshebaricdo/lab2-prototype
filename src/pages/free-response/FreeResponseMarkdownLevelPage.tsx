import { FreeResponseWorkspace } from "../../components/assessment/free-response";
import { mockFreeResponseLevelMarkdownOnly } from "../../data/assessment";
import { freeResponseLevelLinks } from "../levelTypeLinks";

export function FreeResponseMarkdownLevelPage() {
  return (
    <FreeResponseWorkspace
      payload={mockFreeResponseLevelMarkdownOnly}
      levelLinks={freeResponseLevelLinks}
      currentLevelPath="/levels/free-response-markdown"
    />
  );
}
