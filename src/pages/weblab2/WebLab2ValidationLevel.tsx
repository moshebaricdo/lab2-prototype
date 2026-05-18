import { WebLab2LevelPage } from "./WebLab2LevelPage";
import {
  validationTestFileStructure,
  validationTestInstructionsMarkdown,
  validationTestReviewConfig,
} from "../../data/weblab2/projects/validation-test";

export function WebLab2ValidationLevel() {
  return (
    <WebLab2LevelPage
      title="Validation Lab: Fix the Photo Carousel"
      currentLevelPath="/levels/weblab2-validation-test"
      instructionsMarkdown={validationTestInstructionsMarkdown}
      fileStructureOverride={validationTestFileStructure}
      useFilePreview={true}
      showOnlyFilesWithContent
      tutorMode={{ kind: "functional" }}
      tutorSupportContext="curriculum-level"
      validationReviewConfig={validationTestReviewConfig}
      continueButtonPlacement="header"
      storageKeySuffix="script-fixture-v2"
      instructionsDrawerInitialHeightRatio={0.5}
      enableSidebarCollapse={true}
      initialViewMode="split"
    />
  );
}
