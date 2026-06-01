import { WebLab2LevelPage } from "./WebLab2LevelPage";
import {
  genericLevelFileStructure,
  genericLevelInstructionsMarkdown,
} from "../../data/weblab2/projects/generic-level";
import {
  drawerImprovementsCommonProps,
  drawerImprovementsPaths,
} from "./drawerImprovementsProgressionCommon";

export function WebLab2DrawerNotificationHaloLevelPage() {
  return (
    <WebLab2LevelPage
      {...drawerImprovementsCommonProps(
        drawerImprovementsPaths.notificationHalo,
        3,
      )}
      title="Drawer improvements — Notification halo"
      instructionsMarkdown={genericLevelInstructionsMarkdown}
      fileStructureOverride={genericLevelFileStructure}
      useFilePreview={true}
      showOnlyFilesWithContent
      tutorMode={{ kind: "functional" }}
      tutorSupportContext="curriculum-level"
      instructionsDrawerExperiment="instructions-tab-notification-halo"
      continueLabel="Done"
    />
  );
}
