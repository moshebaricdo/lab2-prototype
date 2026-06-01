import { useShareAwareNavigate } from "../../hooks/useLevelShareMode";
import { WebLab2LevelPage } from "./WebLab2LevelPage";
import {
  genericLevelFileStructure,
  genericLevelInstructionsMarkdown,
} from "../../data/weblab2/projects/generic-level";
import {
  drawerImprovementsCommonProps,
  drawerImprovementsPaths,
} from "./drawerImprovementsProgressionCommon";

export function WebLab2DrawerImprovementsLevelPage() {
  const navigate = useShareAwareNavigate();

  return (
    <WebLab2LevelPage
      {...drawerImprovementsCommonProps(
        drawerImprovementsPaths.closeOnFirstSend,
        1,
      )}
      title="Drawer improvements"
      instructionsMarkdown={genericLevelInstructionsMarkdown}
      fileStructureOverride={genericLevelFileStructure}
      useFilePreview={true}
      showOnlyFilesWithContent
      tutorMode={{ kind: "functional" }}
      tutorSupportContext="curriculum-level"
      instructionsDrawerExperiment="close-on-first-send"
      continueLabel="Continue"
      onContinue={() => navigate(drawerImprovementsPaths.instructionsTab)}
      instructionsDrawerInitialHeightRatio={0.5}
    />
  );
}
