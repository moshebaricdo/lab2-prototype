import { WebLab2LevelPage } from "./WebLab2LevelPage";
import {
  demoFileStructure,
  demoChatMessages,
  demoRubrics,
  DemoProjectPreview,
} from "../data/weblab2/demoProjectData";

export function WebLab2DemoProjectLevelPage() {
  return (
    <WebLab2LevelPage
      currentLevelPath="/levels/weblab2-demo-project"
      showInstructionsDrawer={false}
      fileStructureOverride={demoFileStructure}
      initialMessages={demoChatMessages}
      showRubricTab
      rubricData={demoRubrics}
      previewContent={<DemoProjectPreview />}
    />
  );
}
