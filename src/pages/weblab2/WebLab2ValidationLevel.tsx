import { WebLab2LevelPage } from "./WebLab2LevelPage";
import {
  validationPhotoCarouselFileStructure,
  validationPhotoCarouselInitialOpenFiles,
  validationPhotoCarouselInstructionsMarkdown,
  validationPhotoCarouselReviewConfig,
} from "../../data/weblab2/projects/validation-photo-carousel";

export function WebLab2ValidationLevel() {
  return (
    <WebLab2LevelPage
      title="Validation Lab: Fix the Photo Carousel"
      currentLevelPath="/levels/weblab2-validation-test"
      instructionsMarkdown={validationPhotoCarouselInstructionsMarkdown}
      fileStructureOverride={validationPhotoCarouselFileStructure}
      useFilePreview={true}
      showOnlyFilesWithContent
      tutorMode={{ kind: "functional" }}
      tutorSupportContext="curriculum-level"
      validationReviewConfig={validationPhotoCarouselReviewConfig}
      continueButtonPlacement="sidebar"
      storageKeySuffix="script-fixture-v2"
      instructionsDrawerInitialHeightRatio={0.5}
      enableSidebarCollapse={true}
      initialViewMode="split"
      initialOpenFiles={validationPhotoCarouselInitialOpenFiles}
      hideProgression
    />
  );
}
