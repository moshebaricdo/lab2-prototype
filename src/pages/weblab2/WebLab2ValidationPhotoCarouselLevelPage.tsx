import { useNavigate } from "react-router-dom";
import {
  validationPhotoCarouselFileStructure,
  validationPhotoCarouselInitialOpenFiles,
  validationPhotoCarouselInstructionsMarkdown,
  validationPhotoCarouselReviewConfig,
} from "../../data/weblab2/projects/validation-photo-carousel";
import { WebLab2LevelPage } from "./WebLab2LevelPage";
import {
  validationProgressionCommonProps,
  validationProgressionPaths,
} from "./webLab2ValidationProgressionCommon";

export function WebLab2ValidationPhotoCarouselLevelPage() {
  const navigate = useNavigate();

  return (
    <WebLab2LevelPage
      {...validationProgressionCommonProps}
      title="Validation Lab: Fix the Photo Carousel"
      currentLevelPath={validationProgressionPaths.photoCarousel}
      completedLevelPaths={[]}
      instructionsMarkdown={validationPhotoCarouselInstructionsMarkdown}
      fileStructureOverride={validationPhotoCarouselFileStructure}
      validationReviewConfig={validationPhotoCarouselReviewConfig}
      continueLabel="Continue"
      onContinue={() => navigate(validationProgressionPaths.loopStylePolish)}
      storageKeySuffix="validation-progression-fix-v1"
      allowTutorBuild={false}
      initialOpenFiles={validationPhotoCarouselInitialOpenFiles}
    />
  );
}
