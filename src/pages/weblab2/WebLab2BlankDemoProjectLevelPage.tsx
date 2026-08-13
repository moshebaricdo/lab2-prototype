import { WebLab2LevelPage } from "./WebLab2LevelPage";
import { demoRubrics } from "../../data/weblab2/projects/demo-project";
import type { FileItem } from "../../types/file";

const blankDemoFileStructure: FileItem[] = [];

export function WebLab2BlankDemoProjectLevelPage() {
  return (
    <WebLab2LevelPage
      currentLevelPath="/levels/weblab2-demo-project-blank"
      showInstructionsDrawer={false}
      fileStructureOverride={blankDemoFileStructure}
      useFilePreview={true}
      showOnlyFilesWithContent
      tutorMode={{ kind: "functional" }}
      tutorSupportContext="standalone-project"
      rubricData={demoRubrics}
      continueButtonPlacement="sidebar"
      collapseSidebarByDefault={true}
      enableSidebarCollapse={true}
    />
  );
}
