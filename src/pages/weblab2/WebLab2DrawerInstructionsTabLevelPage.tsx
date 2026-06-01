import { WebLab2LevelPage } from "./WebLab2LevelPage";
import {
  genericLevelFileStructure,
  genericLevelInstructionsMarkdown,
} from "../../data/weblab2/projects/generic-level";
import {
  drawerImprovementsCommonProps,
  drawerImprovementsPaths,
} from "./drawerImprovementsProgressionCommon";

export function WebLab2DrawerInstructionsTabLevelPage() {
  return (
    <WebLab2LevelPage
      {...drawerImprovementsCommonProps(
        drawerImprovementsPaths.instructionsTab,
        2,
      )}
      title="Drawer improvements — Instructions tab"
      instructionsMarkdown={genericLevelInstructionsMarkdown}
      fileStructureOverride={genericLevelFileStructure}
      useFilePreview={true}
      showOnlyFilesWithContent
      tutorMode={{ kind: "functional" }}
      tutorSupportContext="curriculum-level"
      instructionsDrawerExperiment="instructions-tab-first-visit"
      continueLabel="Continue"
    />
  );
}
