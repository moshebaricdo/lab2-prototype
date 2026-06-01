import { WebLab2LevelPage } from "./WebLab2LevelPage";
import {
  genericLevelFileStructure,
  genericLevelInstructionsMarkdown,
} from "../../data/weblab2/projects/generic-level";

export function WebLab2GenericLevelPage() {
  return (
    <WebLab2LevelPage
      currentLevelPath="/levels/weblab2-level"
      title="Web Lab 2 Level"
      instructionsMarkdown={genericLevelInstructionsMarkdown}
      fileStructureOverride={genericLevelFileStructure}
      useFilePreview={true}
      showOnlyFilesWithContent
      tutorMode={{ kind: "functional" }}
      tutorSupportContext="curriculum-level"
      continueButtonPlacement="header"
    />
  );
}
