import { WebLab2LevelPage } from "./WebLab2LevelPage";
import {
  genericLevelFileStructure,
  genericLevelInstructionsMarkdown,
} from "../../data/weblab2/projects/generic-level";

export function WebLab2DrawerImprovementsLevelPage() {
  return (
    <WebLab2LevelPage
      currentLevelPath="/levels/weblab2-drawer-improvements"
      title="Drawer improvements"
      instructionsMarkdown={genericLevelInstructionsMarkdown}
      fileStructureOverride={genericLevelFileStructure}
      useFilePreview={true}
      showOnlyFilesWithContent
      tutorMode={{ kind: "functional" }}
      tutorSupportContext="curriculum-level"
      continueButtonPlacement="header"
      instructionsDrawerExperiment="close-on-first-send"
      hideProgression
    />
  );
}
