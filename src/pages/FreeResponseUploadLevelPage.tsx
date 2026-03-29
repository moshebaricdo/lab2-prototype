import { FreeResponseWorkspace } from "../components/assessment/free-response";
import { mockFreeResponseLevelFileUpload } from "../data/assessment";
import { freeResponseLevelLinks } from "./levelTypeLinks";

export function FreeResponseUploadLevelPage() {
  return (
    <FreeResponseWorkspace
      payload={mockFreeResponseLevelFileUpload}
      levelLinks={freeResponseLevelLinks}
      currentLevelPath="/levels/free-response-upload"
    />
  );
}
