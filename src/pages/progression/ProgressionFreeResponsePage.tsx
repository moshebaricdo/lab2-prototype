import { FreeResponseWorkspace } from "../../components/assessment/free-response";
import { progressionFreeResponse } from "../../data/progression";
import { sampleProgressionLinks } from "../levelTypeLinks";

export function ProgressionFreeResponsePage() {
  return (
    <FreeResponseWorkspace
      payload={progressionFreeResponse}
      levelLinks={sampleProgressionLinks}
      currentLevelPath="/levels/progression-free-response"
      completedLevelPaths={["/levels/progression-weblab"]}
      hideDevPanel
    />
  );
}
