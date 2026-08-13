import { WebLab2LevelPage } from "./WebLab2LevelPage";
import {
  demoFileStructure,
  demoRubrics,
} from "../../data/weblab2/projects/demo-project";

export function WebLab2DemoProjectLevelPage() {
  return (
    <WebLab2LevelPage
      currentLevelPath="/levels/weblab2-demo-project"
      showInstructionsDrawer={false}
      fileStructureOverride={demoFileStructure}
      useFilePreview={true}
      showOnlyFilesWithContent
      tutorMode={{ kind: "functional" }}
      tutorSupportContext="standalone-project"
      showRubricTab
      rubricData={demoRubrics}
      continueButtonPlacement="sidebar"
    />
  );
}
